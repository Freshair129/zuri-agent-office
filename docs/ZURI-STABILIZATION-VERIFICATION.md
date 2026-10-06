---
status: active
superseded_by: null
version: 0.3.1
---

# Zuri 0.3.1 stabilization verification

Approved scope: [stabilization plan](ZURI-STABILIZATION-PLAN.md). Baseline 0.3.0 source `9572b5ac1da6019f0cfa97af0c647e62f6e07b7a`. Original 22 failures are accounted for individually: **16 now pass; 6 Windows file-symlink cases remain explicitly untested due to EPERM**. They are not reported as product fixes or passing security checks.

## Confirmed correction

Git for Windows followed a worktree dependency junction during forced removal and deleted a disposable parent's sentinel. The central operation now checks registered non-primary membership and real path identity, inspects links without traversal, detaches only a verified dependency link and refuses unknown links before invoking Git. Finalizer refusal retains retry metadata and the existing preservation notice. Existing dirty/ahead worker retention gates remain. This is conservative path preflight, not a guarantee against concurrent filesystem replacement.

[Worktree RCA](../.brain/rca/worktree-junction-stabilization.md) and [portability RCA](../.brain/rca/stabilization-portability.md) record the evidence and scope. No machine-wide Git configuration, symlink privileges, provider settings, telemetry or remote refresh were enabled. Local disposable Git fixtures isolate ambient excludes and line-ending settings.

## Checks

| Check | Result | Boundary |
|---|---|---|
| Worktree/Git status + finalizer regressions | PASS, 25/25, zero skips | Real disposable junctions and sentinel bytes; extracted actual finalizer checks refusals and retained metadata |
| Portability plus existing Zuri offline behavior | 80 PASS, 0 FAIL, 10 SKIP of 90 | Four existing platform skips and six explicit unsupported file-symlink cases; real junction containment checks run |
| Integrated full suite | 975 PASS, 0 FAIL, 20 SKIP of 995 | Finalizer regression was also run separately in the focused set; no skip is counted as PASS |
| TypeScript main + renderer | PASS | `output/stabilization/typecheck-final.log` |
| Production build | PASS | `output/stabilization/build.log` |
| Packaged lifecycle | PASS, app 0.3.1 / snapshot 3.0.1 | Actual spawn/isolate/kill IPC, three counter packets, worktree removed, zero remaining PTYs, identical parent sentinel hash |

The final 0.4.0 UI integration will run its own full regression. This checkpoint does not accept the upcoming UI, real-model work, installation, signing or deployment.

## Version diff

0.3.0 → 0.3.1: safe managed-worktree teardown, retained cleanup-refusal tracking, platform-correct meaningful test fixtures and a synchronized local catalog document. The approved office and UI layout are unchanged at this checkpoint.

Packaged evidence: [lifecycle manifest](evidence/stabilization-packaged-lifecycle.json), [build inputs](evidence/stabilization-build-inputs.json). Raw capture `output/playwright/stabilization-1791198487795` contains two screenshots and one video. Unpacked executable `dist/stabilization-0.3.1/win-unpacked/Zuri.exe`; ASAR SHA-256 `a0e62ff27cce98f7f8efbf4e800694921c38fd1857629f97c31595222092cfcf` was identical before and after capture. This is an unpacked checkpoint, not an installer acceptance. An earlier capture attempt started before packaging finished and failed before launch; only the completed capture supports PASS.
