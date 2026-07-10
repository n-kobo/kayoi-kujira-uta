import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransportControls, type TransportControlsProps } from './TransportControls';

function baseProps(overrides: Partial<TransportControlsProps> = {}): TransportControlsProps {
  return {
    mode: 'idle',
    analysisReady: true,
    onPlay: vi.fn(),
    onRecord: vi.fn(),
    onStop: vi.fn(),
    onScore: vi.fn(),
    onReset: vi.fn(),
    onSeekToStart: vi.fn(),
    onSeekRelative: vi.fn(),
    showLyrics: true,
    onToggleLyrics: vi.fn(),
    myVoiceUrl: null,
    isMyVoicePlaying: false,
    onPlayMyVoice: vi.fn(),
    onStopMyVoice: vi.fn(),
    ...overrides,
  };
}

describe('TransportControls', () => {
  it('idle状態: 再生・録音が活性、停止・採点は非活性', () => {
    render(<TransportControls {...baseProps()} />);
    expect(screen.getByText('▶ 再生')).toBeEnabled();
    expect(screen.getByText('● 録音')).toBeEnabled();
    expect(screen.getByText('■ 停止')).toBeDisabled();
    expect(screen.getByText('採点する')).toBeDisabled();
  });

  it('解析未完了なら再生・録音は非活性', () => {
    render(<TransportControls {...baseProps({ analysisReady: false })} />);
    expect(screen.getByText('▶ 再生')).toBeDisabled();
    expect(screen.getByText('● 録音')).toBeDisabled();
  });

  it('recording状態: 停止が活性、再生・録音は非活性', () => {
    render(<TransportControls {...baseProps({ mode: 'recording' })} />);
    expect(screen.getByText('▶ 再生')).toBeDisabled();
    expect(screen.getByText('● 録音')).toBeDisabled();
    expect(screen.getByText('■ 停止')).toBeEnabled();
  });

  it('recorded状態: 採点するが活性', () => {
    render(<TransportControls {...baseProps({ mode: 'recorded' })} />);
    expect(screen.getByText('採点する')).toBeEnabled();
  });

  it('myVoiceUrlがなければ自分の声再生行は表示しない', () => {
    render(<TransportControls {...baseProps()} />);
    expect(screen.queryByText('🎤 自分の声を再生')).not.toBeInTheDocument();
  });

  it('myVoiceUrlがあれば自分の声再生ボタンを表示する', () => {
    render(<TransportControls {...baseProps({ myVoiceUrl: 'blob:mock' })} />);
    expect(screen.getByText('🎤 自分の声を再生')).toBeEnabled();
    expect(screen.getByText('■ 再生停止')).toBeDisabled();
  });
});
