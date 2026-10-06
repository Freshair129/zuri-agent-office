---
status: active
superseded_by: null
version: 0.1.0
---

# Editing acceptance and correction workflow limitations

Date: 2026-10-06. Investigation for the user's "fix it all" request. Read-only code/evidence inspection; no implementation change in this checkpoint.

## Symptom

Snapshot 5.0.8 failed layout, complete evidence accounting and actual editing. The grounded hero was unchanged. The user requests resolution of all three remaining failures.

## Evidence

- [Original response RCA](marketing-claim-bound-edit-review.md) binds the actual 1854-character answer to SHA-256 `fb435bc888b959fe1bed63ecdbcc668c537d7297687b696037741615d1e5f41c`. The final contains introductory prose, an unchanged hero and two explanations of making no edits.
- `assessOutputContract` in `tools/verify-marketing-live.cjs` checks numbered entries 1 and 2 and nonempty text. Its arguments are response text and task letter; it receives no original draft. It cannot verify an actual A-to-B change. It correctly rejects text before Headline.
- `tools/verify-marketing-claim-bound-editing.cjs` requests source accounting in free prose. Its final gate reuses structural checks; semantic completeness is intentionally deferred to manual review.
- That runner claims one attempt and saves a final result after one Plain B session. There is no reviewed rejection-to-correction transition. This implements its approved one-attempt experiment, not an accidental retry defect.
- The raw runtime evidence verifies all three reads, model/none/context controls and no truncation. No transport or missing-source failure was observed. Final manual acceptance correctly failed.

## Root Cause

The directly confirmed response failures are documented in the original RCA. At the workflow level, the existing validator lacks original-draft input for actual-edit checking, the source-accounting response has no machine-readable structure, and the bounded experiment has no correction transition. These explain why the workflow can reject the answer but cannot mechanically verify actual edits or request a correction within its existing scope.

These are demonstrated design limitations, not proof that they caused the model's wording. Why the model chose an unchanged hero remains unresolved. A new validator or correction pass is not a guaranteed model-behavior fix.

## Why the issue escaped detection

It did not escape final acceptance. Layout validation and manual review rejected it. The narrower `exactlyTwoEdits` structural check passed because two numbered entries existed. Treating that flag as evidence of actual editing would overstate its meaning.

## Proposed prevention

Give a new opt-in validator both original and candidate drafts; require exact before/after field evidence and real changes. Make claim/source entries parseable while retaining manual checks for truth, complete coverage and editorial quality. Keep strict layout rejection. Permit one separately recorded correction only after a hash-bound failed review identifies concrete violations; preserve every rejected answer and never silently rewrite output. The proposed contract and bounded scope require R5 approval before implementation.
