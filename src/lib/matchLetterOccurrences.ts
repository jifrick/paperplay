import { normalizeName, NameUnit, NormalizedName } from './normalizeName';

export type MatchedOccurrence = {
  character: string;
  first: NameUnit;
  second: NameUnit;
};

export type UnmatchedOccurrence = NameUnit & { side: 'first' | 'second' };

export type LetterMatchResult = {
  first: NormalizedName;
  second: NormalizedName;
  matchedPairs: MatchedOccurrence[];
  unmatchedFirst: UnmatchedOccurrence[];
  unmatchedSecond: UnmatchedOccurrence[];
  matchedPairCount: number;
  matchedOccurrenceCount: number;
  totalUnmatchedCount: number;
};

export const matchUnits = (first: NormalizedName, second: NormalizedName, latinOnly = false): LetterMatchResult => {
  const firstUnits = (latinOnly ? first.asciiLatinUnits : first.units);
  const secondUnits = (latinOnly ? second.asciiLatinUnits : second.units);
  const used = new Set<number>();
  const matchedFirst = new Set<number>();
  const matchedSecond = new Set<number>();
  const matchedPairs: MatchedOccurrence[] = [];

  firstUnits.forEach((unit) => {
    const secondIndex = secondUnits.findIndex((candidate, index) => !used.has(index) && candidate.key === unit.key);
    if (secondIndex === -1) return;
    used.add(secondIndex);
    matchedFirst.add(unit.sourceIndex);
    matchedSecond.add(secondUnits[secondIndex].sourceIndex);
    matchedPairs.push({ character: unit.value, first: unit, second: secondUnits[secondIndex] });
  });

  return {
    first,
    second,
    matchedPairs,
    unmatchedFirst: firstUnits.filter((unit) => !matchedFirst.has(unit.sourceIndex)).map((unit) => ({ ...unit, side: 'first' as const })),
    unmatchedSecond: secondUnits.filter((unit) => !matchedSecond.has(unit.sourceIndex)).map((unit) => ({ ...unit, side: 'second' as const })),
    matchedPairCount: matchedPairs.length,
    matchedOccurrenceCount: matchedPairs.length * 2,
    totalUnmatchedCount: firstUnits.length + secondUnits.length - matchedPairs.length * 2,
  };
};

export const matchLetterOccurrences = (firstInput: string, secondInput: string): LetterMatchResult => {
  return matchUnits(normalizeName(firstInput), normalizeName(secondInput));
};

export const matchAsciiLetters = (firstInput: string, secondInput: string): LetterMatchResult => {
  return matchUnits(normalizeName(firstInput), normalizeName(secondInput), true);
};
