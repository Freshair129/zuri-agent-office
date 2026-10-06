---
status: active
superseded_by: null
version: 0.1.0
---

# QA read allowlist uses the wrong path basis

## Symptom

Live attempt 3 creates a real local-model session, but read calls for its memory, product context and copywriting skill are denied. Task A has no complete final answer at inspection. This runtime denial is separate from Codex's earlier pre-execution startup rejection.

## Evidence

The QA-only OpenCode database under `output/playwright/marketing-live-1791216767011/cli/data/opencode` records actual `read` errors. Their effective rules include `read: * -> deny` followed by an absolute allow pattern `O:/testzuri/zuri-agent-office/output/playwright/marketing-live-1791216767011/**`. The requested files exist inside that run. Provider/model are local/qwen3.5:4b and the server's measured context is 32768.

Pinned OpenCode 1.18.34 source: [read.ts](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/tool/read.ts#L235) submits `path.relative(instance.worktree, filepath)` for the read permission. [Permission.evaluate](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/permission/index.ts#L25) selects the last matching rule. [external-directory.ts](https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/tool/external-directory.ts#L23) separately checks an absolute directory glob. Thus the two permission names use different path bases.

## Root Cause

The QA harness incorrectly uses one absolute pattern for both read and external_directory. The read request for the context becomes `.agents/product-marketing.md`, and provisioned instructions become `../harness/...`; neither matches the absolute allow pattern. The fallback deny applies. This is an authored QA configuration defect, not a missing user approval or evidence that the marketing files are absent.

## Why the issue escaped detection

The initial harness checked syntax and database extraction, but did not verify real path matching against this CLI version. Successful skill provisioning is independent of model permission to read it.

## Proposed prevention and bounded correction

Under the already approved validation's bounded-read scope, replace only the QA read patterns with `.agents/product-marketing.md` and `../harness/**`. Retain the global read deny, existing absolute external_directory bound and deny for edits, shell, web and subagents. No application or global security configuration changes. Test the real denied inputs against the pinned matcher and verify unrelated source paths and sibling-run paths remain denied, then use a fresh QA profile and preserve attempt 3.

Completion requires actual completed reads and final Tasks A/B, not just a matcher test. The original Codex startup policy rule remains unknown; this RCA does not explain that earlier block.

## Bounded verification

Seven checks against the pinned `packages/core/src/util/wildcard.ts` pass: context, skill and Windows-style memory paths match the corrected allowlist; application source, a sibling QA run, an unrelated absolute path and an unapproved project file remain denied. The original rule rejects all three intended read inputs. Evidence: `permission-checks.json`, `opencode-wildcard-source.json` and `read-denial-evidence.json` in attempt 3. These are permission-matching checks, not live acceptance.
