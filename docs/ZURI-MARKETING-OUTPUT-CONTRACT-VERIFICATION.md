---
status: active
superseded_by: null
version: 0.1.0
---

# Marketing output contract experiment verification

Date: 2026-10-06 (Asia/Bangkok). Implements the user-approved [experiment v0.1.0](ZURI-MARKETING-OUTPUT-CONTRACT-EXPERIMENT.md). C-2 / MEDIUM. Application remains **0.5.1**; planned evidence **5.0.3 → 5.0.4**. This change affects QA instructions and assessment only, not shipped product behavior.

## Completed preparation

- `tools/verify-marketing-live.cjs` adds explicit `--prepare-output-contract` mode, restricted to the approved predecessor snapshot. It creates fresh ownership-free receipt/profile state and copies the same fixture context bytes. The reviewed launcher must record new process ownership.
- Task instructions separate product facts from skill examples and ask for the approved explicit layout. A now explicitly requests one hero; this is not an identical-prompt comparison with 5.0.3. B requests exactly two numbered explanations. No expected hero, hardcoded CTA answer or Amazon-specific blacklist is supplied to the model.
- Exact-parent/session completion detection stays unchanged. Extra contract checks retain legacy failures and keep factuality separate. No retry loop or answer/marker fabrication.
- Focused diagnostic/recorder tests: **27/27 PASS**, zero skips. Covers missing/empty/duplicate/reordered/extra sections, wrong CTA field, absent/embedded/duplicate markers, incorrect explanation count, unrelated responses and missing reads.
- Node syntax and whitespace checks: PASS. Product source/build inputs: **605 unchanged** against the 0.5.1 source manifest (excluding two QA tools). Packaged skill hashes: **291 verified**, collection has 50 skills. Source provenance check also passed.
- Tested package ASAR unchanged: `d6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71`. No app rebuild, dependency update or model download.

Command: `node --test test/marketing-live-diagnostic.test.cjs test/marketing-wire-recorder.test.cjs`.

Fresh receipt directory: `output/playwright/marketing-live-1791242189948`. Preparation confirmed QA ports free. The user started Ollama 0.35.1 as PID 32532, start `2026-10-05T23:34:02.0142804Z`. Preflight passed. The prior startup policy rejection was respected; the agent did not launch Ollama through another tool or route.

## One-session live result — FAIL

Exactly one fresh session ran: `ses_ef1938843ffe2SsOPq9e45Hx67`. Start/end `2026-10-05T23:34:27.271Z` / `2026-10-05T23:38:01.835Z` (06:34–06:38 on October 6, Bangkok). No second session, prompt retry, sampling change or reviewer-supplied answer followed.

| Check | A | B |
| --- | --- | --- |
| Completed final text | PASS — 994 characters, wire sequence 8 | PASS — 1441 characters, wire sequence 10 |
| Actual selected skill read | PASS — copywriting | PASS — copy-editing |
| Actual context read under this task's parent | PASS | FAIL — no re-read; earlier context remains in history |
| Exact CTA | PASS | PASS after offline Markdown-label correction |
| Requested completion marker | FAIL | FAIL |
| Explicit output layout | FAIL — extra title/fenced presentation | PASS after offline Markdown-label correction |
| Two numbered edit explanations | Not requested | PASS — count only |
| Grounded product claims / accurate explanation | FAIL | FAIL |

A avoids the prior Amazon example and returns one hero, but adds “Manage every project from one view,” which the task-organizer fixture does not establish. B retains unsupported project tracking / one-view claims. Its rationale calls an imperative headline passive and says it was tightened to five words; the cited revised first sentence has four words. The original already mentions a view, so the explanation of adding that concept is also not established. Both omit their exact markers. No prices, testimonials or numerical product-performance claims were invented, but that alone is insufficient for factuality PASS.

The absence of the copied Amazon example and presence of two B items are observations from one stochastic run, not proof that the revised instructions reliably caused improvement. They do not justify adopting this instruction contract as a verified product default.

The two task user parents are `msg_10e6d993e001URezvCHxpVTpIh` and `msg_10e6e15f5001O8ANWeEDPGf0hl`; final assistant IDs are `msg_10e6db2cb001h94Yeu305oTW17` and `msg_10e6e2836001BGBuusm7b2DQTA`. SQLite contains only bootstrap, A and B user turns. Bootstrap performs two permitted local reads and a glob; A reads context + copywriting; B reads copy-editing only. None of the bootstrap reads is credited to A/B.

All 10 requests used the pass-through recorder and product-generated `reasoning_effort: none`; zero reasoning characters and no parse errors. Effective context 32768, highest prompt usage 20253 tokens, no recorded truncation. App/recorder closed; ASAR unchanged; default Ollama endpoint remained 0.35.1. QA server cleanup awaits the user running the reviewed stop command and live verification.

## Offline assessor correction

The original receipt incorrectly rejects B's inline bold labels such as `**CTA:** View the demo`. [RCA](../.brain/rca/marketing-output-bold-label-parser.md) identifies the normalization lookahead defect. Within the approved QA scope, the normalizer was corrected for recognized labels, with positive and negative regressions. Final focused tests: **29/29 PASS**.

`offline-reassessment.json` evaluates the same saved events without calling the model. B's layout/content/CTA checks become true; B's missing context read and both missing markers remain false, and overall result remains FAIL. Manual factuality review is separate. Original `live-result.json`, `executed-runner.cjs`, original runner hash and raw screenshots are retained unchanged. `offline-assessor.cjs` records the corrected assessor with its own hash. This does not alter the experiment's model instructions or rerun the task.

All five original 1440×960 screenshots were visually inspected. They show the actual packaged app and terminal tails; full outputs are preserved separately. Source/application files and pinned skills remain unchanged. Evidence version advances **5.0.3 → 5.0.4**, while application stays **0.5.1**. Full marketing acceptance remains **FAIL**.

## Delivery

[Screenshot gallery](../output/playwright/marketing-live-snapshot-5.0.4/index.html) · [Snapshot ZIP](../output/playwright/Zuri-0.5.1-snapshot-5.0.4.zip) · [Delivery receipt](../output/output-contract-delivery-5.0.4.json).

The archive contains **28** explicitly selected evidence files, **2,606,701 bytes**, SHA-256 **`7754ce6eadc70d62d1e5c2481b05726a0f928664e3d20df4e3ed1c2d836834ef`**. File hashes, local HTML links, ZIP contents and CRC passed. The gallery rendered in the installed Edge with no horizontal overflow. Snapshot 5.0.3's ZIP hash remains unchanged. The new archive freezes pending user-stop cleanup; any later verified stop belongs in a separate addendum, not a rewritten archive.
