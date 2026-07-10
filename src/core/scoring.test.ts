import { describe, expect, it } from 'vitest';
import { computeScore, type SessionData } from './scoring';

describe('computeScore', () => {
  it('全項目満点なら total=100・ランクS', () => {
    const pitches = new Array(10).fill(220); // 一定値 -> diffs=0 -> stability満点
    const vols = new Array(10).fill(40); // avgVol=40 -> volume満点
    const session: SessionData = { pitches, vols, durationSec: 30 };
    const result = computeScore(session, pitches); // teacher=自分と同一 -> shape満点
    expect(result.shape).toBe(100);
    expect(result.volume).toBe(100);
    expect(result.duration).toBe(100);
    expect(result.stability).toBe(100);
    expect(result.total).toBe(100);
    expect(result.rank).toBe('S');
    expect(result.message).toBe('完璧！先生の節回しそのまま！');
    expect(result.color).toBe('#1d9e75');
    expect(result.stars).toBe('★★★★★');
  });

  it('teacherPitches が null なら shape は50固定、他が満点でランクA', () => {
    const pitches = new Array(10).fill(220);
    const vols = new Array(10).fill(40);
    const session: SessionData = { pitches, vols, durationSec: 30 };
    const result = computeScore(session, null);
    expect(result.shape).toBe(50);
    expect(result.total).toBe(80);
    expect(result.rank).toBe('A');
  });

  it('有効ピッチが3個以下なら安定度は50固定でランクB相当になる', () => {
    const session: SessionData = { pitches: [220, null, 220], vols: new Array(5).fill(40), durationSec: 30 };
    const result = computeScore(session, null);
    expect(result.stability).toBe(50);
    expect(result.total).toBe(70);
    expect(result.rank).toBe('B');
  });

  it('低い音量・短い継続でちょうどランクC境界(50点)になる', () => {
    const session: SessionData = {
      pitches: [220, 220], // 有効値2個(<=3) -> stability=50
      vols: new Array(5).fill(-30),
      durationSec: 15,
    };
    const result = computeScore(session, null, { baseDurationSec: 30 });
    expect(result.volume).toBe(50);
    expect(result.duration).toBe(50);
    expect(result.total).toBe(50);
    expect(result.rank).toBe('C');
  });

  it('無音・無データ（空配列・duration0）はランクDになる', () => {
    const session: SessionData = { pitches: [], vols: [], durationSec: 0 };
    const result = computeScore(session, null);
    expect(result.volume).toBe(10); // 下限クランプ
    expect(result.duration).toBe(5); // 下限クランプ
    expect(result.stability).toBe(50); // デフォルト
    expect(result.shape).toBe(50); // teacher null
    expect(result.total).toBe(33);
    expect(result.rank).toBe('D');
    expect(result.message).toBe('今日の第一歩！毎日少しずつ');
    expect(result.color).toBe('#d4537e');
  });

  it('vols の -50以下は音量平均から除外される', () => {
    const session: SessionData = {
      pitches: [220, 220],
      vols: [-60, -60, 40], // -60は除外され40のみ有効
      durationSec: 30,
    };
    const result = computeScore(session, null);
    expect(result.volume).toBe(100);
  });

  it('ピッチが安定しているほど stability が高い（変動が大きいと低い）', () => {
    const stableSession: SessionData = {
      pitches: [220, 221, 220, 219, 220, 221],
      vols: [],
      durationSec: 1,
    };
    const unstableSession: SessionData = {
      pitches: [100, 500, 100, 500, 100, 500],
      vols: [],
      durationSec: 1,
    };
    const stable = computeScore(stableSession, null);
    const unstable = computeScore(unstableSession, null);
    expect(stable.stability).toBeGreaterThan(unstable.stability);
    expect(unstable.stability).toBeGreaterThanOrEqual(10); // 下限クランプ
  });

  it('baseDurationSec を指定すると継続スコアの基準が変わる', () => {
    const session: SessionData = { pitches: [], vols: [], durationSec: 15 };
    const withBase15 = computeScore(session, null, { baseDurationSec: 15 });
    const withBase30 = computeScore(session, null, { baseDurationSec: 30 });
    expect(withBase15.duration).toBe(100);
    expect(withBase30.duration).toBe(50);
  });
});
