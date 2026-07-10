/**
 * 秒数を 'm:ss' 形式の文字列に整形する（例: 75 → '1:15'）。
 * null・undefined・NaN・0・負値は '0:00' を返す。
 */
export function formatTime(sec: number | null | undefined): string {
  if (!sec || Number.isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}
