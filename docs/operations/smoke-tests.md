# MoveMate Smoke Tests

GitHub issues, pull requests, and release comments are the execution record.
Use this page as the repeatable preview and production checklist.

## Pre-merge baseline

Run the baseline locally or in a clean branch environment before asking for merge:

1. `npm ci`
2. `npm run check`
3. `npm run test`
4. `npm run build`

## Preview deployment smoke

After the preview deploy finishes:

1. Load `/` and confirm the primary landing and search surfaces render without server errors.
2. Load `/login` and `/signup` to confirm auth routes are alive.
3. Call `/api/health`.
4. Expect `200` with `"overall":"ok"` when preview is wired to real services. If preview is intentionally partial, capture the degraded components in the PR before merge.
5. Confirm one customer-facing route and one carrier-facing route render with the expected environment banner or live data state.

## Non-production bootstrap smoke

Use this only outside production:

1. Sign in as an admin user listed in `ADMIN_EMAILS`.
2. POST to `/api/admin` with `{"action":"bootstrap","secret":"$SMOKE_BOOTSTRAP_SECRET"}`.
3. Re-run `/api/health` and confirm the intended smoke views can see demo trips or bookings.
4. Never use `SMOKE_BOOTSTRAP_SECRET` against production.

## Cron and webhook edge checks

1. Verify `vercel.json` still schedules `/api/cron/trip-freshness-checks` and `/api/cron/payout-auto-release`.
2. Confirm the default schedules remain hobby-safe daily crons unless the project has explicitly moved to a Vercel Pro plan.
3. If production needs hourly cron execution, record that dependency in GitHub before changing the schedule.
4. If `CRON_SECRET` or `VERCEL_CRON_SECRET` is set, call each cron route once with `Authorization: Bearer <secret>` and confirm a `200` response.
5. Confirm Stripe webhook secret rotation is reflected before replaying webhook traffic or validating payout flows.

## Ship gate

Do not mark a deploy healthy until CI is green, preview smoke is recorded, and any degraded `/api/health` component has an explicit owner in GitHub.
