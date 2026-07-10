# アーキテクチャ仕様（エンジニア向け）

通鯨唄おけいこアプリのモジュール構成と各層の契約（インターフェース）を定義する。
実装者（人間・AIエージェント）はこの契約に厳密に従うこと。

## 技術スタック

- Vite + React 19 + TypeScript（strict）
- vite-plugin-singlefile: `npm run build` で **dist/index.html 単一ファイル** を出力
- Vitest + Testing Library: ユニットテスト
- 依存は最小限。状態管理ライブラリ・CSSフレームワークは使わない

## レイヤ構成

```
src/
├── core/      純粋ロジック（DOM・Web Audio禁止。全関数ユニットテスト必須）
├── audio/     Web Audio API ラッパー（ブラウザ依存層）
├── songs/     曲レジストリ（曲を増やすときはここだけ触る）
├── storage/   localStorage 永続化
├── hooks/     React カスタムフック（core/audio を UI に接続）
├── components/ React コンポーネント（表示とイベントのみ。ロジックを書かない）
├── App.tsx
├── main.tsx
└── styles.css
```

依存方向は上から下への一方向のみ:
`components → hooks → audio/storage → core`。`core` は何にも依存しない。

## core/ の契約

### core/config.ts

```ts
export interface AnalysisConfig {
  frameSize: number;      // 2048
  hopSize: number;        // 512
  minFreq: number;        // 40 (Hz)
  maxFreq: number;        // 3000 (Hz)
  rmsThreshold: number;   // 0.006 これ未満は無音
  corrThreshold: number;  // 0.86 自己相関の有効閾値
}
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig;
```

### core/pitch.ts

```ts
/** 自己相関法(ACF)による基本周波数検出。無音・検出不能は null */
export function autocorrelate(buf: Float32Array, sampleRate: number, cfg?: AnalysisConfig): number | null;
/** 周波数→音名 (C, C#, ... B)。範囲外は null */
export function freqToNote(freq: number | null): string | null;
export const NOTES: readonly string[];
```

autocorrelate は旧実装（archive/鯨唄練習アプリv10.html の同名関数）と同一アルゴリズム。
ただし戻り値 -1 の代わりに null を返し、minFreq〜maxFreq 外も null にする。

### core/smoothing.ts

```ts
/** null を無視する中心移動平均。全て null の窓は null */
export function movingAvg(arr: (number | null)[], windowSize: number): (number | null)[];
/** 指数移動平均の1ステップ。prev が null なら target をそのまま返す */
export function emaStep(prev: number | null, target: number, alpha: number): number;
/** リアルタイム表示用のローリングバッファ（旧 MY_BUF=8 相当） */
export class RollingPitchBuffer {
  constructor(size?: number); // 既定 8
  push(value: number | null): void;
  /** 有効値が半数以上あれば平均、なければ null */
  average(): number | null;
  reset(): void;
}
```

### core/range.ts

```ts
/** 有効ピッチの2〜98パーセンタイルに±10%マージンで音域を返す。
    有効値が10個以下なら fallback {minF:80, maxF:600} */
export function detectRange(pitches: (number | null)[]): { minF: number; maxF: number };
```

### core/similarity.ts

```ts
/** 節回し一致度 0〜100。キー差（平均音程のオフセット）を半音単位で補正し、
    半音差 <2 → 1点, <4 → 0.5点。旧 calcSimilarity と同一仕様 */
export function calcSimilarity(teacherPitches: (number | null)[], myPitches: (number | null)[]): number;
```

### core/scoring.ts

```ts
export interface SessionData {
  pitches: (number | null)[];
  vols: number[];        // dB値（-50より大きいもののみ蓄積）
  durationSec: number;
}
export interface ScoreResult {
  total: number;         // 0-100
  shape: number;         // 節回しの近さ 40%
  volume: number;        // 音量・強弱 20%
  duration: number;      // 継続・伸び 20%
  stability: number;     // 声の安定 20%
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  stars: string;         // '★★★★★' など
  message: string;
  color: string;         // ランク色
}
export function computeScore(
  session: SessionData,
  teacherPitches: (number | null)[] | null,
  opts?: { baseDurationSec?: number }, // 既定30
): ScoreResult;
```

ランク: S(90〜)/A(78〜)/B(65〜)/C(50〜)/D。メッセージ・色は旧 showScore と同一。

### core/time.ts

```ts
/** 75 → '1:15'。NaN/undefined/null は '0:00' */
export function formatTime(sec: number | null | undefined): string;
```

### core/lyrics.ts

```ts
import type { LyricLine } from '../songs/types';
/** 現在秒に対応する歌詞インデックス。開始前は -1 */
export function currentLyricIndex(lyrics: LyricLine[], currentSec: number): number;
```

## audio/ の契約

### audio/base64.ts

```ts
/** base64 → ArrayBuffer。fetch は iOS Safari で失敗するため使用禁止 */
export function b64ToArrayBuffer(b64: string): ArrayBuffer;
```

### audio/teacherAnalyzer.ts

