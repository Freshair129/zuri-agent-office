---
status: active
superseded_by: null
version: 0.1.0
---

# Local thinking compatibility verification

Date: 2026-10-06 (Asia/Bangkok). Implements the user-approved [v0.1.0 contract](ZURI-LOCAL-THINKING-COMPATIBILITY.md), C-2 / MEDIUM. Application 0.5.0 → 0.5.1; evidence snapshot 5.0.2 → 5.0.3. Local development package, not a release or production acceptance.

## Change

Settings → Agents & Models → OpenCode now has **Disable thinking for this model**. It defaults to the server setting. The optional non-secret `localThinkingOverride` stores a normalized endpoint, model and `reasoningEffort: 'none'`. Matching checks run again at agent spawn and connection probe. Other targets, malformed overrides, permissions and encrypted-key handling retain their prior behavior. Clearing the checkbox removes the persisted override. Existing agents require restart.

The marketing runner now finds the completed assistant message under the exact task's user parent and session. It records output, terminal state, context/skill reads, sections, exact CTA and marker independently. Factuality remains a separate human/model review field; structural checks alone cannot establish it. A usable A can proceed to B once without hiding A's failures. Unrelated inbox messages cannot satisfy either task.

## Verification

| Check | Result |
| --- | --- |
| Local provider, config persistence, completion classification, wire recorder and provider routing/automation regressions | PASS — 62/62, no skips |
| Main and renderer typecheck | PASS |
| Production build | PASS |
| Packaged UI persistence, clear and target mismatch behavior | PASS — default off, save, remount, clear, endpoint/model mismatch |
| Product-generated `reasoning_effort: none` through pass-through recorder | PASS — all 6 requests; baseline mode, no injection; 0 reasoning characters |
| One fresh local marketing A/B session | FAIL — both return complete text and perform both required reads, but omit the marker; A adds unsupported content; B gives 3 edit explanations instead of 2 |
| Screenshot review | PASS — 5 original 1440×960 captures reviewed; full answer text is separate from terminal-tail screenshots |
| Artifact/process closure | App and recorder closed, ASAR unchanged; QA Ollama requires user stop because executable ownership cannot be verified from the tool session |

Test command: `node --test test/local-provider.test.cjs test/config-write-notify.test.cjs test/marketing-live-diagnostic.test.cjs test/marketing-wire-recorder.test.cjs test/provider-config.test.cjs test/provider-automation.test.cjs`.

The corrected classifier was also replayed read-only against snapshot 5.0.2: its substantive A output is present, the absent marker remains FAIL, and factuality stays NOT_RUN until reviewed. Prior archives remain unchanged.

## Fresh packaged evidence

Raw run: `output/playwright/marketing-live-1791240676184`; app 0.5.1, snapshot 5.0.3. Start/end: `2026-10-05T22:51:24.863Z` / `2026-10-05T22:53:46.527Z` (05:51–05:53 on October 6 in Bangkok). Exactly one session: `ses_ef1bb5c6cffeD94l59cSEpJxXx`.

| Task | Exact parent → terminal assistant | Wire | Reads / content | Remaining failures |
| --- | --- | --- | --- | --- |
| A | `msg_10e453341001BH4OmAskYi25op` → `msg_10e4545ce001b2z9wy9XH2oZas` | sequence 4, stop, 2401 text characters | Actual context + copywriting; required headings and exact CTA | Missing marker; irrelevant Amazon returns example; unsupported claims about avoiding app switching |
| B | `msg_10e459020001U0Zjq8nBiigRKI` → `msg_10e45a4f9001FnQ8lva2zGXYel` | sequence 6, stop, 1934 text characters | Actual context re-read + copy-editing; complete revised hero, sources, unknowns and exact CTA | Missing marker; 3 numbered edit explanations instead of the requested 2 |

The model's core B facts align with the fixture, but this does not establish editorial quality or validate its claimed editing rationale. A's factuality fails. Both task results remain FAIL. Automated `factuality: NOT_RUN` in the raw receipt is intentionally unchanged; `review.json` separately records content review. The reason the model copied irrelevant material or omitted markers is not established. No prompt/model tuning or second fresh session followed this failure.

All four executed tool calls are successful reads of the requested context/skills under the relevant task parent. SQLite contains only bootstrap, A and B user turns. A later queued inbox notification is visible in the B screenshot but is not counted as a task response. Effective context is 32768; highest prompt usage is 17422 tokens; no truncation is recorded. Default Ollama endpoint remains 0.35.1 before/after.

Tested ASAR SHA-256: `d6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71`. Source manifest covers 607 source/build/resource inputs, hash `fffb58d6e73db99ce3191589d613aead0b368c87944d36ab0c04416277824143`, on base `3f64ab64dd15cfc703090736fcdfa6c8001303c1` with preserved uncommitted changes.

The compatibility option is verified for this exact local stack. **Full marketing acceptance remains FAIL**. This run proves a substantive final answer can travel from the model through OpenCode and the packaged UI when the explicit option is enabled; it does not prove general agent reliability.

## Packaging and scope limits

Build output is separate at `dist/marketing-0.5.1/win-unpacked`. Uses the documented local Windows overrides `npmRebuild=false` and `win.signAndEditExecutable=false` from [0.5.0 verification](ZURI-MARKETING-SKILLS-VERIFICATION.md), retaining the previously verified native dependencies. Default native rebuild/signing is not claimed. No dependency upgrade, model download, cloud fallback, prompt tuning, commit, push or deployment.

The fresh app profile reuses the user-started QA Ollama process on 11438. PID 37416 and start time `2026-10-05T17:57:24.5769539Z` were rechecked before preparing the run; no model-server launch was attempted through tools. Historical startup policy rejection remains respected. The original server logs are retained under the initial receipt.

## Delivery

[Screenshot gallery](../output/playwright/marketing-live-snapshot-5.0.3/index.html) · [Snapshot ZIP](../output/playwright/Zuri-0.5.1-snapshot-5.0.3.zip) · [Delivery receipt](../output/thinking-delivery-5.0.3.json) · [Source version diff](../output/playwright/marketing-live-snapshot-5.0.3/version-diff.json).

The archive contains 26 explicitly selected evidence files, including five original PNGs. Size **2,619,740 bytes**; SHA-256 **`def2da74b9b89c0aa053782f0ee018a0cb595a6228bd7580d9e8b3424610f7ae`**. Manifest hashes, archive contents/CRC and local HTML links passed. The gallery rendered in the installed Edge without horizontal overflow; bundled Playwright Chromium was unavailable and was not installed. App screenshots were captured by the actual packaged Electron app and all five were visually inspected.

The archive freezes the current pending QA-server cleanup. A later user stop should be recorded as a separate addendum rather than rewriting this ZIP. No installer/portable release was produced for 0.5.1; the tested local executable is `dist/marketing-0.5.1/win-unpacked/Zuri.exe`.
