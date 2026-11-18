import React, { useState, useEffect } from 'react';
import {
  Crown,
  EyeOff,
  Users,
  RotateCcw,
  Home,
  CheckCircle2,
  Flame,
  Settings,
  Sparkles,
  ArrowRight,
  Vote,
  Clock,
  Check,
  Shuffle,
  Coins
} from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';
import { CustomWordPicker } from './CustomWordPicker.tsx';

interface ResultPhaseProps {
  state: ClientGameState;
}

export const ResultPhase: React.FC<ResultPhaseProps> = ({ state }) => {
  // 3-second suspense reveal state
  const [showSuspense, setShowSuspense] = useState(true);
  const [countdown, setCountdown] = useState(3);

  // Settings & Custom Word modal for next match
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMasterWordModal, setShowMasterWordModal] = useState(false);

  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = me?.isHost ?? false;
  const isManualMasterMode = state.settings.masterSelectionMode === 'manual';
  const isDesignatedMaster =
    isManualMasterMode && state.settings.selectedMasterId === state.myPlayerId;
  const canSetWord = isManualMasterMode
    ? state.settings.selectedMasterId
      ? isDesignatedMaster
      : isHost
    : isHost;
  const designatedMasterPlayer = state.players.find(
    (p) => p.id === state.settings.selectedMasterId
  );

  const insider = state.players.find((p) => p.role === 'INSIDER');
  const accused = state.players.find((p) => p.id === state.accusedPlayerId);

  // 3-second countdown suspense
  useEffect(() => {
    if (!showSuspense) return;

    soundEffects.urgencyTick();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowSuspense(false);
          if (state.winnerTeam === 'TIME_OVER') {
            soundEffects.gameover();
          } else {
            soundEffects.correct();
          }
          return 0;
        }
        soundEffects.tick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSuspense, state.winnerTeam]);

  const handleSkipSuspense = () => {
    setShowSuspense(false);
    if (state.winnerTeam === 'TIME_OVER') {
      soundEffects.gameover();
    } else {
      soundEffects.correct();
    }
  };

  const handleNextRound = () => {
    soundEffects.click();
    socketService.nextRound();
  };

  const handleBackToLobby = () => {
    soundEffects.click();
    socketService.backToLobby();
  };

  const handleResetWord = () => {
    soundEffects.click();
    socketService.setCustomWord('');
  };

  // 1. Suspense Reveal Phase (3 seconds)
  if (showSuspense) {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-center py-6 animate-fade-in">
        <div className="bg-gradient-to-b from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
            <Vote className="w-4 h-4 text-purple-400" />
            投票の開票結果発表
          </div>

          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-slate-400">
              プレイヤー達によって最も多くの票を集めたのは...
            </p>
            {accused ? (
              <div className="py-4 space-y-3">
                <div className="text-6xl sm:text-7xl animate-bounce">{accused.avatar}</div>
                <div className="text-2xl sm:text-4xl font-black text-white tracking-wide">
                  【{accused.name}】さん
                </div>
                <div className="inline-block px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/30 text-xs font-bold text-purple-300">
                  獲得票数: {state.accusedVoteCount ?? 0} 票
                </div>
              </div>
            ) : (
              <div className="py-4 text-lg text-slate-300 font-bold">
                同票または投票なし
              </div>
            )}
            <p className="text-xs sm:text-sm text-amber-300 font-medium animate-pulse">
              果たしてこの人物は、正体を隠していたインサイダーなのか...！？
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-mono">
              結果発表まで <span className="text-purple-400 font-black text-sm">{countdown}</span> 秒...
            </div>
            <button
              onClick={handleSkipSuspense}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              スキップして結果を見る →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Final Victory / Defeat Result Phase
  return (
    <div className="max-w-3xl mx-auto space-y-3.5 animate-fade-in">
      {/* Victory / Defeat Banner */}
      <div
        className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-6 text-center space-y-2.5 shadow-2xl relative overflow-hidden ${
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
            <h2 className="text-2xl sm:text-4xl font-black text-emerald-300">
              【庶民 ＆ マスターの勝利！】
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto">
              見事、内通者だった <strong className="text-white underline decoration-emerald-400">{insider?.name || 'インサイダー'}</strong> さんを暴き出しました！
            </p>
          </div>
        )}

        {state.winnerTeam === 'INSIDER' && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <EyeOff className="w-4 h-4 text-purple-400" />
              逃走・完全偽装成功
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-purple-300">
              【インサイダーの単独勝利！】
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto">
              インサイダーの <strong className="text-white underline decoration-purple-400">{insider?.name || '内通者'}</strong> さんは正体を隠したまま皆をお題に導き、見事逃げ切りました！
            </p>
          </div>
        )}

        {state.winnerTeam === 'TIME_OVER' && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Flame className="w-4 h-4 text-rose-400" />
              時間切れ
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-rose-300">
              【時間切れ：全員敗北】
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto">
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

      {/* Role Reveal & Vote Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          全プレイヤーの正体と投票結果
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {state.players.map((p) => {
            const isMasterRole = p.role === 'MASTER';
            const isInsiderRole = p.role === 'INSIDER';
            const votedForPlayer = state.players.find((target) => target.id === p.votedForId);

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border space-y-1.5 ${
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
                {votedForPlayer ? (
                  <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                    投票先: <span className="text-white font-medium">{votedForPlayer.name}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-1.5">
                    未投票
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insider Mission Breakdown (when Insider Points rule is active) */}
      {(state.settings.insiderPointsInitial ?? 0) > 0 && state.insiderMissionStatus && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-300" />
              インサイダーポイント結果
            </h3>
            <div className="text-xs font-black px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              残り: {state.insiderMissionStatus.remainingPoints}pt（初期 {state.insiderMissionStatus.initialPoints}pt）
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                state.insiderMissionStatus.threeQuestionCount > 0
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <span>1. 質問3回ごと ({state.insiderMissionStatus.questionCount}回)</span>
              <span className="font-mono font-bold">
                {state.insiderMissionStatus.threeQuestionCount > 0
                  ? `-${state.insiderMissionStatus.threeQuestionCount}pt (×${state.insiderMissionStatus.threeQuestionCount})`
                  : '未達成'}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                state.insiderMissionStatus.yesAnswerCount > 0
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <span>2. 「はい」の質問 ({state.insiderMissionStatus.yesAnswerCount}回)</span>
              <span className="font-mono font-bold">
                {state.insiderMissionStatus.yesAnswerCount > 0
                  ? `-${state.insiderMissionStatus.yesAnswerCount}pt (×${state.insiderMissionStatus.yesAnswerCount})`
                  : '未達成'}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                state.insiderMissionStatus.guessedCorrectWord
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <span>3. 正解を言う</span>
              <span className="font-mono font-bold">
                {state.insiderMissionStatus.guessedCorrectWord ? '-2pt ✓' : '未達成'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Secret Word Indicator (if set for next round) */}
      {state.customSecretWord && (
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
            <span>
              {canSetWord ? (
                <>
                  次の試合の予約お題: <strong className="text-white">「{state.customSecretWord.word}」</strong>
                  <span className="text-slate-400 ml-1">({state.customSecretWord.category})</span>
                </>
              ) : isManualMasterMode ? (
                <>✨ 次期マスター（{designatedMasterPlayer?.name || '指定'}）がお題を設定済みです！</>
              ) : (
                <>✨ ホストが次の試合の特別なお題を設定しました！</>
              )}
            </span>
          </div>
          {canSetWord && (
            <button
              onClick={handleResetWord}
              className="text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer shrink-0"
            >
              解除する
            </button>
          )}
        </div>
      )}

      {/* Action Controls & Next Match Settings */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
        <button
          onClick={handleBackToLobby}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>ロビーに戻る</span>
        </button>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          {canSetWord && !isHost && (
            <button
              onClick={() => {
                soundEffects.click();
                setShowMasterWordModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Crown className="w-4 h-4" />
              <span>次回のお題を決める（マスター特典）</span>
            </button>
          )}

          {isHost && (
            <button
              onClick={() => {
                soundEffects.click();
                setShowSettingsModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-purple-400" />
              <span>次試合のルール・お題設定</span>
            </button>
          )}

          {isHost && (
            <button
              onClick={handleNextRound}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                次のラウンドを開始（
                {state.settings.masterSelectionMode === 'manual'
                  ? `マスター: ${
                      state.players.find((p) => p.id === state.settings.selectedMasterId)?.name || '指定'
                    }`
                  : 'マスターランダム'}
                ）
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Next Match Rules & AI Topic Settings Modal */}
      {showSettingsModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <Settings className="w-5 h-5 text-purple-400" />
                <span>次の試合のルール ＆ お題設定</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Master Selection Mode */}
              {(() => {
                const masterMode = state.settings.masterSelectionMode || 'random';
                const humanPlayers = state.players.filter((p) => !p.isBot);

                return (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <label className="text-slate-200 font-bold flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      次のマスターの決め方
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.click();
                          socketService.updateSettings({
                            masterSelectionMode: 'random',
                            selectedMasterId: null
                          });
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          masterMode === 'random'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>ランダム</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.click();
                          const defaultId =
                            state.settings.selectedMasterId &&
                            state.players.some((p) => p.id === state.settings.selectedMasterId && !p.isBot)
                              ? state.settings.selectedMasterId
                              : humanPlayers[0]?.id || state.players[0]?.id || null;
                          socketService.updateSettings({
                            masterSelectionMode: 'manual',
                            selectedMasterId: defaultId
                          });
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          masterMode === 'manual'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>自分たちで選ぶ</span>
                      </button>
                    </div>

                    {masterMode === 'manual' && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] text-amber-300/90">
                          次のマスターにするプレイヤーを選択してください:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {humanPlayers.map((p) => {
                            const isChosen = state.settings.selectedMasterId === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  soundEffects.click();
                                  socketService.updateSettings({
                                    masterSelectionMode: 'manual',
                                    selectedMasterId: p.id
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                  isChosen
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50'
                                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                <span>{p.avatar}</span>
                                <span>{p.name}</span>
                                {isChosen && <Check className="w-3.5 h-3.5 text-amber-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Question Time */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">質問タイム（制限時間）</label>
                <select
                  value={state.settings.questionTimeSeconds}
                  onChange={(e) =>
                    socketService.updateSettings({ questionTimeSeconds: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={180}>180秒 (3分 - スピーディ)</option>
                  <option value={300}>300秒 (5分 - おすすめ標準)</option>
                  <option value={420}>420秒 (7分 - じっくり)</option>
                </select>
              </div>

              {/* Discussion Time */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">議論タイム（投票前の推理）</label>
                <select
                  value={state.settings.discussionTimeSeconds}
                  onChange={(e) =>
                    socketService.updateSettings({ discussionTimeSeconds: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={120}>120秒 (2分)</option>
                  <option value={180}>180秒 (3分 - おすすめ)</option>
                  <option value={240}>240秒 (4分)</option>
                </select>
              </div>

              {/* Topic Category */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">お題の難易度（通常プール）</label>
                <select
                  value={state.settings.topicCategory}
                  onChange={(e) =>
                    socketService.updateSettings({ topicCategory: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">すべて（ランダム）</option>
                  <option value="easy">初級（日常のモノ・食べ物）</option>
                  <option value="normal">中級（少しひねりのある名詞）</option>
                  <option value="hard">上級（概念・自然現象など）</option>
                </select>
              </div>

              {/* Insider Points Rule */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">インサイダーのポイント（ミッション）</label>
                <select
                  value={state.settings.insiderPointsInitial ?? 0}
                  onChange={(e) =>
                    socketService.updateSettings({ insiderPointsInitial: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={5}>5pt（難しい）</option>
                  <option value={3}>3pt（普通）</option>
                  <option value={2}>2pt（易しい）</option>
                  <option value={0}>0pt（フリー・通常ルール）</option>
                </select>
              </div>

              {/* Question Order Mode */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">質問の手順</label>
                <select
                  value={state.settings.questionOrderMode ?? 'free'}
                  onChange={(e) =>
                    socketService.updateSettings({
                      questionOrderMode: e.target.value as 'free' | 'sequential'
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="free">自由（思いついた人がどんどん質問・解答）</option>
                  <option value="sequential">順番に（ランダム順で1人ずつ質問・解答）</option>
                </select>
              </div>

              {canSetWord ? (
                <div className="pt-2 border-t border-slate-800">
                  <CustomWordPicker state={state} />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    マスター指定制のため、お題を決める権利は次回マスターの{' '}
                    <strong>{designatedMasterPlayer?.name || '指定プレイヤー'}</strong> さんにあります。
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Designated Master Next-Round Custom Word Modal */}
      {showMasterWordModal && canSetWord && !isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>次回のお題を決める（マスター特典）</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMasterWordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              次回のマスターとして、AI生成または自由入力でお題を予約できます（ホストを含む他のプレイヤーにはゲーム開始まで秘密にされます）。
            </p>

            <CustomWordPicker state={state} />

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMasterWordModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
