import React, { useState } from 'react';
import { Sparkles, Check, Target } from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface CustomWordPickerProps {
  state: ClientGameState;
  compact?: boolean;
}

const AI_PRESET_THEMES = [
  'アニメ・マンガ',
  '食べ物・スイーツ',
  '日常・学校生活',
  'ゲーム・エンタメ',
  '日本の観光・名所',
  '昭和・平成レトロ'
];

export const CustomWordPicker: React.FC<CustomWordPickerProps> = ({ state, compact = false }) => {
  const [customTheme, setCustomTheme] = useState('');
  const [manualWord, setManualWord] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedCandidates, setGeneratedCandidates] = useState<
    Array<{ word: string; category: string; hint: string }>
  >([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const handleGenerateAiWords = async (themeToUse?: string) => {
    const theme = themeToUse || customTheme;
    if (!theme.trim()) return;
    setIsGeneratingAi(true);
    setAiMessage(null);
    soundEffects.click();

    try {
      const res = await fetch('/api/ai/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });
      const data = await res.json();
      if (res.ok && data.words && data.words.length > 0) {
        setGeneratedCandidates(data.words);
        setAiMessage(`✨ AIがお題候補を${data.words.length}つ生成しました！クリックして設定してください。`);
      } else {
        setAiMessage('⚠️ AIお題の生成に失敗しました（通常のお題を使用します）');
      }
    } catch {
      setAiMessage('⚠️ 通信エラーによりお題の生成に失敗しました');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSelectWord = (item: { word: string; category: string; hint: string }) => {
    soundEffects.click();
    socketService.setCustomWord(item.word, item.category, item.hint);
    setAiMessage(`✓ お題を「${item.word}」に設定しました！`);
  };

  const handleSetManualWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualWord.trim()) return;
    soundEffects.click();
    socketService.setCustomWord(manualWord.trim(), manualCategory.trim() || 'カスタム');
    setAiMessage(`✓ お題を「${manualWord.trim()}」に設定しました！`);
    setManualWord('');
    setManualCategory('');
  };

  const handleResetWord = () => {
    soundEffects.click();
    socketService.setCustomWord('');
    setAiMessage('🎲 お題を通常プールからのランダム設定に戻しました');
  };

  return (
    <div className={compact ? 'space-y-2.5 text-xs' : 'space-y-3 text-xs'}>
      {/* Current custom word status */}
      {state.customSecretWord && (
        <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 flex items-center justify-between gap-2">
          <span className="text-purple-200">
            予約お題: <strong className="text-white">「{state.customSecretWord.word}」</strong>
            <span className="text-slate-400 ml-1">({state.customSecretWord.category})</span>
          </span>
          <button
            type="button"
            onClick={handleResetWord}
            className="text-[11px] text-slate-400 hover:text-rose-300 underline cursor-pointer shrink-0"
          >
            ランダムに戻す
          </button>
        </div>
      )}

      {/* AI Topic Prompt & Candidate Selection */}
      <div className="space-y-2">
        <label className="text-slate-300 block font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Gemini AIでお題をカスタマイズ生成
        </label>

        {/* Preset Chips */}
        <div className="flex flex-wrap gap-1.5">
          {AI_PRESET_THEMES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setCustomTheme(preset);
                handleGenerateAiWords(preset);
              }}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="テーマ（例: アニメ、学校、夏休み）"
            className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => handleGenerateAiWords()}
            disabled={isGeneratingAi || !customTheme.trim()}
            className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
          >
            {isGeneratingAi ? '生成中...' : '生成する'}
          </button>
        </div>

        {/* Generated Candidates */}
        {generatedCandidates.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-300">
              生成された候補（クリックして設定）:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {generatedCandidates.map((c, i) => {
                const isChosen = state.customSecretWord?.word === c.word;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectWord(c)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      isChosen
                        ? 'bg-purple-950/70 border-purple-400 text-white ring-1 ring-purple-400'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{c.word}</div>
                      <div className="text-[10px] text-slate-500 truncate">{c.category}</div>
                    </div>
                    {isChosen && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Direct Manual Word Input */}
      <div className="pt-2.5 border-t border-slate-800 space-y-2">
        <label className="text-slate-300 block font-bold flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-400" />
          または自由なお題を直接入力
        </label>
        <form onSubmit={handleSetManualWord} className="flex gap-1.5 sm:gap-2">
          <input
            type="text"
            value={manualWord}
            onChange={(e) => setManualWord(e.target.value)}
            placeholder="お題（例: スマートフォン）"
            className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder:text-slate-500"
          />
          <input
            type="text"
            value={manualCategory}
            onChange={(e) => setManualCategory(e.target.value)}
            placeholder="カテゴリ"
            className="w-20 sm:w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!manualWord.trim()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
          >
            設定
          </button>
        </form>
      </div>

      {aiMessage && (
        <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px]">
          {aiMessage}
        </div>
      )}
    </div>
  );
};
