---
status: active
superseded_by: null
version: 0.5.0
---

# Zuri product context

## Register

product

## Users and purpose

Desktop users managing local CLI agents: choose a workspace/provider, assign work, inspect terminals/tasks/memory, and stop or resume agents. Source: README.md and docs/ZURI-MVP.md.

## Brand personality and reference

Clear, calm, task-focused. Zuri Heritage is the design reference. On 2026-10-05 the user selected restrained, readable glass and motion, rather than showcase effects.

The user subsequently approved a warm realistic miniature office with detailed generated 2.5D furniture, adult characters and matching portraits. Pixel art is retired from these surfaces; glass and motion retain their approved restraint.

## Design principles

- Keep task state and agent controls legible and immediately available.
- Preserve the Zuri amber identity and consistent semantic states.
- Use translucent surfaces to communicate hierarchy; motion explains navigation and state changes.
- Keep the terminal, editor and dense data stable during visual transitions.

## Anti-references

Avoid pervasive blur, perpetual decorative movement and visual density that makes labels difficult to read. These exclusions implement the user's restrained/readable preference.

## Accessibility

Target WCAG AA contrast, visible keyboard focus and reduced-motion support, consistent with the referenced Zuri design system. These are acceptance targets, not a certification of the existing application.

## Design authority

docs/ZURI-UI.md describes the delivered Zuri baseline. Root DESIGN.md is inherited upstream history and does not override it. The user approved docs/ZURI-GLASS-MOTION.md on 2026-10-05; it governs this visual implementation.

The approved docs/ZURI-2.5D-OFFICE.md extends the visual contract for scene projection, generated art, navigation preservation and measured packaged-app verification.

The user rejected 0.2.0's resemblance to Concept 01. docs/ZURI-REFERENCE-FIDELITY.md now governs the exact reference composition: rear glass meeting room, four worker pods, enclosing walls and elevated frontal perspective. Preserve identities and behavior while recalibrating renderer-local coordinates to the image. Explicit reference review is a required gate separate from functional tests.

The approved docs/ZURI-OFFICE-SHELL.md frames that same room with collapsible navigation and a closable agent drawer. Existing task, human-review, team, memory and activity surfaces remain functional. Hiding a panel must preserve the office canvas, terminal and drafts; routine thought labels appear only for the selected agent, while blocked/looping attention stays visible.

## Version diff

0.1.1: approved product context for restrained glass and motion. Implementation and measured acceptance are recorded in docs/ZURI-GLASS-MOTION-VERIFICATION.md.

0.2.0: detailed warm miniature office and smooth matching actors; measured acceptance and limitations are recorded in docs/ZURI-2.5D-VERIFICATION.md.

0.3.0: reference-fidelity correction; exact source image establishes the room composition, with separate dynamic actors. Verification is recorded in docs/ZURI-REFERENCE-VERIFICATION.md.

0.3.1: managed-worktree stabilization and platform-correct tests, recorded in docs/ZURI-STABILIZATION-VERIFICATION.md.

0.4.0: approved office navigation/drawer shell and quieter scene labels. Acceptance is recorded separately in docs/ZURI-OFFICE-SHELL-VERIFICATION.md.

0.5.0: approved central marketing library with six role presets, at most eight selected skills per agent, durable provisioning and project-specific shared context. Instructions are not tool permissions. Contract: docs/ZURI-MARKETING-SKILLS.md; measured results: docs/ZURI-MARKETING-SKILLS-VERIFICATION.md.
