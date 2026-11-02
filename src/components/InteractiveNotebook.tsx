import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Gauge,
  Hash,
  Heart,
  Pencil,
  Sparkles,
  X,
} from 'lucide-react';
import './InteractiveNotebook.css';

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
}

export const InteractiveNotebook: React.FC<InteractiveNotebookProps> = ({
  onNavigate,
  isOpen,
  onOpenChange,
  currentPageIndex = 0,
  onPageChange,
}) => {
  const [activePage, setActivePage] = useState(currentPageIndex);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const notebookRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Sync external page index if passed
  useEffect(() => {
    setActivePage(currentPageIndex);
  }, [currentPageIndex]);

  const updatePage = (newIndex: number) => {
    setActivePage(newIndex);
    onPageChange?.(newIndex);
  };

  const handleNextPage = () => {
    if (isFlipping || activePage >= NOTEBOOK_PAGES.length - 1) return;
    setIsFlipping(true);
    setFlipDirection('next');
    setTimeout(() => {
      updatePage(activePage + 1);
      setFlipDirection(null);
      setIsFlipping(false);
    }, 550);
  };

  const handlePrevPage = () => {
    if (isFlipping || activePage <= 0) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    setTimeout(() => {
      updatePage(activePage - 1);
      setFlipDirection(null);
      setIsFlipping(false);
    }, 550);
  };

  const handleOpen = () => {
    onOpenChange(true);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, activePage, isFlipping]);

  // Mouse tilt on closed notebook
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);
    setMouseTilt({
      x: Math.max(-1, Math.min(1, normX)),
      y: Math.max(-1, Math.min(1, normY)),
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseTilt({ x: 0, y: 0 });
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
    setTouchStartX(null);
  };

  const currentPage = NOTEBOOK_PAGES[activePage];
  const nextTargetPage = flipDirection === 'next' && activePage < NOTEBOOK_PAGES.length - 1 ? NOTEBOOK_PAGES[activePage + 1] : null;
  const prevTargetPage = flipDirection === 'prev' && activePage > 0 ? NOTEBOOK_PAGES[activePage - 1] : null;

  // Dynamic 3D transform for closed state
  const closedTransform = !isOpen
    ? `perspective(1200px) rotateX(${isHovered ? -mouseTilt.y * 7 : 0}deg) rotateY(${
        isHovered ? mouseTilt.x * 9 + 4 : 4
      }deg) rotateZ(-1.5deg) translateZ(${isHovered ? 12 : 0}px)`
    : 'none';

  return (
    <div
      ref={notebookRef}
      className={`interactive-notebook-wrapper ${isOpen ? 'is-open' : 'is-closed'} ${
        isFlipping ? `is-flipping flip-${flipDirection}` : ''
      }`}
      aria-label="Interactive 3D notebook of childhood games"
      role="region"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={isOpen ? handleTouchStart : undefined}
      onTouchEnd={isOpen ? handleTouchEnd : undefined}
    >
      {/* 1. CLOSED NOTEBOOK VIEW */}
      {!isOpen && (
        <div
          className="interactive-notebook-closed"
          style={{ transform: closedTransform }}
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
          {/* Natural drop shadow under the book */}
          <div
            className="closed-shadow"
            style={{
              transform: isHovered
                ? `translate(${mouseTilt.x * -18}px, ${mouseTilt.y * 12 + 28}px) scale(${1 + Math.abs(mouseTilt.x) * 0.05})`
                : 'translate(0px, 24px) scale(1)',
              opacity: isHovered ? 0.35 : 0.24,
            }}
          />

          {/* Realistic physical back cover layer */}
          <div className="closed-back-cover" data-notebook-part="back-cover" />

          {/* Layered paper edges showing real stack thickness */}
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

          {/* Bound spine with metallic rings */}
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

          {/* Front cover */}
          <div className="closed-front-cover pp-book-cover-front" data-notebook-part="front-cover">
            {/* Subtle paper / cloth grain */}
            <div className="cover-grain-overlay" />
            {/* Embossed cover border */}
            <div className="cover-border-emboss" />

            <div className="cover-title-group">
              <span className="cover-script-small">my</span>
              <strong className="cover-main-title">NOTEBOOK</strong>
              <small className="cover-subtitle">paper games &amp; big feelings</small>
            </div>

            {/* Handwritten corner signature */}
            <b className="cover-signature">xoxo ♡</b>

            {/* Subtle specular sheen that follows mouse pointer */}
            {isHovered && (
              <div
                className="cover-specular"
                style={{
                  background: `radial-gradient(circle at ${(mouseTilt.x + 1) * 50}% ${(mouseTilt.y + 1) * 50}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)`,
                }}
              />
            )}
          </div>

          {/* Floating interaction cue badge */}
          <div className="open-cue-pill">
            <span className="cue-pulse-dot" />
            <span className="cue-pencil-icon">✎</span>
            <span className="cue-text">Open your notebook</span>
            <ArrowRight size={14} className="cue-arrow" />
          </div>
        </div>
      )}

      {/* 2. OPEN NOTEBOOK SPREAD */}
      {isOpen && (
        <div className="interactive-notebook-open" aria-live="polite">
          {/* Top navigation & control bar */}
          <div className="notebook-top-bar">
            {/* Page tabs */}
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
                      setTimeout(() => {
                        updatePage(idx);
                        setFlipDirection(null);
                        setIsFlipping(false);
                      }, 500);
                    }
                  }}
                >
                  <span className="tab-num">{page.pageNumber}</span>
                  <span className="tab-name">{page.title}</span>
                </button>
              ))}
            </div>

            {/* Close button */}
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

          {/* Open notebook 3D book spread */}
          <div className="open-book-spread">
            {/* Dynamic drop shadow under open spread */}
            <div className="open-spread-shadow" />

            {/* Back cover base under open sheets */}
            <div className="open-base-cover" />

            {/* LEFT PAGE: Notebook doodles & ritual rules */}
            <div className="open-page left-page">
              {/* Paper background lines & red margin */}
              <div className="page-paper-lines" />
              <div className="page-margin-red" />

              {/* Stacked paper edge thickness on the left */}
              <div
                className="left-edge-thickness"
                style={{ width: `${Math.max(3, (activePage + 1) * 3)}px` }}
              />

              <div className="left-page-content">
                <div className="page-header-row">
                  <span className="doodle-badge">{currentPage.leftNoteHeader}</span>
                  <span className="doodle-star">✦</span>
                </div>

                {/* Hand-drawn game illustration & formulas */}
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

              {/* Dog-ear corner on bottom-left for previous page */}
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

            {/* CENTER SPINE BINDING WITH SPIRAL COILS */}
            <div className="open-spine-center" aria-hidden="true">
              <div className="spine-seam" />
              <div className="spine-spiral-rings">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="open-spiral-coil">
                    <span className="coil-shadow" />
                    <span className="coil-loop" />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PAGE: Active game entry */}
            <div className="open-page right-page">
              <div className="page-paper-lines" />
              <div className="page-margin-red" />

              {/* Stacked paper edge thickness on the right */}
              <div
                className="right-edge-thickness"
                style={{ width: `${Math.max(3, (NOTEBOOK_PAGES.length - activePage) * 3)}px` }}
              />

              <div className="right-page-content">
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

                {/* Tags / Pills */}
                <div className="game-tags-list">
                  {currentPage.tags.map((tag, i) => (
                    <span key={i} className="game-detail-tag">
                      <Sparkles size={12} className="tag-sparkle" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Play CTA Button */}
                <div className="game-play-action">
                  <button
                    className="notebook-play-button"
                    onClick={() => onNavigate(currentPage.route)}
                  >
                    <span>Play {currentPage.title}</span>
                    <ArrowRight size={17} />
                  </button>
                  <span className="play-direct-note">✎ opens notebook page</span>
                </div>

                <div className="right-page-footer">
                  <span className="footer-ritual-step">{currentPage.ritualStep}</span>
                </div>
              </div>

              {/* Dog-ear corner on bottom-right for next page */}
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

            {/* 3D TURNING PAGE OVERLAY DURING FLIP */}
            {isFlipping && (
              <div
                className={`turning-page-sheet turn-direction-${flipDirection}`}
                aria-hidden="true"
              >
                <div className="turning-page-face turning-page-front">
                  <div className="page-paper-lines" />
                  <div className="turning-shadow-curl" />
                  <div className="turning-preview-text">
                    {flipDirection === 'next' ? currentPage.title : prevTargetPage?.title}
                  </div>
                </div>
                <div className="turning-page-face turning-page-back">
                  <div className="page-paper-lines" />
                  <div className="turning-shadow-curl" />
                  <div className="turning-preview-text">
                    {flipDirection === 'next' ? nextTargetPage?.title : currentPage.title}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom navigation dock */}
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

            <div className="page-counter-pill">
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
        </div>
      )}
    </div>
  );
};
