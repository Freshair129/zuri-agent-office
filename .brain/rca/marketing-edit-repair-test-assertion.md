---
status: active
superseded_by: null
version: 0.1.0
---

# Incorrect expectation in the new extra-text regression test

## Symptom

During implementation of approved edit-repair v0.1.0, one of ten initial tests failed: the extra-heading case expected editBindings false but observed true.

## Evidence

The fixture inserted an unknown line immediately before Sources and unknowns. That line belongs to the preceding CTA body under the parser. The test changed neither Headline/Subheading nor their before/after records. The assessor correctly rejected exactCta; editBindings remained true.

## Root Cause

The new test asserted the wrong independent check. This is a test expectation error, not evidence of a parser accepting the complete response. Correct the assertion to exactCta false; do not change the implementation or weaken overall acceptance.

## Why the issue escaped detection

It was caught on the first focused test run before any model dispatch. The initial assertion incorrectly associated any extra text with changed edit records.

## Proposed prevention

Check the affected response field explicitly in each negative fixture, and retain the aggregate requirement that every mechanical check passes before manual acceptance.
