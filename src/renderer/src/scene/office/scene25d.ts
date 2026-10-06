import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { MEETING_SEATS, REFERENCE_PODS, REFERENCE_SEATS, type Polygon } from './sceneLayout';
import { tileContact } from './projection';

export interface OfficeTextures { room: Texture; }

/** Foreground silhouettes are masks of the same unchanged room image. Empty
 * floor and transparent glass panes are deliberately excluded from the masks. */
function foreground(layer: Container, texture: Texture, label: string, polygons: readonly Polygon[], depth: number): Container {
  const group = new Container();
  group.label = label;
  group.zIndex = depth;
  group.eventMode = 'none';
  const sprite = new Sprite(texture);
  const mask = new Graphics();
  for (const polygon of polygons) mask.poly(polygon.flatMap(p => [...p])).fill(0xffffff);
  group.addChild(sprite, mask);
  sprite.mask = mask;
  layer.addChild(group);
  return group;
}

export function buildOfficeScene(root: Container, objects: Container, textures: OfficeTextures): void {
  const room = new Sprite(textures.room);
  room.label = 'office-reference:room';
  room.eventMode = 'none';
  root.addChild(room);
  objects.label = 'office-reference:depth-sorted';
  root.addChild(objects);
  for (const pod of REFERENCE_PODS) foreground(objects, textures.room,
    `office-reference:pod:${pod.id}`, pod.masks, pod.depth);
  for (const seat of REFERENCE_SEATS) {
    const point = tileContact(seat.tile);
    const anchor = new Container();
    anchor.label = `office-reference:seat:${seat.name}:${seat.side}`;
    anchor.position.copyFrom(point);
    anchor.zIndex = point.y;
    anchor.eventMode = 'none';
    objects.addChild(anchor);
    if (seat.chairBack) foreground(objects, textures.room,
      `office-reference:chair:${seat.name}`, [seat.chairBack], point.y + 0.5);
  }
  // Meeting table occludes lower bodies behind it; its silhouette omits floor.
  foreground(objects, textures.room, 'office-reference:meeting-table', [
    [[854,131],[1008,144],[1031,169],[1018,196],[854,185],[839,164]],
    [[871,183],[879,183],[874,229],[867,228]], [[998,196],[1005,194],[1000,241],[993,239]]
  ], 250);
  for (const seat of MEETING_SEATS) {
    const anchor = new Container();
    anchor.label = 'office-reference:meeting-seat:' + seat.name;
    anchor.position.copyFrom(tileContact(seat.tile));
    anchor.eventMode = 'none';
    objects.addChild(anchor);
  }
  foreground(objects, textures.room, 'office-reference:meeting-chair:warroom-seat', [
    [[862,191],[909,195],[912,214],[903,232],[872,228],[864,213]]
  ], tileContact(MEETING_SEATS[0].tile).y + 0.5);
  foreground(objects, textures.room, 'office-reference:meeting-chair:warroom-2', [
    [[936,199],[978,202],[981,223],[973,239],[941,234],[936,216]]
  ], tileContact(MEETING_SEATS[1].tile).y + 0.5);
  // Black mullions and opaque meeting-wall edges. Never copy the full panes:
  // the source room is opaque and would otherwise erase people behind glass.
  foreground(objects, textures.room, 'office-reference:glass', [
    [[631,24],[1156,65],[1153,82],[632,42]],
    [[631,29],[642,30],[643,250],[633,252]],
    [[788,43],[797,44],[798,266],[789,264]],
    [[886,49],[895,50],[896,277],[887,275]],
    [[1140,78],[1153,79],[1148,301],[1136,299]],
    [[646,251],[1144,288],[1143,303],[646,263]]
  ], 310);
  const glass = new Graphics().poly([647,44,1139,82,1136,287,647,251])
    .fill({ color: 0xc6dfdc, alpha: 0.035 });
  glass.label = 'office-reference:glass-tint';
  glass.zIndex = 309;
  glass.eventMode = 'none';
  objects.addChild(glass);
  foreground(objects, textures.room, 'office-reference:front-wall', [
    [[43,735],[193,755],[202,843],[79,839]],
    [[275,761],[506,788],[505,890],[277,854]],
    [[506,815],[580,829],[580,903],[505,890]],
    [[587,736],[617,740],[617,900],[580,904]],
    [[798,760],[826,763],[826,933],[797,925]],
    [[822,839],[906,848],[905,951],[825,931]],
    [[906,844],[1099,869],[1100,965],[905,951]],
    [[1174,880],[1331,910],[1432,848],[1450,924],[1330,1000],[1174,974]],
    // Entry glass: only the frame/handles are opaque foreground.
    [[619,746],[799,761],[799,771],[619,758]],
    [[701,760],[710,761],[710,909],[701,908]],
    [[618,893],[797,912],[797,924],[618,905]],
    [[692,826],[703,828],[703,856],[692,854]], [[711,829],[720,830],[720,861],[711,859]]
  ], 2000);
}
