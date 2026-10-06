---
status: active
superseded_by: null
version: 0.2.0
---

# Office shell QA / Snapshot 4.0.0

Implements the approved [office shell contract](ZURI-OFFICE-SHELL.md), following the separate high-risk [worktree stabilization RCA](../.brain/rca/worktree-junction-stabilization.md). QA tooling is medium risk and confined to isolated profiles, disposable workspace files and existing application interfaces. No production test API is added. Packaged 0.4.0 mechanical verification is **PASS**; bounded visual review is recorded separately below.

`tools/verify-office-shell.cjs` is a sibling of the preserved reference runner. It targets 0.4.0 / Snapshot 4.0.0, writes unique evidence under `output/playwright/office-shell/`, records the exact executed runner and ASAR hashes, maps five video sessions directly, and preserves original Concept 01 plus the supplied shell reference. Every old 0.3 capture, rejected attempt and source runner remains unchanged.

## Acceptance checks

- Retain controlled 1/16-agent navigation, timing, both-sided seating, pointer selection, reduced-motion checks and the bounded 17-agent occupied meeting-glass fixture. These are display/status fixtures with one real local counter PTY, not concurrent model sessions.
- Close and reopen the agent drawer; close then reselect the same agent from the real roster. Confirm the actual Pixi canvas and xterm DOM nodes remain connected and identical, selected ID remains stable, and real PTY counter packets continue while hidden.
- Keep an unsent composer draft and a real disposable `proof.txt` attachment across the same layout actions. A one-shot native-picker override returns only that fixture path to the existing Files button/IPC flow and immediately restores the original picker. This verifies staging/state retention, **not native OS picker behavior**. No message is submitted.
- Test navigation collapse/expand, compact roster disclosure with an intentionally long display name, keyboard focus/Enter and actual coordinator destinations: Tasks/tasks, Ask me/ask me, Team/monitor, Memory/memory and Activity/activity. Drawer close/reopen must retain the active coordinator tab. Without a coordinator, required routes must stay disabled with a reason. Agent Office closes the drawer; its close button restores focus to the reopen control.
- Check 1440×960, 1280×800 and 1100×760 in both themes. The constrained drawer must be an in-viewport overlay; document horizontal overflow is a failure. Sidebar/drawer changes must not replace the office canvas or terminal.
- Observe existing `thought:<agentId>` containers without scene mutation. Selecting an already-working agent must reveal current text without a new event; routine unselected thoughts stay non-renderable. A labeled synthetic permission notification through existing IPC must make the unselected coordinator blocked and keep its thought visible. Stop restores fixture status.
- Preserve the full principal-page/settings/onboarding suite: modal focus, IME/Escape, exit inertness, unsaved edits, terminal/editor continuity and reduced motion. Keep fixture input distinct from live-provider acceptance.

Mechanical capture cannot declare visual acceptance. The raw report keeps room and shell review gates NOT_REVIEWED; a separate hash-bound review must assess composition, readable shell hierarchy, seating/occlusion and responsive geometry. Screenshot comparison sheets display original source and actual screenshots with explicit labels; they do not alter application pixels or masquerade as a single app screenshot.

## Preserved first attempt

`output/playwright/office-shell/after-1791199656445` ran against candidate ASAR `1ca96732ce07246016a16068ddb118052e4040b6deedfa0a88a91660743c6cba`, then closed all owned processes with 22 screenshots and one video preserved. The package GO was independently revoked for locale parity. The runner's nominal 1100-width overflow failure was an **invalid narrow-width measurement**, not demonstrated CSS overflow: actual viewport was 1264×760 because the baseline native minimum width was 1280. The 1440/1280 drawer, canvas/terminal, unsent draft and attachment actions had completed; they do not accept the whole candidate.

See [QA measurement RCA](../.brain/rca/office-shell-qa-window-clamp.md). The corrected runner verifies actual viewport equality before geometry and compares overflow against actual `innerWidth`. The lead owns the native minimum-width correction. No test-only window-limit override is used; the full capture will rerun after the corrected package GO.

## Preserved second attempt

The next attempt `after-1791200040587` reached actual 1100×760 and passed the complete one-agent shell checks, then stopped in the 16-agent critical-thought check because QA expected internal state word `blocked` instead of displayed label `needs you`. It preserved 42 screenshots and two videos; statuses were restored and all processes closed. [Status-label RCA](../.brain/rca/office-shell-qa-status-label.md) records the confirmed translation mismatch and bounded runner correction. It is not a product-status failure or full acceptance; the same unchanged ASAR requires a complete rerun.

## Final packaged capture

