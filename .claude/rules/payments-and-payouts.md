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

- payment authorised when customer submits the request; captured when the driver accepts; held through delivery and any dispute window; released on customer confirmation or 72-hour proof-backed auto-release
- authorisation and capture are distinct events — do not conflate them
- customer payment and carrier payout are distinct moments — do not conflate them
- proof-pack requirements gate status and payout progression
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
