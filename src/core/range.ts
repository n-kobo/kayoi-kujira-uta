/**
 * ピッチ配列から表示・採点用の音域(Hz)を推定する。
 * 有効値（null 以外）を昇順に並べ、2〜98パーセンタイルの範囲に
 * 上下10%のマージンを付けて返す。旧実装の音域自動検出ロジックと同一。
 * 有効値が10個以下の場合は外れ値の影響が大きいため既定値にフォールバックする。
 */
export function detectRange(
  pitches: (number | null)[],
): { minF: number; maxF: number } {
  const valid = pitches
    .filter((p): p is number => p !== null && !Number.isNaN(p))
    .sort((a, b) => a - b);

  if (valid.length <= 10) {
    return { minF: 80, maxF: 600 };
  }

  const minF = valid[Math.floor(valid.length * 0.02)] * 0.9;
  const maxF = valid[Math.floor(valid.length * 0.98)] * 1.1;
  return { minF, maxF };
}
