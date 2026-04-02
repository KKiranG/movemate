# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Thesis

moverrr is an iOS-first, browse-first spare-capacity marketplace.
Carriers post trips that are already happening and sell the spare room.
Customers browse that real inventory and book into it.

This product is explicitly **not**:
- a removalist booking business
- a courier dispatch system
- a quote-comparison funnel
- a bidding marketplace
- an AI-matching product

If a request pushes moverrr toward one of those shapes, stop and ask before building.

## Founder Operating Stance

Use this priority order when making tradeoffs:

**Trust -> Simplicity -> Supply speed -> Customer clarity -> Automation -> Polish**

That means:
- recurring carrier supply matters more than broad feature count
- manual-first operations are acceptable if they buy speed and learning
- a clear savings story matters more than clever algorithms
- the smallest shippable version is usually the right version

The value proposition that must stay legible:

> "You save because your item fits into a trip that is already happening, and you accepted some flexibility."

## Working Rhythm

Serious work in this repo follows this sequence:

1. **Read first.** Understand the current code, the relevant docs, and the real shipped behavior before proposing changes.
2. **Keep modes separate.** Explore, plan, implement, and verify are different jobs. Do not collapse them into one fuzzy pass.
3. **Never delegate understanding.** You can delegate research or execution, but the coordinating agent must still synthesize the problem and decide the change.
4. **Verify before claiming done.** Passing narration is not enough. Run `npm run check` and targeted flow verification for the area you touched.
5. **Keep memory in sync.** If a product rule, flow, command, or invariant changes, update the relevant `.claude/rules/`, `.claude/skills/`, or `.agent-skills/` file in the same task.

Stale documentation is a product bug.

## Instruction Precedence

When instructions appear to conflict, use this order:

1. system / developer / explicit user instruction
2. `CLAUDE.md`
3. the narrowest matching `.claude/rules/*.md`
4. the matching `.agent-skills/*.md`
5. the invoked `.claude/skills/<skill>/SKILL.md`
6. nearby task or reference docs

Tie-breakers:
- narrower scope beats broader scope
- shipped code and verified behavior beat stale prose
- if two sources still disagree on a trust-critical area, stop and resolve the ambiguity before building

## Core Invariants

### iOS-first contract

This ships as an iOS native app. The web app is a development surface.

Non-negotiable UI rules:

| Rule | Enforcement |
| --- | --- |
| All tap targets | `min-h-[44px] min-w-[44px]` |
| Touch feedback | Every `hover:` state needs an `active:` sibling |
| Proof/photo capture | `capture="environment"` |
| File types | Include `image/heic,image/heif` |
| Sticky/fixed UI | Respect `env(safe-area-inset-bottom)` |
| Scroll containers | `overscroll-behavior: contain` |
| Minimum viewport | test at `375px` width |

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

- The pure transition map lives in `src/lib/status-machine.ts`.
- Actor and business guards live in `src/lib/data/bookings.ts`.
- `disputed -> completed` requires the dispute to be `resolved` or `closed` in the application layer.
- Booking creation must use the atomic RPC path, not a two-step read-then-write flow.
- `remaining_capacity_pct` must stay correct whenever a booking is created or cancelled.

### Matching

Matching stays deterministic and explainable.
No AI bidding, no opaque ranking, no hidden negotiation logic.

Primary files:
- `src/lib/matching/filter.ts`
- `src/lib/matching/score.ts`
- `src/lib/matching/rank.ts`

### Graceful degradation

These local-development fallbacks are intentional and should not be "fixed" into hard failures:

- `hasSupabaseEnv()` may return empty arrays instead of throwing
- email sending may return `{ skipped: true }` when config is missing
- rate limiting may fall back to an in-memory `Map`

Production startup validation lives in `src/lib/env.ts` and `next.config.js`.

### Database and admin access

- Every new table must have RLS
- Every geography column must have a GIST index
- Admin-only operations use `createAdminClient()`
- Migrations go in `supabase/migrations/` with sequential names
- Do not bypass RLS for convenience in non-admin code

## Verification Minimum

Before finishing any meaningful task:

```bash
npm run check
```

Then run targeted verification for the area you changed:
- frontend: mobile viewport at 375px, active states, safe area, proof uploads
- backend/API: hit the path directly and test at least one edge case
- booking/pricing/payments: re-check the pricing identity and status/capacity invariants
- database: verify RLS, indexes, and migration intent
- docs/agent memory: check for duplication, stale references, and drift

Do not report work as done if verification did not happen. State what you verified and what you could not verify.

## Project Memory Map

Use the smallest layer that fits the job:

- `CLAUDE.md`
  Global product truth and repo-wide invariants.
- `.claude/rules/*.md`
  Scoped memory that should only load when relevant files are touched.
- `.agent-skills/*.md`
  Concise domain references for flows, constraints, and subsystem truth.
- `.claude/skills/<skill>/SKILL.md`
  Reusable runbooks for repeatable workflows.
- `.claude/agents.md`
  Agent system overview and role guidance.
- `.claude/agents/*.md`
  Declarative role briefs for specialized agents.

Keep the always-loaded layer lean.
If detail is only relevant for one surface, move it into a scoped rule, skill, or agent brief instead of growing `CLAUDE.md`.

## Start Here

When the task touches a specific area, read the matching memory before coding:

- UI or mobile polish -> `.claude/rules/frontend-ios.md`
- backend, pricing, booking, matching, API, or migrations -> `.claude/rules/backend-marketplace-invariants.md`
- admin, trust, ops, payments, or notifications -> `.claude/rules/operations-and-trust.md`
- docs, prompts, skills, or project memory -> `.claude/rules/docs-and-memory.md`

Then read the relevant `.agent-skills/` file and, if needed, invoke the matching skill under `.claude/skills/`.

## Rule Standard

Scoped rule files should:

- use lowercase kebab-case names
- own one coherent subsystem, not a grab bag
- keep `paths` frontmatter narrow enough that the rule loads only when it should
- state invariants, workflow expectations, and verification checks, not vague advice

## Bigger Task Gate

For any task with three or more major sub-parts:

- write an explicit plan before implementation
- include a verification lane in that plan
- use a specialized verifier or second opinion on payments, booking state, schema, or trust-sensitive work

For bug fixes, reproduce first, then fix, then confirm the reproduction no longer succeeds.
