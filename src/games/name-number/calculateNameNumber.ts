import { validatePair } from '../../lib/validation';

export type NameNumberLetter = { character: string; value: number };
export type NameNumberCalculation = {
  status: 'complete';
  first: { name: string; letters: NameNumberLetter[]; score: number };
  second: { name: string; letters: NameNumberLetter[]; score: number };
  combinedScore: number;
  categoryIndex: number;
  category: string;
  unsupportedCharacters: boolean;
};

export const NAME_NUMBER_CATEGORIES = ['Notebook Legends', 'Unexpected Duo', 'Double Trouble', 'Classic Combo', 'Plot Twist Pair'];

export const calculateNameNumber = (first: string, second: string): NameNumberCalculation | { status: 'invalid'; error: string } => {
  const validation = validatePair(first, second, { asciiOnly: true });
  if (!validation.valid) return { status: 'invalid', error: validation.first.valid ? validation.second.message! : validation.first.message! };
  const make = (name: string, normalized: typeof validation.first.normalized) => {
    const letters = normalized.asciiLatinUnits.map((unit) => ({ character: unit.value.toUpperCase(), value: unit.value.toUpperCase().charCodeAt(0) - 64 }));
    return { name, letters, score: letters.reduce((total, letter) => total + letter.value, 0) };
  };
  const firstResult = make(first, validation.first.normalized);
  const secondResult = make(second, validation.second.normalized);
  const combinedScore = firstResult.score + secondResult.score;
  const categoryIndex = combinedScore % NAME_NUMBER_CATEGORIES.length;
  return { status: 'complete', first: firstResult, second: secondResult, combinedScore, categoryIndex, category: NAME_NUMBER_CATEGORIES[categoryIndex], unsupportedCharacters: validation.first.normalized.hasUnsupportedCharacters || validation.second.normalized.hasUnsupportedCharacters };
};
