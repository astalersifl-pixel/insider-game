export type Role = 'MASTER' | 'INSIDER' | 'COMMONER' | 'SPECTATOR';

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'QUESTION'
  | 'DISCUSSION'
  | 'VOTING'
  | 'RESULT';

export interface Player {
  id: string;
  name: string;
  avatar: string; // emoji or color
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  role?: Role;
  hasVoted?: boolean;
  votedForId?: string; // only revealed at result
  score?: number;
}

export type QuestionAnswer = 'YES' | 'NO' | 'UNKNOWN' | 'CLOSE' | 'CORRECT';

export interface QuestionItem {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  questionText: string;
  answer?: QuestionAnswer;
  timestamp: number;
  isGuesser?: boolean; // if this was the correct guess
  isCall?: boolean; // if this was a direct word guess attempt
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GameSettings {
  questionTimeSeconds: number; // default: 300 (5 min)
  discussionTimeSeconds: number; // default: 180 (3 min)
  topicCategory: string; // 'all' | 'easy' | 'normal' | 'hard' | 'custom'
  allowBots: boolean;
}

export interface CustomWordData {
  word: string;
  category: string;
  hint: string;
}

export interface RoomState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  currentMasterId: string | null;
  currentInsiderId: string | null;
  secretWord: string;
  secretCategory: string;
  secretHint?: string;
  customSecretWord?: CustomWordData | null;
  guesserId: string | null;
  timeRemaining: number;
  questions: QuestionItem[];
  chatMessages: ChatMessage[];
  winnerTeam: 'COMMONERS' | 'INSIDER' | 'TIME_OVER' | null;
  accusedPlayerId?: string | null;
  accusedVoteCount?: number;
  votes: Record<string, string>; // voterId -> targetPlayerId
  roundNumber: number;
}

// Client-view state (where secret word and roles may be masked based on playerId)
export interface ClientGameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  myPlayerId: string;
  myRole: Role;
  currentMasterId: string | null;
  secretWord: string | null; // null for Commoners during question phase
  secretCategory: string;
  customSecretWord?: CustomWordData | null;
  guesserId: string | null;
  timeRemaining: number;
  questions: QuestionItem[];
  chatMessages: ChatMessage[];
  winnerTeam: 'COMMONERS' | 'INSIDER' | 'TIME_OVER' | null;
  accusedPlayerId?: string | null;
  accusedVoteCount?: number;
  votes: Record<string, string> | null; // only visible in result
  roundNumber: number;
}
