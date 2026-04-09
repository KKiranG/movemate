---
name: release-readiness
description: Run a final release-readiness pass across docs, verification, key trust flows, and open risk before a serious deploy or launch push.
when_to_use: Use before deploys, launch-day pushes, or any task that meaningfully changes trust, bookings, payments, search, or core marketplace flows.
effort: high
invocation: manual
---

# Release Readiness

Invoke this skill explicitly before deploying — do not auto-trigger from casual conversation.

See `examples/release-checklist.md` for a worked example.

1. Read `CLAUDE.md` and the relevant scoped rules.
2. Run `npm run check`.
3. Verify the changed surface directly.
4. Check docs and memory for drift.
5. List open risks that still need conscious acceptance.

## Adversarial Probe

Run at least one named probe on the changed surface:

- trust-flow: walk the booking or payment path end to end with a real-looking input
- role-boundary: confirm a customer cannot access carrier or admin surfaces
- missing-config: confirm the app degrades gracefully when Stripe or Resend config is absent

Close with:

```
Verdict: ship-ready / not ship-ready
Evidence: [what you checked and saw]
Residual risk: [what remains unverified and why it is acceptable or not]
```
