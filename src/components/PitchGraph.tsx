import { useEffect, useLayoutEffect, useRef } from 'react';
import type { LyricLine } from '../songs/types';
import { freqToNote } from '../core/pitch';
import { emaStep } from '../core/smoothing';
import { currentLyricIndex } from '../core/lyrics';

const LYRIC_H = 110;
const BALL_SMOOTH = 0.08;

/** PitchGraphの玉のEMA平滑化状態。フレームをまたいで保持する必要があるため
 * drawGraph の外（コンポーネント側のref）で管理し、この関数からは書き換えるだけにする。 */
export interface BallSmoothing {
  ty: number | null;
  my: number | null;
}

export interface PitchGraphState {
  teacherPitches: (number | null)[] | null;
  teacherSmooth: (number | null)[] | null;
  minF: number;
  maxF: number;
  hopSec: number;
  scrollPos: number;
  currentMyFreq: number | null;
  lyrics: LyricLine[];
  showLyrics: boolean;
  ballSmoothing: BallSmoothing;
}

/** 旧 drawScroll と同一の見た目で流れるグラフを描画する。 */
export function drawGraph(ctx: CanvasRenderingContext2D, state: PitchGraphState): void {
  const canvas = ctx.canvas;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#12122a';
  ctx.fillRect(0, 0, W, H);

  const graphH = H - LYRIC_H;
  const { minF, maxF } = state;

  const freqToY = (f: number | null): number | null => {
    if (!f) return null;
    const clamped = Math.min(Math.max(f, minF), maxF);
    return graphH - ((clamped - minF) / (maxF - minF)) * (graphH - 28) - 14;
  };

  // グリッド＋ラベル
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const y = 14 + ratio * (graphH - 28);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    const freq = maxF - (maxF - minF) * ratio;
    const note = freqToNote(freq);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = Math.round(graphH * 0.07) + 'px system-ui';
    ctx.textAlign = 'left';
    if (note) ctx.fillText(note + ' ' + Math.round(freq) + 'Hz', 6, y - 3);
  }

  // 歌詞エリア背景（下段）
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, graphH, W, LYRIC_H);

  const { teacherPitches, teacherSmooth } = state;
  if (!teacherPitches || teacherPitches.length === 0) return;

  const total = teacherPitches.length;
  const visFrames = Math.max(40, Math.floor(total * 0.04));
  const curXRatio = 0.28;
  const startFrame = Math.max(0, state.scrollPos - Math.floor(visFrames * curXRatio));
  const endFrame = Math.min(total - 1, startFrame + visFrames);
  const curX = Math.round(W * curXRatio);

  // 現在位置縦線（グラフエリアのみ）
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(curX, 0);
  ctx.lineTo(curX, graphH);
  ctx.stroke();
  ctx.setLineDash([]);

  const drawLine = (arr: (number | null)[], color: string, lw: number, glow: boolean) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    let started = false;
    for (let i = startFrame; i <= endFrame; i++) {
      const p = arr[i];
      if (!p) {
        started = false;
        continue;
      }
      const x = endFrame > startFrame ? ((i - startFrame) / (endFrame - startFrame)) * W : 0;
      const y = freqToY(p);
      if (y === null) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // 先生ライン（移動平均平滑化済み）
  drawLine(teacherSmooth ?? teacherPitches, '#fbbf24', 5, true);

  // 先生の現在〇
  const ball = state.ballSmoothing;
  const tNow = teacherPitches[state.scrollPos] ?? null;
  const ty = freqToY(tNow);
  if (ty !== null) {
    ball.ty = emaStep(ball.ty, ty, BALL_SMOOTH);
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(curX, ball.ty, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(curX, ball.ty, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    ball.ty = null;
  }

  // 自分の現在〇
  const my = freqToY(state.currentMyFreq);
  if (my !== null) {
    ball.my = emaStep(ball.my, my, BALL_SMOOTH);
    ctx.fillStyle = '#93c5fd';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(curX, ball.my, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(curX, ball.my, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    ball.my = null;
  }

  // 歌詞描画（下段 - showLyricsがtrueのときのみ）
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(0, graphH + 1);
  ctx.lineTo(W, graphH + 1);
  ctx.stroke();

  if (state.showLyrics) {
    const currentSec = state.scrollPos * state.hopSec;
    const idx = currentLyricIndex(state.lyrics, currentSec);
    const lyricCY = graphH + LYRIC_H * 0.64;
    const bigFont = Math.round(LYRIC_H * 0.36) + 'px system-ui';
    if (idx >= 0) {
      ctx.font = 'bold ' + bigFont;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255,200,0,0.6)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(255,240,55,1.0)';
      ctx.fillText(state.lyrics[idx].text, W * 0.5, lyricCY);
      ctx.shadowBlur = 0;
    }
  }
}

export interface PitchGraphProps {
  teacherPitches: (number | null)[] | null;
  teacherSmooth: (number | null)[] | null;
  minF: number;
  maxF: number;
  hopSec: number;
  scrollPos: number;
  currentMyFreq: number | null;
  lyrics: LyricLine[];
  showLyrics: boolean;
  /** 増分するたびに玉のEMA平滑化状態をリセットする（シーク・リセット時） */
  resetSignal: number;
}

export function PitchGraph(props: PitchGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizedRef = useRef(false);
  const ballRef = useRef<BallSmoothing>({ ty: null, my: null });

  useEffect(() => {
    ballRef.current = { ty: null, my: null };
  }, [props.resetSignal]);

  // Retina対応: offsetWidth*2 で実寸に合わせる（初回のみ）
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sizedRef.current) return;
    canvas.width = canvas.offsetWidth > 0 ? canvas.offsetWidth * 2 : 680;
    canvas.height = 510;
    sizedRef.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGraph(ctx, {
      teacherPitches: props.teacherPitches,
      teacherSmooth: props.teacherSmooth,
      minF: props.minF,
      maxF: props.maxF,
      hopSec: props.hopSec,
      scrollPos: props.scrollPos,
      currentMyFreq: props.currentMyFreq,
      lyrics: props.lyrics,
      showLyrics: props.showLyrics,
      ballSmoothing: ballRef.current,
    });
  });

  return (
    <div className="graph-outer">
      <canvas ref={canvasRef} id="scrollCanvas" height={510} width={1214} />
    </div>
  );
}
