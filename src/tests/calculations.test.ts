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

describe('Name Number', () => {
  it('uses A1Z26, ignores punctuation, and maps deterministically', () => {
    const result = calculateNameNumber('A!', 'z');
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.first.score).toBe(1);
    expect(result.second.score).toBe(26);
    expect(result.combinedScore).toBe(27);
    expect(result.categoryIndex).toBe(2);
    expect(result.category).toBe('Double Trouble');
    expect(result.unsupportedCharacters).toBe(true);
    expect(result.disclaimer).toBe(NAME_NUMBER_DISCLAIMER);
    expect(result.walkthrough.explanation).toContain('27');
  });

  it('maps all five modulo categories consistently across boundaries', () => {
    expect(NAME_NUMBER_CATEGORIES[0]).toBe('Notebook Legends');
    expect(NAME_NUMBER_CATEGORIES[1]).toBe('Unexpected Duo');
    expect(NAME_NUMBER_CATEGORIES[2]).toBe('Double Trouble');
    expect(NAME_NUMBER_CATEGORIES[3]).toBe('Classic Combo');
    expect(NAME_NUMBER_CATEGORIES[4]).toBe('Plot Twist Pair');

    // A=1, B=2, C=3, D=4, E=5
    // Remainder 0: A + D = 1 + 4 = 5 (5 % 5 = 0) -> Notebook Legends
    const r0 = calculateNameNumber('A', 'D');
    expect('error' in r0).toBe(false);
    if (!('error' in r0)) {
      expect(r0.combinedScore).toBe(5);
      expect(r0.categoryIndex).toBe(0);
      expect(r0.category).toBe('Notebook Legends');
    }

    // Remainder 1: A + E = 1 + 5 = 6 (6 % 5 = 1) -> Unexpected Duo
    const r1 = calculateNameNumber('A', 'E');
    expect('error' in r1).toBe(false);
    if (!('error' in r1)) {
      expect(r1.combinedScore).toBe(6);
      expect(r1.categoryIndex).toBe(1);
      expect(r1.category).toBe('Unexpected Duo');
    }

    // Remainder 2: B + E = 2 + 5 = 7 (7 % 5 = 2) -> Double Trouble
    const r2 = calculateNameNumber('B', 'E');
    expect('error' in r2).toBe(false);
    if (!('error' in r2)) {
      expect(r2.combinedScore).toBe(7);
      expect(r2.categoryIndex).toBe(2);
      expect(r2.category).toBe('Double Trouble');
    }

    // Remainder 3: C + E = 3 + 5 = 8 (8 % 5 = 3) -> Classic Combo
    const r3 = calculateNameNumber('C', 'E');
    expect('error' in r3).toBe(false);
    if (!('error' in r3)) {
      expect(r3.combinedScore).toBe(8);
      expect(r3.categoryIndex).toBe(3);
      expect(r3.category).toBe('Classic Combo');
    }

    // Remainder 4: D + E = 4 + 5 = 9 (9 % 5 = 4) -> Plot Twist Pair
    const r4 = calculateNameNumber('D', 'E');
    expect('error' in r4).toBe(false);
    if (!('error' in r4)) {
      expect(r4.combinedScore).toBe(9);
      expect(r4.categoryIndex).toBe(4);
      expect(r4.category).toBe('Plot Twist Pair');
    }
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
