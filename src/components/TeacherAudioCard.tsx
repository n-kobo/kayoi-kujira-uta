import type { RefObject } from 'react';
import type { Song } from '../songs/types';
import type { TeacherAnalysisStatus } from '../hooks/useTeacherAnalysis';

export interface TeacherAudioCardProps {
  song: Song;
  audioUrl: string | null;
  status: TeacherAnalysisStatus;
  progress: number;
  error: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
}

/** お手本プレーヤー（audio要素）+ 解析ステータスメッセージ。 */
export function TeacherAudioCard({ song, audioUrl, status, progress, error, audioRef }: TeacherAudioCardProps) {
  let msgClass = '';
  let msgText = '';
  if (status === 'error') {
    msgClass = 'error';
    msgText = 'エラー: ' + (error ?? '');
  } else if (status === 'analyzing') {
    msgClass = 'analyzing';
    msgText = '解析中... しばらくお待ちください' + (progress > 0 ? ` ${progress}%` : '');
  } else if (status === 'ready') {
    msgClass = 'analyzing';
    msgText = '準備完了！ 再生または録音を始めてください ✓';
  }

  return (
    <div className="card">
      <div className="section-label" style={{ fontSize: 16 }}>
        先生のお手本　{song.credit}
      </div>
      <audio ref={audioRef} src={audioUrl ?? undefined} controls />
      {msgClass !== '' && <div className={'analyze-msg ' + msgClass}>{msgText}</div>}
    </div>
  );
}
