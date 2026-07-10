/**
 * ピッチ解析まわりの設定値。
 * 旧実装（archive/鯨唄練習アプリv10.html）のハードコード値をそのまま踏襲する。
 */
export interface AnalysisConfig {
  /** 自己相関に使うフレームサイズ（サンプル数） */
  frameSize: number;
  /** フレーム間の間隔（サンプル数） */
  hopSize: number;
  /** 検出対象周波数の下限(Hz)。これ未満は無効値として扱う */
  minFreq: number;
  /** 検出対象周波数の上限(Hz)。これを超えたら無効値として扱う */
  maxFreq: number;
  /** RMSがこの値未満なら無音とみなす */
  rmsThreshold: number;
  /** 自己相関値がこの値を超えたら有効なピークとみなす閾値 */
  corrThreshold: number;
}

/** 既定の解析設定。旧実装の定数と一致させている。 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  frameSize: 2048,
  hopSize: 512,
  minFreq: 40,
  maxFreq: 3000,
  rmsThreshold: 0.006,
  corrThreshold: 0.86,
};
