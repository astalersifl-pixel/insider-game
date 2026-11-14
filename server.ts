import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GamePhase,
  GameSettings,
  Player,
  QuestionItem,
  ChatMessage,
  QuestionAnswer,
  ClientGameState,
  Role
} from './src/types/game.ts';
import { getRandomWord } from './src/utils/words.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In AI Studio, dev server must run on port 3000. On Render, process.env.PORT is provided.
const PORT = (process.env.RENDER || (process.env.NODE_ENV === 'production' && process.env.PORT && process.env.PORT !== '8080'))
  ? (Number(process.env.PORT) || 3000)
  : 3000;
const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (pathname === '/api/ws' || pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn('Gemini AI initialization skipped or failed:', e);
    return null;
  }
}

// Server-side Room Model
interface ServerRoom {
  roomCode: string;
  phase: GamePhase;
  players: Map<string, Player & { ws?: WebSocket; lastSeen: number }>;
  settings: GameSettings;
  currentMasterId: string | null;
  currentInsiderId: string | null;
  secretWord: string;
  secretCategory: string;
  secretHint: string;
  customSecretWord?: { word: string; category: string; hint: string } | null;
  guesserId: string | null;
  timeRemaining: number;
  timerInterval: NodeJS.Timeout | null;
  questions: QuestionItem[];
  chatMessages: ChatMessage[];
  winnerTeam: 'COMMONERS' | 'INSIDER' | 'TIME_OVER' | null;
  accusedPlayerId?: string | null;
  accusedVoteCount?: number;
  votes: Record<string, string>; // voterId -> targetPlayerId
  roundNumber: number;
}

const rooms = new Map<string, ServerRoom>();

// Generate 3-digit numeric room code (e.g., '382')
function generateRoomCode(): string {
  const code = Math.floor(100 + Math.random() * 900).toString();
  return rooms.has(code) ? generateRoomCode() : code;
}

function getOrCreateRoom(roomCode: string): ServerRoom {
  const code = roomCode.toUpperCase().trim();
  let room = rooms.get(code);
  if (!room) {
    room = {
      roomCode: code,
      phase: 'LOBBY',
      players: new Map(),
      settings: {
        questionTimeSeconds: 300,
        discussionTimeSeconds: 180,
        topicCategory: 'all',
        allowBots: true,
        masterSelectionMode: 'random',
        selectedMasterId: null
      },
      currentMasterId: null,
      currentInsiderId: null,
      secretWord: '',
      secretCategory: '',
      secretHint: '',
      customSecretWord: null,
      guesserId: null,
      timeRemaining: 300,
      timerInterval: null,
      questions: [],
      chatMessages: [],
      winnerTeam: null,
      accusedPlayerId: null,
      accusedVoteCount: 0,
      votes: {},
      roundNumber: 1
    };
    rooms.set(code, room);
  }
  return room;
}

// Broadcast game state to all players in a room (with secret masking)
function broadcastRoomState(room: ServerRoom) {
  const playerList = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    isReady: p.isReady,
    isBot: p.isBot,
    role: room.phase === 'RESULT' ? p.role : undefined, // only reveal all roles in RESULT phase
    hasVoted: !!room.votes[p.id],
    votedForId: room.phase === 'RESULT' ? room.votes[p.id] : undefined
  }));

  for (const [playerId, player] of room.players.entries()) {
    if (!player.ws || player.ws.readyState !== WebSocket.OPEN) continue;

    // Mask secret word according to role and phase
    let secretWordToSend: string | null = null;
    if (room.phase === 'RESULT' || room.phase === 'DISCUSSION') {
      secretWordToSend = room.secretWord;
    } else if (room.phase === 'QUESTION' || room.phase === 'ROLE_REVEAL' || room.phase === 'VOTING') {
      if (player.role === 'MASTER' || player.role === 'INSIDER') {
        secretWordToSend = room.secretWord;
      }
    }

    const clientState: ClientGameState = {
      roomCode: room.roomCode,
      phase: room.phase,
      players: playerList,
      settings: room.settings,
      myPlayerId: playerId,
      myRole: player.role || 'SPECTATOR',
      currentMasterId: room.currentMasterId,
      secretWord: secretWordToSend,
      secretCategory: room.secretCategory,
      customSecretWord: room.customSecretWord
        ? {
            word: player.isHost ? room.customSecretWord.word : '（設定済み）',
            category: room.customSecretWord.category,
            hint: room.customSecretWord.hint
          }
        : null,
      guesserId: room.guesserId,
      timeRemaining: room.timeRemaining,
      questions: room.questions,
      chatMessages: room.chatMessages.slice(-50),
      winnerTeam: room.winnerTeam,
      accusedPlayerId: room.accusedPlayerId,
      accusedVoteCount: room.accusedVoteCount,
      votes: room.phase === 'RESULT' ? room.votes : null,
      roundNumber: room.roundNumber
    };

    try {
      player.ws.send(JSON.stringify({ type: 'GAME_STATE', state: clientState }));
    } catch (err) {
      console.error(`Error sending state to ${playerId}:`, err);
    }
  }
}

