---
status: active
superseded_by: null
version: 0.3.0
---

# Reference fidelity QA — 0.3.0 / snapshot 3.0.0

Implements the already authorized correction in [ZURI-REFERENCE-FIDELITY.md](ZURI-REFERENCE-FIDELITY.md) and its [RCA](../.brain/rca/2026-10-05-reference-fidelity.md). QA changes are medium risk: a separate runner and controlled test fixtures, with no production code or provider changes. The corrected 0.3.0 artifact completed **mechanical PASS and bounded visual PASS**. The first candidate's anatomy rejection and all prior evidence remain preserved below.

Fresh rejected-0.2.0 baseline capture completed at `output/playwright/reference-office/after-1791193520020`: four screenshots, one directly mapped video, no page errors, and unchanged ASAR `c4264e4fada23eaa91e7b1febfc2ab88f3c96fb9f89959d30e2bc2a42cdddcf0`. `04-before-reference-comparison.png` and `before-reference-comparison.html` show the unchanged Concept 01 beside the actual 0.2.0 canvas. The manifest intentionally records mechanical PASS alongside `referenceFidelityReview: REJECTED_BY_USER` and `acceptance: NOT_ACCEPTED`. The comparison visibly demonstrates the camera, enclosure, pod and meeting-room mismatch; no old evidence was overwritten.

## Gates

The user's Concept 01 is the composition contract. The prior 0.2.0 mechanics and bounded seated review remain historical evidence, but **overall reference-fidelity acceptance for 0.2.0 is rejected**. No mechanical result may override the new composition gate.

1. Verify the actual packaged version/ASAR and record source, runner, source-reference and screenshot hashes. Preserve the 0.2.0 script, binaries, captures and every failed attempt. Write new evidence under `output/playwright/reference-office/`.
2. Use the existing isolated 1/16-agent fixture (15 workers plus one display-only coordinator at full occupancy), one actual counter PTY, no model work and no coordinator bootstrap. Read Pixi state without mutation. Observe projected actor/body bounds, semantic seat anchors, perspective camera transforms and foreground masks rather than assuming sixteen separately rendered desks or a diamond canvas.
3. Send the explicitly labeled synthetic working/Stop events through the existing IPC path. Require unique reachable seated anchors and working/idle restoration. Capture full-room and direct live UI details on both sides of the workstation pods. Check head/hip/foot fit, facing, foreground walls/desks/glass and chair masks by visual review; texture counts or coordinate equality cannot accept anatomy.
4. Test actual pointer selection at stationary visible bodies, movement, reduced-motion scene animation state and terminal/editor continuity. Capture both themes and viewport sizes, principal UI pages and five directly mapped video sessions including the bounded meeting fixture. Manual zoom/pan remains N/A if still absent from the baseline.
5. Save the real canvas screenshot and a clearly labeled side-by-side comparison against the unchanged original `design/zuri-2.5d-concept-01.png`. The comparison is an HTML evidence sheet displaying the two original images, optionally captured through the live browser as a comparison image; it is not an altered application screenshot. Include source hashes and preserve both originals.
6. Separate `mechanicalResult` from `referenceFidelityReview`. Default the latter to NOT_REVIEWED. Explicitly assess elevated frontal camera, enclosing walls/front entrance, rear glass meeting room, four four-seat worker pods, rear-left kitchenette, left lounge, material/light coherence and dynamic actor integration. Any rejected item blocks design acceptance.
7. Run a separate bounded 17-display-agent phase: sixteen workers plus the coordinator, with the seventeenth agent claiming the first boardroom overflow seat through the existing `claimSeat` flow. The same labeled synthetic events must produce sixteen distinct primary seats and a stable working actor within the calibrated meeting-floor polygon, below the glass foreground in draw order. Capture the complete room and a direct live meeting-room crop. Review actual occupant visibility, mullions, tint and furniture occlusion; geometric reachability alone cannot pass this gate. This remains a display/status fixture with one real counter PTY and **no LLM work**.

## Scene observation contract

The renderer owner confirmed background `office-reference:room` at native 1536×1024, sixteen `office-reference:seat:<stable-seat-name>:<front|back>` anchor containers, four `office-reference:pod:<id>` groups and foreground `chair`, `glass` and `front-wall` labels. The runner compares actor and seat **global foot positions** within one canvas pixel so perspective and camera scale are observed consistently. It requires eight anchors per side and distinct occupancy. Empty seat containers need no invented visual bounds; their actual scene-graph position is enough. No production test interface is added.

