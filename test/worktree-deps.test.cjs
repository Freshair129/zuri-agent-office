'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const loadTs = require('./load-ts.cjs');

const { linkWorktreeDeps, unlinkWorktreeDeps } = loadTs('src/main/worktreeDeps.ts');
const { removeWorktree, worktreeHasUnintegratedWork, worktreeIsGcSafe } = loadTs('src/main/git.ts');

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const qaRoot = path.resolve(__dirname, '../output/stabilization/worktree-deps');
const directoryLink = (target, link) => fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
function assertBounded(target) {
  const relative = path.relative(qaRoot, path.resolve(target));
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'fixture must stay inside disposable QA root');
}

function makeHarness() {
  fs.mkdirSync(qaRoot, { recursive: true });
  const comparable = value => process.platform === 'win32' ? value.toLowerCase() : value;
  assert.equal(comparable(fs.realpathSync(qaRoot)), comparable(qaRoot), 'QA root must not resolve through a link');
  const home = fs.mkdtempSync(path.join(qaRoot, 'case-'));
  assertBounded(home);
  const repo = path.join(home, 'repo');
  fs.mkdirSync(repo);
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'Test');
  git(repo, 'config', 'core.autocrlf', 'false');
  const excludes = path.join(home, 'empty-excludes');
  fs.writeFileSync(excludes, '');
  git(repo, 'config', 'core.excludesFile', excludes);
  fs.writeFileSync(path.join(repo, 'README.md'), 'base\n');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'base');
  const wtRoot = path.join(home, 'worktrees');
  fs.mkdirSync(wtRoot);
  return { repo, wtRoot };
}

function addWorktree(repo, wtRoot, name) {
  const wtPath = path.join(wtRoot, name);
  assertBounded(wtPath);
  git(repo, 'worktree', 'add', '-q', wtPath, '-b', `agent/${name}`, 'main');
  return wtPath;
}

test('links the base node_modules into an isolated worktree', async () => {
  const { repo, wtRoot } = makeHarness();
  const baseNodeModules = path.join(repo, 'node_modules');
  fs.mkdirSync(baseNodeModules);
  fs.writeFileSync(path.join(baseNodeModules, 'sentinel.txt'), 'base\n');
  const wtPath = addWorktree(repo, wtRoot, 'agent-a');

  const result = await linkWorktreeDeps(repo, wtPath);

  assert.deepEqual(result, { ok: true, skipped: false });
  const worktreeNodeModules = path.join(wtPath, 'node_modules');
  assert.equal(fs.lstatSync(worktreeNodeModules).isSymbolicLink(), true);
  assert.equal(fs.readlinkSync(worktreeNodeModules), baseNodeModules);
  assert.equal(fs.readFileSync(path.join(worktreeNodeModules, 'sentinel.txt'), 'utf8'), 'base\n');
});

test('skips linking when the base checkout has no node_modules', async () => {
  const { repo, wtRoot } = makeHarness();
  const wtPath = addWorktree(repo, wtRoot, 'agent-b');

  const result = await linkWorktreeDeps(repo, wtPath);

  assert.deepEqual(result, { ok: true, skipped: true });
  assert.throws(() => fs.lstatSync(path.join(wtPath, 'node_modules')), /ENOENT/);
});

test('does not replace an existing worktree node_modules entry', async () => {
  const { repo, wtRoot } = makeHarness();
  fs.mkdirSync(path.join(repo, 'node_modules'));
  const wtPath = addWorktree(repo, wtRoot, 'agent-c');
  const worktreeNodeModules = path.join(wtPath, 'node_modules');
  fs.mkdirSync(worktreeNodeModules);
  fs.writeFileSync(path.join(worktreeNodeModules, 'own.txt'), 'own\n');

  const result = await linkWorktreeDeps(repo, wtPath);

  assert.deepEqual(result, { ok: true, skipped: true });
  assert.equal(fs.lstatSync(worktreeNodeModules).isSymbolicLink(), false);
  assert.equal(fs.readFileSync(path.join(worktreeNodeModules, 'own.txt'), 'utf8'), 'own\n');
});

test('does not follow the dependency symlink when removing a worktree', async () => {
  const { repo, wtRoot } = makeHarness();
  const baseNodeModules = path.join(repo, 'node_modules');
  fs.mkdirSync(baseNodeModules);
  const sentinel = path.join(baseNodeModules, 'must-survive.txt');
  fs.writeFileSync(sentinel, 'still here\n');
  const wtPath = addWorktree(repo, wtRoot, 'agent-d');

  assert.deepEqual(await linkWorktreeDeps(repo, wtPath), { ok: true, skipped: false });
  const worktreeNodeModules = path.join(wtPath, 'node_modules');
  assert.equal(fs.lstatSync(worktreeNodeModules).isSymbolicLink(), true, 'symlink must exist before removal');
  assert.deepEqual(await removeWorktree(repo, wtPath), { ok: true });

  assert.equal(fs.existsSync(wtPath), false);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'still here\n');
});

