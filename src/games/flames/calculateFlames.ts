import { matchLetterOccurrences } from '../../lib/matchLetterOccurrences';
import { validatePair } from '../../lib/validation';
import { FlamesCategory, FlamesLetter, FlamesMode, FlamesResult } from './flames.types';

export const FLAMES_LETTERS: FlamesLetter[] = ['F', 'L', 'A', 'M', 'E', 'S'];
export const FLAMES_MEANINGS: Record<FlamesLetter, FlamesCategory> = {
  F: 'Friends', L: 'Lovers', A: 'Affection', M: 'Marriage', E: 'Enemies', S: 'Siblings',
};

export const calculateFlames = (first: string, second: string, mode: FlamesMode = 'crush'): FlamesResult | { error: string } => {
  const validation = validatePair(first, second);
  if (!validation.valid) return { error: validation.first.valid ? validation.second.message! : validation.first.message! };
  const matches = matchLetterOccurrences(first, second);
  const base: Omit<FlamesResult, 'status' | 'rounds' | 'finalLetter' | 'category' | 'edgeCaseMessage'> = {
    originalNames: { first, second },
    normalizedNames: { first: matches.first.normalized, second: matches.second.normalized },
    matchedPairs: matches.matchedPairs.map((pair) => ({ character: pair.character, firstIndex: pair.first.sourceIndex, secondIndex: pair.second.sourceIndex })),
    unmatched: { first: matches.unmatchedFirst.map((unit) => unit.value), second: matches.unmatchedSecond.map((unit) => unit.value) },
    remainingCount: matches.totalUnmatchedCount,
    mode,
    algorithmVersion: 'paperplay-flames-1',
  };
  if (matches.totalUnmatchedCount === 0) {
    return { ...base, status: 'zero-count', rounds: [], edgeCaseMessage: 'Every letter matched! Try a nickname or a different spelling.' };
  }

  const rounds: FlamesResult['rounds'] = [];
  let letters = [...FLAMES_LETTERS];
  let currentIndex = 0;
  while (letters.length > 1) {
    const lettersBefore = [...letters];
    const removalIndex = (currentIndex + matches.totalUnmatchedCount - 1) % letters.length;
    const removed = letters[removalIndex];
    letters = letters.filter((_, index) => index !== removalIndex);
    const nextStartingIndex = letters.length === 0 ? 0 : removalIndex % letters.length;
    rounds.push({ lettersBefore, startingIndex: currentIndex, count: matches.totalUnmatchedCount, removalIndex, removed, lettersAfter: [...letters], nextStartingIndex });
    currentIndex = nextStartingIndex;
  }
  const finalLetter = letters[0];
  return { ...base, status: 'complete', rounds, finalLetter, category: FLAMES_MEANINGS[finalLetter] };
};
