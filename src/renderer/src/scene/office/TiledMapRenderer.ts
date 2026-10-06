import { Container } from 'pixi.js';
import { project, unproject, projectionBounds, sceneDepth, sceneToTile, referenceTile, tileContact } from './projection';
import { buildOfficeScene, type OfficeTextures } from './scene25d';
import { INTERACTION_PIXELS, MEETING_SEATS, REFERENCE_ERRANDS, REFERENCE_SEATS, referenceWalkable } from './sceneLayout';

export interface TiledMap {
  width: number; height: number; tilewidth: number; tileheight: number;
  layers: TiledLayer[]; tilesets: TiledTilesetRef[];
}
export interface TiledLayer {
  name: string; type: 'tilelayer' | 'objectgroup'; data?: number[]; objects?: TiledObject[];
}
export interface TiledObject { name: string; x: number; y: number; width?: number; height?: number; }
export interface TiledTilesetRef {
  firstgid: number; source?: string; image?: string; columns?: number;
  tilewidth?: number; tileheight?: number; tilecount?: number;
}
export interface ZoneRect { x: number; y: number; width: number; height: number; }
export interface Point { x: number; y: number; }

/** The persisted Tiled document supplies stable seat identity only. The approved
 * reference has its own transient grid, calibrated floor contacts and solids.
 * Nothing in this renderer rewrites saved maps, profiles or roster IDs. */
export class TiledMapRenderer {
  readonly width = 96;
  readonly height = 64;
  readonly tileSize = 16;
  readonly sceneBounds = projectionBounds();
  private walkabilityGrid: boolean[][];
  private spawnPoints = new Map<string, Point>();
  private zones = new Map<string, ZoneRect>();
  private characterContainer = new Container();
  private rootContainer = new Container();

  constructor(mapData: TiledMap, textures: OfficeTextures, _plantTiles: Point[] = [], _requiredDestinations: Point[] = []) {
    const sourceNames = new Set(mapData.layers.find(l => l.name === 'spawn-points')?.objects?.map(o => o.name));
    for (const seat of REFERENCE_SEATS) {
      if (!sourceNames.has(seat.name)) throw new Error(`Reference seat identity missing from source map: ${seat.name}`);
      this.spawnPoints.set(seat.name, seat.tile);
    }
    for (const [name, point] of Object.entries(INTERACTION_PIXELS)) this.spawnPoints.set(name, referenceTile(point));
    this.walkabilityGrid = Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => referenceWalkable({ x, y })));
    const meetingA = referenceTile({ x: 735, y: 205 });
    const meetingB = referenceTile({ x: 1080, y: 264 });
    this.zones.set('boardroom', { x: meetingA.x, y: meetingA.y,
      width: meetingB.x - meetingA.x + 1, height: meetingB.y - meetingA.y + 1 });
    const required = [...REFERENCE_SEATS.map(s => s.tile),
      ...Object.entries(INTERACTION_PIXELS).filter(([name]) => /^(entrance|cafe-|warroom-|meetingDoor|pin|take|archive|.*Stand)$/.test(name))
        .map(([, p]) => referenceTile(p)), ...REFERENCE_ERRANDS.map(e => referenceTile(e.stand))];
    for (const p of required) if (!this.isWalkable(p.x, p.y))
      throw new Error(`Reference furniture covers a required destination at ${p.x},${p.y}`);
    this.characterContainer.sortableChildren = true;
    buildOfficeScene(this.rootContainer, this.characterContainer, textures);
  }

  projectPoint(x: number, y: number): Point { return project({ x, y }); }
  unprojectPoint(x: number, y: number): Point { return unproject({ x, y }); }
  sceneToTile(x: number, y: number): Point { return sceneToTile({ x, y }, this.sceneBounds.origin, this.tileSize); }
  depthAt(x: number, y: number): number { return sceneDepth({ x, y }); }
  getContainer(): Container { return this.rootContainer; }
  getCharacterContainer(): Container { return this.characterContainer; }
  isWalkable(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < this.width && ty < this.height && this.walkabilityGrid[ty][tx];
  }
  tileToPixel(tx: number, ty: number): Point { return { x: tx * this.tileSize, y: ty * this.tileSize }; }
  pixelToTile(px: number, py: number): Point { return { x: Math.floor(px / this.tileSize), y: Math.floor(py / this.tileSize) }; }
  getSpawnPoint(name: string): Point | undefined { return this.spawnPoints.get(name); }
  getAllSpawnPoints(): Map<string, Point> { return this.spawnPoints; }
  getZone(name: string): ZoneRect | undefined { return this.zones.get(name); }
  getAllZones(): Map<string, ZoneRect> { return this.zones; }
  getInteractionTile(name: string): Point {
    const p = this.spawnPoints.get(name);
    if (!p) throw new Error(`Unknown reference interaction: ${name}`);
    return p;
  }
  getMeetingSeatTiles(): Point[] { return MEETING_SEATS.map(seat => seat.tile); }
  getSeatFacing(tile: Point): 'up' | 'down' {
    return [...REFERENCE_SEATS, ...MEETING_SEATS].find(s => s.tile.x === tile.x && s.tile.y === tile.y)?.facing ??
      (this.spawnPoints.get('cafe-seat-1')?.y === tile.y ? 'down' : 'up');
  }
  getDeskCupPoint(tile: Point): Point {
    const seat = REFERENCE_SEATS.find(s => s.tile.x === tile.x && s.tile.y === tile.y);
    const p = seat?.image ?? tileContact(tile);
    return unproject({ x: p.x + 45, y: p.y - (seat?.side === 'back' ? 38 : 110) + 22 });
  }
  getDeskMonitorPoint(tile: Point): Point {
    const seat = REFERENCE_SEATS.find(s => s.tile.x === tile.x && s.tile.y === tile.y);
    const p = seat?.image ?? tileContact(tile);
    return { x: p.x + (seat?.side === 'back' ? -8 : 30), y: p.y - (seat?.side === 'back' ? 64 : 128) };
  }
  /** Retained read API for original-map tooling; reference art has no tile GIDs. */
  gidAt(_layerName: string, _tx: number, _ty: number): number { return 0; }
}
