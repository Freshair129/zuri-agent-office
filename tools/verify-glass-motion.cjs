'use strict';
// Explicit Electron acceptance capture. Uses only isolated QA profiles and a local
// shell that emits counters; this is not an LLM or production-workflow test.
const { _electron } = require(process.env.ZURI_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'output/playwright/glass-motion/after-' + Date.now());
const executable = path.resolve(process.env.ZURI_QA_EXECUTABLE || path.join(root, 'dist/glass-0.1.1/win-unpacked/Zuri.exe'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report = { snapshotVersion: '1.1.0', startedAt: new Date().toISOString(), scope: 'Packaged UI glass/motion; controlled shell output, no live model acceptance', checks: {}, screens: [], errors: [] };
const workspace = path.join(dir, 'workspace');
fs.mkdirSync(workspace, { recursive: true });
fs.writeFileSync(path.join(workspace, 'proof.txt'), 'ZURI_MOTION_EDITOR_PROOF\n');
fs.writeFileSync(path.join(workspace, 'stream.cjs'), "let n=0;setInterval(()=>console.log('ZURI_MOTION_STREAM '+(++n)),200);process.stdin.resume();\n");
let app, page;
const saveReport = () => fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(report, null, 2));
async function launch(profile, configured) {
  fs.mkdirSync(path.join(profile, 'temp'), { recursive: true });
  if (configured) fs.writeFileSync(path.join(profile, 'config.json'), JSON.stringify({
    onboardingComplete: true, harnessHome: path.join(dir, 'hive'), registeredRepos: [workspace],
    autoMode: false, godProvider: 'opencode', godModel: 'local/qwen3.5:4b',
    providerBaseUrls: { opencode: 'http://127.0.0.1:1/v1' }, providerDefaultModels: { opencode: 'qwen3.5:4b' },
    missions: [], opsStandupSeeded: true, heartbeatSeeded: true, notifications: false,
    telemetryEnabled: false, autoUpdate: false
  }));
  const env = { ...process.env, ZURI_USER_DATA_DIR: profile, TEMP: path.join(profile, 'temp'), TMP: path.join(profile, 'temp') };
  const pathKey = Object.keys(env).find(k => k.toUpperCase() === 'PATH') || 'PATH';
  env[pathKey] = [process.env.ZURI_QA_CLI_DIR, path.dirname(process.execPath), env[pathKey]].filter(Boolean).join(path.delimiter);
  delete env.ELECTRON_RUN_AS_NODE;
  for (const k of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY/.test(k)) delete env[k];
  app = await _electron.launch({ executablePath: executable, env, timeout: 60000,
    recordVideo: { dir: path.join(dir, 'video'), size: { width: 1440, height: 960 } } });
  page = await app.firstWindow();
  page.setDefaultTimeout(20000);
  page.on('pageerror', e => report.errors.push(e.message));
  await size(1440, 960);
  report.runtime = await app.evaluate(({ app }) => ({ name: app.getName(), version: app.getVersion(), isPackaged: app.isPackaged, electron: process.versions.electron }));
  assert.equal(report.runtime.isPackaged, true);
  assert.equal(report.runtime.version, '0.1.1');
}
async function size(width, height) {
  await app.evaluate(({ BrowserWindow }, d) => BrowserWindow.getAllWindows()[0].setContentSize(d.width, d.height), { width, height });
}
async function snap(name, note = '') {
  await page.waitForTimeout(280);
  const file = `${String(report.screens.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(dir, file) });
  const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  report.screens.push({ file, name, note, ...dimensions, at: new Date().toISOString(), sha256: hash(path.join(dir, file)) });
  saveReport();
}
async function close() {
  if (!app) return;
  await page.evaluate(async () => { for (const p of await window.cth.listPtys()) await window.cth.killPty(p.id); }).catch(() => {});
  await app.close();
  app = null;
}
async function createStreamAgent() {
  await page.getByRole('button', { name: 'add agent', exact: true }).last().click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Motion QA');
  await snap('agent-create-identity', 'Unsubmitted QA form.');
  await page.getByRole('button', { name: '2 Workspace folder · isolation · resume', exact: true }).click();
  await page.getByRole('textbox', { name: '/path/to/your/project', exact: true }).fill(workspace);
  await snap('agent-create-workspace');
  await page.getByRole('button', { name: '3 Engine provider · model · command', exact: true }).click();
  await page.getByRole('button', { name: 'Custom', exact: true }).click();
  await page.getByRole('textbox', { name: 'Command', exact: true }).fill(`node "${path.join(workspace, 'stream.cjs')}"`);
  await snap('agent-create-engine', 'Controlled local counter process, not an AI model.');
  await page.getByRole('button', { name: '4 Briefing description · goal', exact: true }).click();
  await snap('agent-create-briefing');
  await page.getByRole('button', { name: 'spawn', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: /^MOTION QA/ }).first().click();
  await page.locator('.xterm').waitFor();
}
(async () => {
  console.log('CAPTURE', dir);
  try {
    await launch(path.join(dir, 'profile'), true);
    await page.getByRole('button', { name: 'open', exact: true }).click();
    await page.getByRole('button', { name: 'Settings', exact: true }).waitFor();
    await createStreamAgent();
    await page.evaluate(() => { window.__savedTerminal = document.querySelector('.xterm'); });
    for (const tab of ['GIT', 'MESSAGES', 'TRACES', 'TERMINAL']) {
      await page.getByRole('button', { name: tab, exact: true }).click(); await snap('agent-' + tab.toLowerCase());
    }
    report.checks.terminalElementPreserved = await page.evaluate(() => window.__savedTerminal === document.querySelector('.xterm'));
    assert.equal(report.checks.terminalElementPreserved, true);

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await page.waitForTimeout(260);
    report.checks.glass = await dialog.locator('.zuri-glass-dialog').evaluate(e => ({ backdropFilter: getComputedStyle(e).backdropFilter, background: getComputedStyle(e).backgroundColor }));
    assert.match(report.checks.glass.backdropFilter, /blur\(16px\)/);
    const buttons = dialog.locator('button:visible:not(:disabled)');
    await buttons.last().focus(); await page.keyboard.press('Tab');
    assert(await dialog.evaluate(e => e.contains(document.activeElement)));
    await page.evaluate(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true })));
    assert.equal(await page.getByRole('dialog').count(), 1);
    await page.getByRole('button', { name: 'reset & start over', exact: true }).click();
    assert(await dialog.evaluate(e => e.contains(document.activeElement)));
    await page.getByRole('button', { name: 'cancel', exact: true }).click();
    report.checks.focusTrapSubviewAndIme = 'PASS';
    await page.getByRole('button', { name: 'off', exact: true }).first().click();
    let confirms = 0;
    page.once('dialog', async d => { confirms++; await d.dismiss(); });
    await page.getByRole('button', { name: 'close', exact: true }).click();
    await page.waitForTimeout(280);
    assert.equal(confirms, 1); assert.equal(await dialog.count(), 1);
    assert.equal(await page.getByText('unsaved changes', { exact: true }).count(), 1);
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: 'close', exact: true }).click();
    await page.waitForTimeout(20);
    report.checks.exitInert = await page.locator('[data-zuri-dialog]').evaluate(e => e.inert && e.getAttribute('aria-hidden') === 'true');
    assert(report.checks.exitInert);
    await dialog.waitFor({ state: 'detached' });
    assert(await page.getByRole('button', { name: 'Settings', exact: true }).evaluate(e => e === document.activeElement));
    report.checks.unsavedGuardAndFocusRestore = 'PASS';

    const card = page.getByRole('button', { name: /^MOTION QA/ }).first();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await card.hover(); await page.mouse.down(); await page.waitForTimeout(100);
    report.checks.reducedMountedCardTransform = await card.evaluate(e => getComputedStyle(e).transform);
    await page.mouse.up();
    assert(['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(report.checks.reducedMountedCardTransform));
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.waitForTimeout(30);
    assert.equal(await dialog.evaluate(e => getComputedStyle(e).transform), 'none');
    await page.keyboard.press('Escape'); await page.waitForTimeout(30);
    assert.equal(await dialog.count(), 0);
    report.checks.reducedMotion = 'PASS';
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.evaluate(async () => {
      const p = (await window.cth.listPtys()).find(p => p.id.startsWith('pty-motion-qa-'));
      if (!p) throw new Error('Controlled stream PTY is not running');
      window.__packets = 0; window.__frames = []; window.__dialogSamples = []; window.__stopFrames = false;
      window.__off = window.cth.onPtyData(p.id, data => { if (data.includes('ZURI_MOTION_STREAM')) window.__packets++; });
      let last = performance.now();
      function tick(t) {
        window.__frames.push(t - last); last = t;
        const d = document.querySelector('[data-zuri-dialog]');
        if (d) window.__dialogSamples.push({ transform: getComputedStyle(d).transform, opacity: getComputedStyle(d.parentElement).opacity });
        if (!window.__stopFrames) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    for (const label of ['Agents & Models', 'Voice', 'General', 'Autonomy & Budgets', 'General']) {
      await page.getByRole('button', { name: label, exact: true }).click(); await page.waitForTimeout(220);
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(280);
    report.checks.performance = await page.evaluate(() => {
      window.__stopFrames = true; window.__off();
      const a = window.__frames.slice(1).sort((a, b) => a - b);
      return { frames: a.length, p95Ms: a[Math.floor(a.length * .95)], maxMs: a.at(-1), over50Ms: a.filter(n => n > 50).length,
        terminalPackets: window.__packets, dialogSamples: window.__dialogSamples };
    });
    assert(report.checks.performance.terminalPackets > 0);
    assert(report.checks.performance.dialogSamples.some(s => Number(s.opacity) > 0 && Number(s.opacity) < 1));

    for (const [width, height] of [[1280, 800], [1440, 960]]) {
      await size(width, height);
      for (const theme of ['light', 'dark']) {
        if ((await page.locator('html').getAttribute('data-cth-theme') || 'light') !== theme) await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
        await snap(`office-${theme}-${width}x${height}`, 'Controlled counter process is active; no model inference.');
        await page.getByRole('button', { name: 'Settings', exact: true }).click();
        await snap(`settings-${theme}-${width}x${height}`);
        assert(await dialog.evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }));
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
      }
    }
    await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    for (const label of ['General', 'Prerequisites', 'Agents & Models', 'Autonomy & Budgets', 'Connections', 'Voice', 'Memory & Knowledge']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const scroller = dialog.locator('div[style*="padding: 20px 24px"]');
      await scroller.evaluate(e => e.scrollTop = 0);
      const max = await scroller.evaluate(e => e.scrollHeight - e.clientHeight);
      await snap('settings-' + label.toLowerCase().replaceAll(' ', '-'));
      if (max > 100) { await scroller.evaluate(e => e.scrollTop = e.scrollHeight); await snap('settings-' + label.toLowerCase().replaceAll(' ', '-') + '-bottom'); }
    }
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Edit this agent', exact: true }).click(); await snap('agent-edit');
    await page.getByRole('button', { name: 'cancel', exact: true }).click(); await dialog.waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Open the IDE', exact: true }).click();
    await page.getByText('proof.txt', { exact: true }).click();
    await page.getByRole('textbox', { name: 'Editor content', exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Editor content', exact: true }).fill('ZURI_MOTION_UNSAVED_DRAFT');
    await page.evaluate(() => window.__editor = document.querySelector('.cm-editor'));
    await page.getByRole('button', { name: 'changes', exact: true }).click();
    await page.getByRole('button', { name: 'history', exact: true }).click();
    assert(await page.evaluate(() => window.__editor === document.querySelector('.cm-editor')));
    report.checks.editorInstancePreserved = 'PASS';
    await snap('ide-unsaved-draft', 'QA file draft only; not saved to disk.');
    await page.getByRole('button', { name: 'Close IDE (Esc)', exact: true }).click();
    const coordinator = page.getByRole('button', { name: /^ZURI COORDINATOR/ }).first();
    if (await coordinator.count()) {
      await coordinator.click();
      await page.getByRole('button', { name: 'Toggle focus mode', exact: true }).click();
      for (const tab of ['terminal', 'monitor', 'tasks', 'ask me', 'triggers', 'memory', 'graph', 'activity', 'skills', 'workers']) {
        await page.getByRole('button', { name: tab, exact: true }).last().click();
        await snap('command-' + tab.replaceAll(' ', '-'), 'QA coordinator targets a closed loopback endpoint; no successful inference is claimed.');
      }
      await page.keyboard.press('Escape');
    } else report.checks.commandCenterCapture = 'NOT_RUN: coordinator unavailable';
    await close();

    await launch(path.join(dir, 'onboarding-profile'), false);
    await page.getByRole('button', { name: /I.M TECHNICAL/ }).waitFor();
    await snap('onboarding-persona');
    await page.getByRole('button', { name: /I.M TECHNICAL/ }).click();
    await page.getByRole('button', { name: 'next', exact: true }).click(); await snap('onboarding-overview');
    await page.getByRole('button', { name: 'set it up', exact: true }).click();
    await page.getByRole('textbox').fill(path.join(dir, 'example-hive')); await snap('onboarding-workspace');
    await page.getByRole('button', { name: 'next', exact: true }).click();
    await page.locator('input[value=opencode]').check();
    await page.getByLabel('Local base URL', { exact: true }).fill('http://127.0.0.1:11434/v1');
    await page.getByLabel('Local model ID', { exact: true }).fill('qwen3.5:4b'); await snap('onboarding-local-engine', 'Example inputs; Finish is not submitted.');
    await page.getByRole('button', { name: 'next', exact: true }).click(); await snap('onboarding-repositories');
    await page.getByRole('button', { name: 'next', exact: true }).click();
    await page.getByRole('checkbox').first().uncheck(); await snap('onboarding-permissions');
    assert.deepEqual(report.errors, []);
    report.result = 'PASS';
  } catch (error) {
    report.result = 'FAIL'; report.failure = error.stack; console.error(error.message); process.exitCode = 1;
  } finally {
    await close(); report.completedAt = new Date().toISOString(); report.asarSha256 = hash(path.join(path.dirname(executable), 'resources/app.asar'));
    saveReport(); console.log(JSON.stringify({ result: report.result, dir, screenshots: report.screens.length, errors: report.errors }));
  }
})();
