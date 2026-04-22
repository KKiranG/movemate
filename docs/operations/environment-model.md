# MoveMate Environment Model

GitHub issues and pull requests are the live work system.
`docs/operations/todolist.md` and `docs/operations/completed.md` are derived snapshots only.

## Required build / deploy variables

`npm run build` validates `config/required-production-env.json` when `NODE_ENV=production`.
These keys must be present in preview and production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Public runtime variables

These values are safe to expose in the browser:

- `NEXT_PUBLIC_SITE_URL` for canonical metadata, robots, and sitemap output
- `NEXT_PUBLIC_APP_URL` for absolute links emitted in notifications
- `NEXT_PUBLIC_APP_ENV` for health reporting and Sentry environment labels
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` for client-side maps autocomplete
- `NEXT_PUBLIC_SENTRY_DSN` for browser error reporting
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` for web push subscription bootstrapping

## Server-only secrets

Keep these in `.env.local` for local work and in project-level deploy secrets for hosted environments:

- `SUPABASE_SERVICE_ROLE_KEY` for admin-only writes and smoke bootstrap
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for payment and webhook paths
- `CRON_SECRET` or `VERCEL_CRON_SECRET` for bearer auth on cron routes
- `SMOKE_BOOTSTRAP_SECRET` for the non-production bootstrap path behind `/api/admin`
- `ADMIN_EMAILS` for the initial admin allowlist
- `VAPID_PRIVATE_KEY` for web push delivery
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_RELEASE` for release tracking

## Optional integrations

These vars unlock integrations without being required for local UI work:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for production rate limiting
- `GOOGLE_MAPS_API_KEY` as the server-side fallback for maps and geocoding
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for transactional email delivery
- `STRIPE_CONNECT_RETURN_URL` and `STRIPE_CONNECT_REFRESH_URL` when Connect redirects must differ from the app defaults

## Observability wiring

- Browser-side Sentry init lives in `src/instrumentation-client.ts`.
- Server-side Sentry init lives in `src/instrumentation.ts` through Next's `register()` hook.
- Root App Router render failures are captured in `src/app/global-error.tsx`, and segment-level route failures are captured in `src/app/error.tsx`.
- Request-level `onRequestError` wiring is intentionally deferred until the project upgrades from Next.js `14.2.35` to a version that supports that hook.

## Cron policy by environment

- Preview:
  - Treat preview deploys as validation environments, not as trusted cron runners.
  - Keep the shared `vercel.json` schedule hobby-safe so preview builds do not fail on plan limits.
  - Verify cron behavior manually with bearer auth instead of assuming preview cron execution.
- Staging:
  - Use staging only if the project has a separate environment with its own secrets and a real need to rehearse cron or webhook behavior before production.
  - If staging exists, keep the cron policy aligned with the production intention and document any differences in GitHub before changing schedules.
- Production:
  - The default `vercel.json` schedule is daily so hobby Vercel projects can deploy successfully today.
  - If MoveMate later needs hourly cron execution in Vercel, treat that as a deploy-policy change that requires a Pro plan or a different scheduler.
  - Keep cron auth wired through `CRON_SECRET` or `VERCEL_CRON_SECRET` regardless of schedule frequency.

## Local-only toggles

- `RUN_SUPABASE_INTEGRATION` enables the integration tests that talk to a real Supabase stack when set to `1`
- Keep local developer values in `.env.local`; use hosted environment settings for preview and production
