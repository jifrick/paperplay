import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadResultCard } from '../lib/downloadCard';

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

const restoreProperty = (target: object, property: string, descriptor: PropertyDescriptor | undefined) => {
  if (descriptor) Object.defineProperty(target, property, descriptor);
  else Reflect.deleteProperty(target, property);
};

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

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  restoreProperty(URL, 'createObjectURL', originalCreateObjectURL);
  restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
});

describe('downloadResultCard', () => {
  it('renders a PNG card, downloads it with a game filename, and never puts names in the filename', async () => {
    const { context, fillText } = makeCanvasContext();
    const blob = new Blob(['png'], { type: 'image/png' });
    const createObjectURL = vi.fn().mockReturnValue('blob:paperplay-result');
    const revokeObjectURL = vi.fn();
    let clickedAnchor: HTMLAnchorElement | undefined;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(blob));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickedAnchor = this;
    });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectURL });

    await downloadResultCard({
      game: 'FLAMES Classic',
      names: 'Anna + Aman',
      result: 'E — Enemies',
      message: 'Rivals today, chaos forever!',
      detail: '3 matched pairs; 2 letters entered the elimination.',
    });

    expect(clickedAnchor?.href).toBe('blob:paperplay-result');
    expect(clickedAnchor?.download).toBe('flames-classic-result.png');
    expect(clickedAnchor?.download).not.toMatch(/Anna|Aman/);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:paperplay-result');
    expect(fillText).toHaveBeenCalledWith('Anna + Aman', 150, 320);
  });

  it('omits the names line when the app requests a hidden-names card', async () => {
    const { context, fillText } = makeCanvasContext();
    const blob = new Blob(['png'], { type: 'image/png' });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(blob));
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:hidden-names') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });

    await downloadResultCard({ game: 'Love Meter', result: '87/100', message: 'A page full of possibilities.' });

    expect(fillText.mock.calls.map(([text]) => String(text)).join('\n')).not.toMatch(/Anna|Aman/);
  });

  it('rejects when the browser cannot provide a 2D canvas context', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);

    await expect(downloadResultCard({ game: 'Name Number', result: '27', message: 'A transparent score.' })).rejects.toThrow(/could not prepare/i);
  });

  it('rejects when canvas export returns no blob', async () => {
    const { context } = makeCanvasContext();
    const createObjectURL = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null));
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL });

    await expect(downloadResultCard({ game: 'Name Number', result: '27', message: 'A transparent score.' })).rejects.toThrow(/could not export/i);
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
