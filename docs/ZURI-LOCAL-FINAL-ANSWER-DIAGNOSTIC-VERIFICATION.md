---
status: active
superseded_by: null
version: 0.2.0
---

# Local final-answer diagnostic verification

Date: 2026-10-06 (Asia/Bangkok). Scope: the user's approval of [repair investigation 0.1.0](ZURI-LOCAL-FINAL-ANSWER-REPAIR.md), **C-2 / MEDIUM**. Current result: **PARTIAL diagnostic finding; full marketing acceptance FAIL**. The two-session experiment locates the empty response upstream of OpenCode and demonstrates nonempty answers with thinking disabled. It does not establish complete task compliance or a product repair. The [original runtime failure](ZURI-MARKETING-LIVE-VERIFICATION.md) remains FAIL; [RCA](../.brain/rca/marketing-live-empty-final.md) records the narrowed finding.

## Implemented boundary

- [Metadata recorder](../tools/marketing-wire-recorder.cjs): loopback 11439 forwards only `/v1/models` GET and `/v1/chat/completions` POST to fixed loopback 11438. Baseline body bytes are unchanged. No server startup, retry, tool execution or cloud routing is implemented.
- Streamed SSE and non-streamed JSON are inspected for content/reasoning lengths, tool-call indices/IDs, finish reasons, numeric usage and timing. Lengths are JavaScript UTF-16 string lengths, consistently with CLI comparisons. HTTP status and incomplete transport states remain distinct from successful completion. Logs exclude headers, prompts, answer/reasoning text and provider error bodies.
- Explicit control mode applies `reasoning_effort: none`, and aligns a nested reasoning effort only if supplied. Both incoming and forwarded settings are recorded. This is a QA-only intervention, not a product workaround.
- [Live runner](../tools/verify-marketing-live.cjs): fresh diagnostic preparation preserves the previous receipt; control preparation requires a failed, closed baseline with an empty CLI final message correlated to one upstream reasoning-only stop in the same task/session/time window. A completed read, bootstrap stop, ambiguous match, malformed response or response from another task cannot authorize control.
- The control uses a fresh app/CLI profile and the exact baseline context fixture, with unchanged model, permissions and task instructions. Fresh paths/agent IDs naturally differ. It retains the same owned QA server receipt and logs. Only one baseline and one conditional control are authorized; there is no automatic retry loop.
- Exported CLI evidence retains reasoning lengths instead of reasoning text. The CLI's own isolated database is not rewritten or bundled as a deliverable.
- [User launcher](../tools/start-marketing-live-qa.ps1): refuses to start against a run that already has a result or server log, and saves ownership in that run's receipt as well as the current pointer. Its original ownership checks remain intact.

## Measured checks

Command: `node --test test/marketing-wire-recorder.test.cjs test/marketing-live-diagnostic.test.cjs test/local-provider.test.cjs`.

| Check | Result | Scope |
| --- | --- | --- |
| Recorder fixtures | PASS, 11/11 | Exact request/response bytes, split UTF-8/CRLF SSE, multiline/trailing events, reasoning-only stop, tool fragments, JSON, malformed/error replies, route restrictions, no-thinking control, disconnects, metadata redaction |
| Diagnostic correlation and SQLite fixtures | PASS, 5/5 | Exact message IDs/workspace, task/session/time matching, text/ambiguous-response rejection, latest-answer precedence, busy/init/corruption behavior |
| Existing local-provider tests | PASS, 9/9 | Provider routing, permissions, credential handling, transport/error regression subset |
| Combined subset | **PASS, 25/25; 0 FAIL; 0 SKIP** | Local fixtures, not live model proof |
| Node syntax; PowerShell parser | PASS | Runner, recorder, user launcher |
| Git whitespace check | PASS | Existing checkout diff; new files checked separately |
| Application ASAR | Unchanged | SHA-256 `582418d68c0799bdd92b2af716876e8d0c0a987d280694320f904e489100a706` |
| Failed snapshot 5.0.1 ZIP | Unchanged | SHA-256 `15e2b9998e3f6f3e920c00c3a046260f96f7e1d48dca3ea1836dc3f0e681c820` |
| Existing default Ollama at 11434 | Reachable, 0.35.1 | Read-only version request |
| Live diagnostic baseline | **FAIL** | Actual reads completed; upstream final content 0, reasoning 1048, stop; matching CLI has no text |
| Live no-thinking comparison | **PARTIAL finding / full acceptance FAIL** | Actual text A 739 characters, B 1008; required reads/sections/markers not all satisfied |
| Product correction | **NOT_RUN** | Exact bounded compatibility proposal is draft, not product code |

