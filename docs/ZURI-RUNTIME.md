---
status: active
superseded_by: null
version: 0.1.0
---

# Zuri runtime isolation and offline product services

Implements the identity and outbound product-service decisions in ZURI-MVP.md.
Risk HIGH; complexity C-3. Upstream internal Hive/agent/secret IDs remain compatible.

## Startup and storage

`src/main/index.ts` imports `runtimeIdentity.ts` first. The module sets product
name Zuri and Windows app ID ai.zuri.agentoffice before state consumers execute.
Config resolves userData lazily; HiveManager, RosterStore and TelemetryCollector
constructors capture dependencies without starting services or loading user state.

Default userData is `<Electron appData>/ZuriAgentOffice`. Session data, logs,
Chromium disk cache, temp files and crash dumps use explicit children of this
directory. No upstream state is discovered, copied or migrated. Hive stays
unconfigured until onboarding selects a home; the renderer suggests a separate
Zuri home. User-selected existing homes remain explicit user decisions.

QA may set `ZURI_USER_DATA_DIR` to an absolute directory before launch. Relative
and empty values fail before initialization. This option selects the entire app
state root and should point to a dedicated QA directory. It does not automatically
configure a Hive, import credentials or change global provider homes.

The registered deep-link scheme is `zuri-agent-office`. The existing
`munder-difflin/hire@1` manifest schema is retained for data compatibility;
upstream protocol links are rejected by the Zuri parser.

## Network and updates

The updater has no release destination, native updater import, network import,
timer, launch release-note fetch or download operation. Existing IPC channels
return an immediate manual-only refusal and the badge says `manual updates`.
No installer URL is inferred and stale upstream download payloads are ignored.
The app does not assert that its installed version is current.

Product analytics' exported runtime instance cannot initialize a PostHog client
or write an install ID even if a build key is inherited or a caller enables it.
Legacy Analytics helpers remain covered by synthetic tests; they are not the
runtime singleton. Config reads and writes force telemetryEnabled/autoUpdate
false. This does not disable the local loopback usage collector required for
agent accounting.

The information card always returns bundled defaults, without cached upstream
promotions. Model catalog refresh always returns null so pickers retain bundled
model data. Force-refresh requests do not enable outbound requests. User-selected
provider calls, explicit skill browsing/installing, and explicit integrations
retain their existing contracts.

## Verification and limits

2026-10-05 focused Node suite: **102 passed, 0 failed**, recorded in
`runtime-tests.log`. Covers new identity bootstrap/QA override, manual-only IPC,
no network dependency availability, no runtime analytics client or ID creation,
local card/model behavior and protocol separation; preserves generic update
state, historical telemetry parsing, configuration notifications and payload tests.
`npm run typecheck` passed both main and renderer TypeScript checks.

Obsolete upstream source assertions for automatic restart/download, updater log
breadcrumbs and launch release fetches were removed. They were replaced with
behavioral manual-only/no-network tests rather than skipped. Generic historical
log/parser and release-body tests remain. The pure asset helper test uses an
isolated Electron boundary instead of requiring an installed desktop binary.

An additional unmodified model-catalog parity test failed because the upstream
docs catalog differs from bundled catalog data; the immutable snapshot run
confirmed the same test fails upstream. No model data was changed to hide it.
Unit/type evidence does not establish native desktop launch, packaged storage
isolation, real inference, signed updates or installer acceptance. Those outcomes
belong to the integration verification report.

## Version diff

0.1.0: separate startup identity/storage, Zuri protocol, manual-only updater,
disabled product analytics and upstream promotional/model refresh. Removed 500+
lines of automatic updater implementation while preserving its IPC names.