test('leaves a dangling worktree dependency symlink untouched', async () => {
  const { repo, wtRoot } = makeHarness();
  fs.mkdirSync(path.join(repo, 'node_modules'));
  const wtPath = addWorktree(repo, wtRoot, 'agent-e');
  const worktreeNodeModules = path.join(wtPath, 'node_modules');
  const missing = path.join(repo, 'does-not-exist');
  directoryLink(missing, worktreeNodeModules);

  const result = await linkWorktreeDeps(repo, wtPath);

  assert.deepEqual(result, { ok: true, skipped: true });
  assert.equal(fs.readlinkSync(worktreeNodeModules), missing);
});

test('reports a failed link without throwing', async () => {
  const { repo } = makeHarness();
  fs.mkdirSync(path.join(repo, 'node_modules'));
  const notADirectory = path.join(repo, 'not-a-directory');
  fs.writeFileSync(notADirectory, 'file\n');

  const result = await linkWorktreeDeps(repo, notADirectory);

  assert.equal(result.ok, false);
  assert.match(result.error, process.platform === 'win32' ? /ENOENT|ENOTDIR/ : /EEXIST|ENOTDIR/);
  assert.equal(fs.readFileSync(notADirectory, 'utf8'), 'file\n');
  assert.equal(fs.lstatSync(path.join(repo, 'node_modules')).isDirectory(), true);
});

test('removes only the linked dependencies before checking worktree status', async () => {
  const { repo, wtRoot } = makeHarness();
  const baseNodeModules = path.join(repo, 'node_modules');
  fs.mkdirSync(baseNodeModules);
  fs.writeFileSync(path.join(baseNodeModules, 'sentinel.txt'), 'preserve\n');
  const wtPath = addWorktree(repo, wtRoot, 'agent-f');
  const worktreeNodeModules = path.join(wtPath, 'node_modules');

  assert.deepEqual(await linkWorktreeDeps(repo, wtPath), { ok: true, skipped: false });
  assert.notEqual(git(wtPath, 'status', '--porcelain'), '', 'the unignored link makes the worktree dirty');

  assert.deepEqual(await unlinkWorktreeDeps(repo, wtPath), { ok: true, removed: true });
  assert.throws(() => fs.lstatSync(worktreeNodeModules), /ENOENT/);
  assert.equal(git(wtPath, 'status', '--porcelain'), '', 'removing the link restores a clean worktree');
  assert.equal(fs.existsSync(baseNodeModules), true, 'the base dependencies must remain');
  assert.equal(fs.readFileSync(path.join(baseNodeModules, 'sentinel.txt'), 'utf8'), 'preserve\n');
});

test('does not remove a real worktree node_modules directory', async () => {
  const { repo, wtRoot } = makeHarness();
  fs.mkdirSync(path.join(repo, 'node_modules'));
  const wtPath = addWorktree(repo, wtRoot, 'agent-g');
  const worktreeNodeModules = path.join(wtPath, 'node_modules');
  fs.mkdirSync(worktreeNodeModules);
  const sentinel = path.join(worktreeNodeModules, 'must-survive.txt');
  fs.writeFileSync(sentinel, 'worktree dependencies\n');

  const result = await unlinkWorktreeDeps(repo, wtPath);
  assert.equal(fs.lstatSync(worktreeNodeModules).isDirectory(), true);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'worktree dependencies\n');
  assert.deepEqual(result, { ok: true, removed: false });
});

test('does not remove a worktree node_modules link to another directory', async () => {
  const { repo, wtRoot } = makeHarness();
  fs.mkdirSync(path.join(repo, 'node_modules'));
  const foreignNodeModules = path.join(repo, 'foreign-node-modules');
  fs.mkdirSync(foreignNodeModules);
  const sentinel = path.join(foreignNodeModules, 'must-survive.txt');
  fs.writeFileSync(sentinel, 'foreign dependencies\n');
  const wtPath = addWorktree(repo, wtRoot, 'agent-h');
  const worktreeNodeModules = path.join(wtPath, 'node_modules');
  directoryLink(foreignNodeModules, worktreeNodeModules);

  const result = await unlinkWorktreeDeps(repo, wtPath);
  assert.equal(fs.lstatSync(worktreeNodeModules).isSymbolicLink(), true);
  assert.equal(fs.readlinkSync(worktreeNodeModules), foreignNodeModules);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'foreign dependencies\n');
  assert.deepEqual(result, { ok: true, removed: false });
});

