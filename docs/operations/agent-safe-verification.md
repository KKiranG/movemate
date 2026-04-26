# Agent-Safe Verification Contract

Use this contract before and after autonomous code changes. It exists to prove the app can use its configured services, not merely that environment variables are present.

## Local environment

- Run from the active repo root: `/Users/kiranghimire/Documents/movemate`.
- Use `.env.local` for local development. Do not use production credentials locally.
- Start the app on port 3000 with `npm run dev -- --port 3000`.
- `NEXT_PUBLIC_APP_ENV` must be `development` for local work, `preview` for preview deploys, and `production` only for production.
- Do not copy values from `.env.local` into PRs, issues, docs, logs, or chat.

## Current service contract

- Supabase: local validation may use the configured cloud development project. The anon key is browser-safe; `SUPABASE_SERVICE_ROLE_KEY` is server-only and must only be referenced from server routes, server data modules, scripts, tests, or Supabase functions.
- Stripe: local validation must use test-mode keys only. `STRIPE_SECRET_KEY` must start with `sk_test_`; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must start with `pk_test_`. Never run local agent checks with live keys.
- Stripe webhooks: `STRIPE_WEBHOOK_SECRET` must be set for webhook replay or local tunnel checks. Full webhook validation requires `stripe listen --forward-to localhost:3000/api/payments/webhook` and the matching local webhook secret.
- Google Maps: local validation is currently mock/degraded by configuration. `NEXT_PUBLIC_GOOGLE_MAPS_KEY` and `GOOGLE_MAPS_API_KEY` may be blank when `E2E_MOCK_MAPS=true`. Agents must not assume real Places autocomplete or geocoding unless one of those keys is configured and a live Maps probe passes.
- Redis/Upstash: optional for local validation. If absent, rate limiting falls back to in-memory behavior; `/api/health` reports Redis as `not_configured`.
- Email, Sentry, VAPID, and Redis are optional for local UI/code validation unless a change directly touches those integrations.

## Mandatory local checks

Run these before opening a PR or handing work to another agent:

1. `npm run env:check`
2. `npm run check`
3. `npm run test`
4. `npm run build`
5. `npm run dev -- --port 3000`
6. `curl -i http://localhost:3000/api/health`
7. Browser-load `/`, `/move/new`, `/auth/login`, `/auth/signup`, and `/carrier`

One-command automation for steps 1-4: `npm run verify:local`

Expected local health result with the current contract:

- `env: ok`
- `supabase: ok`
- `stripe: ok`
- `redis: not_configured` or `ok`
- HTTP `200` when only optional Redis is not configured

## Live-service probes

Use probes that exercise the service, not only env presence:

- Supabase: perform a head select against `capacity_listings` with the anon client and with the service-role server client. Both must succeed for live Supabase-backed validation.
- Stripe: retrieve test-mode balance with the configured secret key. This must succeed and the key prefixes must remain test-mode.
- Maps: if real Maps keys are configured, verify browser Places script loading and server geocoding. If keys are blank and `E2E_MOCK_MAPS=true`, record Maps as intentionally mocked/degraded.
- Webhooks: use Stripe CLI forwarding before claiming webhook handling is end-to-end verified.

## E2E verification (Playwright)

Before running E2E tests:

1. Fill `.env.e2e.local` from `.env.e2e.example`.
2. Run `npm run supabase:reset` (local) or `npm run e2e:reset` (cloud dev) to seed data.
3. Run `npm run e2e:install` once to download browser binaries.
4. Run `npm run verify:e2e:preflight` — must pass before `npm run e2e`.

E2E test coverage (see `tests/e2e/`):

- `public-smoke.test.ts` — `/`, `/move/new`, `/api/health`, `/auth/login`, `/auth/signup`, `/carrier`
- `auth-smoke.test.ts` — customer and carrier login/logout, redirect guards
- `customer-move.test.ts` — move wizard, zero-match alert path
- `carrier-trip.test.ts` — trip wizard, trips list, requests list
- `booking-visibility.test.ts` — bookings list, carrier requests, booking detail
- `payment-intent.test.ts` — Stripe test-mode health; webhook gate (requires Stripe CLI)

## Preview and production

- Preview env vars must be managed in Vercel, not copied from `.env.local` unless they are explicitly development/test credentials.
- Preview deploys are validation environments, not trusted cron runners.
- Production must pass `npm run env:check:production` and must not use test Stripe keys.
- Do not run smoke bootstrap, seed, reset, or destructive Supabase commands against production.
- Do not change `vercel.json` cron policy without explicit deploy-policy review.

## When validation fails

- If env keys are missing, stop and report the missing names only. Do not invent placeholders or switch to production.
- If a live service probe fails, classify it as missing credential, bad credential, service unavailable, RLS/schema issue, or code bug.
- If a flow is mocked, say so in the PR and identify the flag or fallback that makes it intentional.
- If port 3000 is occupied, stop the conflicting local server if it belongs to this repo; otherwise use a different port and report the deviation.