// Stop any running timer for a room
function stopRoomTimer(room: ServerRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

// Start question phase countdown
function startQuestionTimer(room: ServerRoom) {
  stopRoomTimer(room);
  room.timeRemaining = room.settings.questionTimeSeconds;

  room.timerInterval = setInterval(() => {
    room.timeRemaining -= 1;

    // Simulated bot participation if bots are present
    simulateBotQuestion(room);

    if (room.timeRemaining <= 0) {
      stopRoomTimer(room);
      // Time is up! No one guessed the secret word -> All players lose!
      room.phase = 'RESULT';
      room.winnerTeam = 'TIME_OVER';
      addSystemChat(room, '⏰ 制限時間切れ！お題にたどり着けなかったため全員の敗北です。');
      broadcastRoomState(room);
    } else {
      // Send tick every second
      broadcastRoomState(room);
    }
  }, 1000);
}

// Start discussion phase countdown
function startDiscussionTimer(room: ServerRoom) {
  stopRoomTimer(room);
  room.timeRemaining = room.settings.discussionTimeSeconds;

  room.timerInterval = setInterval(() => {
    room.timeRemaining -= 1;

    if (room.timeRemaining <= 0) {
      stopRoomTimer(room);
      // Discussion ended, proceed to voting
      room.phase = 'VOTING';
      room.votes = {};
      addSystemChat(room, '🗳️ 議論時間が終了しました。インサイダーだと思う人に投票してください！');
      broadcastRoomState(room);
    } else {
      broadcastRoomState(room);
    }
  }, 1000);
}

function addSystemChat(room: ServerRoom, text: string) {
  const msg: ChatMessage = {
    id: 'sys_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    senderId: 'SYSTEM',
    senderName: 'SYSTEM',
    senderAvatar: '📢',
    text,
    timestamp: Date.now(),
    isSystem: true
  };
  room.chatMessages.push(msg);
}

// Optional bot behavior to make testing single-player or 2-player fun
const BOT_QUESTIONS = [
  'それは食べ物ですか？',
  'それは人間が作ったものですか？',
  'それは家の中にありますか？',
  'それは手で持てる重さですか？',
  'それは電気で動きますか？',
  'それはお店で売っていますか？',
  'それは大人も子供も使いますか？',
  'それは学校にありますか？',
  'それは生き物ですか？'
];

function simulateBotQuestion(room: ServerRoom) {
  if (room.phase !== 'QUESTION') return;
  // 15% chance per 3 seconds for a bot to ask a question if no question is pending
  if (Math.random() > 0.08) return;

  const bots = Array.from(room.players.values()).filter(p => p.isBot && p.role !== 'MASTER');
  if (bots.length === 0) return;

  const randomBot = bots[Math.floor(Math.random() * bots.length)];
  const qText = BOT_QUESTIONS[Math.floor(Math.random() * BOT_QUESTIONS.length)];

  const newQ: QuestionItem = {
    id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    playerId: randomBot.id,
    playerName: randomBot.name,
    playerAvatar: randomBot.avatar,
    questionText: qText,
    timestamp: Date.now()
  };

  room.questions.push(newQ);
  addSystemChat(room, `💬 ${randomBot.name}: 「${qText}」`);
}

// Start Game flow
function startGameRound(room: ServerRoom) {
  stopRoomTimer(room);

  const playerArray = Array.from(room.players.values());
  if (playerArray.length < 3) {
    addSystemChat(room, '⚠️ ゲームを開始するには最低3人のプレイヤー（またはBot）が必要です。');
    broadcastRoomState(room);
    return;
  }

  // Pick Master (manual selection or random)
  const humanPlayers = playerArray.filter(p => !p.isBot);
  const masterCandidates = humanPlayers.length > 0 ? humanPlayers : playerArray;
  let master: (Player & { ws?: WebSocket; lastSeen: number }) | undefined;

  if (
    room.settings.masterSelectionMode === 'manual' &&
    room.settings.selectedMasterId &&
    room.players.has(room.settings.selectedMasterId)
  ) {
    master = room.players.get(room.settings.selectedMasterId);
  }

  if (!master) {
    master = masterCandidates[Math.floor(Math.random() * masterCandidates.length)];
  }
  room.currentMasterId = master.id;

  // Pick Insider from remaining players
  const nonMasterPlayers = playerArray.filter(p => p.id !== master.id);
  const insider = nonMasterPlayers[Math.floor(Math.random() * nonMasterPlayers.length)];
  room.currentInsiderId = insider.id;

  // Assign roles
  for (const p of playerArray) {
    if (p.id === master.id) {
      p.role = 'MASTER';
    } else if (p.id === insider.id) {
      p.role = 'INSIDER';
    } else {
      p.role = 'COMMONER';
    }
    p.isReady = p.isBot ? true : false;
  }

  // Select secret word (custom AI/manual word if set, or random from category)
  if (room.customSecretWord) {
    room.secretWord = room.customSecretWord.word;
    room.secretCategory = room.customSecretWord.category;
    room.secretHint = room.customSecretWord.hint;
    room.customSecretWord = null; // consumed for this round
  } else {
    const wordItem = getRandomWord(room.settings.topicCategory);
    room.secretWord = wordItem.word;
    room.secretCategory = wordItem.category;
    room.secretHint = wordItem.hint;
  }

  // Reset round data
  room.questions = [];
  room.guesserId = null;
  room.votes = {};
  room.winnerTeam = null;
  room.accusedPlayerId = null;
  room.accusedVoteCount = 0;
  room.phase = 'ROLE_REVEAL';

  addSystemChat(room, `🎮 ラウンド ${room.roundNumber} が開始されました！役職とお題を確認してください。`);
  broadcastRoomState(room);
}

// Calculate victory result after voting
function evaluateVotingResult(room: ServerRoom) {
  stopRoomTimer(room);

  const voteCounts: Record<string, number> = {};
  for (const votedId of Object.values(room.votes)) {
    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
  }

  // Find player with highest votes
  let highestVoteCount = -1;
  let accusedPlayerId: string | null = null;
  let isTie = false;

  for (const [pId, count] of Object.entries(voteCounts)) {
    if (count > highestVoteCount) {
      highestVoteCount = count;
      accusedPlayerId = pId;
      isTie = false;
    } else if (count === highestVoteCount) {
      isTie = true;
    }
  }

  room.phase = 'RESULT';
  room.accusedPlayerId = accusedPlayerId;
  room.accusedVoteCount = highestVoteCount > 0 ? highestVoteCount : 0;

  // Rule:
  // If accused is the Insider -> Commoners & Master win!
  // If accused is NOT the Insider (or tied) -> Insider wins!
  if (!isTie && accusedPlayerId === room.currentInsiderId) {
    room.winnerTeam = 'COMMONERS';
    addSystemChat(room, `🎉 インサイダー（${room.players.get(room.currentInsiderId || '')?.name || '内通者'}）が見破られました！【庶民 & マスターの勝利】`);
  } else {
    room.winnerTeam = 'INSIDER';
    const insiderPlayer = room.players.get(room.currentInsiderId || '');
    addSystemChat(room, `🤫 インサイダー（${insiderPlayer?.name || '内通者'}）は正体を隠し通しました！【インサイダーの単独勝利】`);
  }

  broadcastRoomState(room);
}

// WebSocket connection lifecycle
wss.on('connection', (ws: WebSocket) => {
  let boundRoomCode: string | null = null;
  let boundPlayerId: string | null = null;

  ws.on('message', (messageData: string) => {
    try {
      const data = JSON.parse(messageData.toString());

      switch (data.type) {
        case 'JOIN_ROOM': {
          const { roomCode, playerName, avatar, playerId } = data;
          const room = getOrCreateRoom(roomCode);
          boundRoomCode = room.roomCode;
          const assignedId: string = playerId || 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          boundPlayerId = assignedId;

          const isFirstPlayer = room.players.size === 0;
          let player = room.players.get(assignedId);

          if (player) {
            // Reconnecting player: restore socket and mark online
            const wasDisconnected = !player.ws;
            player.ws = ws;
            player.name = playerName || player.name;
            player.avatar = avatar || player.avatar;
            player.lastSeen = Date.now();
            if (wasDisconnected) {
              addSystemChat(room, `🔄 ${player.name} が再接続しました。`);
            }
          } else {
            // New player
            player = {
              id: assignedId,
              name: (playerName || 'プレイヤー').trim().slice(0, 15),
              avatar: avatar || '🐱',
              isHost: isFirstPlayer,
              isReady: false,
              score: 0,
              ws,
              lastSeen: Date.now()
            };
            room.players.set(assignedId, player);
            addSystemChat(room, `👋 ${player.name} が参加しました。`);
          }

          broadcastRoomState(room);
          break;
        }

        case 'UPDATE_SETTINGS': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || (room.phase !== 'LOBBY' && room.phase !== 'RESULT')) return;
          const sender = room.players.get(boundPlayerId);
          if (!sender?.isHost) return;
          if (data.settings) {
            room.settings = { ...room.settings, ...data.settings };
            broadcastRoomState(room);
          }
          break;
        }

        case 'TOGGLE_READY': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;
          const player = room.players.get(boundPlayerId);
          if (!player) return;

          player.isReady = !player.isReady;
          broadcastRoomState(room);
          break;
        }

        case 'ADD_BOT': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;
          const botCount = Array.from(room.players.values()).filter(p => p.isBot).length;
          if (botCount >= 6) return;

          const botAvatars = ['🤖', '🦊', '🐼', '🐰', '🐯', '🐧', '🦉'];
          const botNames = ['ボット太郎', 'AIアリス', 'ロボ次郎', 'ボット三郎', 'メカポチ', 'デジタル四郎'];

          const botId = 'bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
          const botPlayer: Player & { ws?: WebSocket; lastSeen: number } = {
            id: botId,
            name: botNames[botCount % botNames.length],
            avatar: botAvatars[botCount % botAvatars.length],
            isHost: false,
            isReady: true,
            isBot: true,
            score: 0,
            lastSeen: Date.now()
          };
          room.players.set(botId, botPlayer);
          addSystemChat(room, `🤖 ${botPlayer.name} を参加させました。`);
          broadcastRoomState(room);
          break;
        }

        case 'REMOVE_BOT': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;
          const targetBotId = data.botId;
          if (targetBotId && room.players.has(targetBotId)) {
            const bot = room.players.get(targetBotId);
            room.players.delete(targetBotId);
            addSystemChat(room, `🤖 ${bot?.name || 'Bot'} を退出させました。`);
            broadcastRoomState(room);
          }
          break;
        }

        case 'START_GAME': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;
          startGameRound(room);
          break;
        }

        case 'CONFIRM_REVEAL': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'ROLE_REVEAL') return;

          const player = room.players.get(boundPlayerId);
          if (player) player.isReady = true;

          // Check if all players (or host override) are ready
          const allReady = Array.from(room.players.values()).every(p => p.isReady);
          if (allReady) {
            room.phase = 'QUESTION';
            addSystemChat(room, `❓ 質問フェーズが始まりました！マスターに質問してお題を突き止めましょう（制限時間: ${room.settings.questionTimeSeconds}秒）`);
            startQuestionTimer(room);
          }
          broadcastRoomState(room);
          break;
        }

        case 'FORCE_START_QUESTIONS': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'ROLE_REVEAL') return;
          room.phase = 'QUESTION';
          addSystemChat(room, `❓ 質問フェーズが始まりました！マスターに質問してお題を突き止めましょう（制限時間: ${room.settings.questionTimeSeconds}秒）`);
          startQuestionTimer(room);
          broadcastRoomState(room);
          break;
        }

        case 'SUBMIT_QUESTION': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'QUESTION') return;

          const player = room.players.get(boundPlayerId);
          if (!player) return;

          const text = (data.questionText || '').trim();
          if (!text) return;

          const questionItem: QuestionItem = {
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar,
            questionText: text,
            timestamp: Date.now()
          };

          room.questions.push(questionItem);
          broadcastRoomState(room);
          break;
        }

        case 'ANSWER_QUESTION': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'QUESTION') return;

          // Only Master can answer questions
          if (room.currentMasterId !== boundPlayerId) return;

          const { questionId, answer } = data as { questionId: string; answer: QuestionAnswer };
          const targetQ = room.questions.find(q => q.id === questionId);
          if (!targetQ) return;

          targetQ.answer = answer;

          if (answer === 'CORRECT') {
            targetQ.isGuesser = true;
            room.guesserId = targetQ.playerId;
            stopRoomTimer(room);
            room.phase = 'DISCUSSION';
            addSystemChat(room, `🎉 マスターが正解と判定しました！正解者は【${targetQ.playerName}】さんです！お題は「${room.secretWord}」でした！`);
            addSystemChat(room, `🕵️‍♂️ これより議論タイムです！誰がインサイダーか怪しい発言・誘導を見極めましょう。`);
            startDiscussionTimer(room);
          }

          broadcastRoomState(room);
          break;
        }

        case 'DIRECT_GUESS': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'QUESTION') return;

          const player = room.players.get(boundPlayerId);
          if (!player) return;

          const guess = (data.guessText || '').trim();
          if (!guess) return;

          const isExactMatch = guess.toLowerCase() === room.secretWord.toLowerCase();

          const questionItem: QuestionItem = {
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            playerId: player.id,
            playerName: player.name,
            playerAvatar: player.avatar,
            questionText: `🎯 お題コール：「${guess}」ですか？${isExactMatch ? '（※お題と完全一致）' : ''}`,
            answer: undefined, // Master will judge!
            isCall: true,
            timestamp: Date.now()
          };

          room.questions.push(questionItem);
          addSystemChat(room, `🎯 ${player.name} がお題コール「${guess}」を宣言しました！マスターは判定してください。`);
          broadcastRoomState(room);
          break;
        }

        case 'SET_CUSTOM_WORD': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;

          const { word, category, hint } = data;
          if (word && typeof word === 'string' && word.trim()) {
            room.customSecretWord = {
              word: word.trim(),
              category: (category || 'カスタム').trim(),
              hint: (hint || '').trim()
            };
            addSystemChat(room, `🎯 次の試合のお題「${word.trim()}」が予約されました（ゲーム開始まで秘密です）。`);
          } else {
            room.customSecretWord = null;
            addSystemChat(room, `🎲 お題を通常プールからのランダム設定に戻しました。`);
          }
          broadcastRoomState(room);
          break;
        }

        case 'START_VOTING': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'DISCUSSION') return;

          stopRoomTimer(room);
          room.phase = 'VOTING';
          room.votes = {};

          // Simulate bot votes if any
          for (const bot of room.players.values()) {
            if (bot.isBot) {
              const eligibleTargets = Array.from(room.players.values()).filter(p => p.id !== bot.id && p.role !== 'MASTER');
              if (eligibleTargets.length > 0) {
                const randomTarget = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
                room.votes[bot.id] = randomTarget.id;
              }
            }
          }

          addSystemChat(room, '🗳️ 投票が開始されました！インサイダーだと思う人を1人選んで投票してください。');
          broadcastRoomState(room);
          break;
        }

        case 'SUBMIT_VOTE': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room || room.phase !== 'VOTING') return;

          const targetPlayerId = data.targetPlayerId;
          if (!targetPlayerId || !room.players.has(targetPlayerId)) return;

          room.votes[boundPlayerId] = targetPlayerId;

          // Check if all active non-bot human players have voted
          const allHumansVoted = Array.from(room.players.values())
            .filter(p => !p.isBot)
            .every(p => !!room.votes[p.id]);

          if (allHumansVoted) {
            evaluateVotingResult(room);
          } else {
            broadcastRoomState(room);
          }
          break;
        }

        case 'NEXT_ROUND': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;
          room.roundNumber += 1;
          startGameRound(room);
          break;
        }

        case 'BACK_TO_LOBBY': {
          if (!boundRoomCode) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;
          stopRoomTimer(room);
          room.phase = 'LOBBY';
          for (const p of room.players.values()) {
            p.role = undefined;
            p.isReady = false;
          }
          room.questions = [];
          room.votes = {};
          room.winnerTeam = null;
          addSystemChat(room, '🏠 ロビーに戻りました。');
          broadcastRoomState(room);
          break;
        }

        case 'SEND_CHAT': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          if (!room) return;
          const player = room.players.get(boundPlayerId);
          if (!player) return;

          const text = (data.text || '').trim();
          if (!text) return;

          const chat: ChatMessage = {
            id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            senderId: player.id,
            senderName: player.name,
            senderAvatar: player.avatar,
            text,
            timestamp: Date.now()
          };
          room.chatMessages.push(chat);
          broadcastRoomState(room);
          break;
        }

        case 'LEAVE_ROOM': {
          if (!boundRoomCode || !boundPlayerId) return;
          const room = rooms.get(boundRoomCode);
          const leavingId = boundPlayerId;
          boundRoomCode = null;
          boundPlayerId = null;

          if (room) {
            const leavingPlayer = room.players.get(leavingId);
            room.players.delete(leavingId);

            if (room.settings.selectedMasterId === leavingId) {
              room.settings.selectedMasterId = null;
            }

            const remainingHumans = Array.from(room.players.values()).filter(p => !p.isBot);
            if (remainingHumans.length === 0) {
              stopRoomTimer(room);
              rooms.delete(room.roomCode);
            } else {
              if (leavingPlayer?.isHost) {
                remainingHumans[0].isHost = true;
                addSystemChat(room, `👑 ${remainingHumans[0].name} が新しいホストになりました。`);
              }
              if (leavingPlayer) {
                addSystemChat(room, `👋 ${leavingPlayer.name} が退出しました。`);
              }
              broadcastRoomState(room);
            }
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (boundRoomCode && boundPlayerId) {
      const room = rooms.get(boundRoomCode);
      if (room) {
        const player = room.players.get(boundPlayerId);
        if (player) {
          player.ws = undefined;
          player.lastSeen = Date.now();
          // Preserve player slot so they can reconnect/resume seamlessly even if mobile screen locks
          broadcastRoomState(room);
        }
      }
    }
  });
});

