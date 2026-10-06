---
status: active
superseded_by: null
version: 0.5.0
---

# Zuri marketing skills — delivery verification

Date: 2026-10-05. Approved contract: [ZURI-MARKETING-SKILLS.md](ZURI-MARKETING-SKILLS.md). Complexity C-2; risk MEDIUM. Result: **implemented and locally verified** for the central library, role selection, provisioning and restart scope. Live marketing model/account execution is **NOT_RUN**.

## Delivered behavior and version diff

| Surface | 0.4.0 | 0.5.0 |
| --- | --- | --- |
| Marketing collection | Not bundled | 50 pinned upstream skills with references, versions, license and hashes |
| Agent setup | Imported skill chips did not reach startup | Six editable role presets; main and renderer validate at most eight selected skills including the marketing foundation |
| Startup and restart | No marketing provisioning contract | Only selected marketing directories are provisioned; selection and source-project context survive restart and worktree isolation |
| Skills drawer | Existing installed/remote views | Searchable Zuri Marketing library with bundled, selected, provisioned and failed states |
| User edits | No marketing refresh behavior | Modified agent files are preserved; the affected skill reports provisioning failure |
| Evidence | Previous release snapshots | Snapshot **5.0.0**, 13 screenshots and three session recordings from packaged app **0.5.0** |

Roles: Marketing Lead, Content & Brand, SEO Specialist, Performance Marketing, Lifecycle & CRM, Sales & RevOps. Start at **Add agent → Briefing → Marketing role**. Inspect the result through **Agent Drawer → Skills → Zuri Marketing**. Existing core skills remain available. The installation is inside Zuri, not a global Codex/Claude installation.

Context resolves from the selected source project's `.agents/product-marketing.md`, with existing legacy paths as read compatibility fallbacks. The same source context is retained for an isolated worktree; changing the agent to a different project selects that project's context. A missing context is reported, not invented. Skill instructions do not grant tool permissions or connect accounts.

## Verification results

| Check | Result | Evidence / boundary |
| --- | --- | --- |
| Full repository test suite | **PASS: 990**, **FAIL: 0**, **SKIPPED: 20**, total 1,010 | [Final test log](../output/playwright/marketing-skills/1791205182405/checks/marketing-full-tests-final.log); existing platform/environment skips remain skipped |
| Main and renderer TypeScript checks | **PASS** | [Typecheck log](../output/playwright/marketing-skills/1791205182405/checks/marketing-typecheck-final.log) |
| Production application build | **PASS** | [Build log](../output/playwright/marketing-skills/1791205182405/checks/marketing-build-final.log) |
| Pinned upstream contents | **PASS: 291 files** | 290 skill/reference files plus LICENSE match the pinned GitHub tree's Git blob hashes; local SHA-256 values are in `origin.json` |
| Packaged resources | **PASS: 291 hashes** | Verified in the final `win-unpacked` directory before launching it |
| Relative Markdown references | **PASS within audit scope** | 319 local references: 317 resolve to files; two literal `(link)` placeholders in `sms/references/compliance.md:39` are upstream example Terms/Privacy links. External links are not an integration test |
| Role presets, selection cap and foundation | **PASS** | All six presets exercised; custom eighth selection disables further additions and protects the foundation |
| Real Electron SQLite and PTY | **PASS** | Packaged Electron 32.3.3 / ABI 128 executes SQLite `select 42`; actual local child processes receive the startup index |
| Claude / Codex / OpenCode startup adapters | **PASS with controlled fixtures** | Each provider path receives its distinct selected index. OpenCode path uses an actual isolated Git worktree. Inert Node processes stand in for model CLIs |
| Restart and project context | **PASS** | App closes and relaunches; a new process PID and live PTY restore the same seven SEO skills and source context |
| Preserve edited agent files | **PASS** | Edited QA skill content survives restart; screenshot 13 visibly reports `Provisioning failed` and the preserved path |
| Visual inspection | **PASS within feature scope** | All 13 original screenshots inspected: six role forms, custom selection, light/dark library, role search, 1100 × 800 drawer, restart and failure state. No feature-blocking clipping or overlap observed |
| Windows package generation | **PASS, unsigned** | Portable and installer built from the same prepackaged application tested above; [distribution log](../output/playwright/marketing-skills/1791205182405/checks/marketing-distribution.log) |
| Live model use, campaigns and external accounts | **NOT_RUN** | Provisioned files and delivered prompts do not prove that a model read or successfully used a skill |
| Installer installation / portable wrapper launch | **NOT_RUN** | The unpacked packaged application was launched and tested; distribution wrappers were generated and hashed |

The feature adds 11 targeted regression tests covering catalog integrity, validation, project selection/reassignment, distinct role sets, non-destructive provisioning, missing/corrupt resources, path/junction guards and all three provider bootstrap paths. The initial context reassignment regression was reproduced and corrected before final verification; see [RCA](../.brain/rca/marketing-skill-selection.md) and [the failing reproduction](../output/playwright/marketing-skills/1791205182405/checks/marketing-context-reassignment-before.log).

