---
status: active
superseded_by: null
version: 0.1.0
---

# CLI schema metadata stopped the comparison between arms

## Symptom
Plain completed A/B and closed its PTY/recorder, but the pre-Zuri integrity check stopped the orchestrator. Zuri has no attempt claim or session.

## Evidence
Run `marketing-comparison-1791244524124`: plain config hash changed from `680160d8edf91b52fa16b65e8387f191d6f5231860603eb5290056ecaf965fe7` to `16837a408136526745c0fb4d5bc5ccdcd30f655075c37e4aae77611a036e90d5`. Comparing parsed JSON with the retained original `provider-control.json` shows only an added `$schema: https://opencode.ai/config.json`. Provider, endpoint, model, small model, autoupdate and reasoning options are unchanged. Plain result records PTY/recorder closed; no `zuri.attempt` exists.

## Root Cause
The QA integrity guard treated a runtime-maintained CLI config as an immutable byte-for-byte input, although this CLI adds schema metadata on loading it. This is a harness compatibility defect, not a model outcome or a changed provider control.

## Why the issue escaped detection
Fixture tests verified generated options and isolated paths, but did not exercise this installed CLI's config migration. The inert PTY fixture intentionally does not start OpenCode or a model.

## Proposed prevention and correction within approved QA scope
Preserve the original hash and record the observed one. Permit only this exact `$schema` addition after parsing, requiring every remaining field to equal the original and verifying the retained original's hash. Reject all other changes. Add mutation-negative fixtures. Allow an explicit continuation only when plain is complete/closed and Zuri has never been claimed; never repeat plain, a task or a claimed Zuri attempt. Record separate executed runner revisions. This consumes only the still-unused Zuri arm of the original two-session allowance.
