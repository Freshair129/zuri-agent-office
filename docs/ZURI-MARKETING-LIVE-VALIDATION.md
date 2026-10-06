---
status: active
superseded_by: null
version: 0.1.2
---

# Marketing skills: live local-agent acceptance

Date: 2026-10-05. Approved by the user's explicit `approve` after reviewing this plan, following Zuri 0.5.0 delivery. This document does not authorize a new product feature. The user subsequently started the QA endpoint manually. Live execution was performed and the final attempt **FAILS** final-answer acceptance despite successful required reads; Task B remains NOT_RUN. See the [measured verification report](ZURI-MARKETING-LIVE-VERIFICATION.md).

## Purpose and alignment

The [approved marketing contract](ZURI-MARKETING-SKILLS.md) and [0.5.0 verification](ZURI-MARKETING-SKILLS-VERIFICATION.md) establish selective provisioning and restart with controlled processes. They do not establish that a real model reads and applies those skills. This step closes that specific evidence gap using the existing packaged app and local model.

Parent: [PRODUCT.md](../PRODUCT.md), [desktop MVP](ZURI-MVP.md), [architecture](ARCHITECTURE.md). Peers: [marketing contract](ZURI-MARKETING-SKILLS.md), [local-provider verification](LOCAL-PROVIDER-VERIFICATION.md), [context-truncation RCA](../.brain/rca/local-model-context.md). Retain existing provider/permission boundaries and versioned evidence conventions.

Classification: **C-2 / MEDIUM** for the live validation stage: an actual agent reads instructions and may write bounded QA artifacts. The preceding read-only inventory was C-1 / LOW. No application code, schema or permission implementation change is proposed. If verification reveals a defect, record evidence and RCA before proposing a code change.

[ASSUMPTIONS]

1. `next` means continue validating the delivered marketing feature.
2. Use an already installed local model and synthetic product facts for this acceptance run.
3. An isolated QA profile may create its own temporary workspace, agent files, draft output and recordings. None of these become approved Zuri marketing claims.

## Current preflight evidence

| Item | Current observation |
| --- | --- |
| App | Packaged Zuri 0.5.0 exists at `dist/marketing-0.5.0/win-unpacked/Zuri.exe` |
| Package identity | ASAR SHA-256 `582418d68c0799bdd92b2af716876e8d0c0a987d280694320f904e489100a706`, matching the delivery report |
| Working tree | Existing 0.5.0 implementation changes remain uncommitted; no reset, stash or overwrite performed |
| Ollama | Existing server answers at `127.0.0.1:11434`, version 0.35.1 |
| Model | `qwen3.5:4b` is installed; `/api/show` lists completion, tools, thinking and vision capabilities. Capability metadata is not agent acceptance |
| CLI | Existing QA dependency `opencode-windows-x64` package version 1.18.34 and executable are present; no global install needed |
| Capacity at preflight | Approximately 15 GiB free physical memory; C: approximately 20 GiB free and O: approximately 2 TiB free. Recheck before execution |
| Prior model limitation | Earlier 4k context truncated the actual agent prompt; a 16k run completed a file-read task. A second desktop task had no confirmed final answer |
| Proposed QA endpoint | `127.0.0.1:11438` had no listener at inspection; proposed 32,768-token context, one parallel request, existing model store |

An attempted command to start the separate QA Ollama process was rejected before execution by automatic approval review with only **`blocked by policy`**. Rechecking found no listener on 11438 and no new QA startup receipt. The existing server on 11434 remains running. Do not reroute the rejected startup through another tool or shell; conversational approval does not remove this tool restriction. The [RCA](../.brain/rca/marketing-live-policy-block.md) confirms two identical requests were rejected, including the request after approval; the underlying policy trigger remains unknown.

## Concrete acceptance scenario

Create a clearly labeled fictional product context for **DeskLeaf QA**, a local desktop task organizer for solo consultants. Supplied facts: it groups tasks by client and shows a daily checklist; the primary action is **View the demo**. Pricing, testimonials, time savings and performance metrics are unknown. These are test inputs, not facts about Zuri or a real business.

