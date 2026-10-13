export type SharePayload = { title: string; text: string; url: string };
export type ShareOutcome = 'shared' | 'copied' | 'manual' | 'cancelled' | 'failed';

export const shareResult = async (payload: SharePayload): Promise<ShareOutcome> => {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      return 'copied';
    } catch {
      // Continue to the explicit, user-controlled fallback.
    }
  }
  if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
    window.prompt('Copy your PAPERPLAY result', `${payload.text}\n${payload.url}`);
    return 'manual';
  }
  return 'failed';
};

export const getChallengeUrl = (path: string, mode?: string): string => {
  if (typeof window === 'undefined') return path;
  const url = new URL(path, window.location.origin);
  if (mode) url.searchParams.set('mode', mode);
  return url.toString();
};
