---
status: active
superseded_by: null
version: 0.1.0
---

# Office shell implementation notes

Implements the approved `../ZURI-OFFICE-SHELL.md` contract. Complexity C-2, risk MEDIUM. Package version is owned by the parent integration lane.

## Version diff

- 0.3.1: permanently visible right details and bottom roster.
- 0.4.0: collapsible navigation, compact roster disclosure, closable persistent agent drawer; existing office, terminal, details and coordinator panes retained.

## State and geometry

The office remains one unkeyed component at one React tree position. Drawer and roster use `display:none` when hidden while retaining children. Closing the drawer leaves selection, local coordinator state, staged composer attachments and pooled terminal mounted. Close returns keyboard focus to Open agent drawer. Selecting the same agent reopens the drawer. Coordinator navigation updates selection and tab request in a single store transaction. Active navigation follows the docked coordinator's actual tab, with the mismatch RCA in `.brain/rca/UI-SHELL-NAV-ACTIVE-TAB.md`.

Navigation is an icon rail below 1180px; its expansion control is disabled with a localized compact-window explanation. The saved collapse/expand preference is retained and applied again in wider windows. Below 1180px the drawer is a bounded, nonmodal overlay: the remaining office and navigation stay interactive. The drawer is docked above that breakpoint. No transform/size animation is applied to terminal, editor or Pixi content. The existing splitter has keyboard arrows/Home and mirrors drag direction in Arabic. Roster disclosure dismisses its transient menus and note editor, preserving stored notes and roster actions.

The single shell Settings entry opens the existing modal. Agent Office closes the drawer; Tasks, Ask me, Team, Memory and Activity open real coordinator tabs. Other tabs remain accessible inside the coordinator. There are no new Groups, Reports, approval-policy or account services. Labels are supplied for the existing English, Chinese and Arabic locales.

## Verification at source freeze

- Web TypeScript: PASS.
- `test/office-shell-state.test.cjs`: 4 PASS, 0 FAIL; checks close/reselect preserving draft/session identity, atomic coordinator selection with repeated requests, absent-coordinator behavior, and prerequisite navigation preserving its dispatch seed while reopening the coordinator.
- Existing Arabic/UI and English/Chinese locale contracts plus the four state tests: 27 PASS, 0 FAIL after replacing the new locale-specific count plurals with one neutral count label. Initial integrated failure remains preserved; RCA is `.brain/rca/UI-SHELL-LOCALE-COUNT.md`.
- This source verification does not establish terminal DOM continuity, staged-file preservation, final layout geometry or packaged runtime success. Those are assigned to the separate packaged shell QA run at 1100×760, 1280px and 1440px, including light/dark themes, coordinator internal tab navigation and real counter PTY continuity.

The existing attachment behavior on switching agents/tabs is unchanged; preservation is required for shell hide/reopen/collapse. Escape is left to the active terminal/editor controls; the drawer closes with its accessible close button, which supports standard keyboard activation.
