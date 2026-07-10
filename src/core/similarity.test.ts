import { describe, expect, it } from 'vitest';
import { calcSimilarity } from './similarity';

describe('calcSimilarity', () => {
  it('teacherPitches が空なら0', () => {
    expect(calcSimilarity([], [100, 200])).toBe(0);
  });

  it('myPitches が空なら0', () => {
    expect(calcSimilarity([100, 200], [])).toBe(0);
  });

  it('完全一致（同じ配列）なら100点', () => {
    const p = [220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220];
    expect(calcSimilarity(p, p)).toBe(100);
  });

  it('全フレームが半音4以上ずれていれば0点（キーオフセット補正は有効値10個以下だと働かない）', () => {
    // teacher=220Hz一定, my=440Hz一定（1オクターブ=12半音差）。
    // 有効値が10個以下なのでキーオフセット補正はスキップされ、差がそのまま反映される。
    const t = new Array(5).fill(220);
    const m = new Array(5).fill(440);
    expect(calcSimilarity(t, m)).toBe(0);
  });

  it('myPitches が teacherPitches より短くても比率で対応付けて計算する', () => {
    const t = new Array(20).fill(220);
    const m = new Array(5).fill(220);
    expect(calcSimilarity(t, m)).toBe(100);
  });

  it('キーオフセット補正: 全体が1オクターブ高くても形が同じなら高得点', () => {
    const base = [220, 233, 246, 262, 277, 294, 311, 330, 349, 370, 392, 415];
    const t = [...base, ...base]; // 24個 > 10
    const m = t.map((f) => f * 2); // 1オクターブ上（相対的な形は同一）
    expect(calcSimilarity(t, m)).toBe(100);
  });

  it('teacherPitches の null フレームはスキップされる', () => {
    const t = [220, null, 220, null, 220, null, 220, null, 220, null, 220, null];
    const m = [220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220, 220];
    expect(calcSimilarity(t, m)).toBe(100);
  });

  it('myPitches が対応位置で null なら count には含めるが match は増えない', () => {
    const t = [220, 220];
    const m = [null, null];
    expect(calcSimilarity(t, m)).toBe(0);
  });
});
