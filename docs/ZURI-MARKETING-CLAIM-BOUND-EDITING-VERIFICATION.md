---
status: active
superseded_by: null
version: 0.1.0
---

# Claim-bound editing verification

Date: 2026-10-06 (Asia/Bangkok). Approved [plan v0.1.0](ZURI-MARKETING-CLAIM-BOUND-EDITING.md). C-2 / MEDIUM. **Final acceptance FAIL.** Implementation and preparation passed; the single live B session completed but failed automatic layout and manual editing/source-accounting checks. The authorized attempt is consumed.

## Implemented scope

The new `tools/verify-marketing-claim-bound-editing.cjs` prepares and validates the reused A evidence, adds the exact approved instruction, and permits only one new Plain B session. The prior accepted A output, context, manual review and bound runtime artifacts are checked before copying. The unchanged draft is read-only; the historical 5.0.7 archive and cleanup addendum are also checked. A is explicitly REUSED_VERIFIED_INPUT, not a new execution.

Narrow comparison/candidate adapters support a separate claimBound receipt and a single plain-B profile. The isolation runner exports its existing evidence helper and rejects the new mode. Prior modes retain their separate entry points. An exclusive claim precedes CLI dispatch; reused profile state, wrong modes and repeated attempts are rejected. No product code, vendored skills, model defaults, dependencies or server ownership guard changed.

The prompt requires every factual hero claim to be accounted for under Sources and unknowns using exact source text. Structural acceptance remains separate from manual semantic review: no substring or model-authored mapping is treated as proof of factuality. B must still perform current-parent context/skill/draft reads, retain the exact CTA, complete all sections, print its marker and accurately explain exactly two edits.

## Offline and preparation evidence

- **54/54 tests PASS**, zero failed/skipped. Command: `node --test test/marketing-claim-bound-editing.test.cjs test/marketing-task-isolation.test.cjs test/marketing-model-candidate.test.cjs test/marketing-comparison.test.cjs test/marketing-live-diagnostic.test.cjs test/marketing-wire-recorder.test.cjs`. Log: `output/marketing-claim-bound-tests.txt`.
- Tests cover exact accepted source bytes, altered evidence bindings, failed/missing review, prompt agreement with the approved document, source-accounting rows versus Edits entries, wrong modes, duplicate attempts and reused profiles. The existing suites retain draft immutability, actual-parent reads, output contract, recorder and native PTY coverage.
- Syntax/whitespace checks PASS. Pinned vendor provenance: **50 skills / 291 hashes verified**.
- Prepared run: `output/playwright/marketing-claim-bound-1791248635666`. One fresh plain-B profile; no plain-A or Zuri profile. No attempt claim or inference session exists at this checkpoint.
- Integrity: **604 unchanged product inputs**, one separately recorded approved UPSTREAM.md publication-metadata difference, **57 controlled files**, unchanged application 0.5.1 ASAR. Installed 9b manifest and CLI 1.18.34 verified. Runtime model/none/context evidence remains NOT_RUN until the live session.
- Exact reused A SHA-256: `096ca7aa79f800710d240fc3fa13fa2e14c7715d59ab5030196ae82a2a22b0c9`; context: `5b061db2782a7d76725cfca02202a11737948dc97a058c2e867261c1ea792ce3`. Source session: `ses_ef1542bc8ffeQyVpdZEUuhN6ke`.
- Prior 5.0.7 archive remains `e50a3e839b2749aaf45bcec30215746128ef127df9eb4fd83f95e44a5c6ab235`.
- Six real entry-point negative checks rejected before dispatch: new --A, repeated --prepare, historical isolation --B, candidate --plain, comparison --plain and the legacy live launcher hint. Current receipt remained byte-identical, profile stayed fresh and no attempt was consumed. Details and runner hashes: `implementation-verification.json` in the new run directory.

## Live result and manual review

