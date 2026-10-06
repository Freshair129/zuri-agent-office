// Zuri role roster. Legacy IDs and display labels remain stable.
// Three generated adult figures have five garment variants each; see the asset provenance.

import { Texture } from 'pixi.js';
import { paintPortrait } from './portraitArt';
import { getCharacterCanvases } from './character25d';

export type OfficeCharacterName =
  | 'michael' | 'jim' | 'pam' | 'dwight' | 'kevin' | 'angela'
  | 'oscar' | 'stanley' | 'phyllis' | 'andy' | 'kelly' | 'ryan'
  | 'toby' | 'creed' | 'meredith';

export interface CastMember {
  name: OfficeCharacterName;
  displayName: string;
  /** Signature accent color (hex) — used for the in-scene selection glow. */
  shirt: string;
  /** Blurb shown when this character is picked / has no description yet. */
  blurb: string;
}

/** Selectable roster, in display order. */
export const OFFICE_CAST: CastMember[] = [
  { name: 'michael',  displayName: 'Zuri Coordinator',  shirt: '#5a6b8c', blurb: 'Plans work and coordinates the team' },
  { name: 'jim',      displayName: 'Engineer',      shirt: '#6fa8dc', blurb: 'Builds and maintains software' },
  { name: 'pam',      displayName: 'Designer',      shirt: '#9caf88', blurb: 'Designs clear, accessible experiences' },
  { name: 'dwight',   displayName: 'Reviewer',   shirt: '#b89b3e', blurb: 'Reviews changes and checks contracts' },
  { name: 'kevin',    displayName: 'Analyst',    shirt: '#4a7ab5', blurb: 'Investigates data and outcomes' },
  { name: 'angela',   displayName: 'Finance',   shirt: '#8a86a6', blurb: 'Tracks costs and resources' },
  { name: 'oscar',    displayName: 'Data Engineer',    shirt: '#7a4b6b', blurb: 'Builds reliable data workflows' },
  { name: 'stanley',  displayName: 'Operator',  shirt: '#8c5a4b', blurb: 'Keeps systems running' },
  { name: 'phyllis',  displayName: 'Coordinator',  shirt: '#b08bbf', blurb: 'Organizes delivery and dependencies' },
  { name: 'andy',     displayName: 'Product Lead',     shirt: '#6fae6f', blurb: 'Defines requirements and priorities' },
  { name: 'kelly',    displayName: 'Support',    shirt: '#d16ba5', blurb: 'Helps users resolve problems' },
  { name: 'ryan',     displayName: 'Researcher',     shirt: '#3a3a44', blurb: 'Finds and evaluates evidence' },
  { name: 'toby',     displayName: 'People Ops',     shirt: '#9a8c5a', blurb: 'Supports team processes' },
  { name: 'creed',    displayName: 'Quality Engineer',    shirt: '#6b7a4b', blurb: 'Tests behavior and prevents regressions' },
  { name: 'meredith', displayName: 'Partnerships', shirt: '#b5544a', blurb: 'Coordinates external dependencies' },
];

export const CAST_BY_NAME: Record<OfficeCharacterName, CastMember> =
  Object.fromEntries(OFFICE_CAST.map((c) => [c.name, c])) as Record<OfficeCharacterName, CastMember>;

export const DEFAULT_CHARACTER: OfficeCharacterName = 'jim';

export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

// Smooth generated frame textures, shared by scene consumers.
const frameCache = new Map<OfficeCharacterName, Promise<Texture[][]>>();

export function getCastFrames(name: OfficeCharacterName): Promise<Texture[][]> {
  let frames = frameCache.get(name);
  if (!frames) {
    frames = getCharacterCanvases(name).then(rows => {
      const textures = new Map<HTMLCanvasElement, Texture>();
      return rows.map(row => row.map(canvas => {
        let texture = textures.get(canvas);
        if (!texture) {
          texture = Texture.from(canvas);
          texture.source.scaleMode = 'linear';
          textures.set(canvas, texture);
        }
        return texture;
      }));
    }).catch(error => { frameCache.delete(name); throw error; });
    frameCache.set(name, frames);
  }
  return frames;
}

/** Matching high-resolution portrait; existing canvas consumers keep their API. */
export async function paintCastPortrait(ctx: CanvasRenderingContext2D, name: OfficeCharacterName, scale = 2): Promise<void> {
  await paintPortrait(ctx, name, scale);
}
