---
status: active
superseded_by: null
version: 0.1.0
---

# Claim-bound editing experiment

Date: 2026-10-06 (Asia/Bangkok). C-2 / MEDIUM. User approved v0.1.0 with "approve" before implementation. App remains 0.5.1. Evidence snapshot 5.0.8 is reserved for this bounded experiment.

## Objective and evidence

Determine whether a conservative editing instruction plus explicit claim-to-source accounting produces an acceptable B revision of the already accepted A draft. This is a bounded hypothesis test, not an established fix or a product adoption decision.

Parent documents inspected: root PRODUCT.md, docs/ZURI-MVP.md and docs/ARCHITECTURE.md. Preserve the Electron/PTY boundaries, local-only provider routing and explicit action authority. Peers inspected: ZURI-MARKETING-SKILLS.md, ZURI-MARKETING-OUTPUT-CONTRACT-EXPERIMENT.md, ZURI-MARKETING-TASK-ISOLATION.md and its verification report. Keep pinned skills unchanged, project-specific context, exact reads and manual acceptance.

[ROOT CAUSE]

The confirmed acceptance failure in snapshot 5.0.7 is unsupported semantic expansion in B: avoidance of spreadsheets/cloud dependencies and a new checklist every morning. Neither the context nor the accepted draft establishes those claims. B read all required files and passed structural checks; manual review correctly rejected it. The model-internal cause is unresolved. Evidence and detection limits: [RCA](../.brain/rca/marketing-task-isolation-unsupported-claims.md).

[ASSUMPTIONS]

1. The user's next-step request continues the outstanding copy-edit factuality problem.
2. Reusing the exact accepted A artifact avoids spending another inference session recreating an already verified input. A will be labeled REUSED_VERIFIED_INPUT, never reported as newly executed.
3. Requiring source accounting may help constrain the edit, but a model's own evidence mapping is not independent verification. Final grounding and edit accuracy remain manual.

## Exact prompt delta

Retain the existing B instruction, actual context/skill/draft reads, complete output layout, exact CTA, exactly two edit explanations and literal QA_TASK_B_DONE. Append this instruction to the B task before the unchanged output-contract instructions:

> Make a conservative clarity edit of the supplied draft. Shorten, reorder or remove redundant wording while preserving its supported meaning. Do not add product capabilities, dependencies, schedules, automation, comparisons or promised outcomes unless the product context explicitly establishes them. A category label does not establish additional behavior. Skill examples provide methods, not product evidence. When a benefit would need an assumption, leave it out of the hero and record the uncertainty under Sources and unknowns. In Sources and unknowns, account for every factual claim in the revised Headline and Subheading: quote the claim, then quote the exact supporting text from the product context. Also identify the context text that supplies the CTA. Keep all accounting inside that existing section; add no new sections. Exact quotation alone does not make a claim supported: preserve the scope and meaning of the source. The two Edits explanations must describe changes actually made between the supplied draft and this final copy.

Do not include a reviewer-written replacement hero, preferred edits or the prior B answer. This changes the instruction and requested source accounting; it is not an identical-prompt comparison or proof of a single causal mechanism. Existing formatting checks must not mistake accounting rows for numbered Edits.

## Frozen inputs and bounded execution

