---
status: active
superseded_by: null
---

# 2.5D prop anchor calibration

## Symptom
The first implementation placed decorative plants away from existing watering destinations.

## Evidence
Before visual QA, `scene25d.ts` used a decorative plant list: (1.5,2), (8,8), (24,9), (32,3), (32,18).
The active `themeRegistry.ts` watering `fx` anchors are (1,20), (23,20), (31,20), (6,3), (17,3).
Navigation still uses those original errand destinations, so agents would water empty space.

## Root cause
The new furniture renderer was calibrated from visual composition instead of consuming existing semantic prop anchors.

## Why the issue escaped detection
Projection/path tests verify mathematics and reachability; they cannot prove a decorative sprite is attached to the object an errand references.

## Proposed prevention
Pass the active theme's watering anchors to the renderer and place generated plants at their projected tile ground contacts. Keep the logical map unchanged. Inspect coffee/cafe seating and plant interaction during desktop QA; do not claim alignment from unit tests alone.

## Live preview follow-up
The 16-agent preview `output/playwright/office-2.5d/after-1791190422994/12-fixture-16-light-1440x960.png` shows 48-unit actors too small beside generated desks and persistent 12px nameplates overlapping. Increase bodies to 64 scene units and show full-size nameplates for hover/selection; the roster retains all names.

The original collision layer contains only outer walls and desk blocks. Generated meeting/cafe/counter/sofa footprints therefore intersect walkable space. Root authorized the required transient obstacle overlay on 2026-10-05: one placement definition drives art and runtime obstacles; all existing spawn, errand and cafe destinations must remain reachable. No persisted map, navigation coordinates, data or schema is migrated.

Source review also found the human handoff endpoint still constructed from logical pixels while agent endpoints were projected. Route that endpoint through the same projection. The original handoff code assumed all world coordinates were orthogonal, and projection-only unit tests did not exercise a human recipient.

The expanded 3x2 desk footprint failed the actual required-destination regression at (2,3), the CEO window stand, and would cover the task-board approach. Desk desktops retain their original 2x2 solid collision cores; alpha shadows/chair clearance are not solid obstacles. New non-desk furniture uses calibrated transient footprints. Tests read current errand/coffee stand literals and require every destination to remain reachable, rather than carving a hole through a prop to make a test pass.

The generated desk composite is asymmetric. Direct inspection of `assets/office-2.5d/desk.png` and the character lane's alpha scan locate the chair caster ground near source (620,855), while the alpha-trimmed composite frame is approximately (257,66,1068,900). Bottom-center anchors put the actor about 14 scene units right and 9 below the chair at 88-unit desk width. The loader now computes the texture anchor from that source-space semantic contact after trimming. Logical seat positions remain unchanged. Final pelvis/foot alignment still requires the seated desktop fixture; equal coordinate origins alone do not prove anatomical alignment.

## Seated v2 capture and foreground correction
Inspected `output/playwright/office-2.5d/after-1791191175642/09-fixture-1-synthetic-seated.png` at original size. The 64-unit actor now meets the chair, but its seated body paints over the chair back. Root cause: the entire desk/chair composite was one sprite behind the actor. A single depth key cannot express furniture parts both behind and in front of a seated person.

Reuse the unchanged desk texture for a second, selectively masked chair-back layer at the same semantic ground contact, sorted at depth +0.5; the base remains at depth -0.5. The source-space mask follows the inspected upholstered back silhouette. This is runtime composition, not an edited asset. An actor walking closer than the chair still sorts above both layers. Desktop verification must assess visual anatomy, since geometry tests only prove mask ordering and shared contact.

Hand effects still used the former 32-pixel sprite's offsets (-6 to -13 from its feet), placing cups and watering tools near the knees/feet of the 64-unit body. Move standing hand effects to -29/-32 units and seated effects to -21/-23, with horizontal signs following the projected logical direction. These offsets are approximate visual calibration for the shared generated poses; no inverse-kinematics or physically simulated hand contact is claimed.

## Final-mask seated failure
Actual final-mask captures `after-1791191900858/09-fixture-1-synthetic-seated.png` and `18-fixture-16-synthetic-seated.png` fail visual acceptance: the backrest hides nearly the entire seated actor. Geometry readiness and equal seat origins passed, but did not establish visible head clearance. The inspected backrest top is approximately `(361 - 855) * 88 / 1068 = -40.7` scene units; the generated back-seated body occupies approximately `177 / 264 * 208 * 64 / 224 = 39.8` units above its contact. Therefore a correctly layered, equally anchored body cannot clear that chair.

Apply the approved seated-only visual offset of -12 scene units to the body's local sprite and to seated hand-effect positions. Keep the 64-unit standing scale, chair mask, container ground position, depth and navigation unchanged. Add a state-transition regression proving that seated rendering changes while ground/scale remain fixed and walking restores the body offset. A fresh close seated capture is required before visual acceptance; tests alone must not override the failed screenshots.
