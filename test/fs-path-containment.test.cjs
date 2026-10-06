'use strict';

/**
 * The workspace root is the confinement boundary for the file IPC: the renderer
 * may only reach files INSIDE the selected workspace.
 *
 * A purely lexical containment check cannot enforce that. `resolve`/`normalize`/
 * `relative` are string math — they know nothing about symlinks — while the
 * `readFile`/`writeFile`/`readdir` that runs afterwards is resolved by the
 * kernel, which DOES follow them. So a symlink planted inside the workspace
 * (agent-generated content and cloned repos both routinely contain them) reads
 * as an in-root relative name to the guard and as an external file to the sink.
 *
 * These tests pin the boundary against that: every escape below must be refused
 * by the shared guard, on every consumer of it, while ordinary in-workspace
 * reads and writes keep working.
 *
 * The boundary is the workspace, not "no symlinks at all" — a link to a target
 * that is itself inside the workspace is followed — so the legitimate case is
 * pinned here too, in both directions.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const loadTs = require('./load-ts.cjs');

const { readFileText, readFileBinary, writeFileText, listDir } = loadTs('src/main/fs.ts');
const { getDiff } = loadTs('src/main/git.ts');

const SECRET = 'external-secret-contents\n';

/**
 * A throwaway workspace with an `outside` sibling standing in for the rest of
 * the user's filesystem. Every symlink here points at that sibling — no test
 * touches a real file outside its own temp dir.
 */
