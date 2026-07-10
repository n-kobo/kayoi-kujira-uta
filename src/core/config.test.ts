import { describe, expect, it } from 'vitest';
import { DEFAULT_ANALYSIS_CONFIG } from './config';

describe('DEFAULT_ANALYSIS_CONFIG', () => {
  it('旧実装のハードコード値と一致する', () => {
    expect(DEFAULT_ANALYSIS_CONFIG).toEqual({
      frameSize: 2048,
      hopSize: 512,
      minFreq: 40,
      maxFreq: 3000,
      rmsThreshold: 0.006,
      corrThreshold: 0.86,
    });
  });
});
