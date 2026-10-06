'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const loadTs = require('./load-ts.cjs');
const p = loadTs('src/renderer/src/scene/office/projection.ts');
const layout = loadTs('src/renderer/src/scene/office/sceneLayout.ts');
const { findPath } = loadTs('src/renderer/src/scene/office/pathfinding.ts');
const { TiledMapRenderer } = loadTs('src/renderer/src/scene/office/TiledMapRenderer.ts');
const { Texture } = require('pixi.js');
const map = JSON.parse(fs.readFileSync('src/renderer/src/assets/maps/zuri-office.tmj', 'utf8'));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const renderer = () => new TiledMapRenderer(map, { room: Texture.EMPTY });

test('floor homography matches four calibrated image corners and round trips fractional/outside points', () => {
  const logical = [{ x: 0, y: 0 }, { x: 1536, y: 0 }, { x: 1536, y: 1024 }, { x: 0, y: 1024 }];
  logical.forEach((q, i) => { const actual = p.project(q); near(actual.x, p.FLOOR_CORNERS[i].x); near(actual.y, p.FLOOR_CORNERS[i].y); });
  for (let x = -16; x <= 1552; x += 23.25) for (let y = -16; y <= 1040; y += 29.5) {
    const actual = p.unproject(p.project({ x, y })); near(actual.x, x); near(actual.y, y);
  }
  assert.deepEqual(p.projectionBounds(), { origin: { x: 0, y: 0 }, width: 1536, height: 1024 });
});

test('perspective floor uses screen east/south directions and actors grow toward foreground', () => {
  const start = p.project({ x: 768, y: 512 });
  const east = p.project({ x: 784, y: 512 }), south = p.project({ x: 768, y: 528 });
  assert.ok(east.x > start.x && Math.abs(east.y - start.y) < Math.abs(east.x - start.x));
  assert.ok(south.y > start.y && Math.abs(south.x - start.x) < Math.abs(south.y - start.y));
  assert.ok(p.perspectiveActorHeight({ x: 800, y: 250 }) < p.perspectiveActorHeight({ x: 800, y: 800 }));
});

test('all16 stable IDs remap uniquely to four pods with both facing sides and selectable exact foot contacts', () => {
  const names = map.layers.find(l => l.name === 'spawn-points').objects.filter(s => /^(desk-|pc-)/.test(s.name)).map(s => s.name).sort();
  assert.deepEqual(layout.REFERENCE_SEATS.map(s => s.name).sort(), names);
  assert.equal(new Set(layout.REFERENCE_SEATS.map(s => `${s.tile.x},${s.tile.y}`)).size, 16);
  for (const pod of layout.REFERENCE_PODS) {
    const seats = layout.REFERENCE_SEATS.filter(s => s.pod === pod.id);
    assert.equal(seats.filter(s => s.side === 'front' && s.facing === 'up').length, 2);
    assert.equal(seats.filter(s => s.side === 'back' && s.facing === 'down').length, 2);
    for (const seat of seats) {
      const ground = p.tileContact(seat.tile);
      assert.ok(Math.hypot(ground.x - seat.image.x, ground.y - seat.image.y) < 9, 'quantization stays below one visible foot width');
      for (const zoom of [0.4, 0.75, 1, 2]) {
        const screen = { x: ground.x * zoom - 127, y: ground.y * zoom + 36 };
        const hit = p.sceneToTile({ x: (screen.x + 127) / zoom, y: (screen.y - 36) / zoom }, { x: 0, y: 0 }, 16);
        assert.deepEqual(hit, seat.tile, `${seat.name}: exact bottom-center must select its own cell`);
      }
      assert.equal(ground.y < pod.depth, seat.side === 'back', 'far actors sort behind the desktop, near actors in front');
    }
  }
});

