import React, { useState, useEffect, useRef } from 'react';
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
  Target
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
  const questionsEndRef = useRef<HTMLDivElement>(null);

  const isMaster = state.myRole === 'MASTER';
  const isInsider = state.myRole === 'INSIDER';
  const masterPlayer = state.players.find((p) => p.id === state.currentMasterId);

  // Sound effects on timer urgency
  useEffect(() => {
    if (state.timeRemaining <= 30 && state.timeRemaining > 0) {
      soundEffects.urgencyTick();
    } else if (state.timeRemaining % 10 === 0 && state.timeRemaining > 0) {
      soundEffects.tick();
    }
  }, [state.timeRemaining]);

  // Auto-scroll question log
  useEffect(() => {
    questionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.questions.length]);

  const handleSendQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionInput.trim()) return;

    soundEffects.click();
    socketService.submitQuestion(questionInput.trim());
    setQuestionInput('');
  };

  const handleSendPreset = (text: string) => {
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

  const handleDirectGuess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guessInput.trim()) return;

    soundEffects.click();
    socketService.directGuess(guessInput.trim());
    setGuessInput('');
    setShowGuessModal(false);
  };

  // Format time remaining
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = state.timeRemaining <= 60;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Banner: Timer & Secret Word info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Timer Box */}
        <div
          className={`md:col-span-4 p-4 rounded-2xl border flex items-center justify-between shadow-lg transition-colors ${
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
        <div className="md:col-span-8 p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl shrink-0">
              {masterPlayer?.avatar || '👑'}
            </div>
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                マスター: <span className="font-bold text-white">{masterPlayer?.name}</span>
                <span className="text-[10px] text-slate-500">（お題を知る進行役）</span>
              </div>

              {(isMaster || isInsider) ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-purple-400 font-bold">お題（秘密）:</span>
                  <span className="text-base font-black text-white bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                    {state.secretWord}
                  </span>
                  <span className="text-[11px] text-slate-400">({state.secretCategory})</span>
                </div>
              ) : (
                <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>カテゴリ: <strong className="text-white">{state.secretCategory}</strong></span>
                  <span className="text-[11px] text-slate-500">お題は質問して突き止めよう！</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Questions & Answers Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">質問と回答のタイムライン</h3>
            <span className="text-xs text-slate-400">({state.questions.length}件)</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ※マスターは質問ごとに「はい / いいえ / わからない / おしい / 正解」で判定します
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
                  className={`p-4 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50'
                      : isPending
                      ? 'bg-slate-950/90 border-purple-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  {/* Row 1: Player Avatar & Name & Timestamp */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{q.playerAvatar}</span>
                      <span className="text-xs font-bold text-slate-200">{q.playerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(q.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* If answered, display status badge on the top right */}
                    {q.answer && (
                      <div className="shrink-0">
                        {q.answer === 'YES' && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> はい (YES)
                          </span>
                        )}
                        {q.answer === 'NO' && (
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> いいえ (NO)
                          </span>
                        )}
                        {q.answer === 'UNKNOWN' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center gap-1">
                            わからない / 微妙
                          </span>
                        )}
                        {q.answer === 'CLOSE' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> おしい！
                          </span>
                        )}
                        {q.answer === 'CORRECT' && (
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                            🎉 正解！
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row 2: Question text (Prominent and clear) */}
                  {q.isCall && (
                    <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      お題回答コール
                    </div>
                  )}
                  <div className={`py-1 px-1 font-semibold text-sm sm:text-base leading-relaxed ${
                    q.isCall ? 'text-amber-200 font-bold' : 'text-slate-100'
                  }`}>
                    {q.questionText}
                  </div>

                  {/* Row 3: Master Action Buttons (Placed directly UNDER the question) */}
                  {isMaster && !q.answer && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        {q.isCall
                          ? '🎯【回答コール判定】正解なら「正解！🎉」、違えば「いいえ」「おしい」を選択してください:'
                          : 'マスターの判定を選択してください:'}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <button
                          onClick={() => handleAnswerQuestion(q.id, 'YES')}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> はい
                        </button>
                        <button
                          onClick={() => handleAnswerQuestion(q.id, 'NO')}
                          className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" /> いいえ
                        </button>
                        <button
                          onClick={() => handleAnswerQuestion(q.id, 'UNKNOWN')}
                          className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center justify-center cursor-pointer"
                        >
                          わからない
                        </button>
                        <button
                          onClick={() => handleAnswerQuestion(q.id, 'CLOSE')}
                          className="py-2.5 px-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> おしい！
                        </button>
                        <button
                          onClick={() => handleAnswerQuestion(q.id, 'CORRECT')}
                          className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-gradient-to-r from-yellow-400 to-amber-500 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-1 cursor-pointer"
                        >
                          正解！🎉
                        </button>
                      </div>
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
          <div ref={questionsEndRef} />
        </div>

        {/* Non-Master Question Controls: Presets + Question Input + Direct Guess Button */}
        {!isMaster ? (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">よくある質問:</span>
              {QUICK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPreset(preset)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Question Form & Target Guess Call Button Together */}
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleSendQuestion} className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="マスターに質問する（例：それは赤色ですか？、外で使いますか？）"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">質問送信</span>
                  <span className="sm:hidden">送信</span>
                </button>
              </form>

              {/* Target Guess Button - Placed right beside Question Send! */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.click();
                  setShowGuessModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 shrink-0 cursor-pointer"
                title="正解のお題が分かったらここから直接当てることができます"
              >
                <Target className="w-4 h-4" />
                <span>お題を当てる！</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-center gap-2">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>あなたはマスターです。届いた質問の下にある「はい」「いいえ」ボタンで判定してください。</span>
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
