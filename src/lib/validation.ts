import { normalizeName } from './normalizeName';

export const MAX_NAME_GRAPHEMES = 80;

export type ValidationResult = {
  valid: boolean;
  message?: string;
  normalized: ReturnType<typeof normalizeName>;
};

export const validateName = (input: string, options: { latinOnly?: boolean; asciiOnly?: boolean } = {}): ValidationResult => {
  const normalized = normalizeName(input);
  if (!normalized.display) return { valid: false, message: 'Please enter a name before playing.', normalized };
  if (normalized.units.length === 0) return { valid: false, message: 'Use at least one letter; punctuation and emoji cannot be calculated.', normalized };
  if (normalized.inputGraphemeCount > MAX_NAME_GRAPHEMES) return { valid: false, message: `Keep names to ${MAX_NAME_GRAPHEMES} graphemes or fewer.`, normalized };
  if (options.latinOnly && normalized.latinUnits.length !== normalized.units.length) {
    return { valid: false, message: 'This game currently matches Latin-script letters. Try a Latin-letter spelling.', normalized };
  }
  if (options.asciiOnly && normalized.asciiLatinUnits.length !== normalized.units.length) {
    return { valid: false, message: 'This game currently uses A–Z letter values. Try an A–Z spelling.', normalized };
  }
  return { valid: true, normalized };
};

export const validatePair = (first: string, second: string, options: { latinOnly?: boolean; asciiOnly?: boolean } = {}) => {
  const firstResult = validateName(first, options);
  const secondResult = validateName(second, options);
  return {
    valid: firstResult.valid && secondResult.valid,
    first: firstResult,
    second: secondResult,
  };
};
