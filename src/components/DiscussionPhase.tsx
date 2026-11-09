import React, { useState, useEffect } from 'react';
import {
  Clock,
  Vote,
  Search,
  MessageSquare,
  CheckCircle2,
  Send,
  Sparkles
} from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface DiscussionPhaseProps {
  state: ClientGameState;
}

export const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'chat'>('log');
  const [chatInput, setChatInput] = useState('');
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = me?.isHost ?? false;
  const guesser = state.players.find((p) => p.id === state.guesserId);

  useEffect(() => {
    soundEffects.correct();
  }, []);

  const handleStartVoting = () => {
    soundEffects.click();
    socketService.startVoting();
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    soundEffects.click();
    socketService.sendChat(chatInput.trim());
    setChatInput('');
  };

  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="max-w-2xl mx-auto space-y-3 animate-fade-in">
      {/* Compact Header: Secret Word & Timer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-slate-400">正解のお題</div>
              <div className="text-base sm:text-lg font-black text-amber-300">
                「{state.secretWord}」
                <span className="text-xs text-slate-400 font-normal ml-2">
                  (正解者: {guesser?.name || '回答者'})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{timeFormatted}</span>
            </div>

            {isHost && (
              <button
                onClick={handleStartVoting}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Vote className="w-3.5 h-3.5" />
                <span>投票へ進む</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-tight">
          🕵️‍♂️ <strong className="text-purple-300">インサイダーは誰だ？</strong> 正解を知りながら誘導していた人物を推理しましょう！
        </p>
      </div>

      {/* Tab Switcher: 質問ログ vs チャット */}
      <div className="flex gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'log'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>質問ログ ({state.questions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>チャット ({state.chatMessages.length})</span>
        </button>
      </div>

      {/* Tab 1: Compact Questions Log */}
      {activeTab === 'log' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-2 shadow-lg animate-fade-in">
          <div className="h-[250px] sm:h-[300px] overflow-y-auto space-y-2 pr-1">
            {state.questions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">質問ログはありません</div>
            ) : (
              state.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    q.answer === 'CORRECT'
                      ? 'bg-amber-950/40 border-amber-500/50'
                      : q.isCall
                      ? 'bg-purple-950/30 border-purple-500/30'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-500 font-mono text-[10px] shrink-0">#{idx + 1}</span>
                    <span className="text-sm shrink-0">{q.playerAvatar}</span>
                    <span className="font-bold text-slate-300 shrink-0">{q.playerName}:</span>
                    <span className="text-white truncate">{q.questionText}</span>
                  </div>
                  <div className="shrink-0">
                    {q.answer === 'YES' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        はい
                      </span>
                    )}
                    {q.answer === 'NO' && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                        いいえ
                      </span>
                    )}
                    {q.answer === 'UNKNOWN' && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 text-[10px]">
                        不明
                      </span>
                    )}
                    {q.answer === 'CLOSE' && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        おしい
                      </span>
                    )}
                    {q.answer === 'CORRECT' && (
                      <span className="px-2 py-0.5 rounded bg-yellow-400 text-slate-950 text-[10px] font-black">
                        正解！
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-[10px] text-slate-500 text-center pt-1">
            💡 正解に一気に近づくきっかけとなった質問や、怪しい誘導を探しましょう
          </div>
        </div>
      )}

      {/* Tab 2: Compact Discussion Chat */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-lg animate-fade-in flex flex-col h-[320px]">
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {state.chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-xl ${
                  msg.isSystem
                    ? 'bg-slate-950 text-slate-400 text-[10px] border border-slate-800'
                    : 'bg-slate-950/80 border border-slate-800/80 text-slate-200'
                }`}
              >
                {!msg.isSystem && (
                  <div className="flex items-center gap-1.5 font-bold text-slate-300 text-[11px] mb-0.5">
                    <span>{msg.senderAvatar}</span>
                    <span>{msg.senderName}</span>
                  </div>
                )}
                <div>{msg.text}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="怪しい人を指摘・弁明する..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
