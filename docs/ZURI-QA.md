---
status: active
superseded_by: null
version: 0.1.0
---

# Independent Zuri QA review

Read-only review of integrated changes on 2026-10-05, followed by two explicitly authorized test updates for the Zuri manual-update/disabled-analytics policy. No unrelated baseline implementation was changed.

## Verification evidence

- Immutable upstream snapshot: upstream-baseline-tests.log; 962 tests, 922 passed, 26 failed, 14 skipped. Electron installation was incomplete for that run.
- Initial integrated full run: runtime-qa-full-tests.log; 976 tests, 938 passed, 24 failed, 14 skipped; command node --test test/*.test.cjs, exit 1.
- All 23 shared failures matched baseline names. The one new failure expected autoUpdate/telemetryEnabled toggles to remain editable; that behavior is deliberately retired.
- Three baseline Electron installation failures no longer occurred: quit-sweep.electron.test.cjs, restart-terminal-preserve.test.cjs, update-download-asset.test.cjs. This comparison is not a claim of application acceptance.
- Updated policy tests: runtime-qa-policy-tests.log; 30 passed, 0 failed. Active Settings toggles still must stage changes; retired controls must be explicitly disabled. The packaging check now requires no feed, publish:null, --publish never, and license/provenance entries rather than the retired releaseInfo notes path. Generic release-note parser tests remain.
- Final full-suite rerun: runtime-qa-final-tests.log; **977 tests, 941 passed, 22 failed, 14 skipped**, exit 1. All 22 failures have matching names in the immutable baseline. No new failing test remains; the overall suite remains non-green.
- The 14 skips are existing platform-conditional POSIX/signal/Unix-socket behavior excluded on Windows. No tests were newly skipped.

## Remaining failures shared with baseline

Classification describes observed errors; it is not proof that the underlying behavior passes on another machine. In particular, fixture setup failures leave the intended path unverified.

| Test location | Exact test name | Classification |
|---|---|---|
| test\agent-token-cap.test.cjs:27:1 | consecutive agent caps survive an interleaved config update | POSIX path expectation differs from Windows normalization |
| test\arabic-terminal.test.cjs:133:1 | turning it off is a real undo, not a terminal rebuild | Existing source-text assertion failure (including CRLF-sensitive matching); not a demonstrated new behavior regression |
| test\fs-path-containment.test.cjs:81:1 | a final-component symlink cannot be read as text | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:87:1 | a final-component symlink cannot be read as bytes | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:92:1 | an intermediate directory symlink cannot be read through | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:99:1 | a final-component symlink cannot be written through | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:107:1 | a dangling symlink cannot be used to create a file outside the workspace | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:122:1 | listDir cannot list a directory outside the workspace | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:127:1 | the git diff path check refuses a symlink escape | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:135:1 | ordinary in-workspace reads and writes still succeed | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:157:1 | an in-workspace symlink to an in-workspace target is followed, not refused | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\fs-path-containment.test.cjs:211:1 | lexical traversal out of the root is still rejected | Windows fixture cannot create symlinks (EPERM); assertions do not reach the intended containment path |
| test\hire-import.test.cjs:101:1 | Command Center sets and clears one cap through the atomic IPC | Existing source-text assertion failure (including CRLF-sensitive matching); not a demonstrated new behavior regression |
| test\hooks-socket.test.cjs:178:1 | a hive with no root yet is not silent, and binds once the root appears | Windows socket-path fixture fails EACCES |
| test\model-catalog-remote.test.cjs:60:1 | the remote file and the baked file agree on every model | Upstream docs and bundled model data differ |
| test\telemetry-message-count.test.cjs:226:1 | the composer counts its own submit, not the shared enqueue action | Existing source-text assertion failure (including CRLF-sensitive matching); not a demonstrated new behavior regression |
| test\telemetry-message-count.test.cjs:252:1 | steer is counted at the IPC seam, not inside control.steer | Existing source-text assertion failure (including CRLF-sensitive matching); not a demonstrated new behavior regression |
| test\worktree-deps.test.cjs:78:1 | does not follow the dependency symlink when removing a worktree | Windows symlink/fixture behavior; EPERM or dependent fixture assertions |
| test\worktree-deps.test.cjs:95:1 | leaves a dangling worktree dependency symlink untouched | Windows symlink/fixture behavior; EPERM or dependent fixture assertions |
| test\worktree-deps.test.cjs:108:1 | reports a failed link without throwing | Windows symlink/fixture behavior; EPERM or dependent fixture assertions |
| test\worktree-deps.test.cjs:120:1 | removes only the linked dependencies before checking worktree status | Windows symlink/fixture behavior; EPERM or dependent fixture assertions |
| test\worktree-deps.test.cjs:151:1 | does not remove a worktree node_modules link to another directory | Windows symlink/fixture behavior; EPERM or dependent fixture assertions |

## Integrated change review

No additional new blocking defect was identified in the reviewed source changes. This is a bounded source review, not production acceptance.

- Identity bootstrap is the first main import and appears before state initialization in the built bundle. Product/appId and separate state roots agree. Protocol parsing/registration agree on zuri-agent-office; manifest and internal Hive IDs remain compatible.
- Updater IPC returns manual-only status and immediate refusals; the badge renders a non-interactive manual-updates label and the toast ignores this status. Settings controls are disabled, config forces both flags off, and the runtime analytics singleton cannot instantiate a client.
- OpenCode endpoint/model validation occurs before missing-CLI installation and Hive provisioning. The injected local config pins foreground/background models to the configured local provider. Stored cloud backend keys are not injected on this path. Host environment and CLI configuration inheritance remain separate from this narrower guarantee.
- Active scene imports reference the original Zuri SVG atlas/map, and removed proprietary PNGs are absent from the active source assets. Existing procedural MIT avatar recipes retain their IDs. Packaging includes license/provenance paths; actual packaged contents still require artifact inspection.
- Review initially found no BrowserWindow icon option. Lead added build/icon.png to the window options and packaging files, so the relative runtime path resolves in development and in the packaged app. Native appearance still requires visual inspection. The packaged executable icon is separately configured.

## Acceptance gaps

Live model inference and the complete OpenCode agent/tool loop are not established by fixture probes or source checks. Native ABI loading, real desktop workflow, persistence/restart, packaged asset inventory, installer installation and signing must be reported separately by integration. Full-suite failures above prevent claiming all regression checks passed. Existing source assertions are retained pending separate authorized investigation.

## Version diff

0.1.0 adds this QA evidence ledger and replaces two obsolete policy expectations with direct assertions of the new policy. No unrelated failing baseline implementation was modified.
