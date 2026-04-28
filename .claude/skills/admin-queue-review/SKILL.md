---
name: admin-queue-review
description: Review the current admin queue and return decisions on disputes, verification, payouts, stuck bookings, and urgent follow-ups.
when_to_use: Use for daily or weekly ops review on MoveMate's manual-first admin surfaces.
background: true
---

# Admin Queue Review

## Load First

Before reviewing, orient with live context:

```bash
git log --oneline -5
```

Then read `.agent-skills/ADMIN.md` for current manual-ops rules, verification thresholds, and queue priorities.

## Review Framework

For each queue item, decide:
- **Act now** — dispute has evidence, payout is overdue, booking is stuck > 24h
- **Watch** — item is aging but not yet at threshold
- **Close** — already resolved, duplicate, or outside MoveMate responsibility

Checklist per item:

1. What is the booking state? Is it stuck in an unexpected state?
2. Is there customer or carrier evidence attached (photo, message, timestamp)?
3. Is a payout overdue or a hold expiring without action?
4. Does this need a founder decision, or can ops resolve it within the standard runbook?

## Queue Types

- **Dispute** — customer or carrier raised a formal dispute; needs evidence review and resolution decision
- **Payout** — carrier payout is delayed, held, or in an unexpected state
- **Verification** — ABN, insurance, or identity check is pending manual sign-off
- **Stuck booking** — booking is in a transitional state (e.g. `pending`, `delivered`) beyond the expected window

## Output Format

For each item:

```
Item: <booking ID or queue ID>
Queue: dispute / payout / verification / stuck
Age: <hours or days since created>
State: <current booking or queue state>

Evidence: present / absent / partial
Decision: act now / watch / close
Action: <specific step — who does what>
Blocker: <what prevents resolution, if any>
```

End with a summary count: N act-now / N watch / N close.
