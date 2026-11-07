import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, FastForward, Check, Copy, Share2, Info } from 'lucide-react';
import type { SecretNumberCalculationTrace } from '../games/name-number/calculateSecretNumber';

interface MathematicalNotebookProps {
  trace: SecretNumberCalculationTrace;
  onReset: () => void;
  onChangeNames: () => void;
  onToast: (msg: string) => void;
  reducedMotion?: boolean;
}

// Representing each written segment or symbol in sequence
interface CalculationLine {
  id: string;
  stage: 1 | 2 | 3 | 4 | 5;
  prefix?: string;
  text: string;
  emphasis?: boolean;
  indent?: boolean;
}

/**
 * Builds the exact step-by-step sequence of lines to be physically written by the pencil
 * from the Secret Number calculation trace.
 */
function buildCalculationLines(trace: SecretNumberCalculationTrace): CalculationLine[] {
  const { canonicalFirst, canonicalSecond, combination, originalFirst, originalSecond } = trace;
  const lines: CalculationLine[] = [];

  // STAGE 1: Hidden Letter Mapping
  lines.push({
    id: 's1-head',
    stage: 1,
    text: `1. Hidden Letter Mapping: V(c) = ((7 × i + 11) mod 97) + 1`,
  });

  lines.push({
    id: 's1-name1',
    stage: 1,
    text: `• Name 1: ${canonicalFirst.name} (L₁ = ${canonicalFirst.length})`,
  });

  canonicalFirst.mappings.forEach((m, idx) => {
    lines.push({
      id: `s1-n1-${idx}`,
      stage: 1,
      indent: true,
      text: `${m.character} (i = ${m.alphabetIndex}) ➔ V(${m.character}) = ${m.mappedValue}`,
    });
  });

  lines.push({
    id: 's1-name2',
    stage: 1,
    text: `• Name 2: ${canonicalSecond.name} (L₂ = ${canonicalSecond.length})`,
  });

  canonicalSecond.mappings.forEach((m, idx) => {
    lines.push({
      id: `s1-n2-${idx}`,
      stage: 1,
      indent: true,
      text: `${m.character} (i = ${m.alphabetIndex}) ➔ V(${m.character}) = ${m.mappedValue}`,
    });
  });

  // STAGE 2: Position-Based Fingerprint Formula
  lines.push({
    id: 's2-head',
    stage: 2,
    text: `2. Position-Based Fingerprint: T = (29L + Σ[V(cₚ) × p² + 13p]) mod 1009`,
  });

  // T1 formula expansion
  lines.push({
    id: 's2-t1-start',
    stage: 2,
    text: `T₁ (${canonicalFirst.name}) = (29 × ${canonicalFirst.length})`,
  });
  canonicalFirst.terms.forEach((t, idx) => {
    lines.push({
      id: `s2-t1-term-${idx}`,
      stage: 2,
      indent: true,
      text: `+ (${t.mappedValue} × ${t.position}² + 13 × ${t.position}) = + ${t.termTotal}`,
    });
  });
  lines.push({
    id: 's2-t1-res',
    stage: 2,
    emphasis: true,
    text: `➔ T₁ = ${canonicalFirst.totalBeforeMod} mod 1009 = ${canonicalFirst.fingerprint}`,
  });

  // T2 formula expansion
  lines.push({
    id: 's2-t2-start',
    stage: 2,
    text: `T₂ (${canonicalSecond.name}) = (29 × ${canonicalSecond.length})`,
  });
  canonicalSecond.terms.forEach((t, idx) => {
    lines.push({
      id: `s2-t2-term-${idx}`,
      stage: 2,
      indent: true,
      text: `+ (${t.mappedValue} × ${t.position}² + 13 × ${t.position}) = + ${t.termTotal}`,
    });
  });
  lines.push({
    id: 's2-t2-res',
    stage: 2,
    emphasis: true,
    text: `➔ T₂ = ${canonicalSecond.totalBeforeMod} mod 1009 = ${canonicalSecond.fingerprint}`,
  });

  // STAGE 3: Combination Formula (X)
  lines.push({
    id: 's3-head',
    stage: 3,
    text: `3. Combination: X = (37T₁ + 53T₂ + 17L₁ + 23L₂) mod 1000003`,
  });
  lines.push({
    id: 's3-sub',
    stage: 3,
    indent: true,
    text: `X = (37 × ${combination.T1} + 53 × ${combination.T2} + 17 × ${combination.L1} + 23 × ${combination.L2}) mod 1000003`,
  });
  lines.push({
    id: 's3-res',
    stage: 3,
    emphasis: true,
    text: `➔ X = ${combination.xSum} mod 1000003 = ${combination.X}`,
  });

  // STAGE 4: Final Mixing (Y)
  lines.push({
    id: 's4-head',
    stage: 4,
    text: `4. Final Mixing: Y = (48271X + 97(T₁+1)(T₂+1) + 7919(L₁+L₂)) mod 1000003`,
  });
  lines.push({
    id: 's4-sub',
    stage: 4,
    indent: true,
    text: `Y = (48271 × ${combination.X} + 97 × ${combination.T1 + 1} × ${combination.T2 + 1} + 7919 × ${combination.L1 + combination.L2}) mod 1000003`,
  });
  lines.push({
    id: 's4-res',
    stage: 4,
    emphasis: true,
    text: `➔ Y = ${combination.ySum} mod 1000003 = ${combination.Y}`,
  });

  // STAGE 5: Final Secret Number
  lines.push({
    id: 's5-head',
    stage: 5,
    text: `5. Secret Number: Y mod 1000 = ${combination.Y} mod 1000`,
  });
  lines.push({
    id: 's5-final',
    stage: 5,
    emphasis: true,
    text: `OUR SECRET NUMBER ➔ ${combination.formattedSecretNumber}`,
  });

  return lines;
}

