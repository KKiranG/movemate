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

## Review

Return:
- items needing action now
- items that can wait
- owners or next actions
- blockers and trust risks

Prefer an action list over a dashboard summary.
