export type FlamesLetter = 'F' | 'L' | 'A' | 'M' | 'E' | 'S';
export type FlamesMode = 'crush' | 'friendship' | 'fictional';
export type FlamesCategory = 'Friends' | 'Lovers' | 'Affection' | 'Marriage' | 'Enemies' | 'Siblings';

export type FlamesRound = {
  lettersBefore: FlamesLetter[];
  startingIndex: number;
  count: number;
  removalIndex: number;
  removed: FlamesLetter;
  lettersAfter: FlamesLetter[];
  nextStartingIndex: number;
};

export type FlamesResult = {
  status: 'complete' | 'zero-count';
  originalNames: { first: string; second: string };
  normalizedNames: { first: string; second: string };
  matchedPairs: Array<{ character: string; firstIndex: number; secondIndex: number }>;
  unmatched: { first: string[]; second: string[] };
  remainingCount: number;
  rounds: FlamesRound[];
  finalLetter?: FlamesLetter;
  category?: FlamesCategory;
  mode: FlamesMode;
  algorithmVersion: 'paperplay-flames-1';
  edgeCaseMessage?: string;
};
