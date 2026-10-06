---
status: active
superseded_by: null
version: 0.2.1
---

# Marketing live acceptance — measured result

Date: 2026-10-05. Application **0.5.0**, evidence snapshot **5.0.1**. Live acceptance: **FAIL**. The final attempt completed the required Task A file reads but produced no final marketing answer. Task B and content-quality acceptance remain **NOT_RUN**. This is a measured failure report, not a completed marketing-workflow certification.

Cleanup closed on **2026-10-06, 00:19 Asia/Bangkok**, with a separate post-snapshot verification. The original snapshot archive is preserved unchanged.

Approved authority: [live validation plan](ZURI-MARKETING-LIVE-VALIDATION.md). Only QA harness/configuration and evidence documentation changed during this run. Product source and packaged application were not changed.

## Current results

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Manual QA server startup | PASS | User launched Ollama 0.35.1 on 127.0.0.1:11438; PID 24052, recorded start 16:04:30.8668294Z |
| Packaged app identity | PASS | Zuri 0.5.0; unchanged ASAR SHA-256 `582418d68c0799bdd92b2af716876e8d0c0a987d280694320f904e489100a706` |
| Role and provisioning | PASS | Content & Brand, eight selected skills, all provisioned |
| Local runtime | PASS for this run | OpenCode 1.18.34; actual message metadata local/qwen3.5:4b |
| Context | PASS | Measured 32768 tokens; final request 10029 prompt tokens; no observed truncation |
| Task A required reads | PASS | Completed reads of actual product context and provisioned copywriting/SKILL.md |
| Task A final answer | FAIL | No assistant text part after Task A; CLI completed a stop step; 300-second final-output wait expired |
| Task B / copy-editing | NOT_RUN | No completed Task A draft to revise |
| Content-quality acceptance | NOT_RUN | No draft to review; no assistant-authored replacement was substituted |
| Screenshot evidence review | PASS: capture inspection only | Six original screenshots inspected; includes failed attempts and final run. This does not imply task success |
| QA app and CLI cleanup | PASS | All attempts report app closed; no opencode.exe remains at final process inspection |
| QA server cleanup | PASS | User ran the reviewed -Stop command; independent check confirms PID 24052 absent and no listener on 11438 |
| Original Ollama endpoint | PASS: availability | Port 11434 still answers version 0.35.1 |

## Attempt history and fixes

| Attempt | Evidence directory under output/playwright | Result and handling |
| --- | --- | --- |
| 1 | marketing-live-1791208256758 | FAIL before model work: selector searched lowercase roster control while roster was collapsed. Corrected to visible Add agent header control |
| 2 | marketing-live-1791216588586 | FAIL during CLI startup: evidence reader threw on database lock. Added pending states for initialization and SQLite BUSY/LOCKED, retaining the bounded wait |
| 3 | marketing-live-1791216767011 | FAIL: real read calls denied because QA read allowlist used absolute paths; this CLI checks read against paths relative to worktree |
| 4 | marketing-live-1791217249845 | FAIL after corrected reads: Task A ends without final text. No model/adapter/product fix claimed |

Every rerun used a fresh profile. Earlier profiles, executed runner copies, screenshots and result files were preserved. The same manually started QA server was retained; its log remained in attempt 1 and the later run receipts explicitly reference that location.

The QA read correction allows only `.agents/product-marketing.md` and `../harness/**` relative to the fixture project. The absolute external_directory restriction still bounds access to the current run; shell, edits, web and subagents remain denied. See [OpenCode 1.18.34 read implementation](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/tool/read.ts#L235) and [permission RCA](../.brain/rca/marketing-live-read-permissions.md).

Fresh harness checks: **4 PASS** for lock/initialization/corruption handling and **7 PASS** for allowed and denied path matching against the pinned OpenCode matcher. Runner syntax passed. The earlier six synthetic extraction checks belong to preparation; the previous full application suite **990 PASS / 0 FAIL / 20 SKIPPED** belongs to 0.5.0 delivery and was not rerun for these QA-only changes.

## Evidence and diagnosis

- [Snapshot gallery — six screenshots](../output/playwright/marketing-live-snapshot-5.0.1/index.html)
- [Portable evidence ZIP](../output/playwright/Zuri-0.5.0-snapshot-5.0.1.zip) and [archive size/hash receipt](../output/marketing-live-delivery-receipt.json)
- [Review and identity metadata](../output/playwright/marketing-live-snapshot-5.0.1/review.json)
- [Task A completed reads and message-part evidence](../output/playwright/marketing-live-snapshot-5.0.1/task-A-observed.json)
- [Final raw harness result](../output/playwright/marketing-live-1791217249845/live-result.json)
- [Harness selector/database RCA](../.brain/rca/marketing-live-harness-selector.md)
- [QA read-permission RCA](../.brain/rca/marketing-live-read-permissions.md)
- [Missing final-answer RCA — PARTIAL / OPEN](../.brain/rca/marketing-live-empty-final.md)
- [Earlier Codex startup policy RCA](../.brain/rca/marketing-live-policy-block.md)
- [Post-snapshot cleanup closure](../output/playwright/marketing-live-1791217249845/cleanup-closure.json)

The final Task A message contains step-start, reasoning and step-finish parts but no text part. Its 13 generated tokens and terminal stop do not satisfy the requested hero output. Without a captured response at the local HTTP boundary, evidence does not distinguish model behavior from response mapping or instruction interaction. No blind fix was made. A proposed next diagnosis is to correlate content/reasoning lengths, finish reason and tool-call metadata at that boundary with the CLI's stored message parts.

## Completed cleanup

The user ran the following command from the original PowerShell and reported `Owned QA server stopped.`:

```powershell
& 'O:\testzuri\zuri-agent-office\tools\start-marketing-live-qa.ps1' -Stop
```

Independent verification at 2026-10-06 00:19:37 Asia/Bangkok confirms no listener on port 11438 and no process with the recorded PID 24052. The original endpoint at 11434 still returns Ollama 0.35.1, and the packaged ASAR hash is unchanged. The ownership guard was not weakened. The exact reason that the agent caller could not read the executable path remains unconfirmed.

The delivered snapshot and ZIP retain their historical `PENDING_USER_STOP` state and original hash. The linked cleanup closure is an append-only evidence addendum; it does not rewrite the failed live test or promote model acceptance to PASS.

## Version diff

- Application **0.5.0 → 0.5.0**; same packaged ASAR. No commit, release or installer execution.
- Evidence **5.0.0 → 5.0.1**; earlier fixture evidence retained; new live result explicitly FAIL.
- Verification report **0.1.1 → 0.2.0**; approved validation plan **0.1.1 → 0.1.2**, scope unchanged.
- Narrow QA changes: visible selector, bounded database-read readiness, relative read allowlist, and original server-log location for fresh profiles.
- Live acceptance **NOT_RUN → FAIL**; Task A reads PASS, final answer FAIL, Task B NOT_RUN. The missing-final cause and original startup policy reason remain open.
- Cleanup closeout: report **0.2.0 → 0.2.1**, cleanup **PENDING_USER_STOP → PASS**. Application **0.5.0** and snapshot **5.0.1** unchanged; original ZIP SHA-256 `15e2b9998e3f6f3e920c00c3a046260f96f7e1d48dca3ea1836dc3f0e681c820` preserved.
