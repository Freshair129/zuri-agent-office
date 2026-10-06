'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const loadIsolated = require('./load-isolated.cjs');
const loadTs = require('./load-ts.cjs');

function updater() {
  const handlers = new Map();
  const sent = [];
  const module = loadIsolated('src/main/updater.ts', {
    electron: { ipcMain: { handle: (name, fn) => handlers.set(name, fn) } }
  });
  module.initAutoUpdater(() => ({ send: (...args) => sent.push(args) }));
  return { module, handlers, sent };
}

test('Zuri startup and every updater IPC are offline and report manual-only', async () => {
  // Imports of Electron app, HTTP, native updater, filesystem and browser APIs
  // are deliberately unavailable. An attempted dependency fails this test.
  const { handlers, sent } = updater();
  assert.equal(handlers.get('update:current')().state, 'manual-only');
  for (const name of ['checkNow', 'download', 'restartAndInstall', 'openRelease', 'simulate']) {
    const result = await handlers.get(`update:${name}`)({}, 'https://github.com/chaitanyagiri/munder-difflin/releases/latest');
    assert.equal(result.ok, false, name);
    assert.match(result.error, /no Zuri release channel/);
  }
  assert.equal(sent.length, 1);
  assert.equal(sent[0][1].state, 'manual-only');
});

test('manual-only badge never claims current or offers an unavailable action', () => {
  const { describeUpdate, installerUrl, manualDownloadUrl } = loadTs('src/shared/updateState.ts');
  const { handlers } = updater();
  const view = describeUpdate(handlers.get('update:current')(), '0.1.0');
  assert.equal(view.label, 'manual updates');
  assert.equal(view.action, 'none');
  assert.equal(view.busy, false);
  assert.equal(installerUrl('9.9.9', 'win32', 'x64'), null);
  assert.equal(manualDownloadUrl({ state: 'available-manual', version: '9.9.9', url: 'https://upstream.invalid', downloadUrl: 'https://upstream.invalid/setup.exe' }, 'win32', 'x64'), null);
});
