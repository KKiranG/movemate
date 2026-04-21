# MoveMate Codebase Map

Use this file to navigate the codebase quickly. Every agent should read the relevant sections before touching files in that area. Do not re-explore what is already mapped here.

---

## Routing Architecture (Next.js App Router)

| Route Group | URL Prefix | Who Uses It |
|---|---|---|
| `src/app/(customer)/` | `/bookings`, `/search`, `/trip/[id]`, `/alerts`, `/carrier/[id]`, `/account` | Customers |
| `src/app/(carrier)/carrier/` | `/carrier/dashboard`, `/carrier/requests`, `/carrier/post`, `/carrier/trips`, `/carrier/today`, `/carrier/templates`, `/carrier/payouts`, `/carrier/onboarding`, `/carrier/stats`, `/carrier/account` | Carriers |
| `src/app/(admin)/admin/` | `/admin/dashboard`, `/admin/alerts`, `/admin/bookings`, `/admin/carriers`, `/admin/disputes`, `/admin/payments`, `/admin/verification` | Operators |
| `src/app/(auth)/` | `/login`, `/signup`, `/carrier/signup`, `/reset-password`, `/verify` | Auth flows |
| `src/app/(marketing)/` | `/become-a-carrier`, `/privacy`, `/terms`, `/trust` | Public pages |
| `src/app/` root | `/` (homepage), `/sitemap.ts`, `/robots.ts` | Public root |

Route groups use parentheses notation `(name)` for layout/auth isolation — the group name does NOT appear in the URL.

---

## Domain Logic Layer (`src/lib/`)

### Key files every agent must know

| File | What it owns | When to touch |
|---|---|---|
| `src/lib/status-machine.ts` | Booking state transition map and `canTransitionBooking()` guard | Only when adding or changing booking states |
| `src/lib/pricing/breakdown.ts` | `calculateBookingBreakdown()` — the canonical pricing formula | Only with explicit pricing discussion; invariant is frozen |
| `src/lib/__tests__/breakdown.test.ts` | Pricing identity test | Always update when pricing.ts changes |
| `src/lib/errors.ts` | `AppError` class — use for all structured API errors | When adding new error codes or handling |
| `src/lib/env.ts` | Env validation + `hasSupabaseEnv()`, `hasSupabaseAdminEnv()`, `getAdminEmails()` | When adding new env vars |
| `src/lib/notifications.ts` | Email sending via Resend — fire-and-forget, off critical path | When adding new notification types |
| `src/lib/analytics.ts` | Analytics event tracking | When adding new tracked events |
| `src/lib/rate-limit.ts` | Redis-based rate limiting with in-memory fallback | When adding rate-limited endpoints |
| `src/lib/storage.ts` | Supabase Storage file upload/download | When touching proof photos or document uploads |
| `src/lib/constants.ts` | Shared labels, time windows, size categories | When adding new display constants |
| `src/lib/auth.ts` | Auth utilities and session management helpers | When touching auth flows |
| `src/lib/sentry.ts` | Error capture (`captureAppError`) | When adding structured error reporting |

### Data layer (`src/lib/data/`) — one file per domain

| File | What it owns |
|---|---|
| `src/lib/data/bookings.ts` | Create, update, cancel, capture bookings; status transitions with guards; carrier payout holds |
| `src/lib/data/trips.ts` | Create, search, retrieve trips; listing search with PostGIS matching |
| `src/lib/data/carriers.ts` | Carrier profiles, activation state, vehicles, payout methods |
| `src/lib/data/templates.ts` | Trip template CRUD |
| `src/lib/data/listings.ts` | Carrier availability listings and pricing guidance |
| `src/lib/data/saved-searches.ts` | Compatibility wrapper backing legacy saved-search routes while alerts replace them |
| `src/lib/data/alerts.ts` | Route alert CRUD for live customer alert flows |
| `src/lib/data/move-requests.ts` | Move request creation, lookup, and recent-request continuity |
| `src/lib/data/offers.ts` | Ranked offer retrieval and persistence |
| `src/lib/data/booking-requests.ts` | Request-to-Book and Fast Match lifecycle |
| `src/lib/data/unmatched-requests.ts` | Alert-the-Network and recovery-demand lifecycle |
| `src/lib/data/concierge-offers.ts` | Founder concierge offers routed back into booking requests |
| `src/lib/data/feedback.ts` | Disputes, reviews, review responses |
| `src/lib/data/admin.ts` | Admin-only operations: payment capture, dispute resolution, carrier verification |
| `src/lib/data/mappers.ts` | DB row → TypeScript type converters. `toBooking()`, `toTrip()`, etc. |
| `src/lib/data/bootstrap.ts` | Smoke test data seeding (dev only) |

**Rule:** Data layer functions are pure domain logic. No HTTP, no UI. They call Supabase directly.

### Other `src/lib/` subdirectories

