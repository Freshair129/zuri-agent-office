---
status: active
superseded_by: null
---

# Baseline native dependency install

- Symptom: npm ci exits 1 before executable shims exist; typecheck/build consequently cannot find tsc/electron-vite.
- Evidence: baseline-install.log reports no better-sqlite3 prebuilt for Node 24.16.0 win32 x64, then MSB8020: ClangCL platform toolset missing. baseline-typecheck.log and baseline-build.log contain missing-command failures.
- Root cause: install first attempts a host-Node native build that this machine cannot satisfy; this is before the root Electron rebuild and before Zuri changes.
- Why escaped detection: upstream lockfile/install lifecycle does not guarantee prebuilt availability for every host Node version/toolchain.
- Proposed prevention: install locked dependency graph without lifecycle scripts, then explicitly install Electron and rebuild native modules for the actual Electron ABI; verify SQLite and PTY inside Electron. Document exact working commands. Do not suppress native failures or call a JS-only build runtime success.
