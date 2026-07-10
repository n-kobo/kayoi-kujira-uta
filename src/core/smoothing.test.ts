import { describe, expect, it } from 'vitest';
import { emaStep, movingAvg, RollingPitchBuffer } from './smoothing';

describe('movingAvg', () => {
  it('null を無視して窓内平均を計算する', () => {
    const result = movingAvg([100, null, 200, null, 300], 2);
    // 半径 floor(2/2)=1 の窓（例: i=1 は index0-2 の [100,null,200] -> 有効値平均150）
    expect(result).toEqual([100, 150, 200, 250, 300]);
  });

  it('窓内が全て null なら null', () => {
    const result = movingAvg([null, null, null], 1);
    expect(result).toEqual([null, null, null]);
  });

  it('空配列は空配列', () => {
    expect(movingAvg([], 5)).toEqual([]);
  });

  it('windowSize=0 でも例外を投げない（各要素そのまま扱う）', () => {
    expect(() => movingAvg([1, 2, 3], 0)).not.toThrow();
    expect(movingAvg([1, 2, 3], 0)).toEqual([1, 2, 3]);
  });
});

describe('emaStep', () => {
  it('prev が null なら target をそのまま返す', () => {
    expect(emaStep(null, 42, 0.08)).toBe(42);
  });

  it('prev がある場合は alpha で補間する', () => {
    // 100 + (200-100)*0.5 = 150
    expect(emaStep(100, 200, 0.5)).toBe(150);
  });

  it('alpha=0 なら prev を維持する', () => {
    expect(emaStep(100, 999, 0)).toBe(100);
  });

  it('alpha=1 なら target に即座に一致する', () => {
    expect(emaStep(100, 999, 1)).toBe(999);
  });
});

describe('RollingPitchBuffer', () => {
  it('有効値が半数以上なら平均を返す（既定size=8）', () => {
    const buf = new RollingPitchBuffer();
    [100, 100, 100, 100, null, null, null].forEach((v) => buf.push(v));
    // 4 valid / 7 pushed(<8) -> 4 >= 8/2=4 -> average
    expect(buf.average()).toBe(100);
  });

  it('有効値が半数未満なら null', () => {
    const buf = new RollingPitchBuffer(8);
    [100, 100, null, null, null, null, null, null].forEach((v) => buf.push(v));
    expect(buf.average()).toBeNull();
  });

  it('size を超えると古い値を捨てる', () => {
    const buf = new RollingPitchBuffer(3);
    buf.push(100);
    buf.push(100);
    buf.push(100);
    buf.push(200); // 100 が1つ押し出される -> [100,100,200]
    expect(buf.average()).toBeCloseTo((100 + 100 + 200) / 3);
  });

  it('reset するとバッファが空になり null を返す', () => {
    const buf = new RollingPitchBuffer(4);
    buf.push(100);
    buf.push(100);
    buf.reset();
    expect(buf.average()).toBeNull();
  });

  it('空バッファは null', () => {
    const buf = new RollingPitchBuffer();
    expect(buf.average()).toBeNull();
  });
});