1. Start an isolated QA model server using the existing `qwen3.5:4b` model, loopback only, cloud disabled, one concurrent request and 32k context. Keep the existing default service unchanged. Record effective context and any truncation; bound load and task waits.
2. Launch the exact 0.5.0 packaged app in a new QA profile, with model routing pinned to the local endpoint. Select **Content & Brand** through the existing agent flow and verify its eight selected skills. Use a synthetic source project and separate Hive directory.
3. Task A: ask the real agent to read the shared product context and the provisioned `copywriting/SKILL.md`, then produce a short homepage hero draft: headline, subheading, CTA and a short source/unknowns note. Save the result only in the QA area or retain the complete final response as the artifact. A missing final response is not a pass.
4. Task B, in the same session: ask the agent to read `copy-editing/SKILL.md` and revise Task A for clarity while retaining the supplied facts and CTA. Capture completed file-read tool events and the final revised response. This explicitly tests the previously incomplete repeat-task path.
5. Inspect the two actual outputs against the supplied facts and the selected skills. Capture versioned screenshots, relevant tool events, model identity, input/output hashes and bounded logs. Record failures as failures, rather than replacing model results with assistant-authored copy.
6. Close QA app/PTYs and the specific QA server created for this run. Confirm the original service is still available and the tested ASAR hash is unchanged.

The task prompt requires reading the actual provisioned paths; pasting skill contents into the prompt alone does not establish file use. Read-only extraction of the QA session's CLI records can corroborate screenshots. Restrict extraction to the exact QA session/directory; do not inspect unrelated conversations or credentials.

## Pass criteria and limits

- The model identity is local `qwen3.5:4b` for both tasks; no cloud fallback.
- Actual completed read events establish access to shared context, `copywriting` and `copy-editing` instructions.
- Task A and Task B both have completed final outputs, with the requested sections, factual features and `View the demo` CTA.
- Neither output fabricates price, testimonials, numerical savings or claimed performance. Unknowns remain identified.
- The run preserves the selected skill set, original app artifact and default local-model service.
- Evidence distinguishes actual model behavior, reviewer assessment, skipped checks and runtime failures. One successful role does not certify all six roles or all 50 skills.

Excluded: campaigns, publishing, messages to other people, new credentials, model downloads, changing the default model service, broad repository writes, global skill installation and installer installation. The latter remains a separate next step.

## Version diff and approval record

- Application: **0.5.0 → 0.5.0**; use the existing artifact unchanged.
- New validation document: absent → **0.1.0 draft → 0.1.0 active**, following explicit approval.
- Planned evidence snapshot: **5.0.1**, distinct from the delivered fixture snapshot 5.0.0.
- Live marketing acceptance: **NOT_RUN → measured PASS / PARTIAL / FAIL** only after execution.

Approved scope: run this bounded validation, including the separate local QA Ollama process at `127.0.0.1:11438`, isolated app/model profiles and synthetic marketing tasks. The explicit request was necessary because automatic approval review rejected the startup command, not because the earlier 0.5.0 implementation needed approval again.

Approval record: draft 0.1.0 → active 0.1.0 after the user's explicit `approve`. Retrying the same authorized startup was again rejected before execution with `blocked by policy`; approval does not remove this tool restriction. The fallback is a reviewable local launcher for the user to run. Do not route the rejected startup through another tool or shell mechanism. No additional approval of this plan is required.

Preparation and current execution status are recorded in [the live verification checkpoint](ZURI-MARKETING-LIVE-VERIFICATION.md).

Documentation **0.1.0 → 0.1.1**: added primary rejection evidence and clarified that approval does not establish execution permission. The approved validation scope is unchanged; no new startup attempt was made for the RCA.

Documentation **0.1.1 → 0.1.2**: records manual endpoint startup and actual live attempts. Snapshot 5.0.1 now contains measured failure evidence. The approved scope and final-output criteria are unchanged; QA harness corrections are documented in the verification report and their RCAs.
