---
paths:
  - src/app/api/payments/**
  - src/lib/stripe/**
  - src/lib/data/bookings.ts
  - src/app/(carrier)/carrier/payouts/**
  - src/app/(admin)/admin/payments/**
---

# Payments + Payouts Rules

Payments are a trust surface first.

## Non-Negotiables

- customer authorization and carrier payout are different moments
- capture should follow completion logic, not vibes
- payout holds must be explained clearly
- refunds and cancellations need durable audit trails

## Product Shape

- no casual in-chat extras
- no hidden funds-flow changes
- no bypassing the booking record as the payment source of truth

## Verification

- authorized -> captured path
- capture failure path
- refund or cancellation path
- webhook replay or idempotency behavior