```ts
export interface TeacherAnalysis {
  pitches: (number | null)[];  // フレームごとの基本周波数
  smooth: (number | null)[];   // movingAvg(pitches, 25)
  hopSec: number;              // hopSize / sampleRate
  minF: number;
  maxF: number;
  durationSec: number;         // 解析対象の長さ（endSecでカット後）
}
/** MP3のArrayBufferをオフライン解析。チャンク処理でUIをブロックしない。
    onProgress は 0〜100 の整数で呼ばれる */
export function analyzeTeacherAudio(
  audioData: ArrayBuffer,
  opts: { endSec?: number; config?: AnalysisConfig; onProgress?: (pct: number) => void },
): Promise<TeacherAnalysis>;
```

decodeAudioData 用の AudioContext は解析後に必ず close する。

### audio/micRecorder.ts

```ts
export interface MicFrame {
  pitch: number | null;  // autocorrelate の生値
  db: number;            // RMS→dB（無音は -60）
}
/** マイク録音。AnalyserNode でリアルタイム解析、MediaRecorder で音声保存 */
export class MicRecorder {
  start(): Promise<void>;   // getUserMedia 失敗時は例外を投げる（呼び元でアラート）
  /** requestAnimationFrame ループから毎フレーム呼ぶ */
  readFrame(): MicFrame;
  /** 停止して録音Blobを返す（録音データがなければ null） */
  stop(): Promise<Blob | null>;
  readonly isActive: boolean;
}
```

マイク設定: `echoCancellation: true, noiseSuppression: true, autoGainControl: false`、
`analyser.fftSize = 1024`、`smoothingTimeConstant = 0`。
MediaRecorder は audioCtx.close() より先に stop する（順序重要）。

## storage/ の契約

### storage/history.ts

```ts
export interface PracticeRecord {
  dateLabel: string;   // '7/10 15:04'
  score: number;
  rank: string;
  color: string;
  songId: string;
}
export function loadHistory(): PracticeRecord[];       // 壊れたJSONは空配列
export function saveHistory(records: PracticeRecord[]): void;
export function appendRecord(record: PracticeRecord): PracticeRecord[];
```

キーは `kujira-uta:history:v1`。localStorage が使えない環境でも例外を漏らさない。

## hooks/ の契約

### hooks/useTeacherAnalysis.ts

曲（Song）を受け取り、`b64ToArrayBuffer` → Blob URL 生成（audio要素用）と
`analyzeTeacherAudio`（グラフ・採点用）を実行。
状態: `{ status: 'idle'|'analyzing'|'ready'|'error', progress, analysis, audioUrl, error }`。
曲切替時は前の Blob URL を revoke する。

### hooks/usePracticeSession.ts

再生・録音・停止・シーク・採点のステートマシン。
モード: `'idle' | 'playing' | 'recording' | 'recorded'`。
requestAnimationFrame ループはこのフック内に閉じ込め、
毎フレーム `{ scrollPos, livePitch, liveDb, liveSimilarity }` を更新する。
`scrollPos = floor(refAudio.currentTime / hopSec)` で音源と同期。
endSec 到達で自動停止。

## components/ の構成

| コンポーネント | 役割 |
|---|---|
| `App` | 全体レイアウト・曲選択状態の保持 |
| `SongSelector` | 曲が2曲以上あるときだけ表示するセレクタ |
| `TeacherAudioCard` | お手本プレーヤー（audio要素）+ 解析ステータス表示 |
| `PitchGraph` | Canvas 流れるグラフ（先生ライン・玉・歌詞・グリッド） |
| `TransportControls` | 再生/録音/停止/採点/リセット/シーク/歌詞トグル/自分の声再生 |
| `MeterPanel` | 音量(dB)・音程(Hz)メーター（録音中のみ） |
| `ScorePanel` | 採点結果（総合点・ランク・星・4項目内訳） |
| `HistoryList` | 練習記録（localStorage 永続化） |

### PitchGraph 描画仕様（旧 drawScroll と同一の見た目）

- 背景 `#12122a`、高さ510px（歌詞帯 LYRIC_H=110px を含む）、Retina対応（offsetWidth×2）
- 表示範囲: 全フレームの4%（最低40フレーム）、現在位置縦線は左から28%
- 先生ライン: `#fbbf24` 幅5・グロー、smooth配列を描画
- 先生の玉 `#fde68a`・自分の玉 `#93c5fd`: 半径13・白枠・グロー、EMA平滑化 alpha=0.08
- グリッド4分割＋音名/Hz ラベル、歌詞は下帯中央に黄色で表示
- 描画は `drawGraph(ctx, state)` の純粋な描画関数に分離し、コンポーネントは薄く保つ

## 採点・表示の互換性

UIの文言・色・レイアウトは旧 `archive/鯨唄練習アプリv10.html` を踏襲する
（利用者は高齢の学習者。見た目を大きく変えないこと）。

## テスト方針

- `core/` は全関数をユニットテスト（境界値含む）
- `storage/` は localStorage モックでテスト
- コンポーネントは最低限のスモークテスト（レンダリングと主要ボタンの活性制御）
- 音声API（AudioContext, getUserMedia）はテスト対象外（手動確認）

## 曲の増やし方

1. `src/songs/<song-id>/audio.b64` に MP3 の base64 を置く（改行なし1行）
2. `src/songs/<song-id>/index.ts` で `Song` を定義
3. `src/songs/index.ts` の `songs` 配列に追加

以上でセレクタ・解析・採点すべてに自動対応する。
