import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

beforeEach(() => {
  window.history.pushState({}, '', '/');
  window.scrollTo = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});

describe('PAPERPLAY user flow', () => {
  it('opens the notebook, accepts names, and reveals a FLAMES result', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /open notebook/i }));
    expect(screen.getByRole('heading', { name: 'FLAMES Classic' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /First name/i }), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Second name/i }), { target: { value: 'Aman' } });
    fireEvent.click(screen.getByRole('button', { name: /calculate flames/i }));
    expect(screen.getByText('The surviving letter')).toBeInTheDocument();
    expect(screen.getByText(/matched pairs/i)).toBeInTheDocument();
  });

  it('shows accessible validation instead of producing a result for empty names', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /play now/i }));
    fireEvent.click(screen.getByRole('button', { name: /calculate flames/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a name/i);
  });

  it('reaches the rules page through navigation', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('link', { name: 'How It Works' })[0]);
    expect(screen.getByRole('heading', { name: /How the notebook works/i })).toBeInTheDocument();
    expect(screen.getByText(/ANNA and AMAN/i)).toBeInTheDocument();
  });

  it.each([
    ['/games/letter-match', 'Letter Match'],
    ['/games/name-number', 'Name Number'],
    ['/games/love-meter', 'Love Meter'],
  ])('opens and calculates %s', (path, title) => {
    window.history.pushState({}, '', path);
    render(<App />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /First name/i }), { target: { value: 'Anna' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Second name/i }), { target: { value: 'Aman' } });
    fireEvent.click(screen.getByRole('button', { name: /calculate result/i }));
    expect(screen.getByText(title, { selector: '.result-stamp' })).toBeInTheDocument();
  });
});
