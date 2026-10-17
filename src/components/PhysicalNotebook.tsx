import { Component, lazy, Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import './PhysicalNotebook.css';

export type NotebookState = 'closed' | 'opening' | 'flipping' | 'holding' | 'closing';

export type PhysicalNotebookProps = {
  state: NotebookState;
};

const PAGE_COUNT = 7;
const WebGLNotebook = lazy(() => import('./PhysicalNotebook3D').then((module) => ({ default: module.PhysicalNotebook3D })));

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

const getReducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const StaticNotebook = () => (
  <div className="pp-book-static" aria-hidden="true">
    <div className="pp-book-static-back" data-notebook-part="back-cover" />
    <div className="pp-book-static-paper" data-notebook-part="paper-block" />
    <div className="pp-book-static-spine" data-notebook-part="spine"><i /><i /><i /><i /><i /></div>
    <div className="pp-book-static-pages">{Array.from({ length: PAGE_COUNT }, (_, index) => <div className="pp-book-static-page" data-notebook-part="page" key={index} />)}</div>
    <div className="pp-book-static-cover pp-book-cover-front" data-notebook-part="front-cover"><span>my</span><strong>NOTEBOOK</strong><small>paper games &amp; big feelings</small><b>xoxo</b></div>
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

export const PhysicalNotebook = ({ state }: PhysicalNotebookProps) => {
  const [reducedMotion, setReducedMotion] = useState(getReducedMotion);
  const [webglAvailable] = useState(detectWebGL);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const staticView = reducedMotion || !webglAvailable;
  return <div className={`pp-book-scene is-${state} ${staticView ? 'is-static' : 'is-webgl'}`} data-notebook-state={state} aria-label="A pink physical notebook" role="img">
    {staticView ? <StaticNotebook /> : <WebGLBoundary><Suspense fallback={<StaticNotebook />}><WebGLNotebook state={state} /></Suspense></WebGLBoundary>}
  </div>;
};

export default PhysicalNotebook;
