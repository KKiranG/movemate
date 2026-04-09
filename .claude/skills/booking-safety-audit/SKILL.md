---
name: booking-safety-audit
description: Protect moverrr's booking-critical paths when changing pricing, booking creation, payment flow, dispute handling, status transitions, or capacity logic.
when_to_use: Use when the task touches bookings, pricing, payouts, payment intents, webhooks, disputes, booking states, capacity, or Supabase booking functions. Examples: "fix booking bug", "change payout logic", "update booking statuses", "touch create_booking_atomic", "edit booking API", or "modify commission math".
paths:
  - src/lib/data/bookings.ts
  - src/lib/pricing/**
  - src/lib/status-machine.ts
  - src/app/api/bookings/**
  - src/app/api/payments/**
  - src/lib/stripe/**
  - supabase/migrations/**
  - src/types/database.ts
effort: high
---

# Booking Safety Audit

This is a high-risk workflow. Small mistakes here can break trust, funds flow, or inventory truth.

See `examples/pricing-check.md` for a worked example of the commission identity check.

## Read Before Editing

- `src/lib/pricing/breakdown.ts`
- `src/lib/data/bookings.ts`
- `src/lib/status-machine.ts`
- the relevant booking/payment migration
- `src/types/database.ts` if schema or RPC types are involved

## Invariants To Preserve

- commission is `15%` of `basePriceCents` only
- booking fee is `$5`
- `total = payout + commission + booking_fee`
- booking creation stays atomic
- `remaining_capacity_pct` stays correct after booking creation and cancellation
- `disputed -> completed` only after the dispute has actually been resolved or closed

## Typical Failure Modes

- applying commission to stairs or helper fees
- reintroducing two-step booking creation
- updating the pure state machine with business-layer concerns
- forgetting capacity recalculation
- changing webhook or payout behavior without syncing booking state handling

## Verification

Minimum verification for this skill:

1. `npm run check`
2. re-check the pricing identity
3. walk one happy-path status transition
4. try one adversarial case:
   a duplicate booking attempt, invalid transition, resolved-vs-unresolved dispute, or incorrect capacity assumption
