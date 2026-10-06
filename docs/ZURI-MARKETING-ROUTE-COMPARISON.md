---
status: active
superseded_by: null
version: 0.1.0
---

# Bounded OpenCode versus Zuri/Hive route comparison

Date: 2026-10-06 (Asia/Bangkok). **C-2 / MEDIUM**: two QA execution paths, isolated profiles and evidence collection. No application, model, permission-policy or architecture change. This concrete plan requires approval before implementation under R5.

## Objective and evidence

Determine whether the remaining marketing instruction failures also occur outside the Zuri/Hive route. Snapshot 5.0.4 returned text but failed markers, grounding and B's required context re-read. Its cleanup addendum confirms PID 32532 absent and ports 11438/11439 closed. Its single-session allowance is exhausted.

Inspected parent PRODUCT.md, ZURI-MVP.md and ARCHITECTURE.md; peer marketing-skills, local-thinking and output-contract verification documents. Preserve selected project context, pinned skills, local routing, permission boundaries and exact-session evidence. The [example leakage RCA](../.brain/rca/marketing-skill-example-leakage.md) establishes the observed failure, not its model-internal cause.

Code inspection: `Hive.injectedPrompt` supplies an initial conversation turn and `installOpenCodePlugin` installs a per-agent lifecycle bridge. Therefore the comparison changes the **integration route**, including bootstrap/history/plugin behavior. It cannot isolate prompt context as the sole causal variable. Differences in output are evidence for further investigation, not proof of a particular defective component.

## Two arms, maximum two fresh sessions

| Arm | Execution | Task sequence |
| --- | --- | --- |
| Plain | Existing OpenCode 1.18.34 interactive TUI through a QA-owned PTY, isolated config/profile, no Zuri/Hive bootstrap or bridge | A, then B in that same exact session if A is usable |
| Zuri | Unchanged packaged app 0.5.1, existing OpenCode/Hive integration, inert coordinator and Content & Brand selection | Same A, then B in that arm's exact session if A is usable |

Run plain first, close its owned CLI/PTY, then Zuri. Do not run concurrently. Fixed ordering, server cache state and stochastic generation remain limitations. Bootstrap requests are recorded separately from A/B. If an arm fails operationally, record NOT_RUN/FAIL as appropriate; the other arm may run only if its prerequisites remain safe and intact. Do not replace or retry a failed session. Maximum two sessions total, not two successful sessions.

Use a PTY on both sides. Do not substitute `opencode run` headless transport: it adds another execution difference and has a documented [stdin EOF trap](../.brain/rca/headless-qa-stdin.md). Plain-arm screen evidence, if recorded, must be labeled CLI evidence rather than a Zuri application screenshot.

## Controls

- Same existing OpenCode executable and hash/version, Ollama 0.35.1, qwen3.5:4b and model digest, context 32768, explicit `reasoningEffort: none`, unchanged sampling settings, local provider and pinned small model.
- Same tested app ASAR for the Zuri arm: `d6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71`.
- One fresh synthetic Git workspace shared sequentially, containing the exact 5.0.4 fixture context bytes and a QA-owned copy of the selected pinned skill resources. Both arms receive identical absolute context/skill paths and **byte-identical A/B prompts** generated once from output contract v0.1.0. Preserve source hashes and license. Do not rewrite the installed or provisioned skill contents.
- Zuri still provisions the selected eight skills and records their hashes. For this comparison, task prompts point both arms at the same verified QA skill copies. Report this deliberate comparison setup; do not equate it with the historical default path-selection workflow.
- Separate CLI config/data/cache directories and separate session databases for the arms. No global user configuration or credentials. Plain receives no Hive environment/plugin or bootstrap; its profile is not reused by Zuri. Run plain before creating Zuri's Hive files. Record any unexpected Hive read or imported instructions as contamination and qualify the comparison.
- Same effective read/glob/list permissions for the common QA workspace and approved local harness scope; deny writes, shell, network tools and delegation. Reuse existing local-config generation for provider/model/thinking options, with auto mode off. Record additional Zuri integration configuration as an intentional difference rather than hiding it.
- Pass-through recorder on 11439 to the user-started QA server on 11438, with explicit arm/phase/session labels and no request rewriting. No model download, dependency update, backend substitution or cloud fallback.

## Assessment and interpretation

Reuse the corrected exact-parent/session classifier and Markdown-label assessor from 5.0.4. Keep factuality and accuracy of B's two explanations as a separate documented content review. Required reads must belong to the current task parent, not an earlier turn. Preserve missing markers, unsupported claims and absent context reads as failures. Never auto-append a marker or substitute a reviewer answer.

| Observation | Permitted conclusion |
| --- | --- |
| Plain passes, Zuri fails | The routes differ in this sample; investigate integration/bootstrap/history/plugin effects next. It does not identify which component caused the difference. |
| Both fail | The issue is reproducible outside Zuri in this sample. Model/task-contract limitations are candidates; Zuri is not proven faultless. |
| Both pass | This sample passes; earlier failures remain valid and reliability is not established. |
| Plain fails, Zuri passes | The integration did not prevent success in this sample; no general superiority claim. |
| Incomplete or contaminated arm | INCONCLUSIVE comparison; do not infer model versus integration causality. |

The two-arm sample is diagnostic, not a statistical benchmark or production acceptance. No follow-up ablation or different model is authorized by this plan.

## Implementation boundary after approval

- New bounded QA orchestration in `tools/verify-marketing-comparison.cjs`; narrow reusable exports/adapters in `tools/verify-marketing-live.cjs` only where needed to reuse the existing packaged flow and assessment. Preserve old modes and raw evidence.
- Focused fixtures in `test/marketing-comparison.test.cjs` and existing diagnostic tests: identical prompts/inputs, arm/session separation, permission parity, no inherited Hive config in plain, single dispatch per task, timeout and partial-result behavior, and failure preservation.
- Related verification/RCA documents and ignored evidence artifacts.
- No edits to `src/`, package versions/dependencies, vendored skills, Hive runtime, application UI, server ownership guard or model settings implementation. No generic benchmark framework.

## Execution and exit criteria

1. After approval, implement and pass focused tests and syntax checks. Verify unchanged product/skill/package inputs and common prompt hashes before inference.
2. Prepare a fresh comparison receipt and server-log directory. Ask the user to launch the reviewed server from Windows PowerShell 5.1 with adequate process visibility. Respect the prior tool-policy rejection; do not launch the model server via another route.
3. Run at most the two arms above. Bound startup and each task to 300 seconds; bound cleanup separately. Record no-output, tool-only, timeout and refused operations without retries. B proceeds only from a usable A in the same arm/session.
4. Export wire metadata, session events, prompts, actual outputs, configuration differences, tests and hashes. Inspect Zuri screenshots and complete answers. Keep the two arms distinguishable in the report and gallery.
5. Close only owned app/CLI/PTY/recorder processes. Request user stop of the owned model server and verify PID/ports; keep pending cleanup visible if not yet confirmed. Never bypass ownership checks.
6. Publish only local evidence **snapshot 5.0.5**, with application still **0.5.1**. Retain 5.0.4 and earlier archives unchanged. Report PASS/FAIL/INCONCLUSIVE separately from general product readiness. No commit, push, release, further sessions or product changes.

## Approval record

The user approved this concrete v0.1.0 plan on 2026-10-06. Implementation and the bounded two-arm comparison are authorized. Server startup remains a manual user action under the previously recorded tool-policy restriction.
