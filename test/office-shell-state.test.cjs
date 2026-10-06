const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { buildSync } = require('esbuild');

function makeStore() {
  const root = path.resolve(__dirname, '..');
  const code = buildSync({
    entryPoints: [path.join(root, 'src/renderer/src/store/store.ts')],
    bundle: true, write: false, platform: 'node', format: 'cjs',
    tsconfig: path.join(root, 'tsconfig.web.json'), external: ['react', 'zustand']
  }).outputFiles[0].text;
  const storage = new Map();
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, require, console,
    setTimeout: () => 1, clearTimeout: () => {},
    window: { cth: {}, localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    } }
  });
  return module.exports.useStore;
}

test('closing and reselecting the same agent preserves its draft and session identity', () => {
  const store = makeStore();
  const agent = { id: 'worker', name: 'Worker', ptyId: 'real-session-id' };
  store.setState({ agents: [agent], selectedId: agent.id, drafts: { worker: 'unsent work' } });
  store.getState().setAgentDrawerOpen(false);
  assert.equal(store.getState().selectedId, 'worker');
  assert.equal(store.getState().agents[0], agent);
  store.getState().select('worker');
  assert.equal(store.getState().agentDrawerOpen, true);
  assert.equal(store.getState().drafts.worker, 'unsent work');
  assert.equal(store.getState().agents[0].ptyId, 'real-session-id');
});

test('coordinator navigation publishes selection and repeated tab requests atomically', () => {
  const store = makeStore();
  store.setState({ agents: [{ id: 'god', isGod: true }, { id: 'worker' }], selectedId: 'worker', agentDrawerOpen: false });
  const observed = [];
  const unsubscribe = store.subscribe(s => observed.push([s.selectedId, s.agentDrawerOpen, s.ccTabRequest?.tab]));
  store.getState().openCommandCenter('tasks');
  assert.equal(observed.length, 1);
  assert.deepEqual(observed[0], ['god', true, 'tasks']);
  const first = store.getState().ccTabRequest.seq;
  store.getState().openCommandCenter('tasks');
  assert.equal(store.getState().ccTabRequest.seq, first + 1);
  unsubscribe();
});

test('navigation without a coordinator does not invent a selection or open a pane', () => {
  const store = makeStore();
  store.setState({ agents: [], selectedId: null, agentDrawerOpen: false });
  store.getState().openCommandCenter('memory');
  assert.equal(store.getState().selectedId, null);
  assert.equal(store.getState().ccTabRequest, null);
  assert.equal(store.getState().agentDrawerOpen, false);
});

test('prerequisite navigation reveals the coordinator without losing its dispatch seed', () => {
  const store = makeStore();
  store.setState({ agents: [{ id: 'god', isGod: true }, { id: 'worker' }], selectedId: 'worker', agentDrawerOpen: false });
  store.getState().requestDispatchSeed('Review missing prerequisites before installation');
  const seed = store.getState().dispatchSeedRequest;
  store.getState().openCommandCenter('floor');
  assert.equal(store.getState().agentDrawerOpen, true);
  assert.equal(store.getState().selectedId, 'god');
  assert.equal(store.getState().ccTabRequest.tab, 'floor');
  assert.equal(store.getState().dispatchSeedRequest, seed);
});
