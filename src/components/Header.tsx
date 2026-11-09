import React, { useState } from 'react';
import { Eye, Copy, Check, Volume2, VolumeX, HelpCircle, ExternalLink, Wifi, WifiOff, RotateCcw, LogOut } from 'lucide-react';
import { soundEffects, toggleMute, getIsMuted } from '../utils/audio.ts';
import { socketService } from '../services/socket.ts';

interface HeaderProps {
  roomCode: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onOpenRules: () => void;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomCode, connectionStatus, onOpenRules, onLeaveRoom }) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(getIsMuted());

  const handleCopyLink = () => {
    soundEffects.click();
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleMute = () => {
    const next = toggleMute();
    setIsMuted(next);
    if (!next) {
      soundEffects.click();
    }
  };

  const handleOpenTestTab = () => {
    soundEffects.click();
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    window.open(url.toString(), '_blank');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-white tracking-tight leading-none">
                インサイダー・ゲーム
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">内通者を暴く心理クイズゲーム</p>
          </div>
        </div>

        {/* Room Code & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {roomCode && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">ROOM:</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-purple-400 tracking-wider">
                {roomCode}
              </span>
              <button
                onClick={handleCopyLink}
                title="招待リンクをコピー"
                className="ml-1 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 text-[11px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold hidden md:inline">コピー済</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">共有</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Test in new tab button */}
          {roomCode && (
            <button
              onClick={handleOpenTestTab}
              title="別タブを開いてマルチプレイをテスト"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>別タブでテスト</span>
            </button>
          )}

          {/* Audio toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'サウンドをONにする' : 'サウンドをミュートにする'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Rules button */}
          <button
            onClick={() => {
              soundEffects.click();
              onOpenRules();
            }}
            title="ルール説明を見る"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">遊び方</span>
          </button>

          {/* Reconnect button if disconnected */}
          {connectionStatus !== 'connected' && (
            <button
              onClick={() => {
                soundEffects.click();
                socketService.reconnect();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse hover:bg-rose-500/30 transition cursor-pointer"
              title="サーバーに再接続する"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再接続</span>
            </button>
          )}

          {/* Connection status */}
          <div
            title={`接続状態: ${connectionStatus === 'connected' ? '接続中' : '切断中'}`}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-xl bg-slate-950 border border-slate-800"
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            )}
          </div>

          {/* Leave room button */}
          {roomCode && onLeaveRoom && (
            <button
              onClick={() => {
                soundEffects.click();
                onLeaveRoom();
              }}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="部屋を退出してロビーに戻る"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">退出</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
