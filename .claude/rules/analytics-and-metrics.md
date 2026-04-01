---
paths:
  - src/lib/analytics.ts
  - src/app/api/search/route.ts
  - src/app/api/bookings/route.ts
  - src/app/(admin)/admin/dashboard/**
  - src/lib/data/admin.ts
---

# Analytics + Metrics Rules

Metrics should answer marketplace questions, not create dashboard theater.

## Primary Questions

- are carriers posting supply faster?
- are customers finding believable trips?
- are bookings completing cleanly?
- where is founder ops pain accumulating?

## Rules

- prefer event names tied to real product states
- idempotency matters more than volume
- decision outputs beat metric dumps
- keep analytics off the critical path when possible

## Verification

- dedupe or replay guard on important events
- clear naming and ownership
- admin surfaces should lead to actions, not vanity numbers
