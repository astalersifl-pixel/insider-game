import React, { useState, useEffect } from 'react';
import {
  Clock,
  Vote,
  Search,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send
} from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface DiscussionPhaseProps {
  state: ClientGameState;
}

export const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({ state }) => {
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
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-500/40 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          お題到達成功！
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white">
          正解のお題は「<span className="text-amber-300">{state.secretWord}</span>」でした！
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          正解者は <strong className="text-emerald-300">{guesser?.name || '回答者'}</strong> さんでした！
          しかし喜ぶのはまだ早い… この中に正解を知りながら皆を誘導していた
          <strong className="text-purple-400">「インサイダー」</strong>が潜んでいます！
        </p>
      </div>

      {/* Discussion Header & Timer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              議論タイム（残り時間）
            </div>
            <div className="text-2xl font-mono font-black text-white">{timeFormatted}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isHost && (
            <button
              onClick={handleStartVoting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <Vote className="w-4 h-4" />
              <span>議論を切り上げて投票へ進む</span>
            </button>
          )}
        </div>
      </div>

      {/* Two columns: Suspicious Questions Review & Discussion Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Questions Timeline Review */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              質問ログの検証（不自然な誘導を探せ！）
            </h3>
            <span className="text-[11px] text-slate-500">全 {state.questions.length} 件</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {state.questions.map((q, idx) => (
              <div
                key={q.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  q.isGuesser
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                  <span className="text-base shrink-0">{q.playerAvatar}</span>
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
                  {q.answer === 'CLOSE' && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      おしい
                    </span>
                  )}
                  {q.answer === 'CORRECT' && (
                    <span className="px-2 py-0.5 rounded bg-yellow-400 text-slate-950 text-[10px] font-black">
                      正解
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              <strong>推理のヒント:</strong> 正解に一気に近づくきっかけとなった質問をした人や、
              正解が出た直前・直後に怪しい動きをした人に注目してみましょう！
            </span>
          </div>
        </div>

        {/* Discussion Chat */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-[460px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              議論チャット
            </h3>
            <span className="text-[10px] text-slate-500">（通話併用も推奨）</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {state.chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-xl ${
                  msg.isSystem
                    ? 'bg-slate-950 text-slate-400 text-[11px] border border-slate-800'
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

          <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-800 flex gap-2">
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
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
