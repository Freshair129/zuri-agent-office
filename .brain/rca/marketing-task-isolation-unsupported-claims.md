---
status: active
superseded_by: null
version: 0.1.0
---

# Unsupported claims after fresh-session editing

Date: 2026-10-06 (Asia/Bangkok). Investigation status: observed acceptance failure confirmed; model-internal cause unresolved. No product fix is claimed or implemented.

## Symptom

Snapshot 5.0.7 B completed all required reads and output formatting, but introduced unsupported product behavior while editing a grounded A draft. Both automatic task results are AUTOMATED_CHECKS_PASS; final experiment acceptance is FAIL after manual review.

## Evidence

Run `output/playwright/marketing-isolation-1791247321616`:

- A: `ses_ef1542bc8ffeQyVpdZEUuhN6ke`, 624 characters, output SHA-256 `096ca7aa79f800710d240fc3fa13fa2e14c7715d59ab5030196ae82a2a22b0c9`. Its full output matched the supplied local-desktop category, consultant audience, grouping-by-client and daily-checklist facts. Manual review passed before B was prepared.
- B: `ses_ef151b5ceffeMNnAIWkUqUGlJN`, parent `msg_10eae4a4e00178406TScsya7Nj`, final `msg_10eae9b4d0010DlIk1wzzncWV2`, 1187 characters, output SHA-256 `77aad326994ad053990e9da6b993e6e24e56b722ec9160a972374252a69fa332`.
- Actual completed reads under B's parent include product context, copy-editing SKILL.md and the exact read-only A artifact. Its final adds “without needing to juggle spreadsheets or cloud dependencies” and “presents a new checklist every morning.” The fixture and A draft contain neither claim.
- Explanation 1 accurately describes removing “your” from the headline. Explanation 2 says the added spreadsheet wording stays within established facts, which is unsupported, and omits the new morning behavior.
- The read skill has a “no spreadsheets” example in its anti-pattern table at line 371. This overlap is not sufficient to establish copying or model-internal causality. The cloud/morning statements have no established source.
- Six requests across two isolated sessions: exact qwen3.5:9b, explicit none, baseline pass-through, HTTP 200, zero parser errors/reasoning characters. Context 32768, no truncation. Draft and 44 control hashes verified. No retries, output substitution or other-parent read credit.

## Root Cause

The directly established cause of acceptance failure is unsupported semantic expansion in B's final text. “Local desktop” does not establish absence of cloud dependencies; “shows a daily checklist” does not establish morning generation/reset. These changes are present in the actual model answer, not introduced by the reviewer or evidence exporter.

Why the model made those changes is unresolved. This experiment does not isolate the influence of examples, instructions, sampling, history or model weights. It does not establish that session isolation is a general fix or that the integration is responsible.

## Why the issue escaped detection

It did not escape final acceptance: the required manual grounding gate rejected B. Automatic checks intentionally verify exact reads, model identity, sections, CTA, marker and explanation count; they are not semantic factuality checks. Promoting AUTOMATED_CHECKS_PASS to overall PASS would bypass the approved contract.

## Proposed prevention

Retain manual claim-to-context review and exact A-to-B edit review before accepting or publishing copy. Keep formatting/reads separate from factuality in reports. Do not weaken checks, patch the generated answer, retry this exhausted experiment or infer a product fix. Any future automated claim validation or product workflow change needs a separate scoped proposal under R5.
