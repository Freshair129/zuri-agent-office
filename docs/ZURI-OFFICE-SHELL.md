---
status: active
superseded_by: null
version: 0.1.0
---

# Zuri office shell, approved execution contract

Date: 2026-10-05, Asia/Bangkok. The user asked to adopt the supplied shell and approved the recommended scope with “ลุย”: complete baseline stabilization first, then use a collapsible left navigation, existing realistic office in the center and agent drawer on the right. This records the already approved direction before code. Complexity C-2; risk MEDIUM, renderer layout/state mounting across existing components. The preceding worktree stabilization remains C-3/HIGH.

Parent: PRODUCT.md, ZURI-MVP.md and docs/ARCHITECTURE.md's two data planes. Peers: ZURI-REFERENCE-FIDELITY.md, ZURI-GLASS-MOTION.md, existing terminal pooling, AgentDetailPanel/CommandCenterPanel, store selection and tab requests. Package target 0.4.0 after verified stabilization checkpoint 0.3.1. No backend contract, persistent agent schema or dependency upgrade.

## Reference and retained identity

The user's supplied PNG is preserved unchanged at `design/zuri-office-shell-reference.png`, SHA256 `408a0f4cf3d33eb049c36148515ed67a740b43d2b54f387a8b3a3e0560c29fec`. It governs shell hierarchy, not a switch back to pixel-art scenery or avatars. Keep the current reference-derived office, smooth portraits, Amber Citrus and semantic Zuri tokens. Use restrained glass on shell surfaces and existing Motion/reduced-motion conventions. Dense terminals/editors remain opaque and stable.

The user works at a desktop for sustained agent supervision, alternating a bright-day light theme with the existing dark theme. The shell must support both, retain familiar system typography and provide readable control labels. Runtime/provider permission behavior must be described truthfully; do not copy claims that agents never act autonomously or that policy verification exists when the implementation does not support them. The reference's workspace name, DEMO badge and notifications are illustrative, not new product features.

## Layout and functional scope

- Top bar: Zuri identity, current workspace/Hive context when available, version and existing theme/settings/focus actions. Avoid decorative duplicate controls or fabricated user/account state.
- Left navigation: expanded labels on wide windows; collapsible icon rail with accessible labels and visible focus. Link existing office, task/human-review, memory/activity/team surfaces using their established selection/tab mechanisms. Final labels must accurately name what exists; no placeholder reports, organization groups or invented review records.
- Center: the current Pixi office fills available space without clipping its camera. Preserve the canvas/component instance through sidebar/drawer state changes. Retain an accessible agent roster and add-agent entry; do not duplicate a permanent dense roster and drawer if a compact disclosure serves the same function.
- Right agent drawer: selected agent identity, actual status and existing actions/details/terminal. User can close and reopen it, reselect the same agent and switch agents. Closing the drawer must not stop a PTY, discard a draft, dispose its pooled terminal or reset the selected agent's working state. On constrained widths use a bounded overlay and prevent horizontal page overflow.
- Thought labels: normally show the selected agent and important attention/error states. Agent status remains available in the drawer/roster. Selection updates must reveal current text without waiting for a new provider event. Preserve underlying events, status and movement behavior.

Confirmed navigation mapping: Agent Office closes the drawer while retaining selection; Tasks → coordinator `tasks`, Ask me → `human`, Team → `floor`, Memory → `memory`, Activity → `activity`. These use the existing coordinator selection and command-center tab request. Destinations requiring a coordinator are disabled with a reason while it is absent. Other coordinator tabs remain available inside the existing panel. Settings has one accessible entry to its existing modal.

The renderer-only drawer-open flag reopens on every `select()` call, including the same selected ID. Closing hides its wrapper while leaving detail content mounted. The office stays at one React position with no layout-dependent key. The compact roster disclosure retains reorder, restore and note actions. Keep existing en/zh-CN/ar localization; this change does not add a new language. At constrained widths the rail collapses and the drawer overlays within the viewport; a wide drawer remains resizable with keyboard access.

The native minimum outer window width is 1100 (previously 1280) so the approved 1100-pixel content viewport and below-1180 shell breakpoint are reachable. Minimum height, default geometry and saved-bounds clamping remain. The packaged runner must measure actual content dimensions before claiming a responsive check; see the window-bounds RCA for the confirmed initial mismatch.

## Acceptance

1. Stabilization completes first with exact supported-path pass/fail/skip accounting and documented unsupported platform coverage.
2. Build and TypeScript pass. Verify real navigation actions, selecting/reselecting an agent, drawer close/reopen, sidebar collapse, keyboard focus and both themes. Check large/standard/constrained desktop widths, long names and 1/16-agent rosters.
3. Verify office instance and terminal output/draft continuity across layout changes. Inspect actual screen geometry and static character seating; UI rearrangement must not invalidate the approved room composition. Reduced motion disables the new transitions without hiding content or state.
4. Retain fixtures versus real model distinctions. Use the isolated real-counter PTY and labeled status fixtures, not simulated model success. No new production QA hooks solely for screenshots.
5. Produce actual packaged screenshot/video evidence, App 0.4.0 / Snapshot 4.0.0 with source/ASAR/asset hashes, a comparison to the supplied shell and previous 0.3.0 UI. Keep prior artifacts unchanged. Shipping installer files does not claim installer installation, signing or deployment.

## Version diff

0.3.0: top toolbar, central office, permanently occupied detail sidebar and bottom roster.

0.4.0 target: persistent office framed by collapsible functional navigation and a closable agent drawer, compact roster access, selected/attention thought labels, and existing runtime surfaces exposed through the shell. No new Groups/Reports backend or change to agent autonomy.
