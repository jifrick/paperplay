import { describe, expect, it } from 'vitest';
import {
  calculateSecretCode,
  generateSecretCodeString,
  getCanonicalPair,
  SECRET_CODE_DISCLAIMER,
} from '../games/secret-code/calculateSecretCode';

describe('SECRET CODE Generator', () => {
  it('formats code with standard PP-XXXX-XXXX format', () => {
    const code = generateSecretCodeString('Anna', 'Aman');
    expect(code).toMatch(/^PP-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  });

  it('is deterministic: identical names always yield the exact same code', () => {
    const code1 = generateSecretCodeString('Romeo', 'Juliet');
    const code2 = generateSecretCodeString('Romeo', 'Juliet');
    expect(code1).toBe(code2);
  });

  it('is order-independent: reversing name pairs yields the exact same couple code', () => {
    const codeAB = generateSecretCodeString('Oliver', 'Sophia');
    const codeBA = generateSecretCodeString('Sophia', 'Oliver');
    expect(codeAB).toBe(codeBA);
  });

  it('normalizes whitespace and case differences without altering the generated code', () => {
    const clean = generateSecretCodeString('Lucas', 'Emma');
    const messy = generateSecretCodeString('  lucas   ', 'EMMA  ');
    expect(clean).toBe(messy);
  });

  it('produces distinct codes for different couples', () => {
    const code1 = generateSecretCodeString('Jack', 'Rose');
    const code2 = generateSecretCodeString('Peter', 'Wendy');
    expect(code1).not.toBe(code2);
  });

  it('returns invalid status if one or both names are missing', () => {
    const res1 = calculateSecretCode('', 'Aman');
    expect(res1.status).toBe('invalid');

    const res2 = calculateSecretCode('Anna', '   ');
    expect(res2.status).toBe('invalid');
  });

  it('produces a complete calculation object with letters and disclaimer', () => {
    const res = calculateSecretCode('Anna', 'Aman');
    expect(res.status).toBe('complete');
    if (res.status === 'complete') {
      expect(res.code).toMatch(/^PP-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
      expect(res.first.name).toBe('Anna');
      expect(res.second.name).toBe('Aman');
      expect(res.first.letters.length).toBe(4);
      expect(res.second.letters.length).toBe(4);
      expect(res.disclaimer).toBe(SECRET_CODE_DISCLAIMER);
    }
  });
});