test('every desk, meeting/cafe spot, errand and task stand is walkable and reachable without carving furniture', () => {
  const r = renderer();
  try {
    const entry = r.getSpawnPoint('entrance');
    const required = [...layout.REFERENCE_SEATS.map(s => [s.name, s.tile]),
      ...Object.entries(layout.INTERACTION_PIXELS).filter(([n]) => /^(entrance|cafe-|warroom-|meetingDoor|pin|take|archive|.*Stand)$/.test(n)).map(([n, q]) => [n, p.referenceTile(q)]),
      ...layout.REFERENCE_ERRANDS.map((e, i) => [`errand${i}`, p.referenceTile(e.stand)])];
    for (const [name, tile] of required) {
      assert.equal(r.isWalkable(tile.x, tile.y), true, name);
      assert.ok(findPath(r, entry, tile), name);
    }
    assert.equal(r.isWalkable(0, 0), false, 'outside actual room polygon is not walkable');
    for (const poly of [...layout.REFERENCE_PODS.map(pod => pod.solid), ...layout.STATIC_SOLIDS]) {
      const center = { x: poly.reduce((n, q) => n + q[0], 0) / poly.length, y: poly.reduce((n, q) => n + q[1], 0) / poly.length };
      const tile = p.referenceTile(center);
      assert.equal(r.isWalkable(tile.x, tile.y), false, 'solid footprint is not carved to preserve a bad target');
    }
    const interior = p.referenceTile(layout.MEETING_INTERIOR);
    const route = findPath(r, entry, interior);
    assert.ok(route.some(tile => { const q = p.tileContact(tile); return q.x > 620 && q.x < 690 && q.y > 215 && q.y < 285; }), 'meeting route crosses doorway rather than glass');
    const zone = r.getZone('boardroom');
    assert.ok(findPath(r, entry, { x: zone.x, y: zone.y }), 'first overflow meeting position is reachable');
  } finally { r.getContainer().destroy({ children: true }); }
});

test('rendered composition is one room image, four pod silhouettes, eight chair masks,16 anchor labels and frame-only glass', () => {
  const r = renderer();
  try {
    const root = r.getContainer(), layer = r.getCharacterContainer();
    assert.equal(root.children.filter(c => c.label === 'office-reference:room').length, 1);
    assert.equal(layer.sortableChildren, true);
    assert.equal(layer.children.filter(c => c.label.startsWith('office-reference:pod:')).length, 4);
    assert.equal(layer.children.filter(c => c.label.startsWith('office-reference:chair:')).length, 8);
    assert.equal(layer.children.filter(c => c.label.startsWith('office-reference:seat:')).length, 16);
    for (const seat of layout.REFERENCE_SEATS) {
      const anchor = layer.children.find(c => c.label === `office-reference:seat:${seat.name}:${seat.side}`);
      assert.deepEqual({ x: anchor.x, y: anchor.y }, p.tileContact(seat.tile));
    }
    const glass = layer.children.find(c => c.label === 'office-reference:glass');
    assert.ok(glass.children[0].mask);
    const { Point } = require('pixi.js');
    for (const [x, y] of [[750, 190], [845, 200], [970, 220]])
      assert.equal(glass.children[1].containsPoint(new Point(x, y)), false, 'clear pane cannot erase an occupant');
    for (const [x, y] of [[792, 200], [890, 200]])
      assert.equal(glass.children[1].containsPoint(new Point(x, y)), true, 'opaque mullion must occlude');
    assert.equal(glass.children[0].texture, Texture.EMPTY, 'all foreground crops share the room texture');
    assert.ok(layer.children.find(c => c.label === 'office-reference:front-wall'));
    // Image opacity/anatomy are independently gated by real desktop screenshots.
  } finally { r.getContainer().destroy({ children: true }); }
});

test('camera-matched seating preserves foot/depth, perspective size and reduced-motion freeze', () => {
  const oldRaf = global.requestAnimationFrame, oldCancel = global.cancelAnimationFrame;
  global.requestAnimationFrame = () => 1; global.cancelAnimationFrame = () => {};
  let actor;
  try {
    const { CharacterSprite } = loadTs('src/renderer/src/scene/office/CharacterSprite.ts');
    const frames = Array.from({ length: 4 }, () => Array(7).fill(Texture.EMPTY));
    actor = new CharacterSprite(frames, (x, y) => p.project({ x, y }));
    actor.setPosition(400, 650);
    actor.container.zIndex = p.sceneDepth({ x: 400, y: 650 });
    const body = actor.container.children[0], contact = { x: actor.container.x, y: actor.container.y, z: actor.container.zIndex };
    const standingScale = body.scale.y;
    actor.setAnimation('idle', 'up'); actor.setSeatedCrop(1);
    assert.equal(body.y, 0, 'old isometric chair offset is removed for new N/S seated artwork');
    near(body.scale.y, standingScale * 1.15);
    actor.setReducedMotion(true); assert.equal(body.playing, false);
    assert.deepEqual({ x: actor.container.x, y: actor.container.y, z: actor.container.zIndex }, contact);
    actor.setSeatedCrop(0); actor.setAnimation('walk', 'right');
    assert.equal(body.y, 0); assert.equal(body.scale.y, standingScale); assert.equal(body.playing, false);
  } finally {
    actor?.destroy();
    if (oldRaf) global.requestAnimationFrame = oldRaf; else delete global.requestAnimationFrame;
    if (oldCancel) global.cancelAnimationFrame = oldCancel; else delete global.cancelAnimationFrame;
  }
});


