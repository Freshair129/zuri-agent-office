---
status: active
superseded_by: null
version: 0.1.0
---

# Inline bold section labels misclassified by the QA assessor

Date: 2026-10-06 (Asia/Bangkok). Bounded correction within the approved QA assessment scope. No new model session or product change.

## Symptom

Snapshot 5.0.4 Task B visibly includes `**Headline:** text`, `**Subheading:** text` and `**CTA:** View the demo`, but the raw automated receipt marks contract content and exact CTA false.

## Evidence

`output/playwright/marketing-live-1791242189948/task-B-output.md` preserves the exact response. `live-result.json` records B message `msg_10e6e2836001BGBuusm7b2DQTA` and the false checks. In `assessOutputContract`, bold normalization uses `(?=:|\s*$)` after the closing asterisks. A space followed by content is neither a colon nor whitespace extending to the end of the line, so normalization fails and the heading parser never sees the label.

## Root Cause

The normalizer accepts standalone bold labels but omits the inline bold-label form. The parser already intentionally supports inline colon-separated content, so this is a presentation-parsing defect, not a missing model CTA. It does not explain the independent missing marker, missing B context re-read, unsupported product claims or inaccurate edit rationale.

## Why the issue escaped detection

The regression fixture covered standalone `**CTA:**` with the CTA on the next line, not the observed inline form. Both are ordinary Markdown labels, but only one was exercised.

## Proposed prevention and bounded correction

Normalize only the five recognized bold labels, accepting whitespace followed by inline content. Add a regression for actual inline labels and a negative test for bold prose that is not a label. Keep every other acceptance requirement. Reassess saved events offline into a separate receipt, retaining original raw results and executed-runner hash. Do not rerun the model, strip missing markers into existence or rewrite the original evidence.