// Fallback themes when Gemini API is unavailable
const THEME_FALLBACKS: Record<string, Array<{ word: string; category: string; hint: string; difficulty: 'easy' | 'normal' | 'hard' }>> = {
  'アニメ': [
    { word: 'ドラえもん', category: 'アニメ・キャラクター', hint: '未来から来たネコ型ロボット', difficulty: 'easy' },
    { word: 'ピカチュウ', category: 'アニメ・ゲーム', hint: '黄色い電気ネズミ', difficulty: 'easy' },
    { word: 'トトロ', category: 'アニメ・映画', hint: '森の主、大きな体の生き物', difficulty: 'easy' },
    { word: 'ガンダム', category: 'アニメ・ロボット', hint: '白い人型モビルスーツ', difficulty: 'normal' },
    { word: '孫悟空', category: 'アニメ・漫画', hint: 'かめはめ波を放つサイヤ人', difficulty: 'easy' }
  ],
  '学校': [
    { word: '黒板消し', category: '学校・文房具', hint: 'チョークの粉を拭き取る道具', difficulty: 'easy' },
    { word: 'ランドセル', category: '学校・鞄', hint: '小学生が背負う四角い鞄', difficulty: 'easy' },
    { word: '顕微鏡', category: '学校・理科', hint: '微小な世界を拡大して観察する', difficulty: 'normal' },
    { word: '給食', category: '学校・食事', hint: 'クラスみんなで食べるお昼ご飯', difficulty: 'easy' },
    { word: '体育館', category: '学校・施設', hint: '屋内で集会や球技を行う場所', difficulty: 'easy' }
  ],
  '食べ物': [
    { word: 'オムライス', category: '食べ物・洋食', hint: 'チキンライスを黄色い卵で包んだ料理', difficulty: 'easy' },
    { word: 'たこ焼き', category: '食べ物・粉物', hint: '丸い生地にタコが入った大阪名物', difficulty: 'easy' },
    { word: 'ソフトクリーム', category: 'スイーツ', hint: 'コーンに乗った冷たい渦巻き', difficulty: 'easy' },
    { word: 'ピザ', category: '食べ物・イタリアン', hint: '丸い生地にチーズをのせて焼いた料理', difficulty: 'easy' },
    { word: 'メロンパン', category: '食べ物・パン', hint: '格子状の模様がある甘いパン', difficulty: 'easy' }
  ],
  'ゲーム': [
    { word: 'マリオ', category: 'ゲーム・キャラクター', hint: '赤い帽子とヒゲの配管工', difficulty: 'easy' },
    { word: 'コントローラー', category: 'ゲーム・周辺機器', hint: 'ゲームを操作するための手持ち機器', difficulty: 'easy' },
    { word: 'モンスターボール', category: 'ゲーム・アイテム', hint: '赤と白の球体でモンスターを捕まえる', difficulty: 'easy' },
    { word: 'テトリス', category: 'ゲーム・パズル', hint: 'ブロックを敷き詰めて消す名作パズル', difficulty: 'easy' },
    { word: 'スライム', category: 'ゲーム・モンスター', hint: '水滴型でぷるぷるしたモンスター', difficulty: 'easy' }
  ]
};

