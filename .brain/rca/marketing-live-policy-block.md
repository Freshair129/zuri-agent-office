---
status: active
superseded_by: null
version: 0.1.1
---

# Marketing live QA startup rejected before execution

Date: 2026-10-05. Investigation: **PARTIAL / OPEN**. The failure stage is confirmed; the policy rule and reason remain unknown. This is an investigation record, not a verified fix.

Classification: **C-2 / LOW**, documentation and read-only diagnostics only. The approved live validation remains **C-2 / MEDIUM**; its classification and scope have not changed. No application, launcher, permission, service or model configuration was changed during this RCA. No rejected startup was retried.

## Parent and peer alignment

Parent: [product](../../PRODUCT.md), [desktop contract](../../docs/ZURI-MVP.md), [architecture](../../docs/ARCHITECTURE.md). Peers: [approved live validation](../../docs/ZURI-MARKETING-LIVE-VALIDATION.md), [execution checkpoint](../../docs/ZURI-MARKETING-LIVE-VERIFICATION.md), [context truncation RCA](local-model-context.md). Retain explicit provider boundaries and distinguish artifact verification from real model execution. The earlier context and headless-stdin defects occurred after process startup; they do not explain this pre-execution rejection.

## Symptom

The approved marketing validation cannot start its separate Ollama QA endpoint at `127.0.0.1:11438`. Both attempts to execute the startup command returned `blocked by policy`. Real skill reads, Tasks A/B and snapshot 5.0.1 remain **NOT_RUN**.

## Evidence

Primary source: this chat's local session transcript, `rollout-2026-10-05T07-42-40-01a10983-4524-7830-a4cc-7d6b3d8393bd.jsonl`. Only the two rejected calls and intervening user approval were extracted. [Evidence metadata](evidence/marketing-live-policy-block.json) records call IDs, original line numbers, timestamps and hashes; it does not copy the full conversation or credentials.

| Event on 2026-10-05 | Asia/Bangkok | Transcript lines | Observation |
| --- | --- | --- | --- |
| Startup attempt 1 | 20:10:49 | 6590 / 6592 | `exec_command failed: CreateProcess`, followed by `Rejected` and `blocked by policy` |
| User authorization | 20:43:12 | 6632 | Explicit `approve` |
| Startup attempt 2 | 20:43:33 | 6636 / 6638 | Same rejection; the complete tool input has the same SHA-256 as attempt 1 |

The rejected request was one compound PowerShell command: prepare a QA directory, set child-process environment values, start `ollama.exe serve` hidden on loopback port 11438 with a 32k context, and save a PID receipt. The reported rejection names the outer PowerShell process creation. It does **not** identify which command element triggered the decision. The current `tools/start-marketing-live-qa.ps1` was authored afterward and is not the script originally rejected.

Read-only recheck at **2026-10-05T15:45:14Z**:

- Port 11438 has no listening process. The prepared QA receipt has no `ollamaPid`, executable or start-time ownership fields; the run directory has no Ollama stdout/stderr log files.
- The original port 11434 listener belongs to PID 19084. Its `/api/version` returns Ollama **0.35.1**. This proves default-service availability only.
- The prepared `live-result.json` reports **NOT_RUN**, empty tasks/screens and an unavailable QA endpoint. Its recorded preflight time is 13:55:08Z; it was read, not rerun or overwritten during this RCA.
- The packaged app ASAR remains SHA-256 `582418d68c0799bdd92b2af716876e8d0c0a987d280694320f904e489100a706`.
- The inspected local Codex config contains `approval_policy = "never"` and `sandbox_mode = "danger-full-access"`. The inspected `rules/default.rules` contains two unrelated `allow` rules and no explicit deny rule. These current file observations do not establish the full effective policy or explain the earlier rejection.
- Searching the six desktop log files under `AppData/Local/Codex/Logs/2026/10/05` for the two exact call IDs found no matches. No correlated rule ID or diagnostic reason was obtained. This bounded search does not prove that richer diagnostics exist nowhere else.

