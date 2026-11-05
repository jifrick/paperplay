import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import './InteractiveNotebook.css';
import type { NotebookState } from './PhysicalNotebook';

export type NotebookPageId = 'flames' | 'name-number' | 'love-meter';

export interface GamePageData {
  id: NotebookPageId;
  pageNumber: string;
  eyebrow: string;
  title: string;
  route: string;
  accent: string;
  tagline: string;
  summary: string;
  ritualStep: string;
  leftNoteHeader: string;
  leftNoteBody: string;
  leftDoodle: 'flames' | 'cipher' | 'meter';
  tags: string[];
}

export const NOTEBOOK_PAGES: GamePageData[] = [
  {
    id: 'flames',
    pageNumber: '01',
    eyebrow: 'A notebook classic',
    title: 'FLAMES Classic',
    route: '/games/flames',
    accent: '#f25575',
    tagline: 'Write two names. Cross matching letters. Count what survives.',
    summary:
      'The sacred back-of-the-notebook ritual. Letters pair up one-to-one, and the count cycles through Friends, Love, Affection, Marriage, Enemies, and Siblings until one true fate remains.',
    ritualStep: 'Step 1: Write two names · Step 2: Cross out letters · Step 3: Count & reveal',
    leftNoteHeader: '— the schoolyard ritual —',
    leftNoteBody:
      'Never write in ink until you are certain. Count the surviving letters together, strike off each fate in order, and protect the answer from prying eyes.',
    leftDoodle: 'flames',
    tags: ['6 classic fates', 'Deterministic calculation', 'Pure childhood ritual'],
  },
  {
    id: 'name-number',
    pageNumber: '02',
    eyebrow: 'A1Z26, notebook style',
    title: 'Name Number',
    route: '/games/name-number',
    accent: '#8b5cf6',
    tagline: 'Turn every A–Z letter into a number and add up a deterministic score.',
    summary:
      'A = 1, B = 2, C = 3, all the way to Z = 26. Every letter shows its exact value, subtotals add up in the margin, and the sum creates a transparent notebook score.',
    ritualStep: 'A=1, B=2 ... Z=26 · Add subtotals · Find your combined number',
    leftNoteHeader: '— A1Z26 cipher cheat sheet —',
    leftNoteBody:
      'The simplest cipher in school. No guessing, no hidden algorithms. Add both names together and check if your numbers align.',
    leftDoodle: 'cipher',
    tags: ['A1Z26 standard', 'Transparent math', 'Step-by-step breakdown'],
  },
  {
    id: 'love-meter',
    pageNumber: '03',
    eyebrow: 'A playful score out of 100',
    title: 'Love Meter',
    route: '/games/love-meter',
    accent: '#ec4899',
    tagline: 'Blend letter overlap with name-length balance for an unserious reading.',
    summary:
      '80% letter match overlap + 20% name-length harmony. Crafted for big laughs, friendly debates, and harmless schoolyard nostalgia.',
    ritualStep: '80% letter overlap + 20% length balance = 100% harmless fun',
    leftNoteHeader: '— margin formula notes —',
    leftNoteBody:
      'Not science, not relationship advice, just delightfully unserious notebook math for friends, crushes, and fictional characters.',
    leftDoodle: 'meter',
    tags: ['Fictional score out of 100', '100% harmless fun', 'Instant reveal'],
  },
];

export interface InteractiveNotebookProps {
  onNavigate: (href: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPageIndex?: number;
  onPageChange?: (index: number) => void;
  state?: NotebookState;
}

export type VisualPhase = 'closed' | 'opening' | 'open' | 'settling' | 'closing';

export const InteractiveNotebook: React.FC<InteractiveNotebookProps> = ({
  onNavigate,
  isOpen,
  onOpenChange,
  currentPageIndex = 0,
  onPageChange,
}) => {
  const [activePage, setActivePage] = useState(currentPageIndex);
  const [visualPhase, setVisualPhase] = useState<VisualPhase>(isOpen ? 'open' : 'closed');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );

  const notebookRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const transitionTimerRef = useRef<number | null>(null);

  // Reduced motion preference detection
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  // Sync external page index if passed
  useEffect(() => {
    setActivePage(currentPageIndex);
  }, [currentPageIndex]);

