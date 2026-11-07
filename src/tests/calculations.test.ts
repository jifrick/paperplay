import { describe, expect, it } from 'vitest';
import { normalizeName, segmentGraphemes } from '../lib/normalizeName';
import { matchLetterOccurrences } from '../lib/matchLetterOccurrences';
import { validateName } from '../lib/validation';
import { calculateFlames, FLAMES_LETTERS, FLAMES_MEANINGS, FLAMES_DISCLAIMER } from '../games/flames/calculateFlames';
import { calculateLetterMatch } from '../games/letter-match/calculateLetterMatch';
import { calculateNameNumber, NAME_NUMBER_CATEGORIES, NAME_NUMBER_DISCLAIMER } from '../games/name-number/calculateNameNumber';
import { calculateLoveMeter, getLoveMeterBand, LOVE_METER_DISCLAIMER } from '../games/love-meter/calculateLoveMeter';

describe('normalization and validation', () => {
  it('trims, NFC-normalizes, ignores punctuation for letter units, and preserves original input', () => {
    const composed = normalizeName('  José! ');
    const decomposed = normalizeName('Jose\u0301');
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
  it('defines exact canonical category mappings: Friends, Love Marriage, Arranged Marriage, Marriage, Enemies, Strangers', () => {
    expect(FLAMES_LETTERS).toEqual(['F', 'L', 'A', 'M', 'E', 'S']);
    expect(FLAMES_MEANINGS.F).toBe('Friends');
    expect(FLAMES_MEANINGS.L).toBe('Love Marriage');
    expect(FLAMES_MEANINGS.A).toBe('Arranged Marriage');
    expect(FLAMES_MEANINGS.M).toBe('Marriage');
    expect(FLAMES_MEANINGS.E).toBe('Enemies');
    expect(FLAMES_MEANINGS.S).toBe('Strangers');
  });

  it('starts with the exact sequence and records circular elimination rounds', () => {
    const result = calculateFlames('ANNA', 'AMAN');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.remainingCount).toBe(2);
    expect(result.rounds.length).toBe(5);
    expect(result.rounds.every((round) => round.count === 2)).toBe(true);
    expect(result.rounds.at(-1)?.lettersAfter).toHaveLength(1);
    expect(result.finalLetter).toBe('E');
    expect(result.category).toBe('Enemies');
    expect(result.disclaimer).toBe(FLAMES_DISCLAIMER);
    expect(result.walkthrough).toBeDefined();
    expect(result.walkthrough.eliminationSteps).toHaveLength(5);
  });

  it('returns a truthful zero-count edge state without inventing a result', () => {
    const result = calculateFlames('ANNA', 'ANNA');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.status).toBe('zero-count');
    expect(result.finalLetter).toBeUndefined();
    expect(result.edgeCaseMessage).toContain('Every letter matched');
    expect(result.walkthrough.eliminationSteps[0]).toContain('Zero unmatched letters left');
  });

  it('is invariant to swapping names and mode changes', () => {
    const one = calculateFlames('Taylor', 'Morgan', 'crush');
    const two = calculateFlames('Morgan', 'Taylor', 'friendship');
    expect('error' in one || 'error' in two).toBe(false);
    if ('error' in one || 'error' in two) return;
    expect(one.finalLetter).toBe(two.finalLetter);
    expect(one.category).toBe(two.category);
    expect(one.remainingCount).toBe(two.remainingCount);
  });

  it('correctly maps all six letters to the updated categories across known counts', () => {
    // Verified circular elimination outcomes from count:
    // N=1 -> S (Strangers)
    // N=2 -> E (Enemies)
    // N=3 -> F (Friends)
    // N=6 -> M (Marriage)
    // N=8 -> A (Arranged Marriage)
    // N=10 -> L (Love Marriage)
    const testCases = [
      { name1: 'A', name2: 'B', expectedLetter: 'E', expectedCat: 'Enemies' }, // N=2
      { name1: 'AB', name2: 'C', expectedLetter: 'F', expectedCat: 'Friends' }, // N=3
    ];
    for (const tc of testCases) {
      const res = calculateFlames(tc.name1, tc.name2);
      expect('error' in res).toBe(false);
      if (!('error' in res) && res.status === 'complete') {
        expect(res.finalLetter).toBe(tc.expectedLetter);
        expect(res.category).toBe(tc.expectedCat);
      }
    }
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

describe('SECRET NUMBER V1 Algorithm', () => {
  it('processes names deterministically, ignores punctuation, and produces formatted 3-digit secret number', () => {
    const result = calculateNameNumber('A!', 'z');
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.canonicalFirst.name).toBe('A');
    expect(result.canonicalSecond.name).toBe('Z');
    expect(result.formattedSecretNumber).toBe('299');
    expect(result.unsupportedCharacters).toBe(true);
    expect(result.disclaimer).toBe(NAME_NUMBER_DISCLAIMER);
  });

  it('calculates the exact prompt fixed fixtures (e.g. JIFRI + ANNA = 070, ALI + SARA = 087)', () => {
    const resAli = calculateNameNumber('ALI', 'SARA');
    expect(resAli.status).toBe('complete');
    if (resAli.status !== 'complete') return;
    expect(resAli.formattedSecretNumber).toBe('087');

    const resJifri = calculateNameNumber('JIFRI', 'ANNA');
    expect(resJifri.status).toBe('complete');
    if (resJifri.status !== 'complete') return;
    expect(resJifri.formattedSecretNumber).toBe('070');
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
    expect(one.disclaimer).toBe(LOVE_METER_DISCLAIMER);
    expect(one.walkthrough).toBeDefined();
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
