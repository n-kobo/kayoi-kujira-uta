export interface MeterPanelProps {
  visible: boolean;
  db: number;
  pitch: number | null;
  minF: number;
  maxF: number;
}

/** 音量dB・音程Hzメーター（録音中のみ表示）。 */
export function MeterPanel({ visible, db, pitch, minF, maxF }: MeterPanelProps) {
  if (!visible) return null;

  const volPct = Math.min(Math.max(((db + 60) / 60) * 100, 0), 100);
  const range = maxF - minF;
  const pitchPct =
    pitch !== null && range > 0 ? Math.min(Math.max(((pitch - minF) / range) * 100, 0), 100) : 0;

  return (
    <div className="card" id="meterCard">
      <div className="meters">
        <div className="meter-card">
          <div className="meter-label">音量</div>
          <div className="meter-val">{db > -60 ? db : '--'}</div>
          <div className="meter-unit">dB</div>
          <div className="meter-bar-bg">
            <div className="meter-bar" style={{ width: volPct + '%', background: '#1d9e75' }} />
          </div>
        </div>
        <div className="meter-card">
          <div className="meter-label">音程</div>
          <div className="meter-val">{pitch !== null ? Math.round(pitch) : '--'}</div>
          <div className="meter-unit">Hz</div>
          <div className="meter-bar-bg">
            <div className="meter-bar" style={{ width: pitchPct + '%', background: '#60a5fa' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
