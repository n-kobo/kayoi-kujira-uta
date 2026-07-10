import type { ScoreResult } from '../core/scoring';

export interface ScorePanelProps {
  score: ScoreResult | null;
}

/** 採点結果（総合点・星・ランク・メッセージ・4項目内訳バー）。 */
export function ScorePanel({ score }: ScorePanelProps) {
  return (
    <div className={'card score-panel' + (score ? ' visible' : '')}>
      <div className="section-label">採点結果</div>
      <div className="score-big">
        <div className="score-num" style={{ color: score?.color }}>
          {score ? score.total : '--'}
        </div>
        <div className="score-stars">{score?.stars ?? ''}</div>
        <div className="score-rank" style={{ color: score?.color }}>
          {score ? `ランク ${score.rank}` : ''}
        </div>
        <div className="score-msg">{score?.message ?? ''}</div>
      </div>
      <div className="score-breakdown">
        <div className="score-item">
          <div className="score-item-label">節回しの近さ</div>
          <div className="score-item-val">{score ? score.shape : '--'}</div>
          <div className="score-bar-bg">
            <div className="score-bar" style={{ background: '#fbbf24', width: (score?.shape ?? 0) + '%' }} />
          </div>
        </div>
        <div className="score-item">
          <div className="score-item-label">音量・強弱</div>
          <div className="score-item-val">{score ? score.volume : '--'}</div>
          <div className="score-bar-bg">
            <div className="score-bar" style={{ background: '#1d9e75', width: (score?.volume ?? 0) + '%' }} />
          </div>
        </div>
        <div className="score-item">
          <div className="score-item-label">継続・伸び</div>
          <div className="score-item-val">{score ? score.duration : '--'}</div>
          <div className="score-bar-bg">
            <div className="score-bar" style={{ background: '#ba7517', width: (score?.duration ?? 0) + '%' }} />
          </div>
        </div>
        <div className="score-item">
          <div className="score-item-label">声の安定</div>
          <div className="score-item-val">{score ? score.stability : '--'}</div>
          <div className="score-bar-bg">
            <div className="score-bar" style={{ background: '#60a5fa', width: (score?.stability ?? 0) + '%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
