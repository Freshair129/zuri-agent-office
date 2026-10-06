---
status: active
superseded_by: null
version: 0.1.0
---

# Zuri marketing skills and role presets

Date: 2026-10-05. Approved by the user's explicit “approve” following review of this contract. The installation target is **inside Zuri as a central library for role-based agents**, rather than a global Codex installation. Implementation and verification are authorized within this scope.

Complexity **C-2**. Risk **MEDIUM**: bundled resources, agent provisioning, optional persisted selection, typed IPC and the existing hire/skills UI. No new orchestration service or database migration is proposed. Approved application version change: **0.4.0 → 0.5.0**. Delivery evidence is recorded in [the verification report](ZURI-MARKETING-SKILLS-VERIFICATION.md).

## Decision and assumptions

Use one pinned, attributed library of upstream marketing skills, with six reusable role presets that select a small working set. A skill describes how to do a task; a role defines responsibility and selects relevant skills. Creating or selecting a preset does not automatically spawn a team.

[ASSUMPTIONS]

1. “Basic skills” means available in the Zuri library and shipped with the app; it does not mean loading all 50 skill bodies into every agent's prompt.
2. The six roles below are proposed starting presets. Their names are editable agent descriptions, not new permission levels or an RBAC implementation.
3. Product/brand context is shared by agents working on the same selected project. Different projects must not silently share brand or customer context.
4. This scope installs instructions and connects role selection to agent startup. It does not provision marketing accounts, launch campaigns, schedule jobs, or create API credentials.

## Parent and peer alignment

Parent authority: [PRODUCT.md](../PRODUCT.md), [ZURI-MVP.md](ZURI-MVP.md) and [ARCHITECTURE.md](ARCHITECTURE.md). Retain the Electron main/preload/renderer boundary, existing Hive/PTY planes, local provider choices, explicit integration consent and local packaging without publication.

Peer contracts inspected at app commit `3f64ab64dd15cfc703090736fcdfa6c8001303c1`:

| Current surface | Observed behavior | Integration implication |
| --- | --- | --- |
| `src/shared/hire.ts` | Hire v1 accepts up to eight skill IDs; its allowlist currently contains three built-in skills. | Reuse the capped selection contract; explicitly register namespaced marketing IDs. Keep existing hires compatible. |
| `src/renderer/src/components/AddAgentModal.tsx` | Imported skills are displayed, but the spawn payload and roster construction do not carry a skill selection. | Carry validated selection through initial spawn, persistence and restart; a visible chip alone is not activation evidence. |
| `src/main/hive.ts`, `ensureAgent` / `copyBundledSkills` | Every spawn copies the whole existing `resources/skills` tree into the agent's `.claude/skills`. | Store the marketing library separately, then provision only the selected marketing set. Preserve the existing core bundle. |
| `src/main/skills.ts` and `SkillsTab.tsx` | Local/provider discovery and a remote catalog exist; installation targets the user's Claude skills directory. | Add a separate bundled Zuri marketing view. Do not route this app-specific installation through the global installer action. |
| Hive `injectedPrompt` and provider startup adapters | Claude receives a prompt extension; other providers use their existing initial/seed prompt paths. | Supply a compact index with absolute file paths through the common bootstrap. Do not assume every provider discovers Claude slash commands. |
| `electron-builder.yml` | Existing core skills are packaged as extra resources. | Package the pinned marketing library and verify it from the packaged application, not only the source checkout. |

The visual additions use existing Zuri tokens, restrained glass/motion and accessible controls from [ZURI-UI.md](ZURI-UI.md) and [ZURI-OFFICE-SHELL.md](ZURI-OFFICE-SHELL.md).

## Upstream source and provenance

Source: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/dda3841f0b294e01e93b1541486beefbfab0915e).

