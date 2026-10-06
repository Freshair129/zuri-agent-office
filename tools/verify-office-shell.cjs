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
const expectedVersion = process.env.ZURI_QA_EXPECTED_VERSION || '0.4.0';
const dir = path.join(root, 'output/playwright/office-shell/after-' + Date.now());
const executable = path.resolve(process.env.ZURI_QA_EXECUTABLE || path.join(root, 'dist/shell-0.4.0/win-unpacked/Zuri.exe'));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report = { snapshotVersion: '4.0.0', startedAt: new Date().toISOString(), scope: 'Packaged office shell navigation, stable canvas/terminal/draft state, reference office and controlled 1/16/17 display fixtures; no live model acceptance', checks: {}, screens: [], errors: [] };
report.mode = beforeOnly ? 'Prior-package comparison only; no reference-fidelity acceptance' : 'Reference-fidelity UI verification';
report.expectedVersion = expectedVersion;
report.capturePurpose = process.env.ZURI_QA_PURPOSE || 'Verification capture; release acceptance requires separate visual and artifact review';
report.runnerSha256 = hash(__filename);
const referencePath = path.join(root, 'docs/design/zuri-2.5d-concept-01.png');
report.reference = { file: path.relative(root, referencePath), sha256: hash(referencePath) };
const shellReferencePath = path.join(root, 'docs/design/zuri-office-shell-reference.png');
report.shellReference = { file: path.relative(root, shellReferencePath), sha256: hash(shellReferencePath) };
report.shellReview = { result: 'NOT_REVIEWED', required: [
  'Collapsible functional navigation', 'Persistent unclipped office canvas', 'Readable compact roster',
  'Closable drawer and constrained-width overlay', 'Light/dark desktop hierarchy matching the supplied shell'
], note: 'Requires explicit review of original screenshots; mechanical state checks do not establish visual acceptance.' };
report.referenceFidelityReview = { result: 'NOT_REVIEWED', required: [
  'Elevated frontal camera', 'Enclosing walls and front entrance', 'Rear glass meeting room',
  'Four four-seat workstation pods', 'Rear-left kitchenette', 'Left lounge',
  'Coherent materials and lighting', 'Dynamic actors and both seating sides',
  'A naturally assigned overflow actor remains visible inside the glass meeting room'
], note: 'Mechanical PASS cannot accept or override these composition criteria.' };
report.limitations = [
  'Display fixtures exercise rendering scale and local terminal continuity, not 16 real model sessions.',
  'Seating alignment, artwork quality and occlusion require visual review of screenshots/video; coordinates alone do not prove them.',
  'Live-model working/error transitions are not accepted by the idle roster fixture.',
  'Read-only Pixi observation depends on the packaged React ref shape; missing observations fail explicitly rather than substitute a mock.'
];
report.source = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  workingTreeStatus: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
  note: 'Checkout evidence at capture time. Executed binary bytes are identified by ASAR hash; this does not infer a packaged source revision from a dirty checkout.' };
