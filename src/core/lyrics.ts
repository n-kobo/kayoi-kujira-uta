import type { LyricLine } from '../songs/types';

/**
 * 現在の再生秒数に対応する歌詞のインデックスを返す。
 * lyrics は sec 昇順を前提とし、currentSec 以下で最後に開始した行を選ぶ。
 * まだどの行も開始していない場合（曲の先頭・空配列など）は -1。
 */
export function currentLyricIndex(lyrics: LyricLine[], currentSec: number): number {
  let idx = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].sec <= currentSec) idx = i;
  }
  return idx;
}
