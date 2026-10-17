export type NameUnit = {
  value: string;
  key: string;
  sourceIndex: number;
  isLatin: boolean;
  isAsciiLatin: boolean;
};

export type NormalizedName = {
  original: string;
  display: string;
  normalized: string;
  units: NameUnit[];
  latinUnits: NameUnit[];
  asciiLatinUnits: NameUnit[];
  inputGraphemeCount: number;
  hasUnsupportedCharacters: boolean;
};

type SegmenterLike = { segment: (input: string) => Iterable<{ segment: string }> };

const getSegmenter = (): SegmenterLike | undefined => {
  const IntlWithSegmenter = Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: string }) => SegmenterLike };
  return IntlWithSegmenter.Segmenter ? new IntlWithSegmenter.Segmenter(undefined, { granularity: 'grapheme' }) : undefined;
};

export const segmentGraphemes = (value: string): string[] => {
  const segmenter = getSegmenter();
  if (segmenter) return Array.from(segmenter.segment(value), (item) => item.segment);
  // Safe code-point fallback for older browsers: never index UTF-16 halves, and
  // keep combining marks, variation selectors, skin tones, and ZWJ sequences
  // attached to the preceding base character.
  const segments: string[] = [];
  for (const codePoint of Array.from(value)) {
    const previous = segments.at(-1);
    const joinsPrevious = Boolean(previous && (codePoint === '\u200D' || previous.endsWith('\u200D') || /^\p{M}/u.test(codePoint) || /[\uFE0E\uFE0F]/u.test(codePoint) || /[\u{1F3FB}-\u{1F3FF}]/u.test(codePoint)));
    if (joinsPrevious) segments[segments.length - 1] += codePoint;
    else segments.push(codePoint);
  }
  return segments;
};

const isLetter = (value: string): boolean => /^\p{L}/u.test(value);
const isLatin = (value: string): boolean => /^\p{Script=Latin}/u.test(value);
const isAsciiLatin = (value: string): boolean => /^[A-Za-z]$/.test(value);

export const normalizeName = (input: string): NormalizedName => {
  const display = input.trim().normalize('NFC');
  const graphemes = segmentGraphemes(display);
  const units: NameUnit[] = graphemes
    .map((value, sourceIndex) => ({
      value,
      key: value.toUpperCase(),
      sourceIndex,
      isLatin: isLatin(value),
      isAsciiLatin: isAsciiLatin(value),
    }))
    .filter((unit) => isLetter(unit.value));

  return {
    original: input,
    display,
    normalized: units.map((unit) => unit.value).join(''),
    units,
    latinUnits: units.filter((unit) => unit.isLatin),
    asciiLatinUnits: units.filter((unit) => unit.isAsciiLatin),
    inputGraphemeCount: graphemes.length,
    hasUnsupportedCharacters: graphemes.some((value) => !/^\s+$/u.test(value) && (!isLetter(value) || !isLatin(value))),
  };
};

export const getNameHint = (name: NormalizedName): string | undefined => {
  if (name.units.length === 0) return 'Enter at least one letter.';
  if (name.latinUnits.length !== name.units.length) return 'Non-Latin letters are not supported by the current notebook games.';
  return undefined;
};
