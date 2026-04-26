# E2E Readiness Todo

This is the missing work to move MoveMate from local smoke verification to repeatable end-to-end validation with test data.

## Current state (updated 2026-04-27)

- Playwright harness added: `playwright.config.ts`, `tests/e2e/`, `npm run e2e`.
- `.env.e2e.example` created — copy to `.env.e2e.local` to activate.
- `npm run verify:e2e:preflight` script validates environment before E2E runs.
- `npm run e2e:reset` provides safe idempotent cloud-dev reset.
- `npm run verify:local` one-command automation for the mandatory local checks.
- Local app startup works on port 3000.
- `/api/health` proves configured Supabase and Stripe test-mode access.
- Supabase seed data exists for a customer, carrier, active listing, and authorized booking in `supabase/seed.sql`.
- Google Maps is intentionally mocked/degraded locally through `E2E_MOCK_MAPS=true`.
- Stripe webhooks have unit/replay coverage but full local webhook delivery needs Stripe CLI forwarding.

## Shipped (this PR)

- [x] Playwright installed (`@playwright/test ^1.49.0`) with `playwright.config.ts`
- [x] `npm run e2e`, `e2e:headed`, `e2e:install` scripts
- [x] `.env.e2e.example` with full safety contract comment
- [x] `npm run verify:e2e:preflight` — pre-run gate
- [x] `npm run verify:local` — one-command local verification (steps 1-4)
- [x] `npm run e2e:reset` — cloud dev safe reset script
- [x] E2E helpers: `tests/e2e/helpers/seed.ts`, `auth.ts`, `maps.ts`
- [x] `tests/e2e/public-smoke.test.ts` — P0: /, /move/new, /api/health, /login, /signup, /carrier
- [x] `tests/e2e/auth-smoke.test.ts` — P0: customer + carrier login/redirect guards
- [x] `tests/e2e/customer-move.test.ts` — P0: wizard, zero-match path
- [x] `tests/e2e/carrier-trip.test.ts` — P0: trip wizard, trips, requests, dashboard
- [x] `tests/e2e/booking-visibility.test.ts` — P0: bookings list, carrier requests, detail
- [x] `tests/e2e/payment-intent.test.ts` — P1: Stripe test-mode health, webhook gate

## You need to do (one-time setup)

1. Copy `.env.e2e.example` → `.env.e2e.local` and fill in the values.
2. Run `npm run e2e:install` once to download Playwright's Chromium binary.
3. Run `npm run supabase:reset` (local) or `npm run e2e:reset` (cloud dev) to seed test data.
4. Run `npm run verify:e2e:preflight` — must pass before `npm run e2e`.
5. For webhook E2E: run `stripe listen --forward-to localhost:3000/api/payments/webhook` and add the printed secret to `.env.e2e.local` as `STRIPE_WEBHOOK_SECRET`.

## Still open (P1 / P2)

- [ ] Real Maps E2E — add `E2E_MOCK_MAPS=false` + real `NEXT_PUBLIC_GOOGLE_MAPS_KEY` in `.env.e2e.local` and run the `@real-maps` tagged tests.
- [ ] Stripe webhook delivery E2E — run `stripe listen`, set `STRIPE_WEBHOOK_SECRET`, then run payment-intent.test.ts `@webhook` group.
- [ ] E2E_BOOKING_REQUEST_ID — set after `e2e:reset` to enable the payment intent creation test.
- [ ] Preview E2E — set `E2E_BASE_URL=https://<preview-url>` to run against a Vercel preview.
- [ ] P2: Upload flow fixture test (small file, `tests/e2e/upload.test.ts`).
- [ ] P2: Admin smoke — verification queue and payments dashboard.

## Do not claim E2E-ready until

- `npm run check` passes.
- `npm run test` passes.
- `npm run build` passes.
- `npm run verify:e2e:preflight` passes.
- All P0 tests in `tests/e2e/` pass against a seeded dev Supabase project.
- Maps mode is explicitly recorded as mocked or real.
- Stripe webhook delivery is either tested with Stripe CLI or listed as a residual risk.
