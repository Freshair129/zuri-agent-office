---
status: active
superseded_by: null
version: 0.1.0
---

# Dialog focus during visual transitions

## Symptom

Review of the new MotionDialog found that replacing a Settings subview could leave keyboard focus on document.body; an IME Escape could also close a dialog. These are defects in this in-progress implementation, not asserted baseline runtime failures.

## Evidence

MotionDialog's first implementation handled keydown without isComposingKey and repaired focus only when `present` changed. Settings replaces General content with reset/change-home confirmation while `present` remains true. Removing the focused trigger does not reliably dispatch focusin to the new subtree.

## Root Cause

Focus ownership followed overlay presence only, rather than both presence and replacement of focused descendants. The new Escape path omitted the project's existing IME guard.

## Why the issue escaped detection

Typechecking cannot establish keyboard focus lifetime, and the initial implementation had not yet received live nested-view and IME interaction verification.

## Proposed prevention

Reuse isComposingKey, repair orphaned focus on child-list changes only in the topmost present dialog, and verify subview replacement, IME Escape, ordinary Escape, focus restoration and inert exit in Electron. Keep these changes within the already-approved visual interaction contract.

## Live reduced-motion finding

Symptom/evidence: after changing prefers-reduced-motion to reduce in the running Electron window, pressing Motion QA still produced matrix(0.98,0,0,0.98,0,-1.99961). Newly opened dialogs were instant, masking the existing-card problem. Inspection of motion14.0.0's use-reduced-motion.mjs shows useState(prefersReducedMotion.current) with no update subscription. Root cause: existing components retained the preference from their first mount. The initial test covered newly mounted dialogs only. Prevention: subscribe to matchMedia change via useSyncExternalStore and test the same mounted card before and after a preference change.
