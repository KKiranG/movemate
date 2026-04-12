# moverrr

Need-first, match-ranked spare-capacity marketplace for awkward-middle item moves.

Carriers post trips they are already taking and set structured pricing. Customers declare a specific move need via a short wizard (route + item + timing + access). The system matches against posted trips and returns a confidence-ranked shortlist with deterministic pricing, fit-confidence labels, and match explanations. Customers use Request-to-Book (single carrier) or Fast Match (up to 3, first to accept wins). Carriers accept or decline via a decision card. Payment is escrowed; proof-of-delivery releases payout.

## Current Status

- The app runs as a need-first MVP shell with live Supabase-backed auth, listings, bookings, admin review tools, dispute handling, and review capture.
- Carrier onboarding, trip posting, trip editing, customer booking, booking-state progression, waitlist capture, smoke-dataset bootstrap, and admin verification are wired in code.
- External services still need real credentials before production behavior is fully live for Maps, Stripe, Resend, Sentry, and deployment hosting.

## The Most Important Question

The best validation question right now is:

Can moverrr convert a messy object-move problem into a confident yes/no decision fast enough that customers do not abandon — even when supply is sparse? And will carriers reliably post repeat corridors if quick-repost takes under 30 seconds?

These two questions matter more than pixel polish. If customers abandon during the need-declaration flow or carriers will not post repeat inventory, the model breaks.

## Stack

- Frontend: Next.js 14 App Router
- Styling: Tailwind CSS
- Backend: Supabase Postgres + Auth + Storage + Edge Functions
- Spatial: PostGIS
- Payments: Stripe Connect
- Email: Resend
- Maps: Google Maps Platform
- Monitoring: Sentry
- Hosting: Vercel

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in credentials:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Optional local database flow with Supabase CLI:

```bash
npm run supabase:start
npm run supabase:db:reset
```

The reset path now seeds auth-backed carrier/customer records plus a live listing and booking record, so a fresh local stack no longer depends on pre-existing `auth.users`.

## Scripts

- `npm run dev` starts Next.js locally
- `npm run build` runs a production build
- `npm run lint` runs ESLint
- `npm run typecheck` runs TypeScript checks
- `npm run check` runs lint and typecheck
- `npm run supabase:start` boots the local Supabase stack
- `npm run supabase:db:push` pushes migrations
- `npm run supabase:db:reset` resets and seeds the local database

## Project Structure

```text
src/app              Next.js routes and API routes
src/components       UI primitives and feature components
src/lib              Domain logic, integrations, validation, demo data
src/hooks            Client hooks for future live wiring
src/types            Shared TypeScript models
supabase             Config, migrations, edge function stubs, seed data
.agent-skills        Project-specific agent guidance for future AI work
```

## What Is Implemented

- Browse-first landing page with MVP framing
- Search results backed by Supabase listings and PostGIS matching when Maps geocoding is available
- Trip detail with live booking creation, item photo upload, and payment-intent creation
- Customer booking list/detail with confirmation, review submission, and dispute intake
- Carrier onboarding with document uploads, trip posting wizard, live listing editing, and proof-backed booking status controls
- Admin dashboard with validation metrics, carrier verification, dispute resolution, and smoke-dataset bootstrap controls
- Waitlist capture for no-result searches and analytics event logging
- Supabase schema, RLS, indexes, matching function, private storage buckets, and audit/event tables

## What Still Needs Live Wiring

- Real Google Maps credentials for autocomplete/geocoding in production
- Real Stripe keys, webhook secret, and Connect account onboarding flow completion
- Real Resend domain/from-address setup for outbound email delivery
- Sentry DSN and production instrumentation hookup
- Actual Vercel deployment and project linking

## Notes

- Carrier and admin pages are routed under `/carrier/*` and `/admin/*` so the app can route correctly in Next.js. The original markdown used route groups for organization, but route groups alone do not create URL prefixes.
- `.agent-skills/` mirrors the master plan so future coding agents have product context without rereading the full strategy document.
