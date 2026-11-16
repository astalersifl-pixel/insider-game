import React, { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  HelpCircle,
  Crown,
  Sparkles,
  Check,
  X,
  Flame,
  MessageSquare,
  Target,
  Trash2,
  Lock,
  Coins,
  ListOrdered,
  SkipForward
} from 'lucide-react';
import { ClientGameState, QuestionAnswer } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface QuestionPhaseProps {
  state: ClientGameState;
}

const QUICK_PRESETS = [
  'それは食べ物ですか？',
  'それは人間が作ったものですか？',
  'それは家の中にありますか？',
  'それは手で持てる重さですか？',
  'それは1000円以下で買えますか？',
  'それは生き物ですか？',
  'それは電気で動きますか？'
];

export const QuestionPhase: React.FC<QuestionPhaseProps> = ({ state }) => {
  const [questionInput, setQuestionInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [showGuessModal, setShowGuessModal] = useState(false);

  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = me?.isHost ?? false;
  const isMaster = state.myRole === 'MASTER';
  const isInsider = state.myRole === 'INSIDER';
  const masterPlayer = state.players.find((p) => p.id === state.currentMasterId);

  const isSequentialMode = (state.settings.questionOrderMode ?? 'free') === 'sequential';
  const turnOrderIds = state.questionTurnOrder ?? [];
  const hasPendingQuestion = state.questions.some((q) => !q.answer);
  const currentTurnPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);
  const isMyTurn = !isSequentialMode || state.currentTurnPlayerId === state.myPlayerId;
  const canAskOrGuess = !isMaster && (!isSequentialMode || (!hasPendingQuestion && isMyTurn));

  // Sound effects on timer urgency
  useEffect(() => {
    if (state.timeRemaining <= 30 && state.timeRemaining > 0) {
      soundEffects.urgencyTick();
    } else if (state.timeRemaining % 10 === 0 && state.timeRemaining > 0) {
      soundEffects.tick();
    }
  }, [state.timeRemaining]);

  const handleSendQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canAskOrGuess || !questionInput.trim()) return;

    soundEffects.click();
    socketService.submitQuestion(questionInput.trim());
    setQuestionInput('');
  };

  const handleSendPreset = (text: string) => {
    if (!canAskOrGuess) return;
    soundEffects.click();
    socketService.submitQuestion(text);
  };

  const handleAnswerQuestion = (questionId: string, answer: QuestionAnswer) => {
    if (answer === 'YES') soundEffects.yes();
    else if (answer === 'NO') soundEffects.no();
    else if (answer === 'CORRECT') soundEffects.correct();
    else soundEffects.unknown();

    socketService.answerQuestion(questionId, answer);
  };

  const handleDeleteQuestion = (questionId: string) => {
    soundEffects.click();
    socketService.deleteQuestion(questionId);
  };

  const handleDirectGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canAskOrGuess || !guessInput.trim()) return;

    soundEffects.click();
    socketService.directGuess(guessInput.trim());
    setGuessInput('');
    setShowGuessModal(false);
  };

  const handleSkipTurn = () => {
    soundEffects.click();
    socketService.skipTurn();
  };

  // Format time remaining
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = state.timeRemaining <= 60;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 min-w-0">
      {/* Top Banner: Timer & Secret Word info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Timer Box */}
        <div
          className={`md:col-span-4 p-4 rounded-2xl border flex items-center justify-between shadow-lg transition-colors min-w-0 ${
            isUrgent
              ? 'bg-rose-950/40 border-rose-500/60 text-rose-300 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className={`w-6 h-6 ${isUrgent ? 'text-rose-400' : 'text-purple-400'}`} />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                残り質問時間
              </div>
              <div className="font-mono text-2xl font-black text-white">{timeFormatted}</div>
            </div>
          </div>
          {isUrgent && (
            <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              残り僅か！
            </span>
          )}
        </div>

        {/* Master & Secret Word Info Header */}
        <div className="md:col-span-8 p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-lg min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl shrink-0">
              {masterPlayer?.avatar || '👑'}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>マスター:</span>
                <span className="font-bold text-white break-words">{masterPlayer?.name}</span>
                <span className="text-[10px] text-slate-500">（お題を知る進行役）</span>
              </div>

              {(isMaster || isInsider) ? (
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs text-purple-400 font-bold shrink-0">お題（秘密）:</span>
                  <span className="text-base font-black text-white bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30 break-words [overflow-wrap:anywhere]">
                    {state.secretWord}
                  </span>
                  <span className="text-[11px] text-slate-400">({state.secretCategory})</span>
                </div>
              ) : (
                <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>カテゴリ: <strong className="text-white">{state.secretCategory}</strong></span>
                  <span className="text-[11px] text-slate-500">お題は質問して突き止めよう！</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sequential Turn Order Tracker */}
      {isSequentialMode && turnOrderIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-indigo-950/35 border border-indigo-500/40 space-y-2 shadow-md">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-indigo-200 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>質問・解答の順番（順番制）</span>
            </span>
            <div className="flex items-center gap-2">
              {currentTurnPlayer && (
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                  今の番: {currentTurnPlayer.avatar} {currentTurnPlayer.name}
                </span>
              )}
              {(isMaster || isHost) && !hasPendingQuestion && (
                <button
                  type="button"
                  onClick={handleSkipTurn}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="次の人の番へスキップする"
                >
                  <SkipForward className="w-3 h-3" />
                  <span>スキップ</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {turnOrderIds.map((pid, idx) => {
              const p = state.players.find((pl) => pl.id === pid);
              if (!p) return null;
              const isCurrent = pid === state.currentTurnPlayerId;
              return (
                <div
                  key={pid}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 transition ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{idx + 1}.</span>
                  <span>{p.avatar}</span>
                  <span className="truncate max-w-[90px]">{p.name}</span>
                  {isCurrent && <span className="text-[10px] text-amber-300">◀</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insider-only Mission Progress Tracker */}
      {isInsider && state.insiderMissionStatus && (
        <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2 shadow-md">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-purple-200 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>インサイダー専用ミッション</span>
            </span>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-lg">
              現在予測: {state.insiderMissionStatus.remainingPoints}pt（初期 {state.insiderMissionStatus.initialPoints}pt）
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
            <div
              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
                state.insiderMissionStatus.askedThreeQuestions
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <span>1. 質問3回 ({Math.min(3, state.insiderMissionStatus.questionCount)}/3)</span>
              <span className="font-mono font-bold">-1pt</span>
            </div>
            <div
              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
                state.insiderMissionStatus.gotYesAnswer
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <span>2. 「はい」の質問</span>
              <span className="font-mono font-bold">-1pt</span>
            </div>
            <div
              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${
                state.insiderMissionStatus.guessedCorrectWord
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <span>3. 正解を言う</span>
              <span className="font-mono font-bold">-2pt</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Questions & Answers Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">質問と回答のタイムライン</h3>
            <span className="text-xs text-slate-400">({state.questions.length}件)</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ※通常質問は判定後に公開／正誤は「お題を当てる！」でのみ判定
          </span>
        </div>

        {/* Questions list */}
        <div className="space-y-3.5 min-h-[280px] max-h-[460px] overflow-y-auto pr-1">
          {state.questions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs sm:text-sm">まだ質問がありません。</p>
              <p className="text-[11px] text-slate-500">
                下の入力欄やクイック質問ボタンから「それは食べ物ですか？」などを質問してみましょう！
              </p>
            </div>
          ) : (
            state.questions.map((q) => {
              const isPending = !q.answer;
              const isCorrect = q.answer === 'CORRECT';

              return (
                <div
                  key={q.id}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all min-w-0 overflow-hidden ${
                    isCorrect
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50'
                      : isPending
                      ? 'bg-slate-950/90 border-purple-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  {/* Row 1: Player Avatar & Name & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 mb-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{q.playerAvatar}</span>
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[140px] sm:max-w-none">{q.playerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(q.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Status badge & Delete button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {q.answer && (
                        <div>
                          {q.answer === 'YES' && (
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check className="w-3 h-3" /> はい
                            </span>
                          )}
                          {q.answer === 'NO' && (
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <X className="w-3 h-3" /> いいえ
                            </span>
                          )}
                          {q.answer === 'UNKNOWN' && (
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center gap-1">
                              不明
                            </span>
                          )}
                          {q.answer === 'CLOSE' && (
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> おしい！
                            </span>
                          )}
                          {q.answer === 'CORRECT' && (
                            <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center gap-1 shadow-lg shadow-amber-500/30">
                              🎉 正解！
                            </span>
                          )}
                        </div>
                      )}

                      {(isMaster || q.playerId === state.myPlayerId) && q.answer !== 'CORRECT' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
                          title="間違えた質問を削除する"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>削除</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Question text (Concealed while pending for non-Master/non-sender) */}
                  {q.isCall && (
                    <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>お題回答コール</span>
                    </div>
                  )}
                  <div
                    className={`py-1 px-1 text-sm sm:text-base leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap ${
                      q.isMasked
                        ? 'text-slate-400 italic font-medium flex items-center gap-1.5 text-xs sm:text-sm'
                        : q.isCall
                        ? 'text-amber-200 font-bold'
                        : 'text-slate-100 font-semibold'
                    }`}
                  >
                    {q.isMasked && <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    <span>{q.questionText}</span>
                  </div>

                  {!q.answer && !isMaster && q.playerId === state.myPlayerId && !q.isMasked && (
                    <div className="text-[10px] text-slate-400 px-1 mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>他のプレイヤーにはマスターの回答まで伏せられています（誤送信時は右上の「削除」で消せます）</span>
                    </div>
                  )}

                  {/* Row 3: Master Action Buttons */}
                  {isMaster && !q.answer && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
                      {q.isCall ? (
                        <>
                          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1 leading-tight">
                            <Crown className="w-3 h-3 shrink-0" />
                            <span>お題コール正誤判定（ここでのみ「正解🎉」判定ができます）</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleAnswerQuestion(q.id, 'NO')}
                              className="py-1.5 px-2 bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 shrink-0" />
                              <span>不正解</span>
                            </button>
                            <button
                              onClick={() => handleAnswerQuestion(q.id, 'CLOSE')}
                              className="py-1.5 px-2 bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>おしい</span>
                            </button>
                            <button
                              onClick={() => handleAnswerQuestion(q.id, 'CORRECT')}
                              className="py-1.5 px-2 bg-gradient-to-r from-yellow-400 to-amber-500 active:scale-95 text-slate-950 text-xs font-black rounded-lg transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>正解🎉</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                          <button
                            onClick={() => handleAnswerQuestion(q.id, 'YES')}
                            className="py-1.5 px-1 bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white text-[11px] sm:text-xs font-bold rounded-lg transition flex items-center justify-center gap-0.5 cursor-pointer"
                          >
                            <Check className="w-3 h-3 hidden sm:inline shrink-0" />
                            <span>はい</span>
                          </button>
                          <button
                            onClick={() => handleAnswerQuestion(q.id, 'NO')}
                            className="py-1.5 px-1 bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white text-[11px] sm:text-xs font-bold rounded-lg transition flex items-center justify-center gap-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3 hidden sm:inline shrink-0" />
                            <span>いいえ</span>
                          </button>
                          <button
                            onClick={() => handleAnswerQuestion(q.id, 'UNKNOWN')}
                            title="わからない / 微妙"
                            className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-[11px] sm:text-xs font-medium rounded-lg border border-slate-700 transition flex items-center justify-center cursor-pointer"
                          >
                            <span>不明</span>
                          </button>
                          <button
                            onClick={() => handleAnswerQuestion(q.id, 'CLOSE')}
                            className="py-1.5 px-1 bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white text-[11px] sm:text-xs font-bold rounded-lg transition flex items-center justify-center gap-0.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 hidden sm:inline shrink-0" />
                            <span>おしい</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Non-Master waiting indicator */}
                  {!isMaster && !q.answer && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-purple-400/90">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      <span>マスターの回答を待っています...</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Non-Master Question Controls: Presets + Question Input + Direct Guess Button */}
        {!isMaster ? (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            {isSequentialMode && (
              <div
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  canAskOrGuess
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                {hasPendingQuestion ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
                    <span>マスターの判定待ちです（判定後に次の人の番へ進みます）</span>
                  </>
                ) : isMyTurn ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>あなたの番です！質問を送るか「お題を当てる！」で解答してください。</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      現在は <strong>{currentTurnPlayer?.name || '他プレイヤー'}</strong> さんの番です（順番をお待ちください）
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">よくある質問:</span>
              {QUICK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  disabled={!canAskOrGuess}
                  onClick={() => handleSendPreset(preset)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-slate-700/80 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Question Form & Target Guess Call Button Together */}
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <form onSubmit={handleSendQuestion} className="flex-1 flex gap-2 min-w-0">
                <input
                  type="text"
                  value={questionInput}
                  disabled={!canAskOrGuess}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder={
                    canAskOrGuess
                      ? 'マスターに質問する（例：それは赤色ですか？）'
                      : hasPendingQuestion
                      ? 'マスターの回答待ち...'
                      : `${currentTurnPlayer?.name || '他プレイヤー'} さんの番です`
                  }
                  className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50 transition"
                />
                <button
                  type="submit"
                  disabled={!canAskOrGuess || !questionInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">質問送信</span>
                  <span className="sm:hidden">送信</span>
                </button>
              </form>

              {/* Target Guess Button - Placed right beside Question Send! */}
              <button
                type="button"
                disabled={!canAskOrGuess}
                onClick={() => {
                  soundEffects.click();
                  setShowGuessModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 shrink-0 cursor-pointer"
                title="正解のお題が分かったらここから直接当てることができます"
              >
                <Target className="w-4 h-4" />
                <span>お題を当てる！</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2 px-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>マスターは各質問の下のボタンで判定してください</span>
          </div>
        )}
      </div>

      {/* Direct Guess Modal */}
      {showGuessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <Target className="w-5 h-5" />
                お題の正解を直接コールする
              </div>
              <button
                onClick={() => setShowGuessModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              「これがお題だ！」と確信したら単語を入力してください。正解すると即座に質問フェーズが終了し、次の議論・投票へ進みます！
            </p>

            <form onSubmit={handleDirectGuess} className="space-y-3">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="単語を入力（例: カレーライス）"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuessModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!guessInput.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
                >
                  コールして判定！
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
