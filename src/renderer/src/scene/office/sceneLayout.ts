import { referenceTile, tileContact, type ScenePoint } from './projection';

export type Polygon = readonly (readonly [number, number])[];
export interface ReferenceSeat {
  name: string;
  pod: string;
  side: 'front' | 'back';
  facing: 'up' | 'down';
  image: ScenePoint;
  tile: ScenePoint;
  chairBack?: Polygon;
}
export interface ReferencePod { id: string; solid: Polygon; depth: number; masks: Polygon[]; }
const point = (x: number, y: number): ScenePoint => ({ x, y });
const seatNames = [
  'desk-ceo', 'pc-1', 'pc-2', 'pc-3', 'pc-4', 'pc-5', 'pc-6', 'desk-chief-architect',
  'desk-product-manager', 'desk-team-lead', 'desk-backend-engineer', 'desk-ui-ux-expert',
  'desk-data-engineer', 'desk-project-manager', 'desk-market-researcher', 'desk-agent-organizer'
];
const seatPixels = [
  [505, 501], [653, 516], [560, 386], [680, 397],
  [1008, 546], [1147, 563], [1048, 416], [1180, 435],
  [427, 744], [575, 759], [486, 603], [619, 617],
  [1003, 807], [1152, 824], [1048, 663], [1176, 676]
];
// Near-side chair backs only. Far-side chairs remain behind the front-facing
// person. These polygons follow upholstery, not rectangular floor cutouts.
const chairBacks: Polygon[] = [
  [[473,411],[519,416],[523,437],[514,460],[480,456],[474,439]],
  [[627,424],[676,429],[674,451],[664,476],[636,472],[627,451]],
  [[980,451],[1032,455],[1030,482],[1023,504],[992,501],[981,477]],
  [[1118,466],[1170,470],[1168,498],[1160,519],[1130,516],[1119,490]],
  [[399,638],[447,644],[444,669],[437,692],[410,689],[399,665]],
  [[542,654],[591,659],[589,683],[581,707],[552,703],[543,682]],
  [[977,695],[1031,700],[1028,725],[1020,754],[990,750],[978,725]],
  [[1116,726],[1170,731],[1166,756],[1158,780],[1128,777],[1117,751]]
];
export const REFERENCE_SEATS: readonly ReferenceSeat[] = seatPixels.map(([x, y], i) => ({
  name: seatNames[i], pod: ['rear-left', 'rear-right', 'front-left', 'front-right'][Math.floor(i / 4)],
  side: i % 4 < 2 ? 'front' : 'back', facing: i % 4 < 2 ? 'up' : 'down',
  image: point(x, y), tile: referenceTile(point(x, y)),
  chairBack: i % 4 < 2 ? chairBacks[Math.floor(i / 4) * 2 + i % 4] : undefined
}));
/** Four visible N/S meeting chairs; first retains the original spawn identity. */
export const MEETING_SEATS = ([
  { name: 'warroom-seat', image: point(884, 259), facing: 'up' },
  { name: 'warroom-2', image: point(965, 267), facing: 'up' },
  { name: 'warroom-3', image: point(903, 211), facing: 'down' },
  { name: 'warroom-4', image: point(972, 220), facing: 'down' }
] as const).map(seat => ({ ...seat, tile: referenceTile(seat.image) }));
export const REFERENCE_PODS: readonly ReferencePod[] = [
  { id: 'rear-left', depth: 495, solid: [[471,413],[743,436],[723,488],[454,466]], masks: [
    [[475,309],[766,337],[746,458],[436,417]],
    [[520,301],[587,306],[588,329],[519,324]], [[635,311],[706,317],[707,342],[634,335]],
    [[498,331],[567,337],[567,377],[498,370]], [[627,345],[696,351],[694,390],[626,384]],
    [[439,419],[472,423],[472,477],[440,474]], [[563,432],[596,437],[596,490],[563,486]],
    [[693,450],[731,454],[731,508],[693,502]] ] },
  { id: 'rear-right', depth: 536, solid: [[959,457],[1243,481],[1229,528],[939,503]], masks: [
    [[949,353],[1265,379],[1248,502],[924,459]],
    [[1008,339],[1074,346],[1075,368],[1007,361]], [[1129,351],[1200,357],[1201,383],[1127,375]],
    [[997,374],[1072,380],[1070,421],[997,414]], [[1120,389],[1192,396],[1190,437],[1118,430]],
    [[927,458],[960,462],[960,520],[927,516]], [[1209,493],[1244,498],[1244,553],[1208,546]] ] },
  { id: 'front-left', depth: 732, solid: [[387,637],[679,662],[663,718],[368,685]], masks: [
    [[386,544],[700,570],[687,704],[350,664]],
    [[441,527],[512,534],[512,560],[440,550]], [[572,539],[644,547],[646,573],[571,565]],
    [[425,559],[502,567],[500,609],[424,600]], [[558,575],[634,582],[632,624],[556,617]],
    [[351,647],[386,651],[386,711],[351,707]], [[654,684],[687,687],[686,744],[653,740]] ] },
  { id: 'front-right', depth: 796, solid: [[954,698],[1244,725],[1230,787],[932,752]], masks: [
    [[951,595],[1270,624],[1258,758],[914,717]],
    [[1002,587],[1076,596],[1076,620],[1001,611]], [[1138,602],[1211,610],[1211,637],[1137,627]],
    [[992,622],[1068,630],[1067,674],[991,665]], [[1118,640],[1193,649],[1192,692],[1117,684]],
    [[916,709],[952,714],[951,776],[916,771]], [[1205,746],[1247,751],[1244,813],[1205,808]] ] }
];

