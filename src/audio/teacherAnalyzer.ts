import { DEFAULT_ANALYSIS_CONFIG, type AnalysisConfig } from '../core/config';
import { autocorrelate } from '../core/pitch';
import { movingAvg } from '../core/smoothing';
import { detectRange } from '../core/range';

export interface TeacherAnalysis {
  /** フレームごとの基本周波数 */
  pitches: (number | null)[];
  /** movingAvg(pitches, 25) */
  smooth: (number | null)[];
  /** フレーム間隔秒数 (= hopSize / sampleRate) */
  hopSec: number;
  minF: number;
  maxF: number;
  /** 解析対象の長さ（endSecでカット後） */
  durationSec: number;
}

interface AudioContextConstructor {
  new (options?: AudioContextOptions): AudioContext;
}

function getAudioContextCtor(): AudioContextConstructor {
  const w = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!ctor) throw new Error('このブラウザは音声解析に対応していません');
  return ctor;
}

/**
 * MP3のArrayBufferをオフライン解析し、フレームごとの基本周波数配列を作る。
 * decodeAudioData は渡された ArrayBuffer を detach する可能性があるため、
 * 呼び出し元のバッファを壊さないよう内部でコピーしてから使う。
 */
export async function analyzeTeacherAudio(
  audioData: ArrayBuffer,
  opts: {
    endSec?: number;
    config?: AnalysisConfig;
    onProgress?: (pct: number) => void;
  } = {},
): Promise<TeacherAnalysis> {
  const cfg = opts.config ?? DEFAULT_ANALYSIS_CONFIG;
  const AudioContextCtor = getAudioContextCtor();
  const audioCtx = new AudioContextCtor();

  let decoded: AudioBuffer;
  try {
    decoded = await audioCtx.decodeAudioData(audioData.slice(0));
  } finally {
    await audioCtx.close();
  }

  const sr = decoded.sampleRate;
  const data = decoded.getChannelData(0);
  const { frameSize, hopSize } = cfg;
  const hopSec = hopSize / sr;
  const pitches: (number | null)[] = [];

  // チャンク処理でUIをブロックしない（旧実装と同一の chunkSize=500）
  const chunkSize = 500;
  const totalFrames = Math.max(0, Math.floor((data.length - frameSize) / hopSize));
  for (let chunk = 0; chunk * chunkSize < totalFrames; chunk++) {
    const start = chunk * chunkSize;
    const end = Math.min(start + chunkSize, totalFrames);
    for (let fi = start; fi < end; fi++) {
      const i = fi * hopSize;
      const frame = data.subarray(i, i + frameSize);
      pitches.push(autocorrelate(frame, sr, cfg));
    }
    const pct = Math.round((end / totalFrames) * 100);
    opts.onProgress?.(pct);
    await new Promise((r) => setTimeout(r, 0));
  }
  opts.onProgress?.(100);

  const endFrame = opts.endSec !== undefined ? Math.ceil(opts.endSec / hopSec) : pitches.length;
  const cut = pitches.slice(0, endFrame);
  const smooth = movingAvg(cut, 25);
  const { minF, maxF } = detectRange(cut);
  const durationSec = cut.length * hopSec;

  return { pitches: cut, smooth, hopSec, minF, maxF, durationSec };
}
