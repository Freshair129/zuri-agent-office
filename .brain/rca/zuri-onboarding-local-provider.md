---
status: active
superseded_by: null
---

# Local provider onboarding gap

## Symptom

Selecting OpenCode at first launch could start the coordinator before a local endpoint/model was configured.

## Evidence

`OnboardingWizard.finish()` wrote only `godProvider` and `godModel` then called `onComplete`. `App` begins `useHive` when onboarding completes. OpenCode local mode is selected by nonempty `providerBaseUrls.opencode`; without it the runtime follows the existing CLI/cloud configuration. The wizard exposed no endpoint or local model fields.

## Root cause

The existing wizard treated CLI engine selection as complete provider configuration. The local endpoint contract existed only in post-onboarding Settings, after automatic coordinator startup.

## Why the issue escaped detection

Engine availability and config unit checks did not exercise first-launch local provider setup before automatic spawning. An actual GUI review identified the missing step.

## Proposed prevention

Expose explicit local vs existing CLI/cloud mode for OpenCode. Validate local endpoint and exact model before advancing and finishing; persist normalized endpoint/model plus optional encrypted key before marking onboarding complete. Local is the initial OpenCode mode; cloud requires explicit selection. Verify the integrated first-launch path with the desktop harness; unit validation alone is not live inference proof.
