import { normalizeName } from './normalizeName';

export const MAX_NAME_GRAPHEMES = 80;

export type ValidationResult = {
  valid: boolean;
  message?: string;
  normalized: ReturnType<typeof normalizeName>;
};

export const validateName = (input: string, options: { latinOnly?: boolean } = {}): ValidationResult => {
  const normalized = normalizeName(input);
  if (!normalized.display) return { valid: false, message: 'Please enter a name before playing.', normalized };
  if (normalized.units.length === 0) return { valid: false, message: 'Use at least one letter; punctuation and emoji cannot be calculated.', normalized };
  if (normalized.units.length > MAX_NAME_GRAPHEMES) return { valid: false, message: `Keep names to ${MAX_NAME_GRAPHEMES} letters or fewer.`, normalized };
  if (options.latinOnly && normalized.asciiLatinUnits.length === 0) {
    return { valid: false, message: 'This game currently uses A–Z letter values. Try a Latin-letter spelling.', normalized };
  }
  return { valid: true, normalized };
};

export const validatePair = (first: string, second: string, options: { latinOnly?: boolean } = {}) => {
  const firstResult = validateName(first, options);
  const secondResult = validateName(second, options);
  return {
    valid: firstResult.valid && secondResult.valid,
    first: firstResult,
    second: secondResult,
  };
};
