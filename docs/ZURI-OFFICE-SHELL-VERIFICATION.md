---
status: active
superseded_by: null
version: 0.4.0
---

# Zuri 0.4.0 office shell verification

Approved contract: [office shell](ZURI-OFFICE-SHELL.md). Stabilization checkpoint `e15d9895` / app 0.3.1 is verified separately in [stabilization verification](ZURI-STABILIZATION-VERIFICATION.md). Snapshot 4.0.0 accepts the shell only after packaged mechanical and separate visual review.

## Result

Scoped packaged shell mechanics and bounded visual review **PASS**. Final capture `output/playwright/office-shell/after-1791200221061` contains **111 screenshots, five directly mapped videos and zero page errors**. Electron 32.3.3 reports packaged app 0.4.0. ASAR SHA256 `e886533f83f40fd424855983990fc70cadfd85aceb45738427bcb4dc118e2abc` is identical at capture start, capture completion and after installer generation.

The unchanged user reference governs layout hierarchy; the approved realistic 2.5D room and smooth actors remain. Both lead and UI peer reviewed original images. [Hash-bound visual review](evidence/shell-visual-review.json), [curated runtime evidence](evidence/shell-office-live.json), [314 build-input hashes](evidence/shell-build-inputs.json) and [QA contract/video mapping](ZURI-OFFICE-SHELL-QA.md) preserve the result. The raw manifest deliberately keeps visual review pending; its separate sidecar supplies the later decision without rewriting history.

| Check | Result | Boundary |
|---|---|---|
| Full regression | 979 PASS / 0 FAIL / 20 SKIP of 999 | Six unsupported Windows file-symlink cases plus fourteen existing platform skips; no skipped case counts as PASS |
| TypeScript main + renderer; production build | PASS | `output/playwright/shell-typecheck-final.log`, `shell-build.log` |
| Shell state + locale contracts | 27/27 PASS | Actual store transitions, equal locale keys and placeholders; not translation certification |
| Drawer/roster/rail at 1440×960, 1280×800, 1100×760 | PASS | Actual viewport equals requested size; both themes, no document overflow, narrow overlay and forced compact rail |
| Canvas, xterm, draft and attachment continuity | PASS | Same DOM instances, stable selected ID, unsent draft and real staged file; counter packets continue while hidden |
| Coordinator navigation | PASS | Tasks, Ask me, Team, Memory, Activity, internal-tab highlight, retained tab after close/reopen; disabled reasons when no coordinator |
| Prerequisites action from closed drawer | PASS | Correct coordinator/Monitor opens with 747-character unsent draft; no task submitted |
| Scene 1/16/17 fixtures | PASS within stated scope | Current-text reveal, nonselected blocked thought, static front/rear seating, visible meeting-glass occupant |
| Existing principal pages | PASS within capture scope | Terminal/Git/messages/traces, edit/IDE, coordinator panes, settings and onboarding; focus/IME/unsaved/reduced-motion checks retained |

The integrated suite log is `output/playwright/shell-full-suite.log`. Measured rAF p95 was 10.1ms in both 1- and 16-agent samples, with 41/40 real counter packets; these are bounded observations with video capture active, not universal performance or model-throughput claims.

## Corrections and preserved attempts

Source review corrected stale active-tab highlighting, constrained-rail preference precedence and the nested prerequisite action. Their evidence is in [navigation RCA](../.brain/rca/UI-SHELL-NAV-ACTIVE-TAB.md). Full regression then caught four new localization failures; [locale RCA](../.brain/rca/UI-SHELL-LOCALE-COUNT.md) records the neutral count-label fix. Existing tests were not relaxed. The failed suite remains at `output/playwright/shell-full-suite-before-locale-fix.log`.

Candidate `after-1791199656445` is NOT_ACCEPTED (22 images/one video). Its native 1280 minimum prevented the requested 1100 viewport, and QA incorrectly labeled that mismatch as overflow. [Window RCA](../.brain/rca/UI-SHELL-WINDOW-BOUNDS.md) and [measurement RCA](../.brain/rca/office-shell-qa-window-clamp.md) record the native minimum-width correction and actual-size assertion. Candidate `after-1791200040587` is NOT_ACCEPTED (42 images/two videos): QA expected the internal token `blocked` instead of the existing visible `needs you` label. [Status-label RCA](../.brain/rca/office-shell-qa-status-label.md) records the correction; the final binary was unchanged. Original attempts remain preserved and excluded from the accepted gallery.

## Local artifacts

`dist/shell-0.4.0/win-unpacked/Zuri.exe`, `Zuri-0.4.0-win-x64-setup.exe` and `Zuri-0.4.0-win-x64-portable.exe` are available locally. Installer and portable were generated with `--prepackaged` from the exact tested directory. [Artifact hashes and sizes](evidence/shell-artifacts.json) identify them. These are unsigned development artifacts; installer installation, signing, publication and deployment are NOT_RUN.

Gallery target: `output/playwright/snapshots/zuri-v0.4.0-office-shell-2026-10-05/index.html`, Snapshot 4.0.0. It includes 111 final images/five videos plus the separately captured 0.3.0 before comparison (four images/one video), and a linked 0.3.1 lifecycle checkpoint (two images/one video). The raw 0.3.0 before comparison is `output/playwright/reference-office/after-1791197862386`; old snapshots remain unchanged.

## Verification boundary

Verification used actual packaged navigation, drawer/roster controls, a real local counter PTY, retained draft/attachment and canvas/terminal identities. Controlled 1/16/17-agent display fixtures do not establish live-model task completion. The attachment test used a real disposable file and a one-shot controlled native-picker return; native OS picker behavior is not accepted. Static review does not certify every gait/hand/ambient frame, all mixed statuses or every locale. The earlier real-model repeat-task limitation remains open; shell acceptance does not close it.

Out-of-scope existing copy finding: Settings → General still says updates run automatically every six hours (`updatesSection.idleDetail`). The same text exists in 0.3.0 source; the edition actually remains manual-only, as specified by the unchanged manual-only implementation in `src/main/updater.ts`. It is recorded separately rather than silently expanding this shell change. No new policy-verification or autonomous-behavior claims were added.

## Version diff

0.3.0 → 0.3.1: safe managed-worktree removal and supported-platform regression repair.

0.3.1 → 0.4.0: collapsible navigation, persistent office canvas, closable responsive drawer, compact roster and selected/attention thought labels. Native minimum outer width changes from 1280 to 1100 to make the approved narrow layout reachable; height/defaults/clamping remain. Existing provider/backend contracts and reference artwork remain.
