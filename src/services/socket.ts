import { ClientGameState, GameSettings, QuestionAnswer } from '../types/game.ts';

type StateListener = (state: ClientGameState) => void;
type StatusListener = (status: 'connecting' | 'connected' | 'disconnected') => void;

class SocketService {
  private ws: WebSocket | null = null;
  private stateListeners: Set<StateListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  public currentState: ClientGameState | null = null;
  public connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

  private lastJoinParams: {
    roomCode: string;
    playerName: string;
    avatar: string;
    playerId: string;
  } | null = null;

  constructor() {
    // Save/retrieve player ID from localStorage for seamless reconnections
    if (typeof window !== 'undefined') {
      let savedId = localStorage.getItem('insider_player_id');
      if (!savedId) {
        savedId = 'p_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('insider_player_id', savedId);
      }
      const savedRoom = localStorage.getItem('insider_last_room');
      const savedName = localStorage.getItem('insider_player_name');
      const savedAvatar = localStorage.getItem('insider_player_avatar');
      if (savedRoom && savedName && savedAvatar) {
        this.lastJoinParams = {
          roomCode: savedRoom,
          playerName: savedName,
          avatar: savedAvatar,
          playerId: savedId
        };
      }
    }
  }

  public getLastRoomCode(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('insider_last_room');
  }

  public leaveRoom(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('insider_last_room');
    }
    this.lastJoinParams = null;
    this.currentState = null;
    this.notifyStateListeners(null as unknown as ClientGameState);
  }

  public reconnect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.connect();
  }

  public getPlayerId(): string {
    if (typeof window === 'undefined') return 'p_temp';
    let id = localStorage.getItem('insider_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('insider_player_id', id);
    }
    return id;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Rejoin if we had previous room info
        if (this.lastJoinParams) {
          this.send({
            type: 'JOIN_ROOM',
            ...this.lastJoinParams
          });
        }

        // Setup ping keepalive
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'GAME_STATE') {
            this.currentState = data.state;
            this.notifyStateListeners(data.state);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.cleanupPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('WebSocket initialization error:', e);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 2500);
    }
  }

  private cleanupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private setStatus(status: 'connecting' | 'connected' | 'disconnected') {
    this.connectionStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private send(payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('Socket not open, message queued or dropped:', payload.type);
    }
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    if (this.currentState) {
      listener(this.currentState);
    }
    return () => this.stateListeners.delete(listener);
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStateListeners(state: ClientGameState) {
    this.stateListeners.forEach((listener) => listener(state));
  }

  // --- Actions ---

  public joinRoom(roomCode: string, playerName: string, avatar: string) {
    const playerId = this.getPlayerId();
    this.lastJoinParams = { roomCode, playerName, avatar, playerId };
    if (typeof window !== 'undefined') {
      localStorage.setItem('insider_last_room', roomCode);
      localStorage.setItem('insider_player_name', playerName);
      localStorage.setItem('insider_player_avatar', avatar);
    }
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      this.send({
        type: 'JOIN_ROOM',
        roomCode,
        playerName,
        avatar,
        playerId
      });
    }
  }

  public updateSettings(settings: Partial<GameSettings>) {
    this.send({ type: 'UPDATE_SETTINGS', settings });
  }

  public toggleReady() {
    this.send({ type: 'TOGGLE_READY' });
  }

  public addBot() {
    this.send({ type: 'ADD_BOT' });
  }

  public removeBot(botId: string) {
    this.send({ type: 'REMOVE_BOT', botId });
  }

  public startGame() {
    this.send({ type: 'START_GAME' });
  }

  public confirmReveal() {
    this.send({ type: 'CONFIRM_REVEAL' });
  }

  public forceStartQuestions() {
    this.send({ type: 'FORCE_START_QUESTIONS' });
  }

  public submitQuestion(questionText: string) {
    this.send({ type: 'SUBMIT_QUESTION', questionText });
  }

  public answerQuestion(questionId: string, answer: QuestionAnswer) {
    this.send({ type: 'ANSWER_QUESTION', questionId, answer });
  }

  public directGuess(guessText: string) {
    this.send({ type: 'DIRECT_GUESS', guessText });
  }

  public startVoting() {
    this.send({ type: 'START_VOTING' });
  }

  public submitVote(targetPlayerId: string) {
    this.send({ type: 'SUBMIT_VOTE', targetPlayerId });
  }

  public nextRound() {
    this.send({ type: 'NEXT_ROUND' });
  }

  public backToLobby() {
    this.send({ type: 'BACK_TO_LOBBY' });
  }

  public sendChat(text: string) {
    this.send({ type: 'SEND_CHAT', text });
  }
}

export const socketService = new SocketService();
