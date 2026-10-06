---
status: active
superseded_by: null
---

# Reference fidelity failure in 0.2.0

## Symptom
The user rejected the delivered office as unlike Concept 01 and supplied the same image marked MEETING at the glass room behind the worker area and WORKER across the four desk pods.

## Evidence
- `docs/design/zuri-2.5d-concept-01.png` is the clean original of the user's marked reference: enclosing walls, front entrance, rear glass meeting room, rear-left kitchenette, left lounge and four central four-seat desk pods.
- `projection.ts` uses x-y and (x+y)/2: a fixed diamond isometric view rather than the reference's elevated frontal perspective.
- `sceneLayout.ts` iterates old seat positions and draws sixteen individual desks, plus one freestanding meeting table. It contains no glass meeting enclosure.
- `scene25d.ts` draws two simple walls and flat window polygons. It does not reproduce the reference's architecture or lighting.
- The accepted v0.2.0 screenshot `19-fixture-16-synthetic-seated.png` verifies seat visibility but visibly differs in layout, camera, scale, enclosure and overall composition.

## Root cause
The implementation treated the approved image as loose art direction and prioritized preserving old scene coordinates. The approved specification allowed floorplan recalibration, but the implementation effectively preserved the old composition. Separately generated individual furniture could not reproduce the image's coherent camera and architectural lighting.

## Why the issue escaped detection
Acceptance checked mechanics, paths, occlusion and removal of pixel art; no explicit reference-composition gate blocked delivery. A bounded seated visual PASS was incorrectly allowed to imply that the overall requested design had been delivered.

## Proposed prevention
Treat the user's reference as the composition contract. Derive the environment from the exact original with people removed, calibrate navigation and projection to its floor, and separately layer dynamic actors and foreground occluders. Preserve IDs and agent behavior rather than obsolete screen coordinates. Require side-by-side review of camera, enclosed meeting room, four worker pods, kitchenette/lounge, walls, entrance, scale and light before claiming visual acceptance. Preserve old evidence and record its design acceptance as rejected by the user.
