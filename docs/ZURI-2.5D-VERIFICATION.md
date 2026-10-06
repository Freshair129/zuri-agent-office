---
status: active
superseded_by: null
version: 0.2.0
---

# Zuri 0.2.0 warm miniature office verification

**Subsequent user review: reference fidelity REJECTED.** The user reported that this delivery does not resemble the approved reference. The mechanical and narrowly scoped seating results below remain historical evidence; they do not establish acceptance of the overall requested design. See [root cause](../.brain/rca/2026-10-05-reference-fidelity.md) and [correction contract](ZURI-REFERENCE-FIDELITY.md).

2026-10-05, Windows x64. User-approved [contract](ZURI-2.5D-OFFICE.md), C-3 and risk HIGH within scene rendering. Baseline 0.1.1 source `f9423262ab7c0f02693ebdf762bb9b23f10264e8`; Zuri design reference `332b88c9277ee0995798f125f99d5343e7d493f0`. Local unsigned development artifacts only; no push, publication or deployment.

## Result

Scoped packaged UI and seated visual acceptance **PASS** on the corrected final artifact. Runtime reports Zuri 0.2.0, packaged, Electron 32.3.3. ASAR SHA256: `c4264e4fada23eaa91e7b1febfc2ab88f3c96fb9f89959d30e2bc2a42cdddcf0`, identical at capture start/completion and after installer packaging. This does not make the full test suite or live-model workflow pass.

| Check | Result | Evidence / boundary |
|---|---|---|
| Node/web typecheck and production build | PASS | `output/playwright/office-typecheck-final.log`, `office-build-final.log` |
| Windows packaging | PASS | `office-package-final.log`; setup, portable and unpacked app under `dist/office-0.2.0` |
| Focused scene/asset/recovery tests | PASS, 23/23 after final seated-height correction | Projection/inverse, retained IDs and original hashes, actual renderer placements, shared depth/mask texture, all required paths and seated/standing visual-offset transitions |
| Full regression before final seated-height correction | FAIL | 984 total: 947 passed, 23 failed, 14 skipped; all 22 previous failures remain plus `quit-sweep.electron.test.cjs`. The subsequent narrow offset change adds one focused regression and is verified by the 23-test scene suite and packaged captures |
| Isolated quit-sweep recheck | PASS | `office-quit-sweep-recheck.log`; process tree reaped successfully. The full-run extra failure remains recorded; root cause is unconfirmed, so this recheck does not convert the full suite to PASS |
| C-3 source review | PASS, bounded | Projection separates display/navigation; furniture/obstacles share placement; mask reuses exact texture/contact with depth -0.5 / actor / +0.5. Visual acceptance is separate |
| Packaged main UI interactions | PASS | 66 screenshots, four videos, zero page errors in `after-1791192266634`; focus/IME/unsaved guards, inert exit, terminal/editor continuity and mounted-card reduced-motion checks |
| 1/16-agent navigation and selection | PASS, controlled fixtures | Observed movement, real pointer selected exact stationary actor IDs, automatic camera fit; 15 workers plus reserved coordinator in the sixteen-seat roster |
| Controlled seating response | PASS, synthetic status | All actors working and seated at distinct anchors, then restored to idle through existing IPC/status/navigation; not real model work |
| Seated visual review | PASS, inspected 1/16 full/detail captures | Heads/shoulders visible above chair backs, coherent lower-body occlusion and arms directed toward keyboards; no remaining actionable clipping in these images |
| Themes, sizes and portraits | PASS, bounded visual review | Light/dark at 1280x800 and 1440x960; smooth office art and matching portraits, readable controls and scrollable long content |

The first chair-mask package, ASAR `68d47d5aad5c83dab2004ea881b6c21abc8c6821c46ed6bdb6d233497eba1fcc`, passed all mechanical runner checks in `after-1791191900858` (64 screenshots, no page errors) but **failed visual acceptance**: the generated back-facing seated body was shorter than the chair back. It is preserved as calibration evidence and excluded from the final accepted gallery. A seated-only visual offset addresses the documented height mismatch; logical position, depth and standing size remain unchanged.

Native/runtime source and dependencies are unchanged from the previous verified build. The full-run quit-sweep observation said one root PID survived, while its cleanup reported that PID no longer existed; the isolated rerun passed. There is insufficient evidence to attribute that discrepancy to this renderer change or claim a specific timing cause.

## Measured capture window

| Measurement | 1 displayed agent | 16 displayed agents |
|---|---:|---:|
| First window | 8455 ms | 2206 ms |
| Fixture reload to ready | 2290 ms | 3206 ms |
| RAF samples during about eight seconds | 485 | 490 |
| RAF p95 / maximum | 16.8 / 16.8 ms | 16.8 / 16.8 ms |
| Frames above 50 ms | 0 | 0 |
| Actual counter PTY packets in sample | 39 | 40 |
| Attached texture RGBA estimate | 44,153,488 bytes | 45,873,808 bytes |
| Electron GPU process working set | 258,892 KiB | 271,516 KiB |
| Electron GPU process private bytes | 631,268 KiB | 683,200 KiB |

Startup samples are single observations, not comparative benchmarks. Video recording was active. Installer compression also ran during part of this capture, so these values do not isolate renderer cost. RAF cadence does not prove every GPU frame completed, and process memory is not dedicated GPU memory. Generated pose cycles remain compact sprite animation, not motion capture.

