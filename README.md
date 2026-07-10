# 通鯨唄おけいこアプリ

山口県長門市・通（かよい）地区に伝わる鯨唄「祝いめでた」の自習用練習Webアプリです。先生のお手本音源（MP3）と自分の声（マイク）の音程・節回しをグラフ上に重ねて表示し、カラオケ採点風に一致度を採点します。

- 単一HTMLファイルとしてビルドされ、ブラウザだけでオフライン動作します
- お手本のMP3はビルド成果物に埋め込まれるため、追加のファイル配布は不要です
- スマホでの利用はGoogle Drive経由でHTMLファイルを転送する運用を想定しています

非エンジニアの方向けの解説は [`docs/設計書.html`](docs/設計書.html) を、実装の詳細は [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) をご覧ください。

## セットアップ

Node.js が必要です。

```bash
npm install
npm run dev
```

`npm run dev` で開発サーバーが起動します。表示されたURL（例: `http://localhost:5173`）をブラウザで開いてください。

## ビルドと配布

```bash
npm run build
```

`tsc --noEmit` による型チェックの後、`dist/index.html` という単一HTMLファイルが生成されます。お手本MP3のbase64データもこのファイルにすべて埋め込まれるため、`dist/index.html` 1つをそのままコピー・配布すればオフラインで動作します。

スマホで使う場合は、この `dist/index.html` をGoogle Driveにアップロードし、スマホ側のGoogle Driveアプリから開く運用を想定しています。

その他のコマンド:

```bash
npm run preview    # ビルド成果物のプレビュー
npm test           # ユニットテスト実行（Vitest）
npm run test:watch # テストのウォッチ実行
npm run typecheck  # 型チェックのみ
```

## ディレクトリ構成

```
src/
├── core/        純粋ロジック（音程検出・採点・類似度計算など。ブラウザAPI非依存）
├── audio/       Web Audio API / マイク録音のラッパー
├── songs/       曲データのレジストリ（曲を増やすときはここを触る）
├── storage/     練習記録のlocalStorage永続化
├── hooks/       React カスタムフック
├── components/  React コンポーネント
├── App.tsx
├── main.tsx
└── styles.css

docs/
├── ARCHITECTURE.md   エンジニア向けアーキテクチャ仕様
└── 設計書.html        非エンジニア向けのやさしい設計書（ブラウザで直接開ける）

archive/         旧バージョン（名前ベースでバージョン管理していた単一HTML群）。参照用、編集不可
```

依存方向は `components → hooks → audio/storage → core` の一方向です。詳細は [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) を参照してください。

## 曲を増やす

1. `src/songs/<song-id>/audio.b64` にMP3のbase64データを置く
2. `src/songs/<song-id>/index.ts` で曲情報（`Song`型）を定義する
3. `src/songs/index.ts` の曲一覧に追加する

以上で曲選択UI・音声解析・採点に自動で反映されます。詳しくは `docs/ARCHITECTURE.md` の「曲の増やし方」、または `src/songs/iwai-medeta/index.ts` を参照してください。

## 開発時の注意

- iOS Safariでは `fetch()` によるbase64 data URIの読み込みが失敗するため、音声デコードは必ず `b64ToArrayBuffer()` → `decodeAudioData()` の流れで行います
- UIの見た目（配色・文言・レイアウト）は高齢の利用者を想定した旧版を踏襲しており、大きく変更しません
- 開発ガイドラインの詳細は [`CLAUDE.md`](CLAUDE.md) を参照してください
