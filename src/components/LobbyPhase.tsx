import React, { useState } from 'react';
import {
  Users,
  Crown,
  Bot,
  Play,
  Settings,
  Plus,
  Trash2,
  Share2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';

interface LobbyPhaseProps {
  state: ClientGameState;
}

export const LobbyPhase: React.FC<LobbyPhaseProps> = ({ state }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customTheme, setCustomTheme] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const me = state.players.find((p) => p.id === state.myPlayerId);
  const isHost = me?.isHost ?? false;
  const playerCount = state.players.length;
  const canStart = playerCount >= 3;

  const handleCopy = () => {
    soundEffects.click();
    const url = new URL(window.location.href);
    url.searchParams.set('room', state.roomCode);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleStartGame = () => {
    soundEffects.click();
    socketService.startGame();
  };

  const handleAddBot = () => {
    soundEffects.click();
    socketService.addBot();
  };

  const handleRemoveBot = (botId: string) => {
    soundEffects.click();
    socketService.removeBot(botId);
  };

  const handleGenerateAiWords = async () => {
    if (!customTheme.trim()) return;
    setIsGeneratingAi(true);
    setAiMessage(null);
    soundEffects.click();

    try {
      const res = await fetch('/api/ai/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: customTheme })
      });
      const data = await res.json();
      if (res.ok && data.words && data.words.length > 0) {
        setAiMessage(`✨ AIがお題「${data.words.map((w: { word: string }) => w.word).join(', ')}」を準備しました！`);
      } else {
        setAiMessage('⚠️ AIお題の生成に失敗しました（通常のお題を使用します）');
      }
    } catch {
      setAiMessage('⚠️ サーバーエラーにより通常のお題を使用します');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Users className="w-3.5 h-3.5" />
          待機ロビー（ラウンド {state.roundNumber}）
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          メンバーを集めてゲームを開始しよう
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          3桁の数字コード（{state.roomCode}）または招待URLを友達に共有して参加してもらいましょう。
          （1人ですぐ試す場合は「ボット追加」でテスト可能）
        </p>

        {/* Room Code & Invite button */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">ルームコード:</span>
            <span className="font-mono text-xl font-black text-purple-400 tracking-wider">
              {state.roomCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-600/30"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>招待URLをコピーしました！</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>招待リンクをコピー</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              参加プレイヤー一覧 ({playerCount}人)
            </h3>
            {!canStart && (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                あと {3 - playerCount} 人必要
              </span>
            )}
          </div>

          {/* Bot & Settings controls */}
          <div className="flex items-center gap-2">
            {isHost && (
              <>
                <button
                  onClick={handleAddBot}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                  title="テスト用にAIボットを追加"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <Plus className="w-3 h-3" />
                  <span>ボット追加</span>
                </button>

                <button
                  onClick={() => {
                    soundEffects.click();
                    setShowSettings(!showSettings);
                  }}
                  className={`p-2 rounded-xl border transition ${
                    showSettings
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="ゲーム設定"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {state.players.map((player) => {
            const isMe = player.id === state.myPlayerId;
            return (
              <div
                key={player.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                  isMe
                    ? 'bg-purple-950/30 border-purple-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                    {player.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[120px]">
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                          あなた
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {player.isHost && (
                        <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                          <Crown className="w-3 h-3" />
                          ホスト
                        </span>
                      )}
                      {player.isBot && (
                        <span className="flex items-center gap-0.5 text-indigo-400 font-medium">
                          <Bot className="w-3 h-3" />
                          Bot
                        </span>
                      )}
                      <span className="text-slate-500">得点: {player.score}pt</span>
                    </div>
                  </div>
                </div>

                {/* Host kick bot button */}
                {isHost && player.isBot && (
                  <button
                    onClick={() => handleRemoveBot(player.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="ボットを退出させる"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Game Settings Panel (Collapsible for Host) */}
        {showSettings && isHost && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              ルームルール設定
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">質問タイム（制限時間）</label>
                <select
                  value={state.settings.questionTimeSeconds}
                  onChange={(e) =>
                    socketService.updateSettings({ questionTimeSeconds: Number(e.target.value) })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={180}>180秒 (3分 - スピーディ)</option>
                  <option value={300}>300秒 (5分 - おすすめ標準)</option>
                  <option value={420}>420秒 (7分 - じっくり)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">議論タイム（投票前の推理）</label>
                <select
                  value={state.settings.discussionTimeSeconds}
                  onChange={(e) =>
                    socketService.updateSettings({ discussionTimeSeconds: Number(e.target.value) })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={120}>120秒 (2分)</option>
                  <option value={180}>180秒 (3分 - おすすめ)</option>
                  <option value={240}>240秒 (4分)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">お題の難易度</label>
                <select
                  value={state.settings.topicCategory}
                  onChange={(e) =>
                    socketService.updateSettings({ topicCategory: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">すべて（ランダム）</option>
                  <option value="easy">初級（日常のモノ・食べ物）</option>
                  <option value="normal">中級（少しひねりのある名詞）</option>
                  <option value="hard">上級（概念・自然現象など）</option>
                </select>
              </div>

              {/* AI Topic Prompt */}
              <div>
                <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Gemini AIでお題テーマをカスタマイズ
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="例: アニメ、学校生活、昭和レトロ"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleGenerateAiWords}
                    disabled={isGeneratingAi || !customTheme.trim()}
                    className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    {isGeneratingAi ? '生成中...' : '生成'}
                  </button>
                </div>
              </div>
            </div>

            {aiMessage && (
              <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs">
                {aiMessage}
              </div>
            )}
          </div>
        )}

        {/* Start Game Action Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-400" />
            質問時間: {state.settings.questionTimeSeconds / 60}分 / 議論時間: {state.settings.discussionTimeSeconds / 60}分
          </div>

          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                canStart
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-600/30 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ゲームを開始する（役職とお題配布へ）</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ホストがゲームを開始するのを待っています...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
