---
status: active
superseded_by: null
version: 0.1.0
---

# Zuri 0.1.0 verification — Windows development build

Date: 2026-10-05, Asia/Bangkok. Workspace `O:\testzuri\zuri-agent-office`; branch `zuri/desktop-mvp`. Exact upstream `428223ac55b50367e158a77c48984816dfddcc52`. Node 24.16.0, npm 11.13.0, Electron 32.3.3, ABI 128, Windows x64. No remote publication or installation into the user's normal app directory was performed.

## Gate results

| Gate | Result | Evidence and boundary |
|---|---|---|
| A baseline | Passed with existing failures | Source matched reference. `npm ci` Failed native host build; recovered locked dependency graph. Baseline typecheck/build Passed; immutable baseline tests 922 passed /26 failed /14 skipped |
| B identity/assets | Passed for inspected build | Product/version resource Zuri/0.1.0, separate userData, protocol tests, original mapped office and avatars rendered, no missing-resource/page errors. Full asset notices packaged. No upstream update feed or product analytics |
| C compile/native | Passed targeted; full suite Failed | Final typecheck and production build exit0. SQLite transaction + PTY output inside Electron32.3.3/ABI128 Passed. Final reviewed full suite941 passed /22 failed /14 skipped; all22 match upstream failures. Details in ZURI-QA.md |
| D desktop | Passed bounded workflow; model limitations remain | Packaged application launch, fresh local onboarding, local config, real CLI terminal, creating an agent, task/message persistence, stop and restart data checks Passed. Packaged UI file-read task returned exact contents at16k context; see live-model qualifications below |
| E packaging | Passed build; installation Not tested | Windows NSIS setup and portable produced, unsigned. `dist/win-unpacked/Zuri.exe` opened and exercised. Installer execution/install and portable self-extraction not tested |

This is a local development deliverable, not a claim that every upstream test or every provider/platform is accepted. The source preserves existing autonomy policy; testing did not expand agent permissions to obtain a pass.

## Commands and evidence

- `npm ci` -> Failed (baseline-install.log): Node24 better-sqlite3 prebuild unavailable; host ClangCL missing.
- `npm ci --ignore-scripts` -> Passed graph installation (baseline-install-noscripts.log). Not native verification by itself.
- `npm run typecheck`, `npm run build` before changes -> Passed after graph installation (baseline-typecheck.log, baseline-build.log).
- Immutable upstream worktree `O:\testzuri\upstream-baseline`, `npm run test:focused` -> Failed:922/26/14; dependency junction shared locked modules. Some baseline native tests ran before Electron install was repaired; baseline comparison explicitly records this.
- `npm run postinstall` -> Failed PTY compile: missing Spectre libraries. For this development artifact, MSBuild of generated node-pty binding.sln with `/p:Configuration=Release /p:Platform=x64 /p:SpectreMitigation=false` -> Passed. `node tools/ensure-pty-perms.cjs`, `node tools/patch-node-pty-conpty.cjs` -> Passed. This is not a hardened release build.
- Electron downloaded ZIP matched package SHA256 checksums; explicit extraction repaired missing executable/path.txt. No dependency/Electron version upgrade.
- Electron `tools/verify-native.cjs` -> SQLite insert/read assertion and ConPTY echo/exit assertions Passed, exit0, Electron32.3.3 ABI128.
- `npm run typecheck`, `npm run build` after final source integration -> Passed (final-typecheck.log, final-build.log).
- Full regression -> Failed as documented in runtime-qa-final-tests.log and ZURI-QA.md. UI/name/i18n/provider targeted tests after onboarding fix24/24 Passed. Runtime targeted102/102 Passed. No test skips introduced.
- `git diff --cached --check -- . ':!THIRD_PARTY_LICENSES.txt'` -> Passed. The complete staged check reports trailing whitespace only in verbatim third-party license text; that source text is preserved unchanged.
- `node tools/write-notices.cjs` ->497 installed production packages inventoried, full available notices emitted.
- Initial electron-builder failed C: cache ENOSPC; retry failed unused macOS winCodeSign symlinks. See `.brain/rca/2026-10-05-windows-packaging.md`. Only this task's cache fragments were cleaned; caches/temp redirected to O:.
- Final build: `node node_modules/electron-builder/cli.js --win --publish never --config.npmRebuild=false --config.electronDist=node_modules/electron/dist` -> exit0 (packaging-final.log), using previously verified native binaries and workspace-local builder cache/TEMP/TMP. `npmRebuild` remains true in normal config; the local workaround is an explicit command override.

