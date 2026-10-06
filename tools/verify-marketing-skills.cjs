'use strict';
// Packaged UI/PTY evidence using an inert local process, never a marketing account or model.
const { _electron } = require(process.env.ZURI_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const executable = path.resolve(process.env.ZURI_QA_EXECUTABLE || path.join(root, 'dist/marketing-0.5.0/win-unpacked/Zuri.exe'));
const dir = path.join(root, 'output/playwright/marketing-skills/' + Date.now());
const workspace = path.join(dir, 'source-project'), profile = path.join(dir, 'profile'), home = path.join(dir, 'harness');
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report = { appVersion: '0.5.0', snapshotVersion: '5.0.0', startedAt: new Date().toISOString(), scope: 'Actual packaged UI and PTY/provisioning fixtures; live model use NOT_RUN', screens: [], checks: {}, errors: [] };
const { MARKETING_ROLES, MARKETING_CATALOG } = require('../test/load-ts.cjs')('src/shared/marketingSkills.ts');
report.upstream = { commit: MARKETING_CATALOG.commit, version: MARKETING_CATALOG.version };
report.source = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), dirty: true };
fs.mkdirSync(path.join(profile, 'temp'), { recursive: true });
fs.mkdirSync(path.join(workspace, '.agents'), { recursive: true });
fs.writeFileSync(path.join(workspace, '.agents/product-marketing.md'), '# QA product context\nControlled fixture; no actual customer or campaign data.\n');
const fixture = path.join(workspace, 'fixture.cjs');
fs.writeFileSync(fixture, `const fs=require('fs'),p=require('path');const args=process.argv.slice(2);if(process.env.AGENT_DIR){fs.writeFileSync(p.join(process.env.AGENT_DIR,'qa-process.json'),JSON.stringify({pid:process.pid,args,cwd:process.cwd()}));}setInterval(()=>console.log('ZURI_MARKETING_FIXTURE'),500);process.stdin.resume();\n`);
for (const args of [['init'], ['add', '.'], ['-c', 'user.name=Zuri QA', '-c', 'user.email=qa@example.invalid', 'commit', '-m', 'Local verification fixture']]) execFileSync('git', args, { cwd: workspace, stdio: 'ignore' });
const command = `"${process.execPath}" "${fixture}"`;
fs.writeFileSync(path.join(profile, 'config.json'), JSON.stringify({ onboardingComplete: true, harnessHome: home,
  registeredRepos: [workspace], autoMode: false, defaultCommand: command, godProvider: 'custom', missions: [],
  opsStandupSeeded: true, heartbeatSeeded: true, notifications: false, telemetryEnabled: false, autoUpdate: false }));