`output/playwright/office-shell/after-1791200221061/manifest.json` records a full mechanical **PASS**, 111 original screenshots, five videos, zero page errors and normal closure of all five isolated sessions. ASAR SHA-256 is `e886533f83f40fd424855983990fc70cadfd85aceb45738427bcb4dc118e2abc` at both launch and completion. The executed runner SHA-256 is `073358723194fe67a31ea92f97b8b6ddb2013872b1e44ef58d9362b232f05cce`; its exact copy is retained beside the manifest. The unedited raw report intentionally keeps visual review `NOT_REVIEWED` and overall acceptance `NOT_ACCEPTED` until a separate hash-bound visual review supplies the effective gate.

The lead and independent UI reviewer gave **bounded visual PASS** on this final run. The lead owns the official `visual-review.json` sidecar, bound to raw manifest SHA-256 `d32ef23d329e573dae4d97f1c940113a27e2861d7c8346fa414295e45c0ef8c0`, the ASAR and reviewed original images. Reviewed images 13–16, 18–20, 22–24, 41, 51–53, 57–62 and 64–65 cover shell dimensions/themes, roster/drawer, selected and critical thoughts, coordinator routes and the unsent seed, seating and the occupied meeting. No material static defect was identified in that scope. This effective gate combines mechanical PASS with the separate visual verdict; it does not rewrite raw acceptance fields. It excludes exhaustive gait/hand-effect frames, every lounge pose or locale, live model success, hardware-independent performance and installer/signing claims. Terminal lifetime is supported by mechanical identity and packet evidence, not inferred from screenshots. A post-run process inventory found no remaining `Zuri.exe` processes.

Both 1- and 16-agent fixtures passed actual 1440×960, 1280×800 and 1100×760 viewport equality. At 1100, document width was exactly 1100 and the overlay drawer occupied x=668 through 1088. Every close/reopen and same-agent reselection retained the connected, identical canvas and terminal nodes, selected agent, unsent draft and staged attachment. Real terminal packets advanced while hidden: 62→72 for one agent and 63→74 for sixteen at 1100. The compact rail, wide preference, focus return, keyboard routes, internal coordinator-tab/sidebar mirror and all five actual coordinator destinations passed. Prerequisites opened the coordinator Monitor and seeded a 747-character unsent dispatch draft; it was cleared without submission.

Selected current thought text appeared without a new event; the unselected coordinator's synthetic permission notification produced the real `needs you` card and visible critical thought while routine unselected thoughts remained hidden. The 1/16 seating checks matched every primary anchor exactly. The separate 17-display fixture reached a real meeting-chair anchor through normal seat allocation and passed occupied-glass geometry; visual anatomy and occlusion remain a separate review. All synthetic statuses were restored. The retained Settings/onboarding suite also passed focus trap, IME/Escape, exit inertness, unsaved-edit guard, editor/terminal preservation and reduced-motion checks.

| Observation | 1 displayed agent | 16 displayed agents |
| --- | ---: | ---: |
| First window (ms) | 3940 | 2109 |
| Fixture reload to scene ready (ms) | 1639 | 1897 |
| RAF p50 / p95 / maximum (ms) | 10 / 10.1 / 10.2 | 10 / 10.1 / 10.3 |
| RAF samples over 50 ms | 0 of 821 | 0 of 825 |
| Counter packets during timing sample | 41 | 40 |
| GPU process working set (KiB) | 213228 | 217608 |

These are instrumented observations during video capture, not a hardware-independent frame-rate guarantee or concurrent LLM throughput test. GPU process working set comes from Electron `getAppMetrics`; texture dimension estimates in the manifest are not measured GPU allocation. Manual zoom/pan is N/A because baseline behavior only has automatic fit and selected-agent nudge.

The raw `sessions` array maps videos without timestamp inference:

| Session | Video under the capture directory |
| --- | --- |
| 1-agent fixture and shell | `video/page@35b5cbf97fe3ab4cff49920b8c25af5b.webm` |
| 16-agent fixture, shell and coordinator routes | `video/page@bcc498221109ac46be8216d00b511333.webm` |
| 17-agent occupied meeting fixture | `video/page@bc587b951f948d84bc8763f8a95dc604.webm` |
| Principal pages, Settings and editing | `video/page@690eb1bd4f62ed81ce8df93e78c6fc0c.webm` |
| Onboarding | `video/page@35f5b25c59d3ab9dc15152b79cd80c30.webm` |

## Version diff

Snapshot 3.0.0 verified the reference room in the original toolbar/sidebar layout. Snapshot 4.0.0 adds actual shell actions and preservation checks, compact-roster and constrained-overlay evidence, thought visibility policy, and a separate supplied-shell comparison. Live LLM task completion, installer installation and signing remain outside this UI capture.
