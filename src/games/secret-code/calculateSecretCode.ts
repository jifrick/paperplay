import { validatePair } from '../../lib/validation';

export type SecretCodeLetter = {
  character: string;
  codePoint: number;
  cipherChar: string;
};

export type SecretCodeWalkthrough = {
  normalizedFirst: string;
  normalizedSecond: string;
  sortedPair: [string, string];
  firstLetters: SecretCodeLetter[];
  secondLetters: SecretCodeLetter[];
  hashValue: number;
  rawSeed: string;
  code: string;
  explanation: string;
};

export type SecretCodeCalculation = {
  status: 'complete';
  code: string;
  formattedCode: string;
  first: { name: string; letters: SecretCodeLetter[] };
  second: { name: string; letters: SecretCodeLetter[] };
  unsupportedCharacters: boolean;
  disclaimer: string;
  walkthrough: SecretCodeWalkthrough;
};

export const SECRET_CODE_DISCLAIMER =
  'Secret Code is a playful PAPERPLAY experience for two people. It is created for entertainment, not cryptographic security or authentication.';

/**
 * Deterministic alphabet for couple secret code generation:
 * Clean, readable uppercase alphanumeric characters excluding easily confused glyphs (0, O, 1, I).
 */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * 32-bit FNV-1a hash algorithm for deterministic, uniform code generation.
 */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG for deterministic stream generation from a 32-bit seed.
 */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Canonical name ordering: Sorts two normalized strings lexicographically
 * so that Person1 + Person2 and Person2 + Person1 yield identical codes.
 */
export function getCanonicalPair(a: string, b: string): [string, string] {
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  return normA <= normB ? [normA, normB] : [normB, normA];
}

/**
 * Generates a couple secret code:
 * Format: PP-XXXX-XXXX (version 1)
 */
export function generateSecretCodeString(first: string, second: string): string {
  const [canonical1, canonical2] = getCanonicalPair(first, second);
  const combinedSeedStr = `v1:${canonical1}#${canonical2}`;
  const seed = fnv1a(combinedSeedStr);
  const rng = mulberry32(seed);

  // Generate 8 characters from CODE_ALPHABET
  let part1 = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * CODE_ALPHABET.length);
    part1 += CODE_ALPHABET[idx];
  }

  let part2 = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng() * CODE_ALPHABET.length);
    part2 += CODE_ALPHABET[idx];
  }

  return `PP-${part1}-${part2}`;
}

/**
 * Main secret code calculation engine
 */
export const calculateSecretCode = (
  first: string,
  second: string
): SecretCodeCalculation | { status: 'invalid'; error: string } => {
  const validation = validatePair(first, second);
  if (!validation.valid) {
    return {
      status: 'invalid',
      error: validation.first.valid ? validation.second.message! : validation.first.message!,
    };
  }

  const makeLetters = (units: typeof validation.first.normalized.units): SecretCodeLetter[] => {
    return units.map((u) => {
      const char = u.value.toUpperCase();
      const codePoint = char.charCodeAt(0);
      const cipherIdx = (codePoint * 7 + 13) % CODE_ALPHABET.length;
      return {
        character: char,
        codePoint,
        cipherChar: CODE_ALPHABET[cipherIdx],
      };
    });
  };

  const firstLetters = makeLetters(validation.first.normalized.units);
  const secondLetters = makeLetters(validation.second.normalized.units);

  const formattedCode = generateSecretCodeString(
    validation.first.normalized.display,
    validation.second.normalized.display
  );

  const [sortedFirst, sortedSecond] = getCanonicalPair(
    validation.first.normalized.display,
    validation.second.normalized.display
  );

  const rawSeed = `v1:${sortedFirst}#${sortedSecond}`;
  const hashValue = fnv1a(rawSeed);

  const explanation = `Your private couple code "${formattedCode}" is deterministically generated from both names (${first.trim()} & ${second.trim()}).`;

  return {
    status: 'complete',
    code: formattedCode,
    formattedCode,
    first: { name: first.trim(), letters: firstLetters },
    second: { name: second.trim(), letters: secondLetters },
    unsupportedCharacters:
      validation.first.normalized.hasUnsupportedCharacters ||
      validation.second.normalized.hasUnsupportedCharacters,
    disclaimer: SECRET_CODE_DISCLAIMER,
    walkthrough: {
      normalizedFirst: validation.first.normalized.display,
      normalizedSecond: validation.second.normalized.display,
      sortedPair: [sortedFirst, sortedSecond],
      firstLetters,
      secondLetters,
      hashValue,
      rawSeed,
      code: formattedCode,
      explanation,
    },
  };
};

