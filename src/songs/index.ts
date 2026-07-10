import type { Song } from './types';
import { iwaiMedeta } from './iwai-medeta';

export type { Song, LyricLine } from './types';

/**
 * 曲レジストリ。新しい鯨唄を追加したら、ここに import して配列へ足すだけで
 * 曲選択UIに自動で反映される。
 */
export const songs: Song[] = [iwaiMedeta];

export function getSongById(id: string): Song | undefined {
  return songs.find((s) => s.id === id);
}
