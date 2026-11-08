import React, { useEffect } from 'react';
import {
  Trophy,
  Crown,
  EyeOff,
  Users,
  RotateCcw,
  Home,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface ResultPhaseProps {
  state: ClientGameState;
}

export const ResultPhase: React.FC<ResultPhaseProps> = ({ state }) => {
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = me?.isHost ?? false;

  const insider = state.players.find((p) => p.role === 'INSIDER');
  const master = state.players.find((p) => p.id === state.currentMasterId);

  useEffect(() => {
    if (state.winnerTeam === 'TIME_OVER') {
      soundEffects.gameover();
    } else {
      soundEffects.correct();
    }
  }, [state.winnerTeam]);

  const handleNextRound = () => {
    soundEffects.click();
    socketService.nextRound();
  };

  const handleBackToLobby = () => {
    soundEffects.click();
    socketService.backToLobby();
  };

  // Sort players by score
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Victory / Defeat Big Banner */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 text-center space-y-3 shadow-2xl relative overflow-hidden ${
          state.winnerTeam === 'COMMONERS'
            ? 'bg-gradient-to-b from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/50 shadow-emerald-950/40'
            : state.winnerTeam === 'INSIDER'
            ? 'bg-gradient-to-b from-purple-950/70 via-slate-900 to-slate-950 border-purple-500/50 shadow-purple-950/50'
            : 'bg-gradient-to-b from-rose-950/60 via-slate-900 to-slate-950 border-rose-500/50 shadow-rose-950/40'
        }`}
      >
        {state.winnerTeam === 'COMMONERS' && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              インサイダー特定成功
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-300">
              【庶民 ＆ マスターの勝利！】
            </h2>
            <p className="text-sm text-slate-200 max-w-lg mx-auto">
              見事、内通者だった <strong className="text-white">{insider?.name || 'インサイダー'}</strong> さんを暴き出しました！
            </p>
          </div>
        )}

        {state.winnerTeam === 'INSIDER' && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <EyeOff className="w-4 h-4 text-purple-400" />
              逃走・完全偽装成功
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-purple-300">
              【インサイダーの単独勝利！】
            </h2>
            <p className="text-sm text-slate-200 max-w-lg mx-auto">
              インサイダーの <strong className="text-white">{insider?.name || '内通者'}</strong> さんは正体を隠したまま皆をお題に導き、見事逃げ切りました！
            </p>
          </div>
        )}

        {state.winnerTeam === 'TIME_OVER' && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Flame className="w-4 h-4 text-rose-400" />
              時間切れ
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-rose-300">
              【時間切れ：全員敗北】
            </h2>
            <p className="text-sm text-slate-200 max-w-lg mx-auto">
              制限時間内にお題に辿り着けませんでした。インサイダーもマスターも庶民も全員敗北です...！
            </p>
          </div>
        )}

        <div className="pt-2">
          <div className="inline-block px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-300">
            今回のお題：<span className="font-bold text-white text-sm">「{state.secretWord}」</span>
            <span className="text-slate-500 ml-2">({state.secretCategory})</span>
          </div>
        </div>
      </div>

      {/* Role Reveal Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          全プレイヤーの正体
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {state.players.map((p) => {
            const isMasterRole = p.role === 'MASTER';
            const isInsiderRole = p.role === 'INSIDER';
            const votedForPlayer = state.players.find((target) => target.id === p.votedForId);

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isInsiderRole
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-950/30'
                    : isMasterRole
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.avatar}</span>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-white">{p.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isMasterRole && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          マスター
                        </span>
                      )}
                      {isInsiderRole && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40 animate-pulse">
                          インサイダー
                        </span>
                      )}
                      {!isMasterRole && !isInsiderRole && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                          庶民
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vote info */}
                {votedForPlayer && (
                  <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                    投票先: <span className="text-white font-medium">{votedForPlayer.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          現在のトータルスコアランキング
        </h3>

        <div className="space-y-1.5">
          {sortedPlayers.map((p, rank) => (
            <div
              key={p.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                rank === 0
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold w-5 text-center text-slate-500">
                  #{rank + 1}
                </span>
                <span className="text-lg">{p.avatar}</span>
                <span className="font-bold text-white">{p.name}</span>
              </div>
              <div className="font-mono font-bold text-sm text-amber-300">{p.score} pt</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          onClick={handleBackToLobby}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>ロビーに戻る</span>
        </button>

        {isHost && (
          <button
            onClick={handleNextRound}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>次のラウンドを開始（マスター交代）</span>
          </button>
        )}
      </div>
    </div>
  );
};
