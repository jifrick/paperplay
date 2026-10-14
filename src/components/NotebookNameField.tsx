import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';
import { Eraser, Pencil } from 'lucide-react';
import { segmentGraphemes } from '../lib/normalizeName';

type Point = { left: number; top: number };
type CharacterRange = { index: number; start: number; end: number };

type WriteAnimation = {
  kind: 'write';
  token: number;
  indexes: number[];
  bulk: boolean;
};

type EraseAnimation = {
  kind: 'erase';
  token: number;
  positions: Point[];
};

// Deliberate writing paths (rather than font outlines) for the letters most
// commonly used in names. The pencil and graphite share this exact geometry.
// Unsupported glyphs use the normal progressive reveal instead of pretending
// that a font outline contains handwriting stroke order.
const GLYPH_PATHS: Record<string, string> = {
  J: 'M4 4 C9 3 15 3 20 4 M15 4 L15 29 C15 37 11 40 6 38 C2 37 2 32 4 29',
  I: 'M4 4 C9 3 15 3 20 4 M12 4 L12 38 M4 38 C9 39 15 39 20 38',
  F: 'M20 4 C14 4 8 4 4 5 L4 38 M5 20 C10 20 14 20 18 20',
  R: 'M5 38 L5 4 C12 2 20 5 19 12 C18 18 12 19 5 18 M12 19 L21 38',
  A: 'M3 38 L11 4 L20 38 M6 25 L17 25',
  T: 'M3 5 C9 4 15 4 21 5 M12 5 L12 38',
  L: 'M5 4 L5 38 C10 39 15 39 20 38',
  E: 'M19 5 C14 4 9 4 5 5 L5 38 C10 39 15 39 20 38 M6 21 L17 21',
  M: 'M4 38 L4 5 L12 24 L20 5 L20 38',
  S: 'M20 7 C16 3 7 3 5 8 C2 15 18 15 19 23 C21 34 7 41 3 33',
};

const getGlyphPath = (character: string) => GLYPH_PATHS[character.toUpperCase()];

type NotebookNameFieldProps = {
  id: string;
  label: string;
  value: string;
  active: boolean;
  reducedMotion: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onFocus: () => void;
  onChange: (value: string) => void;
  onEnter: () => void;
};

const WRITE_STEP_MS = 150;
const MAX_WRITE_ANIMATION_MS = 900;
const ERASE_STEP_MS = 115;

const getCharacterRanges = (value: string): CharacterRange[] => {
  let offset = 0;
  return segmentGraphemes(value).map((character, index) => {
    const start = offset;
    offset += character.length;
    return { index, start, end: offset };
  });
};

const getIndexesInRange = (value: string, start: number, end: number): number[] =>
  getCharacterRanges(value)
    .filter((range) => range.start < end && range.end > start)
    .map((range) => range.index);

const getPreviousGraphemeStart = (value: string, caret: number): number => {
  const ranges = getCharacterRanges(value);
  return ranges.find((range) => range.end === caret)?.start ?? Math.max(0, caret - 1);
};

const getNextGraphemeEnd = (value: string, caret: number): number => {
  const ranges = getCharacterRanges(value);
  return ranges.find((range) => range.start === caret)?.end ?? Math.min(value.length, caret + 1);
};

const findInsertedIndexes = (before: string, after: string): number[] => {
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) suffix += 1;

  const insertedEnd = after.length - suffix;
  return getCharacterRanges(after)
    .filter((range) => range.start < insertedEnd && range.end > prefix)
    .map((range) => range.index);
};

const PencilCursor = ({ point }: { point: Point }) => (
  <span
    className="notebook-cursor notebook-pencil-cursor"
    style={{ left: point.left, top: point.top }}
    aria-hidden="true"
  >
    <Pencil size={30} strokeWidth={1.8} />
  </span>
);

