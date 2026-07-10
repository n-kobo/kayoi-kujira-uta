/** 1件の練習記録。旧UIの履歴表示（日付・点数・ランク・色）に対応する。 */
export interface PracticeRecord {
  /** 表示用の日付ラベル（例: '7/10 15:04'） */
  dateLabel: string;
  score: number;
  rank: string;
  color: string;
  songId: string;
}

const STORAGE_KEY = 'kujira-uta:history:v1';

/**
 * localStorage から練習履歴を読み込む。
 * キーが存在しない・JSONが壊れている・配列でない・localStorageが
 * 使えない（プライベートブラウズ等）場合はすべて空配列を返す。
 */
export function loadHistory(): PracticeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PracticeRecord[];
  } catch {
    return [];
  }
}

/**
 * 練習履歴を localStorage に保存する。
 * localStorage が使えない環境（プライベートブラウズ・容量超過等）でも
 * 例外を投げず、保存は静かに失敗する。
 */
export function saveHistory(records: PracticeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 保存できなくてもアプリの動作は継続する
  }
}

/**
 * 新しい記録を履歴の先頭に追加して保存し、更新後の一覧を返す。
 */
export function appendRecord(record: PracticeRecord): PracticeRecord[] {
  const history = loadHistory();
  const updated = [record, ...history];
  saveHistory(updated);
  return updated;
}