| Directory | What it owns |
|---|---|
| `src/lib/matching/` | PostGIS-based trip matching logic |
| `src/lib/maps/` | Google Maps geocoding and distance helpers |
| `src/lib/stripe/` | Stripe client, payment intent creation, Connect setup, payment actions |
| `src/lib/supabase/` | Supabase client factories: `server.ts`, `admin.ts`, `client.ts` |
| `src/lib/validation/` | Zod schemas for all API inputs |
| `src/lib/email/` | Email template builders |
| `src/lib/server/` | Server-only utilities |
| `src/lib/pricing/` | `breakdown.ts` — the pricing formula (see above) |

---

## API Routes (`src/app/api/`)

| Route | Key files | High-risk? |
|---|---|---|
| `POST /api/bookings` | `src/app/api/bookings/route.ts` | Deprecated guard — creation must flow through booking requests |
| `PATCH /api/bookings/[id]` | `src/app/api/bookings/[id]/route.ts` | Yes — state machine |
| `POST /api/bookings/[id]/confirm-receipt` | `[id]/confirm-receipt/route.ts` | Yes — triggers payout |
| `POST /api/bookings/[id]/dispute` | `[id]/dispute/route.ts` | Yes — blocks payout |
| `POST /api/bookings/[id]/exception` | `[id]/exception/route.ts` | Yes — ConditionAdjustment |
| `POST /api/payments/create-intent` | `payments/create-intent/route.ts` | Yes — Stripe auth |
| `POST /api/payments/webhook` | `payments/webhook/route.ts` | Critical — idempotent |
| `POST /api/carrier/stripe/connect-start` | `carrier/stripe/connect-start/route.ts` | Yes — payout setup |
| `POST /api/admin/carriers/[id]/verify` | `admin/carriers/[id]/verify/route.ts` | Admin-only |
| `PATCH /api/admin/disputes/[id]` | `admin/disputes/[id]/route.ts` | Admin-only |
| `POST /api/admin/bookings/[id]/capture` | `admin/bookings/[id]/capture/route.ts` | Admin-only, financial |
| `GET /api/search` | `search/route.ts` | Public, spatial query |
| `POST /api/move-requests` | `move-requests/route.ts` | Yes — request creation |
| `GET /api/offers` | `offers/route.ts` | Yes — ranked match retrieval |
| `POST /api/booking-requests` | `booking-requests/route.ts` | Yes — Request-to-Book |
| `POST /api/booking-requests/fast-match` | `booking-requests/fast-match/route.ts` | Yes — sibling request creation |
| `PATCH /api/booking-requests/[id]` | `booking-requests/[id]/route.ts` | Yes — request-state transitions |
| `GET/POST /api/alerts` | `alerts/route.ts` | Customer alert lifecycle |
| `PATCH/DELETE /api/alerts/[id]` | `alerts/[id]/route.ts` | Customer alert lifecycle |
| `PATCH /api/concierge-offers/[id]` | `concierge-offers/[id]/route.ts` | Yes — customer/admin concierge actions |
| `POST /api/upload` | `upload/route.ts` | Auth required |
| `GET/POST /api/trips` | `trips/route.ts` | Carrier-facing |
| `POST /api/trips/templates/[id]/post` | `templates/[id]/post/route.ts` | Quick-post path |

---

## Components (`src/components/`)

| Directory | Key components |
|---|---|
| `src/components/booking/` | `booking-checkout-panel.tsx`, `booking-form.tsx`, `booking-status-timeline.tsx`, `booking-dispute-form.tsx`, `booking-review-form.tsx` |
| `src/components/carrier/` | `carrier-onboarding-*.tsx`, `carrier-post-form.tsx`, `carrier-template-*.tsx`, `pending-bookings-alert.tsx`, `request-clarification-sheet.tsx` |
| `src/components/search/` | `search-bar.tsx`, `search-filters.tsx`, `alerts-manager.tsx`, `save-alert-form.tsx` |
| `src/components/trip/` | `trip-card.tsx`, `trip-detail-summary.tsx` |
| `src/components/admin/` | Admin verification, dispute, booking, payment panels |
| `src/components/auth/` | `login-form.tsx`, `signup-form.tsx` |
| `src/components/shared/` | `google-places-autocomplete.tsx`, `config-banner.tsx`, `error-boundary.tsx` |
| `src/components/ui/` | Design system primitives: `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx` |
| `src/components/layout/` | `header.tsx`, `footer.tsx`, `nav.tsx` |

---

## Types (`src/types/`)

| File | What it owns |
|---|---|
| `src/types/database.ts` | **Auto-generated** from Supabase schema. Never hand-edit. Regenerate with `supabase gen types typescript`. |
| `src/types/booking.ts` | `Booking`, `BookingStatus`, `BookingPriceBreakdown`, `BookingPaymentStatus`, etc. |
| `src/types/trip.ts` | `Trip`, `TripStatus`, `SearchResult`, etc. |
| `src/types/carrier.ts` | `Carrier`, `CarrierProfile`, `Vehicle`, etc. |
| `src/types/customer.ts` | `Customer`, `CustomerProfile` |
| `src/types/dispute.ts` | `Dispute`, `DisputeStatus` |
| `src/types/review.ts` | `Review`, `ReviewTag` |
| `src/types/admin.ts` | Admin-scoped aggregate types |

