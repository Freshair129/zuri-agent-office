---
status: active
superseded_by: null
---

# Windows packaging environment failures

## Symptom and evidence

- Native PTY Electron rebuild fails MSB8040 requiring Spectre libraries (baseline-electron-rebuild.log).
- Electron install script exited zero but path.txt and executable were absent; a verified downloaded ZIP was available. No root cause is asserted for that script's incomplete extraction.
- First packaging failed writing `053991379.zip.part6`: not enough disk space (packaging.log); Get-PSDrive reported C: free 0 bytes while O: had over 2 TB.
- Retried packaging reached winCodeSign extraction but failed creating macOS dylib symlinks because this Windows account lacks that privilege (packaging-local-cache.log).

## Root causes and bounded recovery

The logged PTY compile failure is missing Spectre-mitigated build libraries. The logged packaging failures are C: cache capacity and Windows symlink privilege during extraction of unused macOS tooling. These are environment limitations preceding application behavior.

For this unsigned local development build only, compiled the generated node-pty solution with MSBuild `/p:SpectreMitigation=false`; this artifact does not have that optional mitigation. Production/release builds should install the required toolchain and rebuild normally. Loaded SQLite and exercised PTY output inside Electron 32.3.3 ABI 128 before packaging; did not infer ABI success from TypeScript.

Electron ZIP SHA256 matched its installed package checksums.json; .NET ZipFile extraction populated the local Electron distribution and path.txt. Builder reused that verified distribution. Cache/TEMP/TMP were set to ignored workspace-local directories on O:. Only this task's failed ZIP fragments were deleted; its verified Electron ZIP moved to O:. No general disk cleanup or system toolchain changes occurred.

Extracted winCodeSign's Windows tools from the builder-downloaded archive, excluding its unused `darwin` directory, into the expected cache folder. No signing certificate was configured; packaged artifacts remain unsigned. Final packaging exited zero.

## Why detection was late

Upstream lifecycle assumes host native prerequisites and default C: caches. A successful JavaScript build says nothing about C: capacity, native ABI or platform extraction permissions.

## Prevention

Use an adequately sized build cache/temp directory, supported Node/toolchain, Spectre libraries and Windows symlink privilege on a release builder. Verify Electron executable existence and both native modules; fail packaging on any error and verify actual artifacts separately. Do not treat this development workaround as release hardening evidence.
