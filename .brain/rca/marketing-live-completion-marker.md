---
status: active
superseded_by: null
version: 0.1.0
---

# Completion-marker timeout is not evidence of absent final text

## Symptom

The no-thinking control reports `Task A did not finish within the bounded wait`, even though it contains a completed 739-character hero response. The automatic runner consequently does not dispatch Task B.

## Evidence

In [snapshot 5.0.2](../../output/playwright/marketing-live-snapshot-5.0.2/index.html), control wire sequence 10 has nonempty content, zero reasoning, `stop` and no parse error. CLI message `msg_10d4671ce00142RiOCLmLrZ27E` contains the same final answer and completion timestamp. It lacks `QA_TASK_A_DONE`. The runner's wait predicate requires a completed assistant text containing that exact marker. During Task A the model also tried to read a nonexistent `inbox/.done/QA_TASK_A_DONE.txt`; that failed read is retained. No inference that a marker-containing tool result is a final answer is permitted.

## Root Cause

The runner uses one output sentinel for completion detection and therefore conflates two different states: an absent answer and a completed answer that violates the marker instruction. The timeout is valid evidence of marker noncompliance, but cannot accurately diagnose the latter as missing text. Why this model interpreted the marker as a file name is not established; the generic Hive inbox instructions are context, not proof of causality.

## Why the issue escaped detection

Earlier fixture extraction checks deliberately rejected tool-result markers and incomplete assistant messages, but did not exercise a substantive completed final answer without the requested sentinel. The initial actual failure had no final text, so both conditions appeared identical until the no-thinking control.

## Proposed prevention

After documentation approval, detect a terminal assistant response by its exact user-parent message/session and stored completion, then assess nonempty content, required reads, sections, facts and marker compliance separately. A usable Task A draft may be followed by Task B without labeling A a pass. Preserve failed fields and stop at the bounded task limit. Add tests for missing markers, unrelated inbox turns, tool-only completion, empty stop and missing required reads. Do not relax factuality, unknowns or same-session requirements.

## Current result and scope

No harness code was changed during the two live sessions. The reviewer sent the already approved Task B instruction once through the same QA PTY; the manual-dispatch sidecar records its method and timestamps. Its response still fails full acceptance because context was not reread and unknowns were omitted. Both original harness results remain FAIL. This RCA proposes diagnostic classification repair, not a claim of model/task correctness.

## Approved follow-up — 2026-10-06

The user approved the precise [thinking compatibility and completion contract](../../docs/ZURI-LOCAL-THINKING-COMPATIBILITY.md) before implementation. The corrected classifier has fixture coverage for absent markers, empty/tool-only finals, mismatched sessions/parents, missing reads and incomplete responses. Snapshot 5.0.3 detects A/B's 2401/1934-character finals without waiting for the missing marker; both still fail the marker check. B runs once under its own exact user parent in the same session. See [verification](../../docs/ZURI-LOCAL-THINKING-VERIFICATION.md). This resolves the misclassification, not the model's instruction-following failures.
