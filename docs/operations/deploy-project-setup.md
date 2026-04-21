# MoveMate Deploy And Project Setup

GitHub issues, pull requests, and merge history are authoritative for active work.
`docs/operations/todolist.md` and `docs/operations/completed.md` are derived artifacts only.

## GitHub setup

- Use GitHub issues as the live backlog and pull requests as the review and shipping lane.
- Keep `main` protected with required checks for `CI` and `Operations Docs Check`.
- Use `npm run ops:labels` to seed repo labels when needed.
- Use `npm run ops:sync-backlog` only to refresh the markdown snapshot after GitHub changes land.

## Vercel project

- Connect the repo as a Next.js project in Vercel.
- Load preview and production env from `.env.example`.
- The required production build contract is enforced by `config/required-production-env.json`.
- The default cron schedule in `vercel.json` is hobby-safe daily execution. Pair it with `CRON_SECRET` or `VERCEL_CRON_SECRET`.
- If you need hourly cron execution in Vercel, move the project to Pro before changing `vercel.json` back to a multi-run-per-day schedule.

## Provider wiring

- Supabase: set the URL, anon key, and service role key before running preview smoke.
- Stripe: set publishable, secret, and webhook keys, plus Connect return and refresh URLs when overrides are needed.
- Resend: add the API key and sender address before relying on transactional email.
- Upstash: add Redis credentials when production rate limiting is expected.
- Sentry: set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_RELEASE`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` when release tracking and source map upload are enabled.

## Release baseline

1. Open or update the GitHub issue for the change.
2. Land a pull request with green `CI` and `Operations Docs Check`.
3. Run the preview checklist in `docs/operations/smoke-tests.md`.
4. After production deploy, hit `/api/health` and validate cron auth once.
