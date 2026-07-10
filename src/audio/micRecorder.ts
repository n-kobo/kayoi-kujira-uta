import { DEFAULT_ANALYSIS_CONFIG, type AnalysisConfig } from '../core/config';
import { autocorrelate } from '../core/pitch';

export interface MicFrame {
  /** autocorrelate の生値 */
  pitch: number | null;
  /** RMS→dB（無音は -60） */
  db: number;
}

interface AudioContextConstructor {
  new (options?: AudioContextOptions): AudioContext;
}

function getAudioContextCtor(): AudioContextConstructor {
  const w = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!ctor) throw new Error('このブラウザは録音に対応していません');
  return ctor;
}

/** マイク録音。AnalyserNode でリアルタイム解析、MediaRecorder で音声保存する。 */
export class MicRecorder {
  private readonly cfg: AnalysisConfig;
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timeDomainBuf: Float32Array | null = null;
  private active = false;

  constructor(cfg: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG) {
    this.cfg = cfg;
  }

  get isActive(): boolean {
    return this.active;
  }

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
    });
    const AudioContextCtor = getAudioContextCtor();
    const audioCtx = new AudioContextCtor({ latencyHint: 'interactive' });
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);

    this.chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    mediaRecorder.start(100);

    this.stream = stream;
    this.audioCtx = audioCtx;
    this.analyser = analyser;
    this.mediaRecorder = mediaRecorder;
    this.timeDomainBuf = new Float32Array(analyser.fftSize);
    this.active = true;
  }

  /** requestAnimationFrame ループから毎フレーム呼ぶ */
  readFrame(): MicFrame {
    if (!this.analyser || !this.audioCtx || !this.timeDomainBuf) {
      return { pitch: null, db: -60 };
    }
    const buf = this.timeDomainBuf;
    this.analyser.getFloatTimeDomainData(buf);
    let rms = 0;
    for (const v of buf) rms += v * v;
    rms = Math.sqrt(rms / buf.length);
    const db = rms > 0.0001 ? Math.round(20 * Math.log10(rms)) : -60;
    const pitch = autocorrelate(buf, this.audioCtx.sampleRate, this.cfg);
    return { pitch, db };
  }

  /** 停止して録音Blobを返す（録音データがなければ null） */
  async stop(): Promise<Blob | null> {
    this.active = false;
    const mediaRecorder = this.mediaRecorder;
    const stream = this.stream;
    const audioCtx = this.audioCtx;
    this.mediaRecorder = null;
    this.stream = null;
    this.analyser = null;
    this.timeDomainBuf = null;

    // MediaRecorder を audioCtx.close() より先に停止する（順序重要）
    const blob = await new Promise<Blob | null>((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      const mimeType = mediaRecorder.mimeType;
      const chunks = this.chunks;
      mediaRecorder.onstop = () => {
        resolve(chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null);
      };
      mediaRecorder.stop();
    });

    stream?.getTracks().forEach((t) => t.stop());
    if (audioCtx) await audioCtx.close();
    this.audioCtx = null;

    return blob;
  }
}
