---
status: active
superseded_by: null
version: 0.1.0
---

# Office shell QA requested width differs from native viewport

## Symptom

The first 0.4.0 candidate capture reported horizontal overflow when requesting 1100×760 after successful 1440/1280 drawer-state checks. The lead had also revoked this package for a separate locale-parity defect; no acceptance is claimed.

## Evidence

Preserved attempt: `output/playwright/office-shell/after-1791199656445`, 22 screenshots and one video, ASAR `1ca96732ce07246016a16068ddb118052e4040b6deedfa0a88a91660743c6cba`. The raw manifest records `22-failure-state.png` at **1264×760**, not 1100×760. Its scene canvas is 626 pixels wide at x=208, with expanded navigation and a docked drawer. `src/main/index.ts` sets `MIN_WIN.width=1280`; Windows native frame sizing clamps the request before the renderer receives it. The runner compared document width to the requested 1100 rather than actual `innerWidth`.

## Root cause

The existing capture size helper assumed `BrowserWindow.setContentSize` always honors requests. It did not verify the actual viewport after native minimum-size constraints. Therefore this failure does **not** demonstrate CSS overflow. Separately, the production minimum makes the approved `<1180` overlay breakpoint unreachable without a runtime minimum-width adjustment; that source decision belongs to the lead.

## Why it escaped detection

Earlier captures used 1280/1440 widths, both reachable under the baseline minimum. The new constrained-width check was added without checking the BrowserWindow minimum inherited from the older layout.

## Prevention

The runner will wait for the actual viewport to equal every requested size and fail explicitly on a clamp, then compare document geometry to actual `innerWidth`. Geometry must be saved before assertions. Do not silently resize via a test-only minimum override or claim unsupported 1100 coverage. Preserve this attempt and wait for the corrected package GO before rerunning the full suite.
