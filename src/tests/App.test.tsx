import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

const originalNavigatorShare = Object.getOwnPropertyDescriptor(navigator, 'share');
const originalNavigatorClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

const restoreProperty = (target: object, property: string, descriptor: PropertyDescriptor | undefined) => {
  if (descriptor) Object.defineProperty(target, property, descriptor);
  else Reflect.deleteProperty(target, property);
};

const setReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

const openFlames = () => {
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: /play now/i }));
};

const fillNames = (first = 'Anna', second = 'Aman') => {
  fireEvent.change(screen.getByRole('textbox', { name: /First name/i }), { target: { value: first } });
  fireEvent.change(screen.getByRole('textbox', { name: /Second name/i }), { target: { value: second } });
};

const calculate = () => fireEvent.click(screen.getByRole('button', { name: /calculate flames/i }));

const makeCanvasContext = () => {
  const fillText = vi.fn();
  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
    fillText,
  } as unknown as CanvasRenderingContext2D;
  return { context, fillText };
};

const installCanvasBoundary = (context: CanvasRenderingContext2D | null) => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['png'], { type: 'image/png' })));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:paperplay-result') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
};

beforeEach(() => {
  window.history.pushState({}, '', '/');
  window.scrollTo = vi.fn();
  setReducedMotion(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  restoreProperty(navigator, 'share', originalNavigatorShare);
  restoreProperty(navigator, 'clipboard', originalNavigatorClipboard);
  restoreProperty(URL, 'createObjectURL', originalCreateObjectURL);
  restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
});

describe('PAPERPLAY user flow', () => {
  it('automatically starts the notebook introduction with all physical layers present', () => {
    const { container } = render(<App />);
    const notebook = container.querySelector('[data-notebook-state="closed"]');

    expect(notebook).toBeInTheDocument();
    expect(notebook).toHaveAttribute('aria-label', 'A pink physical notebook');
    expect(notebook?.querySelector('[data-notebook-part="back-cover"]')).toBeInTheDocument();
    expect(notebook?.querySelector('[data-notebook-part="spine"]')).toBeInTheDocument();
    expect(notebook?.querySelector('[data-notebook-part="paper-block"]')).toBeInTheDocument();
    expect(notebook?.querySelectorAll('[data-notebook-part="page"]')).toHaveLength(7);
    expect(notebook?.querySelector('[data-notebook-part="front-cover"]')).toBeInTheDocument();
    expect(notebook?.querySelector('.pp-book-cover-front')).toBeInTheDocument();
    expect(notebook).toHaveClass('is-closed');
  });

  it('uses one explicit timeline and returns to the exact closed state', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<App />);
      const notebook = () => container.querySelector('[data-notebook-state]');
      expect(notebook()).toHaveAttribute('data-notebook-state', 'closed');
      act(() => { vi.advanceTimersByTime(260); });
      expect(notebook()).toHaveAttribute('data-notebook-state', 'opening');
      act(() => { vi.advanceTimersByTime(1020); });
      expect(notebook()).toHaveAttribute('data-notebook-state', 'flipping');
      act(() => { vi.advanceTimersByTime(1940); });
      expect(notebook()).toHaveAttribute('data-notebook-state', 'holding');
      act(() => { vi.advanceTimersByTime(550); });
      expect(notebook()).toHaveAttribute('data-notebook-state', 'closing');
      act(() => { vi.advanceTimersByTime(2130); });
      expect(notebook()).toHaveAttribute('data-notebook-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps a stable closed fallback when reduced motion is requested', () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    try {
      const { container } = render(<App />);
      const notebook = container.querySelector('[data-notebook-state]');
      expect(notebook).toHaveClass('is-static', 'is-closed');
      act(() => { vi.advanceTimersByTime(6000); });
      expect(notebook).toHaveAttribute('data-notebook-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens the notebook, accepts names, and reveals a FLAMES result', () => {
    openFlames();
    expect(screen.getByRole('heading', { name: 'FLAMES Classic' })).toBeInTheDocument();
    fillNames();
    calculate();
    expect(screen.getByText('The surviving letter')).toBeInTheDocument();
    expect(screen.getByText(/matched pairs/i)).toBeInTheDocument();
  });

  it('shows accessible validation instead of producing a result for empty names', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /play now/i }));
    calculate();
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a name/i);
  });

  it('keeps both native textareas and their separate ink mirrors in sync during rapid typing', () => {
    openFlames();
    const first = screen.getByRole('textbox', { name: /First name/i });
    const second = screen.getByRole('textbox', { name: /Second name/i });

    for (const value of ['A', 'An', 'Ann', 'Anna']) {
      fireEvent.change(first, { target: { value } });
    }
    for (const value of ['A', 'Am', 'Ama', 'Aman']) {
      fireEvent.change(second, { target: { value } });
    }

    expect(first).toHaveValue('Anna');
    expect(second).toHaveValue('Aman');
    const ink = [...document.querySelectorAll<HTMLElement>('.notebook-ink')];
    expect(ink).toHaveLength(2);
    expect(ink[0]).toHaveAttribute('aria-hidden', 'true');
    expect(ink[1]).toHaveAttribute('aria-hidden', 'true');
    expect(ink[0]).toHaveTextContent('Anna');
    expect(ink[1]).toHaveTextContent('Aman');
  });

  it('connects insertion and deletion events to the notebook pencil and eraser layers', () => {
    openFlames();
    const first = screen.getByRole('textbox', { name: /First name/i }) as HTMLTextAreaElement;

    fireEvent.change(first, { target: { value: 'S' } });
    expect(document.querySelector('.notebook-character.is-writing')).toBeInTheDocument();

    first.setSelectionRange(1, 1);
    fireEvent.keyDown(first, { key: 'Backspace' });
    fireEvent.change(first, { target: { value: '' } });
    expect(document.querySelector('.notebook-eraser-cursor')).toBeInTheDocument();
  });

  it('documents controlled textarea editing without claiming to simulate browser caret behavior', () => {
    openFlames();
    const first = screen.getByRole('textbox', { name: /First name/i });

    fireEvent.change(first, { target: { value: 'Anna' } });
    fireEvent.change(first, { target: { value: 'Ann' } });
    fireEvent.change(first, { target: { value: 'An' } });

    expect(first).toHaveValue('An');
  });

  it('invalidates an old result and reproduces the same FLAMES category and rounds after restoring identical inputs', () => {
    setReducedMotion(true);
    openFlames();
    fillNames();
    calculate();

    const expectedRounds = [
      '01From F · L · A · M · E · S, count 2 from position 1.cross out L',
      '02From F · A · M · E · S, count 2 from position 2.cross out M',
      '03From F · A · E · S, count 2 from position 3.cross out S',
      '04From F · A · E, count 2 from position 1.cross out A',
      '05From F · E, count 2 from position 2.cross out F',
    ];
    const readRounds = () => [...document.querySelectorAll<HTMLElement>('.round-row')].map((row) => row.textContent?.replace(/\s+/g, ' ').trim());

    expect(screen.getByText('Enemies', { selector: '.result-category' })).toBeInTheDocument();
    expect(readRounds()).toEqual(expectedRounds);

    const first = screen.getByRole('textbox', { name: /First name/i });
    fireEvent.change(first, { target: { value: 'Anny' } });
    expect(screen.queryByText('The surviving letter')).not.toBeInTheDocument();
    expect(screen.queryByText('Enemies', { selector: '.result-category' })).not.toBeInTheDocument();

    fireEvent.change(first, { target: { value: 'Anna' } });
    calculate();
    expect(screen.getByText('Enemies', { selector: '.result-category' })).toBeInTheDocument();
    expect(readRounds()).toEqual(expectedRounds);
  });

  it('calculates from Enter, but ignores Enter while an IME composition is active', () => {
    openFlames();
    fillNames();
    const second = screen.getByRole('textbox', { name: /Second name/i });

    fireEvent.keyDown(second, { key: 'Enter' });
    expect(screen.getByText('The surviving letter')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /change names/i }));
    fireEvent.keyDown(second, { key: 'Enter', isComposing: true });
    expect(screen.queryByText('The surviving letter')).not.toBeInTheDocument();
  });

  it('shows all FLAMES rounds immediately when reduced motion is preferred', () => {
    setReducedMotion(true);
    openFlames();
    fillNames();
    calculate();

    expect(document.querySelectorAll('.round-row')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /skip animation/i })).not.toBeInTheDocument();
  });

  it('retains Undo and Reset for name history and clears the result', () => {
    openFlames();
    const first = screen.getByRole('textbox', { name: /First name/i });
    const second = screen.getByRole('textbox', { name: /Second name/i });
    fireEvent.change(first, { target: { value: 'Anna' } });
    fireEvent.change(second, { target: { value: 'Aman' } });
    calculate();
    expect(screen.getByText('The surviving letter')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(first).toHaveValue('Anna');
    expect(second).toHaveValue('');
    expect(screen.queryByText('The surviving letter')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(first).toHaveValue('');
    expect(second).toHaveValue('');

    fillNames();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(first).toHaveValue('');
    expect(second).toHaveValue('');
    expect(screen.queryByText('The surviving letter')).not.toBeInTheDocument();
  });

  it.each([
    ['/games/flames', 'FLAMES Classic', 'The surviving letter'],
    ['/games/name-number', 'Name Number', 'Name Number'],
    ['/games/love-meter', 'Love Meter', 'Love Meter'],
  ])('opens and calculates %s', (path, title, resultStamp) => {
    window.history.pushState({}, '', path);
    render(<App />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /First name/i }), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Second name/i }), { target: { value: 'Aman' } });
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));
    expect(screen.getByText(resultStamp, { selector: '.result-stamp' })).toBeInTheDocument();
  });

  it.each([
    ['/', /Remember when a name could change/i],
    ['/games/flames', 'FLAMES Classic'],
    ['/games/name-number', 'Name Number'],
    ['/games/love-meter', 'Love Meter'],
    ['/how-it-works', /How the notebook works/i],
    ['/about', /Made for the margin doodlers/i],
    ['/privacy', /Your names stay on the page/i],
  ])('renders the remaining route %s', (path, heading) => {
    window.history.pushState({}, '', path);
    render(<App />);
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('does not advertise Letter Match on home, rules, or navigation, and sends its old route back home', () => {
    render(<App />);
    expect(screen.queryByRole('link', { name: /letter match/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toHaveTextContent(/letter match/i);

    fireEvent.click(screen.getAllByRole('link', { name: 'How It Works' })[0]);
    expect(screen.getByRole('heading', { name: /How the notebook works/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /letter match/i })).not.toBeInTheDocument();

    window.history.pushState({}, '', '/games/letter-match');
    fireEvent(window, new PopStateEvent('popstate'));
    expect(screen.getByRole('heading', { name: /That page is blank/i })).toBeInTheDocument();
    expect(screen.queryByText('Letter Match')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back home/i }));
    expect(screen.getByRole('heading', { name: /Remember when a name could change/i })).toBeInTheDocument();
  });

  it.each([
    ['/games/flames?mode=friendship', 'friendship'],
    ['/games/name-number', undefined],
    ['/games/love-meter', undefined],
  ])('shares %s results without names and with only the appropriate mode', async (path, expectedMode) => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: share });
    window.history.pushState({}, '', path);
    render(<App />);
    fillNames();
    fireEvent.click(screen.getByRole('button', { name: /calculate/i }));
    fireEvent.click(screen.getByRole('button', { name: /share result/i }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const payload = share.mock.calls[0]?.[0] as { text: string; url: string };
    const sharedUrl = new URL(payload.url);
    expect(payload.text).not.toMatch(/Anna|Aman/);
    expect(sharedUrl.searchParams.get('mode')).toBe(expectedMode ?? null);
    expect(payload.url).not.toMatch(/Anna|Aman/);
  });

  it('uses the hide-names download control and reports a browser export failure', async () => {
    const { context, fillText } = makeCanvasContext();
    installCanvasBoundary(context);
    openFlames();
    fillNames();
    calculate();
    fireEvent.click(screen.getByRole('checkbox', { name: /hide names on card/i }));
    fireEvent.click(screen.getByRole('button', { name: /download card/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/result card downloaded/i);
    expect(fillText.mock.calls.map(([text]) => String(text)).join('\n')).not.toMatch(/Anna|Aman/);

    vi.restoreAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
    fireEvent.click(screen.getByRole('button', { name: /download card/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/could not be exported/i));
  });
});
