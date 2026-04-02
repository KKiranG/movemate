# moverrr Capability Index

Use `.claude/operating-system.md` for the canonical runtime map, precedence, planning, delegation, permissions, worktrees, verification rules, and review rituals.

Use this file as the fast inventory of what currently exists.

## Scoped Rule Coverage Matrix

| Rule | Primary scope | Why it exists |
| --- | --- | --- |
| `frontend-ios.md` | `src/app/**`, `src/components/**`, `src/hooks/**`, `globals.css`, `tailwind.config.ts` | iPhone-first layout, touch, safe-area, and proof-capture rules |
| `backend-marketplace-invariants.md` | `src/lib/**`, `src/app/api/**`, `supabase/**`, `middleware.ts`, `next.config.js` | booking, pricing, capacity, matching, and schema invariants |
| `operations-and-trust.md` | admin, disputes, notifications, payments | manual-first ops, trust, recoverability |
| `docs-and-memory.md` | markdown and memory files | where shared truth belongs and how to keep it clean |
| `search-and-matching.md` | search UI, search API, matching logic | browse-first fit logic, explainable ranking, weak-inventory handling |
| `payments-and-payouts.md` | Stripe, webhook, payout, payment admin surfaces | funds flow, payout timing, reconciliation, holds |
| `supabase-schema.md` | `supabase/**`, `src/types/database.ts` | migration, RLS, RPC, rollback, and type sync discipline |
| `analytics-and-metrics.md` | analytics, admin metrics, experiment docs | marketplace questions first, events second |
| `customer-trust.md` | customer browse, trip detail, booking, saved-search surfaces | transparent pricing, trust copy, next-step clarity |
| `carrier-growth.md` | onboarding, posting, templates, carrier dashboard | speed to live supply, repeat posting, quality nudges |
| `admin-operations.md` | admin pages and ops data helpers | queue legibility, ownership, manual override safety |

## Agent Roles

| Role | When to use |
| --- | --- |
| `founder-critic` | scope drift, wedge protection, product tradeoffs |
| `repo-explorer` | read-heavy tracing and exact-file discovery |
| `feature-implementer` | bounded end-to-end changes once scope is understood |
| `verifier` | independent evidence-led verification |
| `docs-keeper` | memory cleanup and instruction alignment |
| `product-researcher` | product-shape synthesis without code mutation |
| `payments-verifier` | payment, payout, webhook, and ledger verification |
| `mobile-verifier` | 375px, tap target, safe-area, and capture-path checks |
| `schema-reviewer` | migrations, RLS, RPC, and typed contract review |
| `copy-guardian` | wedge-safe product language and trust copy review |

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

## Command Catalog

See `.claude/command-catalog.md` for repeatable commands and workflow semantics.
See `.claude/operating-system.md` for delegation triggers, plan templates, permission matrix, worktree rules, verification discipline, and review rituals.