No known regression caused by this change remains unresolved in the verified scope. This is not a certification of every existing workflow, accessibility requirement or upstream skill's substantive advice.

## Provenance and capture identity

- Upstream: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/dda3841f0b294e01e93b1541486beefbfab0915e), commit `dda3841f0b294e01e93b1541486beefbfab0915e`, collection **2.11.17**. Individual skill versions are preserved. MIT © 2025 Corey Haines.
- Application base Git commit: `3f64ab64dd15cfc703090736fcdfa6c8001303c1` on `zuri/desktop-mvp`, **with uncommitted implementation changes**. The base commit alone does not identify this build.
- Frozen source/build/resource/legal input manifest: **607 files**, source SHA-256 `528c50abdb20b0cb9c77efa3fc4abf29e7471a199cf36faa9fc0502f46a4b561`. All recorded files were rechecked after packaging.
- Tested packaged `app.asar` SHA-256: `582418d68c0799bdd92b2af716876e8d0c0a987d280694320f904e489100a706`. It remained unchanged through the final capture and distribution build.
- Final capture directory: `output/playwright/marketing-skills/1791205182405`; app **0.5.0**, snapshot **5.0.0**. Earlier candidate runs are superseded for this delivery. The executed runner is preserved in this directory with its hash in the capture manifest.

Open the [screenshot and video gallery](../output/playwright/marketing-skills/1791205182405/index.html), [capture manifest](../output/playwright/marketing-skills/1791205182405/manifest.json), [verification data](../output/playwright/marketing-skills/1791205182405/verification.json), [source hashes](../output/playwright/marketing-skills/1791205182405/source-manifest.json) or [upstream check](../output/playwright/marketing-skills/1791205182405/upstream-verification.json).

The [snapshot ZIP](../output/playwright/marketing-skills/Zuri-0.5.0-snapshot-5.0.0.zip) includes the gallery, 13 unmodified PNGs, three recordings, manifests, executed runner and selected verification logs. Its explicit file list excludes application profiles, fixture workspaces and process records. Size **10,840,400 bytes**; SHA-256 `1c20dcd8b38cb89c87ce35505c14f65f4a9bd3a5441beb274bc876a5af8098f9`.

## Windows artifacts and build limitations

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| [Portable](../dist/marketing-0.5.0/Zuri-0.5.0-win-x64-portable.exe) | 137,405,496 | `05654976f4538e2db56e63b0d78ee76a3965080ab6d2e95324a2aa68af5b702e` |
| [Installer](../dist/marketing-0.5.0/Zuri-0.5.0-win-x64-setup.exe) | 137,629,207 | `488775481f61eca6c5975422b9c5e862bea9e0b256500a65442790c731deee0b` |

The verified unpacked executable is `dist/marketing-0.5.0/win-unpacked/Zuri.exe`. Artifacts are local development outputs, unsigned and not published. [Delivery receipt](../output/marketing-delivery-receipt.json) records artifact and evidence-file hashes.

The default Windows native rebuild initially failed for `node-pty` with **MSB8040: Spectre-mitigated libraries required**. `better-sqlite3` had rebuilt successfully for Electron 32.3.3. Packaging then used the dependency's existing Windows N-API prebuilds for PTY with a command-line `npmRebuild=false` override. The signing/editing helper also encountered Windows symlink-extraction privileges, so this unsigned build used `win.signAndEditExecutable=false`. These are local packaging overrides; normal repository configuration still requires the standard native build environment. Final packaged SQLite and actual PTY checks passed after these overrides. This does not claim the default build command succeeds on this machine.

## Repeat the verification

From the app root, with dependencies installed:

```powershell
node tools/marketing-provenance.cjs
npm run typecheck
npm run test:focused
npm run build

# Local unsigned Windows build with the documented environment workaround.
$env:TEMP = 'O:/testzuri/zuri-agent-office/output/package-temp'
$env:TMP = $env:TEMP
npx --no-install electron-builder --win --dir --publish never '-c.directories.output=dist/marketing-0.5.0' '-c.npmRebuild=false' '-c.win.signAndEditExecutable=false'

# Set this only when Playwright is supplied outside local node_modules.
$env:ZURI_PLAYWRIGHT_MODULE = 'C:/Users/freshair/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
node tools/verify-marketing-skills.cjs
npx --no-install electron-builder --win --prepackaged dist/marketing-0.5.0/win-unpacked --publish never '-c.directories.output=dist/marketing-0.5.0' '-c.npmRebuild=false' '-c.win.signAndEditExecutable=false'
```

The runner creates disposable profiles and local Git fixtures, uses controlled child processes, and closes its app sessions. It does not configure marketing credentials or run a campaign. New runs get a new timestamped capture directory; inspect the images before declaring visual acceptance.
