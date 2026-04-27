---
name: postmortem
description: Write a crisp MoveMate postmortem after broken bookings, trust incidents, payment failures, or operational regressions.
when_to_use: Use after incidents, failed launches, production regressions, or support-heavy failures that deserve durable learning.
invocation: manual
---

# Postmortem

Invoke this skill explicitly after a real incident — do not auto-trigger from casual mentions of bugs or errors.

## Format

### Incident
One sentence: what failed, when, for how long.

### Impact
Quantified where possible: N bookings affected, $ held, N customers contacted, N carriers unpaid.

### Timeline
Bullet list: `HH:MM → what happened / what was observed`. Include when the incident started, when it was detected, when it was resolved.

### Root Cause (causal chain)
Work backward from symptom to origin:

```
Symptom → Proximate cause → Contributing factor → Root cause
```

Example:
```
Booking stuck in `pending_payment` →
Webhook not retried after 5xx →
Supabase function timeout on large payload →
Missing index on bookings.created_at
```

### What made detection or recovery harder
Specific gaps only: missing alert, ambiguous log message, wrong runbook step, no rollback path. Do not list generic "could have been better" observations.

### Corrective actions
Each action on one line:

```
- What: <specific change>  Who: <owner>  By: <deadline>  Issue: #<number>
```

### What to keep doing
One or two things that worked and should be preserved. Skip this section if nothing is worth naming.

---

Keep it action-oriented. The goal is learning that prevents the next incident, not a retrospective narrative.
