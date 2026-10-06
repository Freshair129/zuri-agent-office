'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const loadTs = require('./load-ts.cjs');
const root = path.resolve(__dirname, '..');
const scene = 'src/renderer/src/scene/office/';
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/renderer/src/assets/maps/zuri-office.tmj'), 'utf8'));

test('preserved legacy map still resolves every tile inside its original atlas', () => {
  const atlas = map.tilesets[0];
  assert.equal(map.tilesets.length, 1);
  assert.equal(atlas.image, '../tilesets/zuri-office.svg');
  assert.equal(atlas.imagewidth / atlas.tilewidth, atlas.columns);
  assert.equal(atlas.imageheight / atlas.tileheight * atlas.columns, atlas.tilecount);
  for (const layer of map.layers.filter(l => l.type === 'tilelayer')) {
    assert.equal(layer.data.length, map.width * map.height);
    for (const gid of layer.data) assert.ok(gid >= 0 && gid <= atlas.tilecount, `${layer.name}: invalid gid ${gid}`);
  }
  const source = fs.readFileSync(path.join(root, scene, 'themeRegistry.ts'), 'utf8');
  assert.doesNotMatch(source, /assets\/tilesets\/.*\.png/);
});

test('preserved legacy map retains reachable stable desk and cafe identities', () => {
  const collision = map.layers.find(l => l.name === 'collision').data;
  const points = map.layers.find(l => l.name === 'spawn-points').objects;
  const tile = p => [p.x / map.tilewidth, p.y / map.tileheight];
  const start = tile(points.find(p => p.name === 'entrance'));
  const queue = [start], reached = new Set([start.join(',')]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || collision[ny * map.width + nx] || reached.has(key)) continue;
      reached.add(key); queue.push([nx, ny]);
    }
  }
  assert.equal(points.filter(p => p.name.startsWith('desk-') || p.name.startsWith('pc-')).length, 16);
  for (const p of points) assert.ok(reached.has(tile(p).join(',')), `unreachable ${p.name}`);
  // Current reference-floor ambient routing is tested against the actual
  // TiledMapRenderer in office-projection.test; this check protects old data.

});

test('all 15 avatar IDs map to inspected generated atlases with real stride and seated crops', () => {
  const assetRoot = path.join(root, 'src/renderer/src/assets/office-2.5d');
  const atlases = JSON.parse(fs.readFileSync(path.join(assetRoot, 'characters-atlases-v2.json'), 'utf8'));
  const profiles = JSON.parse(fs.readFileSync(path.join(assetRoot, 'characters-profiles.json'), 'utf8'));
  const cast = fs.readFileSync(path.join(root, scene, 'cast.ts'), 'utf8');
  const ids = [...cast.matchAll(/name: '([^']+)',\s+displayName:/g)].map(m => m[1]);
  assert.equal(ids.length, 15);
  assert.deepEqual(Object.keys(profiles).sort(), ids.sort());
  for (let base = 0; base < 3; base++) {
    const variants = Object.values(profiles).filter(profile => profile.base === base);
    assert.equal(variants.length, 5);
    assert.equal(new Set(variants.map(profile => profile.garment)).size, 5);
    for (const profile of variants) assert.match(profile.garment, /^#[0-9a-f]{6}$/);
  }
  assert.deepEqual(atlases.map(atlas => atlas.frames.length), [18, 18]);
  for (const atlas of atlases) {
    const png = fs.readFileSync(path.join(assetRoot, atlas.file));
    assert.equal(require('node:crypto').createHash('sha256').update(png).digest('hex'), atlas.sha256);
    assert.equal(png.readUInt32BE(16), atlas.width);
    assert.equal(png.readUInt32BE(20), atlas.height);
    assert.equal(png[25], 6, 'PNG stores real RGBA channels');
    assert.ok(atlas.transparentPixels > atlas.width * atlas.height / 2);
    assert.equal(atlas.transparentPixels + atlas.lowAlphaPixels + atlas.visiblePixels, atlas.width * atlas.height);
    for (const [x, y, width, height] of atlas.frames) {
      assert.ok(width > 0 && height > 0 && x >= 0 && y >= 0);
      assert.ok(x + width <= atlas.width && y + height <= atlas.height);
    }
  }
  // This locks the inspected originals and mappings; desktop animation remains a separate gate.
  assert.doesNotMatch(cast, /sceneFrameBufs|scaleMode = 'nearest'/);
  const directions = JSON.parse(fs.readFileSync(path.join(assetRoot, 'characters-directions-v2.json'), 'utf8'));
  assert.deepEqual(directions.map(row => row.direction), ['down', 'up', 'right', 'left']);
  assert.deepEqual(directions.map(row => row.view), ['south', 'north', 'east', 'east']);
  assert.deepEqual(directions.map(row => row.mirror), [false, false, false, true]);
  directions.forEach(row => {
    assert.equal(row.walk.length, 2);
    assert.equal(row.seated.length, 2);
    assert.notDeepEqual(row.walk[0], row.walk[1], 'walk phases use distinct inspected poses');
    for (const [atlas, column] of [row.idle, ...row.walk, ...row.seated]) {
      assert.ok(atlas === 0 || atlas === 1);
      assert.ok(Number.isInteger(column) && column >= 0 && column < 6);
      for (let base = 0; base < 3; base++) assert.ok(atlases[atlas].frames[base * 6 + column]);
    }
  });
});

test('new coordinator name is Zuri, while persisted custom names survive', () => {
  const { DEFAULT_GOD_NAME, resolveGodName } = loadTs('src/shared/godIdentity.ts');
  assert.equal(DEFAULT_GOD_NAME, 'Zuri Coordinator');
  assert.equal(resolveGodName('  My team lead  '), 'My team lead');
  assert.equal(resolveGodName('Michael'), 'Michael');
  assert.equal(resolveGodName(null), 'Zuri Coordinator');
});
