---
status: active
superseded_by: null
version: 0.2.0
---

# Local model turn stops after successful reads without a final answer

Investigation status: **PARTIAL / OPEN**. Snapshot 5.0.2 now locates the missing text at the Ollama HTTP boundary. The no-thinking comparison produced text but failed complete task acceptance; no product fix is claimed. Earlier observations below are retained as chronology.

## Symptom

In live attempt 4 (`output/playwright/marketing-live-1791217249845`), Task A's product context and actual copywriting skill reads complete, but no final hero draft appears. Task B depends on that draft and cannot establish repeat-task acceptance.

## Evidence

- Actual packaged Zuri 0.5.0, OpenCode 1.18.34, local provider `qwen3.5:4b`; one isolated QA session.
- The bootstrap produces a completed assistant text acknowledging readiness. This precedes Task A and must not be counted as the requested marketing output.
- Task A has completed read events for `.agents/product-marketing.md`, the provisioned `copywriting/SKILL.md`, agent memory, and a completed inbox glob. The prior permission defect is corrected for these reads.
- The next assistant message completes with `finish: stop`, a reasoning part of 69 characters, and no text part. Only part types/counts are used for this finding; reasoning is not substituted for a user-facing deliverable.
- That final step records 10042 total tokens, 13 output tokens, 110 uncached input tokens and 9919 cache-read tokens. Server logs show a 10029-token prompt, 13 generated tokens, a 32768-token slot and `truncated = 0`. No prompt-truncation warning was observed. Usage counters are diagnostic evidence, not output quality.
- The database session and actual UI are the evidence sources. No raw HTTP response was captured at the model/CLI boundary, so the exact source of the missing final text is not established.

## Root Cause

Confirmed failure mechanism: the local-provider turn reaches a terminal completion after successful tool use without a user-visible text answer. A `stop` finish event proves the turn ended; it does not satisfy the task's final-output requirement. The validation correctly refuses to mark Task A complete.

Underlying cause remains **UNKNOWN**. Evidence does not yet distinguish model generation behavior, response mapping in the Ollama/OpenCode path, or the interaction between task and bootstrap instructions. No prompt, model parameter, adapter or application change should be presented as a confirmed fix. The older context-truncation cause is not reproduced by the current 32k run.

## Why the issue escaped detection

Provisioning fixtures verify files, selection and PTY wiring but not real final-answer generation. Small provider probes and a bootstrap acknowledgement also do not prove a complete marketing task. The previous local-provider report already retained an unresolved repeat-task limitation; this validation was explicitly intended to measure it.

## Proposed prevention

Keep completed file reads, terminal message status, nonempty final output, content review and follow-up completion as separate acceptance checks. Preserve the original task and all failed attempts. Next diagnosis should compare content/reasoning lengths, finish reasons and tool-call metadata at the local HTTP boundary with the corresponding CLI records for the same synthetic task. This is a proposed investigation, not a proven repair; do not change application permissions or substitute assistant-written copy to make the test pass.

## Verification / exit

Actual Task A file reads: **PASS**. The 300-second final-output wait expired; the harness recorded **FAIL** at 2026-10-05T16:27:54Z and closed the QA app. Task B/content quality: **NOT_RUN** without Task A. The source remains unchanged. [Snapshot 5.0.1](../../output/playwright/marketing-live-snapshot-5.0.1/index.html) retains screenshots and [message/read evidence](../../output/playwright/marketing-live-snapshot-5.0.1/task-A-observed.json). Closure requires a supported cause plus a fresh completed Task A and Task B with the same evidence criteria.

## 2026-10-06 investigation update

