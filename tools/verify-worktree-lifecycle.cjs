'use strict';
// Packaged IPC acceptance in a newly created disposable repository only.
const { _electron } = require(process.env.ZURI_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'output/playwright/stabilization-' + Date.now());
const repo = path.join(dir, 'repo'), profile = path.join(dir, 'profile');
const executable = path.join(root, 'dist/stabilization-0.3.1/win-unpacked/Zuri.exe');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const bounded = p => { const r = path.relative(dir, path.resolve(p)); assert(r && !r.startsWith('..') && !path.isAbsolute(r), 'QA path must remain within unique run'); };
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
fs.mkdirSync(path.join(profile, 'temp'), { recursive: true }); fs.mkdirSync(repo);
git('init', '-q', '-b', 'main'); git('config', 'user.name', 'Zuri QA'); git('config', 'user.email', 'qa@example.invalid');
git('config', 'core.autocrlf', 'false');
fs.writeFileSync(path.join(repo, 'README.md'), 'Disposable packaged worktree lifecycle verification\n');
git('add', 'README.md'); git('commit', '-q', '-m', 'Disposable QA fixture');
fs.mkdirSync(path.join(repo, 'node_modules'));
const sentinel = path.join(repo, 'node_modules', 'must-survive.txt');
fs.writeFileSync(sentinel, 'ZURI_PARENT_DEPENDENCIES_SURVIVE\n');
const originalSentinel = hash(sentinel);
fs.writeFileSync(path.join(dir, 'stream.cjs'), "let n=0;setInterval(()=>console.log('ZURI_WORKTREE_COUNTER '+(++n)),200);process.stdin.resume();\n");
fs.writeFileSync(path.join(profile, 'config.json'), JSON.stringify({ onboardingComplete: true, harnessHome: null,
  autoMode: false, registeredRepos: [repo], missions: [], opsStandupSeeded: true, heartbeatSeeded: true,
  telemetryEnabled: false, autoUpdate: false, notifications: false }));
const report = { snapshotVersion: '3.0.1', scope: 'Actual packaged spawn/isolate/kill IPC and parent dependency preservation; local counter PTY, no model work',
  runnerSha256: hash(__filename), source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  asarSha256: hash(path.join(path.dirname(executable), 'resources/app.asar')), startedAt: new Date().toISOString(), checks: {}, screens: [], errors: [] };
