import { FlamesCategory, FlamesMode } from './flames.types';

export const RESULT_COPY: Record<FlamesMode, Record<FlamesCategory, string>> = {
  crush: {
    Friends: 'Bestie energy detected!',
    'Love Marriage': 'The notebook sparks say love marriage is written in pencil!',
    'Arranged Marriage': 'Family-approved vibes and destiny written in the notebook.',
    Marriage: 'Already planning the wedding in this notebook?',
    Enemies: 'Rivals today, chaos forever!',
    Strangers: 'Two paths that have yet to cross in the notebook.',
  },
  friendship: {
    Friends: 'A rock-solid bond made for late-night laughs.',
    'Love Marriage': 'From best friends to the ultimate romance plot twist.',
    'Arranged Marriage': 'A match made by fate, family, and good timing.',
    Marriage: 'Your friendship is making long-term partnership plans.',
    Enemies: 'Playful rivals and eternal banter.',
    Strangers: 'Two curious souls yet to get properly introduced.',
  },
  fictional: {
    Friends: 'The dynamic duo has officially formed.',
    'Love Marriage': 'The ultimate slow-burn love marriage arc.',
    'Arranged Marriage': 'A grand political alliance and arranged match for the ages.',
    Marriage: 'Cue the cinematic wedding montage.',
    Enemies: 'Arch-nemeses destined for epic story showdowns.',
    Strangers: 'Background characters crossing paths in chapter one.',
  },
};

export const MODE_LABELS: Record<FlamesMode, string> = {
  crush: 'Crush mode',
  friendship: 'Friendship mode',
  fictional: 'Fictional couple',
};
