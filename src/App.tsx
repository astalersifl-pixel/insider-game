import React, { useState, useEffect } from 'react';
import {
  Eye,
  Users,
  Sparkles,
  HelpCircle,
  Plus,
  LogIn,
  Bot,
  Flame,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { ClientGameState } from './types/game.ts';
import { socketService } from './services/socket.ts';
import { Header } from './components/Header.tsx';
import { LobbyPhase } from './components/LobbyPhase.tsx';
import { RevealPhase } from './components/RevealPhase.tsx';
import { QuestionPhase } from './components/QuestionPhase.tsx';
import { DiscussionPhase } from './components/DiscussionPhase.tsx';
import { VotingPhase } from './components/VotingPhase.tsx';
import { ResultPhase } from './components/ResultPhase.tsx';
import { HowToPlayModal } from './components/HowToPlayModal.tsx';
import { soundEffects } from './utils/audio.ts';

const AVATARS = ['🐱', '🦊', '🐼', '🦁', '🐰', '🐶', '🦄', '🐯', '🐸', '🐙', '🐧', '🐻'];

export default function App() {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Lobby Entry Form State
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('insider_player_name') || 'プレイヤー' + Math.floor(Math.random() * 900 + 100);
  });
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return localStorage.getItem('insider_player_avatar') || AVATARS[Math.floor(Math.random() * AVATARS.length)];
  });
  const [inputRoomCode, setInputRoomCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (params.get('room') || '').replace(/[^0-9]/g, '').slice(0, 3);
    }
    return '';
  });

  useEffect(() => {
    // Subscribe to socket state & status
    const unsubState = socketService.subscribeState((state) => {
      setGameState(state);
    });
    const unsubStatus = socketService.subscribeStatus((status) => {
      setConnectionStatus(status);
    });

    // Auto-join if room param in URL exists
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room')?.replace(/[^0-9]/g, '').slice(0, 3);
    if (roomFromUrl && roomFromUrl.length === 3) {
      socketService.joinRoom(roomFromUrl, playerName, selectedAvatar);
    }

    return () => {
      unsubState();
      unsubStatus();
    };
  }, []);

  const handleSaveProfile = (name: string, avatar: string) => {
    setPlayerName(name);
    setSelectedAvatar(avatar);
    localStorage.setItem('insider_player_name', name);
    localStorage.setItem('insider_player_avatar', avatar);
  };

  const handleCreateRoom = () => {
    soundEffects.click();
    // Generate a 3-digit numeric room code (100 - 999)
    const code = Math.floor(100 + Math.random() * 900).toString();
    handleSaveProfile(playerName, selectedAvatar);
    socketService.joinRoom(code, playerName, selectedAvatar);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputRoomCode.replace(/[^0-9]/g, '').slice(0, 3);
    if (cleanCode.length !== 3) return;
    soundEffects.click();
    handleSaveProfile(playerName, selectedAvatar);
    socketService.joinRoom(cleanCode, playerName, selectedAvatar);
  };

  const handleInstantSoloTest = () => {
    soundEffects.click();
    const code = Math.floor(100 + Math.random() * 900).toString();
    handleSaveProfile(playerName, selectedAvatar);
    socketService.joinRoom(code, playerName, selectedAvatar);

    // Auto-add 2 bots after brief delay so developer/tester can immediately hit start game
    setTimeout(() => {
      socketService.addBot();
      setTimeout(() => {
        socketService.addBot();
      }, 300);
    }, 600);
  };

  // If not yet joined a room, render the Welcome / Room Join screen
  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
        <Header
          roomCode=""
          connectionStatus={connectionStatus}
          onOpenRules={() => setIsRulesOpen(true)}
        />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Title / Hero */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center mx-auto shadow-xl shadow-purple-600/30">
                <Eye className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                インサイダー・ゲーム
              </h2>
              <p className="text-xs text-slate-400">
                お題を知る「内通者」を見破る、オンライン心理クイズゲーム
              </p>
            </div>

            {/* Profile Setup: Name & Avatar */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">あなたの名前</label>
                <input
                  type="text"
                  value={playerName}
                  maxLength={15}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="プレイヤー名を入力"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">アバター</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        soundEffects.click();
                        setSelectedAvatar(emoji);
                      }}
                      className={`h-10 text-xl rounded-xl border flex items-center justify-center transition ${
                        selectedAvatar === emoji
                          ? 'bg-purple-600/30 border-purple-500 shadow-sm scale-105'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Re-enter Previous Room Button if available */}
            {socketService.getLastRoomCode() && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/40 flex items-center justify-between gap-3 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">直前の部屋</div>
                    <div className="text-xs font-bold text-white">
                      ルーム【{socketService.getLastRoomCode()}】に再入室
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const lastCode = socketService.getLastRoomCode();
                    if (lastCode) {
                      soundEffects.click();
                      handleSaveProfile(playerName, selectedAvatar);
                      socketService.joinRoom(lastCode, playerName, selectedAvatar);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition cursor-pointer"
                >
                  再入室する
                </button>
              </div>
            )}

            {/* Actions: Create or Join */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCreateRoom}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新しい部屋を作成してホストになる</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-xs font-medium">または</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Join Form */}
              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inputRoomCode}
                  maxLength={3}
                  onChange={(e) => setInputRoomCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder="3桁の数字 (例: 123)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-base text-center font-mono font-bold tracking-widest text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={inputRoomCode.length !== 3}
                  className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm border border-purple-500/30 disabled:border-slate-700 transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-purple-600/20 disabled:shadow-none"
                >
                  <LogIn className="w-4 h-4" />
                  <span>参加</span>
                </button>
              </form>
            </div>

            {/* Instant Solo / Test Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleInstantSoloTest}
                className="w-full py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>1人ですぐテスト（Bot自動追加部屋を作成）</span>
              </button>
            </div>
          </div>
        </main>

        <HowToPlayModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </div>
    );
  }

  // When inside a room, render header and active phase component
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      <Header
        roomCode={gameState.roomCode}
        connectionStatus={connectionStatus}
        onOpenRules={() => setIsRulesOpen(true)}
        onLeaveRoom={() => {
          socketService.leaveRoom();
          setGameState(null);
        }}
      />

      {/* Disconnection Sticky Banner */}
      {connectionStatus !== 'connected' && (
        <div className="bg-rose-950/95 border-b border-rose-500/40 px-4 py-2.5 text-xs text-rose-200 flex items-center justify-between sticky top-[57px] z-30 shadow-md">
          <span className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
            通信が切断されました（ネットワーク一時切断など。自動再接続中...）
          </span>
          <button
            onClick={() => {
              soundEffects.click();
              socketService.reconnect();
            }}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
          >
            今すぐ再接続
          </button>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
        {gameState.phase === 'LOBBY' && <LobbyPhase state={gameState} />}
        {gameState.phase === 'ROLE_REVEAL' && <RevealPhase state={gameState} />}
        {gameState.phase === 'QUESTION' && <QuestionPhase state={gameState} />}
        {gameState.phase === 'DISCUSSION' && <DiscussionPhase state={gameState} />}
        {gameState.phase === 'VOTING' && <VotingPhase state={gameState} />}
        {gameState.phase === 'RESULT' && <ResultPhase state={gameState} />}
      </main>

      <HowToPlayModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}
