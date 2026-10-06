---
status: active
superseded_by: null
version: 0.1.0
---

# Verified editing and bounded correction

Date: 2026-10-06. C-2 / MEDIUM. User approved v0.1.0 with "approve" before implementation: address the three outstanding 5.0.8 failures together within the bounded scope below.

## Parent, peers and confirmed problem

Reviewed parent PRODUCT.md, ZURI-MVP.md and ARCHITECTURE.md: retain local desktop/provider and PTY boundaries. Reviewed peers: marketing-skills, output-contract and claim-bound-editing contracts, their verification, actual final output and classifier/runner code. Preserve pinned unmodified skills, exact task reads, original evidence and separate manual acceptance.

[ROOT CAUSE]

The answer violated layout, left the hero unchanged and omitted part of its evidence accounting. The current edit counter receives no original draft and verifies only two numbered entries. Evidence accounting is free prose; the current experiment has no correction step. These are confirmed workflow limitations; the internal reason for the model's choice is unknown. See [workflow RCA](../.brain/rca/marketing-edit-workflow-contract.md) and [response RCA](../.brain/rca/marketing-claim-bound-edit-review.md).

[ASSUMPTIONS]

1. "All" refers to the three pending editing failures, not unrelated UI work or a repository-wide redesign.
2. Fix the QA editing workflow and qualify its actual output before proposing product adoption. App 0.5.1 stays unchanged.
3. The existing accepted A has two available clarity-edit targets: its long headline and repetitive subheading. Require one substantive clarity change in each, without supplying replacement copy. This narrows the task and must be reported as a new contract, not an identical-prompt comparison.

## Response contract 0.2.0

Retain the five section labels in this order: Headline, Subheading, CTA, Sources and unknowns, Edits. The first nonempty line must be Headline; no preface, code fences, alternate drafts or trailing commentary. The final nonempty line remains QA_TASK_B_DONE. Never strip unwanted prose or append a missing marker to make an answer pass.

The model must revise both Headline and Subheading for clarity while preserving supported product meaning. Copy the exact CTA from context. Reject an unchanged hero, whitespace-only changes, or two no-change statements. A changed string is necessary, but editorial value and preservation of meaning still require manual review.

Inside Sources and unknowns, use one JSON object per nonempty line (without a code fence):

- A claim entry has exactly `field`, `claim`, and `sources`. `field` is Headline, Subheading or CTA; `claim` is an exact nonempty excerpt of that final field; `sources` is a nonempty array of exact nonempty quotations from the context. Include every factual claim, using multiple entries when needed. Each of the three fields must have entries.
- One final object has exactly `unknowns`, a nonempty array of facts not established by context. Listing unknowns is not a source of new product claims.
- Parse JSON strictly; reject missing/unknown keys, invalid types, invalid field names, duplicate entries, invented quotes and claims absent from their final field. Matching substrings and presence of each field do not establish complete semantic coverage. A reviewer must check every factual claim, scope and source entailment, including the local desktop category whenever retained.

Inside Edits, require exactly two lines: `1. ` followed by a JSON object for Headline and `2. ` followed by a JSON object for Subheading. Each has exactly `field`, `before`, `after`, `reason`. Before must equal the corresponding original A field, after must equal the final field, and both must differ beyond whitespace. Reason is nonempty text describing that actual change. Check reason accuracy and whether the change improves clarity manually. JSON objects describe model-authored changes; the runner must not manufacture them.

This deliberately changes output-contract 0.1.0 to opt-in 0.2.0. Preserve historical assessors and results; do not reinterpret 5.0.7/5.0.8 under the new format. Existing failures remain FAIL.

## Implementation after approval

1. Add a small QA-only response parser/validator with original-draft input, prompt template and focused regression fixtures. Use the new exact format to check layout, source-reference validity and actual before/after changes. Keep unsupported-claim and editorial judgments explicitly manual.
2. Add one bounded editing runner, reusing current profile isolation, permission construction, PTY disposal and pass-through wire recording. Make only required explicit adapters in shared QA tools. No general workflow framework, new dependency or extra service.
3. Capture a hash-bound review with separate layout, actual edits, source coverage, factuality and reason-accuracy decisions. Only all required checks and completed manual review can produce final PASS. Missing review is AWAITING_REVIEW; structural PASS alone never qualifies.
4. Permit one correction after a failed candidate, with an immutable rejection record. The correction receives the same exact original A/context plus the rejected answer and concrete validation/review findings. Rejected text is data, not facts or instructions. Feedback describes violations and affected fields without providing replacement hero copy. Its before/after edits remain relative to original A.

