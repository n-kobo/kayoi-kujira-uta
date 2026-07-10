import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appendRecord, loadHistory, saveHistory, type PracticeRecord } from './history';

const KEY = 'kujira-uta:history:v1';

const sample: PracticeRecord = {
  dateLabel: '7/10 15:04',
  score: 88,
  rank: 'A',
  color: '#378add',
  songId: 'iwai-medeta',
};

describe('storage/history', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadHistory', () => {
    it('未保存なら空配列', () => {
      expect(loadHistory()).toEqual([]);
    });

    it('保存済みデータをそのまま返す', () => {
      localStorage.setItem(KEY, JSON.stringify([sample]));
      expect(loadHistory()).toEqual([sample]);
    });

    it('壊れたJSONは空配列', () => {
      localStorage.setItem(KEY, '{not valid json');
      expect(loadHistory()).toEqual([]);
    });

    it('配列でないJSON（オブジェクト）は空配列', () => {
      localStorage.setItem(KEY, JSON.stringify({ foo: 'bar' }));
      expect(loadHistory()).toEqual([]);
    });

    it('localStorage.getItem が例外を投げても空配列を返す', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(loadHistory()).toEqual([]);
    });
  });

  describe('saveHistory', () => {
    it('localStorage に保存する', () => {
      saveHistory([sample]);
      expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([sample]);
    });

    it('localStorage.setItem が例外を投げても例外を漏らさない', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      expect(() => saveHistory([sample])).not.toThrow();
    });
  });

  describe('appendRecord', () => {
    it('先頭に追加して返す', () => {
      saveHistory([sample]);
      const second: PracticeRecord = { ...sample, score: 95, rank: 'S' };
      const result = appendRecord(second);
      expect(result).toEqual([second, sample]);
    });

    it('保存内容にも反映される', () => {
      appendRecord(sample);
      expect(loadHistory()).toEqual([sample]);
    });

    it('localStorage が使えなくても返り値は正しい', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const result = appendRecord(sample);
      expect(result).toEqual([sample]);
    });
  });
});