1. Read the completed 5.0.7 evidence without modifying it. Verify its accepted A review and all bound context/output/report/events/wire/prompt hashes before copying inputs. A output SHA-256 must be `096ca7aa79f800710d240fc3fa13fa2e14c7715d59ab5030196ae82a2a22b0c9`; context SHA-256 must be `5b061db2782a7d76725cfca02202a11737948dc97a058c2e867261c1ea792ce3`. Missing or changed evidence blocks dispatch; do not regenerate A.
2. Create a new QA directory and one fresh Plain B profile. Copy context and accepted A bytes exactly; the draft remains read-only. Record input provenance, old and new prompt bytes/hashes and the previously completed cleanup addendum. Do not reopen the exhausted isolation run or alter its attempt claims.
3. Reuse qwen3.5:9b digest `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7`, OpenCode 1.18.34, Ollama 0.35.1, context 32768, explicit none and pass-through recording. Verify installed/runtime controls before accepting results. No download, fallback or sampling change.
4. Allow exactly one fresh B session with one user task. CLI-generated background requests are captured separately and are not extra user tasks. Keep startup and task bounds at 300 seconds each. Consume an exclusive attempt claim before spawning the CLI; failure after that consumes the attempt. No retry, A inference, Zuri arm or additional prompt variants.
5. Preserve the existing narrow context/skill/draft read permissions and denied mutation/shell/network/delegation permissions. Validate reads under B's actual session and user parent. A's old marker is draft data and cannot count toward B completion.
6. Prepare and test first. Only after plan approval and successful preparation, use the existing user-started QA server workflow. Do not start the server through tools, modify the ownership guard or substitute another launch route.

## Code boundary after approval

- New `tools/verify-marketing-claim-bound-editing.cjs` and focused test file. Reuse the existing recorder, PTY lifecycle, output classifier and evidence-binding helpers.
- Narrow explicit adapters in existing QA runners only where required for a new receipt type and a single B task. Preserve historical modes; reject cross-mode receipts rather than reopening old run state. Do not add a general experiment framework.
- Verification document and local snapshot evidence. No src/, vendored skill, dependency, application version, UI, default model or server guard changes. No commit, push or release in this proposal.

## Verification and acceptance

Offline tests must reject changed/missing accepted-A evidence, failed review, modified or writable draft, prior profile state, duplicate attempts, wrong-mode receipts, missing/current-parent-invalid reads, malformed output, missing marker and wrong CTA. Test the new prompt's placement and required source-accounting instruction while keeping existing contract checks intact. Run the affected existing QA suites and provenance checks.

For live acceptance, require both:

- Automatic PASS for identity/control integrity, exact required reads, full layout, exact CTA, marker and exactly two Edits entries.
- Manual PASS after comparing all hero claims against the context, every evidence quotation against actual source bytes, whether that source supports the claim, whether every factual claim is accounted for, and both edit explanations against the actual A-to-B difference. Missing accounting, scope inflation, invented claims or inaccurate explanations fail acceptance. Evidence quotations may not be credited merely because they are substrings of the source.

Reports must keep AUTOMATED_CHECKS_PASS distinct from overall acceptance. Attach the manual decision to hashes of the output, context, draft, prompt, session events and wire evidence. Missing review means AWAITING_REVIEW, not PASS. Never repair the generated answer or append a missing marker.

Exit after the single attempt, whether PASS, FAIL or infrastructure failure. Preserve full outputs and errors; close owned PTY/recorder and verify manual server cleanup. Package snapshot 5.0.8 with checksum and a rendered report preview. This Plain experiment has no application screenshots. A passing sample qualifies only this input and stack; product readiness and reliable hallucination prevention remain unproven. Failure ends this scope without another automatic experiment.

## Version diff and approval

- This document: absent -> 0.1.0 draft.
- Application: 0.5.1 -> 0.5.1, unchanged.
- Snapshot: 5.0.7 remains FAIL; proposed 5.0.8 is NOT_RUN.
- Existing uncommitted 5.0.7 work is preserved. This proposal adds documentation only.

Approval requested for the QA implementation, offline verification and one bounded B session above. R5 requires approval before code changes; the prior isolation approval has exhausted its session allowance.

Approval record: 0.1.0 draft -> active on 2026-10-06. The user's explicit approval authorizes the scope above, including at most one new B session. The earlier proposal checkpoint remains historical; execution results belong in the verification report.

## Execution record

The single authorized B session completed. Hero grounding passed, but overall acceptance failed: the hero was unchanged, two actual edit explanations were not delivered, claim accounting was incomplete and introductory text violated the layout. No retry or additional session is authorized. See [verification](ZURI-MARKETING-CLAIM-BOUND-EDITING-VERIFICATION.md) and [RCA](../.brain/rca/marketing-claim-bound-edit-review.md).
