---
status: active
superseded_by: null
---

# Local provider verification — 2026-10-05

## Change and scope

Settings → AI Engines keeps the existing engine settings and encrypted secret store. A separate optional `local` endpoint key is write-only. OpenCode local mode pins the foreground and small model to `local/<exact model ID>` and enables only the local provider. Automatic cloud fallback is excluded by the generated configuration. Existing automatic permission settings retain their existing meaning.

The explicit connection test requests `/models`, verifies the selected ID, and sends one small `/chat/completions` request that asks for a harmless `zuri_connection_test` tool call. No returned tool is executed. It distinguishes URL, authentication, model, tool-support, network and server errors without echoing upstream bodies or credentials. This probe proves only a basic tool response, not the whole agent workflow.

Configuration fields: `providerBaseUrls.opencode`, `providerDefaultModels.opencode`; encrypted key reference `apikey:local`. The main process passes the local credential through `ZURI_LOCAL_API_KEY`; the OpenCode configuration contains an environment reference rather than the key. IPC `localProvider:test` returns only `{ok, code, message}`.

The approved 0.5.1 follow-up adds an optional, endpoint/model-bound `localThinkingOverride` and an explicit checkbox in Settings → Agents & Models. Defaults remain unchanged. Its independent verification and live limitations are recorded in [thinking compatibility verification](ZURI-LOCAL-THINKING-VERIFICATION.md); the historical results below are not refreshed by that change.

## Evidence

| Check | Result | Limit |
|---|---|---|
| Baseline provider, engine, memory, knowledge and task tests | PASS: 38 node:test results | Local component/CLI tests, not an AI session |
| Added `test/local-provider.test.cjs` | PASS: 9 tests | Includes real loopback HTTP with fixture replies; not live inference |
| Local provider plus provider-config/provider-automation | PASS: 31 tests | Regression subset |
| `npm run typecheck` | PASS | Both main and renderer, after initial main/preload integration |
| Real Ollama model/tool probe | PASS | Ollama 0.35.1, existing `qwen3.5:4b`, no model download |
| Isolated OpenCode `run` CLI, 4k server context | FAIL: file task | Both 4b and 9b returned prose without tool execution; server truncated 7589 input tokens to 2050 |
| Isolated OpenCode `run` CLI, 16k server context | PASS: actual file read and exact final result | Same 4b model and permissions; distinct from desktop/Hive acceptance |
| Packaged Electron app → OpenCode → Ollama, first file task | PASS: actual read and exact final marker | Narrow SQLite extraction corroborates the screenshot; full matrix belongs to the integrator report |
| Packaged app second file task | PARTIAL | Read completed with correct nonce in tool output, but no final assistant text containing it |

The live server used `127.0.0.1:11435`, an isolated home and `OLLAMA_NO_CLOUD=1`. Its model manifest/blob existed before this run. Direct probe returned `ready` at 07:54:44 Asia/Bangkok after approximately 26 seconds of model load/inference. Subsequent HTTP 200 model requests at 08:00:35 and 08:01:03 followed the integrator's app launch at 07:59:33. These timestamps distinguish the standalone probe from the app session; server request logs do not alone prove successful agent tool execution.

Disposable CLI binary and logs live under ignored `node_modules/.zuri-provider-qa/`; they are QA dependencies, not bundled application requirements. OpenCode was installed there from `opencode-windows-x64@1.18.34`, not globally. Real endpoint authentication is NOT_RUN because this local server required no key; authenticated transport is covered by the local HTTP fixture only. LM Studio and vLLM live execution are NOT_RUN.

The initial headless CLI stall was a QA runner defect: OpenCode waits for EOF on piped stdin before sending its initial prompt. Closing the pipe immediately started a session and local model streams. See `.brain/rca/headless-qa-stdin.md`. This is separate from the app OpenTUI DLL failure investigated by the integrator. Subsequent QA uses TEMP/TMP and package caches on O: because C: was nearly full.

The complete controlled file-read task passed at 08:13:38 Asia/Bangkok on a separate loopback server at `127.0.0.1:11437` with `OLLAMA_CONTEXT_LENGTH=16384`. OpenCode emitted an actual completed `read` tool event at 08:13:23 and returned the exact file contents `ZURI_LOCAL_TOOL_PROOF_20261005`, then exited 0. Server input counts were 7589 and 7727 with no truncation. Existing `qwen3.5:4b`, model routing and permissions were unchanged. [Extracted live events](evidence/local-provider-live.json) retain the tool result and final response. Full logs: `node_modules/.zuri-provider-qa/live-cli-4b-16k.jsonl` and `ollama-16k.stderr.log`. See `.brain/rca/local-model-context.md`.

[Packaged desktop events](evidence/desktop-local-live.json) were extracted read-only from OpenCode's SQLite database with an exact QA directory and session filter. Worker `qa-reader-muuk5gjn` first attempted the wrong path and received File not found; that failure is retained. The corrected absolute-path `proof.txt` read completed and its final assistant reply exactly matched `ZURI_DESKTOP_READ_PROOF_7d319c`. A subsequent `proof-final.txt` read completed and returned `ZURI_E2E_a93f02c71e` in the tool output, but no final assistant text contained it at extraction. This repeat-task limitation is not reported as a full pass. No unrelated user session or credential record was queried.

After the integrator closed the packaged app and its PTYs, both temporary QA model servers and the metadata proxy were stopped. No default Ollama service or global configuration was changed.

## Local server setup requirement

Set sufficient context on the model server before starting the agent. For the tested OpenCode task, 16384 tokens worked and the default 4096 did not: tool definitions were discarded even though the small connection probe passed. A longer Hive bootstrap or task may require more than 16384 tokens. Confirm the server's effective context and memory capacity rather than relying only on the model's advertised maximum. For Ollama, `OLLAMA_CONTEXT_LENGTH` is a server startup setting; Zuri does not silently restart or reconfigure an existing server.

## Remaining limits

- The probe checks one tool schema/response. A model may still fail a complex agent task.
- A cold model may exceed the 30-second UI probe deadline and show a truthful timeout.
- OpenCode and optional local model servers are external requirements. The app's Tools status distinguishes a missing CLI; terminal process-exit handling remains the upstream runtime path.
- Changes apply to new/restarted agents.

## Source references

OpenCode documents [provider allowlists](https://opencode.ai/docs/config/#enabled-providers) and [OpenAI-compatible custom providers](https://opencode.ai/docs/providers/#custom-provider), including optional API keys. Source at the tested OpenCode tag confirms the compatible SDK and allowlist handling: [provider.ts, v1.18.34](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/provider/provider.ts).

## Version diff

From the upstream form's endpoint/model inputs and generic backend keys: added a separate optional local key, installed-CLI status, explicit model/tool probe, actionable errors, and a shared local-only routing contract. No memory, knowledge, integration broker, or agent autonomy behavior was replaced.
