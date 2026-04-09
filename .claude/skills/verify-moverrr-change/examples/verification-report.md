# Example: Verification Report

## Context

Changed: booking status update notification in `src/lib/data/bookings.ts` — added customer email on `confirmed`.

## Checks Run

1. `npm run check` — pass (0 TypeScript errors, 24 tests passed)
2. Triggered a booking confirmation via the API — confirmed the `confirmed` state email was sent
3. Adversarial: attempted `cancelled -> confirmed` (invalid transition) — status machine rejected with 400

## Evidence Observed

- TypeScript: zero errors
- Tests: 24 passed, 0 failed
- Email: received with booking reference `BK-001`, route "Bondi → CBD", date, price, and "what happens next" section
- Status machine: correctly blocked `cancelled -> confirmed` with `400 Invalid transition`

## Pass / Fail / Partial

**Pass**

## Adversarial Probe

**Probe name:** duplicate-webhook-replay

**What I tried:** Replayed the `payment_intent.succeeded` webhook event twice.

**Result:** Second call returned `200` with no state change (idempotent). No duplicate email or double-capture.

## Residual Risk

Email delivery in production depends on Resend DNS wiring which was not verified in local env (`{ skipped: true }` is the expected local fallback). Verify in staging with real Resend credentials before shipping.
