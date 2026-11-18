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
  Check,
  Shuffle,
  Coins,
  ListOrdered
} from 'lucide-react';
import { ClientGameState } from '../types/game.ts';
import { socketService } from '../services/socket.ts';
import { soundEffects } from '../utils/audio.ts';
import { CustomWordPicker } from './CustomWordPicker.tsx';

interface LobbyPhaseProps {
  state: ClientGameState;
}

const INSIDER_POINT_OPTIONS = [
  { value: 5, shortLabel: '5pt（難しい）' },
  { value: 3, shortLabel: '3pt（普通）' },
  { value: 2, shortLabel: '2pt（易しい）' },
  { value: 0, shortLabel: '0pt（フリー）' }
];

export const LobbyPhase: React.FC<LobbyPhaseProps> = ({ state }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showMasterWordPicker, setShowMasterWordPicker] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleResetWord = () => {
    soundEffects.click();
    socketService.setCustomWord('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3.5 sm:space-y-4">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-xl text-center space-y-2.5 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Users className="w-3 h-3" />
          待機ロビー（ラウンド {state.roundNumber}）
        </div>

        <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
          メンバーを集めてゲームを開始しよう
        </h2>

        <p className="text-[11px] sm:text-xs text-slate-300 max-w-xl mx-auto leading-snug">
          コード（{state.roomCode}）または招待URLを共有（1人で試す場合は「ボット追加」）
        </p>

        {/* Room Code & Invite button */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">コード:</span>
            <span className="font-mono text-lg font-black text-purple-400 tracking-wider">
              {state.roomCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>コピーしました！</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>招待リンクをコピー</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
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
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
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
                  className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                    showSettings
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="ゲーム設定・AIお題"
                >
                  <Settings className="w-4 h-4" />
                  <span>ルール・お題設定</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Master Selection Mode Bar */}
        {(() => {
          const masterMode = state.settings.masterSelectionMode || 'random';
          const humanPlayers = state.players.filter((p) => !p.isBot);
          const selectedMaster = state.players.find((p) => p.id === state.settings.selectedMasterId);

          return (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>マスターの決め方</span>
                </div>

                {isHost ? (
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        masterMode === 'manual'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>自分たちで選ぶ</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    {masterMode === 'manual' ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>指定制: {selectedMaster ? `${selectedMaster.name} さん` : '未選択'}</span>
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                        <span>ランダム決定</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {masterMode === 'manual' && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] text-amber-300/90 font-medium">
                    {isHost
                      ? '👇 今回のマスターにするプレイヤーを選択してください（Bot以外）:'
                      : '👑 今回のマスターに選ばれたプレイヤー:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {humanPlayers.map((p) => {
                      const isChosen = state.settings.selectedMasterId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={!isHost}
                          onClick={() => {
                            if (!isHost) return;
                            soundEffects.click();
                            socketService.updateSettings({
                              masterSelectionMode: 'manual',
                              selectedMasterId: p.id
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                            isChosen
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50'
                              : isHost
                              ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 cursor-pointer'
                              : 'bg-slate-900 border-slate-800 text-slate-400 cursor-default'
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

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {state.players.map((player) => {
            const isMe = player.id === state.myPlayerId;
            const isDesignatedMaster =
              state.settings.masterSelectionMode === 'manual' &&
              state.settings.selectedMasterId === player.id;
            return (
              <div
                key={player.id}
                onClick={() => {
                  if (isHost && state.settings.masterSelectionMode === 'manual' && !player.isBot) {
                    soundEffects.click();
                    socketService.updateSettings({
                      masterSelectionMode: 'manual',
                      selectedMasterId: player.id
                    });
                  }
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                  isDesignatedMaster
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-sm'
                    : isMe
                    ? 'bg-purple-950/30 border-purple-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800'
                } ${
                  isHost && state.settings.masterSelectionMode === 'manual' && !player.isBot
                    ? 'cursor-pointer hover:border-amber-400/60'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                    {player.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[120px]">
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                          あなた
                        </span>
                      )}
                      {isDesignatedMaster && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          次回マスター
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
                      {!player.isHost && !player.isBot && (
                        <span className="text-slate-500">プレイヤー</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Host kick bot button */}
                {isHost && player.isBot && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBot(player.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="ボットを退出させる"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Word Active Banner (Visible in Lobby) */}
        {state.customSecretWord && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
              <span>
                {canSetWord ? (
                  <>
                    予約お題: <strong className="text-white">「{state.customSecretWord.word}」</strong>
                    <span className="text-slate-400 ml-1">({state.customSecretWord.category})</span>
                  </>
                ) : isManualMasterMode ? (
                  <>✨ マスター（{designatedMasterPlayer?.name || '指定'}）が最初のお題を設定しました！</>
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
                ランダムに戻す
              </button>
            )}
          </div>
        )}

        {/* Designated Master Custom Word Picker (When a non-Host player is chosen as Master) */}
        {canSetWord && !isHost && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>あなたはマスターです！最初のお題を決められます（任意）</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEffects.click();
                  setShowMasterWordPicker(!showMasterWordPicker);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition cursor-pointer shrink-0"
              >
                {showMasterWordPicker ? '閉じる' : 'お題を決める'}
              </button>
            </div>
            {showMasterWordPicker && (
              <div className="pt-2 border-t border-amber-500/20">
                <CustomWordPicker state={state} compact />
              </div>
            )}
          </div>
        )}

        {/* Game Settings & AI Topic Panel (Collapsible for Host) */}
        {showSettings && isHost && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fade-in text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              ルームルール ＆ AIお題設定
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1 font-medium">お題の難易度（通常プール）</label>
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

              <div>
                <label className="text-slate-400 block mb-1 font-medium">インサイダーのポイント（ミッション）</label>
                <select
                  value={state.settings.insiderPointsInitial ?? 0}
                  onChange={(e) =>
                    socketService.updateSettings({ insiderPointsInitial: Number(e.target.value) })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value={5}>5pt（難しい）</option>
                  <option value={3}>3pt（普通）</option>
                  <option value={2}>2pt（易しい）</option>
                  <option value={0}>0pt（フリー・通常ルール）</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">質問の手順</label>
                <select
                  value={state.settings.questionOrderMode ?? 'free'}
                  onChange={(e) =>
                    socketService.updateSettings({
                      questionOrderMode: e.target.value as 'free' | 'sequential'
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="free">自由（思いついた人がどんどん質問・解答）</option>
                  <option value="sequential">順番に（ランダム順で1人ずつ質問・解答）</option>
                </select>
              </div>
            </div>

            {canSetWord ? (
              <div className="pt-2.5 border-t border-slate-800">
                <CustomWordPicker state={state} compact />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  マスター指定制のため、お題を決める権利はマスターの{' '}
                  <strong>{designatedMasterPlayer?.name || '指定プレイヤー'}</strong> さんにあります。
                </span>
              </div>
            )}
          </div>
        )}

        {/* Start Game Action Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              質問: {state.settings.questionTimeSeconds / 60}分 / 議論: {state.settings.discussionTimeSeconds / 60}分
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-amber-300/90">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              マスター:{' '}
              {state.settings.masterSelectionMode === 'manual'
                ? state.players.find((p) => p.id === state.settings.selectedMasterId)?.name || '手動選択'
                : 'ランダム'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-purple-300/90">
              <Coins className="w-3.5 h-3.5 text-purple-400" />
              インサイダーP:{' '}
              {INSIDER_POINT_OPTIONS.find((o) => o.value === (state.settings.insiderPointsInitial ?? 0))?.shortLabel ||
                '0pt（フリー）'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-indigo-300/90">
              <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
              手順: {(state.settings.questionOrderMode ?? 'free') === 'sequential' ? '順番に' : '自由'}
            </span>
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
