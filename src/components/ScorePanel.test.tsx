import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScorePanel } from './ScorePanel';
import type { ScoreResult } from '../core/scoring';

const sampleScore: ScoreResult = {
  total: 82,
  shape: 80,
  volume: 90,
  duration: 70,
  stability: 85,
  rank: 'A',
  stars: '★★★★☆',
  message: '上手い！節回しがよく合っている',
  color: '#378add',
};

describe('ScorePanel', () => {
  it('score が null のとき --表示で visible クラスを持たない', () => {
    render(<ScorePanel score={null} />);
    expect(screen.getAllByText('--').length).toBeGreaterThan(0);
    expect(document.querySelector('.score-panel')).not.toHaveClass('visible');
  });

  it('score があるとき総合点・ランク・メッセージを表示する', () => {
    render(<ScorePanel score={sampleScore} />);
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('ランク A')).toBeInTheDocument();
    expect(screen.getByText('上手い！節回しがよく合っている')).toBeInTheDocument();
    expect(document.querySelector('.score-panel')).toHaveClass('visible');
  });
});
