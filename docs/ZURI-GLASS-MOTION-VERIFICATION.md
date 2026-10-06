---
status: active
superseded_by: null
version: 0.1.1
---

# Zuri 0.1.1 glass and motion verification

2026-10-05, Windows x64. C-2, risk MEDIUM. The user approved the restrained visual contract before implementation. Baseline: app 0.1.0, source d3265dde789f540c3155b9244d91c4dbd1ef7700. Reference design: Freshair129/zuri.ai 332b88c9277ee0995798f125f99d5343e7d493f0. This is a local unsigned development build; no release, push or deployment was performed.

## Result

The scoped packaged-UI acceptance run passed. Runtime identified itself as Zuri 0.1.1, packaged, Electron 32.3.3. ASAR SHA256: `6cc8da2631924f22bd32804c4788593bbed4b5436d17a7d2745eb95d271ff118`.

| Check | Result | Evidence / boundary |
|---|---|---|
| Typecheck and production build | PASS | `output/playwright/glass-typecheck-final.log`, `glass-build-final.log` |
| Windows packaging | PASS | `glass-package-final.log`; setup, portable and unpacked app created under `dist/glass-0.1.1` |
| Packaged UI interactions | PASS | `tools/verify-glass-motion.cjs`; isolated profiles, 46 screenshots, no renderer page errors |
| Dialog lifecycle | PASS | Focus trapping, IME Escape, nested reset cancellation, unsaved-toggle close cancellation, immediate focus return and inert/aria-hidden exit |
| Reduced motion | PASS | Changed preference with the same card mounted: pressed transform `none`; dialog closes immediately. See RCA for the first implementation's detected and corrected subscription defect |
| Terminal/editor continuity | PASS, bounded | Same terminal DOM instance across GIT/MESSAGES/TRACES/TERMINAL; same editor instance after changes/history switching with an unsaved QA draft |
| Motion with terminal output | PASS, measured window | 225 animation frames; p95 16.8ms, max 17ms, zero frames above 50ms; 10 controlled shell output packets during the same window. Intermediate dialog opacity/translation recorded |
| Themes and sizes | PASS, inspected | Office and Settings at 1280x800 and 1440x960, light/dark. Dialog bounds stay inside viewport; scrollable content remains available |
| Relevant terminal/focus tests | PASS | 20 tests across terminal-recovery, focus-mode and restart-terminal-preserve; includes Electron pooled terminal/scrollback fixture |
| Settings tests | PASS | 11 tests in settings-one-save; only the obsolete label-size assertion changed to 13px/18px |
| Native smoke | PASS | SQLite insert/read and real PTY echo under Electron 32.3.3 / ABI128, following dependency installation |
| Full regression | FAIL, unchanged baseline failures | 977 total: 941 passed, 22 failed, 14 skipped. Same 22 failing test names as baseline; see ZURI-QA.md. This is not an all-green suite |
| Installer installation / portable self-extraction | NOT_RUN | The unpacked executable was exercised; generating installers does not validate installation |
| Live LLM workflow in this visual run | NOT_RUN | QA worker emits counters every 200ms; coordinator targets a closed loopback endpoint. Existing provider evidence remains separately qualified |

Token calculations over worst-case neutral backing yield primary/secondary/active text contrast of approximately 11.16/5.31/5.17 (light) and 9.39/6.00/5.53 (dark). Actual light/dark screenshots were visually inspected. This is not a comprehensive accessibility or screen-reader certification. The frame sample is evidence for this machine and short run, not a universal frame-rate guarantee; the screen recording itself is 25fps.

## Visual evidence

Successful raw capture: `output/playwright/glass-motion/after-1791186067507`, from 07:41:07 to 07:41:59 UTC. Before capture: `output/playwright/glass-motion/before`. Packaged gallery: `output/playwright/snapshots/zuri-v0.1.1-glass-motion-2026-10-05/index.html`, with a sibling ZIP.

Snapshot version **1.1.0** contains 46 after screenshots plus eight matching-size/theme before screenshots, main interaction video, onboarding video, capture manifests, artifact hashes and a source commit. PNGs are original captures, not edited mockups. Profiles and QA workspace data are excluded from the shareable bundle. Before/after profiles differ in their controlled agent state; the comparison proves appearance, not pixel-identical workflow state.

Coverage: four Add Agent sections; four agent detail tabs; light/dark office and Settings at both sizes; all seven Settings sections plus long-content bottoms; Edit Agent; IDE with unsaved QA draft; ten Command Center tabs; six onboarding states. This covers the requested principal surfaces, not every conditional integration/provider/error dialog.

The full successful manifest is retained at [glass-motion-live.json](evidence/glass-motion-live.json). The gallery manifest records the source commit without a circular self-referential commit hash in this document.

## Reproduction and implementation boundaries

Run `node tools/verify-glass-motion.cjs` after building the unpacked app. Set `ZURI_PLAYWRIGHT_MODULE` if Playwright is provided outside the project, `ZURI_QA_EXECUTABLE` for another executable location, and `ZURI_QA_CLI_DIR` to the directory of an already-installed OpenCode CLI. The tool uses unique local test profiles and removes secret-like inherited environment variables. It never completes onboarding or requests model inference.

Motion 14.0.0 is pinned. Only five package entries were added (motion, framer-motion, motion-dom, motion-utils and tslib); every pre-existing lock entry is unchanged. Notices cover 502 installed production packages. Native artifacts are the previously smoke-tested ones; packaging used `npmRebuild=false` and local Electron binaries. The inherited development build's SpectreMitigation=false workaround and unsigned status remain documented in ZURI-VERIFICATION.md. This is not a hardened release build.

Initial capture attempts failed because the harness lost Node from Windows PATH, then searched PTY command text for an argument that listPtys does not expose. Those failed manifests remain separate and are not acceptance evidence. The corrected harness preserves PATH case, adds its Node directory, and locates the actual QA PTY identifier. App source was unchanged by these harness repairs.

## Known findings outside this change

- General's inherited Updates subsection still says automatic checks despite the manual-only runtime. The approved visual spec explicitly excludes this copy fix.
- The baseline max-turns numeric Settings field is not included in the unsaved-state guard until its own persistence action. The new close-guard acceptance uses the existing staged toggle path; it does not claim this older numeric-field behavior was fixed.
- Some untouched descendant controls, including inherited update labels and rename pencils, remain smaller than the new touched-surface type scale. No complete typography migration is claimed.
- The 22 baseline suite failures remain; no new failures were observed in the compared run.

## Version diff

| 0.1.0 / snapshot 1.0.0 | 0.1.1 / snapshot 1.1.0 |
|---|---|
| Zuri semantic colors and original office | Added glass, radius and motion tokens, same reference colors/art |
| Opaque/angular shared shells | Opt-in glass toolbar/nav/dialogs; opaque terminal/editor/content |
| Immediate tab/dialog changes | 80-240ms restrained tween feedback and scoped tab indicators |
| Small inherited touched labels | 12px captions, 13px labels, 14px body targets and Thai fallback |
| Baseline modal handling | Focus trap/IME guard, inert exit and reactive reduced motion |
| 941 pass /22 fail /14 skip | Same full-suite counts; additional live visual acceptance passed |

Original 0.1.0 binaries and evidence are preserved. Backend, permissions, provider, persistence and native dependency source were not changed.
