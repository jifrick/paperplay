import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChallengeUrl, shareResult } from '../lib/share';

const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalPrompt = Object.getOwnPropertyDescriptor(window, 'prompt');

const restoreProperty = (target: object, property: string, descriptor: PropertyDescriptor | undefined) => {
  if (descriptor) Object.defineProperty(target, property, descriptor);
  else Reflect.deleteProperty(target, property);
};

afterEach(() => {
  vi.restoreAllMocks();
  restoreProperty(navigator, 'share', originalShare);
  restoreProperty(navigator, 'clipboard', originalClipboard);
  restoreProperty(window, 'prompt', originalPrompt);
});

describe('sharing safeguards', () => {
  it('uses native sharing when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: share });
    const outcome = await shareResult({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/games/flames' });
    expect(outcome).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/games/flames' });
  });

  it('copies when native sharing is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: { writeText } });
    const outcome = await shareResult({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/games/flames' });
    expect(outcome).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('A result\nhttps://example.test/games/flames');
  });

  it('creates a FLAMES challenge URL with mode only, never names', () => {
    window.history.pushState({}, '', '/');
    const url = getChallengeUrl('/games/flames', 'friendship');
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/games/flames');
    expect(parsed.searchParams.get('mode')).toBe('friendship');
    expect(url).not.toMatch(/Anna|Aman|name/i);
  });

  it.each(['/games/name-number', '/games/love-meter'])('does not add a mode to %s challenge URLs', (path) => {
    const parsed = new URL(getChallengeUrl(path));
    expect(parsed.pathname).toBe(path);
    expect(parsed.searchParams.has('mode')).toBe(false);
    expect(parsed.toString()).not.toMatch(/Anna|Aman/);
  });

  it('returns cancelled for an aborted native share without copying or prompting', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('The share was dismissed.', 'AbortError'));
    const writeText = vi.fn();
    const prompt = vi.fn();
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: share });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: { writeText } });
    Object.defineProperty(window, 'prompt', { configurable: true, writable: true, value: prompt });

    await expect(shareResult({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/result' })).resolves.toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
  });

  it('reports cancellation when the explicit prompt is dismissed', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: undefined });
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard unavailable'));
    const prompt = vi.fn().mockReturnValue(null);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: { writeText } });
    Object.defineProperty(window, 'prompt', { configurable: true, writable: true, value: prompt });

    await expect(shareResult({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/result' })).resolves.toBe('cancelled');
    expect(prompt).toHaveBeenCalledWith('Copy your PAPERPLAY result', 'A result\nhttps://example.test/result');
  });

  it('reports failed when all sharing boundaries are unavailable', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: undefined });
    Object.defineProperty(window, 'prompt', { configurable: true, writable: true, value: undefined });

    await expect(shareResult({ title: 'PAPERPLAY', text: 'A result', url: 'https://example.test/result' })).resolves.toBe('failed');
  });
});
