# moverrr — Completed Work Log

> Last updated: `2026-04-01`
>
> Purpose: keep a durable record of what is already done, where it lives, why it was changed, and when it landed, so completed work can be removed from the active backlog without losing context.

---

## 2026-04-01 — Production Safety, Booking Integrity, and MVP UX Hardening

### `COMP-2026-04-01-11` — Carrier templates, quick post, and route re-posting
- Moved from active backlog: 15-hour session Group 1
- When: `2026-04-01`
- Where:
  - `supabase/migrations/009_trip_templates.sql`
  - `src/lib/data/templates.ts`
  - `src/app/api/trips/templates/*`
  - `src/components/carrier/quick-post-templates.tsx`
  - `src/components/carrier/save-trip-template-action.tsx`
  - `src/components/carrier/carrier-post-prefill.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/app/(carrier)/carrier/trips/[id]/page.tsx`
  - `src/components/carrier/carrier-trip-wizard.tsx`
- Why:
  - Repeated corridor posting is the highest-leverage carrier retention loop in the MVP.
  - Expired or cancelled routes also needed a faster “try this again” path than re-entering the full wizard from scratch.
- What changed:
  - Added a private `trip_templates` table with RLS, spatial indexes, and typed DB access.
  - Added template list/create/delete/post APIs plus server data helpers for creating templates from live trips and creating new trips from templates.
  - Added “Save as template” on carrier trip detail and a dashboard “Quick Post” surface that lets carriers confirm only date, time window, and price.
  - Added query-param powered route re-posting for expired/cancelled trips and taught the carrier wizard to hydrate real route defaults.
  - Added onboarding progress gating so carriers see what is missing before verification submission.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-12` — Realtime carrier bookings, Upstash rate limiting, and finalized atomic booking migration
- Moved from active backlog: 15-hour session Group 2
- When: `2026-04-01`
- Where:
  - `supabase/migrations/008_atomic_booking_function.sql`
  - `src/lib/data/bookings.ts`
  - `src/lib/rate-limit.ts`
  - `src/app/api/upload/route.ts`
  - `src/app/api/payments/webhook/route.ts`
  - `src/app/api/search/route.ts`
  - `src/components/carrier/live-bookings-list.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
- Why:
  - Booking integrity, live operational visibility, and durable rate limiting are all part of the trust layer for a marketplace handling real inventory and payments.
- What changed:
  - Finalized and tracked the atomic booking RPC migration, including service availability guards inside the function.
  - Kept booking creation on the RPC path in application code and preserved explicit error mapping for full/closed listings.
  - Replaced in-memory-only rate limiting with Upstash-backed sliding windows while keeping the intentional in-memory fallback when Redis env vars are absent.
  - Added a live carrier bookings section that subscribes to Supabase Realtime and refreshes the booking list automatically.
- Verification:
  - `npm run check`
  - `npm run supabase:db:push` attempted, but local Supabase was not linked (`supabase link` not configured in this workspace).

### `COMP-2026-04-01-13` — Saved searches, customer stepper clarity, and camera-first proof capture
- Moved from active backlog: 15-hour session Group 3
- When: `2026-04-01`
- Where:
  - `supabase/migrations/010_saved_searches.sql`
  - `src/lib/data/saved-searches.ts`
  - `src/app/api/saved-searches/*`
  - `src/components/search/save-search-form.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `supabase/functions/notify-saved-searches/index.ts`
  - `src/components/booking/booking-status-stepper.tsx`
  - `src/components/booking/status-update-actions.tsx`
  - `src/components/booking/dispute-form.tsx`
- Why:
  - Empty search results need a retention path instead of a dead end.
  - Booking state clarity and mobile-first proof capture are direct trust multipliers for both sides of the marketplace.
- What changed:
  - Added the `saved_searches` table with RLS, typed access, CRUD APIs, and a Deno edge-function skeleton for route-alert notifications.
  - Replaced the empty-search waitlist copy with a logged-in saved-search flow and a sign-in CTA for anonymous users.
  - Reworked the booking detail status UI into a clearer vertical stepper.
  - Made pickup, delivery, and dispute proof capture camera-primary on mobile with HEIC/HEIF support preserved.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-14` — Admin analytics cards and in-page document preview
