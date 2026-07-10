import type { Song } from '../songs/types';

export interface SongSelectorProps {
  songs: Song[];
  selectedId: string;
  onChange: (id: string) => void;
}

/** 曲が2曲以上のときのみ表示するセレクタ（1曲なら何も出さない）。 */
export function SongSelector({ songs, selectedId, onChange }: SongSelectorProps) {
  if (songs.length < 2) return null;

  return (
    <div className="card">
      <div className="section-label">曲を選ぶ</div>
      <select value={selectedId} onChange={(e) => onChange(e.target.value)}>
        {songs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
    </div>
  );
}
