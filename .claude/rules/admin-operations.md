---
paths:
  - src/app/(admin)/**
  - src/components/admin/**
  - src/lib/data/admin.ts
---

# Admin Operations Rules

Admin is a real subsystem, not a miscellaneous dashboard.

## Ops Questions

- what is blocked?
- what needs review first?
- what is risky right now?
- what evidence exists?
- what should happen next?

## UI Rules

- show queues, timestamps, blockers, and next actions
- prefer explicit operational cards over analytics-only views
- preserve auditability for manual overrides

## Verification

- critical queues are visible
- payout/dispute blockers are legible
- no important admin action lacks context or reason capture