## Final evidence

Final run: `output/playwright/office-2.5d/after-1791192266634`; corrected prior-package comparison: `after-1791191839018`. [Full live manifest](evidence/office-2.5d-live.json) records explicit checks and raw observations. [Build input hashes](evidence/office-build-inputs.json) cover 306 source/config/resource files and bind the final source tree to the tested build; dependencies remain pinned by the unchanged lock entries.

Gallery: `output/playwright/snapshots/zuri-v0.2.0-office-2.5d-2026-10-05/index.html`, with a sibling ZIP. It contains 66 after images, two before images, four final videos plus one comparison video, manifest and checksums. Two detail images are direct UI screenshot clips with capture bounds recorded; no screenshot pixels were retouched. Version/source/artifact hashes are included. The gallery links the final local commit; captures were collected before that commit with their original dirty-tree metadata preserved.

Artifacts: `dist/office-0.2.0/win-unpacked/Zuri.exe`, `Zuri-0.2.0-win-x64-portable.exe`, and `Zuri-0.2.0-win-x64-setup.exe`. The corrected unpacked app was built first and exercised directly; installers were then made with `--prepackaged` from that exact directory, without rebuilding application source. Installer installation and portable self-extraction remain NOT_RUN.

| Artifact | SHA256 |
|---|---|
| Setup | `71987e8e62e946f6cae0af1277084a83aca3c45853d8446d1f938b442d95cd35` |
| Portable | `3929756205e4ed19ed190c48b157cbe04efe351db0d5e76497214381c81073ec` |

## Implementation and provenance

The active renderer uses newly generated oak flooring, six furniture types and detailed adult frames/portraits. The original generated PNGs are retained unmodified, with prompts and SHA256 in [furniture provenance](design/2.5d-furniture-assets.json), [furniture prompts](design/2.5d-furniture-prompts.json) and [character provenance](design/2.5d-character-assets.md). Runtime alpha trimming, cropping, garment recoloring and chair-back masking compose those assets without altering source PNGs.

Navigation retains the persisted 34x22 map, all sixteen seat IDs, avatar IDs and event plane. Projection/inverse mapping, shared furniture footprints, generated seated poses, chair foreground masking and depth ordering replace the old pixel rendering. Names appear on hover/selection in the scene and remain on agent cards. Zuri semantic tokens, glass surfaces and Motion 14.0.0 remain the approved UI treatment. No backend/provider/schema or dependency upgrades accompany this change.

## Evidence contract

The verifier uses isolated profiles, a real local Node counter PTY and labeled display fixtures. The sixteen-seat roster contains fifteen workers plus the reserved coordinator. Synthetic working/Stop events test the existing IPC-to-status-to-navigation-to-seating response; screenshots visibly label this phase as controlled status, not model work. Real mouse clicks verify selected identity after actors settle. The earlier moving-target selection failure is retained, not promoted into an unsupported production RCA.

Screenshot version 2.0.0 identifies app 0.2.0, capture time, source commit and exact ASAR/artifact/file hashes. The gallery contains principal app surfaces, both themes at 1280x800 and 1440x960, one/sixteen-agent states, labeled seating, onboarding and recordings. It excludes QA profiles, workspaces and credentials. This is not coverage of every conditional integration/error dialog. Comparable 0.1.1 captures use the same roster; random idle positions can differ.

## Limitations

- Three generated adult anatomies with five garment variants preserve fifteen IDs; these are not fifteen independently generated bodies. Reading reuses seated poses. Working selects seated idle, not animated typing.
- This is layered prerendered 2.5D, not an interactive 3D engine. Hand effects use calibrated offsets, not skeletal inverse kinematics. Existing automatic camera fit/nudge is preserved; manual zoom/pan was absent and remains N/A.
- RAF measurements describe a short recorded run on this machine. Texture bytes estimate currently attached unique RGBA source dimensions, excluding unused cached frames and GPU overhead; Electron process memory is separate and does not establish exact GPU allocation.
- Live-model work, external integration workflows, screen-reader certification, installer installation and portable self-extraction are NOT_RUN in this visual change. Earlier local-provider evidence remains separately qualified.
- Native dependencies are the previously smoke-tested Electron 32.3.3 / ABI128 binaries. Packaging uses local Electron, `npmRebuild=false`, and the existing SpectreMitigation=false development workaround. This is an unsigned development build, not a hardened release.
- Full-suite baseline failures and existing unrelated UI findings remain recorded in ZURI-QA.md and ZURI-GLASS-MOTION-VERIFICATION.md.

## Version diff

| 0.1.1 / snapshot 1.1.0 | 0.2.0 / snapshot 2.0.0 |
|---|---|
| Pixel office and procedural actors/portraits | Generated detailed warm miniature office and smooth adult frames/portraits |
| Orthogonal displayed grid | Isometric projection with inverse hit mapping |
| Whole-object depth and old seated crop | Calibrated contacts, chair foreground and generated seated poses |
| Original walkable grid | Same persisted map plus transient shared furniture footprints |
| Restrained Zuri glass and motion | Preserved tokens, themes, controls and reduced-motion behavior |
| Principal UI snapshots | Principal UI plus measured 1/16 fixtures and visibly labeled seating evidence |

Original 0.1.0 and 0.1.1 binaries and evidence remain intact. Final source identity is recorded in the snapshot manifest, avoiding a circular self-referential commit hash here.
