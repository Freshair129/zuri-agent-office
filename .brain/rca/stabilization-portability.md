---
status: active
superseded_by: null
---

# Stabilization portability RCA

Scope: approved `docs/ZURI-STABILIZATION-PLAN.md`, excluding the separate worktree-dependency lifecycle lane. Complexity C-3 overall; these changes are bounded test/documentation corrections. No schema, provider, telemetry, remote-refresh or filesystem-security policy changes.

## Symptom

The isolated seven-file baseline reports82 tests:61 PASS,17 FAIL,4 SKIP. Evidence: `output/stabilization-portability-before.log`, with TEMP/TMP on O:.

## Evidence and confirmed causes

| Group | Evidence | Root cause |
|---|---|---|
|10 containment fixtures|Every failure originates at the first `fs.symlinkSync` in `makeWorkspace`, before the read/write/list/diff assertion. An isolated link probe reports directory `junction SUPPORTED`, file `EPERM`.|A shared fixture creates every file and directory link for every test, including ordinary-file and lexical-traversal tests that need no links. Windows file-symlink privilege is unavailable; directory junction coverage need not be skipped.|
|4 source assertions|Actual `disableArabicRendering` deregisters its joiner, removes its class and detaches spacing. The live switch does not dispose a terminal. Actual Command Center cap handler calls atomic IPC. Composer/steer seams are present. Their source contains CRLF while extraction/regex delimiters require LF.|Raw line endings change test parsing: a missing terminator causes the Arabic sweep slice to absorb unrelated later disposal code, the cap extraction returns an invalid boundary, and two telemetry adjacency regexes reject CRLF.|
|1 path expectation|`config.writeConfig` deliberately runs every registered repo through `expandTilde`, which resolves an absolute platform-native path. The test writes `/workspace/project` but expects that POSIX spelling on Windows.|The assertion contradicts the existing ingestion contract; this cap-merging test should use a native absolute disposable path.|
|1 late-root hook bind|Production `HiveManager.sockPath` derives a hashed `\\.\pipe\` endpoint on Windows. The late-root test substitutes `path.join(root,'hooks.sock')`, producing EACCES.|The fixture bypasses the exact production transport it purports to test. Use a real lazily rooted HiveManager and assert an actual request/reply after root activation.|
|1 catalog consistency|`loadModelCatalog` unconditionally returns null/stale under the approved offline contract. Renderer configuration imports `src/shared/modelCatalog.json`; `docs/model-catalog.json` contains additional upstream rows and instructions promising network refresh.|The old remote-publication document drifted from the bundled catalog and retained obsolete delivery instructions. The bundled file is the local source of truth; synchronize the documented mirror without altering model selection or enabling network refresh.|

## Why these escaped detection

The inherited fixtures assumed POSIX symlink privileges, Unix sockets, slash paths and LF checkouts. Shared setup coupled unrelated security tests to the strongest platform capability. Runtime source behavior was not distinguished from source-text parsing. Catalog publication comments were not revised with the fork's explicit offline contract.

## Proposed correction and prevention

- Split containment setup by capability. Run real unprivileged directory-junction escape/read/write/list/diff and in-root positive cases on Windows. Keep file-symlink tests with explicit capability skips only for known unsupported/permission errors, and retain POSIX race coverage as a separate existing skip. Missing file-link coverage remains NOT_RUN, never PASS; rerun on a symlink-capable host/CI.
- Register cleanup immediately, unlink only fixture-owned links before recursive cleanup, and verify the resolved fixture path is inside its temporary root. Never weaken `safeResolve` or external-file sentinel assertions.
- Normalize CRLF only in test source readers and assert extraction boundaries exist. Preserve behavioral seam assertions and disabled product telemetry/refresh.
- Use a native absolute repo fixture for the atomic-cap test; exercise real `HiveManager.sockPath` in the late-root hook test.
- Reconcile only the documentation catalog mirror and its local-source instructions; keep packaged catalog bytes unchanged.
- Run these focused regressions and the existing disabled-telemetry/remote-refresh tests. The integrator owns one full-suite run after both lanes converge.

## Implemented result and exact accounting

Focused command (TEMP/TMP and npm cache on O:):

```text
node --test test/fs-path-containment.test.cjs test/agent-token-cap.test.cjs test/arabic-terminal.test.cjs test/hire-import.test.cjs test/hooks-socket.test.cjs test/model-catalog-remote.test.cjs test/telemetry-message-count.test.cjs test/zuri-runtime.test.cjs
```

Final evidence: `output/stabilization-portability-after.log` —90 total,80 PASS,0 FAIL,10 SKIP. Diff whitespace check PASS. The baseline seven files had82 total; the final command adds3 directory-link security cases and5 existing offline-runtime contract checks. No full-suite or packaged-runtime result is claimed by this lane.

| Original failure group | PASS after correction | Explicit capability SKIP |
|---|---:|---:|
|Containment fixtures (10)|4|6|
|Source-text assertions (4)|4|0|
|Native registered-repo path (1)|1|0|
|Late-root hook transport (1)|1|0|
|Catalog mirror consistency (1)|1|0|
|Total original17|11|6|

The6 new capability skips are final file-symlink text read, binary read, overwrite, dangling-file creation, Git diff, and legitimate in-root file-link following. Each attempt reports EPERM here and names a file-symlink-capable host as the remaining verification target. They are NOT_RUN security coverage, not PASS. The4 pre-existing skips remain unchanged:1 POSIX final-link race shim and3 Unix-socket-file lifecycle cases. The3 added passing cases verify in-root directory-link binary/list access, directory-link write/Git-diff rejection with preserved outside sentinel, and dangling-directory rejection.

Only tests and the documentation catalog mirror changed in this lane. `src/main/fs.ts`, production hook/config/telemetry/catalog code, and the bundled `src/shared/modelCatalog.json` are untouched. The exact local QA temp/log paths are excluded through `.git/info/exclude`; no generated QA profile, fixture or log should be staged. The separate worktree lifecycle lane owns its production changes and final integration accounting.
