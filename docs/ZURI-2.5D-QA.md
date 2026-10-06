---
status: superseded
superseded_by: ZURI-REFERENCE-QA.md
version: 0.2.0
---

# 2.5D capture and fixture verification

**Overall 0.2.0 reference-fidelity acceptance: REJECTED by the user.** The historical mechanical and bounded seated checks below remain valid for what they measured, but they did not establish that Concept 01 was implemented. See the [reference-fidelity RCA](../.brain/rca/2026-10-05-reference-fidelity.md) and the superseding [0.3 QA contract](ZURI-REFERENCE-QA.md). Do not treat any earlier bounded PASS in this document as overall design acceptance.

Implements the verification lane of the approved [2.5D office specification](ZURI-2.5D-OFFICE.md). Corrected final package: **bounded mechanical checks PASS and seated visual review PASS**. The full source suite remains non-green as detailed below; this report does not claim live-model acceptance. The lead must signal each packaged build is ready before launching the runner.

## Final evidence

`output/playwright/office-2.5d/after-1791192266634/manifest.json` records the complete final run: **66 screenshots, four finalized videos, zero page errors**. ASAR SHA256 remained `c4264e4fada23eaa91e7b1febfc2ab88f3c96fb9f89959d30e2bc2a42cdddcf0` from launch through completion. The lead also confirmed the subsequent prepackaged NSIS/portable build retained this ASAR. Runner SHA256 is `3b0fff9087a223178f4330d0ebc8bdfb07b1092561c176d95b64453df5a05980`. The final manifest is copied to [docs/evidence/office-2.5d-live.json](evidence/office-2.5d-live.json).

The root and UI reviewers accepted the corrected one-agent and 16-agent seated views: heads and shoulders remain visible above coherent chair backs. Full screenshots `09-fixture-1-synthetic-seated.png` and `19-fixture-16-synthetic-seated.png`, plus direct live UI clips `10-...-detail.png` and `20-...-detail.png`, preserve the evidence. Both phases had distinct desk anchors at exactly zero distance, seated texture frames, expected working status, exact stationary mouse selection and successful Stop-to-idle restoration. The 16-agent click changed selection to fixture 14. These are explicitly synthetic status fixtures, not model work.

| Measurement | 1 displayed agent | 16 displayed agents |
|---|---:|---:|
| First window from launch | 8,455 ms | 2,206 ms |
| Fixture reload to scene ready | 2,290 ms | 3,206 ms |
| RAF samples during counter output | 485 | 490 |
| RAF p95 / maximum | 16.8 / 16.8 ms | 16.8 / 16.8 ms |
| Frames above 50 ms | 0 | 0 |
| Actual counter packets | 39 | 40 |
| Attached texture RGBA estimate | 44,153,488 bytes | 45,873,808 bytes |
| GPU process working set | 258,892 KiB | 271,516 KiB |
| GPU process private bytes | 631,268 KiB | 683,200 KiB |

GPU process memory is not texture allocation. Texture estimates exclude unused cached frames, render targets, mipmaps and driver overhead. Video capture and concurrent machine activity affect these timings; this single run is not a general performance guarantee. Terminal/editor instance preservation, Settings close/focus behavior, reduced-motion UI checks, agent forms, both themes/viewports, command-center tabs and onboarding captures passed. The scene's reduced-motion media request was observed; that screenshot alone is not proof of suppressed animation.

The retained broad source-suite run `output/playwright/office-regression-final.log` reports **984 total: 947 pass, 23 fail, 14 skipped**. Twenty-two match the documented baseline failures; the additional `test/quit-sweep.electron.test.cjs` failed in that run and passed the isolated recheck recorded in `output/playwright/office-quit-sweep-recheck.log`. Its root cause is unconfirmed, so it is not silently reclassified as a baseline failure or waived by this UI capture. No renderer-test failure was reported. The earlier failures and calibrations below remain preserved.

### Video sessions

All files are under the final run's `video/` directory and hashed in its manifest. Mapping is inferred from filesystem creation times and the verifier's strictly sequential four-session order; `video-sessions.json` records this method explicitly.

| Session | Video |
|---|---|
| 1-agent fixture, timing and synthetic seating | `page@a96912ad243d57d4f78940fb9b563efc.webm` |
| 16-agent fixture, timing and synthetic seating | `page@00e485ba84e31c14e49ccf99ef0182d6.webm` |
| Main UI, forms, terminal, Settings, IDE and command center | `page@d49a8310b7b97840c40005e3e4a9a90b.webm` |
| Onboarding, unsubmitted | `page@258ada12e45288b703b1524aa067052a.webm` |

## Earlier calibration evidence — retained

