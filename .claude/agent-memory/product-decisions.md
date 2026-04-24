# Product Decision Memory

Compact decisions that future agents should remember without rereading long chats. Canonical product truth still lives in `movemate-product-blueprint.md` and `AGENTS.md`; this file is a scoped memory index.

Format:

`[date] Decision — Scope — Canonical source — Status`

---

## Pricing And Detour

**[2026-04-24] Detour is eligibility, not customer pricing — Scope: matching, carrier posting, customer offer copy — Canonical source: `movemate-product-blueprint.md` §9 and `AGENTS.md` Pricing — Status: settled**

MoveMate does not charge customers per extra kilometre or minute when a carrier would detour. Carriers are independent businesses posting spare capacity on routes they already intend to take; MoveMate informs them about the fit, detour, access, and payout so they can accept or decline. Detour tolerance affects eligibility and ranking only.

Implication: do not add detour surcharges, "per-km extra" logic, Uber-style route pricing, or customer-facing copy that implies the customer pays for the carrier's incremental detour.

## Agent Operating System

**[2026-04-24] Workflow layers are replaceable adapters — Scope: Claude, Codex, Hermes-style orchestration, Jules, Gemini/Antigravity, future tools — Canonical source: `AGENTS.md` Workflow Layer and `AUTHORITY.md` Multi-Tool Policy — Status: settled**

gstack may help when useful, but it is not product authority, task authority, or required infrastructure. Future orchestration should preserve the same GitHub-first issue system, lock groups, review packets, decision packets, and verification bar.

**[2026-04-24] Durable memory must be distilled, scoped, and linked — Scope: project memory, decision logs, founder decisions — Canonical source: `.claude/agent-memory/README.md` and `.claude/rules/docs-and-memory.md` — Status: settled**

Founder input that matters long-term should be converted into a concise decision record and, when behavioral, into a canonical rule. Do not preserve raw chat as operating truth.
