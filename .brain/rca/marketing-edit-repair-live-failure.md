---
status: active
superseded_by: null
version: 0.1.0
---

# Structured edit contract still fails after one reviewed correction

Date: 2026-10-06. Snapshot 5.0.9. Observed response failures confirmed; model-internal cause unresolved. No further attempt is included in the exhausted plan.

## Symptom

The new validator correctly rejected both the initial candidate and its allowed correction. The correction shortened Headline, but left Subheading unchanged while its edit record claimed a different final value. Unknown-fact records remained invalid. Both answers retained grounded hero facts and the required outer layout.

## Evidence

Run: `output/playwright/marketing-edit-repair-1791250019712`.

- Candidate session `ses_ef129b336ffeeOxh7giRJgO4cB`, 2117 characters, SHA-256 `4b7571fe9deb97a5613fc3db78e03769094dbd7548e872a67c058cf4ed32e10b`: unchanged Headline, null reason, stale Subheading claim, an invalid after_claim record and a non-JSON unknowns line. The three required files were actually read.
- Candidate review was FAIL before correction preparation. The exact answer and exact failed review were copied as read-only correction inputs, bound to hashes and the original result. Correction used a distinct fresh session and no A history.
- Correction session `ses_ef126f265ffeSWhMnu1YIUyXjt`, 2080 characters, SHA-256 `ab6142ad67eb51a6d3527427345d4f3172f7d873e644f3e0d6083f697bd2c12f`: Headline changes from the long relative clause to a shorter showing phrase. Final Subheading exactly equals original A, but its after record says client work rather than final client tasks. Explanation 2 describes that nonexistent change and inaccurately invokes the audience wording.
- Correction completed all five required reads under its own user parent: context, copy-editing skill, original A, rejected output and review. It still emitted an invalid field unknowns record with array claim and empty sources, followed by a bare unknowns line. The required sole unknowns JSON object is absent.
- Both answers have correct outer layout, CTA and completion marker. Their first substantive hero claims remain supported; this factuality PASS does not satisfy the editing or structured-evidence contract.
- Six pass-through requests across two sessions: pinned qwen3.5:9b, explicit none, all HTTP 200, no reasoning/parser errors, context 32768, maximum prompt tokens candidate 10735 / correction 13052, no truncation. Eight executed runner hashes match the implementation record in both phases. Errors and contamination are empty; PTYs and recorders are closed.

## Root Cause

The directly established causes of rejection are actual-edit noncompliance and invalid structured evidence in the raw model output. In the correction, the declared Subheading after value is not the final Subheading, so the reason cannot establish a second actual edit. The unknowns representation violates the approved JSON record schema. These failures are independently visible in the response and correctly reflected by the new validator.

The transport delivered source and feedback reads successfully. Evidence does not establish why the model repeated schema errors or produced inconsistent fields. A model-capacity, attention, sampling or prompt-conflict explanation would remain a hypothesis; this run does not isolate those factors.

## Why the issue escaped detection

It did not escape detection or final acceptance. Both candidates failed automatic checks and a separate hash-bound manual review. Exactly two syntactically valid edit records in the correction were insufficient: exact before/after binding and actual-change checks failed. The workflow retained the rejected candidate and did not silently substitute its declared after value into the final hero.

## Proposed prevention

Keep actual-diff, exact-field and source-schema checks and the independent semantic review. Preserve both failed answers and end this two-session scope. Do not relax the schema, manufacture a corrected hero, treat layout/factuality PASS as full PASS or retry until green. Any different model, constrained-generation interface or product integration requires a separately reviewed change with fresh evidence; none is established as a fix by this result.
