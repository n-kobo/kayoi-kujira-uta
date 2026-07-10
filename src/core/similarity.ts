/**
 * 節回し一致度を0〜100で返す。
 * teacherPitches・myPitches のフレーム数が異なっても比率で対応付ける
 * （myPitches[Math.floor(i/total*myPitches.length)]）。
 * 双方の有効値がそれぞれ10個を超える場合のみ、平均音程差からキーオフセット
 * （半音単位）を算出して補正する。旧 calcSimilarity と同一仕様。
 * 半音差 <2 → 1点, <4 → 0.5点, それ以上は0点として平均を100点満点に換算する。
 */
export function calcSimilarity(
  teacherPitches: (number | null)[],
  myPitches: (number | null)[],
): number {
  const total = teacherPitches.length;
  if (total === 0 || myPitches.length === 0) return 0;

  const tValid = teacherPitches.filter((p): p is number => !!p);
  const mValid = myPitches.filter((p): p is number => !!p);

  let keyOffset = 0;
  if (tValid.length > 10 && mValid.length > 10) {
    const tAvg = tValid.reduce((a, b) => a + b, 0) / tValid.length;
    const mAvg = mValid.reduce((a, b) => a + b, 0) / mValid.length;
    keyOffset = 12 * Math.log2(mAvg / tAvg);
  }

  let match = 0;
  let count = 0;
  for (let i = 0; i < total; i++) {
    const tF = teacherPitches[i];
    if (!tF) continue;
    const mF = myPitches[Math.floor((i / total) * myPitches.length)] ?? null;
    if (!mF) {
      count++;
      continue;
    }
    const d = Math.abs(12 * Math.log2(mF / tF) - keyOffset);
    match += d < 2 ? 1 : d < 4 ? 0.5 : 0;
    count++;
  }
  return count > 0 ? Math.round((match / count) * 100) : 0;
}