  // Synchronize visualPhase with isOpen prop changes
  useEffect(() => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (isOpen) {
      if (visualPhase === 'closed') {
        if (reducedMotion) {
          setVisualPhase('open');
        } else {
          setVisualPhase('opening');
          transitionTimerRef.current = window.setTimeout(() => {
            setVisualPhase('settling');
            transitionTimerRef.current = window.setTimeout(() => {
              setVisualPhase('open');
            }, 180);
          }, 680);
        }
      }
    } else {
      if (visualPhase === 'open' || visualPhase === 'settling' || visualPhase === 'opening') {
        if (reducedMotion) {
          setVisualPhase('closed');
        } else {
          setVisualPhase('closing');
          transitionTimerRef.current = window.setTimeout(() => {
            setVisualPhase('closed');
          }, 620);
        }
      }
    }

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, [isOpen, reducedMotion]);

  const updatePage = (newIndex: number) => {
    setActivePage(newIndex);
    onPageChange?.(newIndex);
  };

  const handleNextPage = () => {
    if (isFlipping || activePage >= NOTEBOOK_PAGES.length - 1) return;
    setIsFlipping(true);
    setFlipDirection('next');
    const delay = reducedMotion ? 10 : 520;
    setTimeout(() => {
      updatePage(activePage + 1);
      setFlipDirection(null);
      setIsFlipping(false);
    }, delay);
  };

  const handlePrevPage = () => {
    if (isFlipping || activePage <= 0) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    const delay = reducedMotion ? 10 : 520;
    setTimeout(() => {
      updatePage(activePage - 1);
      setFlipDirection(null);
      setIsFlipping(false);
    }, delay);
  };

  const handleOpen = () => {
    if (visualPhase === 'opening' || visualPhase === 'open') return;
    onOpenChange(true);
  };

