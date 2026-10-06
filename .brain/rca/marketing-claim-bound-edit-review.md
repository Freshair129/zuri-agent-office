---
status: active
superseded_by: null
version: 0.1.0
---

# Claim-bound editing: unchanged hero and incomplete response contract

Date: 2026-10-06 (Asia/Bangkok). Observed acceptance failure confirmed; model-internal cause unresolved. QA result only; no product fix is claimed.

## Symptom

Snapshot 5.0.8 B read context, skill and draft, preserved the grounded hero, but failed to deliver two actual edits, complete claim accounting and the required output layout. Automatic and manual acceptance both FAIL.

## Evidence

Run: `output/playwright/marketing-claim-bound-1791248635666`. Session `ses_ef13e9307ffeEm0UutLB7sDzwL`; parent `msg_10ec16d19001m7ZtjNXq74yz0l`; final `msg_10ec22fa2001ZkZOkFxYWHf4zk`. Full output: 1854 characters, SHA-256 `fb435bc888b959fe1bed63ecdbcc668c537d7297687b696037741615d1e5f41c`.

- Actual completed reads under B's own parent cover all three required files. Exact CTA and QA_TASK_B_DONE are present.
- Headline, Subheading and CTA are identical to the accepted A draft. No spreadsheet/cloud-independence or morning-generation claim was added. Hero grounding passes this sample.
- The response begins with commentary before Headline. The existing classifier correctly reports contractLayout false.
- Edits 1 and 2 state that no edits were needed/made. They do not describe two actual clarity edits. The Sources and unknowns section was changed, but the explanations do not identify that change.
- Source accounting quotes genuine context text for features, audience, CTA and voice, but does not map the local desktop task organizer category in the hero to the Product source line. The assertion that each claim is supported is not complete accounting.
- Three pass-through HTTP requests, exact 9b model, explicit none, all HTTP 200, zero reasoning characters or parser errors, context 32768, maximum prompt tokens 10791, no truncation. One session and one user task; no retry. The draft and all 57 controlled files verified, including historical evidence. Six executed runner hashes match the implementation checkpoint.

## Root Cause

The directly established causes of acceptance failure are response-contract noncompliance: prefatory text outside the required layout, no two actual edits, and incomplete claim-to-source accounting. These are present in the model's raw final output; the exporter did not introduce them. The two numbered entries satisfy a structural count but do not satisfy the semantic requirement to explain actual changes.

Why the model chose to retain the hero is unresolved. Its stated rationale about conservatism is part of the output, not independent evidence of internal causality. This single changed-prompt sample cannot establish that stronger grounding instructions generally prevent editing or fix hallucination.

## Why the issue escaped detection

It did not escape acceptance. Automatic layout validation rejected the answer. Separate manual review detected the absence of actual edits and missing source coverage. Existing numbered-entry checks intentionally do not prove edit accuracy; passing them must never be promoted to full acceptance.

## Proposed prevention

Retain the independent layout, factuality, source-coverage and actual-diff reviews. Preserve this failure and the original answer. Do not fabricate edits, remove the preface after generation, waive accounting or retry the exhausted experiment. Any later workflow change requires a separate scoped plan; this run supplies no evidence for a product-level fix.
