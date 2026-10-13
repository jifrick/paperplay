import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChallengeUrl, shareResult } from '../lib/share';

afterEach(() => vi.restoreAllMocks());

describe('sharing safeguards', () => {
  it('uses native sharing when available', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
    const outcome = await shareResult({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/games/flames' });
    expect(outcome).toBe('shared');
    expect(navigator.share).toHaveBeenCalled();
  });

  it('copies when native sharing is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const outcome = await shareResult({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/games/flames' });
    expect(outcome).toBe('copied');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('A result'));
  });

  it('creates a challenge URL with mode only, never names', () => {
    window.history.pushState({}, '', '/');
    const url = getChallengeUrl('/games/flames', 'friendship');
    expect(url).toContain('/games/flames?mode=friendship');
    expect(url).not.toMatch(/Anna|Aman|name/i);
  });
});