`tools/verify-reference-office.cjs` targets 0.3.0 by default and preserves the prior runner. `ZURI_QA_CAPTURE_MODE=before` accepts an explicit prior executable/version and skips new geometry assertions; `fixtures` stops after the 1/16 runs and bounded 17-agent glass check, and omission includes all principal pages. The old-package comparison now targets the preserved 0.2.0 executable. `ZURI_QA_PURPOSE` identifies calibration versus final capture. Actual video paths are recorded during each live session, avoiding inferred later mapping. The original reference and live canvas images are copied/captured without pixel editing; a removable, clearly labeled HTML comparison sheet is rendered in the existing window for a side-by-side image and also saved as standalone HTML.

The fixture checks reduced motion by reading the existing AnimatedSprite `playing` state after the media change, in addition to UI checks. Missing runtime observations fail rather than silently weaken the gate. Syntax validation and the packaged runtime checks below have passed.

## Rejected 0.3.0 candidate capture

Evidence: `output/playwright/reference-office/after-1791194776864/manifest.json`; run purpose `reference-0.3.0-frozen-full-visual-review`. The run finished with **74 screenshots, five videos, zero page errors**, all controlled statuses restored to idle, and all owned applications/PTYs closed. ASAR was unchanged at launch and completion: `4a1af5ad0b9344e348b844b1a7b7c670ab067e06483d590939857853e7a56302`. `executed-runner.cjs` preserves the exact executed script with SHA256 `f45f1b38c4f3b7049d16c3baea2095d5f9149cc2a7f8fa7dc1872b71ee73b21d`.

The immutable capture manifest records mechanical PASS and visual `NOT_REVIEWED`, therefore overall `NOT_ACCEPTED`. The lead and UI review subsequently recorded **visual FAIL** in `visual-review.json`: reference environment **PASS**, occupied meeting-glass visibility **PASS**, near/front north-facing seated anatomy **FAIL**. Heads are approximately 20–30 reference pixels too low, hands fall below the desktop, and pelvis falls below the chair. This is a rejected candidate even though the mechanical checks passed. The sidecar binds the unchanged manifest hash and exact ASAR; it does not rewrite the raw capture. The renderer owner is correcting only the north-facing seated pose, followed by a new build and complete capture. No installer acceptance is claimed. All raw evidence and the earlier rejected 0.2 results remain preserved.

| Controlled display measurement | 1 agent | 16 agents |
|---|---:|---:|
| Launch to initial window (ms) | 4,833 | 2,566 |
| Fixture reload to ready (ms) | 1,810 | 2,308 |
| RAF p95 / maximum (ms) | 16.8 / 18.2 | 16.8 / 18.3 |
| Real counter output packets during sample | 40 | 40 |
| GPU process working set (KiB) | 223,252 | 213,340 |
| Attached texture RGBA dimension estimate (bytes) | 6,406,144 | 8,126,464 |

The texture estimate is not measured GPU allocation and excludes unused cached frames, render targets, mipmaps and driver overhead. These are local video-recorded fixture measurements, not a universal performance threshold or concurrent-model benchmark. The bounded 17-agent session intentionally did not repeat timing tests.

Actual navigation, reduced-motion sprite suppression, stationary pointer selection, unique primary anchors, working/idle event response, modal focus/IME/Escape/exit inertness, unsaved-form protection, terminal DOM continuity and editor preservation passed. The 17th displayed worker occupied `office-reference:meeting-seat:warroom-seat` with zero canvas-pixel foot distance, within the calibrated meeting floor and below the glass layer. The geometric result alone does not accept glass visibility or anatomy.

Visual review targets in that evidence directory:

- `09-fixture-1-synthetic-seated.png`, `10-fixture-1-synthetic-seated-front-detail.png`.
- `21-fixture-16-synthetic-seated.png`, `22-fixture-16-synthetic-seated-front-detail.png`, `23-fixture-16-synthetic-seated-back-detail.png`.
- `24-fixture-16-actual-scene.png`, `25-fixture-16-reference-comparison.png`, plus the standalone `fixture-16-reference-comparison.html` containing original reference and original canvas images.
- `27-fixture-17-synthetic-seated.png`, `28-fixture-17-meeting-glass-detail.png`.

The recorded video-to-session mapping is direct from Playwright, with individual hashes in the manifest:

