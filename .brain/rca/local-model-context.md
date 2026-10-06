---
status: active
superseded_by: null
---

# Local agent tools lost under server context truncation

## Symptom

An actual OpenCode 1.18.34 task asking `qwen3.5:4b` to read `proof.txt` returned prose without executing the read tool, despite a successful basic forced-tool probe.

## Evidence

- A metadata-only loopback proxy observed the OpenCode request containing ten tools including `read`, `tool_choice: auto`, and the selected local model. No prompt or credential was logged by that proxy.
- The isolated Ollama server log at 08:10:27 Asia/Bangkok reports `truncating input prompt limit=2050 prompt=7589 keep=4 new=2050` and a runner context of 4096.
- The CLI emitted text claiming it could not read files, no tool-use event, and exit code 0. Exit 0 therefore did not establish task success.

## Root Cause

Confirmed configuration fault: the default local server context discarded most of the agent's prompt and tool definitions. A controlled rerun of the same model, prompt and permissions at 16384 tokens succeeded: OpenCode executed the `read` tool and returned the exact file marker. No model-quality failure is inferred from the truncated run.

## Why the issue escaped detection

The small endpoint probe fits into the default context, whereas the full CLI injects a substantially larger prompt and tool catalog. Reachability and forced-tool output are weaker evidence than an actual completed agent action.

## Proposed prevention

Document local server context sizing alongside model/engine configuration. Keep basic probe success separate from complete workflow acceptance.

## Controlled verification

At 08:13:23 Asia/Bangkok, OpenCode 1.18.34 with `qwen3.5:4b` executed `read` against the QA `proof.txt`. At 08:13:38 it returned exactly `ZURI_LOCAL_TOOL_PROOF_20261005` and exited 0. Ollama processed 7589 input tokens then 7727 on the follow-up, with no truncation. The separate server used `OLLAMA_CONTEXT_LENGTH=16384`, loopback port 11437, cloud disabled, isolated home/temp, and the same existing model. No permissions were expanded. Full local evidence: ignored `node_modules/.zuri-provider-qa/live-cli-4b-16k.jsonl` and `ollama-16k.stderr.log`.
