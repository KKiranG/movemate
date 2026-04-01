# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Read Order

1. `CLAUDE.md`
2. The relevant file-scoped rule in `.claude/rules/`
3. The matching domain note in `.agent-skills/`
4. The matching workflow in `.claude/skills/`
5. `.claude/agents.md` if you are choosing roles or delegation

Do not skip the read phase. In this repo, shallow context creates product drift quickly.

## Non-Negotiable Product Context

moverrr is a browse-first spare-capacity marketplace for Sydney's awkward-middle moves.
Carriers post real trips with spare room. Customers browse and book into that inventory.

Never casually turn it into:
- a removalist platform
- a dispatch layer
- a quote engine
- a bidding marketplace
- an AI-matching product

If a request trends there, pause and ask.

## How To Work Here

- Read before editing.
- Keep explore, plan, implement, and verify as separate phases.
- Never delegate understanding; only delegate bounded research or execution.
- Prefer specialized roles over one vague "smart agent."
- Verification is mandatory before claiming done.
- Documentation drift is a bug; update memory files when truth changes.

## Critical Invariants

### Product priorities

Use this order:

**Trust -> Simplicity -> Supply speed -> Customer clarity -> Automation -> Polish**

### iOS rules

- All interactive targets: `min-h-[44px] min-w-[44px]`
- Every `hover:` needs an `active:` sibling
- Proof uploads use `capture="environment"`
- Include `image/heic,image/heif`
- Sticky UI respects safe-area insets
- Test at `375px`

### Pricing and bookings

- Commission is `15%` of `basePriceCents` only
- Booking fee is `$5`
- Booking creation must stay atomic
- `remaining_capacity_pct` must remain correct
- `disputed -> completed` requires a resolved or closed dispute

### Database

- RLS on every new table
- GIST index on every geography column
- `createAdminClient()` for admin-only privileged work
- sequential migrations in `supabase/migrations/`

### Graceful degradation

Local empty-state fallbacks for missing Supabase, email, or Redis config are intentional.
Do not convert them into hard failures without discussion.

## Verification Bar

Run:

```bash
npm run check
```

Then verify the actual change:
- frontend: mobile viewport and tap-state behavior
- backend/API: direct route/logic execution plus an edge case
- pricing/bookings/payments: formula and invariant re-check
- docs: stale-reference and duplication scan

If you could not verify something, say so plainly.

## Agent System

This repo now has a layered agent setup:

- `.claude/agents.md`
  Human-readable overview of how roles should be used
- `.claude/agents/*.md`
  Specialized role briefs
- `.claude/skills/<skill>/SKILL.md`
  On-demand workflows

Favor these role shapes:
- founder/scope critic for product-shape decisions
- explorer for read-heavy surveys
- implementer for bounded execution
- verifier for independent testing
- docs keeper for memory and instruction hygiene