function makeWorkspace(t, kind) {
  const tempRoot = path.resolve(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(tempRoot, 'path-containment-'));
  const root = path.join(dir, 'workspace');
  const outside = path.join(dir, 'outside');
  // Register before any setup can fail. Unlink fixture-owned junctions first;
  // recursive cleanup must never follow their external targets.
  t.after(() => {
    const resolved = path.resolve(dir), relative = path.relative(tempRoot, resolved);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    assert.ok(path.basename(resolved).startsWith('path-containment-'));
    if (fs.existsSync(root)) for (const name of fs.readdirSync(root)) {
      const entry = path.join(root, name);
      if (fs.lstatSync(entry).isSymbolicLink()) fs.unlinkSync(entry);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(outside, 'dir'), { recursive: true });
  fs.writeFileSync(path.join(outside, 'secret.txt'), SECRET);
  fs.writeFileSync(path.join(outside, 'secret.bin'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01]));
  fs.writeFileSync(path.join(outside, 'dir', 'deep.txt'), SECRET);
  fs.writeFileSync(path.join(outside, 'overwrite-me.txt'), 'original\n');
  fs.writeFileSync(path.join(root, 'real.txt'), 'in-workspace\n');
  fs.writeFileSync(path.join(root, 'docs', 'shot.bin'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x02]));
  if (kind === 'directory') {
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(path.join(outside, 'dir'), path.join(root, 'sub'), type);
    fs.symlinkSync(path.join(root, 'docs'), path.join(root, 'docs-link'), type);
    fs.symlinkSync(path.join(outside, 'missing-dir'), path.join(root, 'dangling-dir'), type);
  }
  if (kind === 'file') {
    try {
      for (const [target, name] of [
        [path.join(outside, 'secret.txt'), 'innocent.txt'],
        [path.join(outside, 'secret.bin'), 'innocent.bin'],
        [path.join(outside, 'overwrite-me.txt'), 'notes.txt'],
        [path.join(outside, 'newly-created.txt'), 'dangling.txt'],
        [path.join(root, 'real.txt'), 'alias.txt']
      ]) fs.symlinkSync(target, path.join(root, name), 'file');
    } catch (error) {
      if (process.platform !== 'win32' || !['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
      t.skip('Windows file symlinks unavailable (' + error.code + '); run this containment case on a file-symlink-capable host. Directory-junction cases run separately.');
      return null;
    }
  }
  return { dir, root, outside };
}
function withWorkspace(t, kind, fn) {
  const ws = makeWorkspace(t, kind);
  if (ws) return fn(ws);
}

// ─── reads ──────────────────────────────────────────────────────────────────

test('a final-component symlink cannot be read as text', (t) => withWorkspace(t, 'file', async ({ root }) => {
  const res = await readFileText(root, 'innocent.txt');
  assert.equal(res.ok, false, 'a symlink out of the workspace must not be readable');
  assert.equal(res.content, undefined);
}));

test('a final-component symlink cannot be read as bytes', (t) => withWorkspace(t, 'file', async ({ root }) => {
  const res = await readFileBinary(root, 'innocent.bin');
  assert.equal(res.ok, false, 'the binary reader shares the boundary and must refuse too');
}));

test('an intermediate directory symlink cannot be read through', (t) => withWorkspace(t, 'directory', async ({ root }) => {
  const res = await readFileText(root, 'sub/deep.txt');
  assert.equal(res.ok, false, 'the escape can be any component, not just the last one');
}));

// ─── writes ─────────────────────────────────────────────────────────────────

test('a final-component symlink cannot be written through', (t) => withWorkspace(t, 'file', async ({ root, outside }) => {
  const target = path.join(outside, 'overwrite-me.txt');
  const before = fs.readFileSync(target, 'utf8');
  const res = await writeFileText(root, 'notes.txt', 'clobbered\n');
  assert.equal(res.ok, false, 'writing through a symlink must be refused');
  assert.equal(fs.readFileSync(target, 'utf8'), before, 'the external file must be untouched');
}));

test('a dangling symlink cannot be used to create a file outside the workspace', (t) =>
  withWorkspace(t, 'file', async ({ root, outside }) => {
    // The link target does not exist, so `realpath` cannot see where this leads —
    // canonicalization alone would let the write through and CREATE the external
    // file. Only an lstat walk (and an O_NOFOLLOW open) catches this one.
    const res = await writeFileText(root, 'dangling.txt', 'created outside\n');
    assert.equal(res.ok, false, 'a dangling symlink is still a symlink');
    assert.equal(
      fs.existsSync(path.join(outside, 'newly-created.txt')), false,
      'no file may be created outside the workspace'
    );
  }));

// ─── the other consumers of the same guard ──────────────────────────────────

test('listDir cannot list a directory outside the workspace', (t) => withWorkspace(t, 'directory', async ({ root }) => {
  const res = await listDir(root, 'sub');
  assert.equal(res.ok, false, 'the directory listing shares the boundary');
}));

test('the git diff path check refuses a symlink escape', (t) => withWorkspace(t, 'file', async ({ root }) => {
  const res = await getDiff(root, 'innocent.txt');
  assert.equal(res.ok, false, 'git path operations validate against the same boundary');
  assert.equal(res.working, undefined, 'the external file contents must never be returned');
}));

// ─── and ordinary workspace use still works ─────────────────────────────────

test('ordinary in-workspace reads and writes still succeed', (t) => withWorkspace(t, 'none', async ({ root }) => {
  const text = await readFileText(root, 'real.txt');
  assert.equal(text.ok, true, text.ok ? '' : text.error);
  assert.equal(text.content, 'in-workspace\n');

  const bin = await readFileBinary(root, 'docs/shot.bin');
  assert.equal(bin.ok, true, bin.ok ? '' : bin.error);
  assert.equal(bin.size, 6);

  const created = await writeFileText(root, 'docs/new.txt', 'hello\n');
  assert.equal(created.ok, true, created.ok ? '' : created.error);
  assert.equal(fs.readFileSync(path.join(root, 'docs', 'new.txt'), 'utf8'), 'hello\n');

  const overwritten = await writeFileText(root, 'real.txt', 'replaced\n');
  assert.equal(overwritten.ok, true, overwritten.ok ? '' : overwritten.error);
  assert.equal(fs.readFileSync(path.join(root, 'real.txt'), 'utf8'), 'replaced\n');

  const listed = await listDir(root, 'docs');
  assert.equal(listed.ok, true, listed.ok ? '' : listed.error);
  assert.ok(listed.entries.some((e) => e.name === 'shot.bin'));
}));

test('an in-workspace file symlink to an in-workspace target is followed, not refused', (t) =>
  withWorkspace(t, 'file', async ({ root }) => {
    // The boundary is the workspace, not "no symlinks at all": a link whose
    // target is itself inside the workspace reaches nothing the caller could not
    // already reach by its real name. Refusing it would make an ordinary
    // node_modules or monorepo checkout unbrowsable for no security gain. This
    // pins that so the policy cannot be flipped by accident.
    const viaLink = await readFileText(root, 'alias.txt');
    assert.equal(viaLink.ok, true, viaLink.ok ? '' : viaLink.error);
    assert.equal(viaLink.content, 'in-workspace\n');
    assert.equal(
      viaLink.path, path.join(fs.realpathSync(root), 'real.txt'),
      'the link resolves to the canonical path of its target, not to the link'
    );


  }));

test('the git diff read refuses a final component swapped for a symlink mid-call', {
  skip: process.platform === 'win32' ? 'needs a POSIX shell shim and symlinks' : false
}, (t) => withWorkspace(t, 'file', async ({ root, outside, dir }) => {
  // Validating a path and then reading it are two separate resolutions, and the
  // kernel redoes the lookup at open time. `getDiff` runs `git show HEAD:<path>`
  // between the two, so shadowing `git` with a script that plants the symlink
  // puts an attacker in exactly that window — deterministically, rather than
  // hoping to win a race. The read must refuse what it is handed, not trust that
  // the earlier check still holds.
  const target = path.join(root, 'real.txt');
  const binDir = path.join(dir, 'bin');
  fs.mkdirSync(binDir);
  const shim = path.join(binDir, 'git');
  fs.writeFileSync(
    shim,
    `#!/bin/sh\nrm -f '${target}'\nln -s '${path.join(outside, 'secret.txt')}' '${target}'\nexit 1\n`
  );
  fs.chmodSync(shim, 0o755);

  const savedPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${savedPath}`;
  let res;
  try {
    res = await getDiff(root, 'real.txt');
  } finally {
    process.env.PATH = savedPath;
  }

  assert.equal(fs.lstatSync(target).isSymbolicLink(), true, 'the shim must have run inside the window');
  assert.equal(res.ok, true, res.ok ? '' : res.error);
  assert.equal(res.workingExists, false, 'a symlink is not the regular file the guard cleared');
  assert.equal(res.working, '', 'the external file contents must never reach the renderer');
}));

test('lexical traversal out of the root is still rejected', (t) => withWorkspace(t, 'none', async ({ root, dir }) => {
  for (const rel of ['../outside/secret.txt', 'docs/../../outside/secret.txt', path.join(dir, 'outside', 'secret.txt')]) {
    const res = await readFileText(root, rel);
    assert.equal(res.ok, false, `${rel} must not be readable`);
    assert.equal(res.error, 'path escapes root');
  }
}));


test('an in-workspace directory link remains readable and listable', (t) => withWorkspace(t, 'directory', async ({ root }) => {
  const listed = await listDir(root, 'docs-link');
  assert.equal(listed.ok, true, listed.error);
  assert.ok(listed.entries.some(e => e.name === 'shot.bin'));
  const bytes = await readFileBinary(root, 'docs-link/shot.bin');
  assert.equal(bytes.ok, true, bytes.error);
  assert.equal(bytes.size, 6);
}));

test('directory links cannot bypass write or git-diff containment', (t) => withWorkspace(t, 'directory', async ({ root, outside }) => {
  const target = path.join(outside, 'dir', 'deep.txt');
  const before = fs.readFileSync(target, 'utf8');
  const write = await writeFileText(root, 'sub/deep.txt', 'clobbered\n');
  assert.equal(write.ok, false);
  assert.equal(fs.readFileSync(target, 'utf8'), before);
  const diff = await getDiff(root, 'sub/deep.txt');
  assert.equal(diff.ok, false);
  assert.equal(diff.working, undefined);
}));

test('a dangling directory link cannot create content outside the workspace', (t) => withWorkspace(t, 'directory', async ({ root, outside }) => {
  const write = await writeFileText(root, 'dangling-dir/new.txt', 'external\n');
  assert.equal(write.ok, false);
  assert.equal(fs.existsSync(path.join(outside, 'missing-dir')), false);
}));
