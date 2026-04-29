# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

鯨唄（くじらうた）の自習用練習Webアプリ。先生のMP3音源をbase64でHTMLに埋め込み、ブラウザ単体でオフライン動作する。カラオケ採点風に音程・節回しを比較する。

- **形式**: 単一HTMLファイル（フレームワーク・依存ライブラリなし）
- **最新版**: `鯨唄練習アプリv9.html`（v7は参考用の旧バージョン）
- **動作環境**: PC・スマホのブラウザ（Safari / Chrome）。スマホはGoogle Drive経由でHTMLを転送して使用

## 開発方法

ビルド・コンパイル・サーバー起動は不要。HTMLファイルをブラウザで直接開くだけで動作する。

```bash
# ローカルで開く（macOS）
open 鯨唄練習アプリv9.html

# スマホで確認したい場合
python3 -m http.server 8080
# → http://localhost:8080/鯨唄練習アプリv9.html
```

新バージョンを作るときは `v9.html` をコピーして `v10.html` などと命名する（上書きしない）。

### GitHubへのpush

ローカルのgit remoteはプロキシ経由のため、直接pushすると403エラーになる。`GH_TOKEN` 環境変数を使ってremote URLを書き換えてからpushする。

```bash
git remote set-url origin "https://n-kobo:${GH_TOKEN}@github.com/n-kobo/kayoi-kujira-uta.git"
git push -u origin <branch-name>
```

## アーキテクチャ

### ファイル構造（1ファイル完結）

```
<style>  CSSスタイル定義
<body>   UIのHTML構造
<script> 全ロジック（グローバル変数・関数）
```

MP3音源は `const MP3_B64 = "..."` という巨大な1行の文字列としてHTMLに埋め込まれている（ファイルサイズの大半はこのbase64データ）。

### 主要な関数とデータフロー

```
b64ToArrayBuffer()
  base64文字列 → ArrayBuffer（fetchは使用禁止）
  ↓
window.onload
  audio要素にBlob URLをセット（先生の音声を再生可能にする）

analyzeTeacher()
  先生音源のオフライン解析 → decodeAudioData()
  ArrayBuffer → PCMデータ → autocorrelate()
  各フレームの基本周波数を検出（自己相関法）
  → teacherPitches[]   解析結果ピッチ配列（nullは無音）
  → teacherMinF/MaxF   音域の自動検出（1〜99パーセンタイル ±8〜12%）

startRecording()
  マイク録音開始 + 先生音源を頭から再生
  → updateLoop()
      requestAnimationFrameで毎フレーム呼ばれる
      → autocorrelate()  自分のリアルタイムピッチ検出
      → scrollPos        refAudio.currentTime / teacherHopSec で同期
      → drawScroll()     Canvasにグラフ描画

stopRecording()
  録音停止・sessionDataに保存

showScore()
  4項目採点（節回し40%・音量20%・継続20%・安定20%）
```

### グラフ描画（`drawScroll`）

- Canvasはリサイズ時に `getCanvas()` で実寸に合わせる（Retina対応で `offsetWidth * 2`）
- 表示範囲：全フレーム数の4%（`visFrames = total * 0.04`）
- 現在位置縦線：画面左から22%（仕様書）または28%（v7実装）— v9を確認すること
- 先生・自分の玉ともにEMA平滑化：`BALL_SMOOTH = 0.08`（小さいほど遅く安定）

### グローバル状態変数

| 変数 | 役割 |
|------|------|
| `teacherPitches` | 先生のピッチ配列（解析後にセット） |
| `teacherHopSec` | フレーム間隔秒数（= hopSize / sampleRate） |
| `teacherMinF/MaxF` | グラフY軸の音域範囲 |
| `scrollPos` | 現在再生中のフレームインデックス |
| `myPitches` | 録音中の自分のピッチ配列 |
| `sessionData` | 録音停止後の採点用データ保存 |
| `smoothTY/smoothMY` | 先生・自分の玉Y座標（EMA値） |

## 重要な制約・注意点

### iOSでの動作

- `fetch()` でbase64 data URIを読もうとするとiOS Safariで失敗する。**必ず `b64ToArrayBuffer()` → `decodeAudioData()` の流れで処理する**
- マイク許可ダイアログの対応が必要（エラーメッセージでユーザーに案内）

### LYRICSの配置

- `LYRICS` 配列（歌詞データ）は `const total = teacherPitches.length` が定義された後でのみ参照可能
- `drawScroll` 内で `total` の定義より前に `LYRICS` を参照すると `Cannot access 'total' before initialization` エラーになる

### MP3差し替え

- `/tmp/song.b64` のbase64データを `MP3_B64` の値と置き換える

## v7 と v9 の主な違い

- v9はv7より約50行短くシンプルに整理されている
- v9の `updateLoop` は `recentMyPitch` を使ったシンプルなキャッシュ方式
- v7の `updateLoop` は `smoothLive()` で `LIVE_BUF=5` フレームの移動平均を使用
- v9のhopSizeは512（v7より細かい）
- フレームサイズ: 2048、ホップサイズ: 1024（仕様書）vs hopSize=512（v9実装）— コードを実際に確認すること

## 今後の改善候補

- 練習記録の永続化（localStorage）
- 複数曲の切り替え
- 歌詞タイミングの微調整機能
- PWA化（ホーム画面アイコンからの起動）
- 一致度判定アルゴリズムの改善（音程だけでなく節回しのパターンマッチング）
