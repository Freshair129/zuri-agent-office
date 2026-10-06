---
status: active
superseded_by: null
version: 0.1.0
---

# Office QA fixture entry race

## Symptom

The before-package comparison timed out waiting for Settings after loading the controlled roster and reloading the renderer. No production application source was changed by this repair.

## Evidence

- `output/playwright/office-2.5d/after-1791189929271/manifest.json`: packaged 0.1.1, Settings timeout, zero page errors.
- Diagnostic reproduction `after-1791190065074`: failure screenshot and `failure-aria.txt` show SELECT A HARNESS CONFIG with only open/create buttons. Manifest shows all 16 persisted entries intact, selected fixture 1 and the one-use skip flag already removed.
- `App.tsx` initializes `hiveOpened` by reading and deleting `cth.skipHivePickerOnce`. The runner previously seeded that flag immediately after Electron `firstWindow()`, which does not wait for React's initial App mount.
- Adding a wait for the rendered `open existing config…` button before seeding the roster/flag resolves the same reproduction. `after-1791190126657/manifest.json` records PASS, both viewport screenshots and a finalized video against the unchanged 0.1.1 ASAR SHA256 `6cc8da2631924f22bd32804c4788593bbed4b5436d17a7d2745eb95d271ff118`.

## Root Cause

The QA runner treated creation of the Electron window as completed React initialization. Initial mount could consume the one-use flag before the runner's explicit reload; the reload then correctly displayed the picker. The null hive correctly prevents coordinator bootstrap and is retained.

## Why the issue escaped detection

The new runner had only received a syntax check before its first authorized runtime capture. Existing glass verification enters through a visible UI button and never relies on this initialization ordering.

## Proposed prevention

Wait for the real startup UI before mutating fixture persistence. Always save a failure screenshot, accessibility snapshot and non-secret fixture state. Keep before-package comparison separate from new-renderer acceptance and retain each failed run rather than replacing its evidence.
