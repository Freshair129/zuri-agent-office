// Ambient break-room dialogue, separate from real task status and agent output.
import type { OfficeCharacterName } from './cast';

export type BreakSpot = 'coffee' | 'vending' | 'snack' | 'table';
type Exchange = readonly string[];
const pick = <T,>(items: readonly T[], seed: number): T =>
  items[((seed % items.length) + items.length) % items.length];

const SPOT_POOL: Record<BreakSpot, readonly string[]> = {
  coffee: ['coffee break', 'a fresh cup', 'time for tea'],
  vending: ['choosing a snack', 'a little break', 'something crunchy'],
  snack: ['taking a moment', 'snack time', 'a quick pause'],
  table: ['stretching my legs', 'taking a breather', 'a quiet moment'],
};
const EXCHANGES: readonly Exchange[] = [
  ['tea or coffee?', 'tea today.'],
  ['room at the table?', 'take a seat.'],
  ['a quick break?', 'sounds good.'],
  ['nice light by the window.', 'a good place to pause.'],
];

export function pickSoloLine(_character: OfficeCharacterName, spot: BreakSpot, seed: number): string {
  return pick(SPOT_POOL[spot], seed);
}

/** Beats alternate between the two agents at a table. */
export function pickExchange(_speaker: OfficeCharacterName, seed: number): Exchange {
  return pick(EXCHANGES, seed);
}
