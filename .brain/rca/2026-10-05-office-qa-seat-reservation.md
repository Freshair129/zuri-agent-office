---
status: active
superseded_by: null
version: 0.1.0
---

# Controlled seating fixture omitted coordinator reservation

## Symptom

The 16-agent seating phase timed out even though every card showed working and every body used a seated frame.

## Evidence

`output/playwright/office-2.5d/after-1791191352469/manifest.json` records 15 actor-to-desk distances of exactly zero. Fixture 16 is 118.93 scene pixels from its nearest desk. The labeled failure screenshot preserves all seated bodies. `OfficeFloor.tsx` reserves `GOD_SEAT = 0` for `agent.isGod`; ordinary workers claim seats from index 1 and then boardroom overflow. The runner incorrectly created 16 ordinary workers.

## Root Cause

The controlled roster did not represent the existing 16-desk allocation contract: one coordinator desk plus 15 worker desks. Its sixteenth ordinary worker correctly took an overflow seat, so the all-desk assertion was unsatisfiable.

## Why the issue escaped detection

The original idle fixture only counted displayed actors; it did not require all entries to sit at desks. The reservation becomes relevant only when seating is exercised.

## Proposed prevention

For the 16-entry roster, explicitly mark the last display-only entry as the coordinator role and describe that fact in the manifest. Keep the first actual counter PTY attached to an ordinary worker. `harnessHome:null` continues to prevent coordinator bootstrap. This remains a controlled display fixture and does not claim a real coordinator/model session. Keep the 16-distinct-desk assertion unchanged and rerun the before comparison with the same corrected roster for final paired evidence.