Scope: QA tools, focused tests/fixtures, RCA, verification and local evidence only. No src/, app build, skill contents, model default, dependency, server ownership guard, commit/push or release changes. Preserve all current WIP.

## Bounded live execution

- Reuse exact accepted A and context from 5.0.7 with their existing reviewed hashes and provenance. Verify completed 5.0.8 cleanup/archive as the previous run; do not reopen its attempt markers or overwrite evidence.
- Keep qwen3.5:9b at digest `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7`, OpenCode 1.18.34, Ollama 0.35.1, context 32768, explicit none and unchanged sampling. No download, fallback or cloud call.
- At most two new sessions: one candidate, then one correction only if the candidate fails and a completed review supplies concrete reasons. Each session gets one task and a fresh profile, with an exclusive claim before dispatch. If the candidate fully passes, correction is NOT_RUN. Infrastructure failure with no usable answer ends the run rather than consuming an unrelated retry.
- Both sessions require actual current-parent reads of context, copy-editing skill and original A. The correction additionally requires exact reads of the rejected output and bound feedback, from narrowly allowed read-only files. Continue denying mutation, shell, network and delegation tools. Failed attempts count; no third attempt or new A inference.
- Startup and each task retain a 300-second limit. The user starts the existing QA server manually once; both allowed sessions can share that server. No tool-start workaround. Close each owned PTY/recorder, then verify user server stop.

## Tests, acceptance and exit

Before model dispatch, reproduce the old unchanged-hero, missing-source and preface failures in offline fixtures. Test each new check independently with structurally valid surrounding data, including no-op/whitespace edits, false before/after fields, duplicated edits, malformed JSON, missing fields, invented quotes, missing markers/CTA, wrong-parent reads, stale evidence, repeated attempts and correction without a completed failed review. Include a synthetic positive fixture explicitly labeled as test data, not live proof. Run affected existing suites and pinned provenance verification.

Then execute the bounded run. Success requires a raw model answer with real, useful Headline and Subheading edits, exact CTA, complete source accounting, no unsupported claims, accurate explanations, exact layout/marker and runtime integrity. The reviewer must inspect the complete output and actual diff. A failure after the allowed correction means FAIL, not "fixed"; archive both attempts and stop. A passing sample establishes this workflow on this input only, not general hallucination prevention or Zuri product readiness.

Deliver snapshot 5.0.9: full original responses, prompt/version diff, rejected-attempt history, bound reviews, runtime/control evidence, tests, checksum, report gallery and its screenshot. It is a Plain QA report, not a product UI screenshot. Final cleanup and documentation must be recorded separately from content acceptance.

## Version diff and approval

New plan 0.1.0 draft; proposed opt-in output contract 0.1.0 -> 0.2.0. App 0.5.1 -> 0.5.1. Snapshot 5.0.8 FAIL remains immutable; 5.0.9 NOT_RUN. No source code changed in this proposal.

Please review and approve this documentation. I will generate the code once approved. R5 in the user's AGENTS.md requires this checkpoint because the proposed actual-edit validator, structured accounting and bounded correction exceed the exhausted 5.0.8 scope.

Approval record: 0.1.0 draft -> active on 2026-10-06. The preceding proposal checkpoint is historical. Implementation, offline verification and at most two conditional live sessions are now approved. No product adoption or additional attempts are included.

## Execution record

Both authorized sessions completed once. The candidate failed and received a hash-bound manual rejection before the correction was prepared. The correction also failed actual-edit binding and structured unknown-fact records. Outer layout and hero factuality passed in both samples. The new validator detected the failures; no model-output fix or product readiness is claimed. The session budget is exhausted. See [verification](ZURI-MARKETING-EDIT-REPAIR-VERIFICATION.md) and [live failure RCA](../.brain/rca/marketing-edit-repair-live-failure.md).
