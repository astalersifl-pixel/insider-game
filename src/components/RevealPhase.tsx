import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Crown, Users, CheckCircle2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface RevealPhaseProps {
  state: ClientGameState;
}

export const RevealPhase: React.FC<RevealPhaseProps> = ({ state }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = me?.isHost ?? false;
  const isMaster = state.myRole === 'MASTER';
  const isInsider = state.myRole === 'INSIDER';
  const isCommoner = state.myRole === 'COMMONER';

  useEffect(() => {
    soundEffects.reveal();
  }, []);

  const handleToggleReveal = () => {
    soundEffects.click();
    setIsRevealed(!isRevealed);
  };

  const handleConfirmReady = () => {
    soundEffects.click();
    setHasConfirmed(true);
    socketService.confirmReveal();
  };

  const handleForceStart = () => {
    soundEffects.click();
    socketService.forceStartQuestions();
  };

  const confirmedCount = state.players.filter((p) => p.isReady).length;
  const totalPlayers = state.players.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Eye className="w-3.5 h-3.5" />
          ラウンド {state.roundNumber}：役職＆お題の確認
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          あなたの秘密の役割を確認してください
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          他のプレイヤーに画面を見られないように注意してください！
        </p>
      </div>

      {/* Secret Card */}
      <div
        onClick={handleToggleReveal}
        className={`cursor-pointer select-none rounded-3xl border transition-all duration-500 p-8 shadow-2xl relative overflow-hidden text-center min-h-[300px] flex flex-col items-center justify-center ${
          !isRevealed
            ? 'bg-slate-900 border-slate-700 hover:border-purple-500/60 shadow-purple-950/20'
            : isMaster
            ? 'bg-gradient-to-b from-amber-950/50 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-950/30'
            : isInsider
            ? 'bg-gradient-to-b from-purple-950/60 via-slate-900 to-slate-950 border-purple-500/50 shadow-purple-950/40'
            : 'bg-gradient-to-b from-blue-950/50 via-slate-900 to-slate-950 border-blue-500/40 shadow-blue-950/30'
        }`}
      >
        {!isRevealed ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <EyeOff className="w-8 h-8" />
            </div>
            <div>
              <div className="text-base font-bold text-white mb-1">
                タップして役割・お題をめくる
              </div>
              <p className="text-xs text-slate-400">
                画面をタッチまたはクリックすると正体が表示されます
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-scale-up">
            {/* Role Header */}
            {isMaster && (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Crown className="w-4 h-4" />
                  マスター（出題者）
                </div>
                <h3 className="text-3xl font-black text-amber-300">あなたはマスターです</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  他プレイヤーからの質問に対して「はい」「いいえ」「わからない」「おしい」で答えます。
                </p>
              </div>
            )}

            {isInsider && (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  インサイダー（内通者）
                </div>
                <h3 className="text-3xl font-black text-purple-300">あなたはインサイダーです！</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  お題を知っています。庶民のフリをして質問し、制限時間内に正解へと導いてください。
                  ただし、後で怪しまれないように絶妙にカモフラージュしましょう！
                </p>
              </div>
            )}

            {isCommoner && (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Users className="w-4 h-4" />
                  庶民（回答者）
                </div>
                <h3 className="text-3xl font-black text-blue-300">あなたは庶民です</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  お題は知りません。マスターに質問を重ねてお題を突き止めてください。
                  怪しい質問をしたインサイダーの言動にも注目しましょう！
                </p>
              </div>
            )}

            {/* Secret Word Box (Only for Master & Insider) */}
            {(isMaster || isInsider) ? (
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-inner max-w-sm mx-auto space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  今回のお題（秘密）
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  「{state.secretWord}」
                </div>
                <div className="text-[11px] text-slate-400">
                  カテゴリ: {state.secretCategory}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner max-w-sm mx-auto space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  今回のお題
                </div>
                <div className="text-xl font-bold text-slate-500">
                  ？？？？？（非公開）
                </div>
                <div className="text-[11px] text-slate-400">
                  カテゴリ: {state.secretCategory}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500 pt-2">
              (もう一度タップすると伏せることができます)
            </p>
          </div>
        )}
      </div>

      {/* Confirmation & Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            確認完了状況:
          </span>
          <span className="font-bold text-white">
            {confirmedCount} / {totalPlayers} 人
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(confirmedCount / totalPlayers) * 100}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={handleConfirmReady}
            disabled={hasConfirmed}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              hasConfirmed
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {hasConfirmed ? '準備完了（待機中...）' : '確認完了（準備OK）'}
          </button>

          {isHost && (
            <button
              onClick={handleForceStart}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <span>質問フェーズを開始</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
