---
status: active
superseded_by: null
version: 0.1.1
---

# Live marketing harness selects a hidden roster control

## Symptom

The first live attempt on 2026-10-05 opened packaged Zuri 0.5.0 but timed out before agent creation. No model tasks ran. Result and screenshot: `output/playwright/marketing-live-1791208256758/live-result.json` and `01-failure.png`.

## Evidence

The runner waited for the exact accessible name `add agent`. The screenshot shows the visible office-header button `Add agent`, with the roster collapsed. `src/renderer/src/App.tsx` renders the header from `officeShell.addAgent`. The previously successful `tools/verify-marketing-skills.cjs` opens the roster before selecting its lowercase `add agent` control; the new live runner omitted that prerequisite.

## Root Cause

The QA runner reused a roster-only selector without opening the roster. Its exact lowercase name does not match the visible header control. This is a harness defect before model execution, not evidence of an application or model failure.

## Why the issue escaped detection

Syntax checks and synthetic database extraction checks do not exercise initial UI state. The earlier packaged fixture followed a different navigation sequence.

## Proposed prevention

Use the visible office-header `Add agent` control, scoped to the main region. This is a minor selector correction under the approved [live validation](../../docs/ZURI-MARKETING-LIVE-VALIDATION.md), not a change to application behavior or acceptance criteria. Preserve attempt 1 and use a fresh profile for the rerun. Associate the existing manually started server's original log directory with the fresh run so truncation checks still inspect the actual server log.

## Separate cleanup finding

The caller can read PID 24052's name and start time but both Get-Process.Path and Win32_Process.ExecutablePath return null. The launch receipt records its expected executable. The ownership guard therefore correctly refuses to stop it; no guard is weakened. A privilege difference is possible but unconfirmed. Cleanup may require the user's original PowerShell. A PowerShell 7 diagnostic also parsed the ISO receipt time into DateTime; formatting it back as UTC matches the actual process start. That display conversion is not the cause of the launcher's Windows PowerShell cleanup failure.

## Verification

Attempt 2 (`output/playwright/marketing-live-1791216588586`) passed navigation and provisioned all eight Content & Brand skills. It then failed with `database is locked` while the fresh OpenCode database initialized; no model task completed. Application version remains 0.5.0; snapshot 5.0.1 must label each attempt accurately.

## Follow-up: evidence reader aborts on startup database lock

Symptom/evidence: attempt 2's report records `database is locked` after successful agent provisioning. The screenshot shows the CLI starting. After closure, read-only inspection finds the migrated WAL-mode schema and zero sessions. The runner's `waitFor()` calls `sessionEvents()` immediately when the file exists; that function opens/queries it without treating SQLite BUSY/LOCKED as a pending state. Its exception escapes the bounded wait and closes the app.

Root cause: the QA evidence reader assumes file existence means the database is ready and immediately readable. A transient startup lock therefore aborts validation before readiness can be established. The exact writer statement holding the lock was not captured and is not claimed.

Escaped detection: the original extraction checks used an already-initialized, uncontended database.

Prevention within the approved validation runner: report pending for an initializing schema or SQLite BUSY/LOCKED, allowing the existing 300-second wait to retry. Propagate other database errors. Verify with a real exclusive-lock fixture, schema-not-ready fixture and corrupt database; preserve both failed attempts. This changes QA waiting only, not application code, model permissions or pass criteria.

Four controlled reader checks passed (`reader-checks.json` in attempt 2): an actual exclusive lock returns pending; release makes the database readable; an uninitialized schema returns pending; corruption propagates as an error. Attempt 3 passed initialization and reached real local-model calls. Its separate read-permission failure is documented in [the permission RCA](marketing-live-read-permissions.md).