  const handleClose = () => {
    if (visualPhase === 'closing' || visualPhase === 'closed') return;
    onOpenChange(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (visualPhase !== 'open' && visualPhase !== 'settling') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visualPhase, activePage, isFlipping]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 42) {
      if (diff > 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
    setTouchStartX(null);
  };

  const currentPage = NOTEBOOK_PAGES[activePage];
  const nextTargetPage =
    flipDirection === 'next' && activePage < NOTEBOOK_PAGES.length - 1
      ? NOTEBOOK_PAGES[activePage + 1]
      : null;
  const prevTargetPage =
    flipDirection === 'prev' && activePage > 0 ? NOTEBOOK_PAGES[activePage - 1] : null;

  const isClosed = visualPhase === 'closed';
  const isOpening = visualPhase === 'opening';
  const isSettling = visualPhase === 'settling';
  const isOpenState = visualPhase === 'open';
  const isClosing = visualPhase === 'closing';
  const isDisplayingSpread = isOpenState || isSettling || isOpening || isClosing;

  return (
    <div
      ref={notebookRef}
      className={`interactive-notebook-wrapper ${isClosed ? 'is-closed' : 'is-open'} phase-${visualPhase} ${
        isFlipping ? `is-flipping flip-${flipDirection}` : ''
      }`}
      aria-label="Interactive 3D notebook of childhood games"
      role="region"
      onTouchStart={isDisplayingSpread ? handleTouchStart : undefined}
      onTouchEnd={isDisplayingSpread ? handleTouchEnd : undefined}
    >
      {/* 1. TOP NAVIGATION BAR (Visible when notebook is open or transitioning) */}
      {isDisplayingSpread && (
        <div className="notebook-top-bar" aria-label="Notebook header bar">
          <div className="notebook-page-tabs" role="tablist" aria-label="Notebook pages">
            {NOTEBOOK_PAGES.map((page, idx) => (
              <button
                key={page.id}
                role="tab"
                aria-selected={activePage === idx}
                className={`notebook-tab-pill ${activePage === idx ? 'active' : ''}`}
                onClick={() => {
                  if (idx !== activePage && !isFlipping) {
                    setFlipDirection(idx > activePage ? 'next' : 'prev');
                    setIsFlipping(true);
                    const delay = reducedMotion ? 10 : 500;
                    setTimeout(() => {
                      updatePage(idx);
                      setFlipDirection(null);
                      setIsFlipping(false);
                    }, delay);
                  }
                }}
              >
                <span className="tab-num">{page.pageNumber}</span>{' '}
                <span className="tab-name">{page.title}</span>
              </button>
            ))}
          </div>

          <button
            className="notebook-close-button"
            onClick={handleClose}
            aria-label="Close notebook"
            title="Close notebook (Esc)"
          >
            <X size={16} />
            <span>Close notebook</span>
          </button>
        </div>
      )}

      {/* 2. THE 3D NOTEBOOK STAGE */}
      <div className="notebook-3d-stage">
        <div
          className={`notebook-ground-shadow ${isClosed ? 'closed-shadow-mode' : 'spread-shadow-mode'}`}
          style={
            isClosed
              ? {
                  opacity: 0.24,
                }
              : undefined
          }
        />

        {/* A. CLOSED NOTEBOOK VIEW */}
        {isClosed && (
          <div
            className="interactive-notebook-closed"
            onClick={handleOpen}
            role="button"
            tabIndex={0}
            aria-label="Open your notebook"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpen();
              }
            }}
          >
            <div className="closed-back-cover" data-notebook-part="back-cover" />

            <div className="closed-paper-stack" data-notebook-part="paper-block">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className="closed-paper-edge-sheet"
                  data-notebook-part="page"
                  style={{
                    transform: `translate(${i * 1.5}px, ${i * 1.5}px) translateZ(${i * 0.8}px)`,
                  }}
                />
              ))}
            </div>

            <div className="closed-spine" data-notebook-part="spine">
              <div className="closed-spine-crease" />
              <div className="closed-spine-rings">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="closed-ring">
                    <span className="ring-highlight" />
                  </div>
                ))}
              </div>
            </div>

            <div
              className="closed-front-cover pp-book-cover-front"
              data-notebook-part="front-cover"
            >
              <div className="cover-grain-overlay" />
              <div className="cover-border-emboss" />

              <div className="cover-title-group">
                <span className="cover-script-small">my</span>
                <strong className="cover-main-title">NOTEBOOK</strong>
                <small className="cover-subtitle">paper games &amp; big feelings</small>
              </div>

              <b className="cover-signature">xoxo ♡</b>
            </div>

            <div className="open-cue-pill">
              <span className="cue-pulse-dot" />
              <span className="cue-pencil-icon">✎</span>
              <span className="cue-text">Open your notebook</span>
              <ArrowRight size={14} className="cue-arrow" />
            </div>
          </div>
        )}

        {/* B. OPEN / TRANSITIONING NOTEBOOK SPREAD */}
        {isDisplayingSpread && (
          <div className="open-book-spread" aria-live="polite">
            <div className="open-base-cover" data-notebook-part="back-cover" />

            <div className="open-paper-edge-stack" data-notebook-part="paper-block">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="open-paper-edge-layer" data-notebook-part="page" />
              ))}
            </div>

            {/* LEFT PAGE */}
            <div className="open-page left-page">
              <div className="page-paper-lines" />
              <div className="page-margin-red" />

              <div
                className="left-edge-thickness"
                style={{ width: `${Math.max(3, (activePage + 1) * 3.5)}px` }}
              />

              <div className="left-page-content">
                <div className="page-header-row">
                  <span className="doodle-badge">{currentPage.leftNoteHeader}</span>
                  <span className="doodle-star">✦</span>
                </div>

                <div className="left-doodle-area">
                  {currentPage.leftDoodle === 'flames' && (
                    <div className="flames-doodle-art" aria-hidden="true">
                      <div className="doodle-flames-letters">
                        <span className="letter-circle">F</span>
                        <span className="letter-circle">L</span>
                        <span className="letter-circle">A</span>
                        <span className="letter-circle active-survivor">M</span>
                        <span className="letter-circle">E</span>
                        <span className="letter-circle">S</span>
                      </div>
                      <div className="doodle-crossed-names">
                        <span className="strike-name">A̶ n n a</span>
                        <span className="plus-sign">+</span>
                        <span className="strike-name">A̶ m a n</span>
                      </div>
                      <p className="doodle-crossout-caption">
                        <span>✎ 2 matching &lsquo;A&rsquo;s crossed out</span>
                        <span className="doodle-heart-small">♡</span>
                      </p>
                    </div>
                  )}

                  {currentPage.leftDoodle === 'cipher' && (
                    <div className="cipher-doodle-art" aria-hidden="true">
                      <div className="cipher-grid">
                        <div className="cipher-pair"><span>A</span><b>1</b></div>
                        <div className="cipher-pair"><span>B</span><b>2</b></div>
                        <div className="cipher-pair"><span>C</span><b>3</b></div>
                        <div className="cipher-pair"><span>...</span><b>...</b></div>
                        <div className="cipher-pair"><span>Z</span><b>26</b></div>
                      </div>
                      <div className="cipher-calc-scribble">
                        <code>Anna = 1 + 14 + 14 + 1 = 30</code>
                        <span className="scribble-check">✓</span>
                      </div>
                    </div>
                  )}

                  {currentPage.leftDoodle === 'meter' && (
                    <div className="meter-doodle-art" aria-hidden="true">
                      <div className="meter-sketch">
                        <div className="meter-bar-track">
                          <div className="meter-bar-fill" />
                        </div>
                        <span className="meter-sketch-heart">♡</span>
                      </div>
                      <p className="meter-calc-formula">
                        <span>80% Letter Match</span>
                        <span>+</span>
                        <span>20% Name Balance</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="left-handwritten-note">
                  <p>{currentPage.leftNoteBody}</p>
                </div>

                <div className="left-page-footer">
                  <span className="pencil-doodle-icon">✎ childhood paper games</span>
                  <span className="secret-note-tag">keep this secret ♡</span>
                </div>
              </div>

              {activePage > 0 && (
                <button
                  className="page-corner dog-ear-left"
                  onClick={handlePrevPage}
                  aria-label="Turn to previous page"
                  title="Turn back (Left Arrow)"
                  disabled={isFlipping}
                >
                  <div className="corner-fold" />
                  <span className="corner-tooltip">⟵ Prev</span>
                </button>
              )}
            </div>

            {/* CENTER SPINE */}
            <div className="open-spine-center" data-notebook-part="spine" aria-hidden="true">
              <div className="spine-seam" />
              <div className="spine-spiral-rings">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="open-spiral-coil">
                    <span className="punch-hole left-punch" />
                    <span className="coil-shadow" />
                    <span className="coil-loop" />
                    <span className="punch-hole right-punch" />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PAGE */}
            <div className="open-page right-page">
              <div className="page-paper-lines" />
              <div className="page-margin-red" />

              <div
                className="right-edge-thickness"
                style={{
                  width: `${Math.max(3, (NOTEBOOK_PAGES.length - activePage) * 3.5)}px`,
                }}
              />

              <div className="right-page-content">
                <div className="mobile-doodle-strip" aria-hidden="true">
                  <span className="mobile-doodle-star">✦</span>
                  <span className="mobile-doodle-caption">
                    {currentPage.id === 'flames'
                      ? 'FLAMES letter elimination ritual ♡'
                      : currentPage.id === 'name-number'
                      ? 'A1Z26 cipher arithmetic notes ✓'
                      : '80/20 harmony formula doodle ♡'}
                  </span>
                </div>

                <div className="page-header-row">
                  <span className="eyebrow-handwritten">{currentPage.eyebrow}</span>
                  <span className="page-number-script">Page {currentPage.pageNumber}</span>
                </div>

                <h2 className="game-entry-title" id={titleId}>
                  {currentPage.title}
                  <span className="title-doodle-underline" />
                </h2>

                <p className="game-tagline">{currentPage.tagline}</p>
                <p className="game-summary">{currentPage.summary}</p>

                <div className="game-tags-list">
                  {currentPage.tags.map((tag, i) => (
                    <span key={i} className="game-detail-tag">
                      <Sparkles size={12} className="tag-sparkle" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="game-play-action">
                  <button
                    className="notebook-play-button"
                    onClick={() => onNavigate(currentPage.route)}
                    aria-label={`Play ${currentPage.title}`}
                  >
                    <span>Play this game</span>
                    <ArrowRight size={17} />
                  </button>
                  <span className="play-direct-note">✎ opens notebook page</span>
                </div>

                <div className="right-page-footer">
                  <span className="footer-ritual-step">{currentPage.ritualStep}</span>
                </div>
              </div>

              {activePage < NOTEBOOK_PAGES.length - 1 && (
                <button
                  className="page-corner dog-ear-right"
                  onClick={handleNextPage}
                  aria-label="Turn to next page"
                  title="Turn page (Right Arrow)"
                  disabled={isFlipping}
                >
                  <div className="corner-fold" />
                  <span className="corner-tooltip">Next ➔</span>
                </button>
              )}
            </div>

            {/* 3. 3D HINGED FRONT COVER */}
            {(isOpening || isClosing || isSettling) && (
              <div
                className={`hinged-cover-overlay ${isOpening ? 'opening-motion' : ''} ${
                  isClosing ? 'closing-motion' : ''
                } ${isSettling ? 'settling-motion' : ''}`}
                data-notebook-part="front-cover"
                aria-hidden="true"
              >
                <div className="hinged-cover-face cover-face-outer pp-book-cover-front">
                  <div className="cover-grain-overlay" />
                  <div className="cover-border-emboss" />
                  <div className="cover-title-group">
                    <span className="cover-script-small">my</span>
                    <strong className="cover-main-title">NOTEBOOK</strong>
                    <small className="cover-subtitle">paper games &amp; big feelings</small>
                  </div>
                  <b className="cover-signature">xoxo ♡</b>
                </div>

                <div className="hinged-cover-face cover-face-inner">
                  <div className="page-paper-lines" />
                  <div className="inner-endpaper-content">
                    <span className="endpaper-script">Welcome to my</span>
                    <h3 className="endpaper-title">Childhood Notebook</h3>
                    <p className="endpaper-note">
                      Flip the pages to find classic pen-and-paper rituals, schoolyard math, and harmless fun.
                    </p>
                    <span className="endpaper-doodle">✦ ✎ ♡</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 3D TURNING PAGE OVERLAY */}
            {isFlipping && (
              <div
                className={`turning-page-sheet turn-direction-${flipDirection}`}
                aria-hidden="true"
              >
                <div className="turning-page-face turning-page-front">
                  <div className="page-paper-lines" />
                  <div className="turning-shadow-curl" />
                  <div className="turning-content-preview">
                    <span className="turning-tag">p. {currentPage.pageNumber}</span>
                    <strong className="turning-title">{currentPage.title}</strong>
                    <span className="turning-icon">✎</span>
                  </div>
                </div>
                <div className="turning-page-face turning-page-back">
                  <div className="page-paper-lines" />
                  <div className="turning-shadow-curl" />
                  <div className="turning-content-preview">
                    <span className="turning-tag">
                      p. {flipDirection === 'next' ? nextTargetPage?.pageNumber : prevTargetPage?.pageNumber}
                    </span>
                    <strong className="turning-title">
                      {flipDirection === 'next' ? nextTargetPage?.title : prevTargetPage?.title}
                    </strong>
                    <span className="turning-icon">♡</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. BOTTOM DOCK CONTROLS */}
      {isDisplayingSpread && (
        <div className="notebook-bottom-nav">
          <button
            className="page-turn-btn prev-btn"
            onClick={handlePrevPage}
            disabled={activePage <= 0 || isFlipping}
            aria-label="Go to previous game"
          >
            <ChevronLeft size={18} />
            <span>Previous Page</span>
          </button>

          <div className="page-counter-pill" aria-label={`Page ${activePage + 1} of ${NOTEBOOK_PAGES.length}`}>
            <span className="counter-current">{activePage + 1}</span>
            <span className="counter-sep">/</span>
            <span className="counter-total">{NOTEBOOK_PAGES.length}</span>
          </div>

          <button
            className="page-turn-btn next-btn"
            onClick={handleNextPage}
            disabled={activePage >= NOTEBOOK_PAGES.length - 1 || isFlipping}
            aria-label="Go to next game"
          >
            <span>Next Page</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
