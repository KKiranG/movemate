---
name: verify-admin-ops
description: Verify admin queues, disputes, payouts, and manual-first operations surfaces independently from implementation.
when_to_use: Use after changes to admin dashboards, dispute handling, verification queues, or payout tooling.
---

# Verify Admin Ops

## Check

- queue visibility: all pending items are surfaced
- blocker clarity: what is blocking each item is legible
- manual action audit trail: actions are logged with actor and timestamp
- payout and dispute edge states: unresolved disputes block completion correctly
- partial failure behavior: one section failing does not crash the full admin view

## Adversarial Probe

Run at least one named probe and report it by name:

- unresolved-dispute-completion: attempt `disputed -> completed` while dispute is still open — confirm it fails
- missing-proof: try to confirm delivery without proof photos — confirm it is blocked
- role-boundary: access an admin route as a non-admin user — confirm 403
- partial-loader-failure: disable one admin data source and confirm the page degrades gracefully

## Report

End every run with:

```
Checks run: [list]
Evidence observed: [queue state, action log, error handling behavior]
Pass / fail / partial: [verdict]
Adversarial probe: [name of probe + what you tried + result]
Residual risk: [anything not verified]
```
