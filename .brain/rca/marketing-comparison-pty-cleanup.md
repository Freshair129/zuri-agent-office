---
status: active
superseded_by: null
version: 0.1.0
---

# Comparison fixture PTY lifecycle

## Symptom
The inert native PTY test printed its success and received process exit, but the Node test runner remained alive beyond 15 seconds. No model was called.

## Evidence
The initial `marketing-comparison.test.cjs` run reported seven successful assertions including the PTY fixture in 2755 ms, but exec session 73044 remained running. Installed `node-pty/lib/windowsTerminal.js` handles socket exit through `_close`; `windowsPtyAgent.js` releases the console connection worker in its explicit `kill` lifecycle. The initial QA cleanup skipped `kill` after observing exit.

## Root Cause
The QA fixture conflated child-process exit with disposal of the owning PTY resources. Its cleanup branch skipped explicit terminal disposal on normal exit.

## Why the issue escaped detection
The initial assertion verified output and child exit, not completion of the enclosing test process.

## Proposed prevention
Always dispose the QA-owned terminal through its public kill method after recording exit. Verify the complete test runner terminates. Do not modify node-pty or the application, and do not kill unrelated processes.