- Moved from active backlog: 15-hour session Group 4
- When: `2026-04-01`
- Where:
  - `src/lib/data/admin.ts`
  - `src/types/admin.ts`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `src/app/(admin)/admin/verification/page.tsx`
  - `src/components/admin/verification-queue.tsx`
  - `src/components/ui/dialog.tsx`
- Why:
  - The early ops team needs a fast dashboard for core marketplace health and a verification queue that does not require bouncing to raw document URLs.
- What changed:
  - Expanded admin metrics to include search-to-booking conversion, fill-rate target progress, average job value, and dispute rate.
  - Added last-updated display and richer card formatting on the admin dashboard.
  - Turned the verification page into a real review queue and added Radix-based document preview modals for licence and insurance images.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-15` — Error boundaries, skeleton states, SEO metadata, and accessibility sweep
- Moved from active backlog: 15-hour session Group 5
- When: `2026-04-01`
- Where:
  - `src/components/shared/error-boundary.tsx`
  - `src/components/search/search-results-skeleton.tsx`
  - `src/components/carrier/trip-list-skeleton.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/app/(customer)/bookings/page.tsx`
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/app/layout.tsx`
  - multiple pages and forms under `src/app/` and `src/components/`
- Why:
  - The MVP still needs resilient sections, non-blank loading states, better sharing metadata, and baseline WCAG hygiene before more feature depth is added.
- What changed:
  - Added reusable client error boundaries and Suspense fallbacks on major search, carrier dashboard, and bookings sections.
  - Added search and carrier list skeletons so loading does not collapse into empty white space.
  - Added dynamic trip metadata for richer social previews.
  - Added a global skip link, explicit `main-content` targets, more form labels, and extra mobile-friendly camera/upload affordances in customer forms.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-01` — Atomic booking creation and conflict-safe capacity handling
- Moved from active backlog: original `A4` and `A12`
- When: `2026-04-01`
- Where:
  - `supabase/migrations/008_atomic_booking_function.sql`
  - `src/lib/data/bookings.ts`
  - `src/types/database.ts`
- Why:
  - Booking creation previously used a read-then-write flow, which left the app exposed to oversell when two customers booked the same listing at nearly the same time.
  - The frontend also needed a reliable way to distinguish “listing is full” from a generic 500.
- What changed:
  - Added a new `create_booking_atomic` Postgres function that locks the listing row, recalculates pricing inside the transaction, inserts the booking, writes the initial booking event, and updates listing capacity/status before releasing the lock.
  - Switched `createBookingForCustomer` to call the RPC instead of directly inserting into `bookings`.
  - Added typed RPC args in `src/types/database.ts`.
  - Mapped `listing_not_bookable` to an application-level `409` conflict so the UI can handle a full listing as a product state instead of a server failure.
  - Added a cancellation-side capacity/status recalculation path so cancelled bookings do not leave the listing in the wrong availability state.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-02` — API hardening for uploads and cross-origin POST requests
- Moved from active backlog: `A2`, `A3`, `A8`
- When: `2026-04-01`
- Where:
  - `src/app/api/upload/route.ts`
  - `middleware.ts`
- Why:
  - File uploads accepted too much trust from the client and lacked a hard content-length guard.
  - Booking and payment POST routes lacked origin validation.
- What changed:
  - Added a 10MB pre-parse upload limit based on `Content-Length`.
  - Added explicit MIME allowlisting for images plus `image/heic`, `image/heif`, and PDF uploads.
  - Added CSRF-style origin checks for mutating `/api/bookings/*` and `/api/payments/*` routes, while keeping `/api/payments/webhook` exempt.
  - Expanded middleware matchers so API routes are actually protected by the new logic.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-03` — Trip date validation, text sanitization, and production env enforcement
- Moved from active backlog: `A1`, `A6`, `A7`, `A11`
- When: `2026-04-01`
- Where:
  - `src/lib/validation/trip.ts`
  - `src/lib/validation/booking.ts`
  - `src/lib/utils.ts`
  - `src/app/api/trips/route.ts`
  - `src/app/api/trips/[id]/route.ts`
  - `src/app/layout.tsx`
- Why:
  - Carriers could submit past-dated trips.
  - Booking and trip free text needed normalization before persistence.
  - Production env validation existed but was not actually enforced at runtime.
- What changed:
  - Added reusable date refinement so both `tripSchema` and `tripUpdateSchema` reject past dates.
  - Added `sanitizeText()` and applied it to booking text fields plus trip create/update API payloads.
  - Wired `assertRequiredEnv()` into the root server layout so missing production env vars fail fast rather than surfacing as broken runtime behavior later.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-04` — Proper customer-facing not-found flows for trips and bookings
