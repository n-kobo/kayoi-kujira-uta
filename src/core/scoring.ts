import { calcSimilarity } from './similarity';

/** 1回の練習セッションで蓄積した生データ。 */
export interface SessionData {
  /** 自分のピッチ配列（フレームごと、無音は null） */
  pitches: (number | null)[];
  /** dB値。-50より大きいもの（無音でない区間）のみを想定 */
  vols: number[];
  /** 発声できた秒数 */
  durationSec: number;
}

/** 採点結果。旧 showScore の出力項目をそのまま構造化したもの。 */
export interface ScoreResult {
  /** 総合点 0-100 */
  total: number;
  /** 節回しの近さ（40%） */
  shape: number;
  /** 音量・強弱（20%） */
  volume: number;
  /** 継続・伸び（20%） */
  duration: number;
  /** 声の安定（20%） */
  stability: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  stars: string;
  message: string;
  color: string;
}

/**
 * 練習セッションを4項目（節回し40%・音量20%・継続20%・安定20%）で採点する。
 * teacherPitches が null（先生音源が未解析）の場合、節回しは50点固定とする。
 * ランク・メッセージ・色・星は旧 showScore と同一の文言・配色を維持する。
 */
export function computeScore(
  session: SessionData,
  teacherPitches: (number | null)[] | null,
  opts: { baseDurationSec?: number } = {},
): ScoreResult {
  const baseDurationSec = opts.baseDurationSec ?? 30;
  const { pitches, vols, durationSec } = session;

  const vV = vols.filter((v) => v > -50);
  const vP = pitches.filter((p): p is number => !!p);

  const avgVol = vV.length ? vV.reduce((a, b) => a + b, 0) / vV.length : -60;
  const sVol = Math.min(Math.round(Math.max(((avgVol + 40) / 20) * 100, 10)), 100);

  const sDur = Math.min(
    Math.round(Math.max((durationSec / baseDurationSec) * 100, 5)),
    100,
  );

  let stab = 50;
  if (vP.length > 3) {
    const diffs = vP.slice(1).map((v, i) => Math.abs(v - vP[i]));
    stab = Math.round(
      Math.max(100 - (diffs.reduce((a, b) => a + b, 0) / diffs.length) * 1.2, 10),
    );
  }
  const sPitch = Math.min(stab, 100);

  const sShape = teacherPitches ? calcSimilarity(teacherPitches, pitches) : 50;

  const total = Math.round(sShape * 0.4 + sVol * 0.2 + sDur * 0.2 + sPitch * 0.2);

  let rank: ScoreResult['rank'];
  let message: string;
  let stars: string;
  let color: string;
  if (total >= 90) {
    rank = 'S';
    message = '完璧！先生の節回しそのまま！';
    stars = '★★★★★';
    color = '#1d9e75';
  } else if (total >= 78) {
    rank = 'A';
    message = '上手い！節回しがよく合っている';
    stars = '★★★★☆';
    color = '#378add';
  } else if (total >= 65) {
    rank = 'B';
    message = 'だいぶ近づいてきた！あと少し';
    stars = '★★★☆☆';
    color = '#ba7517';
  } else if (total >= 50) {
    rank = 'C';
    message = '練習を重ねると形が見えてくる';
    stars = '★★☆☆☆';
    color = '#888780';
  } else {
    rank = 'D';
    message = '今日の第一歩！毎日少しずつ';
    stars = '★☆☆☆☆';
    color = '#d4537e';
  }

  return {
    total,
    shape: sShape,
    volume: sVol,
    duration: sDur,
    stability: sPitch,
    rank,
    stars,
    message,
    color,
  };
}
