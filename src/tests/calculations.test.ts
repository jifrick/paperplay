import { describe, expect, it } from 'vitest';
import { normalizeName, segmentGraphemes } from '../lib/normalizeName';
import { matchLetterOccurrences } from '../lib/matchLetterOccurrences';
import { validateName } from '../lib/validation';
import { calculateFlames, FLAMES_LETTERS } from '../games/flames/calculateFlames';
import { calculateLetterMatch } from '../games/letter-match/calculateLetterMatch';
import { calculateNameNumber } from '../games/name-number/calculateNameNumber';
import { calculateLoveMeter, getLoveMeterBand } from '../games/love-meter/calculateLoveMeter';

describe('normalization and validation', () => {
  it('trims, NFC-normalizes, ignores punctuation for letter units, and preserves original input', () => {
    const composed = normalizeName('  José! ');
    const decomposed = normalizeName(`Jose\u0301`);
    expect(composed.original).toBe('  José! ');
    expect(composed.display).toBe('José!');
    expect(composed.normalized).toBe('José');
    expect(composed.normalized).toBe(decomposed.normalized);
    expect(composed.units.map((unit) => unit.value)).toEqual(['J', 'o', 's', 'é']);
  });

  it('segments emoji as one grapheme without using UTF-16 indexing', () => {
    expect(segmentGraphemes('👩🏽‍💻')).toHaveLength(1);
    expect(validateName('!!!').valid).toBe(false);
  });

  it('explains that A–Z-only games reject non-Latin-only values', () => {
    const validation = validateName('മലയാളം', { latinOnly: true });
    expect(validation.valid).toBe(false);
    expect(validation.message).toMatch(/Latin/);
  });

  it('enforces the documented grapheme boundary', () => {
    expect(validateName('A'.repeat(80)).valid).toBe(true);
    expect(validateName('A'.repeat(81)).valid).toBe(false);
  });
});

describe('occurrence-aware matching', () => {
  it('matches ANNA and AMAN one occurrence at a time', () => {
    const result = matchLetterOccurrences('ANNA', 'AMAN');
    expect(result.matchedPairCount).toBe(3);
    expect(result.matchedOccurrenceCount).toBe(6);
    expect(result.totalUnmatchedCount).toBe(2);
    expect(result.unmatchedFirst.map((unit) => unit.value)).toEqual(['N']);
    expect(result.unmatchedSecond.map((unit) => unit.value)).toEqual(['M']);
  });

  it('is symmetric when names are swapped', () => {
    const one = matchLetterOccurrences('Ally', 'Sally');
    const two = matchLetterOccurrences('Sally', 'Ally');
    expect(one.matchedPairCount).toBe(two.matchedPairCount);
    expect(one.totalUnmatchedCount).toBe(two.totalUnmatchedCount);
  });

  it('matches ASCII case independently of the runtime locale', () => {
    const result = matchLetterOccurrences('i', 'I');
    expect(result.matchedPairCount).toBe(1);
    expect(result.totalUnmatchedCount).toBe(0);
  });

  it('does not over-match repeated characters', () => {
    const result = matchLetterOccurrences('AAA', 'A');
    expect(result.matchedPairCount).toBe(1);
    expect(result.unmatchedFirst).toHaveLength(2);
  });

  it('rejects non-Latin letters for FLAMES without partially calculating them', () => {
    expect('error' in calculateFlames('Alex', 'Алекс')).toBe(true);
    expect('error' in calculateFlames('Alex', 'Aлекс')).toBe(true);
  });
});

describe('FLAMES', () => {
  it('starts with the exact sequence and records circular elimination rounds', () => {
    const result = calculateFlames('ANNA', 'AMAN');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(FLAMES_LETTERS).toEqual(['F', 'L', 'A', 'M', 'E', 'S']);
    expect(result.remainingCount).toBe(2);
    expect(result.rounds.length).toBe(5);
    expect(result.rounds.every((round) => round.count === 2)).toBe(true);
    expect(result.rounds.at(-1)?.lettersAfter).toHaveLength(1);
    expect(result.finalLetter).toBeDefined();
  });

  it('returns a truthful zero-count edge state without inventing a result', () => {
    const result = calculateFlames('ANNA', 'ANNA');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.status).toBe('zero-count');
    expect(result.finalLetter).toBeUndefined();
    expect(result.edgeCaseMessage).toContain('Every letter matched');
  });

  it('is invariant to swapping names and mode changes', () => {
    const one = calculateFlames('Taylor', 'Morgan', 'crush');
    const two = calculateFlames('Morgan', 'Taylor', 'friendship');
    expect('error' in one || 'error' in two).toBe(false);
    if ('error' in one || 'error' in two) return;
    expect(one.finalLetter).toBe(two.finalLetter);
    expect(one.remainingCount).toBe(two.remainingCount);
  });
});

describe('Letter Match', () => {
  it('exposes pair count separately from occurrence count', () => {
    const result = calculateLetterMatch('ANNA', 'AMAN');
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.matchedPairCount).toBe(3);
    expect(result.matchedOccurrenceCount).toBe(6);
    expect(result.totalUnmatchedCount).toBe(2);
  });
});

describe('Name Number', () => {
  it('uses A1Z26, ignores punctuation, and maps deterministically', () => {
    const result = calculateNameNumber('A!', 'z');
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.first.score).toBe(1);
    expect(result.second.score).toBe(26);
    expect(result.combinedScore).toBe(27);
    expect(result.category).toBe('Double Trouble');
    expect(result.unsupportedCharacters).toBe(true);
  });

  it('rejects a name with no scorable A–Z letters', () => {
    expect(calculateNameNumber('മലയാളം', 'Alex').status).toBe('invalid');
  });

  it('rejects accented letters rather than partially scoring them', () => {
    expect(calculateNameNumber('José', 'Alex').status).toBe('invalid');
  });
});

describe('Love Meter', () => {
  it('is deterministic, symmetric, and clamped', () => {
    const one = calculateLoveMeter('Anna', 'Aman');
    const two = calculateLoveMeter('Aman', 'Anna');
    expect(one.status).toBe('complete');
    expect(two.status).toBe('complete');
    if (one.status !== 'complete' || two.status !== 'complete') return;
    expect(one.score).toBe(two.score);
    expect(one.score).toBeGreaterThanOrEqual(0);
    expect(one.score).toBeLessThanOrEqual(100);
    expect(one.matchedPairs).toBe(3);
  });

  it('maps every specified band boundary', () => {
    expect(getLoveMeterBand(0).label).toBe('Different Pages');
    expect(getLoveMeterBand(24).label).toBe('Different Pages');
    expect(getLoveMeterBand(25).label).toBe('A Curious Combination');
    expect(getLoveMeterBand(49).label).toBe('A Curious Combination');
    expect(getLoveMeterBand(50).label).toBe('Same Notebook Energy');
    expect(getLoveMeterBand(74).label).toBe('Same Notebook Energy');
    expect(getLoveMeterBand(75).label).toBe('A Page Full of Similarities');
    expect(getLoveMeterBand(89).label).toBe('A Page Full of Similarities');
    expect(getLoveMeterBand(90).label).toBe('Notebook Soulmates');
    expect(getLoveMeterBand(100).label).toBe('Notebook Soulmates');
    expect(getLoveMeterBand(101).label).toBe('Notebook Soulmates');
    expect(getLoveMeterBand(-1).label).toBe('Different Pages');
  });

  it('keeps the documented weighted score separate from the rounded score', () => {
    const result = calculateLoveMeter('AB', 'CD');
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.score).toBe(20);
    expect(result.rawScore).toBe(20);
  });
});