test('wires dependency linking into successful isolated worktree creation', () => {
  const indexSource = fs.readFileSync(path.join(__dirname, '..', 'src/main/index.ts'), 'utf8');
  const activeSource = indexSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

  assert.match(activeSource, /from ['"]\.\/worktreeDeps['"]/);
  const successBranch = activeSource.slice(
    activeSource.indexOf('if (wt.ok)'),
    activeSource.indexOf('} else {', activeSource.indexOf('if (wt.ok)'))
  );
  assert.match(successBranch, /await linkWorktreeDeps\(origCwd, wtPath\)/);
});

test('removes linked dependencies before worker retention checks', () => {
  const indexSource = fs.readFileSync(path.join(__dirname, '..', 'src/main/index.ts'), 'utf8');
  const activeSource = indexSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

  const beforeRetention = activeSource.slice(0, activeSource.indexOf('const work = await worktreeHasUnintegratedWork'));
  assert.match(beforeRetention, /await unlinkWorktreeDeps\(origCwd, wtPath\)/);
  const beforeGc = activeSource.slice(0, activeSource.indexOf('safe = await worktreeIsGcSafe'));
  assert.match(beforeGc, /await unlinkWorktreeDeps\(e\.origCwd, e\.wtPath\)/);
  const finalization = activeSource.slice(activeSource.indexOf('async function finalizeWorkerWorktree'),
    activeSource.indexOf('const work = await worktreeHasUnintegratedWork'));
  assert.match(finalization, /if \(!deps\.ok\)\s*\{[^}]*return;/, 'unlink failure must preserve the worker tree before retention/removal');
});

test('refuses unknown dependency and nested directory links without touching either target', async () => {
  for (const nested of [false, true]) {
    const { repo, wtRoot } = makeHarness();
    const base = path.join(repo, 'node_modules');
    fs.mkdirSync(base); fs.writeFileSync(path.join(base, 'base.txt'), 'base\n');
    const foreign = path.join(repo, 'foreign');
    fs.mkdirSync(foreign); fs.writeFileSync(path.join(foreign, 'foreign.txt'), 'foreign\n');
    const wtPath = addWorktree(repo, wtRoot, nested ? 'nested-link' : 'foreign-deps');
    const originalReadme = fs.readFileSync(path.join(wtPath, 'README.md'));
    let link = path.join(wtPath, 'node_modules');
    if (nested) {
      assert.deepEqual(await linkWorktreeDeps(repo, wtPath), { ok: true, skipped: false });
      fs.mkdirSync(path.join(wtPath, 'assets'));
      link = path.join(wtPath, 'assets', 'shared');
    }
    directoryLink(foreign, link);
    const result = await removeWorktree(repo, wtPath);
    assert.equal(result.ok, false); assert.match(result.error, /unverified worktree link/);
    assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
    assert.equal(fs.readFileSync(path.join(foreign, 'foreign.txt'), 'utf8'), 'foreign\n');
    assert.equal(fs.readFileSync(path.join(base, 'base.txt'), 'utf8'), 'base\n');
    assert.deepEqual(fs.readFileSync(path.join(wtPath, 'README.md')), originalReadme);
    assert(git(repo, 'worktree', 'list', '--porcelain').includes(wtPath.replaceAll('\\', '/')));
  }
});

test('refuses dangling dependency links instead of treating an unknown target as absent', async () => {
  const { repo, wtRoot } = makeHarness();
  fs.mkdirSync(path.join(repo, 'node_modules'));
  const wtPath = addWorktree(repo, wtRoot, 'dangling');
  const originalReadme = fs.readFileSync(path.join(wtPath, 'README.md'));
  const link = path.join(wtPath, 'node_modules');
  directoryLink(path.join(repo, 'missing'), link);
  assert.equal((await unlinkWorktreeDeps(repo, wtPath)).ok, false);
  assert.equal((await removeWorktree(repo, wtPath)).ok, false);
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.deepEqual(fs.readFileSync(path.join(wtPath, 'README.md')), originalReadme);
});

test('rejects primary and unregistered paths before detaching any dependency link', async () => {
  const { repo, wtRoot } = makeHarness();
  fs.mkdirSync(path.join(repo, 'node_modules'));
  const unregistered = path.join(wtRoot, 'not-registered');
  fs.mkdirSync(unregistered);
  assert.deepEqual(await linkWorktreeDeps(repo, unregistered), { ok: true, skipped: false });
  for (const target of [repo, unregistered, path.join(wtRoot, 'missing')]) {
    assertBounded(target);
    const result = await removeWorktree(repo, target);
    assert.equal(result.ok, false); assert.match(result.error, /unregistered or primary/);
  }
  assert.equal(fs.lstatSync(path.join(unregistered, 'node_modules')).isSymbolicLink(), true);
  assert.equal(fs.readFileSync(path.join(repo, 'README.md'), 'utf8'), 'base\n');
});

test('refuses a linked worktree root without following it', async () => {
  const { repo, wtRoot } = makeHarness();
  const wtPath = addWorktree(repo, wtRoot, 'linked-root');
  const originalReadme = fs.readFileSync(path.join(wtPath, 'README.md'));
  const moved = path.join(wtRoot, 'moved-root');
  assertBounded(wtPath); assertBounded(moved);
  fs.renameSync(wtPath, moved);
  directoryLink(moved, wtPath);
  const result = await removeWorktree(repo, wtPath);
  assert.equal(result.ok, false); assert.match(result.error, /root is not a real directory/);
  assert.equal(fs.lstatSync(wtPath).isSymbolicLink(), true);
  assert.deepEqual(fs.readFileSync(path.join(moved, 'README.md')), originalReadme);
});

test('refuses a worktree reached through an ancestor junction', async () => {
  const { repo, wtRoot } = makeHarness();
  const wtPath = addWorktree(repo, wtRoot, 'linked-parent');
  const originalReadme = fs.readFileSync(path.join(wtPath, 'README.md'));
  const movedParent = path.join(path.dirname(wtRoot), 'moved-worktrees');
  assertBounded(wtRoot); assertBounded(movedParent);
  fs.renameSync(wtRoot, movedParent);
  directoryLink(movedParent, wtRoot);
  const result = await removeWorktree(repo, wtPath);
  assert.equal(result.ok, false); assert.match(result.error, /path resolves through a link/);
  assert.equal(fs.lstatSync(wtRoot).isSymbolicLink(), true);
  assert.deepEqual(fs.readFileSync(path.join(wtPath, 'README.md')), originalReadme);
});

test('retention and GC still preserve dirty and unintegrated work', async () => {
  const { repo, wtRoot } = makeHarness();
  const wtPath = addWorktree(repo, wtRoot, 'retained');
  const file = path.join(wtPath, 'work.txt');
  fs.writeFileSync(file, 'valuable work\n');
  assert.equal((await worktreeHasUnintegratedWork(wtPath, 'main')).keep, true);
  assert.equal((await worktreeIsGcSafe(wtPath, 'main')).gc, false);
  git(wtPath, 'add', '.'); git(wtPath, 'commit', '-qm', 'unintegrated');
  const retained = await worktreeHasUnintegratedWork(wtPath, 'main');
  assert.equal(retained.keep, true); assert.equal(retained.dirty, false); assert.equal(retained.ahead, 1);
  assert.equal((await worktreeIsGcSafe(wtPath, 'main')).gc, false);
  assert.equal((await worktreeHasUnintegratedWork(wtPath, 'missing-base')).keep, true);
  assert.equal((await worktreeIsGcSafe(wtPath, 'missing-base')).gc, false);
  assert.equal(fs.readFileSync(file, 'utf8'), 'valuable work\n');
});

test('worker finalization retains cleanup refusals for GC retry and user notice', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/main/index.ts'), 'utf8');
  const start = source.indexOf('async function finalizeWorkerWorktree(');
  const end = source.indexOf('/** The hive scratch dir', start);
  assert(start >= 0 && end > start);
  const compiled = require('typescript').transpileModule(source.slice(start, end), {
    compilerOptions: { target: require('typescript').ScriptTarget.ES2022 }
  }).outputText;
  for (const failure of ['unlink', 'remove']) {
    const retained = new Map(), notices = [];
    let retentionChecks = 0, removalCalls = 0;
    const finalizer = new Function('preservedWorktrees', 'workerScratchDir', 'informGod', 'unlinkWorktreeDeps',
      'worktreeHasUnintegratedWork', 'removeWorktree', 'console', compiled + '; return finalizeWorkerWorktree;')(
      retained, () => 'retained-scratch', (...args) => notices.push(args),
      async () => failure === 'unlink' ? { ok: false, error: 'unlink refused' } : { ok: true, removed: true },
      async () => { retentionChecks++; return { keep: false }; },
      async () => { removalCalls++; return { ok: false, error: 'removal refused' }; },
      { error() {}, warn() {} });
    const worker = { workerId: 'worker', baseBranch: 'main', slack: undefined };
    await finalizer('registered-tree', 'base', worker);
    assert.equal(retained.get('registered-tree').workerId, worker.workerId);
    assert.equal(retained.get('registered-tree').scratchDir, 'retained-scratch');
    assert.equal(notices.length, 1);
    assert.match(notices[0][0], /worktree preserved/);
    assert.equal(retentionChecks, failure === 'unlink' ? 0 : 1);
    assert.equal(removalCalls, failure === 'unlink' ? 0 : 1);
  }
});

test('uses a Windows junction for the directory link', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/main/worktreeDeps.ts'), 'utf8');

  assert.match(source, /process\.platform === ['"]win32['"] \? ['"]junction['"] :/);
});
