---
status: active
superseded_by: null
version: 0.1.0
---

# Fresh-session experiment verification

Date: 2026-10-06 (Asia/Bangkok). Approved [task-isolation plan v0.1.0](ZURI-MARKETING-TASK-ISOLATION.md), C-2 / MEDIUM. **Final acceptance: FAIL.** A passed; B passed automatic checks but failed manual grounding and edit review. Both permitted sessions are consumed.

## Implemented scope

`tools/verify-marketing-task-isolation.cjs` reuses the existing interactive PTY, classifier and recorder. A and B use distinct `plain-A` / `plain-B` profiles and each submits exactly one task. The runner rejects prior profile state, repeated attempts and reused session identity. No Zuri arm exists in this experiment.

After A is finalized and automatically accepted, a separate `task-A-content-review.json` must explicitly pass grounding review and bind the session, exact output, context, prompt, report, events and wire hashes. Only then can `--prepare-B` create `.qa-drafts/task-A.md` from the exact accepted A text, without adding a newline or editing it. Creation is exclusive and the artifact is read-only. B checks the artifact and review again before dispatch. Missing, changed or writable artifacts fail.

B's prompt explicitly requests a current-task read of the prior draft as data. It receives no A conversation history. Its permissions allow only that draft file in addition to the existing context and pinned skill resources; edit, shell, network and delegation remain denied. The classifier requires completed context, skill and draft reads under B's own user parent, while retaining all layout/CTA/marker checks. Full factuality and edit-accuracy review remain manual requirements.

Shared comparison/candidate adapters preserve their historical default behavior. Candidate and app entry points reject an isolation receipt for a Zuri run. No src/, dependency, vendored skill, default model or server ownership guard changed.

## Completed checks

- Focused suites: **49/49 PASS**, zero failures/skips. Command: `node --test test/marketing-task-isolation.test.cjs test/marketing-model-candidate.test.cjs test/marketing-comparison.test.cjs test/marketing-live-diagnostic.test.cjs test/marketing-wire-recorder.test.cjs`. Local log: `output/marketing-isolation-tests.txt`.
- Tests cover missing/edited/writable draft, non-replacement, failed/stale/manual review, reused profile, missing or other-parent reads, malformed outputs, exact candidate controls, exclusive attempts and the existing recorder/native PTY behavior. Tests make no model calls.
- Real prepared-receipt negative checks: `--prepare-B` and `--B` both rejected missing A evidence **before dispatch**. No draft or attempt marker was created. Receipt: `pre-dispatch-gate-verification.json` inside the run directory.
- Runner syntax and tracked whitespace checks PASS. Vendor provenance: 50 skills / 291 hashes verified.
- Preparation PASS: **604 unchanged product inputs**, one explicitly recorded `UPSTREAM.md` publication-metadata change, **44 controlled inputs**, unchanged 0.5.1 ASAR. The approved metadata hash is pinned; other source changes remain errors.
- Installed qwen3.5:9b manifest matches `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7`. OpenCode 1.18.34 verified. Runtime model digest/none/context will be checked during the live run; preparation alone is insufficient.

## Live result and review

Run: `output/playwright/marketing-isolation-1791247321616`. User started Ollama 0.35.1, PID 40028. `isolation-controls.json` records the two profiles, permissions, prompt hashes, historical prompt references and source metadata change. A prompt differs only by fresh absolute paths; B additionally requests the draft read and a fresh history. This is not a single-variable causal comparison.

| Task | Session | Actual reads | Automatic | Manual |
| --- | --- | --- | --- | --- |
| A | `ses_ef1542bc8ffeQyVpdZEUuhN6ke` | context + copywriting | PASS | Grounding PASS |
| B | `ses_ef151b5ceffeMNnAIWkUqUGlJN` | context + copy-editing + exact A artifact | PASS | Grounding/edit review FAIL |

A ran 00:44:49.345Z–00:46:44.710Z and produced 624 characters. Its long headline and repeated features are editorial weaknesses, but all product facts, CTA and listed unknowns match the fixture. `task-A-content-review.json` records genuine manual PASS with output/evidence hashes before `task-B-preparation.json` was created at 00:47:18.721Z.

B ran 00:47:28.218Z–00:48:20.166Z and produced 1187 characters. It printed the correct marker and met all three exact-parent read requirements. However, its subheading adds avoidance of spreadsheets/cloud dependencies and a new checklist every morning. Neither context nor A establishes these behaviors. Explanation 1 accurately removes “your”; explanation 2 incorrectly says its added claims remain within established facts and does not account for the morning behavior. `task-B-content-review.json` records FAIL separately from raw AUTOMATED_CHECKS_PASS. See [evidence-backed failure analysis](../.brain/rca/marketing-task-isolation-unsupported-claims.md).

A's draft remained exact and read-only: SHA-256 `096ca7aa79f800710d240fc3fa13fa2e14c7715d59ab5030196ae82a2a22b0c9`. B output SHA-256: `77aad326994ad053990e9da6b993e6e24e56b722ec9160a972374252a69fa332`. Each profile has one distinct session and one user task; there is no bootstrap, retry or Zuri arm. Saved events were independently reassessed and actual prompt bytes match the prepared hashes.

All six requests (three per session, including CLI background title requests) used the exact model, explicit none and baseline pass-through; all HTTP 200, zero parser errors/reasoning characters. Context 32768 verified in each arm; maximum prompt tokens A 7704 / B 10592; no truncation observed. Both executed runner sets match the implementation hashes. Post-run 604 product inputs and 44 controls verified; only expected CLI schema metadata was added to each isolated provider config. The approved UPSTREAM.md difference remains separately recorded. Prior snapshot 5.0.6 archive hash is unchanged.

The missing-read/marker failures did not recur in this sample, but that does not prove session isolation reliably fixes them. Full acceptance still fails. No root cause inside the model is established and no product behavior or default model is changed.

## Evidence delivery and cleanup

Snapshot gallery: `output/playwright/marketing-live-snapshot-5.0.7/index.html`; ZIP: `output/playwright/Zuri-0.5.1-snapshot-5.0.7.zip`. Includes full unmodified outputs, exact A draft, prompts, bound reviews, session events, wire metadata, integrity, executed runners and tests. SHA/size/CRC verification is recorded in `output/task-isolation-delivery-5.0.7.json` after archive creation. Gallery screenshots verify the report only; there are no Zuri application screenshots in this Plain-only experiment.

Both PTYs and recorders are closed. After the user's stop, read-only verification at 2026-10-06T00:53:26.6015374Z found PID 40028 absent and ports 11438/11439 closed: **cleanup PASS**. Addendum: `output/playwright/marketing-isolation-1791247321616/cleanup-closure-20261006T005326601Z.json`. The frozen snapshot retains its original PENDING_USER_STOP state; its archive SHA-256 remains `e50a3e839b2749aaf45bcec30215746128ef127df9eb4fd83f95e44a5c6ab235` (123,297 bytes, 42 files). No retry, third session or Zuri arm is authorized.

## Version diff

Plan v0.1.0: draft → active after approval. New isolation runner/tests and narrow QA adapters. Application **0.5.1 → 0.5.1**. Snapshot **5.0.6 → 5.0.7**, reporting A PASS and B factuality FAIL. Historical 5.0.6 remains FAIL. No commit/push or binary release was performed in this implementation step.
