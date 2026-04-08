# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Product Thesis

moverrr is an iOS-first, browse-first spare-capacity marketplace.
Carriers post trips that are already happening and sell the spare room.
Customers browse that real inventory and book into it.

This product is explicitly not:
- a removalist booking business
- a courier dispatch system
- a quote-comparison funnel
- a bidding marketplace
- an AI-matching product

If a request pushes moverrr toward one of those shapes, stop and ask before building.

## Product Priorities

Use this order when making tradeoffs:

**Trust -> Simplicity -> Supply speed -> Customer clarity -> Automation -> Polish**

Keep the savings story legible:
"You save because your item fits into a trip that is already happening, and you accepted some flexibility."

## Session Discipline

- Read first. Understand the current code, docs, and shipped behavior before proposing changes.
- Keep explore, plan, implement, and verify as separate jobs.
- Use `/clear` between unrelated tasks.
- Use `/compact Focus on <area>` when the task continues but the context is noisy.
- Use `/btw` for quick side questions that should not enter the main working history.
- If you have been corrected twice on the same issue, reset with `/clear` and restart from the learned constraint.
- Use specialists for read-heavy or high-risk work instead of letting one agent do everything.

## Working Rhythm

1. Read the relevant code and project memory first.
2. Keep modes separate and avoid fuzzy half-planning.
3. Verify before claiming done.
4. Sync docs, rules, skills, or memory in the same task when truth changes.
5. Backlog work is governed by `@TASK-RULES.md`; read it before writing or changing backlog items.

Stale documentation is a product bug.

## Instruction Order

1. system / developer / explicit user instruction
2. `CLAUDE.md`
3. the narrowest matching `.claude/rules/*.md`
4. the matching `.agent-skills/*.md`
5. the invoked `.claude/skills/<skill>/SKILL.md`
6. nearby task or reference docs

Tie-breakers:
- narrower scope beats broader scope
- shipped code and verified behavior beat stale prose
- if two sources still disagree on a trust-critical area, stop and resolve it before building

## Core Invariants

### iOS-first contract

- all tap targets: `min-h-[44px] min-w-[44px]`
- every `hover:` needs an `active:` sibling
- proof/photo capture: `capture="environment"`
- file types include `image/heic,image/heif`
- sticky/fixed UI respects `env(safe-area-inset-bottom)`
- minimum viewport: test at `375px`

### Pricing

Do not change commission math without an explicit discussion.

```text
Customer pays:   base + stairs_fee + helper_fee + $5 booking_fee
Carrier earns:   base + stairs_fee + helper_fee - (base * 15%)
Platform earns:  (base * 15%) + $5 booking_fee
```

Critical rule: commission applies only to `basePriceCents`, never to stairs or helper fees.

Primary files:
- `src/lib/pricing/breakdown.ts`
- `src/lib/__tests__/breakdown.test.ts`

### Booking and dispute flow

- pure transition map: `src/lib/status-machine.ts`
- actor and business guards: `src/lib/data/bookings.ts`
- `disputed -> completed` requires dispute state `resolved` or `closed`
- booking creation must use the atomic RPC path
- `remaining_capacity_pct` must stay correct when bookings change

### Matching

- matching stays deterministic and explainable
- no AI bidding, opaque ranking, or hidden negotiation logic

### Graceful degradation

These local-development fallbacks are intentional:
- `hasSupabaseEnv()` may return empty arrays instead of throwing
- email sending may return `{ skipped: true }` when config is missing
- rate limiting may fall back to an in-memory `Map`

Production startup validation lives in `src/lib/env.ts` and `next.config.js`.

### Database and admin access

- every new table must have RLS
- every geography column must have a GIST index
- admin-only operations use `createAdminClient()`
- migrations go in `supabase/migrations/` with sequential names
- do not bypass RLS for convenience in non-admin code

## Verification Minimum

Before finishing any meaningful task:

```bash
npm run check
```

Then verify the changed surface directly:
- frontend: `375px`, active states, safe area, proof uploads
- backend/API: direct path execution plus one edge case
- booking/pricing/payments: pricing identity plus status/capacity invariants
- database: RLS, indexes, and migration intent
- docs/agent memory: stale paths, duplicate truth, contradiction scan

If verification did not happen, say so plainly.

## Memory Map

Use the smallest layer that fits the job:
- `CLAUDE.md` for global product truth
- `.claude/rules/*.md` for scoped instructions
- `.agent-skills/*.md` for domain facts
- `.claude/skills/<skill>/SKILL.md` for repeatable workflows
- `.claude/operating-system.md` for the canonical runtime map
- `.claude/capability-index.md` for the quick inventory
- `.claude/agents.md` and `.claude/agents/*.md` for specialist role guidance

Keep the always-loaded layer lean.
