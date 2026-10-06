'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const loadTs = require('./load-ts.cjs');
const { MARKETING_CATALOG, MARKETING_ROLES, MARKETING_FOUNDATION, validateSkillSelection } = loadTs('src/shared/marketingSkills.ts');
const { provisionMarketingSkills, marketingBootstrap, marketingLibraryView, marketingProjectForSpawn } = loadTs('src/main/marketingSkills.ts');
const { validateHireManifest } = loadTs('src/shared/hire.ts');
const { HiveManager } = loadTs('src/main/hive.ts');
const source = path.resolve(__dirname, '../resources/marketing-skills');
function temp(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-marketing-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
test('pinned collection contains all 50 entrypoints and every source hash matches', () => {
  const origin = JSON.parse(fs.readFileSync(path.join(source, 'origin.json')));
  assert.equal(origin.commit, MARKETING_CATALOG.commit);
  assert.equal(origin.skills.length, 50);
  assert.equal(Object.keys(origin.files).length, 291);
  for (const [file, hash] of Object.entries(origin.files)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source, file))).digest('hex'), hash, file);
  }
  for (const skill of MARKETING_CATALOG.skills) assert.ok(origin.files[`skills/${skill.name}/SKILL.md`]);
});
test('six presets stay capped and hire import requires the foundation', () => {
  assert.equal(MARKETING_ROLES.length, 6);
  for (const role of MARKETING_ROLES) {
    assert.equal(validateSkillSelection(role.skills).error, undefined, role.name);
    assert.equal(validateHireManifest({ spec: 'munder-difflin/hire@1', name: role.name, skills: role.skills }).ok, true);
  }
  for (const invalid of [null, ['marketing:ads'], ['../../bad'], [MARKETING_FOUNDATION, MARKETING_FOUNDATION], Array(9).fill('md-audit'), [42]]) {
    assert.ok(validateSkillSelection(invalid).error, JSON.stringify(invalid));
  }
  assert.deepEqual(validateSkillSelection(undefined).skills, []);
  assert.equal(validateSkillSelection(['md-audit']).error, undefined);
});
test('returning to an isolated worktree retains its source; changing projects never retains another brand', t => {
  const root = temp(t), sourceA = path.join(root, 'brand-a'), sourceB = path.join(root, 'brand-b'), worktree = path.join(root, 'isolated');
  const previous = { cwd: worktree, marketingProjectCwd: sourceA };
  assert.equal(marketingProjectForSpawn(worktree, previous), sourceA);
  assert.equal(marketingProjectForSpawn(sourceA, previous), sourceA);
  assert.equal(marketingProjectForSpawn(sourceB, previous), sourceB);
});
test('explicit project reassignment updates the context in the real Hive bootstrap', async t => {
  const root = temp(t), a = path.join(root, 'brand-a'), b = path.join(root, 'brand-b');
  fs.mkdirSync(a); fs.mkdirSync(b);
  const hive = new HiveManager(() => root), opts = { marketingSkillsDir: source };
  await hive.ensureAgent({ id: 'move', name: 'Move', provider: 'claude', cwd: a, marketingProjectCwd: a, skills: [MARKETING_FOUNDATION] }, opts);
  await hive.ensureAgent({ id: 'move', name: 'Move', provider: 'claude', cwd: b, marketingProjectCwd: b }, opts);
  assert.equal(hive.registry().agents.move.marketing.contextPath, path.join(b, '.agents/product-marketing.md'));
});
test('two roles get different file sets, references and exact source receipts', t => {
  const root = temp(t);
  for (const role of [MARKETING_ROLES[1], MARKETING_ROLES[2]]) {
    const state = provisionMarketingSkills(source, path.join(root, role.id), role.skills, root);
    assert.ok(state.entries.every(e => e.status === 'provisioned'));
    const skillsDir = path.dirname(path.dirname(state.entries[0].path));
    assert.deepEqual(fs.readdirSync(skillsDir).sort(), role.skills.map(s => s.slice(10)).sort());
    const receipt = JSON.parse(fs.readFileSync(path.join(path.dirname(skillsDir), 'receipt.json')));
    assert.deepEqual(receipt.selected, [...role.skills].sort());
    assert.ok(Object.keys(receipt.files).some(p => p.includes('/references/')));
    assert.ok(!marketingBootstrap(state).includes('marketing:ads'));
  }
  assert.equal(provisionMarketingSkills(source, path.join(root, 'legacy'), [], root), undefined);
  assert.equal(fs.existsSync(path.join(root, 'legacy', 'marketing')), false);
});
test('edited agent files survive restart and are reported failed; unknown files survive', t => {
  const root = temp(t), skills = [MARKETING_FOUNDATION];
  const first = provisionMarketingSkills(source, root, skills, root);
  const file = first.entries[0].path;
  fs.writeFileSync(file, 'USER EDIT');
  const extra = path.join(path.dirname(file), 'my-notes.md'); fs.writeFileSync(extra, 'KEEP');
  const next = provisionMarketingSkills(source, root, skills, root);
  assert.equal(next.entries[0].status, 'failed');
  assert.match(next.entries[0].error, /Preserved modified/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'USER EDIT');
  assert.equal(fs.readFileSync(extra, 'utf8'), 'KEEP');
  assert.match(marketingBootstrap(next), /UNAVAILABLE/);
});
test('missing bundle and changed source fail visibly without granting unselected skills', t => {
  const root = temp(t);
  const absent = provisionMarketingSkills(undefined, root, [MARKETING_FOUNDATION], root);
  assert.equal(absent.entries[0].status, 'failed');
  assert.equal(marketingLibraryView(path.join(root, 'missing')).bundled, false);
  const corrupt = path.join(root, 'source'); fs.cpSync(source, corrupt, { recursive: true });
  fs.writeFileSync(path.join(corrupt, 'skills/product-marketing/SKILL.md'), 'CORRUPT');
  const bad = provisionMarketingSkills(corrupt, path.join(root, 'agent'), [MARKETING_FOUNDATION], root);
  assert.equal(bad.entries[0].status, 'failed');
  assert.equal(fs.existsSync(bad.entries[0].path), false);
});
test('bundle paths cannot escape and directory links cannot redirect writes', t => {
  const root = temp(t), corrupt = path.join(root, 'source');
  fs.cpSync(source, corrupt, { recursive: true });
  const originFile = path.join(corrupt, 'origin.json'), origin = JSON.parse(fs.readFileSync(originFile));
  origin.files['skills/product-marketing/../../../outside.txt'] = 'bad';
  fs.writeFileSync(originFile, JSON.stringify(origin));
  const bad = provisionMarketingSkills(corrupt, path.join(root, 'agent'), [MARKETING_FOUNDATION], root);
  assert.equal(bad.entries[0].status, 'failed');
  const redirected = path.join(root, 'redirected'), outside = path.join(root, 'outside');
  fs.mkdirSync(redirected); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(redirected, 'marketing'), process.platform === 'win32' ? 'junction' : 'dir');
  const linked = provisionMarketingSkills(source, redirected, [MARKETING_FOUNDATION], root);
  assert.equal(linked.entries[0].status, 'failed');
  assert.deepEqual(fs.readdirSync(outside), []);
});
for (const provider of ['claude', 'codex', 'opencode']) {
  test(`${provider}: bootstrap and a new HiveManager retain selection and source-project context on restart`, async t => {
    const root = temp(t), project = path.join(root, 'source project'), isolated = path.join(root, 'worktree');
    fs.mkdirSync(path.join(project, '.agents'), { recursive: true }); fs.mkdirSync(isolated);
    fs.writeFileSync(path.join(project, '.agents/product-marketing.md'), 'BRAND A');
    const opts = { marketingSkillsDir: source, skillsDir: path.resolve(__dirname, '../resources/skills') };
    let hive = new HiveManager(() => root);
    const meta = { id: 'worker', name: 'SEO', provider, cwd: isolated, marketingProjectCwd: project, skills: MARKETING_ROLES[2].skills };
    const first = await hive.ensureAgent(meta, opts);
    const prompt = first.args.join('\n') + (first.seedPrompt ?? '');
    assert.ok(prompt.includes('ZURI MARKETING SKILLS'));
    assert.ok(prompt.includes(path.join(project, '.agents/product-marketing.md')));
    assert.ok(prompt.includes('marketing:seo-audit'));
    assert.ok(!prompt.includes('marketing:cold-email'));
    hive = new HiveManager(() => root);
    const resumed = await hive.ensureAgent({ id: 'worker', name: 'SEO', provider, cwd: isolated }, opts);
    const saved = hive.registry().agents.worker;
    assert.deepEqual(saved.skills, meta.skills);
    assert.equal(saved.marketingProjectCwd, project);
    assert.ok(saved.marketing.entries.every(e => e.status === 'provisioned'));
    assert.ok((resumed.args.join('\n') + (resumed.seedPrompt ?? '')).includes(path.join(project, '.agents/product-marketing.md')));
    assert.ok(fs.existsSync(path.join(hive.agentDir('worker'), '.claude/skills/md-audit/SKILL.md')));
    assert.ok(!fs.existsSync(path.join(hive.agentDir('worker'), '.claude/skills/ads')));
    const cleared = await hive.ensureAgent({ ...meta, skills: [] }, opts);
    assert.ok(!(cleared.args.join('\n') + (cleared.seedPrompt ?? '')).includes('ZURI MARKETING SKILLS'));
  });
}