**Rule:** Domain types live in `src/types/`. The generated `database.ts` is the ground truth for DB shape. When schema changes, regenerate `database.ts` and then update the domain types that depend on it.

---

## Database (`supabase/`)

### Migrations (sequential — never reorder)

| Migration | What it added |
|---|---|
| `001_enable_postgis.sql` | PostGIS extension |
| `002_create_core_tables.sql` | carriers, customers, vehicles, capacity_listings, bookings |
| `003_create_matching_functions.sql` | PostGIS matching stored functions |
| `004_create_rls_policies.sql` | RLS policies for all core tables |
| `005_create_indexes.sql` | Spatial and performance indexes |
| `006_extend_marketplace_infra.sql` | Booking events, disputes, reviews |
| `007_add_marketplace_indexes.sql` | Additional performance indexes |
| `008_atomic_booking_function.sql` | `create_booking_atomic` RPC |
| `009_trip_templates.sql` | Trip templates table |
| `010_capacity_recalculation.sql` | `recalculate_listing_capacity` RPC |
| `010_saved_searches.sql` | Saved searches table |
| `011_booking_safety_p0.sql` | Booking state and payment safety hardening |
| `012_p1_p2_marketplace_experience.sql` | Marketplace UX tables and fields |
| `013_p3_enhancements.sql` | Enhancements (reviews, proofs, events) |
| `014_booking_payment_capture_failed.sql` | Payment capture failure handling |
| `015_parallel_backlog_wave.sql` | Batched backlog improvements |
| `016_pr21_maps_payments_and_booking_shape.sql` | Maps, payments, and booking shape updates |

Next migration file: `017_<short_description>.sql`

### Supabase Edge Functions (`supabase/functions/`)

| Function | What it does |
|---|---|
| `carrier-next-step-nudges/` | Nudges carriers toward next activation or ops step |
| `daily-expire-trips/` | Expires listings past their date |
| `delivery-reminders/` | Sends delivery-day reminders |
| `doc-expiry-reminders/` | Warns carriers of expiring documents |
| `expire-bookings/` | Expires pending bookings past deadline |
| `notify-saved-searches/` | Notifies customers when saved search matches a new trip |
| `on-booking-created/` | Post-booking notification trigger |
| `on-trip-posted/` | Post-trip notification trigger |
| `trip-expiry-reminders/` | Pre-expiry reminder to carriers |

---

## Infrastructure Files

| File | What it does |
|---|---|
| `middleware.ts` | Route protection (`/bookings`, `/carrier`, `/admin`), CSRF guard for mutating API routes, admin email gating |
| `next.config.js` | Production env validation, image domains |
| `src/lib/env.ts` | Env var validation; `hasSupabaseEnv()` graceful fallback for local dev |
| `.env.example` | Template for required env vars |
| `supabase/seed.sql` | Dev seed: auth-backed carrier/customer records + demo listings |

---

## Patterns to Follow

### API route structure
```
1. Auth check (createClient, getUser)
2. Role guard (is carrier / customer / admin?)  
3. Zod validation of body/params
4. Call data layer function in src/lib/data/
5. Return structured JSON or AppError
```

### Data layer function structure
```
1. hasSupabaseEnv() / hasSupabaseAdminEnv() check → return empty/null for local dev
2. createClient() or createAdminClient() (admin-only ops)
3. DB query with typed result
4. Map result with toX() from mappers.ts
5. Return typed domain object or throw AppError
```

### Adding a new database table
```
1. New migration file: 017_<description>.sql
2. Enable RLS immediately (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
3. Create policies (SELECT, INSERT, UPDATE, DELETE as needed)
4. Add GIST index if geography column
5. Regenerate types: supabase gen types typescript
6. Update src/types/database.ts (generated) and any domain types that use it
```

### Adding a new booking state
```
1. Update BookingStatus type in src/types/booking.ts
2. Update ALLOWED_BOOKING_TRANSITIONS map in src/lib/status-machine.ts
3. Add guards in src/lib/data/bookings.ts
4. Verify canTransitionBooking() tests still pass
5. Update the migration if a DB enum changes
```

---

## Common Gotchas

- `(customer)`, `(carrier)`, `(admin)` are route groups — they don't create URL segments
- `src/types/database.ts` is auto-generated — never hand-edit it
- `createAdminClient()` bypasses RLS — only use it in admin routes or trusted server-side operations
- `hasSupabaseEnv()` returns false locally when `.env.local` is missing — graceful degradation is intentional
- Email sending is fire-and-forget — the booking flow must not depend on it succeeding
- Webhook handler (`payments/webhook/route.ts`) must remain idempotent — check before mutating
- Booking creation MUST go through `create_booking_atomic` RPC — never direct INSERT