Read-only inspection of pinned [OpenCode 1.18.34 session exit logic](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/session/prompt.ts#L1054) confirms a terminal finish and no pending tool call can end the loop without requiring a text part. The [processor](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/session/processor.ts#L471) handles text separately from reasoning. This supports the observed silent terminal state; it does not identify the cause of absent upstream content.

The installed model's `/api/show` metadata reports thinking values false/true with default true. The current Zuri local config supplies model name/routing but no explicit thinking option. A supported no-thinking control is therefore a testable hypothesis, not a confirmed repair. Model-reported defaults (presence_penalty 1.5, temperature 1, top_k 20, top_p 0.95) must not be confused with proof of the failed request's effective parameters.

Proposed next work is the [bounded repair investigation](../../docs/ZURI-LOCAL-FINAL-ANSWER-REPAIR.md), version 0.1.0 draft. RCA **0.1.0 → 0.1.1**; application and failed evidence unchanged. No product patch or server restart performed during this investigation.

## Approved diagnostic implementation

The user subsequently approved investigation 0.1.0. A loopback metadata recorder and an exact task/session/message correlation gate are implemented within that approved QA scope. The [diagnostic verification report](../../docs/ZURI-LOCAL-FINAL-ANSWER-DIAGNOSTIC-VERIFICATION.md) records 25/25 passing recorder/correlation/provider fixture checks. These establish instrumentation behavior, not the cause of the original runtime failure.

A fresh baseline receipt for planned snapshot 5.0.2 is prepared. Actual wire/CLI comparison and the conditional no-thinking control are **NOT_RUN**, pending the user-started isolated Ollama endpoint. RCA **0.1.1 → 0.1.2**; application **0.5.0** and failed snapshot **5.0.1** unchanged. Root cause remains open; no product fix is claimed.

## 2026-10-06 measured wire comparison — current finding

The user started the isolated Ollama 0.35.1 server, PID 37416. The approved two sessions ran against unchanged packaged Zuri 0.5.0 and qwen3.5:4b. [Snapshot 5.0.2](../../output/playwright/marketing-live-snapshot-5.0.2/index.html) contains original screenshots, metadata and final text without reasoning contents.

Baseline `marketing-live-1791222476533`, session `ses_ef2c50014ffez87V5WAl8SuF4F`: the context and copywriting reads completed. HTTP request sequence 4 completed at `2026-10-05T18:04:38.881Z` with status 200, `stop`, `[DONE]`, zero parse errors, **0 content characters / 1048 reasoning characters**, and no tool calls. CLI message `msg_10d3d1ae6001NjCaXKh1lV4AH8` has step-start, reasoning and step-finish parts, without text. Server context is 32768; final prompt is 9719 tokens and `truncated = 0`. The final answer is already absent upstream of OpenCode; a renderer fix or reasoning-to-text substitution is not an appropriate repair.

Control `marketing-live-1791223788835`, session `ses_ef2bad6cdffeU7Oxvf7nkIiMPm`: all 15 recorded requests forwarded `reasoning_effort: none`; all responses have zero reasoning characters. Task A final sequence 10 contains **739 content characters**, matching CLI text. Task B was dispatched once through the existing QA PTY in the same session because the unchanged harness was waiting for A's missing completion marker. B sequences 11–12 contain the copy-editing read and a **1008-character final answer**. The raw phase label remains A; [manual dispatch evidence](../../output/playwright/marketing-live-snapshot-5.0.2/control/manual-B-dispatch.json), exact CLI parent messages and timestamps identify B. Later inbox nudges and sequences 13–15 are excluded from Task B acceptance.

This supports a **bounded no-thinking compatibility workaround for the empty-text symptom**, not a complete repair or proof that thinking alone causes every failure. The model is stochastic, bootstrap tool histories differ, and raw generation versus Ollama's thinking parser/template remains unresolved. The fixture context hashes match exactly. The [Ollama API contract](https://docs.ollama.com/api/openai-compatibility) documents `none` as the false alias for boolean thinking models; installed metadata confirms support. No sampling parameter or model was changed.

Task acceptance remains **FAIL**: both outputs omit the requested marker; B omits the required context re-read and unknowns section, and its edit explanation contains incorrect word-count reasoning. A also lists visitor knowledge as unknown although supplied in the fixture. See the [completion-marker RCA](marketing-live-completion-marker.md) for the separate diagnostic reporting limitation. No third session or additional model retry was run.

Current prevention: independently verify final content, completed required reads, factuality/required sections and protocol markers. Apply any thinking override explicitly to the chosen endpoint/model, verify actual outgoing configuration, and retain full task acceptance rather than promoting nonempty text to success. [Exact follow-up proposal](../../docs/ZURI-LOCAL-THINKING-COMPATIBILITY.md) requires its own documentation approval before product code.

Version **0.1.2 → 0.2.0**: wire origin confirmed, controlled symptom improvement recorded, full acceptance still unmet. Application **0.5.0** unchanged.
