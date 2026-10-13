import { matchLetterOccurrences } from '../../lib/matchLetterOccurrences';
import { validatePair } from '../../lib/validation';

export type LetterMatchCalculation = ReturnType<typeof matchLetterOccurrences> & { status: 'complete' };

export const calculateLetterMatch = (first: string, second: string): LetterMatchCalculation | { status: 'invalid'; error: string } => {
  const validation = validatePair(first, second);
  if (!validation.valid) return { status: 'invalid', error: validation.first.valid ? validation.second.message! : validation.first.message! };
  return { ...matchLetterOccurrences(first, second), status: 'complete' };
};