test('overflow uses actual ordered meeting chair contacts instead of arbitrary walkable floor cells', () => {
  const r = renderer();
  try {
    assert.equal(layout.MEETING_SEATS.length, 4);
    assert.deepEqual(r.getMeetingSeatTiles(), layout.MEETING_SEATS.map(s => s.tile));
    assert.deepEqual(r.getSpawnPoint('warroom-seat'), r.getMeetingSeatTiles()[0], 'preserve original meeting spawn identity');
    const expected = [[884, 259, 'up'], [965, 267, 'up'], [903, 211, 'down'], [972, 220, 'down']];
    layout.MEETING_SEATS.forEach((seat, i) => {
      assert.deepEqual([seat.image.x, seat.image.y, r.getSeatFacing(seat.tile)], expected[i]);
      assert.ok(findPath(r, r.getSpawnPoint('entrance'), seat.tile), seat.name);
      const contact = p.tileContact(seat.tile);
      assert.ok(contact.x > 680 && contact.x < 1135 && contact.y > 190 && contact.y < 285);
    });
    const floorSource = fs.readFileSync('src/renderer/src/scene/office/OfficeFloor.tsx', 'utf8');
    assert.match(floorSource, /for \(const tile of mapRenderer\.getMeetingSeatTiles\(\)\) addSeat\(tile\)/);
    assert.doesNotMatch(floorSource, /addZoneSeats/);
  } finally { r.getContainer().destroy({ children: true }); }
});


test('north seated correction recomputes through facing, position and reduced-motion transitions without compounding', () => {
  const oldRaf = global.requestAnimationFrame, oldCancel = global.cancelAnimationFrame;
  global.requestAnimationFrame = () => 1; global.cancelAnimationFrame = () => {};
  let actor;
  try {
    const { CharacterSprite } = loadTs('src/renderer/src/scene/office/CharacterSprite.ts');
    actor = new CharacterSprite(Array.from({ length: 4 }, () => Array(7).fill(Texture.EMPTY)), (x, y) => p.project({ x, y }));
    const body = actor.container.children[0];
    for (const logical of [{ x: 400, y: 650 }, { x: 900, y: 100 }]) {
      actor.setPosition(logical.x, logical.y);
      const contact = p.project(logical), base = p.perspectiveActorHeight(contact) / body.texture.height;
      for (let i = 0; i < 4; i++) {
        actor.setAnimation('idle', 'up'); actor.setSeatedCrop(1);
        near(body.scale.y, base * 1.15);
        near(actor.getHeight(), p.perspectiveActorHeight(contact) * 1.15);
        actor.setReducedMotion(i % 2 === 0); actor.setPosition(logical.x, logical.y);
        near(body.scale.y, base * 1.15);
        actor.setAnimation('read', 'up'); near(body.scale.y, base * 1.15);
        actor.setAnimation('idle', 'down'); near(body.scale.y, base);
        actor.setAnimation('idle', 'up'); actor.setSeatedCrop(0); near(body.scale.y, base);
        actor.setAnimation('walk', 'right'); near(body.scale.y, base);
        assert.deepEqual({ x: actor.container.x, y: actor.container.y }, contact);
        assert.equal(body.y, 0);
      }
    }
  } finally {
    actor?.destroy();
    if (oldRaf) global.requestAnimationFrame = oldRaf; else delete global.requestAnimationFrame;
    if (oldCancel) global.cancelAnimationFrame = oldCancel; else delete global.cancelAnimationFrame;
  }
});
