import { useState } from 'react';
import { songs } from './songs';
import { useTeacherAnalysis } from './hooks/useTeacherAnalysis';
import { usePracticeSession } from './hooks/usePracticeSession';
import { formatTime } from './core/time';
import { appendRecord, loadHistory, type PracticeRecord } from './storage/history';
import { TeacherAudioCard } from './components/TeacherAudioCard';
import { PitchGraph } from './components/PitchGraph';
import { TransportControls } from './components/TransportControls';
import { MeterPanel } from './components/MeterPanel';
import { ScorePanel } from './components/ScorePanel';
import { HistoryList } from './components/HistoryList';
import { SongSelector } from './components/SongSelector';

function buildDateLabel(now: Date): string {
  return `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function App() {
  const [selectedId, setSelectedId] = useState(songs[0].id);
  const song = songs.find((s) => s.id === selectedId) ?? songs[0];
  const [history, setHistory] = useState<PracticeRecord[]>(() => loadHistory());

  const teacher = useTeacherAnalysis(song);
  const session = usePracticeSession(song, teacher.analysis);

  const analysisReady = teacher.status === 'ready';

  let dotClass = 'dot-ready';
  let statusText = 'エラーが発生しました';
  if (teacher.status === 'analyzing') {
    dotClass = 'dot-analyzing';
    statusText = '先生の音程を解析中...';
  } else if (teacher.status === 'ready') {
    if (session.mode === 'recording') {
      dotClass = 'dot-recording';
      statusText = '録音中...';
    } else if (session.mode === 'playing') {
      dotClass = 'dot-recording';
      statusText = '再生中...';
    } else if (session.mode === 'recorded') {
      dotClass = 'dot-done';
      statusText = '録音完了！';
    } else {
      dotClass = 'dot-done';
      statusText = '解析完了！録音を始めてください';
    }
  }

  const handleScore = () => {
    const result = session.scoreSession();
    if (!result) return;
    const record: PracticeRecord = {
      dateLabel: buildDateLabel(new Date()),
      score: result.total,
      rank: result.rank,
      color: result.color,
      songId: song.id,
    };
    setHistory(appendRecord(record));
  };

  const durationSec = teacher.analysis?.durationSec ?? 0;
  const minF = teacher.analysis?.minF ?? 80;
  const maxF = teacher.analysis?.maxF ?? 600;

  return (
    <div className="app">
      <div className="header">
        <div className="title">通鯨唄おけいこアプリ</div>
      </div>

      <SongSelector songs={songs} selectedId={selectedId} onChange={setSelectedId} />

      <TeacherAudioCard
        song={song}
        audioUrl={teacher.audioUrl}
        status={teacher.status}
        progress={teacher.progress}
        error={teacher.error}
        audioRef={session.audioRef}
      />

      <div className="card">
        <div className="iwai-label">{song.title}</div>
        <div className="status-row">
          <div className="section-label" style={{ margin: 0 }}>
            流れる比較グラフ
          </div>
          <div>
            <span className={'status-dot ' + dotClass} />
            <span className="status-text">{statusText}</span>
          </div>
        </div>
        <PitchGraph
          teacherPitches={teacher.analysis?.pitches ?? null}
          teacherSmooth={teacher.analysis?.smooth ?? null}
          minF={minF}
          maxF={maxF}
          hopSec={teacher.analysis?.hopSec ?? 0}
          scrollPos={session.scrollPos}
          currentMyFreq={session.livePitch}
          lyrics={song.lyrics}
          showLyrics={session.showLyrics}
          resetSignal={session.resetSignal}
        />
        <div className="time-disp">
          {formatTime(session.currentTimeSec)} / {formatTime(durationSec)}
        </div>
        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#fbbf24' }} />
            先生（黄色）
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#60a5fa' }} />
            自分（水色）
          </div>
        </div>
        <div className="match-row">
          <div className="match-label">節回し一致度</div>
          <div className="match-bg">
            <div className="match-fill" style={{ width: (session.liveSimilarity ?? 0) + '%' }} />
          </div>
          <div className="match-pct">
            {session.liveSimilarity !== null ? `${session.liveSimilarity}%` : '--'}
          </div>
        </div>
        <TransportControls
          mode={session.mode}
          analysisReady={analysisReady}
          onPlay={session.play}
          onRecord={session.record}
          onStop={session.stop}
          onScore={handleScore}
          onReset={session.reset}
          onSeekToStart={session.seekToStart}
          onSeekRelative={session.seekRelative}
          showLyrics={session.showLyrics}
          onToggleLyrics={session.toggleLyrics}
          myVoiceUrl={session.myVoiceUrl}
          isMyVoicePlaying={session.isMyVoicePlaying}
          onPlayMyVoice={session.playMyVoice}
          onStopMyVoice={session.stopMyVoice}
        />
      </div>

      <MeterPanel
        visible={session.mode === 'recording'}
        db={session.liveDb}
        pitch={session.livePitch}
        minF={minF}
        maxF={maxF}
      />

      <ScorePanel score={session.score} />

      <HistoryList records={history} />

      <div className="footer-credit">長門郷土文化研究会</div>
    </div>
  );
}
