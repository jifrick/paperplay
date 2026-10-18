import { createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileBottomNav } from '../components/MobileBottomNav';

const primaryLinks = [
  ['Home', '/'],
  ['How It Works', '/how-it-works'],
  ['Play', '/games/flames'],
  ['About', '/about'],
] as const;

const renderNav = (pathname = '/') => {
  const onNavigate = vi.fn();
  const view = render(<MobileBottomNav pathname={pathname} onNavigate={onNavigate} />);
  const nav = screen.getByRole('navigation', { name: 'PAPERPLAY mobile navigation' });
  const more = within(nav).getByRole('button', { name: 'More' });
  return { ...view, nav, more, onNavigate };
};

describe('MobileBottomNav', () => {
  it('exposes the four primary labels and hrefs and an initially closed More menu', () => {
    const { nav, more } = renderNav();

    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(primaryLinks.map(([label]) => label));
    for (const [label, href] of primaryLinks) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
    expect(within(nav).getAllByRole('button')).toEqual([more]);
    expect(more).toHaveAttribute('type', 'button');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    const menu = document.getElementById(more.getAttribute('aria-controls')!);
    expect(menu).toHaveAttribute('aria-label', 'More PAPERPLAY links');
    expect(menu).not.toBeVisible();
    expect(within(nav).queryByRole('link', { name: 'Privacy Policy' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument();
  });

  it.each(primaryLinks)('routes an ordinary %s click once and closes More', (label, href) => {
    const { nav, more, onNavigate } = renderNav();
    fireEvent.click(more);
    const click = createEvent.click(within(nav).getByRole('link', { name: label }), { button: 0 });

    fireEvent(within(nav).getByRole('link', { name: label }), click);

    expect(click.defaultPrevented).toBe(true);
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(href);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument();
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Meta', { metaKey: true }],
    ['Shift', { shiftKey: true }],
    ['Alt', { altKey: true }],
    ['middle button', { button: 1 }],
    ['right button', { button: 2 }],
  ] as const)('preserves %s clicks on every primary link without routing or closing More', (_name, options) => {
    const { nav, more, onNavigate } = renderNav();
    fireEvent.click(more);

    // Observe cancellation after React handles the click, then suppress jsdom's
    // unsupported native navigation without masking the component's decision.
    const nativeClick = vi.fn((event: MouseEvent) => {
      const wasPrevented = event.defaultPrevented;
      event.preventDefault();
      return wasPrevented;
    });
    document.addEventListener('click', nativeClick);
    try {
      for (const [label] of primaryLinks) {
        fireEvent.click(within(nav).getByRole('link', { name: label }), { button: 0, ...options });
      }
      expect(nativeClick).toHaveBeenCalledTimes(primaryLinks.length);
      expect(nativeClick.mock.results.map(({ value }) => value)).toEqual([false, false, false, false]);
      expect(onNavigate).not.toHaveBeenCalled();
      expect(more).toHaveAttribute('aria-expanded', 'true');
    } finally {
      document.removeEventListener('click', nativeClick);
    }
  });

  it.each([
    ['/', 'Home'],
    ['/how-it-works', 'How It Works'],
    ['/games/flames', 'Play'],
    ['/games/name-number', 'Play'],
    ['/games/love-meter', 'Play'],
    ['/games/future-game', 'Play'],
    ['/about', 'About'],
    ['/privacy', 'More'],
    ['/contact', 'More'],
    ['/unknown', undefined],
    ['/games', undefined],
    ['/gamesmanship', undefined],
    ['/about/team', undefined],
    ['/privacy-policy', undefined],
  ])('marks only the appropriate item active for %s', (pathname, activeLabel) => {
    const { nav, more } = renderNav(pathname);

    for (const [label] of primaryLinks) {
      const link = within(nav).getByRole('link', { name: label });
      if (label === activeLabel) {
        expect(link).toHaveAttribute('aria-current', 'page');
        expect(link).toHaveClass('active');
      } else {
        expect(link).not.toHaveAttribute('aria-current');
        expect(link).not.toHaveClass('active');
      }
    }
    if (activeLabel === 'More') expect(more).toHaveClass('active');
    else expect(more).not.toHaveClass('active');
    expect(more).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles the associated More menu and its open active state without navigating', () => {
    const { nav, more, onNavigate } = renderNav();
    const menu = document.getElementById(more.getAttribute('aria-controls')!);

    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(more).toHaveClass('active');
    expect(menu).toBeVisible();
    expect(within(nav).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(within(nav).getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');

    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).not.toHaveClass('active');
    expect(menu).not.toBeVisible();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it.each([
    ['Privacy Policy', '/privacy'],
    ['Contact', '/contact'],
  ])('routes the More link %s once and hides the menu', (label, href) => {
    const { nav, more, onNavigate } = renderNav();
    fireEvent.click(more);
    const link = within(nav).getByRole('link', { name: label });
    const click = createEvent.click(link, { button: 0 });

    fireEvent(link, click);

    expect(click.defaultPrevented).toBe(true);
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith(href);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: label })).not.toBeInTheDocument();
  });

  it.each(['Escape', 'outside pointer'] as const)('dismisses More on %s without navigating and can reopen', (dismissal) => {
    const { nav, more, onNavigate } = renderNav();
    fireEvent.click(more);

    if (dismissal === 'Escape') fireEvent.keyDown(window, { key: 'Escape' });
    else fireEvent.pointerDown(document.body);

    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).not.toHaveClass('active');
    expect(within(nav).queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.click(more);
    expect(within(nav).getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  it('keeps More open for inside pointer events and unrelated keys', () => {
    const { nav, more, onNavigate } = renderNav();
    fireEvent.click(more);

    fireEvent.pointerDown(within(nav).getByRole('link', { name: 'Contact' }));
    fireEvent.pointerDown(more);
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getByRole('link', { name: 'Contact' })).toBeVisible();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('closes More when pathname changes and updates active state without calling onNavigate', () => {
    const { nav, more, onNavigate, rerender } = renderNav();
    fireEvent.click(more);

    rerender(<MobileBottomNav pathname="/" onNavigate={onNavigate} />);
    expect(more).toHaveAttribute('aria-expanded', 'true');

    rerender(<MobileBottomNav pathname="/contact" onNavigate={onNavigate} />);
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveClass('active');
    expect(within(nav).queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');

    rerender(<MobileBottomNav pathname="/games/name-number" onNavigate={onNavigate} />);
    expect(more).not.toHaveClass('active');
    expect(within(nav).getByRole('link', { name: 'Play' })).toHaveAttribute('aria-current', 'page');
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
