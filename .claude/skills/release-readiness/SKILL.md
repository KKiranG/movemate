---
name: release-readiness
description: Run a final release-readiness pass across docs, verification, key trust flows, and open risk before a serious deploy or launch push.
when_to_use: Use before deploys, launch-day pushes, or any task that meaningfully changes trust, bookings, payments, search, or core marketplace flows.
---

# Release Readiness

1. Read `CLAUDE.md` and the relevant scoped rules.
2. Run `npm run check`.
3. Verify the changed surface directly.
4. Check docs and memory for drift.
5. List open risks that still need conscious acceptance.

Close with:
- ship-ready / not ship-ready
- evidence
- residual risk
