---
status: active
superseded_by: null
version: 0.3.0
---

# Zuri 0.3.0 reference-fidelity correction

Baseline: source `e76bdafd2ce7542856d5f72903fd6a6b319fe020`, app 0.2.0 / snapshot 2.0.0. The user rejected its visual resemblance to the approved reference. Prior functional and seated test results remain historical evidence; they are not overall design acceptance.

## Result

Scoped packaged UI and reference-composition/static-seating review **PASS** on the final calibrated package: Zuri 0.3.0, Electron 32.3.3, ASAR SHA256 `bc1686b17e17a5145313fd25db4cfeb379a6b5e20857bdd3db0c763b66f6ccb0`. Full TypeScript checking, production build and 23 focused scene/asset/WebGL tests PASS. This does not make the full regression suite or live-model workflow pass. [Correction contract](ZURI-REFERENCE-FIDELITY.md) and [root cause](../.brain/rca/2026-10-05-reference-fidelity.md) govern this correction.

## Visual source and boundaries

The empty room is edited from the exact clean reference, preserving its camera, enclosing walls, glass meeting room, four workstation pods, kitchenette, lounge, materials and light. All five original people were removed for dynamic runtime actors. The original generated PNG remains unmodified; [provenance and exact prompt](design/reference-room-v1.md) identify its SHA256. The user's red labels are explanatory and are not product artwork.

The renderer keeps stable agent/avatar/seat identities but recalibrates local scene positions, navigation and foreground masks to the reference. Provider, IPC, terminal, persistence and secrets contracts are outside this visual correction. No new 3D engine or dependency upgrade is required.

## Acceptance evidence

Final capture: `output/playwright/reference-office/after-1791195194209`, 74 screenshots, five directly mapped videos and zero page errors. Packaged ASAR is identical at capture start and completion. The comparison displays the unchanged exact reference beside the actual packaged scene. The independent lead and UI reviews pass elevated frontal camera, enclosing walls/entrance, rear glass meeting room, four four-seat pods, rear-left kitchen, left lounge, coherent materials/light, static 1/16 seating on both sides, and the naturally assigned seventeenth occupant visible behind glass and its frame.

Controlled status fixtures remain labeled and do not claim live model work. One real counter PTY exercises terminal continuity; the remaining agents are display fixtures. The runner observes movement, stationary pointer selection, reduced-motion state, unique seating, working/idle restoration, terminal/editor continuity, focus/IME/unsaved guards and principal UI pages. Image-generation previews are not application screenshots. The raw runner manifest intentionally ends with visual review pending; a separate hash-bound `visual-review.json` records the later visual decision without rewriting capture history.

[Live manifest](evidence/reference-office-live.json), [visual review](evidence/reference-office-visual-review.json) and [311 build-input hashes](evidence/reference-build-inputs.json) preserve evidence. Snapshot 3.0.0 includes the final 74 images/five videos and the rejected 0.2.0 comparison's four images/one video. Main pages, settings and onboarding states are covered as listed in the manifest; unconfigured integration flows are not claimed as tested.

The exact executed runner is retained as `capture-runner.cjs` in the raw run and gallery. The committed runner only removes a trailing blank line after capture; syntax validation passes and the archived executed copy retains the manifest's runner hash.

The static visual gate does not certify every gait frame, hand effect or lounge pose. Generated actors retain three anatomies with five garment variants and fifteen stable IDs. Reading shares seated poses; seated working is not evidence of unique typing animation. No live model work, installer installation, signing, publication or deployment was tested in this correction.

| Final measured fixture | 1 agent | 16 agents |
|---|---:|---:|
| First window | 7020 ms | 2091 ms |
| Reload to scene ready | 1329 ms | 1830 ms |
| Renderer rAF p95 / maximum | 16.8 / 16.8 ms | 16.8 / 16.9 ms |
| Real terminal counter packets during sample | 40 | 39 |

These timings are bounded observations with video capture active, not a universal performance guarantee or a measure of model throughput. The separate 17-agent phase checks actual meeting-chair occupancy and glass visibility; it has no performance claim. Manual zoom/pan remains absent, as in the baseline.

## Local artifacts

Created from the exact tested unpacked directory with electron-builder `--prepackaged`; ASAR remained unchanged after installer generation. Native dependencies and Electron version are retained from the earlier local build; no dependency upgrade or rebuild was introduced. These are unsigned development artifacts, not installation acceptance.

| File under `dist/reference-0.3.0/` | SHA256 |
|---|---|
| `win-unpacked/resources/app.asar` | `bc1686b17e17a5145313fd25db4cfeb379a6b5e20857bdd3db0c763b66f6ccb0` |
| `Zuri-0.3.0-win-x64-setup.exe` | `9b7a3aa29efc213fe19c2ec721a952d7ed35e429e812b96b654716d9c14e1966` |
| `Zuri-0.3.0-win-x64-portable.exe` | `7e2ba516cc1c73a519a1f1da83bf42fa6b7640f74fd5bab508f41c955ab11802` |

### Rejected calibration capture

`output/playwright/reference-office/after-1791194776864`, ASAR `4a1af5ad0b9344e348b844b1a7b7c670ab067e06483d590939857853e7a56302`: 74 screenshots and five videos, mechanical PASS and zero page errors. Reference architecture/camera/materials and meeting-glass visibility pass visual review, but north-facing seated actors are too short for the chairs: heads are about 20–30 reference pixels too low, hands below the desktop and hips below the seat. Overall visual acceptance is FAIL. Original captures remain unchanged and are excluded from the final accepted gallery. A direction-specific seated-scale calibration is required; mechanics cannot waive this failure.

### Regression boundary

Before the final meeting-chair and seated-scale calibrations, the full suite reports 983 tests: 947 PASS, 22 FAIL and 14 SKIP. Failure names match all 22 baseline failures in `glass-regression.log`; `reference-suite-comparison.json` has an empty difference. This is not an all-green suite. Later changes require focused scene tests and a new packaged capture; the full result remains attached to the source state at which it ran.

## Version diff

| 0.2.0, rejected resemblance | 0.3.0 correction target |
|---|---|
| Diamond isometric platform | Exact-reference elevated frontal room |
| Sixteen separate desks | Four four-seat workstation pods |
| Freestanding meeting table | Glass-enclosed rear meeting room |
| Separately assembled furniture/lighting | Coherent reference-derived architecture/materials/light |
| Old displayed anchors prioritized | Navigation, perspective and actors calibrated to the reference |
| Functional/seated gate alone | Explicit reference-composition gate plus functional/seated verification |

Keep previous binaries, captures and checksums intact. Installer creation does not establish installation; model work and external integrations require separate verification. New evidence must retain baseline suite failures rather than claim an all-green result.