export const MathematicalNotebook: React.FC<MathematicalNotebookProps> = ({
  trace,
  onReset,
  onChangeNames,
  onToast,
  reducedMotion = false,
}) => {
  const lines = useRef<CalculationLine[]>(buildCalculationLines(trace)).current;

  // State
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(reducedMotion ? lines.length : 0);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(reducedMotion ? 9999 : 0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Pencil Tip Coordinates relative to notebook container
  const [pencilPos, setPencilPos] = useState<{ x: number; y: number; isWriting: boolean; lifting: boolean } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const charSpanRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const timerRef = useRef<number | null>(null);

  const isCompleted = currentLineIndex >= lines.length;

  // Measure active character span to position the pencil tip exactly
  const updatePencilPosition = useCallback(() => {
    if (reducedMotion || isCompleted || !containerRef.current) {
      setPencilPos(null);
      return;
    }

    const currentLine = lines[currentLineIndex];
    if (!currentLine) return;

    const charKey = `${currentLine.id}-${currentCharIndex}`;
    const spanElem = charSpanRefs.current.get(charKey);
    const containerRect = containerRef.current.getBoundingClientRect();

    if (spanElem) {
      const charRect = spanElem.getBoundingClientRect();
      const x = charRect.right - containerRect.left;
      const y = charRect.bottom - containerRect.top - 4; // Right at baseline where pencil graphite touches
      setPencilPos({ x, y, isWriting: true, lifting: false });
    } else {
      // If at start of line or transitioning
      const firstCharKey = `${currentLine.id}-0`;
      const firstElem = charSpanRefs.current.get(firstCharKey);
      if (firstElem) {
        const firstRect = firstElem.getBoundingClientRect();
        const x = firstRect.left - containerRect.left;
        const y = firstRect.bottom - containerRect.top - 4;
        setPencilPos({ x, y, isWriting: false, lifting: true });
      }
    }
  }, [currentLineIndex, currentCharIndex, isCompleted, lines, reducedMotion]);

  useLayoutEffect(() => {
    updatePencilPosition();
  }, [updatePencilPosition]);

  // Handle window resizing to keep pencil positioned accurately
  useEffect(() => {
    const handleResize = () => updatePencilPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePencilPosition]);

  // Progressive writing loop
  useEffect(() => {
    if (reducedMotion || isPaused || isCompleted) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }

    const currentLine = lines[currentLineIndex];
    if (!currentLine) return;

    if (currentCharIndex < currentLine.text.length) {
      // Writing next character
      // Add slight organic human typing speed variation (18ms to 38ms)
      const char = currentLine.text[currentCharIndex];
      const isSpace = char === ' ';
      const isPunctuation = [',', '=', '+', '×', '(', ')'].includes(char);
      const delay = isSpace ? 28 : isPunctuation ? 45 : 22 + Math.floor(Math.random() * 15);

      timerRef.current = window.setTimeout(() => {
        setCurrentCharIndex((prev) => prev + 1);
      }, delay);
    } else {
      // Line finished! Natural pause before lifting pencil and moving to next line
      const isStageChange =
        lines[currentLineIndex + 1] &&
        lines[currentLineIndex + 1].stage !== currentLine.stage;
      const lineEndDelay = isStageChange ? 380 : 160;

      timerRef.current = window.setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, lineEndDelay);
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [currentLineIndex, currentCharIndex, isPaused, isCompleted, lines, reducedMotion]);

  // Controls
  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  const handleSkip = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setCurrentLineIndex(lines.length);
    setCurrentCharIndex(9999);
    setPencilPos(null);
  };

  const handleReplay = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsPaused(false);
  };

  const handleCopy = () => {
    const code = trace.formattedSecretNumber;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setCopied(true);
          onToast(`Secret Number ${code} copied to clipboard!`);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => onToast(`Secret Number: ${code}`));
    } else {
      onToast(`Secret Number: ${code}`);
    }
  };

  const handleShare = async () => {
    const code = trace.formattedSecretNumber;
    const title = 'Our Secret Number — PAPERPLAY';
    const text = `Our Secret Number is ${code} (created from ${trace.originalFirst.trim()} & ${trace.originalSecond.trim()}). Discover yours inside the PAPERPLAY notebook!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: window.location.href });
        onToast('Share sheet opened.');
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="math-notebook-container" aria-live="polite">
      <div className="math-notebook-page" ref={containerRef}>
        <div className="math-notebook-content">
          {/* Top Controls Toolbar */}
          <div className="math-notebook-toolbar">
            <div className="math-notebook-heading">
              <span>✎ Mathematical Notebook</span>
              <span className="math-stage-pill">
                {!isCompleted ? 'Writing Calculations...' : 'Calculation Complete'}
              </span>
            </div>

            <div className="math-toolbar-actions">
              {!isCompleted && (
                <>
                  <button
                    type="button"
                    className="math-tool-btn"
                    onClick={handlePauseResume}
                    aria-label={isPaused ? 'Resume writing' : 'Pause writing'}
                  >
                    {isPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    className="math-tool-btn"
                    onClick={handleSkip}
                    aria-label="Skip to final result"
                  >
                    <FastForward size={13} /> Skip
                  </button>
                </>
              )}
              {isCompleted && (
                <button
                  type="button"
                  className="math-tool-btn"
                  onClick={handleReplay}
                  aria-label="Replay handwriting animation"
                >
                  <RotateCcw size={13} /> Replay
                </button>
              )}
            </div>
          </div>

          {/* Names Header */}
          <div className="math-sheet-header">
            <div className="math-names-callout handwritten-ink">
              {trace.originalFirst.trim()} &amp; {trace.originalSecond.trim()}
            </div>
            <p className="math-canonical-note">
              <span>Canonical order:</span>
              <strong>1. {trace.canonicalFirst.name}</strong> + <strong>2. {trace.canonicalSecond.name}</strong>
            </p>
          </div>

          {/* Physically Written Lines */}
          <div className="math-written-lines-surface">
            {lines.map((line, lIdx) => {
              if (lIdx > currentLineIndex) return null;

              const isCurrentLine = lIdx === currentLineIndex;
              const textToRender = isCurrentLine
                ? line.text.slice(0, currentCharIndex)
                : line.text;

              return (
                <div
                  key={line.id}
                  className={`math-written-line stage-${line.stage} ${
                    line.indent ? 'is-indented' : ''
                  } ${line.emphasis ? 'is-emphasis' : ''}`}
                >
                  {line.text.split('').map((char, cIdx) => {
                    const isVisible = !isCurrentLine || cIdx < currentCharIndex;
                    const charKey = `${line.id}-${cIdx}`;

                    return (
                      <span
                        key={cIdx}
                        ref={(el) => {
                          if (el) charSpanRefs.current.set(charKey, el);
                          else charSpanRefs.current.delete(charKey);
                        }}
                        className={`math-handwritten-char ${isVisible ? 'visible' : 'hidden'}`}
                      >
                        {char === ' ' ? '\u00a0' : char}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* PHYSICAL PENCIL / PEN GRAPHIC THAT MOVES WITH THE WRITING */}
          {pencilPos && !isCompleted && !reducedMotion && (
            <div
              className={`physical-pencil-indicator ${pencilPos.lifting ? 'is-lifting' : 'is-drawing'}`}
              style={{
                left: `${pencilPos.x}px`,
                top: `${pencilPos.y}px`,
              }}
              aria-hidden="true"
            >
              {/* Detailed Real Pencil SVG SVG */}
              <svg
                className="pencil-drawing-graphic"
                viewBox="0 0 48 96"
                width="34"
                height="68"
              >
                {/* Pencil Body (yellow hexagonal pencil with graphite lead tip and pink eraser) */}
                <g transform="rotate(-32 10 90)">
                  {/* Lead tip at (10, 90) */}
                  <polygon points="10,90 6,80 14,80" fill="#2b2030" />
                  {/* Wood sharpen cone */}
                  <polygon points="6,80 14,80 16,68 4,68" fill="#e2c89f" />
                  {/* Yellow pencil barrel */}
                  <rect x="4" y="16" width="12" height="52" fill="#f59e0b" rx="1" />
                  <line x1="8" y1="16" x2="8" y2="68" stroke="#d97706" strokeWidth="1" />
                  <line x1="12" y1="16" x2="12" y2="68" stroke="#b45309" strokeWidth="1" />
                  {/* Metal ferrule */}
                  <rect x="4" y="8" width="12" height="8" fill="#94a3b8" />
                  <line x1="4" y1="12" x2="16" y2="12" stroke="#64748b" strokeWidth="1" />
                  {/* Pink Eraser top */}
                  <path d="M4,8 Q10,0 16,8 Z" fill="#f43f5e" />
                </g>
              </svg>
            </div>
          )}

          {/* Final Number Reveal Card when handwriting finishes */}
          {isCompleted && (
            <section className="math-reveal-card">
              <div className="math-reveal-kicker">OUR SPECIAL NUMBER</div>
              <div className="math-reveal-formula">
                SECRET NUMBER = {trace.combination.Y} mod 1000
              </div>

              <div className="math-number-circle-wrap">
                <svg className="handwritten-circle" viewBox="0 0 200 120" preserveAspectRatio="none">
                  <path d="M 30,60 C 25,25 90,15 150,25 C 190,32 195,85 160,100 C 110,115 40,105 28,75 C 20,55 50,30 95,22" />
                </svg>
                <div className="math-secret-digits">{trace.formattedSecretNumber}</div>
              </div>

              <div className="math-reveal-tagline">
                Two names. One special number to remember.
              </div>

              <div className="math-reveal-actions">
                <button type="button" className="notebook-button primary-button" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied Number!' : 'Copy Number'}
                </button>
                <button type="button" className="notebook-button secondary-button" onClick={handleShare}>
                  <Share2 size={16} /> Share Number
                </button>
                <button type="button" className="notebook-button text-button" onClick={onReset}>
                  <RotateCcw size={15} /> Calculate Again
                </button>
              </div>

              <p className="entertainment-note" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                <Info size={14} /> This is a personalized entertainment number, not encryption, a relationship prediction, or a security credential.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
