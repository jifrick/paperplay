import { describe, expect, it } from 'vitest';
import {
  calculateLetterValue,
  calculateNameFingerprint,
  calculateSecretNumberTrace,
  SECRET_NUMBER_DISCLAIMER,
} from '../games/name-number/calculateSecretNumber';

describe('SECRET NUMBER V1 — Exact Calculation Algorithm', () => {
  describe('Step C — Hidden Letter Mapping', () => {
    it('verifies letter mappings matching prompt specification', () => {
      // JIFRI
      expect(calculateLetterValue('J').mappedValue).toBe(75);
      expect(calculateLetterValue('I').mappedValue).toBe(68);
      expect(calculateLetterValue('F').mappedValue).toBe(47);
      expect(calculateLetterValue('R').mappedValue).toBe(34);

      // ANNA
      expect(calculateLetterValue('A').mappedValue).toBe(12);
      expect(calculateLetterValue('N').mappedValue).toBe(6);
    });

    it('verifies all 26 uppercase and lowercase letter mappings are dynamic and within range', () => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < 26; i++) {
        const char = alphabet[i];
        const resUpper = calculateLetterValue(char);
        const resLower = calculateLetterValue(char.toLowerCase());
        expect(resUpper.character).toBe(char);
        expect(resUpper.alphabetIndex).toBe(i);
        expect(resUpper.mappedValue).toBe(((7 * i + 11) % 97) + 1);
        expect(resLower.mappedValue).toBe(resUpper.mappedValue);
        expect(resUpper.mappedValue).toBeGreaterThanOrEqual(1);
        expect(resUpper.mappedValue).toBeLessThanOrEqual(97);
      }
    });
  });

  describe('Step D — Position-Based Name Fingerprint', () => {
    it('verifies fixed verification fingerprint for JIFRI (T = 327)', () => {
      const trace = calculateNameFingerprint('JIFRI', 1);
      expect(trace.length).toBe(5);
      expect(trace.baseLengthTerm).toBe(29 * 5); // 145
      expect(trace.terms).toHaveLength(5);

      // Check individual terms
      expect(trace.terms[0]).toEqual({
        position: 1,
        character: 'J',
        mappedValue: 75,
        pSquared: 1,
        valuePart: 75,
        linearPart: 13,
        termTotal: 88,
      });
      expect(trace.terms[1]).toEqual({
        position: 2,
        character: 'I',
        mappedValue: 68,
        pSquared: 4,
        valuePart: 272,
        linearPart: 26,
        termTotal: 298,
      });

      expect(trace.fingerprint).toBe(327);
    });

    it('verifies fixed verification fingerprint for ANNA (T = 528)', () => {
      const trace = calculateNameFingerprint('ANNA', 2);
      expect(trace.length).toBe(4);
      expect(trace.baseLengthTerm).toBe(29 * 4); // 116
      expect(trace.terms).toHaveLength(4);
      expect(trace.fingerprint).toBe(528);
    });
  });

  describe('Step E & Section 4 — Fixed Calculation Test Fixtures', () => {
    const fixedFixtures: [string, string, string][] = [
      ['JIFRI', 'ANNA', '070'],
      ['ANNA', 'JIFRI', '070'],
      ['ALI', 'SARA', '087'],
      ['SARA', 'ALI', '087'],
      ['JOHN SMITH', 'JANE DOE', '408'],
      ['A', 'B', '287'],
      ['ALEX', 'ALEX', '634'],
    ];

    it.each(fixedFixtures)(
      'calculates exactly %s + %s -> %s',
      (name1, name2, expected) => {
        const trace = calculateSecretNumberTrace(name1, name2);
        expect(trace.status).toBe('complete');
        if (trace.status !== 'complete') return;
        expect(trace.formattedSecretNumber).toBe(expected);
        expect(trace.formattedSecretNumber).toHaveLength(3);
      }
    );

    it('produces intermediate trace values for ANNA + JIFRI exactly matching the prompt', () => {
      // ANNA (canonical 1: T1=528, L1=4) and JIFRI (canonical 2: T2=327, L2=5)
      const trace = calculateSecretNumberTrace('JIFRI', 'ANNA');
      expect(trace.status).toBe('complete');
      if (trace.status !== 'complete') return;

      expect(trace.canonicalFirst.name).toBe('ANNA');
      expect(trace.canonicalFirst.fingerprint).toBe(528);
      expect(trace.canonicalSecond.name).toBe('JIFRI');
      expect(trace.canonicalSecond.fingerprint).toBe(327);

      expect(trace.combination.X).toBe(37050);
      expect(trace.combination.Y).toBe(337070);
      expect(trace.secretNumber).toBe(70);
      expect(trace.formattedSecretNumber).toBe('070');
      expect(trace.disclaimer).toBe(SECRET_NUMBER_DISCLAIMER);
    });

    it('enforces canonical order independence (commutative)', () => {
      const trace1 = calculateSecretNumberTrace('John Smith', 'Jane Doe');
      const trace2 = calculateSecretNumberTrace('Jane Doe', 'John Smith');
      expect(trace1.status).toBe('complete');
      expect(trace2.status).toBe('complete');
      if (trace1.status === 'complete' && trace2.status === 'complete') {
        expect(trace1.formattedSecretNumber).toBe(trace2.formattedSecretNumber);
        expect(trace1.combination).toEqual(trace2.combination);
      }
    });

    it('handles identical names properly', () => {
      const trace = calculateSecretNumberTrace('ALEX', 'ALEX');
      expect(trace.status).toBe('complete');
      if (trace.status === 'complete') {
        expect(trace.formattedSecretNumber).toBe('634');
      }
    });

    it('normalizes spaces, punctuation, and cases', () => {
      const trace = calculateSecretNumberTrace('  j.i-f_r!i  ', 'anna...');
      expect(trace.status).toBe('complete');
      if (trace.status === 'complete') {
        expect(trace.formattedSecretNumber).toBe('070');
        expect(trace.unsupportedCharacters).toBe(true);
      }
    });

    it('rejects empty inputs or inputs without scorable Latin letters', () => {
      expect(calculateSecretNumberTrace('', 'Anna').status).toBe('invalid');
      expect(calculateSecretNumberTrace('!!!', 'Anna').status).toBe('invalid');
      expect(calculateSecretNumberTrace('മലയാളം', 'Anna').status).toBe('invalid');
      expect(calculateSecretNumberTrace('José', 'Anna').status).toBe('invalid');
    });
  });
});
