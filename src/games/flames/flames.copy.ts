import { FlamesCategory, FlamesMode } from './flames.types';

export const RESULT_COPY: Record<FlamesMode, Record<FlamesCategory, string>> = {
  crush: {
    Friends: 'Bestie energy detected!', Lovers: 'The notebook has entered its romantic era.', Affection: 'A little softness, a little mystery.', Marriage: 'Already planning the wedding in this notebook?', Enemies: 'Rivals today, chaos forever!', Siblings: 'Endless teasing, questionable peace!',
  },
  friendship: {
    Friends: 'Bestie energy detected!', Lovers: 'A plot twist in the group chat.', Affection: 'A little softness, a little mystery.', Marriage: 'Your friendship is making long-term plans.', Enemies: 'Rivals today, chaos forever!', Siblings: 'Endless teasing, questionable peace!',
  },
  fictional: {
    Friends: 'The sidekicks have assembled.', Lovers: 'The notebook has entered its romantic era.', Affection: 'A little softness, a little mystery.', Marriage: 'Cue the cinematic wedding montage.', Enemies: 'Rivals today, chaos forever!', Siblings: 'Endless teasing, questionable peace!',
  },
};

export const MODE_LABELS: Record<FlamesMode, string> = { crush: 'Crush mode', friendship: 'Friendship mode', fictional: 'Fictional couple' };
