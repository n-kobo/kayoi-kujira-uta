import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Song } from '../songs/types';
import type { TeacherAnalysis } from '../audio/teacherAnalyzer';
import { MicRecorder } from '../audio/micRecorder';
import { RollingPitchBuffer } from '../core/smoothing';
import { calcSimilarity } from '../core/similarity';
import { computeScore, type ScoreResult, type SessionData } from '../core/scoring';

export type PracticeMode = 'idle' | 'playing' | 'recording' | 'recorded';

export interface UsePracticeSessionResult {
  mode: PracticeMode;
  /** <audio> 要素（先生の音源）に接続するref */
  audioRef: RefObject<HTMLAudioElement | null>;
  scrollPos: number;
  currentTimeSec: number;
  livePitch: number | null;
  liveDb: number;
  liveSimilarity: number | null;
  showLyrics: boolean;
  myVoiceUrl: string | null;
  isMyVoicePlaying: boolean;
  score: ScoreResult | null;
  /** シーク・リセットのたびに増分する。PitchGraphの玉のEMA平滑化リセットに使う */
  resetSignal: number;
  play: () => void;
  record: () => void;
  stop: () => void;
  reset: () => void;
  seekToStart: () => void;
  seekRelative: (delta: number) => void;
  toggleLyrics: () => void;
  scoreSession: () => ScoreResult | null;
  playMyVoice: () => void;
  stopMyVoice: () => void;
}

/**
 * 再生・録音・停止・シーク・採点のステートマシン。
 * requestAnimationFrame ループはこのフック内に閉じ込め、毎フレーム
 * scrollPos / livePitch / liveDb / liveSimilarity を更新する。
 */
