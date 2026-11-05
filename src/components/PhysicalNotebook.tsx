import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import './PhysicalNotebook.css';
import { InteractiveNotebook } from './InteractiveNotebook';

export type NotebookState = 'closed' | 'opening' | 'open' | 'flipping' | 'settling' | 'closing';

export type PhysicalNotebookProps = {
  state: NotebookState;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: (href: string) => void;
  currentPageIndex?: number;
  onPageChange?: (page: number) => void;
};

const PAGE_COUNT = 7;

const detectWebGL = () => {
  if (typeof document === 'undefined') return false;
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return false;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl');
    return Boolean(context && typeof (context as WebGLRenderingContext).getExtension === 'function');
  } catch {
    return false;
  }
};

const getReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

export const StaticNotebook = () => (
  <div className="pp-book-static" aria-hidden="true">
    <div className="pp-book-static-back" data-notebook-part="back-cover" />
    <div className="pp-book-static-paper" data-notebook-part="paper-block" />
    <div className="pp-book-static-spine" data-notebook-part="spine">
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
    <div className="pp-book-static-pages">
      {Array.from({ length: PAGE_COUNT }, (_, index) => (
        <div className="pp-book-static-page" data-notebook-part="page" key={index} />
      ))}
    </div>
    <div className="pp-book-static-cover pp-book-cover-front" data-notebook-part="front-cover">
      <span>my</span>
      <strong>NOTEBOOK</strong>
      <small>paper games &amp; big feelings</small>
      <b>xoxo</b>
    </div>
  </div>
);

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <StaticNotebook /> : this.props.children;
  }
}

export const PhysicalNotebook = ({
  state,
  isOpen = false,
  onOpenChange,
  onNavigate,
  currentPageIndex,
  onPageChange,
}: PhysicalNotebookProps) => {
  const [reducedMotion, setReducedMotion] = useState(getReducedMotion);
  const [webglAvailable] = useState(detectWebGL);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
  const isExpanded = Boolean(isOpen);

  // When isOpen is false or state is closed (like on Homepage),
  // always render the clean, strictly closed StaticNotebook!
  // It opens ONLY on explicit click or keyboard Enter/Space.
  if (!isExpanded || state === 'closed' || reducedMotion || isJsdom || !webglAvailable) {
    return (
      <div
        className={`pp-book-scene is-${state} is-static`}
        data-notebook-state={state}
        data-turning-pages="5"
        aria-label="A pink physical notebook"
        role="button"
        tabIndex={0}
        onClick={() => onOpenChange?.(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenChange?.(true);
          }
        }}
      >
        <StaticNotebook />
      </div>
    );
  }

  return (
    <div
      className={`pp-book-scene is-${state} is-webgl is-expanded-open`}
      data-notebook-state={state}
      data-turning-pages="5"
      aria-label="A pink physical notebook"
      role="region"
    >
      <WebGLBoundary>
        <InteractiveNotebook
          state={state}
          isOpen={true}
          onOpenChange={(open) => {
            onOpenChange?.(open);
          }}
          onNavigate={(href) => {
            if (onNavigate) {
              onNavigate(href);
            } else if (typeof window !== 'undefined') {
              window.location.href = href;
            }
          }}
          currentPageIndex={currentPageIndex}
          onPageChange={onPageChange}
        />
      </WebGLBoundary>
    </div>
  );
};

export default PhysicalNotebook;