| Session | Video under the evidence directory |
|---|---|
| 1 displayed agent | `video/page@760fc5b013df0c8d62f1b4e6f35161ac.webm` |
| 16 displayed agents | `video/page@7777f061f8ae8975639863874d9377a6.webm` |
| 17 displayed agents / meeting glass | `video/page@a6b41000361838baae00676945c95ef1.webm` |
| Principal application pages | `video/page@84dc116ba9752f6fd28009f73c0f55f3.webm` |
| Onboarding | `video/page@d313da5e55a236dbe3359f6f9457de11.webm` |

Broad source-suite results are outside this packaged UI runner and must be reported separately. No live LLM/provider execution, signed-release trust or installer execution is claimed here.

## Corrected 0.3.0 final capture

`output/playwright/reference-office/after-1791195194209/` supersedes the rejected candidate for current verification. Purpose: `reference-0.3.0-north-seated-correction-full`. The complete suite reran against ASAR `bc1686b17e17a5145313fd25db4cfeb379a6b5e20857bdd3db0c763b66f6ccb0`, identical at launch and completion: **mechanical PASS, 74 screenshots, five directly mapped videos, zero page errors**. All controlled statuses restored to idle and all owned applications/PTYs closed. The exact copied runner hash remains `f45f1b38c4f3b7049d16c3baea2095d5f9149cc2a7f8fa7dc1872b71ee73b21d`.

The lead and independent UI reviewer inspected original-resolution captures `09/10`, `21/22/23`, `24` and `28` and explicitly gave **bounded visual PASS** for reference composition/camera, static 1/16 north/south seating, and occupied 17-agent meeting-glass visibility. Corrected north-facing heads, shoulders and hips sit credibly with anchored feet and coherent chair masks; south-facing poses remain consistent. No actionable static clipping, floating or excessive scale was identified. The meeting occupant remains visible behind the actual mullions, tint, table and chair.

`visual-review.json` binds that decision to the final raw manifest SHA256 and ASAR. The automated manifest intentionally retains `referenceFidelityReview: NOT_REVIEWED` and `acceptance: NOT_ACCEPTED`; a machine capture cannot issue a visual verdict. The later explicit sidecar plus mechanical PASS provides the **effective bounded gate PASS**, without rewriting the capture. Exclusions remain gait/hand effects, every lounge pose and live LLM/provider work. Three anatomy families with five variants each and compact pose cycles remain disclosed limitations.

| Corrected artifact measurement | 1 agent | 16 agents |
|---|---:|---:|
| Launch to initial window (ms) | 7,020 | 2,091 |
| Fixture reload to ready (ms) | 1,329 | 1,830 |
| RAF p95 / maximum (ms) | 16.8 / 16.8 | 16.8 / 16.9 |
| Real counter output packets during sample | 40 | 39 |
| GPU process working set (KiB) | 211,668 | 232,256 |
| Attached texture RGBA dimension estimate (bytes) | 6,406,144 | 8,126,464 |

The same measurement limitations above apply; texture dimensions are not GPU allocation. The separate 17-agent phase measured meeting seating/status/visibility only. All principal UI behavior checks reran successfully on the corrected ASAR, including reduced motion, modal focus/IME/exit inertness, unsaved edits, terminal continuity and editor preservation.

| Corrected artifact session | Video under `after-1791195194209/` |
|---|---|
| 1 displayed agent | `video/page@b5796397459339eb87aa6f54a3b4978d.webm` |
| 16 displayed agents | `video/page@06087c15facc04a3c03e2e7c9667c1ea.webm` |
| 17 displayed agents / meeting glass | `video/page@bb3e3af8302b4c6f049c6deb460840e7.webm` |
| Principal application pages | `video/page@f7aaeaa392e38bf184fbf0454335c5d1.webm` |
| Onboarding | `video/page@18d832204b50a8f9aab14009d5a7f510.webm` |

## Version diff

| 0.2 runner | 0.3 runner |
|---|---|
| `verify-office-2.5d.cjs`, preserved | Separate `verify-reference-office.cjs` |
| Diamond scene and individual desk sprites | Reference-derived perspective room and semantic seat anchors |
| One seated detail per fixture | Front/back pod-side details and foreground-mask evidence |
| Bounded seating review | Explicit composition gate plus seating review |
| Video mapping inferred later | Video paths recorded during each live session |