/** Actual accessible floor: the rear inset includes the glass meeting room. */
export const WALKABLE_FLOOR: Polygon = [[270,207],[628,235],[684,154],[1138,185],
  [1135,290],[1329,320],[1400,840],[1320,872],[116,766],[135,490],[229,260]];
export const MEETING_DOOR = point(669, 250);
export const MEETING_INTERIOR = point(764, 221);
export const STATIC_SOLIDS: readonly Polygon[] = [
  // Meeting table and glass perimeter; the left doorway is deliberately open.
  [[858,221],[1006,233],[994,249],[850,237]],
  [[690,257],[1142,291],[1144,303],[687,270]],
  [[1136,190],[1150,192],[1149,289],[1135,289]],
  // Kitchen, lounge furniture, bookcase and sideboard bases.
  [[324,233],[596,254],[595,275],[322,251]],
  [[215,282],[308,289],[310,326],[218,330]],
  [[174,382],[273,399],[266,435],[171,417]],
  [[291,358],[344,363],[339,390],[290,385]],
  [[1200,266],[1290,276],[1290,299],[1198,291]],
  [[1342,393],[1410,563],[1408,629],[1368,498]],
  [[112,538],[160,482],[174,488],[143,610],[101,619]]
];
export const INTERACTION_PIXELS: Record<string, ScenePoint> = {
  entrance: point(725, 804), machine: point(501, 220), machineStand: point(499, 292),
  tray: point(451, 215), trayStand: point(451, 286), sink: point(374, 206), sinkStand: point(371, 283),
  calendar: point(547, 179), clock: point(276, 170), boards: point(1262, 360), ask: point(1332, 552),
  pin: point(1280, 381), take: point(1293, 408), archive: point(1320, 512),
  'cafe-seat-1': point(260, 322), 'cafe-seat-2': point(228, 418),
  'cafe-seat-3': point(359, 351), 'cafe-seat-4': point(341, 421),
  'cafe-stand-coffee': point(543, 289), 'cafe-stand-vending': point(593, 292),
  ...Object.fromEntries(MEETING_SEATS.map(seat => [seat.name, seat.image])),
  'warroom-1': MEETING_SEATS[0].image,
  meetingDoor: MEETING_DOOR
};
export const REFERENCE_ERRANDS = [
  { stand: point(188, 460), fx: point(146, 430), facing: 'left' },
  { stand: point(1330, 643), fx: point(1388, 643), facing: 'right' },
  { stand: point(1292, 816), fx: point(1356, 819), facing: 'right' },
  { stand: point(680, 296), fx: point(646, 279), facing: 'up' },
  { stand: point(314, 292), fx: point(216, 220), facing: 'up' },
  { stand: point(1300, 332), fx: point(1310, 319), facing: 'up' },
  { stand: point(184, 460), fx: point(162, 408), facing: 'left' },
  { stand: point(155, 666), fx: point(93, 643), facing: 'left' },
  { stand: point(478, 289), fx: point(477, 239), facing: 'up' },
  { stand: point(530, 292), fx: point(530, 244), facing: 'up' },
  { stand: point(572, 288), fx: point(572, 247), facing: 'up' },
  { stand: point(1218, 321), fx: point(1235, 287), facing: 'up' },
  { stand: point(837, 804), fx: point(857, 845), facing: 'down' },
  { stand: point(628, 295), fx: point(619, 279), facing: 'up' }
] as const;

export function pointInPolygon(point: ScenePoint, polygon: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > point.y) !== (yj > point.y) && point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function referenceWalkable(tile: ScenePoint): boolean {
  const p = tileContact(tile);
  return pointInPolygon(p, WALKABLE_FLOOR) &&
    ![...REFERENCE_PODS.map(pod => pod.solid), ...STATIC_SOLIDS].some(poly => pointInPolygon(p, poly));
}
