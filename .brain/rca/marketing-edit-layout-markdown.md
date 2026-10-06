---
status: active
superseded_by: null
version: 0.1.0
---

# Unrecognized Markdown heading inside a field

## Symptom

Code review of the new 0.2.0 parser found that an extra Markdown heading inside a hero field did not independently fail contractLayout.

## Evidence

Before dispatch, a regression inserted `## Extra section` after Headline content. `node --test test/marketing-edit-repair.test.cjs` failed with contractLayout true instead of false. Reproduction: `output/marketing-edit-layout-reproduction.txt`.

## Root Cause

The new parser treated any non-label line as field content and rejected code fences but omitted the legacy assessor's explicit Markdown-heading rejection. Other exact field checks could reject the answer, but the layout check itself was incomplete.

## Why the issue escaped detection

Initial tests covered prefatory text, changed labels and text appended to CTA, not an unrecognized Markdown heading within otherwise present sections. Independent layout assertion during code review caught the gap before live inference.

## Proposed prevention

Reject Markdown heading lines in the strict-layout parser and retain the reproducing regression alongside existing format checks. Do not strip the heading or repair the response. This correction stays within approved 0.2.0 layout validation.
