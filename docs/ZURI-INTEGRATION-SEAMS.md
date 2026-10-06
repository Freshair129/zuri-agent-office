---
status: active
superseded_by: null
version: 0.1.0
---

# Memory and knowledge integration seams

The current MVP persists locally. No MSP/GKS connection is implemented or advertised as active.

| Current boundary | Actual flow | Future boundary, subject to contract |
|---|---|---|
| `src/main/hive.ts` HiveManager | root -> per-agent identity.md/memory.md/inbox/outbox and tasks.json; main `hive:*` IPC -> preload -> renderer | MSP adapter for authorized identity/episodic reads/writes; retain local persistence until explicit migration |
| `src/main/memory.ts` MemoryManager | optional MemPalace CLI; `MEMPALACE_PALACE_PATH`; mines agent Markdown into searchable wings | Optional semantic retrieval adapter; unavailable CLI must remain distinguishable from empty results |
| `src/main/knowledge.ts` KnowledgeManager | active/env/status/search/ingestFile/ingestText -> kg-core.cjs; default userData/knowledge; resources/kg.cjs shares core | GKS retrieval/ingestion port with authoritative source IDs and provenance; never treat conversational memory as canonical knowledge |
| `src/main/integrations.ts` + IntegrationBroker | encrypted secret reference -> main-only materialization -> provider process/request | Reuse bounded credential authority for a future integration; no keys in renderer/config/log |

MSP/GKS references in the design repository are conceptual direction, not a runtime contract installed in this checkout. No object storage is needed for local files. Before future integration, specify ownership, scope authorization, schemas, timeout/error behavior, provenance, erase/export rules and meaningful live acceptance. Preserve the distinction between operational task state, agent memory and retrieved knowledge.
