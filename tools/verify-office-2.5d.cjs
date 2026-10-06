'use strict';
// Explicit Electron acceptance capture. Uses only isolated QA profiles and a local
// shell that emits counters; this is not an LLM or production-workflow test.
const { _electron } = require(process.env.ZURI_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const beforeOnly = process.env.ZURI_QA_CAPTURE_MODE === 'before';
const fixturesOnly = process.env.ZURI_QA_CAPTURE_MODE === 'fixtures';
const expectedVersion = process.env.ZURI_QA_EXPECTED_VERSION || '0.2.0';
const dir = path.join(root, 'output/playwright/office-2.5d/after-' + Date.now());
const executable = path.resolve(process.env.ZURI_QA_EXECUTABLE || path.join(root, 'dist/office-0.2.0/win-unpacked/Zuri.exe'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report = { snapshotVersion: '2.0.0', startedAt: new Date().toISOString(), scope: 'Packaged 2.5D UI and labeled 1/16 display fixtures; controlled shell output, no live model acceptance', checks: {}, screens: [], errors: [] };
report.mode = beforeOnly ? '0.1.1 comparison capture only; no 2.5D acceptance' : '2.5D UI verification';
report.expectedVersion = expectedVersion;
report.capturePurpose = process.env.ZURI_QA_PURPOSE || 'Verification capture; release acceptance requires separate visual and artifact review';
report.runnerSha256 = hash(__filename);
report.limitations = [
  'Display fixtures exercise rendering scale and local terminal continuity, not 16 real model sessions.',
  'Seating alignment, artwork quality and occlusion require visual review of screenshots/video; coordinates alone do not prove them.',
  'Live-model working/error transitions are not accepted by the idle roster fixture.',
  'Read-only Pixi observation depends on the packaged React ref shape; missing observations fail explicitly rather than substitute a mock.'
];
report.source = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  workingTreeStatus: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim() };
const workspace = path.join(dir, 'workspace');
fs.mkdirSync(workspace, { recursive: true });
fs.writeFileSync(path.join(workspace, 'proof.txt'), 'ZURI_OFFICE_EDITOR_PROOF\n');
fs.writeFileSync(path.join(workspace, 'stream.cjs'), "let n=0;setInterval(()=>console.log('ZURI_OFFICE_STREAM '+(++n)),200);process.stdin.resume();\n");
let app, page;
const saveReport = () => fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(report, null, 2));
// No production test hook. Seed only the app's existing persisted roster contract
// in a fresh QA profile, then observe the Pixi scene without mutating its objects.
const fixtureCharacters = ['michael', 'jim', 'pam', 'dwight', 'kevin', 'angela', 'oscar', 'stanley', 'phyllis', 'andy', 'kelly', 'ryan', 'toby', 'creed', 'meredith'];
async function sceneSnapshot() {
  return page.evaluate(() => {
    const canvas = [...document.querySelectorAll('canvas')].filter(e => !e.closest('.xterm'))
      .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    if (!canvas) return null;
    let application;
    for (let element = canvas.parentElement; element && !application; element = element.parentElement) {
      const key = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
      for (let fiber = key && element[key]; fiber && !application; fiber = fiber.return) {
        for (let hook = fiber.memoizedState; hook; hook = hook.next) {
          const candidate = hook.memoizedState?.current;
          if (candidate?.stage && candidate?.renderer && candidate?.ticker) { application = candidate; break; }
        }
      }
    }
    if (!application) return null;
    const rect = canvas.getBoundingClientRect();
    const sourceIds = new Set(), textures = [], actors = [], text = [], layers = [];
    const boundsOf = node => {
      const b = node.getBounds();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    };
    const visit = node => {
      const label = node.label || '';
      if (label.startsWith('agent:')) actors.push({ id: label.slice(6), x: node.x, y: node.y, zIndex: node.zIndex,
        visible: node.visible, alpha: node.groupAlpha ?? node.alpha, bounds: boundsOf(node),
        bodyBounds: node.children?.[0] ? boundsOf(node.children[0]) : boundsOf(node),
        bodyTexture: node.children?.[0]?.texture ? { uid: node.children[0].texture.uid,
          sourceUid: node.children[0].texture.source.uid, frameCount: node.children[0].textures?.length,
          width: node.children[0].texture.width, height: node.children[0].texture.height } : null });
      if (label.startsWith('office-2.5d:')) layers.push({ label, x: node.x, y: node.y, zIndex: node.zIndex });
      if (typeof node.text === 'string') text.push(node.text);
      const source = node.texture?.source;
      if (source && !sourceIds.has(source.uid)) {
        sourceIds.add(source.uid);
        textures.push({ width: source.pixelWidth || source.width, height: source.pixelHeight || source.height, scaleMode: source.scaleMode });
      }
      for (const child of node.children || []) visit(child);
    };
    visit(application.stage);
    const world = application.stage.children[0];
    return { canvas: { x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      bufferWidth: canvas.width, bufferHeight: canvas.height, imageRendering: getComputedStyle(canvas).imageRendering },
      world: world && { x: world.x, y: world.y, scaleX: world.scale.x, scaleY: world.scale.y },
      actors, layers, text, textures, estimatedTextureRgbaBytes: textures.reduce((n, t) => n + t.width * t.height * 4, 0),
      memoryNote: 'Currently attached unique texture source dimensions × 4. Excludes unused cached frames, mipmaps, render targets and driver allocations; not measured GPU memory.',
      heap: performance.memory ? { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize } : null,
      tickerStarted: application.ticker.started };
  });
}
async function waitForScene(count) {
  const until = Date.now() + 30000;
  let lastScene;
  while (Date.now() < until) {
    const scene = await sceneSnapshot();
    lastScene = scene;
    if (scene && (beforeOnly ? scene.text.filter(t => /^Fixture \d+$/.test(t)).length === count
      : scene.actors.length === count && scene.actors.every(a => a.alpha > 0.9))) return scene;
    await page.waitForTimeout(150);
  }
  report.lastSceneOnTimeout = lastScene;
  throw new Error(`Expected ${count} labeled displayed actors in initialized Pixi scene`);
}
async function benchmarkDisplayFixture(count) {
  console.log('DISPLAY FIXTURE', count, beforeOnly ? 'before comparison' : '2.5D timings and interaction');
  const started = Date.now();
  await launch(path.join(dir, `fixture-${count}-profile`), true, true);
  // firstWindow() can resolve before React mounts. Let the initial App consume
  // its normal startup state before seeding the one-use reload flag.
  await page.getByRole('button', { name: 'open existing config…', exact: true }).waitFor();
  const firstWindowMs = Date.now() - started;
  const ptyId = `pty-office-fixture-${count}`;
  const spawned = await page.evaluate(opts => window.cth.spawnPty(opts), {
    id: ptyId, cwd: workspace, command: process.execPath, args: [path.join(workspace, 'stream.cjs')], provider: 'custom', cols: 100, rows: 25
  });
  assert.equal(spawned.ok, true, 'Actual controlled counter PTY must start');
  const agents = Array.from({ length: count }, (_, i) => ({
    id: `office-fixture-${i + 1}`, name: `Fixture ${String(i + 1).padStart(2, '0')}`,
    character: fixtureCharacters[i % fixtureCharacters.length], accent: 'sky',
    description: i === 0 ? 'QA FIXTURE: actual local counter PTY, no model'
      : count === 16 && i === 15 ? 'QA FIXTURE: display-only coordinator role for reserved desk, no process or model'
        : 'QA FIXTURE: display only, no process or model',
    project: 'Controlled office display fixture', tmuxTarget: '', cwd: workspace, command: process.execPath,
    provider: 'custom', status: 'idle', action: 'QA display fixture', progress: 0,
    ...(count === 16 && i === 15 ? { isGod: true } : {}),
    ...(i === 0 ? { ptyId } : {})
  }));
  await page.evaluate(agents => {
    localStorage.setItem('cth.agents', JSON.stringify(agents));
    localStorage.setItem('cth.selectedId', agents[0].id);
    localStorage.setItem('cth.skipHivePickerOnce', 'true');
    localStorage.setItem('cth.prefersFocusMode', 'false');
  }, agents);
  const reloadStarted = Date.now();
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).waitFor();
  const initial = await waitForScene(count);
  const readyMs = Date.now() - reloadStarted;
  if (beforeOnly) {
    await page.waitForTimeout(8000);
    report.checks.beforeFixture = { count, firstWindowMs, fixtureReloadToSceneReadyMs: readyMs,
      scope: 'Identical controlled display fixture on prior package. No new-renderer assertions apply.', scene: await sceneSnapshot() };
    for (const [width, height] of [[1280, 800], [1440, 960]]) {
      await size(width, height);
      await snap(`before-fixture-${count}-${width}x${height}`, 'Prior package comparison; 1 counter PTY and remaining display-only agents.');
    }
    await close();
    return;
  }
  assert.equal(initial.canvas.imageRendering, 'auto');
  assert(initial.layers.some(l => l.label === 'office-2.5d:floor'), 'Expected new floor asset, not the old scene');
  assert.equal(initial.actors.length, count);
  const result = { count, scope: `${count} displayed fixture agents; 1 actual counter PTY; ${count - 1} display-only; no LLM`,
    rosterRoles: count === 16 ? '15 workers + 1 display-only coordinator, matching the reserved coordinator desk' : '1 worker',
    firstWindowMs, fixtureReloadToSceneReadyMs: readyMs, initial,
    processMemory: await app.evaluate(({ app }) => app.getAppMetrics().map(p => ({ type: p.type, memory: p.memory }))),
    memoryUnits: 'Electron getAppMetrics memory fields are KiB', positions: [] };
  report.checks.displayFixtures ??= [];
  report.checks.displayFixtures.push(result);
  await snap(`fixture-${count}-entrance`, result.scope);
  await page.locator('.xterm').waitFor();
  await page.evaluate(id => {
    window.__officeFrames = []; window.__officePackets = 0; window.__officeSampling = true;
    window.__officeOff = window.cth.onPtyData(id, data => { if (data.includes('ZURI_OFFICE_STREAM')) window.__officePackets++; });
    let last;
    const tick = t => { if (last !== undefined) window.__officeFrames.push(t - last); last = t; if (window.__officeSampling) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, ptyId);
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(1000);
    result.positions.push((await sceneSnapshot()).actors.map(a => ({ id: a.id, x: a.x, y: a.y, zIndex: a.zIndex })));
  }
  result.timing = await page.evaluate(() => {
    window.__officeSampling = false; window.__officeOff();
    const frames = window.__officeFrames.slice().sort((a, b) => a - b);
    return { samples: frames.length, p50Ms: frames[Math.floor(frames.length * .5)], p95Ms: frames[Math.floor(frames.length * .95)],
      maxMs: frames.at(-1), over50Ms: frames.filter(n => n > 50).length, terminalPackets: window.__officePackets,
      note: 'Renderer requestAnimationFrame cadence while office and real counter terminal are mounted. Video capture is active; no universal FPS pass threshold.' };
  });
  assert(result.timing.samples > 20);
  assert(result.timing.terminalPackets > 0, 'Counter output must continue during scene measurement');
  result.movementObserved = initial.actors.some(a => result.positions.some(frame => frame.some(b => b.id === a.id && Math.hypot(b.x - a.x, b.y - a.y) > 3)));
  assert(result.movementObserved, 'At least one fixture actor should navigate after entering');
  await snap(`fixture-${count}-after-navigation`, result.scope);
  result.pointerSelectionPhase = 'Controlled seated phase: stationary projected body, exact selection assertion';
  result.statusCards = await page.getByRole('button', { name: /^FIXTURE / }).allTextContents();
  assert.equal(result.statusCards.length, count);
  result.statusScope = 'Restored fixtures are idle by the persistence contract. This does not validate working/error/live-model status transitions.';
  result.manualZoomPan = 'N/A: absent in baseline; preserved automatic fit-to-window and selected-agent nudge';
  for (const [width, height] of [[1280, 800], [1440, 960]]) {
    await size(width, height); await page.waitForTimeout(500);
    for (const theme of ['light', 'dark']) {
      if ((await page.locator('html').getAttribute('data-cth-theme') || 'light') !== theme) await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
      await snap(`fixture-${count}-${theme}-${width}x${height}`, result.scope);
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await snap(`fixture-${count}-reduced-motion`, 'Reduced-motion media is active; screenshot is not proof of animation suppression.');
  result.reducedMotionRequested = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  assert(result.reducedMotionRequested);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  result.final = await sceneSnapshot();
  await captureSeatingFixture(agents, result);
  saveReport();
  await close();
}
async function assertSeatedPointerSelection(count, result) {
  const scene = await sceneSnapshot();
  const selectedBefore = await page.evaluate(() => localStorage.getItem('cth.selectedId'));
  const candidates = scene.actors.filter(a => count === 1 || a.id !== selectedBefore).sort((a, b) => b.zIndex - a.zIndex);
  let target, point;
  for (const actor of candidates) {
    const b = actor.bodyBounds;
    const p = { x: b.x + b.width / 2, y: b.y + b.height * .45 };
    const obscured = scene.actors.some(other => other.id !== actor.id && other.zIndex > actor.zIndex
      && p.x >= other.bodyBounds.x && p.x <= other.bodyBounds.x + other.bodyBounds.width
      && p.y >= other.bodyBounds.y && p.y <= other.bodyBounds.y + other.bodyBounds.height);
    if (!obscured && p.x > 0 && p.x < scene.canvas.width && p.y > 0 && p.y < scene.canvas.height) { target = actor; point = p; break; }
  }
  assert(target, 'A stationary actor body must have an unobscured on-canvas click point');
  const click = { x: scene.canvas.x + point.x, y: scene.canvas.y + point.y };
  const evidence = { before: scene, selectedBefore, targetId: target.id, click };
  result.seatedPointerSelection = evidence;
  await page.mouse.click(click.x, click.y);
  await page.waitForTimeout(500);
  evidence.selectedAfter = await page.evaluate(() => localStorage.getItem('cth.selectedId'));
  evidence.after = await sceneSnapshot();
  assert.equal(evidence.selectedAfter, target.id, 'Actual pointer click on stationary projected body must select expected agent');
  if (count > 1) assert.notEqual(evidence.selectedAfter, selectedBefore, 'Multi-agent click must change selection');
  evidence.result = 'PASS';
}
async function sendFixtureEvents(ids, event) {
  await app.evaluate(({ BrowserWindow }, { ids, event }) => {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window || window.webContents.isDestroyed()) throw new Error('Fixture renderer is unavailable');
    for (const agentId of ids) window.webContents.send('hive:hookEvent', {
      agentId, event, ...(event === 'PreToolUse' ? { tool: 'Edit' } : {}), source: 'qa-controlled-seating-fixture'
    });
  }, { ids, event });
}
async function captureSeatingFixture(agents, result) {
  console.log('CONTROLLED STATUS FIXTURE', agents.length, 'synthetic IPC; not model work');
  const ids = agents.map(a => a.id);
  const phase = { label: 'CONTROLLED STATUS FIXTURE — not model work',
    method: 'Synthetic PreToolUse/Edit on existing hive:hookEvent IPC in isolated QA app; no production test API.',
    scope: 'Renderer event response, actual navigation, desk anchors and seated art only. Not provider execution or hook ingestion acceptance.',
    count: agents.length, result: 'RUNNING', before: await sceneSnapshot() };
  result.controlledSeating = phase;
  await page.evaluate(count => {
    const marker = document.createElement('div'); marker.id = 'qa-controlled-status-label';
    marker.textContent = `CONTROLLED STATUS FIXTURE · ${count} display agents · not model work`;
    marker.style.cssText = 'position:fixed;z-index:99999;left:24px;top:50px;padding:8px 12px;background:#fff1bf;color:#513a05;border:1px solid #a5770b;border-radius:6px;font:600 13px/18px sans-serif;pointer-events:none';
    document.body.appendChild(marker);
  }, agents.length);
  try {
    await sendFixtureEvents(ids, 'PreToolUse');
    await snap(`fixture-${agents.length}-synthetic-working-entry`, phase.label);
    const until = Date.now() + 45000;
    let settled = 0;
    while (Date.now() < until) {
      const scene = await sceneSnapshot();
      const desks = scene.layers.filter(l => l.label === 'office-2.5d:desk');
      const matches = scene.actors.map(actor => {
        const ranked = desks.map((desk, index) => ({ index, distance: Math.hypot(actor.x - desk.x, actor.y - desk.y) })).sort((a, b) => a.distance - b.distance);
        return { id: actor.id, ...ranked[0], bodyTexture: actor.bodyTexture };
      });
      const cards = await page.getByRole('button', { name: /^FIXTURE / }).allTextContents();
      phase.lastObservation = { scene, matches, cards };
      // Eight scene pixels allow the visual chair-anchor offset while remaining
      // much smaller than the separation between distinct desk seats.
      if (matches.length === agents.length && matches.every(m => m.distance <= 8 && m.bodyTexture?.frameCount === 1)
        && new Set(matches.map(m => m.index)).size === agents.length
        && cards.length === agents.length && cards.every(t => /working/i.test(t))) settled++;
      else settled = 0;
      if (settled >= 3) break;
      await page.waitForTimeout(500);
    }
    assert(settled >= 3, 'Controlled working events must produce distinct desk anchors, seated texture frames and working status cards');
    phase.anchorToleranceScenePx = 8;
    phase.seated = phase.lastObservation;
    delete phase.lastObservation;
    await snap(`fixture-${agents.length}-synthetic-seated`, phase.label + '; visual alignment still requires review.');
    const detailActor = phase.seated.scene.actors.find(a => a.id === agents[0].id);
    const detailCanvas = phase.seated.scene.canvas;
    const footX = detailCanvas.x + detailActor.bodyBounds.x + detailActor.bodyBounds.width / 2;
    const footY = detailCanvas.y + detailActor.bodyBounds.y + detailActor.bodyBounds.height;
    await snap(`fixture-${agents.length}-synthetic-seated-detail`, phase.label + '; direct live UI screenshot clip, no pixel editing.',
      { x: Math.max(0, Math.floor(footX - 110)), y: Math.max(0, Math.floor(footY - 115)), width: 220, height: 165 });
    await assertSeatedPointerSelection(agents.length, result);
    phase.result = 'PASS';
  } catch (error) {
    phase.result = 'FAIL'; phase.error = error.message;
    await snap(`fixture-${agents.length}-synthetic-seating-failure`, phase.label + '; failed observation.').catch(() => {});
    throw error;
  } finally {
    await sendFixtureEvents(ids, 'Stop');
    const until = Date.now() + 5000;
    do {
      const cards = await page.getByRole('button', { name: /^FIXTURE / }).allTextContents();
      if (cards.length === agents.length && cards.every(t => /idle/i.test(t))) { phase.restoredIdle = true; break; }
      await page.waitForTimeout(100);
    } while (Date.now() < until);
    await page.evaluate(() => document.getElementById('qa-controlled-status-label')?.remove());
    saveReport();
    assert.equal(phase.restoredIdle, true, 'Synthetic Stop must restore fixture statuses to idle');
  }
}
async function launch(profile, configured, displayFixture = false) {
  const asarSha256 = hash(path.join(path.dirname(executable), 'resources/app.asar'));
  if (report.asarSha256) assert.equal(asarSha256, report.asarSha256, 'Packaged artifact must remain unchanged between capture phases');
  else report.asarSha256 = asarSha256;
  fs.mkdirSync(path.join(profile, 'temp'), { recursive: true });
  if (configured) fs.writeFileSync(path.join(profile, 'config.json'), JSON.stringify({
    onboardingComplete: true, harnessHome: displayFixture ? null : path.join(dir, 'hive'), registeredRepos: [workspace],
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
  assert.equal(report.runtime.version, expectedVersion);
}
async function size(width, height) {
  await app.evaluate(({ BrowserWindow }, d) => BrowserWindow.getAllWindows()[0].setContentSize(d.width, d.height), { width, height });
}
async function snap(name, note = '', clip) {
  console.log('SCREENSHOT', name);
  await page.waitForTimeout(280);
  const file = `${String(report.screens.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(dir, file), ...(clip ? { clip } : {}) });
  const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  report.screens.push({ file, name, note, ...dimensions, ...(clip ? { width: clip.width, height: clip.height, viewport: dimensions, clip } : {}),
    at: new Date().toISOString(), sha256: hash(path.join(dir, file)) });
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
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Office QA');
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
  await page.getByRole('button', { name: /^OFFICE QA/ }).first().click();
  await page.locator('.xterm').waitFor();
}
(async () => {
  console.log('CAPTURE', dir);
  try {
    if (beforeOnly) {
      await benchmarkDisplayFixture(16);
      assert.deepEqual(report.errors, []);
      report.result = 'PASS';
      return;
    }
    for (const count of [1, 16]) await benchmarkDisplayFixture(count);
    if (fixturesOnly) {
      assert.deepEqual(report.errors, []);
      report.result = 'PASS';
      return;
    }
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

    const card = page.getByRole('button', { name: /^OFFICE QA/ }).first();
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
      const p = (await window.cth.listPtys()).find(p => p.id.startsWith('pty-office-qa-'));
      if (!p) throw new Error('Controlled stream PTY is not running');
      window.__packets = 0; window.__frames = []; window.__dialogSamples = []; window.__stopFrames = false;
      window.__off = window.cth.onPtyData(p.id, data => { if (data.includes('ZURI_OFFICE_STREAM')) window.__packets++; });
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
    await page.getByRole('textbox', { name: 'Editor content', exact: true }).fill('ZURI_OFFICE_UNSAVED_DRAFT');
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
    if (page && !page.isClosed()) {
      report.failureScene = await sceneSnapshot().catch(() => null);
      await snap('failure-state', 'Failure diagnostic; not acceptance evidence.').catch(() => {});
      const aria = await page.locator('body').ariaSnapshot().catch(e => `Snapshot unavailable: ${e.message}`);
      fs.writeFileSync(path.join(dir, 'failure-aria.txt'), aria);
      report.failureState = await page.evaluate(() => ({ url: location.href,
        skipFlag: localStorage.getItem('cth.skipHivePickerOnce'),
        rosterCount: JSON.parse(localStorage.getItem('cth.agents') || '[]').length,
        selectedId: localStorage.getItem('cth.selectedId') })).catch(() => null);
    }
  } finally {
    await close(); report.completedAt = new Date().toISOString();
    report.asarSha256AtCompletion = hash(path.join(path.dirname(executable), 'resources/app.asar'));
    if (report.asarSha256 && report.asarSha256 !== report.asarSha256AtCompletion) {
      report.result = 'FAIL'; report.errors.push('Packaged ASAR changed during capture'); process.exitCode = 1;
    }
    report.videos = fs.existsSync(path.join(dir, 'video')) ? fs.readdirSync(path.join(dir, 'video')).filter(f => f.endsWith('.webm')).map(file => ({ file: 'video/' + file, sha256: hash(path.join(dir, 'video', file)) })) : [];
    saveReport(); console.log(JSON.stringify({ result: report.result, dir, screenshots: report.screens.length, errors: report.errors }));
  }
})();