const EraserCursor = ({ point }: { point: Point }) => (
  <span
    className="notebook-cursor notebook-eraser-cursor"
    style={{ left: point.left, top: point.top }}
    aria-hidden="true"
  >
    <Eraser size={27} strokeWidth={1.8} />
  </span>
);

export const NotebookNameField = ({
  id,
  label,
  value,
  active,
  reducedMotion,
  inputRef,
  onFocus,
  onChange,
  onEnter,
}: NotebookNameFieldProps) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const characterRefs = useRef(new Map<number, HTMLSpanElement>());
  const previousValue = useRef(value);
  const lastLocalValue = useRef(value);
  const pendingErase = useRef<{ positions: Point[] } | null>(null);
  const animationToken = useRef(0);
  const [animation, setAnimation] = useState<WriteAnimation | EraseAnimation | null>(null);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [writeProgress, setWriteProgress] = useState(0);

  const getPointForElement = (element: Element): Point | null => {
    const surface = surfaceRef.current;
    if (!surface) return null;
    const surfaceRect = surface.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left - surfaceRect.left,
      top: rect.top - surfaceRect.top + rect.height / 2,
    };
  };

  const getPointsForIndexes = (indexes: number[]): Point[] =>
    indexes
      .map((index) => characterRefs.current.get(index))
      .map((element) => (element ? getPointForElement(element) : null))
      .filter((point): point is Point => point !== null);

  const prepareErase = (key: 'Backspace' | 'Delete') => {
    const input = inputRef.current;
    if (!input || !value) return;
    const selectionStart = input.selectionStart ?? value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    let start = selectionStart;
    let end = selectionEnd;

    if (selectionStart === selectionEnd) {
      if (key === 'Backspace') start = getPreviousGraphemeStart(value, selectionStart);
      else end = getNextGraphemeEnd(value, selectionEnd);
    }
    if (start === end) return;

    pendingErase.current = { positions: getPointsForIndexes(getIndexesInRange(value, start, end)) };
  };

  const handleChange = (nextValue: string) => {
    const before = previousValue.current;
    previousValue.current = nextValue;
    lastLocalValue.current = nextValue;
    onChange(nextValue);

    if (nextValue.length < before.length) {
      const pending = pendingErase.current;
      pendingErase.current = null;
      const positions = pending?.positions ?? [];
      if (!reducedMotion && positions.length > 0) {
        animationToken.current += 1;
        setAnimation({ kind: 'erase', token: animationToken.current, positions });
      }
      return;
    }

    pendingErase.current = null;
    const indexes = findInsertedIndexes(before, nextValue);
    if (!reducedMotion && indexes.length > 0) {
      animationToken.current += 1;
      setAnimation({ kind: 'write', token: animationToken.current, indexes, bulk: indexes.length > 8 });
    }
  };

  useEffect(() => {
    previousValue.current = value;
    if (lastLocalValue.current !== value) {
      pendingErase.current = null;
      setAnimation(null);
      setCursorPoint(null);
    }
  }, [value]);

  useEffect(() => {
    if (!animation || reducedMotion) {
      setCursorPoint(null);
      if (reducedMotion) setAnimation(null);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = animation.kind === 'erase'
      ? Math.max(220, animation.positions.length * ERASE_STEP_MS)
      : Math.min(MAX_WRITE_ANIMATION_MS, Math.max(220, animation.indexes.length * WRITE_STEP_MS));
    const positions = animation.kind === 'erase' ? animation.positions : [];
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setWriteProgress(progress);
      if (animation.kind === 'write') {
        const current = animation.indexes[Math.min(animation.indexes.length - 1, Math.floor(progress * animation.indexes.length))];
        const element = characterRefs.current.get(current);
        const path = element?.querySelector<SVGPathElement>('.notebook-glyph-path');
        let point = element ? getPointForElement(element) : null;
        if (path) {
          const length = path.getTotalLength();
          const at = path.getPointAtLength(length * ((progress * animation.indexes.length) % 1));
          const rect = path.getBoundingClientRect();
          const surface = surfaceRef.current?.getBoundingClientRect();
          if (surface) point = { left: rect.left - surface.left + at.x * rect.width / 24, top: rect.top - surface.top + at.y * rect.height / 42 };
        }
        if (point) setCursorPoint(point);
      } else if (positions.length > 0) {
        setCursorPoint(positions[Math.min(positions.length - 1, Math.floor(progress * positions.length))]);
      }

      if (progress < 1) frame = window.requestAnimationFrame(update);
      else {
        setCursorPoint(null);
        setAnimation(null);
      }
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [animation, reducedMotion, value]);

  useLayoutEffect(() => {
    if (!animation || animation.kind !== 'write' || reducedMotion) return;
    const firstIndex = animation.indexes[0];
    const element = characterRefs.current.get(firstIndex);
    const point = element ? getPointForElement(element) : null;
    if (point) setCursorPoint(point);
  }, [animation, reducedMotion, value]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    const isComposing = event.nativeEvent.isComposing;
    if (event.key === 'Enter' && isComposing) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onEnter();
      return;
    }
    if (event.key === 'Backspace' || event.key === 'Delete') prepareErase(event.key);
  };

  const handleBeforeInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const inputType = (event.nativeEvent as InputEvent).inputType;
    if (inputType === 'deleteContentBackward') prepareErase('Backspace');
    if (inputType === 'deleteContentForward') prepareErase('Delete');
  };

  const graphemes = segmentGraphemes(value);
  const writingIndexes = animation?.kind === 'write' ? new Set(animation.indexes) : new Set<number>();

  return (
    <div className={`notebook-name-field ${active ? 'is-active' : ''}`}>
      <div className="notebook-field-label">
        <label htmlFor={id}>{label}</label>
        <span>{active ? 'pencil ready' : 'tap to write'}</span>
      </div>
      <div className="notebook-writing-surface" ref={surfaceRef}>
        <div className="notebook-ink" aria-hidden="true">
          {graphemes.length === 0 && <span className="notebook-placeholder">write a name...</span>}
          {graphemes.map((character, index) => (
            <span
              className={`notebook-character ${writingIndexes.has(index) ? 'is-writing' : ''}`}
              data-character-index={index}
              key={`${index}-${character}`}
              ref={(element) => {
                if (element) characterRefs.current.set(index, element);
                else characterRefs.current.delete(index);
              }}
              style={{ '--write-delay': animation?.kind === 'write' && !animation.bulk ? `${animation.indexes.indexOf(index) * WRITE_STEP_MS}ms` : '0ms' } as CSSProperties}
            >
              {getGlyphPath(character) && writingIndexes.has(index) ? (
                <><span className="notebook-glyph-text">{character}</span><svg className="notebook-glyph" viewBox="0 0 24 42" aria-hidden="true">
                  <path className="notebook-glyph-path" d={getGlyphPath(character)} pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: Math.max(0, 1 - Math.min(1, writeProgress * (animation?.kind === 'write' ? animation.indexes.length : 1) - (animation?.kind === 'write' ? animation.indexes.indexOf(index) : 0))) }} />
                </svg></>
              ) : character === ' ' ? '\u00a0' : character}
            </span>
          ))}
        </div>
        <textarea
          ref={inputRef}
          id={id}
          name={id}
          className="notebook-native-input"
          value={value}
          rows={1}
          wrap="soft"
          autoComplete="off"
          aria-describedby={`${id}-hint`}
          onFocus={onFocus}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBeforeInput={handleBeforeInput}
        />
        {cursorPoint && animation?.kind === 'write' && <PencilCursor point={cursorPoint} />}
        {cursorPoint && animation?.kind === 'erase' && <EraserCursor point={cursorPoint} />}
      </div>
      <div className="notebook-field-footer">
        <span id={`${id}-hint`}>Type, click between letters, or use Backspace and Delete to edit.</span>
      </div>
    </div>
  );
};