const workspace = path.join(dir, 'workspace');
fs.mkdirSync(workspace, { recursive: true });
fs.copyFileSync(__filename, path.join(dir, 'executed-runner.cjs'));
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
    const sourceIds = new Set(), textures = [], actors = [], text = [], layers = [], thoughts = [];
    const boundsOf = node => {
      const b = node.getBounds();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    };
    const visit = node => {
      const label = node.label || '';
      if (label.startsWith('thought:')) {
        const thoughtText = [];
        const collect = child => { if (typeof child.text === 'string') thoughtText.push(child.text); for (const next of child.children || []) collect(next); };
        collect(node);
        thoughts.push({ id: label.slice(8), visible: node.visible && node.renderable, renderable: node.renderable,
          text: thoughtText.join(' '), alpha: node.groupAlpha ?? node.alpha, bounds: boundsOf(node) });
      }
      if (label.startsWith('agent:')) actors.push({ id: label.slice(6), x: node.x, y: node.y, zIndex: node.zIndex,
        globalFoot: { x: node.getGlobalPosition().x, y: node.getGlobalPosition().y },
        visible: node.visible, alpha: node.groupAlpha ?? node.alpha, bounds: boundsOf(node),
        bodyBounds: node.children?.[0] ? boundsOf(node.children[0]) : boundsOf(node),
        animationPlaying: node.children?.[0]?.playing ?? null, currentFrame: node.children?.[0]?.currentFrame ?? null,
        bodyTexture: node.children?.[0]?.texture ? { uid: node.children[0].texture.uid,
          sourceUid: node.children[0].texture.source.uid, frameCount: node.children[0].textures?.length,
          width: node.children[0].texture.width, height: node.children[0].texture.height } : null });
      if (label.startsWith('office-reference:') || label.startsWith('office-2.5d:')) layers.push({ label,
        x: node.x, y: node.y, zIndex: node.zIndex,
        globalFoot: { x: node.getGlobalPosition().x, y: node.getGlobalPosition().y }, bounds: boundsOf(node) });
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
      actors, layers, thoughts, text, textures, estimatedTextureRgbaBytes: textures.reduce((n, t) => n + t.width * t.height * 4, 0),
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
    if (scene && (beforeOnly ? (scene.actors.length === count || scene.text.filter(t => /^Fixture \d+$/.test(t)).length === count)
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
    id: `office-fixture-${i + 1}`, name: `Fixture ${String(i + 1).padStart(2, '0')}${!beforeOnly && i === 14 ? ' — Release coordination and infrastructure diagnostics' : ''}`,
    character: fixtureCharacters[i % fixtureCharacters.length], accent: 'sky',
    description: i === 0 ? 'QA FIXTURE: actual local counter PTY, no model'
      : count >= 16 && i === 15 ? 'QA FIXTURE: display-only coordinator role for reserved desk, no process or model'
        : 'QA FIXTURE: display only, no process or model',
    project: 'Controlled office display fixture', tmuxTarget: '', cwd: workspace, command: process.execPath,
    provider: 'custom', status: 'idle', action: 'QA display fixture', progress: 0,
    ...(count >= 16 && i === 15 ? { isGod: true } : {}),
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
    const sceneFile = await snap('before-actual-scene', 'Prior package original canvas; controlled display fixture.', await sceneClip());
    await captureReferenceComparison(sceneFile, 'before');
    if (expectedVersion === '0.2.0') report.referenceFidelityReview.result = 'REJECTED_BY_USER';
    await close();
    return;
  }
  assert.equal(initial.canvas.imageRendering, 'auto');
  assert(initial.layers.some(l => l.label === 'office-reference:room'), 'Expected reference-derived room, not the rejected diamond scene');
  assert.equal(initial.layers.filter(l => l.label.startsWith('office-reference:seat:')).length, 16, 'Expected all sixteen semantic seat anchors');
  assert.equal(new Set(initial.layers.filter(l => l.label.startsWith('office-reference:pod:')).map(l => l.label)).size, 4, 'Expected four pod groups');
  for (const side of ['front', 'back']) assert.equal(initial.layers.filter(l => l.label.startsWith('office-reference:seat:') && l.label.endsWith(':' + side)).length, 8, `Expected eight ${side} seat anchors`);
  assert.equal(initial.actors.length, count);
  const result = { count, scope: `${count} displayed fixture agents; 1 actual counter PTY; ${count - 1} display-only; no LLM`,
    rosterRoles: count >= 16 ? `${count - 1} workers + 1 display-only coordinator; sixteen primary seats, then normal boardroom overflow` : '1 worker',
    firstWindowMs, fixtureReloadToSceneReadyMs: readyMs, initial,
    processMemory: await app.evaluate(({ app }) => app.getAppMetrics().map(p => ({ type: p.type, memory: p.memory }))),
    memoryUnits: 'Electron getAppMetrics memory fields are KiB', positions: [] };
  report.checks.displayFixtures ??= [];
  report.checks.displayFixtures.push(result);
  if (count === 17) {
    result.scope += '; bounded meeting-glass visibility phase, no repeated timing or principal-page suite';
    await captureSeatingFixture(agents, result);
    saveReport();
    await close();
    return;
  }
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
  result.statusCards = await page.getByRole('button', { name: /^FIXTURE /, includeHidden: true }).allTextContents();
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
  result.reducedMotionScene = await sceneSnapshot();
  assert(result.reducedMotionScene.actors.every(a => a.animationPlaying === false), 'Reduced motion must stop existing actor texture animation');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  result.final = await sceneSnapshot();
  await captureSeatingFixture(agents, result);
  await captureShellFixture(agents, result);
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
    let settled = 0, previousOverflow;
    while (Date.now() < until) {
      const scene = await sceneSnapshot();
      const seats = scene.layers.filter(l => l.label.startsWith('office-reference:seat:'));
      const matches = scene.actors.map(actor => {
        const ranked = seats.map((seat, index) => ({ index, seatId: seat.label.split(':')[2], side: seat.label.split(':')[3],
          distance: Math.hypot(actor.globalFoot.x - seat.globalFoot.x, actor.globalFoot.y - seat.globalFoot.y) })).sort((a, b) => a.distance - b.distance);
        return { id: actor.id, ...ranked[0], bodyTexture: actor.bodyTexture };
      });
      const cards = await page.getByRole('button', { name: /^FIXTURE /, includeHidden: true }).allTextContents();
      phase.lastObservation = { scene, matches, cards };
      const primaryMatches = agents.length === 17 ? matches.filter(m => m.id !== ids[16]) : matches;
      let overflowReady = true;
      if (agents.length === 17) {
        const actor = scene.actors.find(a => a.id === ids[16]);
        // Reference-space meeting floor bounded by the rear inset and glass
        // perimeter from sceneLayout.ts. This observes normal claimSeat output;
        // it never changes a position, seat, path, renderer object or app state.
        const polygon = [[684,154],[1138,185],[1135,290],[690,257]];
        let inside = false;
        if (actor) for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
          if ((yi > actor.y) !== (yj > actor.y) && actor.x < (xj - xi) * (actor.y - yi) / (yj - yi) + xi) inside = !inside;
        }
        const glass = scene.layers.find(l => l.label === 'office-reference:glass');
        const tint = scene.layers.find(l => l.label === 'office-reference:glass-tint');
        const meetingSeat = actor && scene.layers.filter(l => l.label.startsWith('office-reference:meeting-seat:'))
          .map(seat => ({ label: seat.label, distance: Math.hypot(actor.globalFoot.x - seat.globalFoot.x, actor.globalFoot.y - seat.globalFoot.y) }))
          .sort((a, b) => a.distance - b.distance)[0];
        const stable = actor && previousOverflow && Math.hypot(actor.x - previousOverflow.x, actor.y - previousOverflow.y) < .1;
        overflowReady = Boolean(actor && inside && stable && actor.visible && actor.alpha > .9
          && actor.bodyTexture?.frameCount === 1 && meetingSeat?.distance <= 1 && glass && tint && actor.zIndex < glass.zIndex);
        phase.lastObservation.meeting = { actor, insideMeetingFloor: inside, stable, polygon, meetingSeat, glass, tint,
          note: 'Geometric presence and foreground ordering only; live crop/video must separately prove visibility through glass.' };
        previousOverflow = actor;
      }
      // Compare actual global foot coordinates so perspective and camera scale
      // do not depend on the retired isometric coordinate convention.
      if (matches.length === agents.length && primaryMatches.every(m => m.distance <= 1 && m.bodyTexture?.frameCount === 1)
        && new Set(primaryMatches.map(m => m.index)).size === Math.min(16, agents.length) && overflowReady
        && cards.length === agents.length && cards.every(t => /working/i.test(t))) settled++;
      else settled = 0;
      if (settled >= 3) break;
      await page.waitForTimeout(500);
    }
    assert(settled >= 3, 'Controlled working events must produce distinct primary seats, working cards and, for agent 17, stable visible boardroom overflow');
    phase.anchorToleranceCanvasPx = 1;
    phase.seated = phase.lastObservation;
    delete phase.lastObservation;
    await snap(`fixture-${agents.length}-synthetic-seated`, phase.label + '; visual alignment still requires review.');
    if (agents.length === 17) {
      const { scene, meeting } = phase.seated;
      const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      const room = scene.layers.find(l => l.label === 'office-reference:room').bounds;
      const b = { x: room.x + room.width * 620 / 1536, y: room.y + room.height * 15 / 1024,
        width: room.width * 555 / 1536, height: room.height * 310 / 1024 };
      const x = Math.max(0, Math.floor(scene.canvas.x + b.x - 20));
      const y = Math.max(0, Math.floor(scene.canvas.y + b.y - 20));
      const clip = { x, y, width: Math.min(viewport.width - x, Math.ceil(b.width + 40)),
        height: Math.min(viewport.height - y, Math.ceil(b.height + 40)) };
      phase.meetingDetail = await snap('fixture-17-meeting-glass-detail', phase.label + '; actual overflow actor behind glass; direct live UI clip, visual gate NOT_REVIEWED.', clip);
      phase.visualReview = 'NOT_REVIEWED';
      phase.result = 'PASS';
      return;
    }
    const seatedSides = new Set(phase.seated.matches.map(m => m.side));
    if (agents.length === 16) assert(seatedSides.has('front') && seatedSides.has('back'), 'Full occupancy must exercise both sides of the pods');
    phase.details = [];
    for (const side of ['front', 'back']) {
      const match = phase.seated.matches.find(m => m.side === side);
      if (!match) continue;
      const actor = phase.seated.scene.actors.find(a => a.id === match.id);
      const canvas = phase.seated.scene.canvas;
      const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      const width = 260, height = 210;
      const clip = { x: Math.max(0, Math.min(viewport.width - width, Math.floor(canvas.x + actor.globalFoot.x - width / 2))),
        y: Math.max(0, Math.min(viewport.height - height, Math.floor(canvas.y + actor.globalFoot.y - 150))), width, height };
      const file = await snap(`fixture-${agents.length}-synthetic-seated-${side}-detail`, phase.label + `; ${side} side; direct live UI clip.`, clip);
      phase.details.push({ side, actorId: actor.id, seatId: match.seatId, file });
    }
    let sceneFile;
    await page.evaluate(() => { document.getElementById('qa-controlled-status-label').style.visibility = 'hidden'; });
    try {
      sceneFile = await snap(`fixture-${agents.length}-actual-scene`, phase.label + '; original complete canvas, temporary QA label hidden; no app content changed.', await sceneClip());
    } finally {
      await page.evaluate(() => { document.getElementById('qa-controlled-status-label').style.visibility = 'visible'; });
    }
    await captureReferenceComparison(sceneFile, `fixture-${agents.length}`);
    await assertSeatedPointerSelection(agents.length, result);
    await verifyThoughtVisibility(agents, phase);
    phase.result = 'PASS';
  } catch (error) {
    phase.result = 'FAIL'; phase.error = error.message;
    await snap(`fixture-${agents.length}-synthetic-seating-failure`, phase.label + '; failed observation.').catch(() => {});
    throw error;
  } finally {
    await sendFixtureEvents(ids, 'Stop');
    const until = Date.now() + 5000;
    do {
      const cards = await page.getByRole('button', { name: /^FIXTURE /, includeHidden: true }).allTextContents();
      if (cards.length === agents.length && cards.every(t => /idle/i.test(t))) { phase.restoredIdle = true; break; }
      await page.waitForTimeout(100);
    } while (Date.now() < until);
    await page.evaluate(() => document.getElementById('qa-controlled-status-label')?.remove());
    saveReport();
    assert.equal(phase.restoredIdle, true, 'Synthetic Stop must restore fixture statuses to idle');
  }
}
async function showRoster(show) {
  const name = show ? 'Show agent roster' : 'Hide agent roster';
  const control = page.getByRole('button', { name, exact: true });
  if (await control.isVisible()) await control.click();
  await page.getByRole('region', { name: 'Agent roster', exact: true }).waitFor({ state: show ? 'visible' : 'hidden' });
}
async function selectFixture(agent) {
  await showRoster(true);
  await page.getByRole('region', { name: 'Agent roster', exact: true })
    .getByRole('button', { name: new RegExp('^' + agent.name.toUpperCase() + '\\b') }).click();
  await page.getByRole('complementary', { name: 'Agent drawer', exact: true }).waitFor();
  await showRoster(false);
}
async function verifyThoughtVisibility(agents, phase) {
  await selectFixture(agents[0]);
  await page.waitForTimeout(500);
  const selected = await sceneSnapshot();
  assert.equal(selected.thoughts.length, agents.length, 'Observe an owned thought container for every actor');
  assert(selected.thoughts.some(t => t.id === agents[0].id && t.visible && t.alpha > .5), 'Selection must reveal existing working thought without a new provider event');
  assert.match(selected.thoughts.find(t => t.id === agents[0].id).text, /Edit/, 'Selection must immediately reveal current thought text');
  assert(selected.thoughts.filter(t => t.id !== agents[0].id).every(t => !t.visible || t.alpha < .01), 'Unselected routine thoughts must be hidden');
  phase.thoughtPolicy = { selected, result: 'PASS', scope: 'Controlled existing status events and real selection; not model execution' };
  const coordinator = agents.find(a => a.isGod);
  if (coordinator) {
    await app.evaluate(({ BrowserWindow }, id) => BrowserWindow.getAllWindows()[0].webContents.send('hive:hookEvent', {
      agentId: id, event: 'Notification', message: 'QA controlled fixture: permission required', source: 'qa-thought-policy-fixture'
    }), coordinator.id);
    await page.waitForTimeout(700);
    const critical = await sceneSnapshot();
    assert(critical.thoughts.some(t => t.id === coordinator.id && t.visible && t.alpha > .5), 'Nonselected blocked coordinator thought must remain visible');
    const cards = await page.getByRole('button', { name: /^FIXTURE /, includeHidden: true }).allTextContents();
    phase.thoughtPolicy.critical = critical;
    phase.thoughtPolicy.criticalCards = cards;
    assert(cards.some(t => t.toUpperCase().includes(coordinator.name.toUpperCase()) && /needs you/i.test(t)),
      'Existing blocked event must produce the actual English needs-you status label');
    await snap(`fixture-${agents.length}-selected-and-critical-thoughts`, 'Controlled permission notification; not a real provider approval request.');
  }
}
async function captureShellFixture(agents, result) {
  console.log('SHELL CONTINUITY FIXTURE', agents.length);
  const selected = agents[0], ptyId = selected.ptyId;
  await selectFixture(selected);
  const drawer = page.getByRole('complementary', { name: 'Agent drawer', exact: true, includeHidden: true });
  const navigation = page.getByRole('navigation', { name: 'Office navigation', exact: true });
  const composer = drawer.locator('textarea').last();
  const draft = `QA_UNSENT_DRAFT_${agents.length}`;
  await composer.fill(draft);
  const proof = path.join(workspace, 'proof.txt');
  // One-shot controlled native-picker input, explicitly not OS-dialog testing.
  // The real Files button and existing attachFiles IPC still process the file.
  await app.evaluate(({ dialog }, file) => {
    const original = dialog.showOpenDialog;
    dialog.showOpenDialog = async () => { dialog.showOpenDialog = original; return { canceled: false, filePaths: [file] }; };
  }, proof);
  await drawer.getByRole('button', { name: 'files', exact: true }).click();
  await drawer.getByText('proof.txt', { exact: true }).waitFor();
  await page.evaluate(id => {
    window.__shellCanvas = [...document.querySelectorAll('canvas')].filter(e => !e.closest('.xterm'))
      .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    window.__shellTerminal = document.querySelector('.xterm');
    window.__shellPackets = 0;
    window.__shellOff = window.cth.onPtyData(id, data => { if (data.includes('ZURI_OFFICE_STREAM')) window.__shellPackets++; });
  }, ptyId);
  const shell = { result: 'RUNNING', widths: [], scope: 'Actual UI actions; unsent draft and real local attachment, one-shot controlled native picker result; no model request' };
  result.shell = shell;
  const assertInstances = async () => {
    const evidence = await page.evaluate(() => ({ canvasConnected: window.__shellCanvas.isConnected,
      canvasSame: [...document.querySelectorAll('canvas')].includes(window.__shellCanvas),
      terminalConnected: window.__shellTerminal.isConnected,
      terminalSame: document.querySelector('.xterm') === window.__shellTerminal,
      selectedId: localStorage.getItem('cth.selectedId'), packets: window.__shellPackets }));
    assert(evidence.canvasConnected && evidence.canvasSame && evidence.terminalConnected && evidence.terminalSame,
      'Layout changes must preserve the real canvas and terminal DOM instances');
    assert.equal(evidence.selectedId, selected.id);
    assert.equal(await composer.inputValue(), draft);
    assert.equal(await drawer.getByText('proof.txt', { exact: true }).count(), 1);
    return evidence;
  };
  await showRoster(true);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Expanded roster and long names must not overflow the page');
  await snap(`shell-${agents.length}-expanded-roster`, 'Real compact roster disclosure; 16-agent fixture includes an intentionally long display name.');
  await assertInstances();
  await showRoster(false);
  for (const [width, height] of [[1440, 960], [1280, 800], [1100, 760]]) {
    await size(width, height); await page.waitForTimeout(400);
    const before = await assertInstances();
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, pageWidth: document.documentElement.scrollWidth,
      drawer: (() => { const el = document.querySelector('[aria-label="Agent drawer"]'); const b = el.getBoundingClientRect();
        return { x: b.x, right: b.right, width: b.width, className: el.className }; })() }));
    shell.lastGeometry = { requestedWidth: width, requestedHeight: height, ...geometry };
    assert.equal(geometry.viewport, width, 'Native viewport must honor the requested QA size');
    assert(geometry.pageWidth <= geometry.viewport + 1, 'Shell must not create horizontal page overflow');
    assert(geometry.drawer.x >= 0 && geometry.drawer.right <= geometry.viewport + 1);
    if (width === 1100) assert.match(geometry.drawer.className, /is-overlay/, 'Constrained drawer must use bounded overlay');
    for (const theme of ['light', 'dark']) {
      if ((await page.locator('html').getAttribute('data-cth-theme') || 'light') !== theme)
        await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
      await snap(`shell-${agents.length}-drawer-open-${theme}-${width}x${height}`, shell.scope);
    }
    await drawer.getByRole('button', { name: 'Close agent drawer', exact: true }).click();
    await drawer.waitFor({ state: 'hidden' });
    await page.waitForTimeout(650);
    assert(await page.getByRole('button', { name: 'Open agent drawer', exact: true }).evaluate(el => document.activeElement === el),
      'Closing the drawer must restore focus to its reopen control');
    const hidden = await assertInstances();
    assert(hidden.packets > before.packets, 'Actual counter output must continue while drawer is hidden');
    await snap(`shell-${agents.length}-drawer-closed-${width}x${height}`, shell.scope);
    await page.getByRole('button', { name: 'Open agent drawer', exact: true }).click();
    await drawer.waitFor(); await assertInstances();
    // Close again and reselect the same roster ID: selection must reopen it.
    await drawer.getByRole('button', { name: 'Close agent drawer', exact: true }).click();
    await selectFixture(selected); await assertInstances();
    const collapse = page.getByRole('button', { name: 'Collapse navigation', exact: true });
    const expandedWidth = (await navigation.boundingBox()).width;
    if (await collapse.isVisible()) {
      await collapse.click(); await page.waitForTimeout(300);
      assert((await navigation.boundingBox()).width < expandedWidth, 'Collapse must shrink navigation');
      await assertInstances();
      await snap(`shell-${agents.length}-navigation-collapsed-${width}x${height}`, shell.scope);
      await page.getByRole('button', { name: 'Expand navigation', exact: true }).click();
    } else {
      assert(expandedWidth < 100, 'Constrained navigation must already be an icon rail');
      if (width === 1100) assert(await page.getByRole('button', { name: 'Navigation stays compact in narrow windows', exact: true }).isDisabled());
    }
    shell.widths.push({ width, height, geometry, before, hidden, reopened: await assertInstances() });
  }
  await size(1440, 960);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await snap(`shell-${agents.length}-reduced-motion`, shell.scope);
  await assertInstances();
  assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const shellScreen = await snap(`shell-${agents.length}-reference-view`, shell.scope);
  await captureReferenceComparison(shellScreen, `shell-${agents.length}`, true);
  shell.terminalPackets = await page.evaluate(() => { window.__shellOff(); return window.__shellPackets; });
  await composer.fill('');
  await drawer.getByText('proof.txt', { exact: true }).locator('..').getByRole('button').click();
  const routes = [['Tasks', 'tasks'], ['Ask me', 'ask me'], ['Team', 'monitor'], ['Memory', 'memory'], ['Activity', 'activity']];
  shell.navigation = [];
  const coordinator = agents.find(a => a.isGod);
  for (const [name, tab] of routes) {
    const link = navigation.getByRole('button', { name, exact: true });
    if (!coordinator) {
      assert(await link.isDisabled(), `${name} needs a coordinator and must be disabled when absent`);
      assert(await link.getAttribute('title'), 'Disabled navigation must explain the missing coordinator');
      shell.navigation.push({ name, result: 'DISABLED_WITHOUT_COORDINATOR' });
      continue;
    }
    await link.focus();
    assert(await link.evaluate(el => document.activeElement === el), 'Navigation must accept keyboard focus');
    await page.keyboard.press('Enter');
    const active = drawer.getByRole('button', { name: tab, exact: true });
    await page.waitForTimeout(350);
    assert.equal(await active.getAttribute('aria-pressed'), 'true', `${name} must open its actual command-center tab`);
    assert.equal(await link.getAttribute('aria-current'), 'page', 'Navigation must identify the current destination');
    assert.equal(await page.evaluate(() => localStorage.getItem('cth.selectedId')), coordinator.id);
    if (name === 'Tasks') {
      await drawer.getByRole('button', { name: 'memory', exact: true }).click();
      await page.waitForTimeout(150);
      assert.equal(await navigation.getByRole('button', { name: 'Memory', exact: true }).getAttribute('aria-current'), 'page',
        'Internal command-center tab changes must update sidebar current destination');
      shell.internalTabMirror = 'PASS';
      await link.click();
      await page.waitForTimeout(150);
    }
    await drawer.getByRole('button', { name: 'Close agent drawer', exact: true }).click();
    await page.getByRole('button', { name: 'Open agent drawer', exact: true }).click();
    assert.equal(await active.getAttribute('aria-pressed'), 'true', 'Drawer close/reopen must retain the command-center tab');
    assert(await page.evaluate(() => window.__shellCanvas.isConnected), 'Navigation must retain office canvas');
    await snap(`shell-navigation-${name.toLowerCase().replaceAll(' ', '-')}`, 'Existing coordinator destination; no new task or model work submitted.');
    shell.navigation.push({ name, tab, result: 'PASS' });
  }
  await navigation.getByRole('button', { name: 'Agent Office', exact: true }).click();
  await drawer.waitFor({ state: 'hidden' });
  if (coordinator) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const settings = page.getByRole('dialog');
    await settings.getByRole('button', { name: 'Prerequisites', exact: true }).click();
    await settings.getByText(/^\d+ of \d+ ready/).waitFor();
    await settings.getByRole('button', { name: 're-check', exact: true }).waitFor();
    const ask = settings.getByRole('button', { name: /^ask .+ to set up everything$/ });
    if (await ask.isDisabled()) {
      assert(await settings.getByText(/Everything recommended is installed/).isVisible());
      shell.prerequisiteDispatchSeed = 'NOT_APPLICABLE: actual environment reports all essentials installed';
      await page.keyboard.press('Escape'); await settings.waitFor({ state: 'detached' });
    } else {
      await ask.click(); await settings.waitFor({ state: 'detached' });
      await drawer.waitFor();
      assert.equal(await drawer.getByRole('button', { name: 'monitor', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => localStorage.getItem('cth.selectedId')), coordinator.id);
      const dispatchDraft = drawer.getByRole('textbox', { name: /^Describe the task/ });
      const seed = await dispatchDraft.inputValue();
      assert(seed.trim().length > 100, 'Actual missing prerequisites must produce a nonempty setup dispatch draft');
      await snap('shell-prerequisite-unsent-dispatch-seed', 'Actual missing-tools helper; draft only, dispatch is never submitted.');
      await dispatchDraft.fill('');
      shell.prerequisiteDispatchSeed = { result: 'PASS', seedLength: seed.length, submitted: false };
    }
  }
  await selectFixture(selected);
  shell.result = 'PASS';
  saveReport();
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
  report.sessions ??= [];
  const video = page.video();
  report.sessions.push({ profile: path.basename(profile), startedAt: new Date().toISOString(),
    video: video ? path.relative(dir, await video.path()).replaceAll('\\', '/') : null });
  page.setDefaultTimeout(20000);
  page.on('pageerror', e => report.errors.push(e.message));
  await size(1440, 960);
  report.runtime = await app.evaluate(({ app }) => ({ name: app.getName(), version: app.getVersion(), isPackaged: app.isPackaged, electron: process.versions.electron }));
  assert.equal(report.runtime.isPackaged, true);
  assert.equal(report.runtime.version, expectedVersion);
}
async function size(width, height) {
  await app.evaluate(({ BrowserWindow }, d) => BrowserWindow.getAllWindows()[0].setContentSize(d.width, d.height), { width, height });
  await page.waitForFunction(d => innerWidth === d.width && innerHeight === d.height, { width, height }, { timeout: 5000 })
    .catch(async () => {
      const actual = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      report.viewportMismatch = { requested: { width, height }, actual };
      throw new Error(`Native viewport clamped: requested ${width}x${height}, actual ${actual.width}x${actual.height}`);
    });
}
async function sceneClip() {
  const { canvas } = await sceneSnapshot();
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const x = Math.max(0, Math.ceil(canvas.x)), y = Math.max(0, Math.ceil(canvas.y));
  return { x, y, width: Math.floor(Math.min(canvas.x + canvas.width, viewport.width) - x),
    height: Math.floor(Math.min(canvas.y + canvas.height, viewport.height) - y) };
}
async function captureReferenceComparison(sceneFile, prefix, shell = false) {
  const sourceReference = shell ? shellReferencePath : referencePath;
  const reference = shell ? report.shellReference : report.reference;
  const referenceName = shell ? 'reference-office-shell.png' : 'reference-concept01.png';
  const comparisonTitle = shell ? 'Supplied shell / actual packaged application' : 'Concept 01 / actual packaged scene';
  const referenceCopy = path.join(dir, referenceName);
  if (!fs.existsSync(referenceCopy)) fs.copyFileSync(sourceReference, referenceCopy);
  assert.equal(hash(referenceCopy), reference.sha256, 'Comparison must preserve original reference bytes');
  const sourceHash = hash(path.join(dir, sceneFile));
  const styles = `.qa-evidence{box-sizing:border-box;height:100%;padding:24px;background:#faf8f4;color:#25231e;font:14px/1.45 Segoe UI,sans-serif;display:flex;flex-direction:column;gap:12px}.qa-evidence h1{font-size:22px;margin:0}.qa-evidence p{margin:0}.qa-evidence-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;min-height:0}.qa-evidence figure{margin:0;display:flex;flex-direction:column;min-width:0;min-height:0}.qa-evidence figcaption{font-weight:600;margin-bottom:8px}.qa-evidence img{width:100%;height:100%;min-height:0;object-fit:contain;background:#eee8df}.qa-evidence small{overflow-wrap:anywhere;font:11px/1.4 monospace}`;
  const content = (referenceSrc, sceneSrc) => `<section class="qa-evidence"><h1>${comparisonTitle}</h1><p>Evidence comparison · Zuri ${expectedVersion} · controlled display/status fixture · not model work. Originals are unaltered; images are fitted proportionally.</p><div class="qa-evidence-grid"><figure><figcaption>Approved original reference</figcaption><img alt="Original reference" src="${referenceSrc}"></figure><figure><figcaption>Actual application — ${prefix}</figcaption><img alt="Actual packaged application" src="${sceneSrc}"></figure></div><small>Reference SHA256 ${reference.sha256}<br>Actual screenshot SHA256 ${sourceHash}</small><p>${shell ? 'Review navigation hierarchy, office space, compact roster, drawer and theme readability.' : 'Review camera, enclosure/entrance, rear glass meeting room, four pods, kitchenette/lounge, materials/light and actor integration.'} Mechanical PASS does not accept reference fidelity.</p></section>`;
  const htmlFile = `${prefix}-reference-comparison.html`;
  fs.writeFileSync(path.join(dir, htmlFile), `<!doctype html><html><head><meta charset="utf-8"><title>Zuri reference comparison</title><style>html,body{height:100%;margin:0}${styles}</style></head><body>${content(referenceName, sceneFile)}</body></html>`);
  const overlayContent = `<style>${styles}</style>` + content('data:image/png;base64,' + fs.readFileSync(sourceReference).toString('base64'),
    'data:image/png;base64,' + fs.readFileSync(path.join(dir, sceneFile)).toString('base64'));
  let comparisonFile;
  try {
    await page.evaluate(html => {
      const sheet = document.createElement('div'); sheet.id = 'qa-reference-comparison';
      sheet.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#faf8f4';
      sheet.innerHTML = html; document.body.appendChild(sheet);
    }, overlayContent);
    await page.waitForFunction(() => [...document.querySelectorAll('#qa-reference-comparison img')].every(img => img.complete && img.naturalWidth > 0));
    comparisonFile = await snap(`${prefix}-reference-comparison`, 'Labeled evidence sheet displaying original reference and original live canvas screenshot; not a single app screenshot.');
  } finally {
    await page.evaluate(() => document.getElementById('qa-reference-comparison')?.remove());
  }
  report.comparisons ??= [];
  report.comparisons.push({ prefix, kind: shell ? 'shell' : 'scene', html: htmlFile, image: comparisonFile, reference: referenceName, scene: sceneFile,
    referenceSha256: reference.sha256, sceneSha256: sourceHash, htmlSha256: hash(path.join(dir, htmlFile)), review: 'NOT_REVIEWED' });
  saveReport();
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
  return file;
}
async function close() {
  if (!app) return;
  await page.evaluate(async () => { for (const p of await window.cth.listPtys()) await window.cth.killPty(p.id); }).catch(() => {});
  await app.close();
  app = null;
}
async function createStreamAgent() {
  await showRoster(true);
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
  await showRoster(false);
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
    for (const count of [1, 16, 17]) await benchmarkDisplayFixture(count);
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

    await showRoster(true);
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
    await showRoster(false);

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
    await showRoster(true);
    const coordinator = page.getByRole('button', { name: /^ZURI COORDINATOR/ }).first();
    if (await coordinator.count()) {
      await coordinator.click();
      await showRoster(false);
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
    report.mechanicalResult = report.result;
    report.acceptance = report.referenceFidelityReview.result === 'PASS' && report.shellReview.result === 'PASS' && report.result === 'PASS' ? 'PASS' : 'NOT_ACCEPTED';
    saveReport(); console.log(JSON.stringify({ result: report.result, dir, screenshots: report.screens.length, errors: report.errors }));
  }
})();
