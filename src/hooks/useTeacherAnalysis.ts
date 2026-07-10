import { useEffect, useState } from 'react';
import type { Song } from '../songs/types';
import { b64ToArrayBuffer } from '../audio/base64';
import { analyzeTeacherAudio, type TeacherAnalysis } from '../audio/teacherAnalyzer';

export type TeacherAnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error';

export interface UseTeacherAnalysisResult {
  status: TeacherAnalysisStatus;
  progress: number;
  analysis: TeacherAnalysis | null;
  audioUrl: string | null;
  error: string | null;
}

/**
 * 曲を受け取り、audio要素用のBlob URLと解析結果(TeacherAnalysis)を用意する。
 * 曲切替・アンマウント時は生成したBlob URLを必ず revoke する。
 */
export function useTeacherAnalysis(song: Song): UseTeacherAnalysisResult {
  const [status, setStatus] = useState<TeacherAnalysisStatus>('analyzing');
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<TeacherAnalysis | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let localUrl: string | null = null;

    setStatus('analyzing');
    setProgress(0);
    setAnalysis(null);
    setAudioUrl(null);
    setError(null);

    (async () => {
      try {
        // ★ fetchせずにb64から直接ArrayBufferを生成する（iOS Safari対応）
        const ab = b64ToArrayBuffer(song.audioBase64);
        const blob = new Blob([ab], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        localUrl = url;
        if (cancelled) return;
        setAudioUrl(url);

        const result = await analyzeTeacherAudio(ab, {
          endSec: song.endSec,
          onProgress: (pct) => {
            if (!cancelled) setProgress(pct);
          },
        });
        if (cancelled) return;
        setAnalysis(result);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [song]);

  return { status, progress, analysis, audioUrl, error };
}