- Moved from active backlog: `A9`, `A10`
- When: `2026-04-01`
- Where:
  - `src/app/(customer)/trip/[id]/not-found.tsx`
  - `src/app/(customer)/bookings/[id]/not-found.tsx`
- Why:
  - Missing or unauthorized resources should resolve to a deliberate recovery path, not an empty or confusing page state.
- What changed:
  - Added dedicated not-found pages for trip detail and booking detail.
  - Preserved the existing `notFound()` calls in the route pages and gave them helpful recovery links back to `/search` and `/bookings`.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-05` — Booking flow clarity: retryable payment setup, stepper, and form counters
- Moved from active backlog: `B4`, `B7`, `B11`
- When: `2026-04-01`
- Where:
  - `src/components/booking/booking-form.tsx`
  - `src/components/booking/booking-status-stepper.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
- Why:
  - Payment setup failures were generic and easy to misunderstand.
  - Booking detail status needed a clearer progress UI.
  - Booking form text input lacked feedback on limits.
- What changed:
  - Added clearer payment setup messaging and a retry path when booking creation succeeds but payment-intent creation fails.
  - Added a dedicated booking status stepper and replaced the old text-only list in booking detail.
  - Made item description controlled and added a live `n/200` counter.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-06` — Carrier onboarding and admin action feedback
- Moved from active backlog: `B5`, `B6`, `B12`, `B18`
- When: `2026-04-01`
- Where:
  - `src/components/carrier/carrier-onboarding-form.tsx`
  - `src/components/admin/verify-carrier-actions.tsx`
  - `src/components/carrier/carrier-trip-wizard.tsx`
  - `src/app/(carrier)/carrier/trips/page.tsx`
- Why:
  - Uploading docs felt opaque.
  - Admin verification actions needed clear async feedback.
  - Carrier special notes needed limit visibility.
  - After trip posting, there was no obvious path back to the dashboard.
- What changed:
  - Added onboarding document progress UI, upload percent feedback, and green checkmarks for successful uploads.
  - Added spinners to approve/reject actions.
  - Added live `n/280` counter for carrier trip special notes.
  - Added a success banner on the carrier trips page with a direct “Go to dashboard” action after posting.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-07` — iOS-first interaction and touch polish
- Moved from active backlog: `C1`, `C2`, `C3`, `C7`, `C8`
- When: `2026-04-01`
- Where:
  - `src/components/carrier/carrier-trip-wizard.tsx`
  - `src/components/booking/status-update-actions.tsx`
  - `src/components/booking/dispute-form.tsx`
  - `src/app/globals.css`
  - `src/components/layout/site-header.tsx`
  - `src/components/ui/button.tsx`
- Why:
  - The product is intended to be iPhone-first, so hover-only feedback and undersized tap experiences are bugs, not polish.
- What changed:
  - Replaced carrier wizard checkbox inputs with custom button-style toggles and hidden inputs.
  - Added `capture="environment"` and explicit HEIC/HEIF support to proof-photo flows.
  - Added safe-area variables, overscroll containment, and global `focus-visible` styling.
  - Added `active:` states to header links and core button variants.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-08` — Browse/search clarity improvements
- Moved from active backlog: `B1`, `B2`, `B13`, `B14`
- When: `2026-04-01`
- Where:
  - `src/app/page.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/components/customer/waitlist-form.tsx`
  - `src/components/trip/trip-card.tsx`
- Why:
  - MVP value proposition needs to land immediately on 375px mobile screens.
  - Empty search states should convert uncertainty into a concrete next step.
  - Trust signals should exist at browse-time, not only inside the trip detail page.
- What changed:
  - Moved the landing-page value explanation above the search form.
  - Reframed the search empty state around “Get notified” and updated the CTA copy.
  - Added carrier rating/review count on trip cards.
  - Switched the browse-stage verified badge to an explicit green trust signal.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-09` — Search date defaults no longer go stale