The first combined run was 24/25: a test cleanup hook attempted to delete its SQLite fixture before closing its database handle on Windows. The hook now closes the handle before removing its own validated temporary directory; the repeated combined run passed 25/25. A separate attempted command to remove the first leftover fixture was rejected before execution with `blocked by policy`. That old fixture was left in place; no alternative deletion route was attempted. This fixture housekeeping defect is separate from the agent's missing answer.

Typecheck, product build and full-suite rerun are NOT_RUN in this diagnostic-only change. Product source and the packaged ASAR were not modified. The previous full-suite results are not presented as current evidence for the new tooling.

## Original preparation record

Baseline: [run receipt](../output/playwright/marketing-live-1791222476533/run-receipt.json). App **0.5.0**, planned snapshot **5.0.2**, qwen3.5:4b, 32768 context. No QA model server was started by the agent. Ports 11438/11439 were free during preparation. The previous receipt was copied into this new run before the current pointer was updated.

From user PowerShell:

```powershell
& 'O:\testzuri\zuri-agent-office\tools\start-marketing-live-qa.ps1'
```

The user reported `QA ready` for Ollama 0.35.1 / PID 37416. Endpoint and receipt preflight passed. Baseline then met the correlation gate, and `--prepare-control` prepared the one approved comparison while retaining server ownership. Both sessions are complete. No third session was run.

After comparison, close the specifically owned server from the same user PowerShell with `-Stop`. The runner closes its QA app/CLI and recorder and reports server cleanup pending; neither an inaccessible process path nor conversational approval weakens the ownership guard. The old tool-side startup policy denial remains unresolved and is not retried through another mechanism.

## Actual baseline/control results

Evidence: [snapshot 5.0.2 gallery](../output/playwright/marketing-live-snapshot-5.0.2/index.html), [structured review](../output/playwright/marketing-live-snapshot-5.0.2/review.json), [baseline raw result](../output/playwright/marketing-live-1791222476533/live-result.json), [control raw result](../output/playwright/marketing-live-1791223788835/live-result.json).

Delivery: [snapshot ZIP](../output/playwright/Zuri-0.5.0-snapshot-5.0.2.zip), **3,609,631 bytes**, SHA-256 `59cf3c6eb82b8f723e637a25cc46124dbbf30e0fcf29a30a58020e79dc8a926b`. Archive CRC, all manifest hashes, gallery links and eight PNG hashes/dimensions passed. [Delivery receipt](../output/marketing-diagnostic-delivery-5.0.2.json). The archive preserves the measured partial/failing outcomes and pending model-server cleanup; any later cleanup confirmation is an addendum, not a rewrite of these results.

| Check | Baseline | No-thinking control |
| --- | --- | --- |
| Context fixture SHA-256 | `1eecc9324fd0e2968c0c348fb1cc7332b31bef7af23d8f75671735788813a203` | Identical |
| Model / server | qwen3.5:4b / Ollama 0.35.1 | Same owned server/model |
| Forwarded reasoning effort | Absent, model default true | `none` on all 15 requests |
| Task A required reads | Context + copywriting completed | Context + copywriting completed |
| Task A final content / reasoning | 0 / 1048 characters | 739 / 0 characters |
| Task A marker | Missing | Missing |
| Task B | NOT_RUN without A draft | Manually dispatched once in the same session after observing the completed A draft |
| Task B final content / reasoning | NOT_RUN | 1008 / 0 characters |
| Task B required reads | NOT_RUN | Copy-editing completed; required context re-read missing |
| Task B content | NOT_RUN | CTA preserved, explanations present; unknowns missing and edit explanation inaccurate |
| Original runner result | FAIL: marker wait expired with no answer | FAIL: marker wait expired despite nonempty answer |
| App / recorder close | PASS | PASS |

