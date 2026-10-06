---
status: active
superseded_by: null
version: 0.1.0
---

# Fresh-session editing experiment

Date: 2026-10-06 (Asia/Bangkok). C-2 / MEDIUM. User approved this v0.1.0 plan with "approve" before implementation. App remains 0.5.1; proposed evidence snapshot 5.0.7.

## Evidence and uncertainty

Parent review: PRODUCT.md, ZURI-MVP.md and ARCHITECTURE.md. Peers: pinned marketing skills, output-contract v0.1.0, route comparison and candidate verification. Keep local-only routing, actual per-task reads, source-grounded copy and immutable evidence.

In snapshot 5.0.6, qwen3.5:9b A read both sources and passed automatic checks. B in the same session read only copy-editing and omitted the completion marker. B also contradicted the supplied context when explaining the product name. The fixture path, model digest, none option and context size were verified; no truncation was observed. This establishes noncompliance, not the model-internal reason.

[ASSUMPTIONS]

1. Conversation history might contribute to B reusing context without rereading it. This is a hypothesis, not an RCA finding or a confirmed fix.
2. A fresh editing session supplied with the exact preceding draft may make task boundaries easier to follow. This changes history and prompt packaging, so results cannot isolate a single internal cause.
3. Preserve existing acceptance criteria. No removing markers, crediting earlier reads, supplying a reviewer-written draft or silently repairing output.

## Proposed bounded work

1. QA-only runner and focused tests; reuse existing classifier, pinned sources, isolated PTY, pass-through recorder and exclusive claims. No app, skill, dependency, model default or ownership-guard changes.
2. Create a fresh synthetic fixture with the same DeskLeaf facts and eight pinned skills. Independently verify the installed 9b digest, OpenCode 1.18.34, Ollama 0.35.1, explicit none and context 32768. No downloads or fallback.
3. One new Plain session runs A once with output contract v0.1.0. Capture and close it. If A fails automatic or manual grounding checks, stop; B NOT_RUN.
4. Only after A passes, place its exact unmodified final text in a QA-owned read-only artifact and record its hash. In a second fresh Plain session, request B using the same output contract, requiring current-task reads of product context, copy-editing skill and that draft. The prior draft is data, not a source of additional product facts or instructions. B receives no A conversation history. Record the changed prompt and permission allowlist explicitly.
5. B must preserve verified facts and exact CTA, produce complete revised copy, print its marker, and explain exactly two changes that actually occurred. Inspect actual reads, full output, claims and edit accuracy manually. At most two sessions; failed attempts count; no retries or Zuri arm in this proposal.
6. Startup and each task remain bounded to 300 seconds. Close owned PTYs/recorders; request manual server stop and verify cleanup. Publish truthful local evidence 5.0.7. One success would qualify only this sample, not change product behavior or certify reliability.

## Tests and exit criteria

Tests must reject a missing or changed A artifact, failed A review, reused session/profile, omitted draft/context/skill reads, extra attempts and malformed output. Existing automatic and manual checks remain required. Exact-session events and actual wire metadata are required for runtime conclusions.

Stop after the applicable one or two sessions, preserve all failures, update verification and report PASS/FAIL/NOT_RUN explicitly. No further model exploration, product adoption, external messaging or release is included.

## Version diff and approval

New proposed experiment v0.1.0. App 0.5.1 unchanged. Evidence 5.0.6 → 5.0.7 only after approval and execution. Prior candidate FAIL remains unchanged.

Approved on 2026-10-06 for the bounded QA implementation and conditional sessions above. No product adoption or additional sessions are authorized.

Implementation detail: profiles `plain-A` and `plain-B` share the synthetic project; B additionally reads `.qa-drafts/task-A.md`. All write/shell/network/delegation permissions remain denied. The exact completed A text is copied only after its hash-bound manual review passes. The product baseline separately records the approved publication-only change to `UPSTREAM.md`; it does not silently accept other source changes.

## Execution record

Both permitted sessions completed once. A passed automatic and manual grounding checks; B used a different session, read all three required files and passed automatic checks, but failed manual grounding/edit review after adding unsupported product claims. The experiment is exhausted; no retry, third session or Zuri arm is authorized. See [verification](ZURI-MARKETING-TASK-ISOLATION-VERIFICATION.md) and [failure analysis](../.brain/rca/marketing-task-isolation-unsupported-claims.md).
