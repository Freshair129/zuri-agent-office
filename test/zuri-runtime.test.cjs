'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const loadIsolated = require('./load-isolated.cjs');
const loadTs = require('./load-ts.cjs');

function identity(env = {}) {
  const calls = [];
  const app = {
    setName: (name) => calls.push(['name', name]),
    setAppUserModelId: (id) => calls.push(['id', id]),
    getPath: (name) => { assert.equal(name, 'appData'); return path.resolve('fake-app-data'); },
    setPath: (name, value) => calls.push([name, value]),
    commandLine: { appendSwitch: (name, value) => calls.push([name, value]) }
  };
  loadIsolated('src/main/runtimeIdentity.ts', {
    electron: { app }, 'node:fs': { mkdirSync: () => {} }, 'node:path': path
  }, env);
  return calls;
}

test('identity isolates session, logs, cache, temp and crash state before state consumers', () => {
  const calls = identity();
  assert.deepEqual(calls.slice(0, 2), [['name', 'Zuri'], ['id', 'ai.zuri.agentoffice']]);
  const root = path.resolve('fake-app-data', 'ZuriAgentOffice');
  const values = Object.fromEntries(calls);
  assert.equal(values.userData, root);
  for (const [key, dir] of [['sessionData', 'session'], ['logs', 'logs'], ['temp', 'temp'], ['crashDumps', 'crashDumps'], ['disk-cache-dir', 'cache']]) {
    assert.equal(values[key], path.join(root, dir));
  }
  const main = fs.readFileSync(path.join(__dirname, '../src/main/index.ts'), 'utf8');
  assert.match(main.trimStart(), /^import '\.\/runtimeIdentity';/);
});

test('QA override is explicit, absolute, and never falls back from invalid input', () => {
  const root = path.resolve('isolated-qa');
  assert.equal(Object.fromEntries(identity({ ZURI_USER_DATA_DIR: root })).userData, root);
  assert.throws(() => identity({ ZURI_USER_DATA_DIR: 'relative' }), /absolute directory/);
  assert.throws(() => identity({ ZURI_USER_DATA_DIR: '' }), /absolute directory/);
});

test('hero and model catalog stay local even when force refresh is requested', async () => {
  const { loadHero } = loadIsolated('src/main/hero.ts', {
    '../shared/heroPayload': loadTs('src/shared/heroPayload.ts')
  });
  const { loadModelCatalog } = loadIsolated('src/main/modelCatalog.ts', {});
  const hero = await loadHero('unread-cache', { force: true });
  assert.equal(hero.hero.sponsor, null);
  assert.equal(hero.hero.plan.upgrade, undefined);
  assert.deepEqual(await loadModelCatalog('unread-cache', { force: true }), { catalog: null, fetchedAt: 0, stale: true });
});

test('runtime analytics remains disabled with inherited keys and a later opt-in', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-analytics-'));
  globalThis.__POSTHOG_KEY__ = 'test-key';
  globalThis.__POSTHOG_HOST__ = 'https://example.invalid';
  let created = 0;
  const { analytics } = loadIsolated('src/main/analytics.ts', {
    'node:fs': fs, 'node:path': path, 'node:crypto': require('node:crypto'),
    'posthog-node': { PostHog: class { constructor() { created++; } } }
  });
  try {
    analytics.init({ stateDir: dir, appVersion: '0.1.0', enabled: true });
    analytics.setEnabled(true);
    analytics.track('app_launched');
    await analytics.endSession();
    assert.equal(created, 0);
    assert.deepEqual(fs.readdirSync(dir), []);
  } finally { fs.rmSync(dir, { recursive: true }); }
});

test('Zuri hire links keep the compatible manifest schema but reject upstream scheme', () => {
  const { parseHireDeepLink, HIRE_SPEC_V1 } = loadTs('src/shared/hire.ts');
  const src = 'https://example.com/role.json';
  assert.equal(parseHireDeepLink(`zuri-agent-office://hire?src=${encodeURIComponent(src)}`), src);
  assert.equal(parseHireDeepLink(`munderdifflin://hire?src=${encodeURIComponent(src)}`), null);
  assert.equal(HIRE_SPEC_V1, 'munder-difflin/hire@1');
});
