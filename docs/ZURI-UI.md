---
status: active
superseded_by: null
version: 0.4.0
---

# Zuri desktop UI

Implements the brand/scene portion of [ZURI-MVP.md](ZURI-MVP.md). The reference is `Freshair129/zuri.ai` at `332b88c9277ee0995798f125f99d5343e7d493f0`, `docs/UI-DESIGN-SYSTEM.md`; no reference implementation or image assets were copied.

## Design and compatibility

- Version 0.4.0 adds the approved [office shell](ZURI-OFFICE-SHELL.md): collapsible real navigation, compact agent roster and closable detail drawer around the existing office. Panel visibility preserves selected-agent state and mounted terminal/draft content. Navigation opens existing coordinator tabs; no placeholder Groups/Reports or policy claims are introduced. See [shell verification](ZURI-OFFICE-SHELL-VERIFICATION.md) for measured acceptance and limitations.

- Original SVG Zuri mark; neutral desktop surfaces, system UI fonts and Amber Citrus `#E8820C` primary actions. Semantic/component CSS tokens alias existing `--cth-*` tokens so established controls and light/dark themes continue working. Primary button foreground `#1F2937` contrasts at 5.33:1 against the amber fill. Focus outline is 2px with 2px offset.
- Default coordinator name is **Zuri Coordinator**. Existing saved custom names win, including a saved upstream name. All 15 avatar IDs remain stable; visible labels describe team roles. Version 0.2.0 replaces procedural pixel portraits/walk frames with generated adult character bases and matching smooth portraits, retaining upstream attribution.
- Ambient cafe dialogue uses short neutral break-room lines. Upstream show-specific quotes and character names are removed from these decorative bubbles and from onboarding, focus/IDE headers and voice greetings.
- The original `zuri-office.tmj` navigation map retains 16 desks, meeting/cafe zones and existing spawn/ambient anchors. Version 0.2.0 renders generated furniture and oak flooring through an isometric projection; the earlier SVG atlas is retained as source history and is not loaded by the active renderer. Shared prop placements add transient collision footprints without migrating saved data. Legacy theme IDs resolve to the supported studio; cosmetic changes never archive agents.
- About reads only local app version; upstream Pro/Founders/Discord promotions and remote hero payload loading are removed. Upstream legal credit remains. Updater/analytics controls explain this edition's disabled/manual behavior; onboarding persists analytics off. Backend enforcement belongs to the runtime lane.
- Synthetic office events require both development mode and explicit `VITE_CTH_DEMO=1`, and stop when live PTYs exist. An empty production office does not manufacture activity.
- First-launch home suggests `~/ZuriAgents`. OpenCode exposes explicit local/self-hosted (initial selection) and existing CLI/cloud modes. Local endpoint/model validation runs before advancing and again on Finish. Optional endpoint key is written through the encrypted provider broker, then normalized provider maps and `local/model` coordinator selection are persisted before onboarding completes and starts the coordinator. No local test or inference is silently sent by the wizard.

## Verification

Version 0.3.0 supersedes the rejected 0.2.0 visual composition through the [reference fidelity contract](ZURI-REFERENCE-FIDELITY.md). The exact approved room determines camera, four pods and rear glass enclosure; logical navigation projects into this room and foreground masks provide desk/chair/glass occlusion. Front and back character poses follow each seat's facing. [Reference verification](ZURI-REFERENCE-VERIFICATION.md) records actual packaged results; historical 0.2.0 checks below do not establish current acceptance.

Version 0.2.0 implements the approved [2.5D office contract](ZURI-2.5D-OFFICE.md). See [2.5D packaged verification](ZURI-2.5D-VERIFICATION.md) for actual results, versioned evidence and bounded claims. Three adult anatomies with five garment variants preserve fifteen IDs; reading reuses seated poses, and working currently uses seated idle. Controlled seating fixtures are labeled separately from real terminal counter output and do not establish model execution.

The 0.1.1 visual extension implements [restrained glass and motion](ZURI-GLASS-MOTION.md). It adds semantic glass/radius/motion tokens and Motion 14.0.0 to toolbar/navigation/dialog shells, preserving opaque terminal/editor content. See [packaged UI verification](ZURI-GLASS-MOTION-VERIFICATION.md) for live interactions, screenshots and video. The earlier checks below describe the 0.1.0 baseline.

Local `npm run typecheck:web`: PASS after UI implementation. `node --test test/zuri-office.test.cjs test/god-identity.test.cjs test/i18n-god-name.test.cjs`: PASS, 15 tests. These verify atlas dimensions/GID bounds, BFS reachability from entrance to every desk/cafe/ambient destination, all retained avatar frame buffers, persisted display names and translation invariants.

These are static/local checks, not desktop, GPU, model, accessibility assistive-technology or live-agent acceptance. Integrated build and desktop evidence are recorded separately by the lead in the final verification report.

## Version diff

0.1.0: introduced original Zuri identity/art, professional role labels, semantic color aliases and local-only product information while retaining underlying agent, map-rendering and terminal contracts.

0.1.1: restrained glass (12px shell / 16px dialog blur), 80-240ms tween feedback, scoped moving tab indicators, 12-14px touched text, Thai font fallback, and dynamic reduced-motion handling. Existing terminal/editor instances remain mounted through cosmetic changes.

0.2.0: smooth generated office/actor art, matching portraits, projected coordinates and inverse mapping, furniture-aware navigation and calibrated depth/seating. In-scene names appear on hover/selection; agent cards retain all names.

0.3.0: exact-reference room, perspective navigation and actors, four four-seat pods, clear meeting panes with opaque frame masks, and explicit composition review. Zuri UI tokens, restrained glass and Motion behavior remain in place.

0.4.0: collapsible sidebar, responsive agent drawer, compact roster and selected/blocked/looping thought visibility. Existing scene, tokens, restrained motion, terminal and coordinator features remain.
