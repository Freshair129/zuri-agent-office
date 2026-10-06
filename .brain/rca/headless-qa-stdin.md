---
status: active
superseded_by: null
---

# Headless QA runner stalls after OpenCode initialization

## Symptom

The disposable `node_modules/.zuri-provider-qa/run-live.cjs` verification runner started OpenCode 1.18.34 but produced no task events. Redirecting TEMP/TMP and package caches to O: did not remove the stall.

## Evidence

The QA runner used `spawn()` with its default piped stdin and never closed the pipe. OpenCode v1.18.34 `packages/opencode/src/cli/cmd/run.ts:400` awaits `Bun.stdin.text()` when stdin is not a TTY before submitting the initial prompt. The live app uses a PTY and does not take that headless input path.

Source: https://github.com/anomalyco/opencode/blob/v1.18.34/packages/opencode/src/cli/cmd/run.ts#L400

## Root Cause

The QA script left stdin open, so OpenCode waited for EOF before interpreting the supplied argument prompt. This explains the headless runner's apparent bootstrap stall; it does not establish the cause of the separate app OpenTUI DLL load error.

## Why the issue escaped detection

The runner assumed a positional prompt made stdin irrelevant. A startup log was initially mistaken for a provider initialization barrier.

## Proposed prevention

Close the QA child's stdin immediately after spawn and rerun the same bounded file-read task. Keep timeout exit status nonzero and retain separate evidence for app PTY behavior.