export function usePracticeSession(song: Song, analysis: TeacherAnalysis | null): UsePracticeSessionResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micRef = useRef<MicRecorder | null>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<PracticeMode>('idle');
  const pitchBufRef = useRef(new RollingPitchBuffer(8));
  const myPitchesRef = useRef<(number | null)[]>([]);
  const myVolsRef = useRef<number[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const myVoiceElRef = useRef<HTMLAudioElement | null>(null);
  const myVoiceUrlRef = useRef<string | null>(null);
  const sessionDataRef = useRef<SessionData | null>(null);

  const [mode, setMode] = useState<PracticeMode>('idle');
  const [scrollPos, setScrollPos] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [livePitch, setLivePitch] = useState<number | null>(null);
  const [liveDb, setLiveDb] = useState(-60);
  const [liveSimilarity, setLiveSimilarity] = useState<number | null>(null);
  const [showLyrics, setShowLyrics] = useState(true);
  const [myVoiceUrl, setMyVoiceUrl] = useState<string | null>(null);
  const [isMyVoicePlaying, setIsMyVoicePlaying] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const hopSec = analysis?.hopSec ?? 0;
  const teacherPitches = analysis?.pitches ?? null;
  const totalFrames = teacherPitches?.length ?? 0;
  const endSec = song.endSec ?? Infinity;

  const setModeBoth = (m: PracticeMode) => {
    modeRef.current = m;
    setMode(m);
  };

  const stopLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const finishRecording = async () => {
    stopLoop();
    audioRef.current?.pause();

    const mic = micRef.current;
    micRef.current = null;
    const blob = mic ? await mic.stop() : null;

    if (myVoiceUrlRef.current) {
      URL.revokeObjectURL(myVoiceUrlRef.current);
      myVoiceUrlRef.current = null;
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      myVoiceUrlRef.current = url;
      setMyVoiceUrl(url);
    } else {
      setMyVoiceUrl(null);
    }

    const durationSec =
      recordingStartRef.current !== null ? (Date.now() - recordingStartRef.current) / 1000 : 0;
    recordingStartRef.current = null;

    if (myPitchesRef.current.length > 0) {
      sessionDataRef.current = {
        pitches: [...myPitchesRef.current],
        vols: [...myVolsRef.current],
        durationSec,
      };
      setModeBoth('recorded');
    } else {
      sessionDataRef.current = null;
      setModeBoth('idle');
    }
  };

  const loop = () => {
    const audio = audioRef.current;
    if (!audio) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    const cur = audio.currentTime;

    if (cur >= endSec) {
      if (modeRef.current === 'recording') {
        void finishRecording();
      } else {
        stopLoop();
        audio.pause();
        setModeBoth('idle');
      }
      return;
    }

    if (hopSec > 0 && totalFrames > 0) {
      setScrollPos(Math.min(Math.floor(cur / hopSec), totalFrames - 1));
    }
    setCurrentTimeSec(cur);

    if (modeRef.current === 'recording' && micRef.current) {
      const frame = micRef.current.readFrame();
      myPitchesRef.current.push(frame.pitch);
      if (frame.db > -50) myVolsRef.current.push(frame.db);
      pitchBufRef.current.push(frame.pitch);
      setLivePitch(pitchBufRef.current.average());
      setLiveDb(frame.db);
      if (teacherPitches && myPitchesRef.current.length > 10) {
        setLiveSimilarity(calcSimilarity(teacherPitches, myPitchesRef.current));
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  const play = () => {
    if (!analysis || modeRef.current === 'playing' || modeRef.current === 'recording') return;
    const audio = audioRef.current;
    if (!audio) return;
    setScore(null);
    setResetSignal((v) => v + 1);
    setModeBoth('playing');
    void audio.play();
    stopLoop();
    rafRef.current = requestAnimationFrame(loop);
  };

  const record = () => {
    if (!analysis || modeRef.current === 'playing' || modeRef.current === 'recording') return;
    const audio = audioRef.current;
    if (!audio) return;

    void (async () => {
      try {
        const mic = new MicRecorder();
        await mic.start();
        micRef.current = mic;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        alert('マイクへのアクセスを許可してください。\n' + message);
        return;
      }

      myPitchesRef.current = [];
      myVolsRef.current = [];
      pitchBufRef.current.reset();
      sessionDataRef.current = null;
      recordingStartRef.current = Date.now();

      setScore(null);
      setLivePitch(null);
      setLiveDb(-60);
      setLiveSimilarity(null);
      setResetSignal((v) => v + 1);
      setModeBoth('recording');

      audio.currentTime = 0;
      void audio.play();
      stopLoop();
      rafRef.current = requestAnimationFrame(loop);
    })();
  };

  const stop = () => {
    if (modeRef.current === 'recording') {
      void finishRecording();
      return;
    }
    if (modeRef.current === 'playing') {
      stopLoop();
      audioRef.current?.pause();
      setModeBoth('idle');
    }
  };

  const reset = () => {
    stop();
    if (myVoiceElRef.current) {
      myVoiceElRef.current.pause();
      myVoiceElRef.current = null;
    }
    if (myVoiceUrlRef.current) {
      URL.revokeObjectURL(myVoiceUrlRef.current);
      myVoiceUrlRef.current = null;
    }
    setMyVoiceUrl(null);
    setIsMyVoicePlaying(false);
    myPitchesRef.current = [];
    myVolsRef.current = [];
    sessionDataRef.current = null;
    setScore(null);
    setModeBoth('idle');
    const audio = audioRef.current;
    if (audio) audio.currentTime = 0;
    setScrollPos(0);
    setCurrentTimeSec(0);
    setResetSignal((v) => v + 1);
  };

  const seekToStart = () => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = 0;
    setScrollPos(0);
    setCurrentTimeSec(0);
    setResetSignal((v) => v + 1);
  };

  const seekRelative = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const duration = audio.duration || 9999;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + delta, duration));
    if (hopSec > 0 && totalFrames > 0) {
      setScrollPos(Math.min(Math.floor(audio.currentTime / hopSec), totalFrames - 1));
    }
    setCurrentTimeSec(audio.currentTime);
    setResetSignal((v) => v + 1);
  };

  const toggleLyrics = () => setShowLyrics((v) => !v);

  const scoreSession = (): ScoreResult | null => {
    if (!sessionDataRef.current) return null;
    const result = computeScore(sessionDataRef.current, teacherPitches, {
      baseDurationSec: song.scoringDurationSec ?? 30,
    });
    setScore(result);
    return result;
  };

  const playMyVoice = () => {
    if (!myVoiceUrlRef.current) return;
    if (!myVoiceElRef.current) myVoiceElRef.current = new Audio();
    const el = myVoiceElRef.current;
    el.src = myVoiceUrlRef.current;
    el.onended = () => setIsMyVoicePlaying(false);
    void el.play();
    setIsMyVoicePlaying(true);
  };

  const stopMyVoice = () => {
    const el = myVoiceElRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setIsMyVoicePlaying(false);
  };

  // 曲切替時: 前回のセッション状態をクリアする
  useEffect(() => {
    myPitchesRef.current = [];
    myVolsRef.current = [];
    sessionDataRef.current = null;
    recordingStartRef.current = null;
    pitchBufRef.current.reset();
    setScore(null);
    setScrollPos(0);
    setCurrentTimeSec(0);
    setLivePitch(null);
    setLiveDb(-60);
    setLiveSimilarity(null);
    setMyVoiceUrl(null);
    setIsMyVoicePlaying(false);
    setModeBoth('idle');

    return () => {
      stopLoop();
      if (micRef.current) void micRef.current.stop();
      if (myVoiceUrlRef.current) {
        URL.revokeObjectURL(myVoiceUrlRef.current);
        myVoiceUrlRef.current = null;
      }
      if (myVoiceElRef.current) myVoiceElRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  return {
    mode,
    audioRef,
    scrollPos,
    currentTimeSec,
    livePitch,
    liveDb,
    liveSimilarity,
    showLyrics,
    myVoiceUrl,
    isMyVoicePlaying,
    score,
    resetSignal,
    play,
    record,
    stop,
    reset,
    seekToStart,
    seekRelative,
    toggleLyrics,
    scoreSession,
    playMyVoice,
    stopMyVoice,
  };
}
