export interface WordItem {
  word: string;
  category: string;
  difficulty: 'easy' | 'normal' | 'hard';
  hint: string;
}

export const CURATED_WORDS: WordItem[] = [
  // 食べ物・飲み物
  { word: 'カレーライス', category: '食べ物', difficulty: 'easy', hint: '国民的な人気料理' },
  { word: 'ラーメン', category: '食べ物', difficulty: 'easy', hint: '麺類' },
  { word: '寿司', category: '食べ物', difficulty: 'easy', hint: '日本の伝統食' },
  { word: 'チョコレート', category: '食べ物', difficulty: 'easy', hint: '甘いお菓子' },
  { word: 'タピオカミルクティー', category: '食べ物', difficulty: 'normal', hint: 'ブームになった飲み物' },
  { word: 'ホットケーキ', category: '食べ物', difficulty: 'easy', hint: 'フライパンで焼くおやつ' },
  { word: 'ハンバーガー', category: '食べ物', difficulty: 'easy', hint: 'ファストフードの王道' },
  { word: '納豆', category: '食べ物', difficulty: 'normal', hint: 'ネバネバした伝統食品' },
  { word: 'かき氷', category: '食べ物', difficulty: 'easy', hint: '夏の定番デザート' },
  { word: 'フランスパン', category: '食べ物', difficulty: 'normal', hint: '硬いパン' },
  { word: 'わさび', category: '食べ物', difficulty: 'normal', hint: '鼻につんとくる調味料' },
  { word: 'ポップコーン', category: '食べ物', difficulty: 'easy', hint: '映画館のお供' },

  // 日用品・道具・家具
  { word: 'スマートフォン', category: '日用品・電子機器', difficulty: 'easy', hint: '現代人の必需品' },
  { word: 'ハサミ', category: '日用品・文房具', difficulty: 'easy', hint: '切るための道具' },
  { word: '冷蔵庫', category: '家電・家具', difficulty: 'easy', hint: '食品を冷やす' },
  { word: '傘', category: '日用品', difficulty: 'easy', hint: '雨の日にさす' },
  { word: '消しゴム', category: '文房具', difficulty: 'easy', hint: '文字を消す' },
  { word: '目覚まし時計', category: '日用品・家電', difficulty: 'easy', hint: '朝起きるための道具' },
  { word: 'メガネ', category: '日用品・身の回り', difficulty: 'easy', hint: '視力を補う' },
  { word: 'ドライヤー', category: '家電', difficulty: 'easy', hint: '髪を乾かす' },
  { word: '電子レンジ', category: '家電', difficulty: 'easy', hint: '温める機械' },
  { word: '歯ブラシ', category: '日用品', difficulty: 'easy', hint: '毎食後に使う' },
  { word: '万年筆', category: '文房具', difficulty: 'normal', hint: 'インクを入れて書く' },
  { word: '砂時計', category: '道具・雑貨', difficulty: 'normal', hint: '砂が落ちて時間を測る' },
  { word: '鏡', category: '日用品・家具', difficulty: 'normal', hint: '姿を映す' },
  { word: 'ハンガー', category: '日用品', difficulty: 'easy', hint: '服をかける' },
  { word: 'マスク', category: '日用品・衛生', difficulty: 'easy', hint: '顔につける' },

  // 乗り物・施設・場所
  { word: '新幹線', category: '乗り物', difficulty: 'easy', hint: '超高速鉄道' },
  { word: '飛行機', category: '乗り物', difficulty: 'easy', hint: '空を飛ぶ' },
  { word: '潜水艦', category: '乗り物', difficulty: 'normal', hint: '海に深く潜る' },
  { word: '自転車', category: '乗り物', difficulty: 'easy', hint: 'ペダルを漕いで進む' },
  { word: '自動販売機', category: '街の設備', difficulty: 'easy', hint: '街角でジュースを売る' },
  { word: 'コンビニエンスストア', category: '施設・場所', difficulty: 'easy', hint: '24時間営業のお店' },
  { word: '図書館', category: '施設・場所', difficulty: 'easy', hint: '本がたくさんある静かな場所' },
  { word: '水族館', category: '施設・レジャー', difficulty: 'easy', hint: '魚やイルカを見る施設' },
  { word: 'ジェットコースター', category: 'アトラクション', difficulty: 'normal', hint: '遊園地の絶叫マシン' },
  { word: '映画館', category: '施設・レジャー', difficulty: 'easy', hint: '大画面で鑑賞する' },
  { word: 'キャンプ場', category: '場所・自然', difficulty: 'normal', hint: 'テントを張る場所' },
  { word: 'プラネタリウム', category: '施設・文化', difficulty: 'normal', hint: '星空をドームに映す' },
  { word: '富士山', category: '名所・自然', difficulty: 'easy', hint: '日本一高い山' },
  { word: '東京タワー', category: '建造物', difficulty: 'easy', hint: '赤と白の電波塔' },

  // 生き物・動物・植物
  { word: 'パンダ', category: '生き物・動物', difficulty: 'easy', hint: '白黒の動物、笹を食べる' },
  { word: 'ペンギン', category: '生き物・鳥類', difficulty: 'easy', hint: '飛べないが泳ぐのが得意な鳥' },
  { word: 'キリン', category: '生き物・動物', difficulty: 'easy', hint: '首がとても長い' },
  { word: 'カメレオン', category: '生き物・爬虫類', difficulty: 'normal', hint: '体色を変える' },
  { word: 'サボテン', category: '植物', difficulty: 'easy', hint: 'トゲがある砂漠の植物' },
  { word: 'ひまわり', category: '植物・花', difficulty: 'easy', hint: '夏に黄色い大きな花を咲かせる' },
  { word: 'クラゲ', category: '生き物・海洋', difficulty: 'normal', hint: '海をふわふわ漂う' },
  { word: 'カンガルー', category: '生き物・動物', difficulty: 'easy', hint: 'お腹のポケットで子育て' },

  // 自然・現象・概念・その他
  { word: '虹', category: '自然・気象', difficulty: 'normal', hint: '雨上がりの7色のアーチ' },
  { word: 'オーロラ', category: '自然・現象', difficulty: 'hard', hint: '極地で見られる幻想的な光' },
  { word: 'タイムカプセル', category: '記念・物', difficulty: 'hard', hint: '未来に向けて埋める箱' },
  { word: '化石', category: '自然・歴史', difficulty: 'normal', hint: '大昔の生物が石になったもの' },
  { word: '花火', category: 'イベント・物', difficulty: 'easy', hint: '夜空に打ち上げる' },
  { word: '万華鏡', category: '玩具・雑貨', difficulty: 'hard', hint: '覗くと幾何学模様が美しく変わる' },
  { word: 'パスポート', category: '重要書類', difficulty: 'normal', hint: '海外へ渡航するときに必要' },
  { word: 'トロフィー', category: '記念品', difficulty: 'normal', hint: '優勝したときにもらう' }
];

export function getRandomWord(difficultyFilter?: string): WordItem {
  let pool = CURATED_WORDS;
  if (difficultyFilter && difficultyFilter !== 'all') {
    pool = CURATED_WORDS.filter(w => w.difficulty === difficultyFilter);
    if (pool.length === 0) pool = CURATED_WORDS;
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
