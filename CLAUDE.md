# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

通鯨唄（かよいくじらうた）の自習用練習Webアプリ。山口県長門市・通地区に伝わる鯨唄「祝いめでた」を、先生のお手本MP3と自分の声（マイク）の音程・節回しを重ねて比較しながら練習できる、カラオケ採点風のツール。Vite + React + TypeScriptで実装し、`npm run build` で `dist/index.html` という単一HTMLファイルに出力する。MP3音源はbase64としてバンドルに埋め込まれ、Google Drive経由でスマホに転送してオフラインで動作させる運用は旧バージョンから変わらない。

## 開発コマンド

```bash
npm install       # 依存インストール
npm run dev       # 開発サーバー起動（http://localhost:5173 等）
npm run build     # tsc --noEmit の型チェック → vite build → dist/index.html を生成
npm run preview   # ビルド成果物のプレビュー
npm test          # vitest run（ユニットテスト一括実行）
npm run test:watch
npm run typecheck # tsc --noEmit のみ
```

ビルド成果物は **`dist/index.html` の単一ファイル**（vite-plugin-singlefile使用）。MP3のbase64（数MB）もJSに内包されるため、このファイル1つをそのまま配布・オフライン利用できる。ビルド前に必ず型チェックとテストを通すこと。

## アーキテクチャ

詳細な契約（各モジュールの型・関数シグネチャ・仕様）は **`docs/ARCHITECTURE.md` を正とする**。実装・レビュー・議論の際は必ずこのファイルを参照し、齟齬があればARCHITECTURE.mdの記述を優先する。

依存方向は一方向のみ:

```
components → hooks → audio/storage → core
```

- `src/core/` — 純粋ロジック（ピッチ検出・採点・類似度計算など）。DOM/Web Audio APIに依存禁止、全関数ユニットテスト必須
- `src/audio/` — Web Audio API / MediaDevicesラッパー（ブラウザ依存層）
- `src/songs/` — 曲レジストリ。曲を増やすときはここだけ触る
- `src/storage/` — localStorage永続化（練習記録）
- `src/hooks/` — React カスタムフック。core/audioをUIに接続
- `src/components/` — Reactコンポーネント。表示とイベントハンドリングのみ、ロジックを書かない

## 曲の追加手順

1. `src/songs/<song-id>/audio.b64` にMP3のbase64データを1行（改行なし）で置く
2. `src/songs/<song-id>/index.ts` で `Song`型（`src/songs/types.ts`）を満たすオブジェクトを定義（`id`, `title`, `credit`, `audioBase64`, `lyrics`, 任意で `endSec` / `scoringDurationSec`）
3. `src/songs/index.ts` の `songs` 配列に追加

以上で曲選択UI・音声解析・採点すべてに自動対応する。参考実装は `src/songs/iwai-medeta/index.ts`。

## 重要な制約

- **iOS Safariで `fetch()` によるbase64 data URIの読み込みは禁止**。必ず `audio/base64.ts` の `b64ToArrayBuffer()` → `decodeAudioData()` の流れで処理すること
- **UIの見た目**（文言・配色・レイアウト）は高齢の利用者を想定した旧版（`archive/鯨唄練習アプリv10.html`）を踏襲する。大きく変更しないこと。背景色 `#f5f4f0`、カード型UI、大きめフォントなどの基調は維持する
- `src/core/` はブラウザAPI（DOM, Web Audio, localStorage等）に依存しない純粋関数のみ。テストしやすさと再利用性のため
- 新規・変更したロジックには必ずテスト（Vitest）を書く。`core/`は境界値含め全関数、`storage/`はlocalStorageモック、コンポーネントは最低限のスモークテストでよい。音声API（AudioContext, getUserMedia）は自動テスト対象外（手動確認）

## archive/ ディレクトリ

`archive/` には旧バージョン（`鯨唄練習アプリv7.html` / `v9.html` / `v10.html` など、名前ベースでバージョン管理していた単一HTML群と旧仕様書）を保管している。**編集禁止**。UIの見た目や旧ロジックの参照用に読み取るのみとし、新しい実装は `src/` 側で行う。

## ドキュメント

- `docs/ARCHITECTURE.md` — エンジニア向けアーキテクチャ仕様（正）
- `docs/設計書.html` — 非エンジニア（アプリ利用者）向けのやさしい設計書。ブラウザで直接開ける自己完結HTML