const env = { ...process.env, ZURI_USER_DATA_DIR: profile, TEMP: path.join(profile, 'temp'), TMP: path.join(profile, 'temp') };
delete env.ELECTRON_RUN_AS_NODE;
for (const k of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY/.test(k)) delete env[k];
let app, page;
async function snap(name) { const file = name + '.png'; await page.screenshot({ path: path.join(dir, file) }); report.screens.push({ file, sha256: hash(path.join(dir, file)) }); }
(async () => {
  console.log('CAPTURE', dir);
  try {
    app = await _electron.launch({ executablePath: executable, env, timeout: 60000, recordVideo: { dir: path.join(dir, 'video'), size: { width: 1440, height: 960 } } });
    page = await app.firstWindow(); page.setDefaultTimeout(30000); page.on('pageerror', e => report.errors.push(e.message));
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 960));
    report.runtime = await app.evaluate(({ app }) => ({ version: app.getVersion(), packaged: app.isPackaged, electron: process.versions.electron }));
    assert.equal(report.runtime.version, '0.3.1'); assert.equal(report.runtime.packaged, true);
    await page.getByRole('button', { name: 'open existing config…', exact: true }).waitFor();
    const id = 'pty-worktree-verification';
    const expectedWorktree = path.join(repo, 'worktrees', id); bounded(expectedWorktree); bounded(sentinel);
    const spawned = await page.evaluate(opts => window.cth.spawnPty(opts), {
      id, cwd: repo, command: process.execPath, args: [path.join(dir, 'stream.cjs')], provider: 'custom', isolate: true, cols: 100, rows: 25
    });
    assert.equal(spawned.ok, true, JSON.stringify(spawned));
    assert.equal(path.resolve(spawned.worktreePath), expectedWorktree); bounded(spawned.worktreePath);
    assert.equal(fs.lstatSync(path.join(expectedWorktree, 'node_modules')).isSymbolicLink(), true);
    report.checks.spawned = spawned; report.checks.parentSentinelBefore = originalSentinel;
    await page.evaluate(({ repo, id, command }) => {
      localStorage.setItem('cth.agents', JSON.stringify([{ id: 'worktree-verification', name: 'Worktree verification', character: 'jim', accent: 'sky',
        description: 'Controlled counter PTY; not model work', project: 'Disposable safety fixture', tmuxTarget: '', cwd: repo, command, provider: 'custom', status: 'idle', action: 'Lifecycle QA', progress: 0, ptyId: id }]));
      localStorage.setItem('cth.selectedId', 'worktree-verification'); localStorage.setItem('cth.skipHivePickerOnce', 'true'); localStorage.setItem('cth.prefersFocusMode', 'false');
    }, { repo: expectedWorktree, id, command: process.execPath });
    await page.reload(); await page.locator('.xterm').waitFor();
    await page.evaluate(() => { const el=document.createElement('div');el.id='qa-lifecycle';el.textContent='CONTROLLED LIFECYCLE TEST · App 0.3.1 · Snapshot 3.0.1 · no model work';el.style.cssText='position:fixed;top:48px;left:16px;z-index:99999;padding:8px;background:#fff2bd;color:#392800';document.body.appendChild(el); });
    await page.evaluate(id => { window.__lifecyclePackets = 0; window.__offLifecycle = window.cth.onPtyData(id, data => { if (data.includes('ZURI_WORKTREE_COUNTER')) window.__lifecyclePackets++; }); }, id);
    await page.waitForFunction(() => window.__lifecyclePackets >= 3);
    report.checks.counterPackets = await page.evaluate(() => { window.__offLifecycle(); return window.__lifecyclePackets; });
    await snap('01-isolated-counter-running');
    bounded(expectedWorktree); // Validate the exact disposable removal target immediately before kill/teardown.
    const killed = await page.evaluate(id => window.cth.killPty(id), id); assert.equal(killed.ok, true);
    for (let n = 0; n < 100 && fs.existsSync(expectedWorktree); n++) await page.waitForTimeout(100);
    assert.equal(fs.existsSync(expectedWorktree), false, 'Managed worktree must be removed');
    assert.equal(hash(sentinel), originalSentinel, 'Parent dependency bytes must survive actual teardown');
    report.checks.worktreeRemoved = true; report.checks.parentSentinelAfter = hash(sentinel);
    report.checks.remainingPtys = await page.evaluate(() => window.cth.listPtys()); assert.equal(report.checks.remainingPtys.length, 0);
    await page.evaluate(() => document.getElementById('qa-lifecycle').textContent = 'VERIFIED · worktree removed · parent dependency sentinel unchanged · App 0.3.1 / Snapshot 3.0.1');
    await snap('02-after-managed-teardown'); assert.deepEqual(report.errors, []); report.result = 'PASS';
  } catch (e) { report.result = 'FAIL'; report.failure = e.stack; process.exitCode = 1; await snap('failure').catch(() => {}); }
  finally {
    if (app) { await page.evaluate(async () => { for (const p of await window.cth.listPtys()) await window.cth.killPty(p.id); }).catch(() => {}); await app.close(); }
    report.completedAt = new Date().toISOString(); report.asarSha256AtCompletion = hash(path.join(path.dirname(executable), 'resources/app.asar'));
    if (report.asarSha256AtCompletion !== report.asarSha256) { report.result = 'FAIL'; process.exitCode = 1; }
    report.videos = fs.existsSync(path.join(dir, 'video')) ? fs.readdirSync(path.join(dir, 'video')).map(file => ({file:'video/'+file,sha256:hash(path.join(dir,'video',file))})) : [];
    fs.copyFileSync(__filename, path.join(dir, 'capture-runner.cjs'));
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ dir, result: report.result, error: report.failure }));
  }
})();
