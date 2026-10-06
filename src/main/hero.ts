import { DEFAULT_HERO, type HeroPayload } from '../shared/heroPayload';

/** Zuri ships its local information card; no upstream promotion is fetched. */
export async function loadHero(
  _cachePath: string,
  _opts: { force?: boolean } = {}
): Promise<{ hero: HeroPayload; fetchedAt: number; stale: boolean }> {
  return { hero: DEFAULT_HERO, fetchedAt: 0, stale: false };
}
