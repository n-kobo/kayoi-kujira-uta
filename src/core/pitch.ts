import { DEFAULT_ANALYSIS_CONFIG, type AnalysisConfig } from './config';

/** 音名テーブル（C起点の半音階12音）。旧実装と同一の並び。 */
export const NOTES: readonly string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

/**
 * 自己相関法(ACF)による基本周波数(Hz)検出。
 * 旧実装（archive/鯨唄練習アプリv10.html の autocorrelate）と同一アルゴリズム。
 * RMSが閾値未満（無音）、相関が閾値を超えるピークが見つからない、
 * あるいは検出周波数が cfg.minFreq〜cfg.maxFreq の範囲外の場合は null を返す。
 */
export function autocorrelate(
  buf: Float32Array,
  sampleRate: number,
  cfg: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG,
): number | null {
  const SIZE = buf.length;
  const MAX = Math.floor(SIZE / 2);
  let best = -1;
  let bestCorr = 0;
  let rms = 0;
  let foundGood = false;
  let last = 1;

  for (let i = 0; i < SIZE; i++) {
    const v = buf[i];
    rms += v * v;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < cfg.rmsThreshold) return null;

  const corrs = new Array<number>(MAX);
  for (let o = 1; o < MAX; o++) {
    let c = 0;
    for (let i = 0; i < MAX; i++) c += Math.abs(buf[i] - buf[i + o]);
    c = 1 - c / MAX;
    corrs[o] = c;
    if (c > cfg.corrThreshold && c > last) {
      foundGood = true;
      if (c > bestCorr) {
        bestCorr = c;
        best = o;
      }
    } else if (foundGood) {
      const shift =
        best > 0 && best < MAX - 1
          ? (corrs[best + 1] - corrs[best - 1]) / corrs[best] / 2
          : 0;
      return clampFreq(sampleRate / (best + 8 * shift), cfg);
    }
    last = c;
  }
  if (bestCorr > 0.01 && best > 0) return clampFreq(sampleRate / best, cfg);
  return null;
}

function clampFreq(freq: number, cfg: AnalysisConfig): number | null {
  if (!Number.isFinite(freq)) return null;
  if (freq < cfg.minFreq || freq > cfg.maxFreq) return null;
  return freq;
}

/**
 * 周波数(Hz)を音名（C, C#, ... B）に変換する。
 * 40Hz未満・3000Hzを超える・0/NaN/null は null。
 */
export function freqToNote(freq: number | null): string | null {
  if (!freq || freq < 40 || freq > 3000) return null;
  const s = 12 * Math.log2(freq / 440);
  const n = ((Math.round(s) % 12) + 12) % 12;
  return NOTES[n];
}