- Discovered during implementation pass, not originally listed
- When: `2026-04-01`
- Where:
  - `src/lib/utils.ts`
  - `src/components/search/search-bar.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/app/page.tsx`
- Why:
  - The app was still seeded with a hardcoded March 2026 date. As time moved forward, search defaults and sample links would silently feel broken.
- What changed:
  - Added `getTodayIsoDate()` and used it for the search form default date, search-page fallback date, and landing-page sample search link.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-10` — Workspace typecheck now targets the product, not the reference folders
- Discovered during verification, not originally listed
- When: `2026-04-01`
- Where:
  - `tsconfig.json`
- Why:
  - `tsc --noEmit` was walking reference folders such as `other best projects- only for ideas/`, which produced thousands of irrelevant type errors unrelated to moverrr.
- What changed:
  - Narrowed the TypeScript include/exclude rules so checks run against the actual app workspace plus Next-generated types.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-16` — Search accessibility, pending-booking clarity, and live verification/dashboard surfaces
- Moved from active backlog: `BUG-01`, `BUG-08`, `BUG-16`, `BUG-18`, `BUG-21`
- When: `2026-04-01`
- Where:
  - `src/components/shared/google-autocomplete-input.tsx`
  - `src/components/booking/pending-expiry-countdown.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/components/admin/verification-queue.tsx`
  - `src/app/(admin)/admin/verification/page.tsx`
  - `src/app/(admin)/admin/carriers/page.tsx`
  - `src/components/admin/verify-carrier-actions.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
- Why:
  - Address selection relied on Google’s default widget, which did not expose reliable keyboard selection or ARIA relationships.
  - Pending bookings did not explain the 2-hour carrier response window clearly enough.
  - The admin verification screen was still a checklist placeholder even though carrier review data already existed.
  - Carrier dashboard summary cards still showed placeholder math instead of operationally trustworthy numbers.
- What changed:
  - Replaced the Google Places widget wrapper with a custom combobox-style autocomplete that supports `ArrowUp`, `ArrowDown`, `Enter`, `Escape`, `role="listbox"`, `role="option"`, and `aria-activedescendant`.
  - Added a live pending-booking expiry card that counts down from `created_at + 2h` and switches to an auto-expiry message once the window has elapsed.
  - Replaced the admin verification checklist shell with a live carrier queue, including real document/service-area context and lightweight review notes persisted in `localStorage`.
  - Extended verification actions so review notes flow through to the API and DB-backed carrier notes when approve/reject is used.
  - Replaced placeholder carrier dashboard cards with real listing/booking-derived counts and payout math, and surfaced per-trip status plus remaining capacity in the list.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-17` — Payment lifecycle semantics, structured webhook context, and proportional capacity recovery
- Moved from active backlog: `BUG-09`, `BUG-10`, `BUG-11`, `BUG-12`, `BUG-17`, `BUG-23`, `BUG-25`
- When: `2026-04-01`
- Where:
  - `config/required-production-env.json`
  - `next.config.js`
  - `src/lib/env.ts`
  - `src/lib/utils.ts`
  - `src/app/api/bookings/route.ts`
  - `src/app/api/payments/webhook/route.ts`
  - `src/lib/booking-capacity.ts`
  - `src/lib/data/bookings.ts`
  - `src/lib/data/admin.ts`
  - `src/components/admin/resolve-dispute-actions.tsx`
  - `supabase/migrations/010_capacity_recalculation.sql`
- Why:
  - Production env validation still happened too late in the runtime path.
  - Free-text sanitization still allowed pasted HTML tags through.
  - Booking conflict responses were not consistently serialized for frontend handling.
  - Payment status transitions blurred “intent created” and “authorization confirmed.”
  - Webhook incident review still lacked explicit operator-facing log context.
  - Booking cancellation recovery still depended on a flat 25% capacity heuristic.
