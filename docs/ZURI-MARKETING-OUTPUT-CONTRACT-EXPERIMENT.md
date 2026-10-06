---
status: active
superseded_by: null
version: 0.1.0
---

# Bounded marketing source and output contract experiment

Date: 2026-10-06 (Asia/Bangkok). User approved v0.1.0 with "approve" before implementation. **C-2 / MEDIUM**: QA prompt and acceptance logic change; no product code or architecture change.

## Parent and peer review

Inspected parent PRODUCT.md, ZURI-MVP.md and ARCHITECTURE.md: retain local Electron/Hive/PTY behavior and explicit action authority. Peers ZURI-MARKETING-SKILLS.md and ZURI-LOCAL-THINKING-VERIFICATION.md require pinned unmodified skills, selected-project context, actual reads and truthful acceptance. This proposal follows the [example leakage RCA](../.brain/rca/marketing-skill-example-leakage.md).

The previous thinking-option approval allowed exactly one fresh A/B session, now completed. It does not authorize this new experiment. Snapshot 5.0.3 remains FAIL and its archive remains immutable. Its subsequent cleanup addendum records PASS; no server is currently assumed running.

## Objective and hypothesis

Determine whether explicit separation of product evidence from skill examples, together with a concise response format, improves this exact local workflow. This is a hypothesis test, not a confirmed general fix for model instruction following. Avoid another product build until this narrow instruction change has evidence.

## Exact change under review

Keep the original A/B instructions, required read paths, permission limits and completion markers. Add the following instruction boundary to each task:

> Product facts come only from the supplied product-marketing context. Selected skill files provide writing or editing methods. Their example brands, products, customer problems and benefits are not facts about this product. Use the methods without copying unrelated examples. If evidence is missing, list it under Sources and unknowns rather than inventing a claim. The current task's output requirements take precedence over a skill's default output format. The completion marker is literal text to print, not a file to read or create.

Make the requested response layout explicit:

```text
Headline
<copy>
Subheading
<copy>
CTA
<exact CTA from the context>
Sources and unknowns
<sources actually used and facts not established>
```

A requests one complete hero draft, followed by literal `QA_TASK_A_DONE`. This explicitly narrows the previously unspecified variant count; record the changed task contract and do not claim an identical-prompt comparison with 5.0.3.

B requests a complete revised hero using the same layout, followed by an `Edits` section with exactly `1.` and `2.` explanations of changes actually made, then literal `QA_TASK_B_DONE`. Do not supply expected marketing prose, prefill the CTA from reviewer knowledge, or append markers after generation.

## Code boundary after approval

- `tools/verify-marketing-live.cjs`: add an explicitly selected new experiment preparation mode with a fresh receipt/profile; retain historical modes and evidence. Keep exact user-parent/session completion detection and 300-second task bounds. Preserve A failures when a usable draft proceeds to B once.
- `test/marketing-live-diagnostic.test.cjs`: test new layout assessment, B explanation count, missing/extra sections, marker absence, unrelated responses and preservation of failures. Keep legacy completion fixtures.
- Related RCA/verification documents and versioned QA artifacts only.
- No edit to `src/`, vendored skills, model parameters, local provider settings implementation, dependencies, permissions or the server ownership guard. No automatic retry or repair loop.

Keep content review distinct from structural checks. A valid format is insufficient for factuality PASS. Do not use an Amazon-specific regex as a general factuality evaluator. Invalid/missing markers, unsupported claims, omitted reads and wrong explanation counts remain failures.

## Execution and exit criteria

1. Implement and test the bounded QA changes after approval. Verify source/skill integrity and the tested 0.5.1 ASAR hash `d6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71`.
2. Prepare a fresh receipt before asking the user to start the reviewed QA launcher. Use Windows PowerShell 5.1 with adequate process visibility, respecting the documented startup policy restriction and ownership guard. Do not start a model server through an alternative tool or download a model.
3. Reuse app 0.5.1, OpenCode 1.18.34, Ollama 0.35.1, qwen3.5:4b, 32768 context, explicit thinking override, pinned skills and identical fixture facts. Recorder stays pass-through. One fresh session only, A then B if A has a usable draft.
4. Verify actual context/skill reads for both tasks, complete output, source-grounded product claims, exact CTA, unknowns, both markers and exactly two accurate B explanations. Review images and full text, preserve raw receipts and source/prompt hashes.
5. Stop after this one session whether PASS, FAIL or PARTIAL. Close owned app/recorder and verify QA server cleanup. No further prompt variants, model experiments or product adoption are authorized here.

Application remains **0.5.1**. Proposed evidence **5.0.3 → 5.0.4**; experiment contract **new v0.1.0**. A passing result proves only this revised task contract on this stack. Shipping a reusable product instruction change requires a separate proposal; failure does not justify silent retries or weaker acceptance. No commit, push, release or deployment.

## Approval record

The user's approval authorizes only the scoped QA implementation, one bounded experiment and evidence delivery above. Product changes, extra model sessions and relaxed acceptance criteria remain outside this approval.

## Execution record

The one permitted fresh A/B session has run. [Snapshot 5.0.4 verification](ZURI-MARKETING-OUTPUT-CONTRACT-VERIFICATION.md) records FAIL, with raw and offline reassessment evidence kept separately. An inline-bold-label assessor defect was corrected within the approved QA scope and checked only against saved events; no extra model request was made. Product/app version remains 0.5.1. This approval's model-session allowance is exhausted; it does not authorize another session or shipping the experimental instructions.
