import { describe, expect, it } from 'vitest';
import { detectRange } from './range';

describe('detectRange', () => {
  it('有効値が10個以下なら既定値 {minF:80, maxF:600} を返す', () => {
    expect(detectRange([])).toEqual({ minF: 80, maxF: 600 });
    expect(detectRange([100, null, 200])).toEqual({ minF: 80, maxF: 600 });
    const exactlyTen = Array.from({ length: 10 }, (_, i) => 100 + i);
    expect(detectRange(exactlyTen)).toEqual({ minF: 80, maxF: 600 });
  });

  it('全て null の場合も既定値', () => {
    expect(detectRange([null, null, null])).toEqual({ minF: 80, maxF: 600 });
  });

  it('有効値が11個超なら2〜98パーセンタイル±10%を返す', () => {
    // 1..100 の等差数列（100個）
    const pitches = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = detectRange(pitches);
    // sorted valid = [1..100], floor(100*0.02)=2 -> valid[2]=3, floor(100*0.98)=98 -> valid[98]=99
    expect(result.minF).toBeCloseTo(3 * 0.9);
    expect(result.maxF).toBeCloseTo(99 * 1.1);
  });

  it('null が混ざっていても有効値のみで計算する', () => {
    const pitches: (number | null)[] = [];
    for (let i = 1; i <= 100; i++) {
      pitches.push(i);
      pitches.push(null);
    }
    const result = detectRange(pitches);
    expect(result.minF).toBeCloseTo(3 * 0.9);
    expect(result.maxF).toBeCloseTo(99 * 1.1);
  });

  it('NaN は無効値として除外する', () => {
    const pitches = [NaN, NaN, ...Array.from({ length: 20 }, (_, i) => i + 100)];
    const result = detectRange(pitches);
    expect(Number.isNaN(result.minF)).toBe(false);
    expect(Number.isNaN(result.maxF)).toBe(false);
  });
});
