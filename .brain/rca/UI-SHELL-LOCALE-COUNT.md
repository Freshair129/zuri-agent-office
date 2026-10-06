---
status: active
superseded_by: null
version: 0.1.0
---

# Shell agent-count locale contract failure

## Symptom
The integrated suite failed four existing locale contract checks after the shell added the agent-count label. The preserved failing run is `output/playwright/shell-full-suite.log` (999 total, 975 pass, 4 fail, 20 skip).

## Evidence
The new English namespace uses `agentCount_one` and `agentCount_other`; Chinese uses only `agentCount_other`; Arabic uses zero/one/two/few/many/other variants. The first three Arabic variants omit `{{count}}`. Existing localization checks require matching locale key trees and placeholder sets. The new keys violate both contracts.

## Root cause
The implementation used language-specific plural variants without checking the repository's stricter cross-locale key and interpolation contract. The label does not need grammatical pluralization to convey its count.

## Why the issue escaped detection
Web TypeScript and shell state tests do not validate translation key/placeholder parity. The mismatch was found by the integrated localization suite before final packaged acceptance.

## Proposed correction and prevention
Replace only the newly added `agentCount_*` keys with one neutral `agentCount` label containing `{{count}}` in each existing locale. Keep the App translation call unchanged and preserve existing tests without relaxation. Run the existing localization tests and the four focused shell state checks before refreezing. Future locale additions must run the locale contract checks before source freeze.
