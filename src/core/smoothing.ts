/**
 * null を無視する中心移動平均。窓内の有効値（null 以外）の平均を返す。
 * 窓内が全て null の場合はその位置の結果も null になる。
 */
export function movingAvg(
  arr: (number | null)[],
  windowSize: number,
): (number | null)[] {
  return arr.map((_, i) => {
    const s = Math.max(0, i - Math.floor(windowSize / 2));
    const e = Math.min(arr.length - 1, i + Math.floor(windowSize / 2));
    const vals: number[] = [];
    for (let j = s; j <= e; j++) {
      const v = arr[j];
      if (v !== null) vals.push(v);
    }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });
}

/**
 * 指数移動平均(EMA)の1ステップ更新。
 * prev が null の場合は初期値として target をそのまま返す。
 */
export function emaStep(
  prev: number | null,
  target: number,
  alpha: number,
): number {
  return prev === null ? target : prev + (target - prev) * alpha;
}

/**
 * リアルタイム表示用のローリングバッファ（旧 MY_BUF=8 相当）。
 * 直近 size 件のピッチ値を保持し、有効値（null 以外）が半数以上あれば
 * その平均を返す。旧実装の `bValid.length>=MY_BUF/2` 判定と同一仕様。
 */
export class RollingPitchBuffer {
  private readonly size: number;
  private buf: (number | null)[] = [];

  constructor(size = 8) {
    this.size = size;
  }

  /** 新しい値をバッファに追加する。size を超えた古い値は捨てる。 */
  push(value: number | null): void {
    this.buf.push(value);
    if (this.buf.length > this.size) this.buf.shift();
  }

  /** 有効値が半数以上あれば平均、なければ null を返す。 */
  average(): number | null {
    const valid = this.buf.filter((v): v is number => v !== null);
    return valid.length >= this.size / 2
      ? valid.reduce((a, b) => a + b, 0) / valid.length
      : null;
  }

  /** バッファを空にする。 */
  reset(): void {
    this.buf = [];
  }
}
