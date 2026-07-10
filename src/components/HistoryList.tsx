import type { PracticeRecord } from '../storage/history';

export interface HistoryListProps {
  records: PracticeRecord[];
}

/** 練習記録（storage/history.tsで永続化、日付・点数・ランクバッジ）。 */
export function HistoryList({ records }: HistoryListProps) {
  return (
    <div className="card">
      <div className="section-label">練習記録</div>
      <div id="historyList">
        {records.length === 0 ? (
          <div className="empty">まだ記録がありません</div>
        ) : (
          records.map((r, i) => (
            <div className="history-row" key={i}>
              <span style={{ color: '#5f5e5a', fontSize: 12 }}>{r.dateLabel}</span>
              <span style={{ fontWeight: 500 }}>{r.score}点</span>
              <span className="rank-badge" style={{ background: r.color + '22', color: r.color }}>
                ランク{r.rank}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
