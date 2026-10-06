---
status: active
superseded_by: null
version: 0.1.0
---

# Shell navigation selection, implementation review

## Symptom
During source review of the approved 0.4.0 shell, the proposed sidebar would continue highlighting Tasks after the user changed to Memory through the existing coordinator tabs.

## Evidence
`CommandCenterPanel` owns its visible tab in local `tab` state. `ccTabRequest` is an external request with a sequence counter, not the current pane. Internal `setTab` calls do not modify the last external request. The initial sidebar implementation derived `aria-current` from that request. This was identified before packaged acceptance, not observed as a released runtime failure.

## Root cause
The shell treated a command/event as a current-state value. The two values diverge when navigation originates within the coordinator panel.

## Why the issue escaped detection
Checking only new sidebar button actions exercises the request path; it does not exercise the pre-existing internal tab controls.

## Proposed prevention and correction
The docked coordinator publishes its actual visible tab to renderer-only state through an effect. The sidebar reads this value. Fullscreen coordinator instances do not overwrite the docked pane's state. Packaged verification must check sidebar Tasks followed by internal Memory, in addition to sidebar navigation. This changes no pane mounting, backend route, or persisted agent schema.

## Peer finding: constrained rail precedence

- Symptom: a saved expanded preference kept the 208px navigation expanded below 1180px, contrary to the approved constrained rail contract.
- Evidence: `navCollapsed ?? vpWidth < 1180` returns stored `false` before considering the viewport. The execution contract explicitly says the rail collapses at constrained widths.
- Root cause: optional preference precedence overrode the responsive constraint.
- Escape: testing only a fresh narrow window did not exercise wide expansion followed by resize.
- Correction/prevention: viewport constraint takes precedence; wide preference remains saved. The disabled compact toggle explains why it cannot expand. Packaged QA must resize a previously expanded window to 1100px and back, checking the rail and saved wide preference. This source issue was corrected before packaged acceptance.

## Peer finding: prerequisite dispatch opens a hidden pane

- Symptom: the existing Settings → Prerequisites → Ask coordinator action would close Settings but leave the newly closable drawer hidden.
- Evidence: `SetupPanel.tsx` calls `requestDispatchSeed` then `requestCommandCenterTab('floor')`; the request helper only changes the tab request, and the action does not call `select`. Previously the drawer was permanently visible.
- Root cause: this existing caller assumed that requesting a tab implied visibility. A new independent drawer visibility flag invalidated that assumption.
- Escape: initial shell navigation tests exercised the new sidebar and office click paths, both of which also select/open, rather than this nested Settings caller.
- Proposed correction/prevention: preserve the dispatch seed and route this caller through the existing atomic `openCommandCenter('floor')` action, which selects the actual coordinator and opens the drawer. Verify state transition without sending real provider work; add a state regression for preserving the seeded dispatch when the drawer was hidden.
