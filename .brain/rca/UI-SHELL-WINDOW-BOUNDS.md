---
status: active
superseded_by: null
version: 0.1.0
---

# Constrained office shell blocked by native window bounds

## Symptom

The first 0.4.0 capture could not reach the approved 1100×760 content viewport. Its runner reported horizontal overflow, but the original screenshot was actually 1264×760 and still showed the docked drawer.

## Evidence

`output/playwright/office-shell/after-1791199656445` is a rejected capture (22 screenshots, one video), ASAR `1ca96732ce07246016a16068ddb118052e4040b6deedfa0a88a91660743c6cba`. `src/main/index.ts` declares `MIN_WIN = { width: 1280, height: 800 }`, uses it for BrowserWindow construction and saved-bounds clamping. `App.tsx` switches to the compact rail/overlay only below 1180 content pixels. The runner requested 1100 content pixels but compared document width directly to that requested number without first checking the actual viewport.

## Root cause

The native minimum width prevented the renderer breakpoint from being reached. On this Windows frame, the clamped 1280 outer width produced 1264 content pixels. The test incorrectly described a requested-versus-actual geometry mismatch as document overflow. No DOM overflow is established by that failure.

## Why the issue escaped detection

Source review checked the new renderer breakpoint and preserved preference behavior without connecting it to the existing main-process native minimum. Type checking does not validate reachable window geometry. The old capture covered only 1280 and 1440 content widths.

## Proposed correction and prevention

Lower only the native minimum outer width to 1100 so the already-approved 1100 content viewport can be reached; retain minimum height 800, defaults, saved-bounds clamping and all runtime/IPC behavior. Complexity C-2, risk MEDIUM as part of the approved shell geometry. Update QA to assert actual viewport equals the requested size before evaluating overflow, compare document width to actual viewport, and retain the original failed capture. Rebuild and rerun the complete packaged shell acceptance; prior screenshots cannot accept the final binary.
