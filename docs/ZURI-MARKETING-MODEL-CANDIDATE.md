---
status: active
superseded_by: null
version: 0.1.0
---

# Bounded qualification of the installed marketing model candidate

Date: 2026-10-06 (Asia/Bangkok). C-2 / MEDIUM: QA runner and model selection for a bounded experiment. Application remains 0.5.1. Proposed evidence snapshot 5.0.6. User approved this v0.1.0 plan with "approve" before implementation.

## Evidence and assumptions

Parent review: PRODUCT.md, docs/ZURI-MVP.md and docs/ARCHITECTURE.md. Peer review: route comparison verification, output contract and local-thinking contracts. Preserve local-only routing, exact-session assessment, user-controlled model settings and pinned skill provenance.

Snapshot 5.0.5 reproduced missing markers outside Zuri. Plain B also omitted required reads and described an edit inaccurately. Zuri A was not a usable hero, so B was skipped. These observations do not establish a model-internal root cause. Existing app/CLI processes and QA ports were closed; post-snapshot cleanup PASS is in `output/playwright/marketing-comparison-1791244524124/cleanup-closure-20261006T000656123Z.json`.

Read-only local inventory on 2026-10-06 confirms:

| Control | Value |
| --- | --- |
| Candidate | qwen3.5:9b, already installed; manifest present in O:\.ollama\models |
| Digest | 6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7 |
| Reported parameters / quantization | 9.7B / Q4_K_M |
| Stored model bytes | 6594474711 |
| Reported capabilities | completion, vision, tools, thinking |
| Sampling metadata, both 4b and 9b | temperature 1, top_k 20, top_p 0.95, presence_penalty 1.5 |
| Local GPU | NVIDIA RTX 3060, 12288 MiB total VRAM |

[ASSUMPTIONS]

1. The next useful step is to qualify an already-installed alternative for this task, before changing product prompts or code.
2. Larger parameter count is a candidate selection reason, not evidence of better quality. Runtime support for explicit none and context 32768 must be verified; inventory capabilities alone are insufficient.
3. The 4b result is historical reference. Different weights, timing and fresh absolute fixture paths prevent a pure model-size causal comparison. No performance or general reliability claim follows from one run.

## Bounded sequence and gates

1. Prepare a fresh synthetic Git workspace, isolated profiles and receipt. Copy the exact DeskLeaf fixture and pinned eight skill resources with licenses/hashes. Generate A/B once using unchanged output contract v0.1.0; both candidate routes use the same prompt bytes and common absolute paths. Historical prompt differences are limited to fresh path locations and must be recorded, not called byte-identical to 5.0.5.
2. User starts the existing reviewed QA launcher. It starts a generic local Ollama server; its legacy 4b manifest check is not candidate validation. Independently verify the installed 9b manifest/digest, server 0.35.1, CLI 1.18.34/hash and unchanged app ASAR before dispatch. Do not edit the server ownership guard, download anything, or tool-start the server.
3. **Session 1: Plain interactive OpenCode PTY with local/qwen3.5:9b.** A, then B only if A is usable. Same read/glob/list policy, no edits/shell/network/delegation, none option, small-model pin and 32768 context. Startup and each task bounded to 300 seconds; cleanup bounded separately. A failed attempt counts and cannot be retried.
4. Stop after plain and review actual content. **Only if both A/B pass every automatic check and manual grounding/edit-accuracy review** may session 2 begin. Record an explicit local review receipt binding the output hashes. No automatic assumption of content PASS. If plain fails or is operationally incomplete, Zuri is NOT_RUN and this experiment ends.
5. **Session 2, conditionally: unchanged packaged Zuri 0.5.1 with local/qwen3.5:9b**, Content & Brand and inert coordinator. Same A/B rules and exact-task-parent reads. Bootstrap/history/plugin differences remain disclosed. No third session, resubmission or replacement attempt.
6. Capture screenshots only after verifying the intended panel is visible; dismiss an observed settings overlay and select the existing agent terminal through UI if necessary, without new model calls. Preserve any wrong-view capture and label it accurately. Do not claim a terminal rendering PASS from a settings screenshot.
7. Export actual answers, session identities, wire metadata, exact prompts and hashes; inspect screenshots and full answers. Close owned app/PTY/recorders. Request manual server stop and verify PID/ports. Preserve previous snapshots and publish only local snapshot 5.0.6.

## Acceptance, interpretation and exit

- PASS for a task requires exact-model final output, required current-parent context/skill reads, requested layout, literal CTA and marker, and two accurate explanations for B. Do not relax checks or append missing output.
- Manual review rejects unsupported product claims and inaccurate descriptions of edits. A passing format does not imply passing content.
- Record actual none on every model request, model digest, effective context, no truncation and unchanged controls. If unavailable, fail/qualify the run; no silent fallback, sampling change or context reduction.
- Plain FAIL means this candidate is not qualified by this sample; it does not prove all local models unsuitable. Plain PASS permits the one Zuri attempt. Zuri PASS means a single successful candidate sample, not production readiness or a default-model change.
- Exit once the applicable one or two sessions are finalized and evidence/cleanup status is recorded. Report FAIL, NOT_RUN, PARTIAL and INCONCLUSIVE explicitly where applicable.

## Implementation boundary after approval

QA-only candidate runner `tools/verify-marketing-model-candidate.cjs`, narrow reusable comparison/live-runner adapters, focused tests and related evidence/docs. Reuse the existing classifier, prompt contract, pass-through recorder, schema-metadata guard and PTY disposal. Test candidate allowlist/digest, conditional second-arm gate bound to output hashes, attempt limits, no retry and preserved failures.

No src/, package/dependency, vendored skill, product UI, Hive integration, server ownership or default-model edits. No broad benchmark framework, cloud model, model installation, commit, push or release.

## Approval record

Approved on 2026-10-06 for the scoped QA implementation and at most two conditional model sessions above. No default-model change or release is authorized.

## Execution record

The one Plain session completed; Task B failed its required context re-read and completion marker. The prerequisite gate therefore ends this experiment with Zuri NOT_RUN. No retry or unused second-arm dispatch is authorized. Full findings, limitations and pending server cleanup are recorded in [candidate verification](ZURI-MARKETING-MODEL-CANDIDATE-VERIFICATION.md).