The complete chair-mask candidate run `after-1791191900858` recorded 64 screenshots, four finalized videos, zero page errors and matching launch/completion ASAR `68d47d5aad5c83dab2004ea881b6c21abc8c6821c46ed6bdb6d233497eba1fcc`. Both 1/16 controlled seating/selection/idle-restoration checks passed; p95 RAF was 16.8 ms, maxima 17.8/18.5 ms, and both samples received 39 actual counter packets. **Visual review failed** because the foreground chair back hid the seated actors almost entirely. The lead confirmed the chair top extends 40.7 scene pixels above the foot while the back-facing seated content rises only 39.8. The subsequent seated-art offset was accepted in the final run above. Original PASS here describes script assertions only; `visual-review.json` records the separate failed visual gate. All processes closed normally after the full capture.

First 0.2.0 preview calibration: **runner checks PASS; final acceptance NOT_RUN**. `output/playwright/office-2.5d/after-1791190422994/manifest.json` contains 60 screenshots, four finalized videos and zero page errors. Actor-facing mapping was pending a subsequent build; this ASAR (`de7ea75ea24dce0a64819d15259554f5703864613bd074eb7f733d4a5dcff7ab`) must not be treated as the final accepted artifact. Fixture 1/16 both recorded p95 16.8 ms / max 16.9 ms RAF cadence and 40 actual counter packets during each eight-second sample. Startup-to-first-window was 3616/1562 ms and fixture-reload-to-ready 2383/3196 ms. Currently attached texture estimates were 44,153,488 / 45,759,120 bytes; unused cached frames and GPU overhead are excluded. New captures record an explicit `ZURI_QA_PURPOSE` and the runner hash.

The first preview observation failed on a legacy Pixi alpha property in the runner, corrected without changing the renderer; see [RCA](../.brain/rca/2026-10-05-office-qa-pixi-alpha.md). Failure evidence `after-1791190328142` remains intact.

Prior-package comparison **PASS**: `output/playwright/office-2.5d/after-1791190126657/manifest.json` verifies the unchanged 0.1.1 package, 16 displayed fixture labels, two viewport screenshots and finalized video. Screenshots visibly include the actual counter PTY. The first entry attempt failed due to a runner initialization race; its diagnostic evidence and [RCA](../.brain/rca/2026-10-05-office-qa-entry-race.md) are retained. This comparison does not accept the new renderer.

Corrected fair before comparison **PASS**: `output/playwright/office-2.5d/after-1791191839018/manifest.json`, using 15 workers plus one display-only coordinator and the same actual counter PTY arrangement as the final after fixture. Both viewport screenshots and one finalized video are hashed. The 0.1.1 ASAR remained `6cc8da2631924f22bd32804c4788593bbed4b5436d17a7d2745eb95d271ff118` at launch and completion. Use this corrected run for the final visual comparison; the earlier runs are retained.

`tools/verify-office-2.5d.cjs` writes each run to a fresh `output/playwright/office-2.5d/after-<timestamp>` directory. It preserves the old glass runner, original 0.1.1 screenshots, manifests and binaries. Its manifest records source HEAD/working tree status, actual packaged version, ASAR SHA256, screenshot/video SHA256, errors, measurements and limitations. `PASS` means the runner's explicit checks passed; visual review and live-model acceptance remain separate.

## Run inputs

Run from the repository with Node and the existing Playwright installation:

```powershell
$env:ZURI_PLAYWRIGHT_MODULE = '<absolute path to installed playwright module>'
$env:ZURI_QA_EXECUTABLE = 'O:\testzuri\zuri-agent-office\dist\office-0.2.0\win-unpacked\Zuri.exe'
$env:ZURI_QA_EXPECTED_VERSION = '0.2.0'
Remove-Item Env:ZURI_QA_CAPTURE_MODE -ErrorAction SilentlyContinue
node tools/verify-office-2.5d.cjs
```

Optional `ZURI_QA_CLI_DIR` is prepended to PATH for the already installed local provider CLI used by the principal-page capture. No provider is installed by this tool. Principal-page coordinator configuration points to a closed loopback endpoint; successful inference is not claimed. Onboarding is captured without submitting Finish.

For a fresh comparable screenshot of the old package, set `ZURI_QA_EXECUTABLE` to the preserved 0.1.1 executable, `ZURI_QA_EXPECTED_VERSION=0.1.1` and `ZURI_QA_CAPTURE_MODE=before`. This runs only the identical 16-agent display fixture and captures both viewport sizes; it intentionally does not apply 2.5D shape assertions to the old renderer. The original 0.1.1 evidence remains authoritative for its earlier verification.

## Fixture contract and measurements

Each 1/16-agent run uses a new isolated `ZURI_USER_DATA_DIR`, an empty workspace, `harnessHome:null`, disabled autonomy and the existing persisted `cth.agents` roster contract. Reloading imports those entries through normal store initialization. The existing one-use hive-picker flag enters the office without starting a coordinator. IDs and descriptions explicitly identify the entries as QA fixtures. One agent attaches to an actual local Node PTY emitting counters; the remaining entries are display-only and have no process. There are no production test APIs or artificial LLM events.

