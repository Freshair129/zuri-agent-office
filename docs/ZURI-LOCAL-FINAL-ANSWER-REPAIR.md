---
status: active
superseded_by: null
version: 0.1.0
---

# Local agent final-answer repair

Date: 2026-10-06 (Asia/Bangkok). Requested by the user's `fixz it` after live snapshot 5.0.1 failed Task A. **C-2 / MEDIUM**. The user approved version 0.1.0 with `approve`. This plan defines the evidence and repair boundary; it is not a claim that the missing-answer cause is established or fixed.

## Parent and peer alignment

Parent: [product](../PRODUCT.md), [desktop contract](ZURI-MVP.md), [architecture](ARCHITECTURE.md). Peers: [local-provider verification](LOCAL-PROVIDER-VERIFICATION.md), [approved marketing validation](ZURI-MARKETING-LIVE-VALIDATION.md), [measured failure](ZURI-MARKETING-LIVE-VERIFICATION.md), [missing-final RCA](../.brain/rca/marketing-live-empty-final.md).

Retain explicit local provider/model routing, existing permission semantics, selected skill provisioning and protected credentials. Preserve all current WIP, the 0.5.0 package, original failed evidence and completed cleanup. Do not replace the UI, agent engine, model or workflow to hide the failure.

## Confirmed boundary and uncertainty

The final Task A turn in OpenCode's database contains a reasoning part and `finish: stop`, but no text part, after the required file reads succeeded. Thus a renderer-only visibility fix cannot recover an answer absent from the CLI record. No raw upstream response was captured, so model generation versus transport/SDK mapping is unresolved.

Pinned [OpenCode 1.18.34 prompt loop](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/session/prompt.ts#L1054) permits exit on a terminal finish with no pending tool calls; it does not require a text part. Its [processor](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/session/processor.ts#L471) stores text and reasoning as separate event types. These explain why the observed state can end silently, not why the upstream answer was empty.

A read-only `/api/show` query to the existing default Ollama service confirms installed qwen3.5:4b supports thinking values false/true and defaults to true. Its model parameters include presence_penalty 1.5, temperature 1, top_k 20 and top_p 0.95. These values are observations, not proven causes. [Ollama compatibility documentation](https://docs.ollama.com/api/openai-compatibility) documents `reasoning_effort: none` for disabling thinking on compatible boolean-control models. The actual transmitted field and resulting behavior must be measured.

## Proposed execution

1. Add a QA-only response metadata recorder between the isolated app and its isolated Ollama server. Baseline requests/responses pass through without body rewriting, retries or tool execution. Bind the recorder to loopback 11439 and forward only the required model-list/chat routes to 11438. Reject other destinations/routes; no generic proxy or product service is introduced.
2. Record request sequence, model, stream mode, requested reasoning control, status, content/reasoning character counts, tool-call counts/IDs, finish reasons, usage and timing. Parse streamed SSE across chunk boundaries and collect the corresponding non-streamed fields. Do not log authorization headers, credentials, prompt text or reasoning text. Retain only fixture prompts and final answers already required by the approved acceptance plan.
3. Run the unchanged synthetic Task A/B scenario with qwen3.5:4b and 32768 context in a fresh profile. Correlate the final wire response with the exact QA CLI session. No assistant-written substitute, reasoning-to-answer promotion or automatic replay of tools is allowed.
4. If the baseline ends with upstream reasoning but empty content, run a fresh controlled session with the supported no-thinking request setting as the only intended changed variable. Verify that the setting actually reaches Ollama. Keep model, task facts, skill files, permissions and context the same; do not simultaneously tune sampling or switch models. Limit baseline/control to two fresh sessions and retain the existing 300-second task waits. If a no-thinking comparison is inapplicable, record that and investigate the evidenced mapping fault instead.
5. Update the RCA with the correlated result before making a product repair. A nonempty wire answer missing in CLI requires a reproducible mapping/configuration regression case. An upstream empty answer improved by a thinking control establishes a bounded compatibility workaround only; record its tested scope. The exact product/configuration patch must be documented from these results before code generation. No broad provider defaults or global Ollama changes are pre-approved by this draft.
6. Verify the confirmed correction with completed Task A and Task B in the same session, actual skill reads, factual output review and screenshots. Capture a new evidence snapshot; keep failed runs and cleanup receipts. Close the QA app/CLI/recorder and the specifically owned QA model server, and recheck default port 11434.

The prior tool-side Ollama startup rejection is still unresolved. Do not retry or reroute that rejected startup. Use the reviewed user-run launcher when live execution is ready; its prior authorization does not need repeating. The process must be stopped from the same user PowerShell if the agent still cannot verify process ownership. Prepare a fresh receipt/profile before requesting startup so the existing used run is not overwritten.

## Code and file boundary

After documentation approval, diagnostic changes are limited to the QA recorder, `tools/verify-marketing-live.cjs`, narrowly necessary launcher/evidence plumbing, fixture tests and this task's docs/RCAs. Do not patch packaged ASAR files, install a different OpenCode/Ollama version, download models, alter global permissions or add cloud fallback. Application repair scope will be specified only once causality is supported, as required by R6.

The existing request-only `node_modules/.zuri-provider-qa/proxy-metadata.cjs` is insufficient: it records no response fields and hardcodes historical ports. Do not run it unchanged or overwrite its earlier evidence.

## Verification and acceptance

- Recorder fixtures: mixed reasoning/text, reasoning-only terminal response, completed tool calls, SSE data split across chunks, normal stream termination, malformed/error responses and client disconnect. Confirm forwarding preserves the baseline data and logs omit headers and text contents.
- Correlation must distinguish actual wire content, CLI text parts and displayed output. A bootstrap acknowledgement, completed read, marker inside a tool result or `stop` alone cannot pass a marketing task.
- Both marketing tasks must produce substantive final answers with the requested sections, exact `View the demo` CTA and no fabricated facts. Task B must read copy-editing and revise Task A within the same session.
- Run relevant provider/configuration regression tests for any confirmed product patch, then typecheck/build and packaged validation. Diagnostic fixture PASS alone does not close the issue.
- Explicitly report PASS / FAIL / NOT_RUN and residual limitations. No commit/push/release is included.

## Version diff and approval boundary

- Repair plan: absent → **0.1.0 draft**.
- Missing-final RCA: **0.1.0 → 0.1.1**, adds confirmed CLI exit behavior and current thinking metadata; underlying cause remains open.
- Application stays **0.5.0** during diagnosis. A **0.5.1** bump is conditional on an actual verified application repair; a QA/configuration-only finding does not justify a product bump.
- Next evidence snapshot: **5.0.2**, planned; 5.0.1 is retained unchanged.
- No code was changed in this proposal turn. Approval of this draft authorizes the bounded diagnostic implementation and control experiment, not a speculative product fix. The resulting exact repair proposal will follow the confirmed RCA.

Approval record: **0.1.0 draft → 0.1.0 active**. The diagnostic recorder applies `reasoning_effort: none` only in the explicitly selected control run and records both incoming and forwarded settings. Baseline bodies remain byte-for-byte unchanged. This is a QA intervention, not an OpenCode configuration repair. Each run retains its own receipt; the control copies the exact baseline context fixture and preserves server ownership. The diagnostic runner leaves the user-started model server available for the bounded comparison and reports cleanup pending until the same user PowerShell stops it.
