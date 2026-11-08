import React, { useState } from 'react';
import { Vote, CheckCircle2, ShieldAlert, Users, AlertCircle } from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface VotingPhaseProps {
  state: ClientGameState;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({ state }) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const hasVoted = me?.hasVoted ?? false;

  // Master is excluded from being the Insider according to standard rules
  const eligibleTargets = state.players.filter((p) => p.id !== state.currentMasterId);

  const handleSelect = (playerId: string) => {
    if (hasVoted) return;
    soundEffects.click();
    setSelectedTargetId(playerId);
  };

  const handleSubmitVote = () => {
    if (!selectedTargetId || hasVoted) return;
    soundEffects.click();
    socketService.submitVote(selectedTargetId);
  };

  const votedCount = state.players.filter((p) => p.hasVoted).length;
  const totalVoters = state.players.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Vote className="w-3.5 h-3.5" />
          インサイダー告発投票
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          インサイダー（内通者）は誰だ？
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          正解を知りながらみんなを誘導していたと思う人物を1人選んで投票してください。
        </p>
      </div>

      {/* Target Candidates Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {eligibleTargets.map((player) => {
          const isSelected = selectedTargetId === player.id;
          const isMe = player.id === state.myPlayerId;

          return (
            <div
              key={player.id}
              onClick={() => handleSelect(player.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/60 shadow-lg shadow-purple-950/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              } ${hasVoted ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {player.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white truncate">{player.name}</span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                        自分
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {player.isBot ? 'Botプレイヤー' : 'プレイヤー'}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vote Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            投票完了状況
          </span>
          <span className="font-bold text-white">
            {votedCount} / {totalVoters} 人
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-purple-500 h-full transition-all duration-300"
            style={{ width: `${(votedCount / totalVoters) * 100}%` }}
          />
        </div>

        <div className="pt-2 text-center">
          {hasVoted ? (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              あなたの投票を受け付けました。他のプレイヤーの投票を待っています...
            </div>
          ) : (
            <button
              onClick={handleSubmitVote}
              disabled={!selectedTargetId}
              className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                selectedTargetId
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>このプレイヤーに投票を確定する</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
