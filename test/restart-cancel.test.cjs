/**
 * Cancelling the quit warning must un-stick restart-to-install.
 *
 * The bug: `quitAndInstall()` reports nothing. It ASKS the app to quit, and with
 * agents running the app refuses and puts up the quit warning. The IPC handler
 * returned `{ ok: true }` at that moment, so every surface that had disabled its
 * button was told the restart had succeeded — and then the user cancelled, the
 * app carried on living, and the button sat on "restarting…" forever with
 * nothing left to resolve it.
 *
 * The fix is a wiring one and lives across two files, which is exactly why it is
 * worth pinning: the handler waits for an outcome, and the cancel path is the
 * thing that supplies it. Delete either half and the bug returns silently, with
 * every unit test still green, because nothing pure is involved.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const read = (rel) => readFileSync(join(__dirname, '..', rel), 'utf8');

test('cancelling the quit warning is wired to the restart handler', () => {
  const src = read('src/main/index.ts');
  assert.ok(src.includes("import { initAutoUpdater, abortPendingRestart } from './updater';"),
    'index.ts must import the abort');
  const handler = src.slice(src.indexOf("ipcMain.handle('app:cancelClose'"));
  const body = handler.slice(0, handler.indexOf('\n});'));
  assert.ok(body.includes('abortPendingRestart()'),
    'app:cancelClose is the ONLY place that knows a requested quit was refused; '
    + 'if it stops calling this, the restart button goes back to hanging');
});

test('the renderer restores its notice when the restart reports a cancel', () => {
  const src = read('src/renderer/src/components/UpdateToast.tsx');
  const fn = src.slice(src.indexOf('const restart = async'));
  const body = fn.slice(0, fn.indexOf('\n  };'));
  assert.ok(/if \(!res\.ok\) \{ setStatus\(prev\); setBusy\(false\); \}/.test(body),
    'a cancelled restart has to put the notice back AND clear busy — clearing one '
    + 'without the other leaves either a dead button or no way to retry');
});

test('manual-only restart settles immediately and cancellation remains harmless', async () => {
  const handlers = new Map();
  const updater = require('./load-isolated.cjs')('src/main/updater.ts', {
    electron: { ipcMain: { handle: (name, fn) => handlers.set(name, fn) } }
  });
  updater.initAutoUpdater(() => null);
  updater.abortPendingRestart();
  for (let i = 0; i < 2; i++) {
    const result = await handlers.get('update:restartAndInstall')();
    assert.equal(result.ok, false);
    assert.match(result.error, /Manual updates only/);
  }
  updater.abortPendingRestart();
});