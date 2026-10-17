import { matchAsciiLetters } from '../../lib/matchLetterOccurrences';
import { validatePair } from '../../lib/validation';

export const LOVE_METER_BANDS = [
  { min: 0, max: 24, label: 'Different Pages' },
  { min: 25, max: 49, label: 'A Curious Combination' },
  { min: 50, max: 74, label: 'Same Notebook Energy' },
  { min: 75, max: 89, label: 'A Page Full of Similarities' },
  { min: 90, max: 100, label: 'Notebook Soulmates' },
] as const;

export type LoveMeterCalculation = {
  status: 'complete';
  score: number;
  band: (typeof LOVE_METER_BANDS)[number];
  firstLength: number;
  secondLength: number;
  matchedPairs: number;
  overlap: number;
  lengthBalance: number;
  rawScore: number;
  unsupportedCharacters: boolean;
};

export const getLoveMeterBand = (score: number) => {
  const boundedScore = Math.max(0, Math.min(100, score));
  return LOVE_METER_BANDS.find((band) => boundedScore >= band.min && boundedScore <= band.max) ?? LOVE_METER_BANDS[0];
};

export const calculateLoveMeter = (first: string, second: string): LoveMeterCalculation | { status: 'invalid'; error: string } => {
  const validation = validatePair(first, second, { asciiOnly: true });
  if (!validation.valid) return { status: 'invalid', error: validation.first.valid ? validation.second.message! : validation.first.message! };
  const matches = matchAsciiLetters(first, second);
  const firstLength = matches.first.asciiLatinUnits.length;
  const secondLength = matches.second.asciiLatinUnits.length;
  const maxLength = Math.max(firstLength, secondLength);
  const overlap = matches.matchedPairCount / maxLength;
  const lengthBalance = Math.min(firstLength, secondLength) / maxLength;
  const rawScore = 100 * (0.8 * overlap + 0.2 * lengthBalance);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  return { status: 'complete', score, band: getLoveMeterBand(score), firstLength, secondLength, matchedPairs: matches.matchedPairCount, overlap, lengthBalance, rawScore, unsupportedCharacters: validation.first.normalized.hasUnsupportedCharacters || validation.second.normalized.hasUnsupportedCharacters };
};
