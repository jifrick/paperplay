export type FlamesLetter = 'F' | 'L' | 'A' | 'M' | 'E' | 'S';
export type FlamesMode = 'crush' | 'friendship' | 'fictional';
export type FlamesCategory =
  | 'Friends'
  | 'Love Marriage'
  | 'Arranged Marriage'
  | 'Marriage'
  | 'Enemies'
  | 'Strangers';

export type FlamesRound = {
  lettersBefore: FlamesLetter[];
  startingIndex: number;
  count: number;
  removalIndex: number;
  removed: FlamesLetter;
  removedMeaning: FlamesCategory;
  lettersAfter: FlamesLetter[];
  nextStartingIndex: number;
  explanation: string;
};

export type FlamesWalkthrough = {
  normalizedFirst: string;
  normalizedSecond: string;
  matchedPairs: Array<{ character: string; firstIndex: number; secondIndex: number }>;
  unmatchedFirst: string[];
  unmatchedSecond: string[];
  remainingCount: number;
  eliminationSteps: string[];
  finalLetter?: FlamesLetter;
  finalCategory?: FlamesCategory;
  entertainmentDisclaimer: string;
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
  walkthrough: FlamesWalkthrough;
  disclaimer: string;
};
