import { validatePair } from '../../lib/validation';

export type CharacterMapping = {
  character: string;
  alphabetIndex: number; // A=0 ... Z=25
  mappedValue: number;   // V(c) = ((7 * i + 11) mod 97) + 1
};

export type FingerprintTerm = {
  position: number;      // p starting from 1
  character: string;
  mappedValue: number;   // V(c_p)
  pSquared: number;      // p^2
  valuePart: number;     // V(c_p) * p^2
  linearPart: number;    // 13 * p
  termTotal: number;     // V(c_p) * p^2 + 13 * p
};

export type NameFingerprintTrace = {
  canonicalIndex: 1 | 2;
  name: string;
  length: number;
  baseLengthTerm: number; // 29 * L
  mappings: CharacterMapping[];
  terms: FingerprintTerm[];
  termsSum: number;
  totalBeforeMod: number; // 29L + termsSum
  fingerprint: number;    // T = totalBeforeMod mod 1009
};

export type CombinationTrace = {
  T1: number;
  T2: number;
  L1: number;
  L2: number;
  term37T1: number; // 37 * T1
  term53T2: number; // 53 * T2
  term17L1: number; // 17 * L1
  term23L2: number; // 23 * L2
  xSum: number;
  X: number; // xSum mod 1000003

  term48271X: number; // 48271 * X
  term97Cross: number; // 97 * (T1 + 1) * (T2 + 1)
  term7919Lengths: number; // 7919 * (L1 + L2)
  ySum: number;
  Y: number; // ySum mod 1000003

  secretNumber: number; // Y mod 1000
  formattedSecretNumber: string; // 3 digits padded e.g. "070"
};

export type SecretNumberCalculationTrace = {
  status: 'complete';
  originalFirst: string;
  originalSecond: string;
  normalizedFirst: string;
  normalizedSecond: string;
  canonicalFirst: NameFingerprintTrace;
  canonicalSecond: NameFingerprintTrace;
  combination: CombinationTrace;
  secretNumber: number;
  formattedSecretNumber: string;
  unsupportedCharacters: boolean;
  disclaimer: string;
};

export const SECRET_NUMBER_DISCLAIMER =
  'Secret Number is a personalized entertainment calculation for two names, not encryption, a relationship prediction, or a security credential.';

/**
 * Letter mapping formula:
 * i = zero-based alphabet position (A=0 ... Z=25)
 * V(c) = ((7 * i + 11) mod 97) + 1
 */
export const calculateLetterValue = (char: string): CharacterMapping => {
  const upper = char.toUpperCase();
  const alphabetIndex = upper.charCodeAt(0) - 65;
  const mappedValue = ((7 * alphabetIndex + 11) % 97) + 1;
  return {
    character: upper,
    alphabetIndex,
    mappedValue,
  };
};

/**
 * Calculates position-based name fingerprint:
 * T = (29L + sum_{p=1..L} [V(c_p) * p^2 + 13p]) mod 1009
 */
export const calculateNameFingerprint = (
  name: string,
  canonicalIndex: 1 | 2,
): NameFingerprintTrace => {
  const L = name.length;
  const baseLengthTerm = 29 * L;
  const mappings: CharacterMapping[] = [];
  const terms: FingerprintTerm[] = [];
  let termsSum = 0;

  for (let p = 1; p <= L; p++) {
    const char = name[p - 1];
    const mapping = calculateLetterValue(char);
    mappings.push(mapping);

    const pSquared = p * p;
    const valuePart = mapping.mappedValue * pSquared;
    const linearPart = 13 * p;
    const termTotal = valuePart + linearPart;
    termsSum += termTotal;

    terms.push({
      position: p,
      character: mapping.character,
      mappedValue: mapping.mappedValue,
      pSquared,
      valuePart,
      linearPart,
      termTotal,
    });
  }

  const totalBeforeMod = baseLengthTerm + termsSum;
  const fingerprint = totalBeforeMod % 1009;

  return {
    canonicalIndex,
    name,
    length: L,
    baseLengthTerm,
    mappings,
    terms,
    termsSum,
    totalBeforeMod,
    fingerprint,
  };
};

