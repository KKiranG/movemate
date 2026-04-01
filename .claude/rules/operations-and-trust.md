---
paths:
  - src/app/(admin)/**
  - src/components/admin/**
  - src/lib/data/admin.ts
  - src/lib/notifications.ts
  - src/lib/rate-limit.ts
  - src/app/api/admin/**
  - src/app/api/payments/**
  - src/lib/stripe/**
---

# Operations + Trust Rules

Trust is a core feature in moverrr.
Admin, disputes, proof, payments, and notifications should optimize for clarity and recoverability, not automation theater.

## Operating Stance

- Manual-first is acceptable when it reduces marketplace risk
- Admin tools should make edge cases legible, not abstract them away
- Refunds, disputes, and verification actions need clear audit trails
- Do not hide operational uncertainty behind polished UI copy

## Payments

- Customer authorization and carrier payout are different moments
- Webhook handling is trust-critical
- Do not change payout timing or funds flow casually
- When payment behavior changes, verify webhook, booking status, and admin visibility together

## Admin

Admin users need to quickly answer:
- who is blocked
- which carrier needs verification
- which booking is stuck
- what proof exists
- what should happen next

Prefer explicit tables, timestamps, and actions over analytics-heavy surfaces.

## Notifications

- Fire-and-forget is fine for critical-path speed, but error capture still matters
- Notification copy should reinforce trust, next steps, and marketplace logic
- If a workflow depends on a message, confirm the app still behaves sensibly when the message is skipped