Baseline final HTTP sequence 4 matches CLI `msg_10d3d1ae6001NjCaXKh1lV4AH8` in `ses_ef2c50014ffez87V5WAl8SuF4F`. It ends with HTTP 200, `stop`, `[DONE]`, no tool call and no parse error. Server logs show context 32768, final prompt 9719 tokens and no truncation. This excludes a UI-only visibility failure and text being dropped by OpenCode as explanations of this baseline.

Control Task A sequence 10 matches CLI `msg_10d4671ce00142RiOCLmLrZ27E`. It includes a draft, but incorrectly lists visitor knowledge as unknown despite the fixture supplying it. A failed attempt to read `inbox/.done/QA_TASK_A_DONE.txt` is preserved. The reviewer did not supply replacement copy or send a correction to A.

Control B was sent through the existing QA PTY using exactly the planned Task B instruction, in `ses_ef2bad6cdffeU7Oxvf7nkIiMPm`. [Dispatch receipt](../output/playwright/marketing-live-snapshot-5.0.2/control/manual-B-dispatch.json) and [result](../output/playwright/marketing-live-snapshot-5.0.2/control/manual-B-result.json) preserve that procedural deviation. Sequences 11–12 are B by their timestamps and CLI parent message; the raw recorder `phase` remains A because the original runner was still waiting for A's marker. Sequences 13–15 are later Hive inbox nudges, excluded from task acceptance. B has a revised draft, but omits unknowns and context re-read and makes an incorrect word-count claim in its explanation. **Neither manual observation nor the presence of text promotes this to full PASS.**

The SDK/configuration source review supports a potential explicit compatibility option; it is not runtime proof of that product path. The experiment changes the forwarded thinking setting only intentionally, but generated bootstrap histories differ and generation is stochastic. One pair cannot establish universal causality or reliability. Raw model generation versus Ollama thinking parsing remains unresolved.

All eight original PNGs were visually inspected. Baseline screenshots are 1440×960; control starts at 1440×960, then captures a different viewport/theme. Actual dimensions and timestamps are recorded in the gallery. Terminal images show only their visible tails; full A/B text is linked separately as CLI extraction, never presented as a screenshot. Original recordings remain in each run's `video` directory.

Cleanup check: both QA apps/CLIs are gone, port 11439 is closed, default port 11434 still returns 0.35.1, and ASAR/old snapshot ZIP hashes match. QA port 11438 still belongs to PID 37416. Its start time matches the receipt but the tool caller receives a null executable path, so process ownership cannot be fully verified by the stop guard. **Model-server cleanup PENDING_USER_STOP**; the user was given the existing `-Stop` command. No alternate process-kill method was attempted.

Follow-up: [explicit compatibility and completion-verification proposal 0.1.0](ZURI-LOCAL-THINKING-COMPATIBILITY.md), awaiting documentation approval. It does not claim to cure all remaining model compliance failures.

## Version diff

- Approved plan: **0.1.0 draft → 0.1.0 active**, same diagnostic scope.
- Diagnostic tooling and this verification report: **new**, report **0.1.0**.
- Missing-answer RCA: **0.1.1 → 0.1.2**, tooling readiness added; cause still open.
- Application **0.5.0 → 0.5.0**; existing evidence **5.0.1 unchanged**; **5.0.2 prepared, live evidence NOT_RUN**.
- No application repair, release, commit or push is included.
- Measured update: report **0.1.0 → 0.2.0**; missing-answer RCA **0.1.2 → 0.2.0**; completion-marker RCA **new 0.1.0**.
- Evidence **5.0.2 captured**: two sessions, eight original PNGs, wire metadata and actual outputs. Both raw harness reports remain FAIL; overall diagnostic result is PARTIAL.
- Application **0.5.0 unchanged**. Compatibility proposal **new 0.1.0 draft**; implementation **NOT_RUN**.