User started Ollama 0.35.1, PID 38052. B session `ses_ef13e9307ffeEm0UutLB7sDzwL` ran one task from 01:08:18.019Z to 01:09:42.801Z. Runner finished at 01:09:43.341Z. It produced 1854 characters; SHA-256 `fb435bc888b959fe1bed63ecdbcc668c537d7297687b696037741615d1e5f41c`. Prompt SHA-256: `b83faa772e17eadc7a2681766af6689934c149b1902143501d987fc789088616`.

| Check | Result | Evidence |
| --- | --- | --- |
| Context, copy-editing and draft reads | PASS | All completed under B's actual user parent |
| Exact CTA and completion marker | PASS | Both present in raw final output |
| Required layout | FAIL | Introductory prose precedes Headline |
| Hero factuality | PASS | Headline, Subheading and CTA match accepted A verbatim |
| Source quotations | PASS | Quoted supporting context strings and line references match; feature claim itself is paraphrased despite being called a direct quote |
| Complete claim accounting | FAIL | Local desktop task organizer has no claim-to-source mapping |
| Two actual edits and accurate explanations | FAIL | Both entries explain making no changes; no two clarity edits were delivered |

The model rewrote Sources and unknowns but did not describe that change in its two no-edit explanations. All required sections and two numbered entries exist, so those structural checks pass; they do not establish editing success. Manual review is saved separately as `task-B-content-review.json`, bound to output/context/draft/prompt/report/events/wire hashes. The raw result remains FAIL. [RCA](../.brain/rca/marketing-claim-bound-edit-review.md) records established causes of rejection and the unresolved model-internal cause.

Three recorded HTTP requests include CLI background work; exactly one user task and one fresh session were observed. All requests used the pinned model, explicit none and baseline pass-through, with HTTP 200, zero parser errors and zero reasoning characters. Effective context 32768; maximum prompt tokens 10791; no truncation observed. All six executed runner hashes match the implementation record. Post-run 604 product inputs and 57 controls verified; only expected CLI schema metadata was added to the provider config. Prior snapshot 5.0.7 and its accepted A evidence remain unchanged.

## Evidence and cleanup

Local gallery: `output/playwright/marketing-live-snapshot-5.0.8/index.html`. Archive: `output/playwright/Zuri-0.5.1-snapshot-5.0.8.zip`; delivery checksum/size/manifest verification is recorded in `output/claim-bound-delivery-5.0.8.json` after creation. Includes full raw B output, reused A provenance and original evidence, bound manual review, prompt, controls, tests, executed runners and RCA. It excludes profiles, databases and raw terminal transcripts. Rendered preview is a report, not an application screenshot.

Owned PTY and recorder are closed, errors and contamination are empty. After the user's stop, read-only verification at 2026-10-06T01:15:10.5543578Z found PID 38052 absent and ports 11438/11439 closed: **cleanup PASS**. Addendum: `output/playwright/marketing-claim-bound-1791248635666/cleanup-closure-20261006T011510558Z.json`. The frozen snapshot retains its original PENDING_USER_STOP state; its archive SHA-256 remains `6ed1c14ea0eaebd219ef504333b2ea0e54c9cd859be2c9334e3c17a648b9e2c8` (260,529 bytes, 41 files). No further inference is authorized.

## Startup record

The reviewed QA server must be started manually by the user. Prior automatic approval review rejected tool-based server startup without a detailed reason; no alternate tool route is used. The launcher still prints its legacy hint. For this receipt the authorized continuation is `node tools/verify-marketing-claim-bound-editing.cjs --B`, not that hint.

Startup and the one B execution are complete. No application screenshots were taken for this Plain-only run. A missing review or an automated structural PASS is insufficient for overall PASS.

## Version diff

Plan **0.1.0 draft -> active**. New B-only QA runner/tests and verification document, with narrow shared QA adapters. App **0.5.1 -> 0.5.1**. Snapshot **5.0.7 -> 5.0.8**, both overall FAIL; 5.0.8 preserves hero facts but fails editing/accounting/layout. No commit, push, binary release or product adoption was performed.
