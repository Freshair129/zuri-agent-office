---
status: active
superseded_by: null
version: 0.1.0
---

# Shell QA internal blocked status versus displayed label

## Symptom and evidence

The second full shell attempt, `output/playwright/office-shell/after-1791200040587`, stopped after 42 screenshots while checking the controlled permission-notification fixture. ASAR `e886533f83f40fd424855983990fc70cadfd85aceb45738427bcb4dc118e2abc` remained unchanged. Actual 1100×760 sizing and the complete 1-agent shell fixture passed. The 16-agent selected-thought/current-text assertion and nonselected critical-thought visibility assertion also passed before the card-label assertion failed. All controlled statuses were restored and owned processes closed.

## Root cause

The QA script used the internal state name `blocked` as expected card copy. The actual English contract in `src/renderer/src/i18n/locales/en.json` maps `status.blocked` to **needs you**. The production notification path sets the existing blocked state correctly; this attempt does not demonstrate a production status regression.

## Why it escaped detection

The prior scene fixture tested working/idle copy, whose displayed labels match internal enum names. This new check incorrectly extended that assumption to blocked status instead of inspecting the translation contract.

## Prevention

Assert the actual English UI phrase `needs you` on the coordinator's card, retain both card text and the read-only critical-thought observation before assertion, and rerun the complete suite against the same immutable ASAR. Preserve the raw failed attempt and exact executed runner. Do not change product status, translation or event handling to satisfy a QA assumption.
