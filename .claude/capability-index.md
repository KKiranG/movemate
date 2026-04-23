# MoveMate Capability Index

The canonical map lives in [`AGENTS.md`](/Users/kiranghimire/Documents/moverrr/AGENTS.md) (universal contract) and [`.claude/project-ops.md`](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md) (live-work runbook). `.claude/operating-system.md` is a one-screen Claude cheatsheet that points at both.

Use this file as the fast inventory of rules, roles, navigation files, skills, and commands that currently exist.

## Scoped Rule Coverage Matrix

| Rule | Primary scope | Why it exists |
| --- | --- | --- |
| `frontend-ios.md` | `src/app/**`, `src/components/**`, `src/hooks/**`, `globals.css`, `tailwind.config.ts` | iPhone-first layout, touch, safe-area, and proof-capture rules |
| `backend-marketplace-invariants.md` | `src/lib/**`, `src/app/api/**`, `supabase/**`, `middleware.ts`, `next.config.js` | booking, pricing, capacity, matching, and schema invariants |
| `operations-and-trust.md` | admin, disputes, notifications, payments | manual-first ops, trust, recoverability |
| `docs-and-memory.md` | markdown and memory files | where shared truth belongs and how to keep it clean |
| `search-and-matching.md` | search UI, search API, matching logic | need-first results, explainable ranking, match explanations, zero-match handling |
| `payments-and-payouts.md` | Stripe, webhook, payout, payment admin surfaces | funds flow, payout timing, reconciliation, holds |
| `supabase-schema.md` | `supabase/**`, `src/types/database.ts` | migration, RLS, RPC, rollback, and type sync discipline |
| `analytics-and-metrics.md` | analytics, admin metrics, experiment docs | marketplace questions first, events second |
| `customer-trust.md` | customer search, trip detail, booking, alert surfaces | transparent pricing, trust copy, next-step clarity |
| `carrier-growth.md` | onboarding, posting, templates, carrier home | speed to live supply, repeat posting, quality nudges |
| `admin-operations.md` | admin pages and ops data helpers | queue legibility, ownership, manual override safety |

## Agent Roles

| Role | When to use |
| --- | --- |
| `founder-critic` | scope drift, wedge protection, product tradeoffs |
| `repo-explorer` | read-heavy tracing and exact-file discovery |
| `feature-implementer` | bounded end-to-end changes once scope is understood |
| `verifier` | independent evidence-led verification |
| `docs-keeper` | memory cleanup and instruction alignment |
| `backlog-groomer` | backlog audits, duplicate cleanup, and task-quality review |
| `product-researcher` | product-shape synthesis without code mutation |
| `payments-verifier` | payment, payout, webhook, and ledger verification |
| `mobile-verifier` | 375px, tap target, safe-area, and capture-path checks |
| `schema-reviewer` | migrations, RLS, RPC, and typed contract review |
| `copy-guardian` | wedge-safe product language and trust copy review |

## Navigation and Scope Files

Read these before starting any non-trivial task:

| File | What it answers |
| --- | --- |
| `.claude/CODEBASE-MAP.md` | Where is the file that owns X? What routes exist? What are the migrations? |
| `.claude/MVP-BOUNDARY.md` | Is this feature in scope for the current product cycle? |
| `.claude/DECISION-LOG.md` | Is this architectural question already settled? |

## Skills And Workflows

Core workflows:
- `verify-moverrr-change`
- `docs-memory-sync`
- `booking-safety-audit`
- `ios-touch-audit`
- `experiment-loop`
- `founder-scope-check`
- `release-readiness`
- `dispute-resolution-audit`
- `saved-search-demand-review`
- `verify-web-ui`
- `verify-api`
- `verify-admin-ops`
- `carrier-quality-review`
- `admin-queue-review`
- `metrics-review`
- `copy-guardian`
- `postmortem`
- `experiment-design`
- `chrome-qa-tester`
- `monthly-memory-refactor`
- `write-task`

Implementation and continuity skills:
- `implement-feature` — end-to-end implementation sequence (schema → types → data → API → UI → verify)
- `context-handoff` — session start/end/handoff continuity protocol
- `fix-issue`
- `spec`

## Command Catalog

See `.claude/command-catalog.md` for repeatable commands and workflow semantics.
See [`AGENTS.md`](/Users/kiranghimire/Documents/moverrr/AGENTS.md) for universal invariants, parallelism lanes, review model, verification bar, and escalation policy.
See [`.claude/project-ops.md`](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md) for issue lifecycle, review pipeline, founder digest, and scheduled-agent rules.
