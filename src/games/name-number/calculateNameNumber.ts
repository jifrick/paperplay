import { validatePair } from '../../lib/validation';

export type NameNumberLetter = { character: string; value: number };

export type NameNumberWalkthrough = {
  formula: string;
  firstLetters: NameNumberLetter[];
  secondLetters: NameNumberLetter[];
  firstSubtotal: number;
  secondSubtotal: number;
  combinedScore: number;
  divisor: number;
  quotient: number;
  remainder: number;
  category: string;
  explanation: string;
  entertainmentDisclaimer: string;
};

export type NameNumberCalculation = {
  status: 'complete';
  first: { name: string; letters: NameNumberLetter[]; score: number };
  second: { name: string; letters: NameNumberLetter[]; score: number };
  combinedScore: number;
  categoryIndex: number;
  category: string;
  unsupportedCharacters: boolean;
  walkthrough: NameNumberWalkthrough;
  disclaimer: string;
};

export const NAME_NUMBER_CATEGORIES = [
  'Notebook Legends',
  'Unexpected Duo',
  'Double Trouble',
  'Classic Combo',
  'Plot Twist Pair',
] as const;

export const NAME_NUMBER_DISCLAIMER =
  'Name Number is an original A1Z26 game for entertainment only. It does not measure actual personality, compatibility, or destiny.';

/**
 * Calculates deterministic Name Number score using canonical A1Z26 mapping (A=1 ... Z=26).
 *
 * Formula:
 * 1. Score(Name 1) = sum of letter values for all A–Z characters in Name 1.
 * 2. Score(Name 2) = sum of letter values for all A–Z characters in Name 2.
 * 3. Combined Score = Score(Name 1) + Score(Name 2).
 * 4. Category Index = Combined Score % 5 (indices 0 to 4 correspond to the 5 categories).
 */
export const calculateNameNumber = (
  first: string,
  second: string,
): NameNumberCalculation | { status: 'invalid'; error: string } => {
  const validation = validatePair(first, second, { asciiOnly: true });
  if (!validation.valid) {
    return {
      status: 'invalid',
      error: validation.first.valid ? validation.second.message! : validation.first.message!,
    };
  }

  const make = (name: string, normalized: typeof validation.first.normalized) => {
    const letters: NameNumberLetter[] = normalized.asciiLatinUnits.map((unit) => ({
      character: unit.value.toUpperCase(),
      value: unit.value.toUpperCase().charCodeAt(0) - 64,
    }));
    const score = letters.reduce((total, letter) => total + letter.value, 0);
    return { name, letters, score };
  };

  const firstResult = make(first, validation.first.normalized);
  const secondResult = make(second, validation.second.normalized);
  const combinedScore = firstResult.score + secondResult.score;
  const divisor = NAME_NUMBER_CATEGORIES.length;
  const remainder = combinedScore % divisor;
  const quotient = Math.floor(combinedScore / divisor);
  const category = NAME_NUMBER_CATEGORIES[remainder];

  const firstBreakdown = firstResult.letters.map((l) => `${l.character}(${l.value})`).join(' + ') || '0';
  const secondBreakdown = secondResult.letters.map((l) => `${l.character}(${l.value})`).join(' + ') || '0';
  const explanation = `${first.trim()} scores ${firstResult.score} [${firstBreakdown}], and ${second.trim()} scores ${secondResult.score} [${secondBreakdown}]. Combined total: ${firstResult.score} + ${secondResult.score} = ${combinedScore}. Dividing ${combinedScore} by ${divisor} gives quotient ${quotient} with remainder ${remainder}, selecting "${category}".`;

  return {
    status: 'complete',
    first: firstResult,
    second: secondResult,
    combinedScore,
    categoryIndex: remainder,
    category,
    unsupportedCharacters:
      validation.first.normalized.hasUnsupportedCharacters ||
      validation.second.normalized.hasUnsupportedCharacters,
    disclaimer: NAME_NUMBER_DISCLAIMER,
    walkthrough: {
      formula: 'Combined = Sum(Name 1) + Sum(Name 2); Category = Combined mod 5',
      firstLetters: firstResult.letters,
      secondLetters: secondResult.letters,
      firstSubtotal: firstResult.score,
      secondSubtotal: secondResult.score,
      combinedScore,
      divisor,
      quotient,
      remainder,
      category,
      explanation,
      entertainmentDisclaimer: NAME_NUMBER_DISCLAIMER,
    },
  };
};
