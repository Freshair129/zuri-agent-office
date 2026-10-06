---
status: active
superseded_by: null
version: 0.1.0
---

# QA stop ownership rejection

Date: 2026-10-06 (Asia/Bangkok). Read-only investigation. No launcher code or ownership requirement changed.

## Symptom

The user and agent both receive `PID ownership mismatch; no process was stopped.` from `tools/start-marketing-live-qa.ps1:19`. QA cleanup remains pending after snapshot 5.0.3.

## Evidence

Current receipt: `output/marketing-live-current.json`; expected PID 37416, executable `C:\Users\freshair\AppData\Local\Programs\Ollama\ollama.exe`, start `2026-10-05T17:57:24.5769539Z`. The live listener at 127.0.0.1:11438 belongs to PID 37416. `Get-Process` returns exactly that UTC start time.

Read-only inspection from the tool session:

| Host | Parsed receipt time type | Existing string comparison | Executable path |
| --- | --- | --- | --- |
| PowerShell 7.6.5, 64-bit | System.DateTime | false | unavailable |
| Windows PowerShell 5.1.19041.7725 | System.String | true | unavailable |

`Win32_Process.ExecutablePath` is also null. These observations describe the tool session; the user's pasted error alone does not identify which condition failed in their shell.

## Root Cause

1. The stop branch requires both exact executable path and start-time equality. In the inspected session executable identity cannot be read, so rejecting the stop is correct. Its generic error conflates unavailable identity with a confirmed different process. The underlying reason Windows hides the executable path is not established; elevation is a diagnostic next step, not a proven explanation.
2. PowerShell 7 parses the receipt ISO timestamp as DateTime. The launcher compares a round-trip string on the left with that object on the right, causing a false mismatch despite equal instants. Windows PowerShell 5.1 retains a string and passes that comparison. This is a separate shell compatibility defect.

PID/listener/start agreement does not replace executable identity. No direct PID kill, alternate stop mechanism or ownership-guard bypass was attempted.

## Why the issue escaped detection

Earlier stop validation did not cover both PowerShell JSON timestamp types or inability to inspect the process executable. One combined error concealed the distinction. The prior recommendation to rerun from the original user shell did not establish its ability to read executable identity.

## Proposed prevention

A separately approved launcher change should compare parsed UTC instants without precision loss and distinguish missing executable identity, executable mismatch and start-time mismatch. Keep fail-closed behavior and verify identity immediately before stopping. Cover PowerShell 5.1/7 timestamps, missing identity, reused PID, and true mismatches with fixtures before any live stop verification. This is C-2 / MEDIUM because it touches the ownership guard; implementation is not authorized by the thinking-option approval.

## Immediate guarded recovery

Use Windows PowerShell 5.1 opened with Run as administrator, then invoke the same reviewed `-Stop` script. This avoids the observed PowerShell 7 timestamp conversion and may allow reading executable identity. The existing guard still decides whether stopping is permitted. If it rejects again, preserve the process and inspect the three identity fields from that elevated shell. Do not remove the guard or stop all Ollama processes.
