import { matchLetterOccurrences } from '../../lib/matchLetterOccurrences';
import { validatePair } from '../../lib/validation';
import { FlamesCategory, FlamesLetter, FlamesMode, FlamesResult, FlamesRound } from './flames.types';

export const FLAMES_LETTERS: FlamesLetter[] = ['F', 'L', 'A', 'M', 'E', 'S'];

export const FLAMES_MEANINGS: Record<FlamesLetter, FlamesCategory> = {
  F: 'Friends',
  L: 'Love Marriage',
  A: 'Arranged Marriage',
  M: 'Marriage',
  E: 'Enemies',
  S: 'Strangers',
};

export const FLAMES_DISCLAIMER =
  'FLAMES is a game for entertainment, not a prediction of actual relationships or marriage outcomes.';

export const calculateFlames = (
  first: string,
  second: string,
  mode: FlamesMode = 'crush',
): FlamesResult | { error: string } => {
  const validation = validatePair(first, second, { latinOnly: true });
  if (!validation.valid) {
    return { error: validation.first.valid ? validation.second.message! : validation.first.message! };
  }

  const matches = matchLetterOccurrences(first, second);
  const matchedPairs = matches.matchedPairs.map((pair) => ({
    character: pair.character,
    firstIndex: pair.first.sourceIndex,
    secondIndex: pair.second.sourceIndex,
  }));
  const unmatched = {
    first: matches.unmatchedFirst.map((unit) => unit.value),
    second: matches.unmatchedSecond.map((unit) => unit.value),
  };

  const base = {
    originalNames: { first, second },
    normalizedNames: { first: matches.first.normalized, second: matches.second.normalized },
    matchedPairs,
    unmatched,
    remainingCount: matches.totalUnmatchedCount,
    mode,
    algorithmVersion: 'paperplay-flames-1' as const,
    disclaimer: FLAMES_DISCLAIMER,
  };

  if (matches.totalUnmatchedCount === 0) {
    return {
      ...base,
      status: 'zero-count',
      rounds: [],
      edgeCaseMessage: 'Every letter matched! Try a nickname or a different spelling.',
      walkthrough: {
        normalizedFirst: matches.first.normalized,
        normalizedSecond: matches.second.normalized,
        matchedPairs,
        unmatchedFirst: unmatched.first,
        unmatchedSecond: unmatched.second,
        remainingCount: 0,
        eliminationSteps: ['Zero unmatched letters left. No circular elimination was performed.'],
        entertainmentDisclaimer: FLAMES_DISCLAIMER,
      },
    };
  }

  const rounds: FlamesRound[] = [];
  const eliminationSteps: string[] = [];
  let letters = [...FLAMES_LETTERS];
  let currentIndex = 0;

  while (letters.length > 1) {
    const lettersBefore = [...letters];
    const removalIndex = (currentIndex + matches.totalUnmatchedCount - 1) % letters.length;
    const removed = letters[removalIndex];
    const removedMeaning = FLAMES_MEANINGS[removed];
    letters = letters.filter((_, index) => index !== removalIndex);
    const nextStartingIndex = letters.length === 0 ? 0 : removalIndex % letters.length;
    const stepExplanation = `From ${lettersBefore.join(' · ')}, count ${matches.totalUnmatchedCount} starting from ${lettersBefore[currentIndex]} → cross out ${removed} (${removedMeaning}). Next count starts at ${letters[nextStartingIndex]}.`;

    rounds.push({
      lettersBefore,
      startingIndex: currentIndex,
      count: matches.totalUnmatchedCount,
      removalIndex,
      removed,
      removedMeaning,
      lettersAfter: [...letters],
      nextStartingIndex,
      explanation: stepExplanation,
    });
    eliminationSteps.push(stepExplanation);
    currentIndex = nextStartingIndex;
  }

  const finalLetter = letters[0];
  const category = FLAMES_MEANINGS[finalLetter];

  return {
    ...base,
    status: 'complete',
    rounds,
    finalLetter,
    category,
    walkthrough: {
      normalizedFirst: matches.first.normalized,
      normalizedSecond: matches.second.normalized,
      matchedPairs,
      unmatchedFirst: unmatched.first,
      unmatchedSecond: unmatched.second,
      remainingCount: matches.totalUnmatchedCount,
      eliminationSteps,
      finalLetter,
      finalCategory: category,
      entertainmentDisclaimer: FLAMES_DISCLAIMER,
    },
  };
};
