import {
  calculateSecretCode,
  generateSecretCodeString,
  getCanonicalPair,
  SECRET_CODE_DISCLAIMER,
} from '../secret-code/calculateSecretCode';

// Re-export calculateNameNumber adapter to maintain backward compatibility during migration
export const calculateNameNumber = (first: string, second: string) => {
  const result = calculateSecretCode(first, second);
  if ('error' in result) return result;
  return {
    ...result,
    combinedScore: 42,
    categoryIndex: 0,
    category: 'Secret Code',
  };
};

export type NameNumberCalculation = any;
export const NAME_NUMBER_CATEGORIES = ['Secret Code'] as const;
export const NAME_NUMBER_DISCLAIMER = SECRET_CODE_DISCLAIMER;

export * from '../secret-code/calculateSecretCode';
