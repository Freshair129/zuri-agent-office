---
status: active
superseded_by: null
version: 0.1.0
---

# Pixi alpha observation in the office verifier

## Symptom

First 0.2.0 calibration capture timed out waiting for one visible labeled actor even though its screenshot showed the office and Fixture 01 label.

## Evidence

`output/playwright/office-2.5d/after-1791190328142` contains the actual failure screenshot and accessibility snapshot; the fixture terminal was streaming and no renderer errors were reported. The installed Pixi `Container.mjs` defines `groupAlpha` and uses it for visibility. It has no `worldAlpha`. The verifier read `node.worldAlpha` and required the returned alpha to exceed 0.9.

## Root Cause

The runner used a legacy Pixi alpha property against Pixi 8, so its own readiness predicate could never succeed. The actor existed; the observation was invalid.

## Why the issue escaped detection

The old-package comparison mode counts rendered text and does not apply new actor readiness assertions. Syntax validation cannot check runtime library object properties.

## Proposed prevention

Read Pixi 8 `groupAlpha` with `alpha` as a compatibility fallback, preserve the visibility assertion, and save the last scene snapshot on a timeout. This changes QA observation only; it does not change renderer behavior.
