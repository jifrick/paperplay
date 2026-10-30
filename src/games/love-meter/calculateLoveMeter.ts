import { matchAsciiLetters } from '../../lib/matchLetterOccurrences';
import { validatePair } from '../../lib/validation';

export const LOVE_METER_BANDS = [
  { min: 0, max: 24, label: 'Different Pages' },
  { min: 25, max: 49, label: 'A Curious Combination' },
  { min: 50, max: 74, label: 'Same Notebook Energy' },
  { min: 75, max: 89, label: 'A Page Full of Similarities' },
  { min: 90, max: 100, label: 'Notebook Soulmates' },
] as const;

export const LOVE_METER_DISCLAIMER =
  'The Love Meter is a playful notebook score for entertainment only. It does not measure actual compatibility, feelings, or relationship success.';

export type LoveMeterWalkthrough = {
  formula: string;
  firstLength: number;
  secondLength: number;
  matchedPairs: number;
  overlapWeight: number;
  overlapValue: number;
  lengthBalanceWeight: number;
  lengthBalanceValue: number;
  rawScore: number;
  score: number;
  bandLabel: string;
  explanation: string;
  entertainmentDisclaimer: string;
};

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
  walkthrough: LoveMeterWalkthrough;
  disclaimer: string;
};

export const getLoveMeterBand = (score: number) => {
  const boundedScore = Math.max(0, Math.min(100, score));
  return LOVE_METER_BANDS.find((band) => boundedScore >= band.min && boundedScore <= band.max) ?? LOVE_METER_BANDS[0];
};

export const calculateLoveMeter = (
  first: string,
  second: string,
): LoveMeterCalculation | { status: 'invalid'; error: string } => {
  const validation = validatePair(first, second, { asciiOnly: true });
  if (!validation.valid) {
    return {
      status: 'invalid',
      error: validation.first.valid ? validation.second.message! : validation.first.message!,
    };
  }

  const matches = matchAsciiLetters(first, second);
  const firstLength = matches.first.asciiLatinUnits.length;
  const secondLength = matches.second.asciiLatinUnits.length;
  const maxLength = Math.max(firstLength, secondLength);
  const minLength = Math.min(firstLength, secondLength);
  const overlap = maxLength > 0 ? matches.matchedPairCount / maxLength : 0;
  const lengthBalance = maxLength > 0 ? minLength / maxLength : 1;
  const rawScore = 100 * (0.8 * overlap + 0.2 * lengthBalance);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const band = getLoveMeterBand(score);

  const explanation = `Found ${matches.matchedPairCount} matched pairs across ${firstLength} and ${secondLength} scorable letters. Letter overlap contributes 80% (${(overlap * 100).toFixed(1)}%), while length balance contributes 20% (${(lengthBalance * 100).toFixed(1)}%). Raw score = ${rawScore.toFixed(2)}, rounded to ${score}/100 ("${band.label}").`;

  return {
    status: 'complete',
    score,
    band,
    firstLength,
    secondLength,
    matchedPairs: matches.matchedPairCount,
    overlap,
    lengthBalance,
    rawScore,
    unsupportedCharacters:
      validation.first.normalized.hasUnsupportedCharacters ||
      validation.second.normalized.hasUnsupportedCharacters,
    disclaimer: LOVE_METER_DISCLAIMER,
    walkthrough: {
      formula: 'Score = round(100 × (0.8 × (Matched / MaxLen) + 0.2 × (MinLen / MaxLen)))',
      firstLength,
      secondLength,
      matchedPairs: matches.matchedPairCount,
      overlapWeight: 0.8,
      overlapValue: overlap,
      lengthBalanceWeight: 0.2,
      lengthBalanceValue: lengthBalance,
      rawScore,
      score,
      bandLabel: band.label,
      explanation,
      entertainmentDisclaimer: LOVE_METER_DISCLAIMER,
    },
  };
};
