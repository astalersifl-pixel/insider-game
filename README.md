# インサイダー・ゲーム (Insider Game Online)

ブラウザで複数人がリアルタイムに遊べるオンライン心理クイズゲームです。
WebSocket（Express + ws）によるリアルタイム同期、ルーム管理、Bot対戦、Web Audio効果音、Gemini AIお題生成機能を搭載しています。

---

## 🚀 GitHub & Render での公開・デプロイ手順

### ステップ 1: GitHub にコードをプッシュする

1. **GitHubで新規リポジトリを作成**
   - GitHub (https://github.com/) にアクセスし、右上の「+」→「New repository」をクリック。
   - リポジトリ名（例: `insider-game`）を入力し、「Create repository」をクリック。

2. **ローカルからコードをプッシュ**
   ターミナルで以下のコマンドを実行します：

   ```bash
   # Git の初期化
   git init

   # 全ファイルをステージング
   git add .

   # コミット
   git commit -m "Initial commit: Insider Game fullstack app"

   # メインブランチに設定
   git branch -M main

   # GitHubリポジトリをリモートに追加（URLはご自身のものに置き換えてください）
   git remote add origin https://github.com/<あなたのユーザー名>/insider-game.git

   # プッシュ
   git push -u origin main
   ```

---

### ステップ 2: Render にデプロイする

Render (https://render.com/) は、Node.js + WebSocket を無料でホスティングできる PaaS です。

1. **Render にログイン**
   - https://render.com/ にアクセスし、「Get Started」または「Sign in」から GitHub アカウントで連携ログインします。

2. **Web Service を作成**
   - Render のダッシュボード右上の **「New +」** → **「Web Service」** を選択します。
   - 先ほどプッシュした GitHub リポジトリ（`insider-game`）の横にある **「Connect」** をクリックします。

3. **設定を入力**
   - **Name**: `insider-game`（任意のサービス名）
   - **Language**: `Node`
   - **Branch**: `main`
   - **Region**: `Singapore` または `Tokyo` または `Oregon`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`（無料プラン）

4. **環境変数（Environment Variables）の設定（任意）**
   - 下部の「Advanced」または「Environment Variables」を開きます。
   - `GEMINI_API_KEY`: （AIお題自動生成機能を使う場合、Google AI Studio で取得したAPIキーを設定）
   - `NODE_ENV`: `production`

5. **「Deploy Web Service」をクリック**
   - デプロイが開始され、2〜3分で完了します。
   - 画面上部に発行されたURL（例: `https://insider-game-xxxx.onrender.com`）にアクセスすれば、世界中の友達とリアルタイムに遊べます！

---

## 💡 Render無料プランでのポイント
- **WebSocket対応**: Render は標準で WebSocket（WSS）に完全対応しているため、追加設定なしで動作します。
- **スピンダウン**: 無料プランは15分間アクセスがないとスリープ状態になります。初回アクセス時に起動するまで約30秒〜1分ほどかかる場合がありますが、一度起動すればサクサク動きます。

---

## 💻 ローカルでの開発・起動方法

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（Express + WebSocket + Vite）
npm run dev

# http://localhost:3000 にアクセス
```

## 構成
- **フロントエンド**: React 19, Tailwind CSS, Lucide Icons, Web Audio API
- **バックエンド**: Node.js, Express, WebSocket (`ws`), `@google/genai`
