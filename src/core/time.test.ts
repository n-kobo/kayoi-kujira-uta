import { describe, expect, it } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
  it('75秒は 1:15', () => {
    expect(formatTime(75)).toBe('1:15');
  });

  it('9秒は 0:09（秒はゼロ埋め）', () => {
    expect(formatTime(9)).toBe('0:09');
  });

  it('0秒は 0:00', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('null は 0:00', () => {
    expect(formatTime(null)).toBe('0:00');
  });

  it('undefined は 0:00', () => {
    expect(formatTime(undefined)).toBe('0:00');
  });

  it('NaN は 0:00', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  it('負値は 0:00', () => {
    expect(formatTime(-5)).toBe('0:00');
  });

  it('60秒ちょうどは 1:00', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('小数は切り捨てる', () => {
    expect(formatTime(75.9)).toBe('1:15');
  });

  it('分が2桁でも正しく表示する', () => {
    expect(formatTime(3723)).toBe('62:03');
  });
});
