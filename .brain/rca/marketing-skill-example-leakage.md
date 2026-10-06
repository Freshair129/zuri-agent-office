---
status: active
superseded_by: null
version: 0.1.0
---

# Marketing skill example leakage and output noncompliance

Date: 2026-10-06 (Asia/Bangkok). Read-only follow-up to snapshot 5.0.3.

## Symptom

Task A includes an Amazon returns headline and an unsupported app-switching benefit. Both A and B omit their requested completion marker. B gives three edit explanations where the user requested two. Full marketing acceptance remains FAIL despite successful local transport and actual file reads.

## Evidence

- `resources/marketing-skills/skills/copywriting/SKILL.md:125` contains the example `Hate returning stuff to Amazon?`. The same sentence begins option C in `output/playwright/marketing-live-1791240676184/task-A-output.md`.
- The exact-session event export records a successful read of the provisioned, pinned copywriting skill before A's response. The fixture `project/.agents/product-marketing.md` describes a local task organizer and contains no Amazon returns fact.
- The copywriting skill's output section asks for 2–3 headline/CTA options. Multiple A variants alone are not a failure: the original task did not explicitly require exactly one.
- The B prompt explicitly requests two brief explanations; its full output has three numbered explanations. Both original prompts explicitly request their respective `QA_TASK_*_DONE` marker, absent in both finals.
- `src/main/marketingSkills.ts:103` supplies a compact skill index and shared context path. It does not explicitly distinguish examples inside skills from evidence about the selected product, or explain how skill-default output formats relate to the current task's requested format.
- Snapshot 5.0.3 has six HTTP 200 requests with no parsing errors, matching wire/CLI final-text lengths, no reasoning text and no recorded truncation. Missing transport text does not explain these failures. App and recorder are closed; the subsequent cleanup addendum verifies PID 37416 absent and QA ports closed.

## Root Cause and limits

Confirmed failure mechanism for the Amazon passage: a methodological example from a successfully read skill appears in the product deliverable even though it is absent from product context. The response failed to keep examples separate from product evidence.

The integration's lack of an explicit source/format boundary is an observed instruction-design gap, but its causal contribution has not been isolated. The model-internal reason for the copied passage, missing markers, and three explanations remains unknown. Do not claim model size, sampling, context overflow, Hive notifications or Ollama transport caused these failures without further evidence.

## Why the issue escaped detection

Provisioning and hash tests establish that instructions are available intact, not that a model follows them. Structural output checks detect headings and marker compliance but cannot establish factual grounding. The automated checker did not count B explanations; separate content review caught that failure. A narrowly token-based check could accept a familiar example containing otherwise valid headings.

## Proposed prevention

Run one separately approved diagnostic using an explicit source/format contract, keeping the app, model, thinking option, permissions, fixture and skill pin fixed. State that context supplies product facts and skills supply methods; examples are not product evidence. Preserve marker requirements and enforce exactly two B explanations. Review grounding separately and retain failed fields. A diagnostic pass is not a shipped product fix or general reliability proof. Do not change vendored skill files, add an Amazon-specific blacklist, fabricate missing markers or substitute reviewer-written answers.

## Approved experiment outcome

The user approved the bounded v0.1.0 experiment before implementation. Snapshot 5.0.4 contains exactly one new A/B session on unchanged app 0.5.1. The copied Amazon example is absent and B has two explanations, but unsupported project/view claims, missing markers, missing B context re-read and inaccurate edit rationale remain. Outcome: FAIL. The underlying model-internal cause remains unresolved, and this single run does not establish reliable prevention. See [verification](../../docs/ZURI-MARKETING-OUTPUT-CONTRACT-VERIFICATION.md). No further model experiment or product adoption followed.
