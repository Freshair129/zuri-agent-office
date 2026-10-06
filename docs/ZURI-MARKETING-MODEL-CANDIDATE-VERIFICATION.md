---
status: active
superseded_by: null
version: 0.1.0
---

# Installed candidate verification record

Date: 2026-10-06 (Asia/Bangkok). Approved contract: [candidate v0.1.0](ZURI-MARKETING-MODEL-CANDIDATE.md). C-2 / MEDIUM. QA implementation is verified; candidate acceptance failed in the one Plain session.

## Current result

**Candidate acceptance: FAIL.** One Plain session completed: A AUTOMATED_CHECKS_PASS, B FAIL. Manual review also found contradictory source accounting in B. Conditional Zuri inference and screenshots: NOT_RUN by the approved gate. No retry or second session is permitted after this failed prerequisite.

Run: `output/playwright/marketing-candidate-1791245968063`. The user started Ollama 0.35.1, PID 39256. Plain session `ses_ef168bde3ffejgK6w3VC0i7PSB` ran from 00:22:21.516Z to 00:24:21.971Z. Owned PTY and recorder closed. After the user's stop, PID 39256 was absent and ports 11438/11439 were closed: cleanup PASS. Startup was manual and no server ownership guard was changed.

## Implemented controls

- Candidate runner independently pins the installed qwen3.5:9b manifest SHA-256 and server model digest to `6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7`. It validates local endpoints, baseline pass-through, explicit none, context 32768 and existing runtime versions.
- Reuses the interactive PTY and disposal path. Exclusive candidate/arm/task claims prevent repeated dispatch, including after failure. The historical comparison entry point rejects candidate receipts.
- Plain results remain immutable. The second arm requires complete automated acceptance, exact-session task reassessment from saved events, clean wire evidence, verified cleanup and a separate explicit manual review of grounding and edit accuracy. The review binds both output hashes, session ID, report, events, wire and context hashes. Missing, stale, failed or incomplete review cannot pass.
- Candidate terminal captures check visibility and occlusion. An unverified capture is preserved before dismissing an observed settings dialog or selecting the existing terminal tab. Every capture still requires image review; this safeguard is not yet visually verified.
- No product, dependency, skill, default-model or server ownership changes. No model download, tool-started server, commit or release.

## Completed verification

`node --test test/marketing-model-candidate.test.cjs test/marketing-comparison.test.cjs test/marketing-live-diagnostic.test.cjs test/marketing-wire-recorder.test.cjs`: **42/42 PASS**, zero failures/skips; process exited normally. Includes model/digest rejection, failure preservation, exclusive attempts, wire failures, content-review hash binding, exact-parent output classification, recorder behavior and inert native PTY cleanup. Tests make no model calls.

Syntax checks for candidate/live runners and `git -c core.whitespace=cr-at-eol diff --check`: PASS. `node tools/marketing-provenance.cjs`: 50 skills / 291 hashes verified.

`node tools/verify-marketing-model-candidate.cjs --prepare`: PASS. 605 non-tools product inputs unchanged; 43 controlled fixture/config/prompt/skill inputs verified. The packaged 0.5.1 ASAR remains `d6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71`. OpenCode reports 1.18.34 with executable hash recorded in the receipt. Installed 9b manifest hash matches the approved digest.

`candidate-controls.json` records original and candidate prompt hashes. A/B changes from 5.0.5 are verified to consist only of the fresh absolute fixture root; context bytes are unchanged. Candidate prompts were prepared for both arms but dispatched only through Plain. This is not a fresh 4b control experiment.

## Live findings and content review

| Task | Actual reads under its own parent | Output | Result |
| --- | --- | --- | --- |
| A | context + copywriting | 657 characters; complete sections, exact CTA and marker | AUTOMATED_CHECKS_PASS |
| B | copy-editing only; no context re-read | 1107 characters; complete sections/CTA/two explanations; no marker | FAIL |

A parent: `msg_10e97423900147T0UomMFlR28i`; B parent: `msg_10e98a1c80012wle3XmhYdeFSO`. Saved events were independently reassessed with the same exact-parent classifier; actual user prompt bytes match both prepared files. Two user turns, no Hive bootstrap, no contamination or operational errors recorded.

A's supplied core product facts and CTA match. Its added phrase “in one place” is not explicitly established by the fixture, so a unified-view claim is not certified. B preserves that phrase and incorrectly says the DeskLeaf name was not originally supplied, although the fixture heading names DeskLeaf QA and B's own edit 1 says that the context establishes the name. Both literal edits described in B can be found, but explanation 2 omits broader added benefit wording and removal of the explicit consultant audience. No fabricated numbers/prices/testimonials were identified. Full review and output hashes are in `review.json`; no passing manual gate receipt was created.

All five recorded requests used the exact 9b model, explicit none and baseline pass-through; HTTP 200, zero parser errors and zero reasoning characters. Effective context 32768 and approved model digest verified; maximum prompt 14859 tokens, no logged truncation. One of the requests is the CLI's background title generation. No sampling or context adjustment was made.

Post-run integrity: 605 product inputs and 43 controls verified. OpenCode added only its expected `$schema` metadata to the isolated provider file; the existing semantic guard accepted it. Previous snapshot 5.0.5 archive hash remains `3668790c9ca4922302fb02ac9108ba53f373f4b5d4ead5abf4efc468492e9cd3`.

This sample does not qualify 9b for the requested workflow. A's automatic result does not establish overall superiority to 4b, reliability, or production readiness. Missing context re-read/marker are directly observed; the model-internal reason is not established. No product fix is inferred from this run.

## Evidence and remaining cleanup

Snapshot directory: `output/playwright/marketing-live-snapshot-5.0.6`; archive: `output/playwright/Zuri-0.5.1-snapshot-5.0.6.zip`. Contains actual answers, prompts, controlled configuration, session events, wire metadata, integrity, executed runners and reviews. No Zuri screenshots exist because the gate prevented launching Zuri. Gallery rendering is report verification only. Delivery hash is recorded separately in `output/model-candidate-delivery-5.0.6.json` after archive verification.

Post-snapshot cleanup PASS is recorded in `output/playwright/marketing-candidate-1791245968063/cleanup-closure-20261006T003059121Z.json`. The frozen archive remains 61,452 bytes / 24 files, SHA-256 `8ec1faeefaf0f2c016918878afc67532fadb9ff74250839220a29a8e8e1f98e8`, with its original PENDING_USER_STOP state; the addendum closes that state without rewriting evidence. Manifest hashes and ZIP CRC were verified. The evidence gallery was rendered and inspected with no horizontal overflow. Do not retry either arm or relax acceptance. The unused conditional session is not available after Plain FAIL.

Pre-publication checks on 2026-10-06: focused marketing/provider/config/hire/QA tests **90/90 PASS**, no skips; Node and renderer typechecks PASS. The local test log is `output/marketing-precommit-tests.txt`. These checks do not change the live FAIL result.

## Version diff

Candidate plan v0.1.0: draft → active after approval. Candidate runner and focused tests: new v0.1.0. Comparison/live runner: narrow candidate preparation, gate and capture adapters. Application remains **0.5.1 → 0.5.1**. Evidence **5.0.5 → 5.0.6**, reporting candidate FAIL and Zuri NOT_RUN. Prior snapshots remain preserved.
