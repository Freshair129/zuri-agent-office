import { existsSync } from 'node:fs';
import { lstat, readdir, readlink, realpath, symlink, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export type DepLink =
  | { ok: true; skipped: boolean }
  | { ok: false; error: string };

export type DepUnlink =
  | { ok: true; removed: boolean }
  | { ok: false; error: string };

async function isBaseDependencyLink(baseDir: string, worktreeDir: string): Promise<boolean> {
  const baseNodeModules = resolve(baseDir, 'node_modules');
  const worktreeNodeModules = resolve(worktreeDir, 'node_modules');
  const comparable = (path: string) => process.platform === 'win32' ? path.toLowerCase() : path;
  if (comparable(baseNodeModules) === comparable(worktreeNodeModules)) return false;
  const linkTarget = await readlink(worktreeNodeModules);
  const [baseTarget, worktreeTarget] = await Promise.all([
    realpath(baseNodeModules), realpath(resolve(worktreeDir, linkTarget))
  ]);
  return comparable(baseTarget) === comparable(worktreeTarget);
}

/** Link the base checkout's dependencies into an isolated worktree. */
export async function linkWorktreeDeps(baseDir: string, worktreeDir: string): Promise<DepLink> {
  const baseNodeModules = join(baseDir, 'node_modules');
  const worktreeNodeModules = join(worktreeDir, 'node_modules');
  if (!existsSync(baseNodeModules)) return { ok: true, skipped: true };

  try {
    await lstat(worktreeNodeModules);
    return { ok: true, skipped: true };
  } catch {
    // node_modules does not exist in this worktree yet.
  }

  try {
    await symlink(baseNodeModules, worktreeNodeModules, process.platform === 'win32' ? 'junction' : null);
    return { ok: true, skipped: false };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/** Remove the dependency link before testing whether a worktree is dirty. */
export async function unlinkWorktreeDeps(baseDir: string, worktreeDir: string): Promise<DepUnlink> {
  const worktreeNodeModules = join(worktreeDir, 'node_modules');

  let stat;
  try {
    stat = await lstat(worktreeNodeModules);
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT') return { ok: true, removed: false };
    return { ok: false, error: String(error) };
  }
  if (!stat.isSymbolicLink()) return { ok: true, removed: false };
  try {
    if (!await isBaseDependencyLink(baseDir, worktreeDir)) return { ok: true, removed: false };
    await unlink(worktreeNodeModules);
    return { ok: true, removed: true };
  } catch (error) {
    // A link was observed: a missing/unreadable target is uncertainty, not an
    // absent dependency entry. Callers must keep the worktree in this case.
    return { ok: false, error: String(error) };
  }
}

/** Git for Windows can recurse through junctions. Never hand it an unknown
 * link, and detach only our verified dependency link without touching targets. */
export async function prepareWorktreeRemoval(baseDir: string, worktreeDir: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const dependencies = join(worktreeDir, 'node_modules');
  let linkedDependencies = false;
  try {
    const root = await lstat(worktreeDir);
    if (!root.isDirectory() || root.isSymbolicLink()) throw new Error('worktree root is not a real directory');
    const physical = await realpath(worktreeDir);
    const lexical = resolve(worktreeDir);
    if (process.platform === 'win32' ? physical.toLowerCase() !== lexical.toLowerCase() : physical !== lexical)
      throw new Error('worktree path resolves through a link');
    const inspect = async (directory: string): Promise<void> => {
      for (const name of await readdir(directory)) {
        const entry = join(directory, name);
        const stat = await lstat(entry);
        if (stat.isSymbolicLink()) {
          if (entry !== dependencies || !await isBaseDependencyLink(baseDir, worktreeDir))
            throw new Error(`unverified worktree link: ${entry}`);
          linkedDependencies = true;
        } else if (stat.isDirectory()) await inspect(entry);
      }
    };
    await inspect(worktreeDir);
    if (linkedDependencies) {
      const result = await unlinkWorktreeDeps(baseDir, worktreeDir);
      if (!result.ok) return result;
      if (!result.removed) throw new Error('dependency link changed during removal preflight');
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
