---
status: active
superseded_by: null
version: 0.1.1
---

# Zuri restrained glass and motion

Date: 2026-10-05, Asia/Bangkok. Complexity C-2; risk MEDIUM (shared UI components and interaction lifecycles). Product baseline 0.1.0, commit d3265dde. The user confirmed restrained, readable Glassmorphism and motion resembling Framer Motion, then explicitly APPROVED this specification on 2026-10-05.

## Parent and peer alignment

Parent: ZURI-MVP.md preserves Electron/React, local runtime, provider and persistence behavior. Peer: ZURI-UI.md and design/tokens.css establish Zuri Heritage amber #E8820C, semantic colors and compatibility aliases. Reference: Freshair129/zuri.ai UI-DESIGN-SYSTEM.md at 332b88c9277ee0995798f125f99d5343e7d493f0. Root DESIGN.md contains inherited upstream styling and is not the new visual contract.

## Approved visual contract

| Surface | Appearance | Motion |
|---|---|---|
| Top toolbar and navigation/sidebar shell | Restrained translucent neutral, 12px backdrop blur, subtle border | Selection indicator and hover feedback, 120-180ms |
| Settings, Add/Edit Agent, onboarding dialogs | Glass outer shell, readable inner surfaces, 16px radius, up to 16px backdrop blur | Enter fade + 8px translation, 240ms; exit 180ms |
| Settings and Command Center tabs | Zuri amber active state, stable content dimensions | Indicator 180ms; content fade/4px translation 180ms |
| Agent cards, buttons, menus | 8px controls / 12px cards; restrained focus/hover states | Press scale 0.98, 80ms; hover 120ms |
| Terminal, editor, tables and task content | Opaque readable surface | No animated streaming text, no content scaling or remount for cosmetic transitions |

Initial glass candidates: light rgba(255,255,255,0.88), dark rgba(26,26,31,0.90), saturation 110%. Increase opacity where live backgrounds compromise contrast. Provide opaque fallback when backdrop-filter is unavailable. No stacked nested blur, animated blur, parallax, perpetual shimmer or bounce. The existing office canvas/art stays in place.

Use semantic/component tokens for glass surface, border, blur, radius, duration, easing and motion distance. Retain cth aliases for compatibility. Body 14px, labels 13px, captions at least 12px on the touched surfaces; replace inherited 8px labels there. Keep system fonts for this scope, with Thai-capable fallbacks. A full typography/font migration is separate.

## Implementation approach

Use Motion for React (formerly Framer Motion) for presence transitions and selected-tab movement; CSS transitions for simple color/focus feedback. Pin a compatible package in the existing npm lockfile after approval, without unrelated upgrades. Official reference: https://motion.dev/docs/react and https://motion.dev/docs/react-accessibility .

Use tween easing cubic-bezier(.2,.8,.2,1); do not rely on default springs. Respect prefers-reduced-motion with instant state changes and no translation/scale. Keep keyboard focus and Escape behavior correct while overlays exit; closed controls must cease accepting input. Preserve component keys and terminal/editor instances. Do not replay entry animations for each streamed event, tab data refresh or list update.

## Scope and files

Shared tokens/global styles, PixelButton/PixelPanel where appropriate; App shell; OnboardingWizard, SettingsModal, AddAgentModal, EditAgentModal if present, CommandCenterPanel and corresponding agent surface components. Confirm exact mounting boundaries before edits. package.json/lockfile change only for the animation dependency. No IPC, agent permissions, provider, persistence, native dependency, scene movement or backend changes.

The stale automatic-update copy observed during screenshot capture is a separate finding, not silently included in this visual change.

## Execution and verification

1. Establish glass/motion tokens and shared primitives; verify light/dark contrast and reduced-motion behavior.
2. Apply navigation/dialog/agent transitions; verify focus, Escape, rapid switching, scrolling and uninterrupted terminal/editor state.
3. Run typecheck, production build and relevant interaction checks; compare against existing upstream test failures without calling the full suite green.
4. Capture before/after screenshots at 1280x800 and 1440x960, light/dark, plus a short video of tabs/dialogs/buttons. Static screenshots alone cannot prove motion.
5. Record actual performance on the test machine, inspect simultaneous terminal output and transitions for stalls, and report limitations rather than claiming universal 60fps.

Acceptance: readable glass, consistent Zuri tokens on touched controls, bounded transitions, reduced-motion alternative, preserved input/focus/terminal state, and versioned visual evidence. Measured results and limitations are maintained in [verification](ZURI-GLASS-MOTION-VERIFICATION.md).

## Version diff

Snapshot 1.0.0 / app 0.1.0 remains the before baseline. App 0.1.1 / snapshot 1.1.0 adds opt-in glass shells, Motion 14.0.0 transitions, scoped tab indicators, larger touched labels, and focus/inert/reduced-motion lifecycle handling. The reference design is still pinned to zuri.ai 332b88c9. Backend, provider, permissions, persistence, terminal keys and native dependencies are unchanged. Evidence records the exact packaged ASAR hash and source commit.