// API endpoint for AI topic generation (with robust fallback)
app.post('/api/ai/generate-words', async (req, res) => {
  const { theme = '日常の面白い物' } = req.body;

  // Try real Gemini API if API key is available
  const aiClient = await getAiClient();
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `あなたはボードゲーム「インサイダーゲーム」のお題作成の達人です。
テーマ「${theme}」に沿った、インサイダーゲームに最適な日本語のお題を5個作成してください。
質問（「はい/いいえ」で答えられる）を繰り返すことで徐々に絞り込める、有名かつ少しひねりのある単語がベストです。
JSON配列形式のみで返してください。マークダウン装飾なし。
例: [{"word":"目覚まし時計","category":"日用品","hint":"朝起きるための道具","difficulty":"easy"}]`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ words: parsed, source: 'gemini' });
      }
    } catch (geminiErr) {
      console.warn('Gemini generateContent error, using smart fallback:', geminiErr);
    }
  }

  // Fallback: match theme keywords or select 5 smart theme words
  const themeLower = theme.toLowerCase();
  const matchedKey = Object.keys(THEME_FALLBACKS).find(k => themeLower.includes(k.toLowerCase()));
  let words = matchedKey ? THEME_FALLBACKS[matchedKey] : null;

  if (!words) {
    // Generate 5 themed words using curated bank with the requested theme
    words = [
      { word: `${theme}の代表例`, category: theme, hint: `${theme}といえば誰もが思い浮かべる定番`, difficulty: 'easy' },
      { word: 'スマートフォン', category: '電子機器・日用品', hint: '現代人の必需品', difficulty: 'easy' },
      { word: '富士山', category: '名所・自然', hint: '日本一高い山', difficulty: 'easy' },
      { word: 'タイムカプセル', category: '記念・思い出', hint: '未来に向けて埋める箱', difficulty: 'normal' },
      { word: '万華鏡', category: '道具・雑貨', hint: '覗くと幾何学模様が美しく変わる', difficulty: 'normal' }
    ];
  }

  return res.json({ words, source: 'fallback' });
});

// Mount Vite or static files
if (process.env.NODE_ENV !== 'production') {
  let viteMiddlewares: express.RequestHandler | null = null;
  const viteReadyPromise = (async () => {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
          watch: process.env.DISABLE_HMR === 'true' ? null : {},
        },
        appType: 'spa',
      });
      viteMiddlewares = vite.middlewares;
    } catch (err) {
      console.error('Failed to initialize Vite dev middleware:', err);
    }
  })();

  app.use(async (req, res, next) => {
    if (!viteMiddlewares) {
      await viteReadyPromise;
    }
    if (viteMiddlewares) {
      return viteMiddlewares(req, res, next);
    }
    next();
  });
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Insider Game server listening on http://0.0.0.0:${PORT}`);
});