## Root Cause

**Confirmed failure mechanism:** the tool execution layer rejected the requested shell process before the startup command could execute. Consequently the QA server was not started by either attempt, the endpoint prerequisite remained absent, and live acceptance could not proceed.

**Underlying policy trigger: UNKNOWN.** The returned error provides only `blocked by policy`; it provides no rule ID, matched condition or decision rationale. It is not evidence that port 11438, `Start-Process`, the environment overrides, 32k context or Ollama itself is forbidden. The rejection also does not establish a Windows ACL, firewall, antivirus, syntax, memory or model defect. No such cause should be promoted from a hypothesis to a finding.

The second identical command was rejected after explicit authorization. Therefore, missing conversational approval alone is not a sufficient explanation or an effective remedy for the observed block. The available evidence does not identify the responsible policy subsystem more precisely than the tool's pre-execution boundary.

## Why the issue escaped detection

1. Syntax validation, an installed model and a healthy default endpoint do not exercise the tool's decision on a new process-start request.
2. The earlier response treated fresh user approval as a possible way to resolve the rejection without evidence of the policy's reason. The controlled repeat demonstrated that approval did not remove this block; asking again would repeat an ineffective step.
3. The generic error lacks the diagnostic fields needed to distinguish an intended restriction, an overly broad decision or another enforcement configuration. A runtime RCA cannot supply those missing policy facts.

## Proposed prevention

- Keep separate outcomes for pre-execution rejection, process-start failure, endpoint readiness and completed model tasks. Record the actual stage, timestamp, call ID and input hash.
- Preserve user authorization; do not ask for repeated approval of the same accepted scope or reroute a rejected action through another tool/shell.
- Obtain a policy decision trace or supported diagnostic explanation correlated to the two call IDs from the tool/platform owner before proposing a policy or code fix. This document is a reviewable diagnostic packet; nothing has been sent externally.
- The existing manually invoked launcher is an operational continuation option only. Its success would not explain or repair the agent tool's denial. Do not label it a root-cause fix or promise it will succeed before execution.
- Keep application code, default Ollama service and security settings unchanged while the policy trigger is unknown.

## Verification and exit criteria

| Check | Result |
| --- | --- |
| Two primary rejection records and identical input hashes | PASS |
| Explicit user approval precedes rejection 2 | PASS |
| Current default service availability and ASAR identity | PASS |
| Exact policy rule / decision rationale | UNKNOWN |
| Policy remediation and successful authorized startup | NOT_RUN |
| Real marketing tasks and snapshot 5.0.1 | NOT_RUN |

Close this incident only when the responsible decision can be explained with correlated evidence and an authorized startup/endpoint check succeeds, or the platform owner confirms an intended restriction and its supported operating path. Live marketing acceptance additionally requires the separately approved Tasks A/B and content/visual checks; endpoint readiness alone is insufficient.

## Version diff

- RCA and minimal evidence: absent → **0.1.0**; investigation remains open.
- Live validation/checkpoint documentation: **0.1.0 → 0.1.1**, correlated RCA and clarification only; approved scope unchanged.
- Application **0.5.0 → 0.5.0**. Delivered snapshot **5.0.0** unchanged; **5.0.1** remains planned / NOT_RUN.

## Subsequent operational continuation

The user manually ran the reviewed launcher and reported `QA ready`, Ollama 0.35.1, PID 24052. The receipt records startup at **2026-10-05T16:04:30.8668294Z**. A subsequent read-only check confirmed loopback port 11438 belongs to PID 24052, the process start time matches, and the model endpoint passes preflight. The original port 11434 remains available. This removes the endpoint prerequisite for validation; it does not explain or repair the tool's earlier policy decision. The verification table above describes the initial RCA checkpoint, not the later live attempts.

RCA **0.1.0 → 0.1.1** records this continuation. Current execution outcomes belong to [the live verification report](../../docs/ZURI-MARKETING-LIVE-VERIFICATION.md). No rejected process-start command was retried by the agent.
