import { describe, expect, it } from 'vitest';
import { currentLyricIndex } from './lyrics';
import type { LyricLine } from '../songs/types';

const lyrics: LyricLine[] = [
  { sec: 0, text: '一番' },
  { sec: 10, text: '二番' },
  { sec: 25, text: '三番' },
];

describe('currentLyricIndex', () => {
  it('開始前（最初の行の sec 未満）は -1', () => {
    expect(currentLyricIndex(lyrics, -1)).toBe(-1);
  });

  it('先頭行の sec ちょうどで0番目', () => {
    expect(currentLyricIndex(lyrics, 0)).toBe(0);
  });

  it('中間の秒数で該当する行を返す', () => {
    expect(currentLyricIndex(lyrics, 12)).toBe(1);
  });

  it('境界値（sec と完全一致）でその行が選ばれる', () => {
    expect(currentLyricIndex(lyrics, 10)).toBe(1);
  });

  it('最後の行以降はその行のまま', () => {
    expect(currentLyricIndex(lyrics, 999)).toBe(2);
  });

  it('空配列は常に -1', () => {
    expect(currentLyricIndex([], 100)).toBe(-1);
  });
});
