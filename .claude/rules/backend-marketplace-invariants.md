---
paths:
  - src/lib/**
  - src/app/api/**
  - src/types/**
  - supabase/**
  - middleware.ts
  - next.config.js
---

# Backend Marketplace Invariants

IMPORTANT: backend changes can quietly distort the marketplace if they ignore business invariants. Protect the product shape, not just the code path.

## Booking + Pricing

- Pricing formula lives in `src/lib/pricing/breakdown.ts`
- Commission is `15%` of `basePriceCents` only — never applied to stairs, helper, or detour add-ons
- Booking fee is `$5`
- GST is `10%` of `(subtotal + platform_fee)` — always collected on top, never absorbed
- The pricing identity must hold: `total = carrier_payout + platform_fee + gst + booking_fee`

## Fast Match Atomicity

- When one carrier accepts a Fast Match booking request, all sibling requests in the same `request_group_id` must be atomically revoked
- No race condition: first accept wins and the group is closed
- Non-accepted carriers must be notified of revocation

## Booking State + Capacity

- State transitions are pure in `src/lib/status-machine.ts`
- Actor and business guards live in `src/lib/data/bookings.ts`
- Booking creation must stay atomic
- `remaining_capacity_pct` must stay correct after create and cancel events
- `disputed -> completed` only after dispute resolution is confirmed in the application layer

## Matching

- Matching stays deterministic and explainable
- Hard eligibility disqualifiers must remain explicit and enforced
- Do not introduce opaque AI ranking or negotiation behavior
- match_class labels are deterministic string templates — never free text

## Condition Adjustment

- Carrier can trigger at most one ConditionAdjustment per booking
- Reasons and amounts are platform-defined enums — no freeform input
- One round only: customer accepts or rejects; no second adjustment

## API + Validation

- Validate before DB work
- Keep auth guards near the boundary
- Use `AppError` and consistent API error responses
- Analytics and email should stay off the critical path where possible

## Database

- Every new table gets RLS
- Every geography column gets a GIST index
- Use sequential migrations
- Admin-only privileged work uses `createAdminClient()`

## Graceful Degradation

These behaviors are intentional for local development:
- empty-array fallbacks when Supabase env is missing
- skipped email sends when email config is absent
- in-memory rate-limit fallback when Redis is absent

Do not convert those into hard failures without an explicit reason.