- Pin: `dda3841f0b294e01e93b1541486beefbfab0915e`, commit date 2026-10-03 UTC.
- Upstream `.codex-plugin/plugin.json` reports **2.11.17**. Individual skill versions differ; preserve their original metadata.
- Git tree inspection found **50 SKILL.md entrypoints**, **290 files under skills/**, **2,862,249 bytes**. Those files comprise 238 Markdown, 50 JSON, one CSV and one HTML file. This is inventory evidence, not a complete content/security audit.
- License: MIT, copyright 2025 Corey Haines. Include the actual LICENSE and attribution in the shipped bundle and third-party notices.
- Proposed location: `resources/marketing-skills/skills/<upstream-name>/`, plus `LICENSE` and an origin manifest alongside `skills/`. Keep upstream skill and reference contents unchanged. Keep Zuri routing/policy instructions outside vendored content.
- Record repository, full commit, upstream package/skill versions and per-file SHA-256 hashes. Resolve cross-skill references through the catalog; preserve relative reference directories. Report any missing bundled reference before declaring installation verified.
- Root-level upstream tooling is not part of this install. External integration guides remain source links and are not evidence of configured integrations. Do not execute the HTML reference or upstream evaluation files during installation.
- No auto-update: changing the pinned collection is a separate, reviewable version diff. Do not overwrite an existing user skill with the same short name.

## Initial role presets

Every preset includes `product-marketing` as the foundation. It establishes `.agents/product-marketing.md`; other selected skills read that shared product, audience, positioning and voice context. Skill names below are upstream names; the app-facing selection IDs use a `marketing:` prefix.

| Preset | Responsibility | Selected skills, including foundation |
| --- | --- | --- |
| Marketing Lead | Strategy, positioning, offers and launch plan | `product-marketing`, `marketing-plan`, `customer-research`, `competitor-profiling`, `offers`, `pricing`, `launch`, `marketing-ideas` |
| Content & Brand | Editorial planning, copy and creative briefs | `product-marketing`, `content-strategy`, `copywriting`, `copy-editing`, `social`, `marketing-psychology`, `image`, `video` |
| SEO Specialist | Search visibility and site structure | `product-marketing`, `seo-audit`, `ai-seo`, `programmatic-seo`, `site-architecture`, `schema`, `competitors` |
| Performance Marketing | Paid campaign plans, conversion and measurement | `product-marketing`, `ads`, `ad-creative`, `cro`, `ab-testing`, `analytics`, `attribution`, `lead-magnets` |
| Lifecycle & CRM | Activation, retention and lifecycle communications | `product-marketing`, `emails`, `onboarding`, `signup`, `churn-prevention`, `referrals`, `paywalls`, `sms` |
| Sales & RevOps | Prospecting, sales materials and revenue operations | `product-marketing`, `revops`, `prospecting`, `cold-email`, `sales-enablement`, `customer-research`, `offers`, `competitor-profiling` |

The remaining skills stay available in the central library. The user may adjust the selected set before spawning, up to eight total selected skills; selecting marketing skills requires the foundation within that limit. There is no automatic dependency expansion that silently exceeds the limit. A skill that suggests another skill does not grant it to the current agent: show it as available in the library for a later selection or handoff.

## Runtime contract

1. **Catalog and validation.** Use one deterministic registry for the 50 marketing IDs and six presets. Main validates IDs and count independently of renderer validation. Retain existing built-in IDs and reject unknown IDs, duplicates and paths masquerading as IDs. Do not describe marketing instructions as inherently read-only: some explain external actions.
2. **Selection and persistence.** A preset fills the existing role/goal fields plus the validated skill selection. Imported hires use the same validation. Persist the effective selection in the agent record and Hive registry, and restore it for restart/resume. Absence on an old agent means no marketing selection. Missing restored resources must be reported, not silently replaced by the full library.
3. **Provisioning.** Keep the current core skills copy behavior. Materialize only selected marketing skill directories and their contained references into an agent-owned, namespaced location. Track the collection version and hashes used for that agent. Refresh only app-owned files; preserve user-created content. Changing a selection while a process runs takes effect on its next start and must be labeled accordingly.
4. **Bootstrap.** Inject only a compact index: selected IDs, purpose, collection version and absolute entrypoint paths. Read full instructions/references on demand. Use existing provider-specific prompt delivery; do not add new engines or rely on POSIX variable expansion on Windows. Skill availability and actual model use are separate states.
5. **Shared context.** Resolve `.agents/product-marketing.md` from the user-selected source project before worktree isolation, and preserve that project association for resume. Point all roles for that project to the same canonical file instead of creating independent private copies. If missing, report context as missing and let the Marketing Lead/product-marketing workflow draft it from supplied project material. Do not fabricate approved ICP, positioning, metrics or brand claims. Existing legacy paths may be read as compatibility fallbacks; moving/overwriting context is not implicit in installation.
6. **Execution authority.** A role/skill is an instruction and routing aid, not a grant of tool access. Existing provider permissions, budgets and integration consent continue to apply. The install itself performs no outbound marketing action. Prompt guidance is not advertised as a new technical security boundary.

## User experience

- In Add Agent, provide a Marketing role preset selector and the selected skill chips/count, with a compact picker for adjustments. Keep provider, model and workspace under the existing controls. Applying a preset does not spawn the agent.
- In Skills, show a bundled “Zuri Marketing” collection with search, source/version, all 50 entries and preset membership. Distinguish **bundled in app**, **selected for agent**, **provisioned for session**, and **provisioning failed**. “Installed” alone must not imply that a model has read or successfully used a skill.
- Show the selected project's marketing context path and existence state. Do not add a new context editor or reporting dashboard in this scope.
- Keep agent responsibility visible in the existing role/description surface. Preserve the existing office, drawer, terminals and tasks.

## Implementation and verification plan

1. **Vendor the pinned collection and register roles** → verify license, 50 unique entrypoints, versions/hashes, reference completeness, preset validity and the eight-item limit.
2. **Connect selection to provisioning and restart** → test two roles receiving different sets, no unintended marketing skills on legacy agents, invalid IDs rejected, non-destructive refresh, missing files reported, and persisted selection/context across isolated-worktree restart.
3. **Expose the library/presets in the existing UI** → verify keyboard selection/search, accurate status labels, readable light/dark layouts, and preservation of current agent controls.
4. **Build and exercise the packaged app** → run main/web typechecks, relevant hire/skills/Hive/roster/provider tests, then the repository suite and production build. Verify the packaged collection and actual spawn bootstrap with controlled fixtures for Claude and the existing non-Claude path, including OpenCode local configuration. Report live model use separately; fixture PASS is not live inference acceptance.
5. **Record evidence and version diff** → collect versioned screenshots of the role selector, collection, per-agent selected set and restart result. Include app/snapshot version, Git commit, collection pin and checksums. Publish a verification report with PASS/FAIL/SKIPPED/NOT_RUN and remaining limitations.

Acceptance: the user can choose a marketing role, inspect its skills, start an agent with only that selected marketing set provisioned, and recover the same set after restart. The packaged app exposes all 50 library entries with provenance. Context resolves to the correct source project. Existing core skills and unrelated agent workflows retain their behavior. No global Codex/Claude installation is changed by this feature.

Exit: acceptance checks pass, docs/notices are updated, screenshots and test evidence are saved, and no known regression caused by the change remains unresolved. Do not call the work complete based solely on copied files or visible role chips.

## Scope boundaries

No dedicated Marketing microservice, new model runtime, automatic team creation, scheduling, CRM integration, Ads Manager connection, publishing, campaign spend, generic plugin marketplace rewrite, or policy/RBAC engine. Upstream `marketing-council` and `marketing-loops` remain selectable instructional skills, not automatically running agents or jobs.

## Original proposal checkpoint and version diff

- Document: absent → **0.1.0 draft** (this proposal).
- App: **0.4.0 → 0.4.0**; runtime code and installed binaries unchanged in this documentation step.
- Library: source inspected and pin selected; **not yet installed** into Zuri.
- Planned next app version after approval and verified delivery: **0.5.0**.
- Runtime tests, packaged skill provisioning and new screenshots: **NOT_RUN** for this proposal.

Approval record: draft 0.1.0 → active 0.1.0 on the user's explicit approval, 2026-10-05. The initial proposal status above records the pre-implementation checkpoint; delivery results belong in the verification report.

## Delivered checkpoint

Application **0.4.0 → 0.5.0**: 50 pinned skills, six role presets, selected provisioning and source-project context across restart are implemented. Final repository suite: **990 PASS, 0 FAIL, 20 SKIPPED**. Packaged UI/PTY verification passed with 13 screenshots and three recordings under snapshot **5.0.0**. Live model execution and installer installation remain NOT_RUN. See the [verification report](ZURI-MARKETING-SKILLS-VERIFICATION.md) for exact source/artifact hashes, unsigned-build limitations and evidence links.
