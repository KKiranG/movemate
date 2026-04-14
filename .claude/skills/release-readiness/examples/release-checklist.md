# Example: Release Checklist

## Context

Deploying: carrier Stripe Connect onboarding flow (`POST /api/carrier/stripe/connect-start`, `GET /api/carrier/stripe/connect-return`)

## Checklist

### Docs and Memory
- [x] `CLAUDE.md` invariants unchanged by this change
- [x] `.agent-skills/PAYMENTS.md` updated with Connect flow details
- [x] `docs/operations/todolist.md` items completed and moved to `docs/operations/completed.md`
- [x] `command-catalog.md` updated with new Connect routes

### Verification
- [x] `npm run check` — pass (0 errors, all tests green)
- [x] Stripe Connect happy path: carrier completes onboarding end to end in staging
- [x] `account.updated` webhook received and `stripe_onboarding_complete` persisted
- [x] Return URL re-check works after dropped connection mid-onboarding

### Trust Flows
- [x] Carrier sees a clear CTA to complete payout setup on their dashboard
- [x] Failed or incomplete Connect state shows a retryable "Set up payouts" prompt
- [x] Admin carrier detail shows payout-ready status, not raw Stripe account details

### Open Risks

| Risk | Mitigation |
|------|-----------|
| Stripe Express account creation latency | Retry logic in `connect-start` route with 500ms backoff |
| Carrier drops browser mid-flow and loses return URL | `connect-return` re-checks account capabilities on every visit |
| Stripe env vars not set in production | `src/lib/env.ts` validates at startup — deploy will fail loudly |

## Adversarial Probe

**Probe name:** missing-stripe-config

**What I tried:** Removed `STRIPE_SECRET_KEY` from local env and ran the connect-start route.

**Result:** App threw a startup validation error from `src/lib/env.ts` — never reached the route handler. Correct behavior.

## Verdict

**Ship-ready** — all checks pass, residual risks are documented and mitigated by existing code.