fs.copyFileSync(__filename, path.join(dir, 'executed-runner.cjs'));
report.runnerSha256 = sha(__filename);
report.asarSha256 = sha(path.join(path.dirname(executable), 'resources/app.asar'));
let app, page, seoId;
async function launch() {
  const env = { ...process.env, ZURI_USER_DATA_DIR: profile, TEMP: path.join(profile, 'temp'), TMP: path.join(profile, 'temp') };
  delete env.ELECTRON_RUN_AS_NODE;
  for (const k of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY/.test(k)) delete env[k];
  app = await _electron.launch({ executablePath: executable, env, timeout: 60000, recordVideo: { dir: path.join(dir, 'video'), size: { width: 1440, height: 960 } } });
  page = await app.firstWindow(); page.setDefaultTimeout(20000); page.on('pageerror', e => report.errors.push(e.message));
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 960));
  const runtime = await app.evaluate(({ app }) => ({ version: app.getVersion(), packaged: app.isPackaged }));
  assert.deepEqual(runtime, { version: report.appVersion, packaged: true });
  const open = page.getByRole('button', { name: 'open', exact: true });
  await open.or(page.getByRole('button', { name: 'Settings', exact: true })).first().waitFor();
  if (await open.isVisible()) await open.click();
  await page.getByRole('button', { name: 'Settings', exact: true }).waitFor();
}
async function close() {
  if (!app) return;
  const closed = app.waitForEvent('close', { timeout: 30000 });
  await page.evaluate(() => { void window.cth.confirmClose(); }).catch(() => {});
  await closed; app = null;
}
async function snap(name) {
  await page.waitForTimeout(220);
  const file = `${String(report.screens.length + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(dir, file) });
  report.screens.push({ file, name, sha256: sha(path.join(dir, file)), at: new Date().toISOString() });
  console.log('SCREENSHOT', name);
}
async function roster(show) {
  const b = page.getByRole('button', { name: show ? 'Show agent roster' : 'Hide agent roster', exact: true });
  if (await b.isVisible()) await b.click();
}
async function selectSeo() {
  await roster(true);
  await page.getByRole('region', { name: 'Agent roster', exact: true }).getByRole('button', { name: /^SEO SPECIALIST/ }).first().click();
  await roster(false);
  await page.getByRole('button', { name: 'SKILLS', exact: true }).last().click();
  await page.getByRole('region', { name: 'Zuri Marketing library' }).waitFor();
}
(async () => {
  console.log('EVIDENCE', dir);
  try {
    const bundle = path.join(path.dirname(executable), 'resources/marketing-skills');
    const origin = JSON.parse(fs.readFileSync(path.join(bundle, 'origin.json')));
    for (const [file, expected] of Object.entries(origin.files)) assert.equal(sha(path.join(bundle, file)), expected, file);
    report.checks.packagedHashes = Object.keys(origin.files).length;
    await launch();
    report.checks.sqlite = await app.evaluate(({ app }) => {
      const Database = process.mainModule.require(app.getAppPath() + '/node_modules/better-sqlite3');
      const db = new Database(':memory:');
      const value = db.prepare('select 42 as answer').get().answer; db.close();
      return { answer: value, electronAbi: process.versions.modules };
    });
    assert.equal(report.checks.sqlite.answer, 42);
    const initial = await page.evaluate(cwd => window.cth.marketingSkills(undefined, cwd), workspace);
    assert.equal(initial.bundled, true); assert.equal(initial.contextExists, true);
    await roster(true);
    await page.getByRole('button', { name: 'add agent', exact: true }).last().click();
    await page.getByRole('button', { name: '2 Workspace folder · isolation · resume', exact: true }).click();
    await page.getByRole('textbox', { name: '/path/to/your/project', exact: true }).fill(workspace);
    await page.getByRole('button', { name: '3 Engine provider · model · command', exact: true }).click();
    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.getByRole('textbox', { name: 'Command', exact: true }).fill(command);
    await page.getByRole('button', { name: '4 Briefing description · goal', exact: true }).click();
    for (const role of MARKETING_ROLES) {
      await page.getByRole('combobox', { name: 'Marketing role', exact: true }).selectOption(role.id);
      await page.getByText(`${role.skills.length} / 8 selected for next start`, { exact: true }).waitFor();
      await snap('role-' + role.id);
    }
    await page.getByRole('combobox', { name: 'Marketing role', exact: true }).selectOption('seo');
    await page.getByText('Adjust selected skills', { exact: true }).click();
    await page.getByLabel('Find marketing skills').fill('ads');
    await page.getByRole('checkbox', { name: 'ads', exact: true }).check();
    await page.getByLabel('Find marketing skills').fill('');
    assert.equal(await page.getByRole('checkbox', { name: 'ad-creative', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('checkbox', { name: 'product-marketing', exact: true }).isDisabled(), true);
    await snap('custom-selection-limit');
    await page.getByRole('checkbox', { name: 'ads', exact: true }).uncheck();
    await page.getByRole('button', { name: 'spawn', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    seoId = await page.evaluate(async () => Object.values((await window.cth.hiveRegistry()).agents).find(a => a.name === 'SEO Specialist').id);
    await selectSeo();
    const seoProcessFile = path.join(home, 'hive/agents', seoId, 'qa-process.json');
    for (let n = 0; !fs.existsSync(seoProcessFile) && n < 40; n++) await page.waitForTimeout(100);
    const firstSeoPid = JSON.parse(fs.readFileSync(seoProcessFile)).pid;
    await page.getByText('7 selected for this agent', { exact: false }).waitFor();
    await snap('library-light');
    await page.getByRole('textbox', { name: 'Search skills' }).fill('SEO Specialist');
    assert.equal(await page.locator('[data-skill-id]').count(), 7);
    await snap('role-filter');
    await page.getByRole('button', { name: 'Toggle dark mode', exact: true }).click();
    await snap('library-dark');
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1100, 800));
    await snap('library-dark-1100');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 960));
    report.checks.uiRoleSelection = 'PASS';
    for (const provider of ['claude', 'codex', 'opencode']) {
      const role = MARKETING_ROLES[provider === 'claude' ? 0 : provider === 'codex' ? 1 : 3];
      const id = 'fixture-' + provider;
      const res = await page.evaluate(async o => window.cth.spawnPty(o), { id: 'pty-' + id, cwd: workspace, command: process.execPath,
        args: [fixture], provider, cols: 100, rows: 30, isolate: provider === 'opencode',
        hive: { id, name: id, provider, cwd: workspace, role: role.name, skills: role.skills } });
      assert.equal(res.ok, true, JSON.stringify(res));
      if (provider === 'opencode') assert.ok(res.worktreePath, 'Real isolated worktree must exist');
      const reg = await page.evaluate(() => window.cth.hiveRegistry());
      const agent = reg.agents[id];
      assert.deepEqual(agent.skills, role.skills);
      assert.equal(agent.marketingProjectCwd, workspace);
      assert.ok(agent.marketing.entries.every(e => e.status === 'provisioned'));
      const processFile = path.join(home, 'hive/agents', id, 'qa-process.json');
      await page.waitForFunction(async id => (await window.cth.listPtys()).some(p => p.id === id), 'pty-' + id);
      for (let n = 0; !fs.existsSync(processFile) && n < 40; n++) await page.waitForTimeout(100);
      const record = JSON.parse(fs.readFileSync(processFile));
      assert.ok(record.args.join('\n').includes('ZURI MARKETING SKILLS'));
      report.checks[provider] = { selected: agent.skills, context: agent.marketing.contextPath, worktree: res.worktreePath, promptDelivered: true };
    }
    await page.waitForTimeout(800); // allow existing roster mirror debounce to flush
    await close();
    await launch();
    await roster(true);
    const restore = page.getByRole('button', { name: /restore team \(/i });
    if (await restore.isVisible()) { await restore.click(); await page.getByRole('button', { name: /restore all/i }).click(); }
    await selectSeo();
    for (let n = 0; JSON.parse(fs.readFileSync(seoProcessFile)).pid === firstSeoPid && n < 50; n++) await page.waitForTimeout(100);
    assert.notEqual(JSON.parse(fs.readFileSync(seoProcessFile)).pid, firstSeoPid, 'Restart must launch a new real fixture process');
    assert.ok((await page.evaluate(() => window.cth.listPtys())).some(p => p.id === 'pty-' + seoId));
    const resumed = await page.evaluate(id => window.cth.marketingSkills(id), seoId);
    assert.deepEqual(resumed.selected, MARKETING_ROLES[2].skills);
    assert.equal(resumed.contextPath, path.join(workspace, '.agents/product-marketing.md'));
    assert.ok(resumed.provisioning.entries.every(e => e.status === 'provisioned'));
    report.checks.restart = 'PASS'; await snap('restored-selection');
    // Change only a disposable fixture copy to exercise the non-destructive failure surface.
    const edited = resumed.provisioning.entries.find(e => e.id === 'marketing:seo-audit').path;
    fs.writeFileSync(edited, 'QA USER EDIT — MUST SURVIVE');
    await close(); await launch(); await roster(true);
    const again = page.getByRole('button', { name: /restore team \(/i });
    if (await again.isVisible()) { await again.click(); await page.getByRole('button', { name: /restore all/i }).click(); }
    await selectSeo();
    await page.getByRole('textbox', { name: 'Search skills' }).fill('seo-audit');
    await page.getByText('Provisioning failed', { exact: true }).waitFor();
    await page.locator('[data-skill-id="marketing:seo-audit"]').scrollIntoViewIfNeeded();
    assert.equal(fs.readFileSync(edited, 'utf8'), 'QA USER EDIT — MUST SURVIVE');
    report.checks.modifiedFilePreserved = 'PASS'; await snap('preserved-edit-failure');
    assert.deepEqual(report.errors, []);
    report.result = 'PASS';
  } catch (e) {
    report.result = 'FAIL'; report.failure = e.stack; process.exitCode = 1;
    console.error(e.message);
    if (page && !page.isClosed()) { await snap('failure').catch(() => {}); fs.writeFileSync(path.join(dir, 'failure-aria.txt'), await page.locator('body').ariaSnapshot().catch(() => 'unavailable')); }
  } finally {
    await close().catch(e => { report.errors.push(String(e)); });
    assert.equal(sha(path.join(path.dirname(executable), 'resources/app.asar')), report.asarSha256);
    report.completedAt = new Date().toISOString();
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(report, null, 2));
    const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
    fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>Zuri Marketing 0.5.0</title><style>body{margin:32px;background:#f4f2ed;color:#252525;font:16px/1.5 Segoe UI,sans-serif}h1{margin-bottom:4px}article{margin:24px 0;padding:16px;background:white;border-radius:14px}img{max-width:100%;height:auto}code{overflow-wrap:anywhere;font-size:12px}</style><h1>Zuri 0.5.0 · Marketing skills</h1><p>Snapshot 5.0.0 · ${esc(report.result)} · Actual packaged UI / controlled processes. Live model use NOT_RUN.</p><p>Collection ${report.upstream.version} · ${report.upstream.commit}</p><p><a href="manifest.json">Evidence manifest</a></p>${report.screens.map(s => `<article><h2>${esc(s.name)}</h2><a href="${s.file}"><img src="${s.file}" alt="${esc(s.name)}"></a><code>SHA-256 ${s.sha256}</code></article>`).join('')}</html>`);
    console.log(JSON.stringify({ result: report.result, dir, screens: report.screens.length, errors: report.errors }));
  }
})();