/**
 * Full calculation engine implementing the exact PAPERPLAY Secret Number v1 mathematical algorithm.
 */
export const calculateSecretNumberTrace = (
  first: string,
  second: string,
): SecretNumberCalculationTrace | { status: 'invalid'; error: string } => {
  const validation = validatePair(first, second, { asciiOnly: true });
  if (!validation.valid) {
    return {
      status: 'invalid',
      error: validation.first.valid ? validation.second.message! : validation.first.message!,
    };
  }

  // Extract uppercase normalized A-Z letters
  const norm1 = validation.first.normalized.asciiLatinUnits.map((u) => u.value.toUpperCase()).join('');
  const norm2 = validation.second.normalized.asciiLatinUnits.map((u) => u.value.toUpperCase()).join('');

  if (!norm1 || !norm2) {
    return {
      status: 'invalid',
      error: 'Each name must contain at least one English letter (A–Z).',
    };
  }

  // Canonical name ordering: sort deterministic alphabetically
  const canonicalList = [norm1, norm2].sort((a, b) => a.localeCompare(b));
  const canonicalFirstStr = canonicalList[0];
  const canonicalSecondStr = canonicalList[1];

  const canonicalFirst = calculateNameFingerprint(canonicalFirstStr, 1);
  const canonicalSecond = calculateNameFingerprint(canonicalSecondStr, 2);

  const T1 = canonicalFirst.fingerprint;
  const T2 = canonicalSecond.fingerprint;
  const L1 = canonicalFirst.length;
  const L2 = canonicalSecond.length;

  // STEP E: Combination Formulas
  // X = (37T1 + 53T2 + 17L1 + 23L2) mod 1000003
  const term37T1 = 37 * T1;
  const term53T2 = 53 * T2;
  const term17L1 = 17 * L1;
  const term23L2 = 23 * L2;
  const xSum = term37T1 + term53T2 + term17L1 + term23L2;
  const X = xSum % 1000003;

  // Y = (48271X + 97(T1 + 1)(T2 + 1) + 7919(L1 + L2)) mod 1000003
  const term48271X = 48271 * X;
  const term97Cross = 97 * (T1 + 1) * (T2 + 1);
  const term7919Lengths = 7919 * (L1 + L2);
  const ySum = term48271X + term97Cross + term7919Lengths;
  const Y = ySum % 1000003;

  // SECRET NUMBER = Y mod 1000
  const secretNumber = Y % 1000;
  const formattedSecretNumber = String(secretNumber).padStart(3, '0');

  const combination: CombinationTrace = {
    T1,
    T2,
    L1,
    L2,
    term37T1,
    term53T2,
    term17L1,
    term23L2,
    xSum,
    X,
    term48271X,
    term97Cross,
    term7919Lengths,
    ySum,
    Y,
    secretNumber,
    formattedSecretNumber,
  };

  return {
    status: 'complete',
    originalFirst: first,
    originalSecond: second,
    normalizedFirst: norm1,
    normalizedSecond: norm2,
    canonicalFirst,
    canonicalSecond,
    combination,
    secretNumber,
    formattedSecretNumber,
    unsupportedCharacters:
      validation.first.normalized.hasUnsupportedCharacters ||
      validation.second.normalized.hasUnsupportedCharacters,
    disclaimer: SECRET_NUMBER_DISCLAIMER,
  };
};

export const calculateSecretNumber = calculateSecretNumberTrace;
export const calculateNameNumber = calculateSecretNumberTrace;
export type NameNumberCalculation = SecretNumberCalculationTrace;
export const NAME_NUMBER_DISCLAIMER = SECRET_NUMBER_DISCLAIMER;
export const NAME_NUMBER_CATEGORIES = ['Secret Number'] as const;
