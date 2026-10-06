---
status: active
superseded_by: null
version: 0.1.0
---

# Verified editing and correction: verification

Date: 2026-10-06. Approved [plan v0.1.0](ZURI-MARKETING-EDIT-REPAIR.md), C-2 / MEDIUM. **Final live acceptance FAIL.** Implementation and preparation passed, but both authorized model sessions failed the editing/evidence contract. The session allowance is exhausted; the model-output problem is not fixed.

## Delivered code boundary

`tools/marketing-edit-contract.cjs` implements opt-in contract 0.2.0. It rejects prefatory/trailing prose, code fences, Markdown headings, invalid section order, malformed claim/edit records, unknown keys, duplicate top-level JSON keys, missing field references, invented source quotations, false before/after strings, repeated/no-op edits and whitespace-only changes. The exact CTA is read from the fixture context. Every check remains visible separately.

Claim records and their cited substrings are mechanically validated, but substring presence does not prove full factual coverage or entailment. Semantic source coverage, factuality, useful clarity changes and reason accuracy still require explicit manual review. No generated answer is trimmed into compliance or supplemented with a marker.

`tools/verify-marketing-edit-repair.cjs` prepares independent candidate/correction profiles. Candidate has one task; correction can run once only after a completed, hash-bound failed review of a usable candidate. Infrastructure failure without usable output does not unlock correction. Each attempt is exclusively claimed before CLI dispatch. The correction reads the original A, context, skill, exact rejected answer and exact failed review. Immutable correction inputs and prompt are bound to the candidate result. All edit comparisons remain relative to original A.

Both exact correction filenames are present in the narrow permission allowlist from preparation, but their files do not exist until the failed-review gate creates them. No wildcard draft permission or mutation, shell, web or delegation permission was added. This keeps the shared project config immutable between sessions. The two profiles remain separate.

Shared changes are confined to explicit QA mode/contract adapters in comparison, live, candidate, isolation and claim-bound runners. Historical output contract 0.1.0 remains intact. No src/, vendored skill, dependency, app build, model default or server ownership guard change.

## Verified offline evidence

- **66/66 tests PASS**, zero failures/skips: `node --test test/marketing-edit-repair.test.cjs test/marketing-claim-bound-editing.test.cjs test/marketing-task-isolation.test.cjs test/marketing-model-candidate.test.cjs test/marketing-comparison.test.cjs test/marketing-live-diagnostic.test.cjs test/marketing-wire-recorder.test.cjs`. Final log: `output/marketing-edit-repair-tests.txt`.
- Frozen regression fixtures preserve exact 5.0.7 A/context and 5.0.8 B bytes, with hashes in `test/fixtures/marketing-edit-repair/provenance.json`. They reproduce unchanged hero, source-format/accounting and layout rejection. Synthetic positive examples and synthetic on-disk correction evidence are clearly labeled; they are not live model proof.
- Independent negative checks cover no-op/whitespace edits, false before/after records, malformed/duplicate JSON, missing fields, invented quotes, wrong CTA/marker, omitted or wrong-parent reads, stale/manual review bindings, repeated attempts, reused profiles, correction before review and changed/writable correction artifacts. A complete synthetic failed-review gate passes before its rejection cases are tested.
- During development, an extra-text test initially checked the wrong field: [RCA](../.brain/rca/marketing-edit-repair-test-assertion.md). A later independent Markdown-heading regression exposed a missing layout guard; the failing reproduction is preserved at `output/marketing-edit-layout-reproduction.txt`, and [RCA](../.brain/rca/marketing-edit-layout-markdown.md) records the correction. Both are resolved in the final 66-test result.
- Runner/parser syntax and whitespace checks PASS. Vendor provenance verifies **50 skills / 291 hashes**.

## Prepared runtime evidence

Run: `output/playwright/marketing-edit-repair-1791250019712`. Candidate prompt: `candidate-prompt.txt`. Base controls: `edit-repair-controls.json`; original A provenance: `reused-A-evidence.json`.

Verified **604 unchanged product inputs**, one separately pinned UPSTREAM.md publication-metadata difference, **64 controlled inputs**, unchanged application 0.5.1 ASAR, pinned installed 9b manifest and existing CLI hash/version evidence. The prior 5.0.8 archive remains `6ed1c14ea0eaebd219ef504333b2ea0e54c9cd859be2c9334e3c17a648b9e2c8`, with cleanup PASS. The accepted A draft remains exact and read-only at SHA-256 `096ca7aa79f800710d240fc3fa13fa2e14c7715d59ab5030196ae82a2a22b0c9`.

Nine real entry-point negative checks rejected before dispatch: premature prepare-correction, correction and candidate finalization; unsupported --A; duplicate preparation; historical claim-bound/isolation/candidate routes; and the legacy live launcher hint. Global receipt stayed byte-identical, both profiles stayed fresh, correction artifacts remained absent and no attempts were claimed. Results and all eight runner hashes are saved in `implementation-verification.json` inside the run directory.

## Execution procedure

The user starts the reviewed QA server manually; tool-based startup was previously rejected by automatic approval review without a detailed reason. No alternative tool-start route is used. The generic launcher prints an obsolete continuation hint; this run uses `node tools/verify-marketing-edit-repair.cjs --candidate`.

