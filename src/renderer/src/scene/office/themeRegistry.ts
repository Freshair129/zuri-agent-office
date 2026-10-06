// Zuri studio theme. Saved theme/character identifiers remain compatible.
// All active map and tileset artwork is original to this fork.

import type { Texture } from 'pixi.js';
import { referenceTile } from './projection';
import { INTERACTION_PIXELS, REFERENCE_ERRANDS } from './sceneLayout';
import {
  CAST_BY_NAME,
  getCastFrames,
  DEFAULT_CHARACTER,
  type CastMember,
  type OfficeCharacterName,
} from './cast';

import officeTilesetUrl from '@/assets/tilesets/zuri-office.svg?url';
import officeMapRaw from '@/assets/maps/zuri-office.tmj?raw';

/** Historical IDs remain readable; unavailable themes resolve to Zuri Studio. */
export type ThemeId =
  | 'office'
  | 'friends'
  | 'brooklyn99'
  | 'siliconvalley'
  | 'got'
  | 'hogwarts';

export interface Tile { x: number; y: number; }
export type Facing = 'up' | 'down' | 'left' | 'right';

/** Kinds of small idle errands around the office (incl. plant watering).
 *  'smoke' is the boss special: cigar at the open window, god only. */
export type ErrandKind =
  | 'water' | 'window' | 'dispenser' | 'fridge' | 'shelf' | 'bin' | 'smoke';

/** One idle-errand anchor: a stand tile + facing, an `fx` tile for the ambient
 *  animation, a duration, and an optional god-only restriction. */
export interface ErrandSpot {
  kind: ErrandKind;
  stand: Tile;
  facing: Facing;
  fx: Tile;
  duration: number;
  godOnly?: boolean;
}

/** One tileset atlas + its placement in the global gid space. `embedded` marks
 *  the atlas whose metadata already lives inline in the map's own `tilesets[0]`
 *  (the loader keeps the map's copy and only patches the appended atlases). */
export interface TilesetEntry {
  url: string;
  embedded?: boolean;
  firstgid?: number;
  image?: string;
  imagewidth?: number;
  imageheight?: number;
  tilewidth?: number;
  tileheight?: number;
  columns?: number;
  tilecount?: number;
}

/** Desk-monitor overlay gids. The map paints an OFF monitor block; DeskScreen
 *  overlays the matching ON tiles while the desk's agent is seated. */
export interface MonitorConfig {
  /** gid of the OFF monitor block's top-left tile, as painted in the map. */
  offTopLeftGid: number;
  /** Matching ON tiles as [gid, dx, dy] relative to the block's top-left. */
  onGids: ReadonlyArray<readonly [number, number, number]>;
}

/** The coffee economy's fixed tiles: sideboard (mug rack) → counter machine →
 *  sink → back to the sideboard. `maxCups` caps the clean-mug stock. */
export interface CoffeeConfig {
  trayTile: Tile;
  trayStand: Tile;
  machineStand: Tile;
  sinkTile: Tile;
  sinkStand: Tile;
  maxCups: number;
}

/** Clickable prop anchors (tile coords). calendar → TRIGGERS, boards → TASKS,
 *  clock → CLOSING TIME. */
export interface AnchorConfig {
  calendar: Tile;
  boards: Tile;
  clock: Tile;
}

/** Theme palette. `background` is the canvas clear color; `noteColors` are the
 *  kanban note colors keyed by task status. */
export interface PaletteConfig {
  background: number;
  noteColors: Record<string, number>;
}

/** Per-theme cast loader — the indirection point so a future show can swap its
 *  own roster + sprite frames. The office theme points at cast.ts's exports. */
export interface ThemeCast {
  byName: Record<string, CastMember>;
  getFrames: (name: string) => Promise<Texture[][]>;
  defaultCharacter: string;
}

/** The full contract a theme must supply. See report §A (theme contract). */
export interface ThemeConfig {
  id: ThemeId;
  /** Raw Tiled JSON text; parsed + tileset-patched by themeLoader. */
  mapRaw: string;
  /** Ordered atlases — order matches both the texture load order and the map's
   *  tileset array (texture[i] ↔ tilesets[i]). */
  tilesets: TilesetEntry[];
  /** Desk-claim order, by spawn-point name (seat 0 = god / desk-ceo). */
  primarySeatNames: string[];
  /** Paired café table seats, in order. */
  cafeSeatNames: string[];
  /** Café standing spots: [spawn-point name, kind]. */
  cafeStands: ReadonlyArray<readonly [string, 'coffee' | 'vending']>;
  coffee: CoffeeConfig;
  anchors: AnchorConfig;
  errandSpots: ErrandSpot[];
  monitor: MonitorConfig;
  palette: PaletteConfig;
  cast: ThemeCast;
}

