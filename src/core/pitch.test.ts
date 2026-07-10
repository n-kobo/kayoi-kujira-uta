import { describe, expect, it } from 'vitest';
import { DEFAULT_ANALYSIS_CONFIG } from './config';
import { autocorrelate, freqToNote, NOTES } from './pitch';

function sineWave(freq: number, sampleRate: number, length: number, amp = 0.5): Float32Array {
  const buf = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buf[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

describe('autocorrelate', () => {
  const sampleRate = 44100;
  const length = 2048;

  it('純音の基本周波数を検出できる（誤差5%以内）', () => {
    const buf = sineWave(220, sampleRate, length);
    const freq = autocorrelate(buf, sampleRate);
    expect(freq).not.toBeNull();
    expect(freq!).toBeGreaterThan(220 * 0.95);
    expect(freq!).toBeLessThan(220 * 1.05);
  });

  it('無音（全ゼロ）は null を返す', () => {
    const buf = new Float32Array(length);
    expect(autocorrelate(buf, sampleRate)).toBeNull();
  });

  it('RMSが閾値未満の極小振幅は null を返す', () => {
    const buf = sineWave(220, sampleRate, length, 0.0001);
    expect(autocorrelate(buf, sampleRate)).toBeNull();
  });

  it('検出周波数が cfg.maxFreq を超える場合は null', () => {
    const buf = sineWave(1000, sampleRate, length);
    const cfg = { ...DEFAULT_ANALYSIS_CONFIG, maxFreq: 500 };
    expect(autocorrelate(buf, sampleRate, cfg)).toBeNull();
  });

  it('検出周波数が cfg.minFreq 未満の場合は null', () => {
    const buf = sineWave(60, sampleRate, length);
    const cfg = { ...DEFAULT_ANALYSIS_CONFIG, minFreq: 500 };
    expect(autocorrelate(buf, sampleRate, cfg)).toBeNull();
  });

  it('空配列に近い極短バッファでも例外を投げない', () => {
    const buf = new Float32Array(4);
    expect(() => autocorrelate(buf, sampleRate)).not.toThrow();
  });
});

describe('freqToNote', () => {
  // freqToNote は 440Hz を基準(NOTES[0]='C')に半音単位で丸めるため、
  // 一般的な音名（A=440Hz）とはずれる。旧実装と同じ丸め結果になることを確認する。
  it('440Hz は基準音であり C を返す', () => {
    expect(freqToNote(440)).toBe('C');
  });

  it('1オクターブ上（880Hz）でも同じ音名になる', () => {
    expect(freqToNote(880)).toBe(freqToNote(440));
  });

  it('null は null', () => {
    expect(freqToNote(null)).toBeNull();
  });

  it('0 は null', () => {
    expect(freqToNote(0)).toBeNull();
  });

  it('40Hz未満は null', () => {
    expect(freqToNote(39)).toBeNull();
  });

  it('3000Hzを超える場合は null', () => {
    expect(freqToNote(3001)).toBeNull();
  });
});

describe('NOTES', () => {
  it('12音・Cから始まる', () => {
    expect(NOTES.length).toBe(12);
    expect(NOTES[0]).toBe('C');
    expect(NOTES[NOTES.length - 1]).toBe('B');
  });
});
