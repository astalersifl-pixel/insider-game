import React, { useEffect } from 'react';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  Coins,
  ArrowRight,
  Clock
} from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface CorrectRevealPhaseProps {
  state: ClientGameState;
}

export const CorrectRevealPhase: React.FC<CorrectRevealPhaseProps> = ({ state }) => {
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const guesser = state.players.find((p) => p.id === state.guesserId);
  const hasConfirmed = me?.isReady ?? false;

  const readyCount = state.players.filter((p) => p.isReady).length;
  const totalCount = state.players.length;
  const hasPointsRule = (state.settings.insiderPointsInitial ?? 0) > 0;
  const displayPoints = Math.max(0, state.insiderPointsRemaining ?? 0);

  useEffect(() => {
    soundEffects.correct();
  }, []);

  const handleConfirm = () => {
    if (hasConfirmed) return;
    soundEffects.click();
    socketService.confirmCorrectReveal();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fade-in min-w-0">
      {/* Celebratory Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/50 bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 text-center shadow-2xl shadow-amber-900/30">
        {/* Decorative background glows */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-16 -right-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative z-10 space-y-4">
          {/* Celebratory badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 animate-bounce">
            <Trophy className="w-4 h-4" />
            <span>お題正解！！おめでとう！</span>
            <Sparkles className="w-4 h-4" />
          </div>

          {/* Secret word spotlight */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300/80">
              今回のお題
            </div>
            <div className="inline-block px-6 py-3 rounded-2xl bg-slate-950/85 border border-amber-400/40 shadow-inner max-w-full">
              <div className="text-2xl sm:text-4xl font-black text-white tracking-wide break-words [overflow-wrap:anywhere]">
                「{state.secretWord}」
              </div>
              <div className="text-xs text-slate-400 mt-1">
                カテゴリ: {state.secretCategory}
              </div>
            </div>
          </div>

          {/* Guesser info */}
          {guesser && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs sm:text-sm text-emerald-200">
              <span className="text-xl leading-none">{guesser.avatar}</span>
              <span>
                正解者: <strong className="text-white">{guesser.name}</strong> さん
              </span>
            </div>
          )}

          {/* Insider Remaining Points Card (Only when Insider Points rule is active) */}
          {hasPointsRule && (
            <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/75 via-slate-950/90 to-indigo-950/75 border border-purple-400/50 shadow-xl space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-300">
                <Coins className="w-4 h-4 text-amber-300" />
                <span>インサイダーの所持ポイント</span>
              </div>

              <div className="flex items-baseline justify-center gap-1.5 py-1">
                <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-purple-300 bg-clip-text text-transparent">
                  {displayPoints}
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-300">pt</span>
              </div>

              <div className="text-[11px] text-slate-400">
                初期 {state.settings.insiderPointsInitial}pt から達成ミッション分を減算（0pt以下は0pt表示）
              </div>
              <div className="text-[11px] text-purple-300/90 font-medium pt-0.5">
                🕵️‍♂️ このポイント数をヒントに、議論でインサイダーを見抜こう！
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Section: Wait for all players to tap 完了 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            全員が「完了」を押すと議論に進みます
          </span>
          <span className="font-mono font-bold text-white">
            {readyCount} / {totalCount} 人完了
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (readyCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        {/* Per-player confirmation badges */}
        <div className="flex flex-wrap gap-1.5">
          {state.players.map((p) => (
            <div
              key={p.id}
              className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition ${
                p.isReady
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400'
              }`}
            >
              <span>{p.avatar}</span>
              <span className="font-medium truncate max-w-[90px]">{p.name}</span>
              {p.isReady ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-slate-500 shrink-0 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={hasConfirmed}
          className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
            hasConfirmed
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{hasConfirmed ? '完了（他のプレイヤーを待っています...）' : '完了（議論へ進む）'}</span>
          {!hasConfirmed && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
