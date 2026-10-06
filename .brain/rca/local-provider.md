---
status: active
superseded_by: null
---

# Local provider authentication and fallback

## Symptom

The existing local endpoint form cannot verify connectivity or tool calling. A configured endpoint does not reliably bind the launched OpenCode session to that endpoint/model.

## Evidence

- Upstream `src/main/index.ts` OpenCode config injection sets only `options.baseURL`; the optional endpoint credential is absent.
- The same spawn path selects every stored backend key when the model prefix is `local` or unspecified, and does not set `enabled_providers`.
- `src/shared/agentProvider.ts` documents previously observed fallback to OpenCode Zen when an unavailable model was selected.
- `AiEnginesSettings.tsx` saves base URL/model without a connection probe and ignores save errors.

## Root Cause

The local endpoint override was treated as additive provider configuration, not an explicit local routing contract. Authentication, default-model pinning and provider restriction were missing from that contract.

## Why the issue escaped detection

Existing provider tests verify command generation and provider capabilities; they do not exercise authenticated local endpoint requests, rejected models/tool schemas, or local-only OpenCode configuration.

## Proposed prevention

Reuse encrypted secret storage with a distinct local key, pin the local provider/model including background small-model requests, add an explicit bounded connection/tool probe with sanitized errors, and regression-test auth, model, tool response and no-fallback configuration. Report live inference separately from fixture tests.