/** Original Zuri workspace, preserving seat and ambient animation contracts. */
export const OFFICE_THEME: ThemeConfig = {
  id: 'office',
  mapRaw: officeMapRaw,
  tilesets: [{ url: officeTilesetUrl, embedded: true }],
  primarySeatNames: [
    'desk-ceo',
    'pc-1', 'pc-2', 'pc-3', 'pc-4', 'pc-5', 'pc-6',
    'desk-chief-architect', 'desk-product-manager', 'desk-team-lead',
    'desk-backend-engineer', 'desk-ui-ux-expert', 'desk-data-engineer',
    'desk-project-manager', 'desk-market-researcher', 'desk-agent-organizer',
  ],
  cafeSeatNames: ['cafe-seat-1', 'cafe-seat-2'],
  cafeStands: [
    ['cafe-stand-coffee', 'coffee'],
    ['cafe-stand-vending', 'vending'],
    ['cafe-seat-3', 'coffee'], // Historical IDs retained as standing lounge spots.
    ['cafe-seat-4', 'coffee'],
  ],
  coffee: {
    trayTile: referenceTile(INTERACTION_PIXELS.tray),
    trayStand: referenceTile(INTERACTION_PIXELS.trayStand),
    machineStand: referenceTile(INTERACTION_PIXELS.machineStand),
    sinkTile: referenceTile(INTERACTION_PIXELS.sink),
    sinkStand: referenceTile(INTERACTION_PIXELS.sinkStand),
    maxCups: 4,
  },
  anchors: {
    calendar: referenceTile(INTERACTION_PIXELS.calendar),
    boards: referenceTile(INTERACTION_PIXELS.boards),
    clock: referenceTile(INTERACTION_PIXELS.clock),
  },
  errandSpots: ([
    { kind: 'water', duration: 4.5 }, { kind: 'water', duration: 4.5 },
    { kind: 'water', duration: 4.5 }, { kind: 'water', duration: 4.5, godOnly: true },
    { kind: 'smoke', duration: 18, godOnly: true }, { kind: 'water', duration: 4.5 },
    { kind: 'window', duration: 5 }, { kind: 'window', duration: 5 },
    { kind: 'dispenser', duration: 3.5 }, { kind: 'dispenser', duration: 3.5 },
    { kind: 'fridge', duration: 3.2 }, { kind: 'shelf', duration: 4 },
    { kind: 'bin', duration: 2.6 }, { kind: 'bin', duration: 2.6 },
  ] as const).map((spot, i) => ({ ...spot, stand: referenceTile(REFERENCE_ERRANDS[i].stand),
    fx: referenceTile(REFERENCE_ERRANDS[i].fx), facing: REFERENCE_ERRANDS[i].facing })),
  monitor: {
    offTopLeftGid: 9,
    onGids: [
      [11, 0, 0], [12, 1, 0],
      [27, 0, 1], [28, 1, 1],
    ],
  },
  palette: {
    background: 0xf3efe8,
    noteColors: { todo: 0xf2df8a, doing: 0x9ecbf0, blocked: 0xf0a3a3, done: 0xa8e0b0 },
  },
  cast: {
    byName: CAST_BY_NAME as Record<string, CastMember>,
    getFrames: (name: string) => getCastFrames(name as OfficeCharacterName),
    defaultCharacter: DEFAULT_CHARACTER,
  },
};

/** Legacy saved theme identifiers use the supported Zuri studio layout. */
export const BROOKLYN99_THEME: ThemeConfig = { ...OFFICE_THEME, id: 'brooklyn99' };

/** The supported studio plus a saved-ID compatibility alias. */
export const THEMES: Partial<Record<ThemeId, ThemeConfig>> = {
  office: OFFICE_THEME,
  brooklyn99: BROOKLYN99_THEME,
};

/** Look up a theme by id, falling back to the office theme if unknown/missing
 *  (a bad/absent show bundle must never break the floor — see report §E). */
export function getTheme(id: ThemeId): ThemeConfig {
  return THEMES[id] ?? OFFICE_THEME;
}
