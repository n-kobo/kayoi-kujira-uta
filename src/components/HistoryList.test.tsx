import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryList } from './HistoryList';
import type { PracticeRecord } from '../storage/history';

describe('HistoryList', () => {
  it('記録がなければ空メッセージを表示する', () => {
    render(<HistoryList records={[]} />);
    expect(screen.getByText('まだ記録がありません')).toBeInTheDocument();
  });

  it('記録があれば日付・点数・ランクバッジを表示する', () => {
    const records: PracticeRecord[] = [
      { dateLabel: '7/10 15:04', score: 88, rank: 'A', color: '#378add', songId: 'iwai-medeta' },
    ];
    render(<HistoryList records={records} />);
    expect(screen.getByText('7/10 15:04')).toBeInTheDocument();
    expect(screen.getByText('88点')).toBeInTheDocument();
    expect(screen.getByText('ランクA')).toBeInTheDocument();
  });
});