- What changed:
  - Added a shared required-env manifest and enforced it from `next.config.js` so production builds fail before deployment when critical env vars are missing.
  - Upgraded `sanitizeText()` to strip HTML tags before normalizing whitespace.
  - Updated `/api/bookings` to return `{ error, code }` payloads, including the `409` `listing_not_bookable` case.
  - Changed payment-intent creation to record the Stripe intent ID without prematurely marking the booking as `authorized`, and renamed the booking event to `payment_intent_created`.
  - Tightened webhook updates so `payment_intent.amount_capturable_updated` marks bookings `authorized`, `payment_intent.succeeded` marks them `captured`, and failure/missing-row paths emit structured console context alongside Sentry capture.
  - Added visible loading ownership to admin dispute actions and routed dispute-driven booking status changes back through the shared booking transition helper.
  - Replaced flat 25% capacity math with dimension/weight/category-based capacity estimation in both the app layer and the booking RPC, and recalculated listing capacity from active bookings instead of incrementing/decrementing blindly.
- Verification:
  - `npm run check`

### `COMP-2026-04-01-13` — Local-date handling and demo data now roll forward automatically
- Discovered during backlog pass; this advances but does not fully close `BUG-20`
- When: `2026-04-01`
- Where:
  - `src/lib/utils.ts`
  - `src/lib/demo-data.ts`
- Why:
  - `toISOString()`-based date defaults can drift relative to the user’s local day, and demo inventory should not silently age into the past.
- What changed:
  - Updated `getTodayIsoDate()` to derive the local calendar date instead of the raw UTC date.
  - Switched demo trip dates to relative future dates so sample inventory remains current without hand-editing constants.
- Verification:
  - `npm run check`

---

## Already Present In Repo Before This Pass

> These capabilities were already implemented in the workspace before the 2026-04-01 Codex pass. Exact ship dates are not recoverable from the current workspace alone, so they are recorded as “pre-2026-04-01”.

### `BASELINE-01` — Browse-first marketplace shell
- When: pre-`2026-04-01`
- Where:
  - `src/app/page.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/components/trip/`
- What was already done:
  - Landing page, public search, and trip-card browse surfaces existed and were wired into the browse-first spare-capacity model.
- Why it matters:
  - This is the core product wedge: inventory-first discovery rather than quote-first demand collection.

### `BASELINE-02` — Carrier onboarding, trip posting, and trip editing
- When: pre-`2026-04-01`
- Where:
  - `src/app/(carrier)/carrier/onboarding/page.tsx`
  - `src/app/(carrier)/carrier/post/page.tsx`
  - `src/app/(carrier)/carrier/trips/[id]/page.tsx`
  - `src/components/carrier/`
- What was already done:
  - Carriers could onboard, upload documents, post trips, and edit live listings.
- Why it matters:
  - Supply creation is the MVP bottleneck; this baseline already gave moverrr a usable carrier-side core.

### `BASELINE-03` — Customer booking lifecycle pages
- When: pre-`2026-04-01`
- Where:
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/app/(customer)/bookings/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/components/booking/`
- What was already done:
  - Booking creation, booking detail, review submission, dispute intake, and proof-backed status management were already represented in the app.
- Why it matters:
  - This meant the product already had an end-to-end customer journey before today’s hardening work.

### `BASELINE-04` — Admin operations surfaces
- When: pre-`2026-04-01`
- Where:
  - `src/app/(admin)/admin/*`
  - `src/components/admin/*`
  - `src/lib/data/admin.ts`
- What was already done:
  - Admin dashboards, carrier review helpers, dispute resolution flows, and bootstrap tooling already existed in the repo.
- Why it matters:
  - Even as an MVP, moverrr already had the beginnings of an operations layer rather than being customer/carrier only.

### `BASELINE-05` — Notifications and webhook safety checks already existed
- When: pre-`2026-04-01`
- Where:
  - `src/lib/notifications.ts`
  - `src/app/api/payments/webhook/route.ts`
- What was already done:
  - Email send failures were already being captured to Sentry.
  - Stripe webhook updates already checked for missing booking rows rather than assuming the update succeeded.
- Why it matters:
  - These were two important safety items from the guide that did not need reimplementation.

### `BASELINE-06` — Core data model, matching RPC, and typed Supabase integration
- When: pre-`2026-04-01`
- Where:
  - `supabase/migrations/001` through `007`
  - `src/lib/data/*`
  - `src/types/database.ts`
- What was already done:
  - PostGIS, core marketplace tables, matching RPCs, RLS policies, indexes, and typed database access were already in place.
- Why it matters:
  - The product already had a real backend shape suitable for continuing toward an MVP, rather than a frontend-only shell.
