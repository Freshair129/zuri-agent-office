---
status: active
superseded_by: null
version: 0.1.0
---

# Windows worktree dependency junction removal

Authorization: approved `docs/ZURI-STABILIZATION-PLAN.md` 0.2.0. Complexity C-3, risk HIGH. Parent: MVP persistence/data preservation. Peers: existing dependency-link helper, Git worktree retention/GC guards and lifecycle tests. This RCA was written after reproduction and before production fixes.

## Symptom

Removing a disposable linked worktree deletes `must-survive.txt` inside the base checkout's `node_modules`. The worktree removal reports success. Four other worktree tests fail on this Windows host for fixture/platform reasons; those must not obscure the data-loss failure.

## Evidence

- Fresh baseline: `output/stabilization/worktree-deps-before.log`: 12 tests, **7 pass, 5 fail, 0 skip**. The failing parent sentinel is inside `output/stabilization/worktree-junction/md-worktree-deps-kVIqHL/repo/node_modules`.
- `output/stabilization/worktree-junction-before.json` records source HEAD, source/test SHA256 hashes, log hash, Node and Git versions. Git is `2.53.0.windows.2`.
- Controlled comparison: `output/stabilization/reproduce-junction.cjs` and `junction-comparison-before.json`. Both repositories are fresh children of the validated absolute QA root `O:/testzuri/zuri-agent-office/output/stabilization/worktree-junction`. No real repository or user dependency tree was removed.
- With the junction present, direct `git worktree remove --force` removed the worktree **and the base sentinel**. With the same junction first detached by existing `unlinkWorktreeDeps`, Git removed the worktree and left the base sentinel byte-for-byte unchanged. These observations isolate junction traversal in Git removal on this platform.
- `removeWorktree` invokes Git directly. Normal agent teardown calls it without detaching dependencies. Worker finalization detaches first but logs and continues on detachment errors. Preserved-worker GC already stops on detachment failure. All three call paths converge on `removeWorktree`; no other product removal caller was found.

## Root cause

The app creates a Windows directory junction to shared base dependencies, but its central removal operation passes the tree directly to Git's recursive worktree removal. On the observed Windows Git version, that removal follows the junction and deletes target contents. Protection exists only in two callers, not at the shared destructive operation. The ordinary teardown path therefore bypasses it. Continuing after a dependency-detachment error creates a second unsafe path.

The other four baseline failures are separate: two fixture `symlinkSync` calls omit the Windows directory-junction type and fail with EPERM before assertions; a file-as-parent link error is ENOENT on Windows rather than the POSIX-only expected error set; and the host's global Git excludes file ignores `node_modules/`, confirmed with `git check-ignore -v`, so the status fixture was not actually unignored. The first corrected run exposed the same global-ignore dependency even with a non-empty sentinel and system `core.autocrlf=true` in three new byte-preservation assertions. Disposable repositories now explicitly disable automatic line conversion and use a local empty excludes file. No machine or user configuration is changed. Fixtures use actual directory links and non-empty sentinels and retain exact preservation/status assertions.

## Why the issue escaped detection

The regression existed but its failure was mixed with platform setup failures. The code assumed Git deletion treated Windows junctions like POSIX symlinks. Dependency removal before worker retention checks did not cover ordinary teardown, and the shared remove operation had no link preflight. A passing Git exit code was treated as successful cleanup without proving external target preservation.

## Proposed prevention

1. Before mutating anything, require a registered non-primary worktree in the requested Git family. Reject missing, unknown or linked worktree roots.
2. Preflight the worktree using `lstat` without traversing links. Permit only the verified top-level dependency link to the base checkout, detach that link non-recursively, and refuse unknown/dangling/nested links. Any uncertainty must return an error before Git removal. Real directories remain untouched by the dependency helper; unknown links and their targets remain intact on refusal.
3. Centralize this protection in `removeWorktree` so every caller receives it. Keep existing dirty/unintegrated-work gates unchanged. Worker finalization must return on dependency-unlink errors, matching GC.
4. Regress parent-sentinel survival, unrelated and nested link targets, dangling links, invalid/main/unregistered paths, real directories, and preservation of caller retention guards. Use real Windows junctions without changing machine security settings or broadly skipping protection tests.

## Verification status

Integration review found that `teardownPty` clears live worktree bookkeeping before `finalizeWorkerWorktree`. An early return on cleanup refusal preserves files but would leave the retained tree absent from `preservedWorktrees`. The finalizer must register retained metadata and emit its existing preservation notice on dependency-detach or central removal refusal, so the existing GC retry and user visibility remain available. This bounded correction is part of the new refusal behavior, not a change to retention criteria.

Implemented: central registered/non-primary membership validation, real root/ancestor-path checks, no-follow link preflight, verified dependency detachment and fail-closed removal. Existing real-directory/foreign-link preservation remains intact, and dangling target uncertainty now returns an error. The lead implemented retained bookkeeping and existing user notices for finalizer cleanup refusals.

Focused verification on Windows: `output/stabilization/worktree-focused-final.log` initially recorded 24/24 PASS (18 worktree + 6 Git status), zero skips, including parent/foreign sentinels, dangling/nested/root/ancestor links, byte-preserving refusal, and unchanged dirty/ahead/unknown-base retention. Node TypeScript and diff checks passed. The final `worktree-focused-with-finalizer.log` records **25/25 PASS (19 worktree + 6 Git status), zero failures/skips** and additionally executes the actual finalizer function with controlled unlink/removal refusals to verify retained metadata, one preservation notice and no later destructive call. Earlier failed test attempts are retained as `worktree-deps-after.log` and `worktree-deps-after-2.log`; the latter passed 16/16 before the extra regression cases. No real user worktree lifecycle has been exercised.
