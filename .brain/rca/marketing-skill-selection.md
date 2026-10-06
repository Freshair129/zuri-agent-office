---
status: active
superseded_by: null
version: 0.1.0
---

# Hire skill selection did not reach startup

## Symptom

The existing Hire UI could display requested skill chips but could not selectively provision marketing skills for a role.

## Evidence

At baseline `3f64ab64dd15cfc703090736fcdfa6c8001303c1`, `AddAgentModal.tsx` displayed `hireMeta.skills`, while its `spawnPty.hive` payload and persisted Agent omitted skills. `HiveManager.ensureAgent` called `copyBundledSkills` for the whole core resources tree. The hire validator accepted three built-in IDs only.

## Root Cause

Selection existed in the import contract and display only. There was no durable selection field connecting import, spawn, provisioning and restart. The whole-core-bundle copier could not implement role-specific marketing selection.

## Why the issue escaped detection

Existing hire tests covered input allowlists and gallery parity; skill tests covered discovery/install. Neither exercised distinct role selections through Hive provisioning and a new manager instance on restart.

## Proposed prevention

Connect the approved selection contract end to end. Test distinct role file sets, foundation/count validation, preserved local edits, missing resources and provider bootstrap/context persistence across restart. Confirm the same contract from the packaged app; distinguish file provisioning from actual model use.

## Project reassignment regression found before delivery

Symptom: reassigning the same agent from project A to B retained A's brand context. Evidence: `marketing-context-reassignment-before.log` records the real Hive bootstrap returning `brand-a/.agents/product-marketing.md` when `brand-b` was supplied. Root cause: both initial main-process selection and Hive metadata merging unconditionally preferred the previous project association. The initial tests covered resume within one project, not a cross-project reassignment.

Correction: main preserves the source only when the requested cwd matches the previous running cwd or source cwd; an explicit new project supersedes the previous association in Hive. Prevention: retain both worktree-resume and real Hive project-reassignment regression cases.