After candidate completes, inspect the full output, current-parent reads, actual before/after diff, all source claims and wire controls. Write `candidate-review.json` bound to candidate-result binding, with reviewer/time, result, and separate layout, actualEdits, sourceCoverage, factuality and reasonAccuracy decisions plus evidence. A FAIL additionally needs concrete findings with field/reason. Finalize through `--finalize-candidate`.

Only a usable failed candidate with that completed review permits `--prepare-correction`, then `--correction` once. Inspect correction independently, write its bound review, and use `--finalize-correction`. Success ends the run; failure after correction also ends the authorized scope. Missing review never means PASS. Preserve every attempt, then deliver snapshot 5.0.9 report/preview/archive and verify server cleanup.

## Completed live results

User started Ollama 0.35.1, PID 7528. Candidate ran 01:31:08.910Z–01:32:39.454Z in `ses_ef129b336ffeeOxh7giRJgO4cB`; correction ran 01:34:10.870Z–01:35:13.764Z in `ses_ef126f265ffeSWhMnu1YIUyXjt`. Each profile contains one session and one user task. Candidate review was finalized FAIL before the single correction was prepared. The two correction files remain exact/read-only and the correction actually read both, along with the three base inputs.

| Check | Candidate | Correction |
| --- | --- | --- |
| Required current-parent reads | PASS: 3 | PASS: 5 |
| Outer layout, CTA, marker | PASS | PASS |
| Hero factuality | PASS | PASS |
| Structured evidence records | FAIL | FAIL |
| Two actual edits bound to final fields | FAIL | FAIL |
| Accurate explanations | FAIL | FAIL |
| Overall acceptance | FAIL | FAIL |

Candidate: 2117 characters; output SHA-256 `4b7571fe9deb97a5613fc3db78e03769094dbd7548e872a67c058cf4ed32e10b`. Headline is unchanged with null reason; Subheading changes client tasks to client work, while its main claim still quotes the original text. An extra after_claim record and bare unknowns line violate the schema.

Correction: 2080 characters; output SHA-256 `ab6142ad67eb51a6d3527427345d4f3172f7d873e644f3e0d6083f697bd2c12f`. Headline is shortened and its explanation is accurate. Actual Subheading reverts to original A, but its declared after value and explanation describe client work instead of final client tasks. The invalid unknowns record/bare line persist. The first three claim records now correspond to final fields and genuine source quotations, but the complete evidence section still fails its required schema. [RCA](../.brain/rca/marketing-edit-repair-live-failure.md) records the established failures without attributing an unproven internal model cause.

Both reviews are separately bound to output, original draft, context, prompt, report, session events and wire hashes; correction binding additionally includes rejected answer and feedback hashes. Both acceptance files were finalized through the guarded runner. The failed candidate remains in the evidence, and no generated text was rewritten by the reviewer.

All six requests (three per session, including CLI background requests) used the exact pinned model, explicit none and pass-through recording. HTTP 200 throughout; no parser errors or reasoning characters; effective context 32768. Maximum prompt tokens: candidate 10735, correction 13052; no truncation observed. Eight executed runner hashes match the implementation record in both phases. Post-run 604 product inputs and 64 controlled inputs verified, plus bound correction artifacts; only expected CLI schema metadata was added to the two provider configs. Prior archives and original A remain unchanged.

## Delivery and cleanup

Gallery: `output/playwright/marketing-live-snapshot-5.0.9/index.html`. Archive: `output/playwright/Zuri-0.5.1-snapshot-5.0.9.zip`. Archive verified: **584456 bytes / 71 files**, SHA-256 `84c680c1b4d9ceedf8e357d4113f4963eaa9b38f3162077bb103ace21fc24ef8`; manifest hashes/sizes and ZIP CRC/count PASS. Creation receipt: `output/edit-repair-delivery-5.0.9.json`. Explicit evidence includes both original outputs, reviews, acceptance decisions, exact correction inputs, prompts, tests/fixtures, executed runners, source provenance and RCA. Profiles, databases and raw terminal transcripts are excluded. The rendered screenshot is a QA report, not a Zuri application screenshot.

Both owned PTYs and recorders are closed, errors/contamination are empty. **Cleanup PASS** at 2026-10-06T01:43:18.2563135Z: PID 7528 absent; ports 11438 and 11439 have no listeners; archive SHA-256 unchanged. Separate closure addendum: `output/playwright/marketing-edit-repair-1791250019712/cleanup-closure-20261006T014318256Z.json`. Frozen snapshot and delivery receipt retain their original PENDING_USER_STOP state at creation; this addendum records the subsequent verified closure. Live acceptance remains FAIL. No further inference is authorized.

## Version diff

Pre-publication verification on 2026-10-06: affected offline suites rerun **66/66 PASS**, zero failures/skips; pinned provenance **50 skills / 291 hashes PASS**. Staged regression fixture bytes match their recorded SHA-256 values. The full staged whitespace check reports one retained trailing space in the original `test/fixtures/marketing-edit-repair/5.0.8-B.md` response; preserve it for exact historical evidence. The staged check excluding that one immutable fixture passes. Generated runtime profiles, local output packages and helper scripts are outside the source commit. Source publication does not qualify the failed live response or create a release.

Plan **0.1.0 draft -> active**; new opt-in QA output contract **0.1.0 -> 0.2.0**, parser, guarded correction runner, regression fixtures and tests. App **0.5.1 -> 0.5.1**. Snapshot **5.0.8 -> 5.0.9**, both FAIL; 5.0.9 verifies rejection and bounded correction but does not achieve acceptable edited output. No commit, push, release or product adoption.