## Real desktop evidence

`tools/verify-desktop.cjs` drove packaged Zuri with a fresh isolated profile, using visible UI controls from persona -> workspace -> OpenCode local endpoint/model -> permissions -> Finish. Assertions checked `godModel=local/qwen3.5:4b`, endpoint/model maps, onboarding completion, analytics/update flags false, app.isPackaged, Zuri name and isolated userData; no renderer page errors. Result: packaged-fresh-smoke.log and output/playwright/fresh-1791162721804/result.json. Screenshots: onboarding-local.png and packaged-office.png in that directory.

Earlier integrated desktop run created QA Researcher via Add Agent, selected a workspace/engine, displayed real terminal output and sent a task through the UI. An initial worker failed an external OpenCode OpenTUI DLL load (error126) while C: was full; the failure/exit was visible in terminal. Restarting the packaged app with workspace-local TEMP ran the worker. This observation is not a proved DLL root cause.

Through the real preload/main bridge, created and edited `zuri-qa-task`, sent a Hive message and stopped the PTY. A separate subsequent packaged process read back the completed task, message and agent registry. A marker manually appended to the test agent's Markdown memory was read after restart; it is filesystem persistence proof, not AI-written memory. Evidence: output/playwright/persistence-proof.json. Distinguish bridge-driven task mutation from agent autonomous task completion.

## Live model evidence

- CLI OpenCode1.18.34, Ollama0.35.1, existing local qwen3.5:4b (no model download).
- Loopback11435 basic forced tool probe Passed. Electron TUI used the actual local model and returned generated answers.
- Default short context truncated the7.6k-token CLI request to2050 tokens; file task Failed despite exit0/answer DONE. Those were not accepted as success.
- Controlled16384-context loopback11437, same CLI/model: actual `read` tool completed against proof.txt and returned its exact content, exit0. This direct-CLI tool loop Passed; it is separate from the packaged UI path. See LOCAL-PROVIDER-VERIFICATION.md and `.brain/rca/local-model-context.md`.
- Authentication against a real keyed server, LM Studio/vLLM live execution, cross-provider multi-agent handoff, optional MemPalace semantic retrieval, cloud credentials and macOS/Linux runtime are Not tested.

Final packaged UI task: created QA Reader through Add Agent, sent an absolute-path read request through its queue, observed the real read tool and exact file content `ZURI_DESKTOP_READ_PROOF_7d319c` followed by idle. Screenshot: output/playwright/zuri-packaged-task-result.png. A second nonce-file request executed read but omitted its final textual answer; captured PTY evidence records exactFinalReply=false. This variability remains a model/task limitation, so one bounded success is not a guarantee of arbitrary-task reliability. No model response that merely claimed DONE without a file/tool outcome was counted as a pass.

Durable evidence: `docs/evidence/desktop-local-live.json` contains actual tool events and the exact first answer, extracted read-only from only this QA session. It also retains the initial wrong-path failure and second request's missing final answer. Temporary QA model servers were stopped after verification; ports11435–11437 had no remaining listeners. The packaged QA application was closed.

## Artifacts

| Artifact | Bytes | SHA256 |
|---|---:|---|
| dist/Zuri-0.1.0-win-x64-setup.exe |131838097|3b90438bd177e1e228e6ce7753326430a6508e5a8388bd482700fa5f65e2f54d|
| dist/Zuri-0.1.0-win-x64-portable.exe |131614349|21235cb9ac0662744246258c8a2fe59dafd5fed4ca4ee072b4f8766a54463106|

The tested executable is dist/win-unpacked/Zuri.exe. Authenticode status is NotSigned. ASAR extraction verified LICENSE, UPSTREAM.md, THIRD_PARTY_NOTICES.md, THIRD_PARTY_LICENSES.txt and build/icon.png exist. Active original scene is bundled into renderer; removed LimeZu atlas/map filenames are absent. Electron/Chromium notices are adjacent to the executable. No app-update feed was configured.

## Version diff and remaining work

Upstream0.4.6 -> Zuri0.1.0: product/UI identity, original assets, isolated state/protocol, manual updates, no product analytics/marketing fetches, local provider pinning/auth/probe/onboarding, provenance/notices and QA tooling. Existing internal IDs and source copyright remain. See ZURI-MVP.md for scope/ownership and UPSTREAM.md for source/binary distinction.

Remaining acceptance: installer/portable launch/install, full suite on an environment supporting its Windows symlink fixtures, and production native rebuild/signing on a provisioned builder. MSP/GKS remain documented future seams, not implemented connections.
