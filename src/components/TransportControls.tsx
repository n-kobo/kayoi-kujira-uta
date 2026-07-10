import type { PracticeMode } from '../hooks/usePracticeSession';

export interface TransportControlsProps {
  mode: PracticeMode;
  analysisReady: boolean;
  onPlay: () => void;
  onRecord: () => void;
  onStop: () => void;
  onScore: () => void;
  onReset: () => void;
  onSeekToStart: () => void;
  onSeekRelative: (delta: number) => void;
  showLyrics: boolean;
  onToggleLyrics: () => void;
  myVoiceUrl: string | null;
  isMyVoicePlaying: boolean;
  onPlayMyVoice: () => void;
  onStopMyVoice: () => void;
}

/** ▶再生/●録音/■停止/採点する + ⟳リセット/|◀先頭/シーク/♪歌詞 + 自分の声再生。 */
export function TransportControls(props: TransportControlsProps) {
  const { mode, analysisReady } = props;
  const busy = mode === 'playing' || mode === 'recording';

  return (
    <>
      <div className="controls" style={{ marginTop: 10 }}>
        <button className="btn btn-play" disabled={!analysisReady || busy} onClick={props.onPlay}>
          ▶ 再生
        </button>
        <button
          className={'btn btn-record' + (mode === 'recording' ? ' recording' : '')}
          disabled={!analysisReady || busy}
          onClick={props.onRecord}
        >
          ● 録音
        </button>
        <button className="btn btn-stop" disabled={!busy} onClick={props.onStop}>
          ■ 停止
        </button>
        <button className="btn btn-score" disabled={mode !== 'recorded'} onClick={props.onScore}>
          採点する
        </button>
      </div>
      <div className="seek-row">
        <button className="btn btn-reset btn-seek" onClick={props.onReset}>
          ⟳ リセット
        </button>
        <button className="btn btn-seek" onClick={props.onSeekToStart}>
          |◀ 先頭
        </button>
        <button className="btn btn-seek" onClick={() => props.onSeekRelative(-10)}>
          ◀ 10秒
        </button>
        <button className="btn btn-seek" onClick={() => props.onSeekRelative(10)}>
          10秒 ▶
        </button>
        <button
          className="btn btn-seek"
          style={{ opacity: props.showLyrics ? 1 : 0.45 }}
          onClick={props.onToggleLyrics}
        >
          {props.showLyrics ? '♪ 歌詞' : '♪ 歌詞 OFF'}
        </button>
      </div>
      {props.myVoiceUrl !== null && (
        <div className="seek-row" id="myVoiceRow">
          <button className="btn btn-seek" disabled={props.isMyVoicePlaying} onClick={props.onPlayMyVoice}>
            🎤 自分の声を再生
          </button>
          <button className="btn btn-seek" disabled={!props.isMyVoicePlaying} onClick={props.onStopMyVoice}>
            ■ 再生停止
          </button>
        </div>
      )}
    </>
  );
}
