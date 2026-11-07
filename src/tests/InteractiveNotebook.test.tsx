import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InteractiveNotebook, NOTEBOOK_PAGES } from '../components/InteractiveNotebook';

describe('InteractiveNotebook component', () => {
  const onNavigate = vi.fn();
  const onOpenChange = vi.fn();
  const onPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders closed notebook with all physical parts and interaction cue', () => {
    const { container } = render(
      <InteractiveNotebook
        isOpen={false}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        currentPageIndex={0}
      />
    );

    const closedBook = container.querySelector('.interactive-notebook-closed');
    expect(closedBook).toBeInTheDocument();
    expect(closedBook).toHaveAttribute('aria-label', 'Open your notebook');

    // Physical parts verification
    expect(container.querySelector('[data-notebook-part="back-cover"]')).toBeInTheDocument();
    expect(container.querySelector('[data-notebook-part="paper-block"]')).toBeInTheDocument();
    expect(container.querySelector('[data-notebook-part="spine"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-notebook-part="page"]')).toHaveLength(7);
    expect(container.querySelector('[data-notebook-part="front-cover"]')).toBeInTheDocument();
    expect(container.querySelector('.pp-book-cover-front')).toBeInTheDocument();

    // Cue pill
    expect(screen.getByText('Open your notebook')).toBeInTheDocument();
    expect(screen.getByText('my')).toBeInTheDocument();
    expect(screen.getByText('NOTEBOOK')).toBeInTheDocument();
    expect(screen.getByText('xoxo ♡')).toBeInTheDocument();
  });

  it('triggers onOpenChange when user clicks the closed notebook or presses Enter', () => {
    const { container } = render(
      <InteractiveNotebook
        isOpen={false}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
      />
    );

    const closedBook = container.querySelector('.interactive-notebook-closed')!;
    fireEvent.click(closedBook);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    fireEvent.keyDown(closedBook, { key: 'Enter' });
    expect(onOpenChange).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(closedBook, { key: ' ' });
    expect(onOpenChange).toHaveBeenCalledTimes(3);
  });

  it('renders open spread with tabs, left doodles, right game entry, and play button', () => {
    render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        currentPageIndex={0}
      />
    );

    // Tabs
    expect(screen.getByRole('tab', { name: /01 FLAMES Classic/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /02 SECRET NUMBER/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /03 Love Meter/i })).toBeInTheDocument();

    // Active page content
    expect(screen.getByRole('heading', { name: 'FLAMES Classic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play FLAMES Classic/i })).toBeInTheDocument();
    expect(screen.getByText('Page 01')).toBeInTheDocument();
    expect(screen.getByText('A notebook classic')).toBeInTheDocument();

    // Left page doodles & rituals
    expect(screen.getByText('— the schoolyard ritual —')).toBeInTheDocument();
    expect(screen.getByText(/Never write in ink until you are certain/i)).toBeInTheDocument();
    expect(screen.getByText(/2 matching ‘A’s crossed out/i)).toBeInTheDocument();

    // Dog ear corner for next page
    expect(screen.getByRole('button', { name: 'Turn to next page' })).toBeInTheDocument();

    // Close notebook button
    expect(screen.getByRole('button', { name: 'Close notebook' })).toBeInTheDocument();
  });

  it('navigates to game route when Play button is clicked', () => {
    render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        currentPageIndex={0}
      />
    );

    const playBtn = screen.getByRole('button', { name: /Play FLAMES Classic/i });
    fireEvent.click(playBtn);
    expect(onNavigate).toHaveBeenCalledWith('/games/flames');
  });

  it('allows flipping to next and previous pages using bottom dock controls', () => {
    vi.useFakeTimers();
    render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        onPageChange={onPageChange}
        currentPageIndex={0}
      />
    );

    const nextBtn = screen.getByRole('button', { name: 'Go to next game' });
    fireEvent.click(nextBtn);

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole('heading', { name: 'SECRET NUMBER' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play SECRET NUMBER/i })).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: 'Go to previous game' });
    fireEvent.click(prevBtn);

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onPageChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole('heading', { name: 'FLAMES Classic' })).toBeInTheDocument();
  });

  it('allows flipping pages using dog-ear corner folds', () => {
    vi.useFakeTimers();
    render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        onPageChange={onPageChange}
        currentPageIndex={0}
      />
    );

    const nextCorner = screen.getByRole('button', { name: 'Turn to next page' });
    fireEvent.click(nextCorner);

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole('heading', { name: 'SECRET NUMBER' })).toBeInTheDocument();

    const prevCorner = screen.getByRole('button', { name: 'Turn to previous page' });
    fireEvent.click(prevCorner);

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onPageChange).toHaveBeenCalledWith(0);
    expect(screen.getByRole('heading', { name: 'FLAMES Classic' })).toBeInTheDocument();
  });

  it('allows switching pages via top tabs', () => {
    vi.useFakeTimers();
    render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        onPageChange={onPageChange}
        currentPageIndex={0}
      />
    );

    const loveMeterTab = screen.getByRole('tab', { name: /03 Love Meter/i });
    fireEvent.click(loveMeterTab);

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole('heading', { name: 'Love Meter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play Love Meter/i })).toBeInTheDocument();
    expect(screen.getByText('Page 03')).toBeInTheDocument();
  });

  it('supports keyboard arrows for turning pages and Escape for closing', () => {
    vi.useFakeTimers();
    render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        onPageChange={onPageChange}
        currentPageIndex={0}
      />
    );

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    act(() => {
      vi.advanceTimersByTime(550);
    });
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    act(() => {
      vi.advanceTimersByTime(550);
    });
    expect(onPageChange).toHaveBeenCalledWith(0);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('supports touch swipe gestures on mobile', () => {
    vi.useFakeTimers();
    const { container } = render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
        onPageChange={onPageChange}
        currentPageIndex={0}
      />
    );

    const wrapper = container.querySelector('.interactive-notebook-wrapper')!;

    // Swipe left (next page): touchStart at 200, touchEnd at 100 (diff = +100 > 42)
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(wrapper, { changedTouches: [{ clientX: 100 }] });

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onPageChange).toHaveBeenCalledWith(1);

    // Swipe right (prev page): touchStart at 100, touchEnd at 200 (diff = -100 < -42)
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper, { changedTouches: [{ clientX: 200 }] });

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('calls onOpenChange(false) when Close notebook button is clicked', () => {
    render(
      <InteractiveNotebook
        isOpen={true}
        onOpenChange={onOpenChange}
        onNavigate={onNavigate}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Close notebook' });
    fireEvent.click(closeBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

