import React from 'react';
import { X, Crown, EyeOff, Users, HelpCircle, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">インサイダー・ゲームの遊び方</h2>
              <p className="text-xs text-slate-400">クイズ × 正体隠蔽の心理サスペンスゲーム</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            3つの役職
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                <Crown className="w-4 h-4" />
                マスター (出題者)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                お題を知っている進行役。皆の質問に「はい」「いいえ」「わからない」「おしい」で答えます。
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-sm">
                <EyeOff className="w-4 h-4" />
                インサイダー (内通者)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                正解のお題を密かに知っている裏切り者。庶民のフリをして誘導しつつ、正体バレを防ぎます。
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-sm">
                <Users className="w-4 h-4" />
                庶民 (一般回答者)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                お題を知らない大多数。質問を重ねてお題を当て、怪しい質問をしたインサイダーを推理します。
              </p>
            </div>
          </div>
        </div>

        {/* Flow */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            ゲームの流れ
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-white block mb-0.5">役職とお題の確認</strong>
                各プレイヤーの画面に秘密のカードが表示されます。マスターとインサイダーにお題が伝えられます。
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-white block mb-0.5">質問タイム（制限時間あり）</strong>
                庶民とインサイダーがマスターに質問します（例：「食べ物ですか？」「家の中にありますか？」）。時間内に誰かが正解のお題をコールすれば成功！
                <span className="text-rose-400 block mt-1">※時間切れになると、全員敗北（ゲームオーバー）となります！</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-white block mb-0.5">議論 ＆ 投票タイム</strong>
                「正解できたけど、誰がインサイダーだったのか？」を過去の質問ログを見返しながら議論します。「あの質問、急に確信に迫りすぎてない？」と怪しい人物に1人1票を投票！
              </div>
            </div>
          </div>
        </div>

        {/* Win / Loss conditions */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase">勝敗判定</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                庶民 & マスターの勝利
              </div>
              最多投票された人が<strong>「インサイダー」</strong>だった場合
            </div>
            <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/20 text-purple-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-purple-400" />
                インサイダーの単独勝利
              </div>
              最多投票が<strong>「無実の庶民」</strong>だった場合（インサイダーの完全逃げ切り！）
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-lg shadow-indigo-600/30"
          >
            ルールを理解した
          </button>
        </div>
      </div>
    </div>
  );
};
