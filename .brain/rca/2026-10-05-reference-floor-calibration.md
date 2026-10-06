---
status: active
superseded_by: null
---

# Reference-floor calibration and exact-foot selection

## Symptom

The rejected 0.2 scene used the original grid's sixteen independent desks rather than the approved four-pod room. Carrying its actor offsets and logical contact tests into the reference camera would also misplace seated bodies and ground selection.

## Evidence

- `reference-room-v1.png` is 1536×1024 and contains four four-seat pods, rear glass meeting room, two lounge chairs, a rear-left kitchen and a framed front entrance.
- The old projection was `(x-y, (x+y)/2)` and its scene bounds were 960×576. That geometry cannot produce the approved frontal perspective.
- Characters place feet at `(tile.x+.5, tile.y+1)*16`, while the old floor hit test used `floor(unprojectedY/16)`. Exact bottom-edge contacts therefore selected the next row. The read-only reviewer reproduced `desk-ceo {27,37}` selecting `{27,38}`.
- The first calibrated entrance `(725,827)` inverted beyond row63. A window stand `(244,237)` lay outside the usable room polygon. Neither was solved by silently opening furniture or walls.
- Only two lounge chairs exist; retaining four seated café positions would put two people on empty floor.

## Root Cause

The renderer previously conflated persisted identity with geometric coordinates. Image-space furniture, logical foot contacts, hit selection and actor art were calibrated independently. Legacy tests scanned numeric theme literals and tested the saved map, so they did not exercise the new runtime geometry.

## Why the issue escaped detection

The 0.2 acceptance checked its own transformed anchors and mechanics, not agreement with the reference composition. Generic cell-center round trips do not expose bottom-edge selection errors. An actor merely entering a seated animation does not prove there is a chair beneath it.

## Correction and prevention

- One pure `sceneLayout.ts` contract now supplies all16 stable seat IDs, four pods, two facing sides, image silhouettes, floor/solid polygons, meeting doorway and functional destinations.
- The renderer-local96×64 grid uses a reversible four-corner floor homography in the native1536×1024 image space. No persisted map, profile or roster is rewritten.
- Every required destination must be walkable; constructor validation fails instead of carving holes. Focused BFS tests cover all seats/errands/café/meeting/task destinations and require meeting entry through the doorway.
- Exact foot selection applies a tiny bottom-edge epsilon before converting inverse Y to a tile. Tests cover every seat at four camera scales, not just cell centers.
- Extra historical café IDs remain standing break spots. Two actual lounge chairs remain seated spots.
- The new camera-matched N/S artwork removes the old universal seated−12 offset. Body height varies152–200 image pixels by floor depth; the container's navigation contact and depth are unchanged.
- A single unchanged room PNG forms the background. Foreground masks reuse that texture only over desktop/monitor/chair silhouettes, opaque wall edges and glass mullions. Full opaque glass-pane crops are prohibited because they would erase occupants.

## Verification boundary

Focused projection/scene, saved-map compatibility, generated-actor and WebGL recovery checks:21/21 PASS. Web TypeScript check:PASS. Live1/16 seating anatomy,17th meeting occupant behind glass, pointer selection and reference comparison remain the independent desktop visual gate; these unit checks do not claim that gate passed.

## Meeting overflow correction before packaging

The inherited OfficeFloor collector enumerated every walkable tile in the boardroom zone and treated them as seats. In the reference renderer its first tile projects near(735,205), empty meeting-room floor. A seventeenth synthetic working agent would therefore air-sit despite passing zone reachability. The approved correction replaces this enumeration with four explicit visible meeting-chair contacts and N/S facing metadata, retaining the original `warroom-seat` alias. The table collision core follows its supports, while front chair approaches remain outside that solid core. A regression must assert the exact ordered overflow contacts and reachability, and reject generic zone-cell enumeration. Live chair anatomy remains a separate visual check.

Meeting-chair regression added after the overflow correction:22/22 focused checks PASS; web typecheck and diff check PASS. The collector now reserves only four visible chairs, with the original `warroom-seat` identity first. Generic zone enumeration is removed. Packaging visual verification remains pending.

## North-facing seated proportion correction after first packaged capture

### Symptom and evidence

The packaged0.3 capture in `output/playwright/reference-office/after-1791194776864/` passes1/16/17 navigation, selection and seating-state checks. The separate visual gate fails in `22-fixture-16-synthetic-seated-front-detail.png` (also21/23/28): near-side north-facing heads sit approximately20–30 reference pixels too low, hands fall below the desktop and the pelvis appears below the chair seat. Far-side south-facing poses align coherently. The meeting occupant remains visible through glass, but has the same north-facing proportion problem.

### Root cause

Camera-matched north seated art has shorter visible proportions relative to its standing normalization than the actual reference-chair geometry requires. The renderer applied the same perspective body scale to both N/S seated poses. Correct ground positions and pose-state checks therefore passed while anatomy relative to furniture failed.

### Why it escaped and prevention

Unit geometry cannot establish human/chair anatomy. The independent packaged visual comparison caught this before release acceptance. Correct only north-facing seated body scale by1.15 around the unchanged bottom-center foot anchor. Keep standing and south-facing seated scale unchanged. Derive scale afresh from perspective and state on every pose/position refresh; a regression must toggle facing, seating, position and reduced motion repeatedly to reject cumulative scaling. Hand/head attachments should use the corrected body height. No floor contacts, paths, masks or camera bounds change.

North-seated correction source verification:23/23 focused checks PASS, including repeated north/south/standing/read/walk transitions at two perspective depths. Web typecheck and diff check PASS. Head/hand attachments consume the same corrected `getHeight()` as the body. Ground coordinates remain unchanged. Fresh packaged anatomy capture is still required.
