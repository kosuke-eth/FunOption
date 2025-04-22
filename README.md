# FunOption-test

Bybit Testnet APIクライアントのテスト・開発用プロジェクトです。

---

## 目次
1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [ローカル開発サーバの起動](#ローカル開発サーバの起動)
4. [Bybit APIテストスクリプトの実行](#bybit-apiテストスクリプトの実行)
5. [注意事項](#注意事項)

---

## 概要
- Bybit Testnet APIクライアントの開発・動作確認ができます。
- テストスクリプトは**ESM（ECMAScript Modules）形式**で動作します。

## セットアップ
1. Node.js v20以上をインストール（v23.xで動作確認済み）
2. `.env`ファイルを作成し、BybitのAPIキー等を設定
3. 依存パッケージをインストール
    ```sh
    npm install
    ```

## ローカル開発サーバの起動
1. 下記コマンドでVite開発サーバを起動
    ```sh
    npm run dev
    ```
2. ブラウザで `http://localhost:5173/` を開くとアプリが表示されます

## Bybit APIテストスクリプトの実行
1. TypeScriptをESM形式でビルド
    ```sh
    npx tsc --project tsconfig.esm-test.json
    ```
2. テストスクリプトを実行
    ```sh
    node dist/api-esm-test/bybitTest.js
    ```

## 注意事項
- `dist/`ディレクトリは`.gitignore`に追加されています
- ESM形式のため、`import`文は拡張子（`.js`）付きです
- 認証エラーやAPIレスポンスエラーが出る場合は、`.env`ファイルやAPI仕様をご確認ください

### セキュリティ・APIキーの取り扱いについて
- **本プロジェクトはハッカソン・デモ用MVPです。**
- Bybit Testnet用APIキーをフロントエンドから直接利用しています。
- Testnetキーのため、万が一流出しても資産リスクはありません。
- **本番環境や資産が絡む用途では絶対にこの方法を使用しないでください。**
- 本番では必ずサーバーサイドでAPIキーを安全に管理・利用してください。