The runner measures first-window startup and fixture-reload-to-scene-ready separately. During eight seconds of office rendering it samples requestAnimationFrame intervals and confirms actual counter packets continue. It records Electron process memory metrics and unique rendered texture-source dimensions multiplied by four as an **estimate**, not GPU allocation. Video recording affects timing, so measurements describe this capture environment rather than a universal FPS guarantee.

Read-only observation discovers the Pixi Application through its existing React ref and traverses the stage. It records `agent:<id>` actor positions/global bounds, `office-2.5d:*` layers, labels, camera transforms and texture sampling. It never calls scene setters or alters coordinates. Pointer selection uses actual mouse clicks at projected sprite bounds and checks persisted selected ID. It records navigation and automatic camera fit/nudge; manual zoom/pan is **N/A**, absent from the baseline and outside this preservation change.

Restored fixtures are idle under the existing persistence contract. Their screenshots/card labels do not accept live working/error status transitions. Screenshots and video still require human/agent visual inspection for correct seating, depth occlusion, anatomy, legibility and artwork quality. A reduced-motion screenshot confirms the requested media condition, not animation suppression by itself.

The approved separate seating phase sends explicitly synthetic `PreToolUse`/`Edit` payloads through the existing main-to-renderer `hive:hookEvent` channel. It uses Electron test-process access to `BrowserWindow.webContents.send`, not a new production API or a store/scene setter. The real preload listener, status mapping, navigation and seating code execute. A visible DOM overlay labels each phase screenshot `CONTROLLED STATUS FIXTURE · ... · not model work`; this is documented capture instrumentation, and the earlier idle screenshots are preserved without the overlay. The runner requires every fixture card to show working, every actor to use a single seated-animation texture frame and distinct nearest desk anchors within eight projected scene pixels over three observations. It records full body bounds/texture IDs and anchor distances for visual review, then sends synthetic Stop events and asserts restoration to idle. Any readiness/response failure is retained in the manifest and screenshots. This accepts only the renderer's response to a controlled event; it does not accept model execution or real hook ingestion. Both final seating phases passed, with the bounded visual review recorded above.

The main capture subsequently covers both themes and viewport sizes, Settings sections, agent creation/editing and detail tabs, terminal continuity, IDE unsaved draft continuity, available command-center tabs and onboarding. All screenshots remain grouped by descriptive names in the manifest.

Calibration-v2 first run (`after-1791191175642`) passed one-agent seating but selected fixture 15 when the runner expected moving fixture 16. This result remains FAIL with screenshot and scene observations; those observations do not establish whether overlap or motion between observation/click caused it. To make subsequent selection checks reproducible, exact pointer selection is performed after the controlled seating phase settles, on a frontmost body with no higher-depth actor covering the chosen point. Before/after coordinates and the actual click point are retained. This is a test setup refinement, not a production hit-test fix or a waiver of the selection assertion.

The next controlled run (`after-1791191352469`) exposed an incorrect fixture roster: the existing scene reserves one of its 16 desks for the coordinator, but all 16 seeded entries were ordinary workers. Fifteen matched desk anchors exactly while the sixteenth correctly used boardroom overflow. The corrected 16-entry fixture marks its last, process-free entry as a display-only coordinator. No coordinator bootstrap occurs because its hive is null. The first entry retains the actual counter PTY. See [RCA](../.brain/rca/2026-10-05-office-qa-seat-reservation.md); the final before/after evidence above uses this same corrected roster.

Corrected v2 calibration (`after-1791191546637`) passed both 1/16 seating phases: all actor-to-desk distances were exactly zero, every body used a seated frame, statuses restored to idle, and stationary mouse selection selected the expected actor (fixture 14 in the 16-agent run). The coordinator stopped this calibration after fixture evidence to rebuild chair foreground/hand effects; `calibration-stop.json` records the interruption and v2 ASAR hash. Principal-page capture in that interrupted run is partial; final release acceptance was NOT_RUN for that calibration artifact. Use `ZURI_QA_CAPTURE_MODE=fixtures` to bound future calibration to these two fixture sessions; omit it for the complete final capture.

## Version diff

| Existing glass verifier | New office verifier |
|---|---|
| Preserved 0.1.1 script and evidence | Separate 0.2.0/snapshot 2.0.0 output |
| Main UI and motion checks | Same principal UI capture plus labeled 1/16 scene fixtures |
| No scene coordinate measurements | Read-only actor/camera/texture evidence with real mouse selection |
| Single expected package version | Explicit expected-version and prior-package comparison mode |
