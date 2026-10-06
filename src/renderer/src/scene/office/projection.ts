/** Perspective floor calibration. Logical navigation stays orthogonal; upright
 * actors are translated through this homography, never skewed with the floor. */
export interface ScenePoint { x: number; y: number; }
export const REFERENCE_WIDTH = 1536;
export const REFERENCE_HEIGHT = 1024;
export const FLOOR_CORNERS: readonly ScenePoint[] = [
  { x: 260, y: 135 }, { x: 1344, y: 205 }, { x: 1417, y: 873 }, { x: 77, y: 757 }
];
function coefficients(): number[] {
  const a = FLOOR_CORNERS;
  const dx1 = a[1].x - a[2].x, dx2 = a[3].x - a[2].x;
  const dy1 = a[1].y - a[2].y, dy2 = a[3].y - a[2].y;
  const sx = a[0].x - a[1].x + a[2].x - a[3].x;
  const sy = a[0].y - a[1].y + a[2].y - a[3].y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  return [a[1].x - a[0].x + g * a[1].x, a[3].x - a[0].x + h * a[3].x, a[0].x,
    a[1].y - a[0].y + g * a[1].y, a[3].y - a[0].y + h * a[3].y, a[0].y, g, h];
}
const H = coefficients();
const ZERO = { x: 0, y: 0 };
export function project(point: ScenePoint, origin: ScenePoint = ZERO): ScenePoint {
  const u = point.x / REFERENCE_WIDTH, v = point.y / REFERENCE_HEIGHT;
  const d = H[6] * u + H[7] * v + 1;
  return { x: (H[0] * u + H[1] * v + H[2]) / d + origin.x,
    y: (H[3] * u + H[4] * v + H[5]) / d + origin.y };
}
export function unproject(point: ScenePoint, origin: ScenePoint = ZERO): ScenePoint {
  const x = point.x - origin.x, y = point.y - origin.y;
  const a = H[0] - x * H[6], b = H[1] - x * H[7], c = x - H[2];
  const d = H[3] - y * H[6], e = H[4] - y * H[7], f = y - H[5];
  const den = a * e - b * d;
  return { x: (c * e - b * f) / den * REFERENCE_WIDTH,
    y: (a * f - c * d) / den * REFERENCE_HEIGHT };
}
export function projectionBounds(_width = REFERENCE_WIDTH, _height = REFERENCE_HEIGHT) {
  return { origin: { ...ZERO }, width: REFERENCE_WIDTH, height: REFERENCE_HEIGHT };
}
export function sceneDepth(point: ScenePoint): number { return project(point).y; }
export function sceneToTile(point: ScenePoint, origin: ScenePoint, tileSize: number): ScenePoint {
  const logical = unproject(point, origin);
  return { x: Math.floor(logical.x / tileSize), y: Math.floor((logical.y - 0.000001) / tileSize) };
}
/** Foot contacts use the bottom-center of a cell, matching Character. */
export function referenceTile(point: ScenePoint): ScenePoint {
  const logical = unproject(point);
  return { x: Math.round(logical.x / 16 - 0.5), y: Math.round(logical.y / 16 - 1) };
}
export function tileContact(tile: ScenePoint): ScenePoint {
  return project({ x: (tile.x + 0.5) * 16, y: (tile.y + 1) * 16 });
}
export function perspectiveActorHeight(point: ScenePoint): number {
  return 152 + Math.max(0, Math.min(1, (point.y - 180) / 660)) * 48;
}
