---
status: active
superseded_by: null
version: 0.1.0
---

# Explicit local thinking compatibility and final-output verification

Date: 2026-10-06 (Asia/Bangkok). **C-2 / MEDIUM**: one optional persisted setting crosses shared config, main process and existing engine settings UI. No data migration, permission change or service boundary change is proposed. User approved this v0.1.0 implementation scope with "Approve" on 2026-10-06.

## Evidence and parent/peer alignment

Parent: [product](../PRODUCT.md), [desktop contract](ZURI-MVP.md), [architecture](ARCHITECTURE.md). Peers: [local-provider verification](LOCAL-PROVIDER-VERIFICATION.md), [marketing contract](ZURI-MARKETING-SKILLS.md), [approved diagnosis](ZURI-LOCAL-FINAL-ANSWER-REPAIR.md). Retain explicit local routing, existing credentials, permission boundaries and selected skills.

The [missing-answer RCA](../.brain/rca/marketing-live-empty-final.md) confirms upstream empty content in baseline. The no-thinking experiment produces final text for both tasks, but does not satisfy complete marketing acceptance. The [marker RCA](../.brain/rca/marketing-live-completion-marker.md) identifies why the unchanged QA runner treats A's substantive answer as a timeout. Detailed results are in [diagnostic verification](ZURI-LOCAL-FINAL-ANSWER-DIAGNOSTIC-VERIFICATION.md).

This change is a tested-symptom compatibility option, not a claim to fix all model instruction-following failures. Raw model generation versus Ollama parsing is still unresolved. No automatic retry, fabricated answer or reasoning-to-text conversion is proposed.

## Exact proposed product change

1. Add **Disable thinking for this model** to the existing local OpenCode settings section. Default remains the server's default. The adjacent help states that this is for compatible local servers, has been tested with Ollama 0.35.1 / qwen3.5:4b, and applies to newly started agents. Unsupported servers must retain their visible errors; no silent fallback is added.
2. Persist one optional non-secret `localThinkingOverride` containing the normalized `baseUrl`, exact `model` and `reasoningEffort: 'none'`. No override means unchanged behavior. Disabling the control clears it. Match both endpoint and model before applying it, so changing models or servers cannot silently carry the override to another target. Only one selected target is retained; no generic provider-options editor or map is introduced.
3. For a matching explicit override, `buildOpenCodeLocalConfig` adds `options: { reasoningEffort: 'none' }` only under that local model entry. Foreground and small model routing remain pinned as before. The existing connection test receives the same effective option, while continuing to prove only basic connection/tool support.
4. Keep all other providers, permission settings, sampling values, model context and encrypted-key handling unchanged. Invalid persisted override data does not enable the option. Existing configuration requires no migration.

Read-only source review supports this path: [OpenCode 1.18.34 request preparation](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/session/llm/request.ts#L83) merges model options for foreground and small requests, and its [OpenAI-compatible SDK 2.0.41](https://github.com/vercel/ai/blob/%40ai-sdk/openai-compatible%402.0.41/packages/openai-compatible/src/chat/openai-compatible-chat-language-model.ts#L229) serializes `reasoningEffort` as `reasoning_effort`. The [SDK option schema](https://github.com/vercel/ai/blob/%40ai-sdk/openai-compatible%402.0.41/packages/openai-compatible/src/chat/openai-compatible-chat-options.ts#L14) accepts a string. Actual outgoing behavior still requires verification; source inspection alone is not acceptance.

## Exact proposed QA correction

Detect completed final responses by exact session/user-parent message and non-tool terminal completion. Record separate checks for output presence, required file reads, sections, factuality and the requested marker. Keep the task prompts and marker requirement unchanged for the first verification, so the diagnostic change does not disguise instruction noncompliance. If A produces a usable draft, dispatch B once in the same session while retaining A's failed checks. Missing marker, missing context re-read or missing unknowns still prevents full acceptance.

Classify later inbox/background turns separately from the two requested tasks. Do not relabel their text as the task's answer. Keep the 300-second task bounds and avoid new sampling/model experiments in this scope.

## File boundary

- `src/shared/localProvider.ts`, `src/main/localProvider.ts`: validated effective option and serialization/probe.
- `src/main/config.ts`, `src/preload/index.ts`, and the existing renderer config type if separate: optional typed setting only.
- Existing local-provider spawn wiring in `src/main/index.ts` and the local section of `src/renderer/src/components/AiEnginesSettings.tsx`.
- Focused local-provider/config/UI regression tests, `tools/verify-marketing-live.cjs`, diagnostic fixtures and related documentation.
- No Hive/bootstrap rewrite, upstream dependency update, global Ollama change, new model, cloud fallback or generated marketing copy supplied by the reviewer.

## Verification and exit criteria

1. Regression tests: default unchanged; exact endpoint/model match; mismatches and malformed override ignored; config persistence/clear; no permission or credential change; probe and actual model config agree.
2. Completion tests: nonempty final without marker is classified accurately but not PASS; tool-only/empty/unrelated replies cannot pass; missing reads/sections remain failures; B uses A's exact session.
3. Run relevant tests and typecheck/build. Verify the optional setting through the packaged app, then use the recorder in **pass-through baseline mode**, with no request rewriting, to prove that OpenCode itself sends `none`.
4. One fresh packaged local Task A/B session checks actual context and relevant skill reads, complete outputs, accurate supplied facts, unknowns and protocol marker. If model compliance still fails, preserve FAIL/PARTIAL and stop; no automatic prompt tuning or further sessions are included. Report a verified compatibility option separately from full marketing acceptance.
5. Capture versioned screenshots/receipts and close only owned QA processes. Prepare a fresh receipt before any user-started model server. The prior startup policy rejection is not retried through another tool.

Application **0.5.0 → 0.5.1** is a proposed version for the reviewed product change, conditional on verification; it is not a released version. Evidence **5.0.2 → 5.0.3** is planned. If the acceptance criteria fail, do not declare the original user goal complete or label the package production-ready. No commit, push, release or deployment is requested.

## Approval boundary

Approved scope: the precise optional setting, accurate QA completion classification and the bounded verification above. This approval authorizes implementation and one fresh packaged A/B session; it does not authorize additional model experiments, release or deployment.

Implementation and the one permitted live session are now recorded in [0.5.1 verification](ZURI-LOCAL-THINKING-VERIFICATION.md). The option and completion classification are verified; full marketing acceptance remains FAIL. No further model experiment was performed.
