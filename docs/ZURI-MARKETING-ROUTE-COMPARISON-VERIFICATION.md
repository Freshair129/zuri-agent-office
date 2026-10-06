---
status: active
superseded_by: null
version: 0.1.0
---

# Route comparison preparation verification

Date: 2026-10-06 (Asia/Bangkok). Approved [comparison plan v0.1.0](ZURI-MARKETING-ROUTE-COMPARISON.md). C-2 / MEDIUM, QA-only.

## Version diff and scope

- Application: 0.5.1 → 0.5.1; no rebuild or product edits.
- Evidence: completed 5.0.4 → planned 5.0.5. No live comparison result yet.
- Plan: v0.1.0 draft → active following explicit user approval.
- New comparison runner, focused fixtures and narrow comparison-only adapters in the existing runner. Existing modes retain their prompt bytes and assessment.

## Verified preparation

`node --test test/marketing-comparison.test.cjs test/marketing-live-diagnostic.test.cjs test/marketing-wire-recorder.test.cjs`: **36/36 PASS**, zero skips. Includes inert native PTY launch/disposal, isolated environments, restrictive common permissions, exclusive attempt claims, bounded waits and exact-session failure preservation. Full suite process exit verified after the [PTY cleanup RCA](../.brain/rca/marketing-comparison-pty-cleanup.md).

Syntax checks and `git -c core.whitespace=cr-at-eol diff --check`: PASS. Existing provenance verifier: **50 skills / 291 file hashes PASS**. Product inputs: **605 unchanged** against the tested 0.5.1 manifest, excluding QA tools. ASAR unchanged: `d6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71`.

Prepared directory: `output/playwright/marketing-comparison-1791244524124`. Receipt records 43 controlled input hashes, pinned CLI 1.18.34 hash, identical A/B prompt files, context copied from 5.0.4, selected eight skill resources and license. Both arms share one project permission file. Separate profiles and data directories; Zuri harness creation is deferred until plain ends. Historical archives remain untouched.

## Initial runtime status (before user startup)

At preparation verification ports 11438 and 11439 were closed and the fresh receipt contained no server PID. **Zero model sessions have been dispatched.** Live read permissions, TUI readiness, provider parity, task outputs, visual/content review and route conclusions remain NOT_RUN. Fixture PASS does not establish those runtime outcomes.

User startup required in Windows PowerShell 5.1 with adequate process visibility:

```powershell
& 'O:\testzuri\zuri-agent-office\tools\start-marketing-live-qa.ps1'
```

After user startup, execute from the repository: `node tools/verify-marketing-comparison.cjs`. The launcher's historical `verify-marketing-live.cjs` hint does not apply to this receipt; that runner now refuses direct comparison execution. The orchestrator claims each attempt once, dispatches plain then Zuri, and never starts the model server. A failed attempt is not retried.

## Live result: both routes FAIL; complete comparison INCONCLUSIVE

User started Ollama 0.35.1 PID 2716. Exactly two fresh sessions were created, with no task retries. Plain ran 2026-10-05T23:57:38Z–23:59:18Z; Zuri ran 2026-10-06T00:00:27Z–00:03:00Z (06:57–07:03 Bangkok). Plain has two user task turns and no bootstrap; Zuri has one bootstrap and Task A.

| Route / task | Final output | Required reads under task parent | Contract / content finding |
| --- | --- | --- | --- |
| Plain A | 765 characters, complete hero | Context + copywriting PASS | Layout/CTA PASS; marker absent |
| Plain B | 978 characters, complete revision | Neither context nor copy-editing read | Layout/CTA/two explanations PASS; marker absent; first explanation falsely says it removed `your` from A's subheading |
| Zuri A | 374 characters, introductory facts only | Copywriting PASS; context read only in bootstrap, not A | No usable hero, missing layout and marker |
| Zuri B | NOT_RUN | NOT_RUN | Correctly skipped because A was unusable |

Plain session: `ses_ef17f6a57ffeus7KeTOAEEUGlj`. Zuri session: `ses_ef17bbebcffei35jYQtNQ4Z05N`. Prompt A SHA-256 is identical in both actual user messages: `92c29feb8617280592e0e9ba057de3eb7f9c95b9d311bddc286dc5200c7430e7`. B was prepared identically but dispatched only in plain; its hash is `b444f20adc816605d9898abb38ce6426b4c31c219a621abf19cbd8683557fc27`.

All 10 wire requests (plain 4, Zuri 6, including background/bootstrap) used local qwen3.5:4b, explicit none, pass-through forwarding, HTTP 200, zero parser errors and zero reasoning characters. Context 32768 verified in both arms; maximum prompt tokens 8352 / 10309. No server truncation. The model digest and CLI hash match controls. Actual skills and context paths are the common QA copies. No unexpected Hive reads were observed in plain.

The CLI added schema metadata to its own config after plain. The integrity guard stopped before Zuri. The [RCA](../.brain/rca/marketing-comparison-config-metadata.md) records old/new hashes. A bounded correction accepts only that metadata addition with all semantic fields unchanged, preserving the original bytes and recording migration. **37/37 tests PASS** after correction. Explicit continuation ran only the never-attempted Zuri arm. Both executed runner revisions are retained.

Four actual Zuri screenshots were inspected. Images 01/02 show thinking override and eight selected skills. **Visual review PARTIAL:** images 03/04 show General/Prerequisites settings overlays, not terminal answers. Their original filenames refer to capture phases; they are not proof of terminal rendering. Cause of UI navigation is unverified. The exact-session exported answers are separate evidence and no third session was created to replace screenshots.

Narrow conclusion: instruction failures are reproduced outside Zuri in this sample. This does not identify a model-internal cause or clear Zuri integration. Bootstrap/history/plugin effects, fixed ordering and stochastic generation remain confounders. Zuri's unusable A and skipped B leave the full paired task comparison incomplete; retain **INCONCLUSIVE**, not a production PASS.

App 0.5.1 unchanged; evidence snapshot 5.0.4 → 5.0.5. Prior archive hash verified unchanged. No release, commit or push. Both owned app/PTY and recorders closed. User stop of QA server requested; final cleanup is recorded separately in the snapshot's cleanup receipt.
