# moverrr — Active Backlog

> Last refreshed: `2026-04-01`
> Format governed by `TASK-RULES.md`. Work top-to-bottom within each priority level.
> Move completed items to `completed.md` — never mark done in this file.

---

## Product Guardrails (Read Before Touching Any Item)

- moverrr is a **browse-first spare-capacity marketplace**. Not dispatch, not removalist booking, not AI matching.
- Commission math in `src/lib/pricing/breakdown.ts` is frozen unless explicitly discussed.
- iPhone-first rules are non-negotiable: `min-h-[44px]`, `active:` alongside every `hover:`, `capture="environment"` on proof inputs, safe-area insets on fixed elements.
- Trust beats cleverness. Supply speed beats polish.

---

## 🔴 P0 — Production Blocking

*Data loss, payment errors, oversell, security holes. Fix before any real users.*

---

## 🟢 P3 — Enhancements

*Operational tools, polish, trust builders. Grouped by area.*

### ES — Supply-Side Enhancements

- [ ] **ES4** — Multi-vehicle support groundwork
  - **File(s):** `src/components/carrier/carrier-onboarding-form.tsx`, `src/app/(carrier)/carrier/trips/page.tsx`, `src/lib/data/listings.ts`
  - **What:** Remove hardcoded "single vehicle" assumptions from carrier flows so a carrier can eventually associate a trip with one of several vehicles.
  - **Why:** Strong carriers run more than one vehicle; locking to single-vehicle now will require a painful migration when the first multi-vehicle carrier onboards.
  - **Done when:** `npm run check` passes with no regressions; no code path assumes a carrier has exactly one vehicle.


### ED — Demand-Side Enhancements

- [ ] **ED6** — Web push notifications for booking updates
  - **File(s):** `src/lib/notifications.ts`, `public/service-worker.js` (new), `src/hooks/usePushNotifications.ts` (new)
  - **What:** Implement web push via the Push API for key booking events (booking confirmed, trip day reminder, delivery confirmed) with an opt-in prompt on booking creation.
  - **Why:** Email is too slow for same-day logistics; push notifications are the next-best option before a native app exists.
  - **Done when:** Customers and carriers who opt in receive push notifications for key booking milestones; VAPID keys are configured via env vars.

### EP — Platform and Infrastructure Enhancements

- [ ] **EP5** — Analytics deduplication in React strict mode
  - **File(s):** `src/lib/analytics.ts` or analytics hooks, any component that fires `trackAnalyticsEvent` on mount
  - **What:** Use a `useRef` dedup guard to prevent double-firing of analytics events in React 18 strict mode's double-mount behavior.
  - **Why:** Strict mode double-mounts inflate event counts in development and on Vercel preview deployments, polluting analytics before launch.
  - **Done when:** Search and booking-started events fire exactly once per user action in both development and production; verified via analytics dashboard.

- [ ] **EP9** — Input sanitization audit across all freetext fields
  - **File(s):** `src/lib/utils.ts` (`sanitizeText`), all API routes accepting freetext
  - **What:** Verify `sanitizeText()` is applied after Zod parse for all freetext fields across trips, bookings, disputes, reviews, and carrier notes.
  - **Why:** HTML injection in freetext fields is a stored XSS risk on admin views; a systematic audit ensures no field was missed.
  - **Done when:** `grep -r "specialNotes\|itemDescription\|disputeDescription\|reviewComment"` in API routes shows `sanitizeText` applied to each; `npm run check` passes.

- [ ] **EP10** — Offline-first proof upload with service worker queue
  - **File(s):** `public/service-worker.js`, `src/hooks/useOfflineUpload.ts` (new)
  - **What:** Queue proof photo uploads in a service worker background sync when the carrier is on spotty mobile data, retrying when connection recovers.
  - **Why:** Trip-day proof uploads happen on-site in areas with variable signal; a failed upload should queue, not require the carrier to retry manually.
  - **Done when:** Proof uploads attempted offline are queued and automatically retried; carrier sees a "Queued for upload" state, not an error.

### EA — Admin and Ops Enhancements

- [ ] **EA3** — Admin bulk carrier approve/reject
  - **File(s):** `src/app/(admin)/admin/verification/page.tsx`, `src/components/admin/verification-queue.tsx`
  - **What:** Add checkboxes to the verification queue with a bulk approve/reject action bar that processes all selected carriers in one API call.
  - **Why:** Early ops will have batches of verifications to process; doing them one-by-one is the bottleneck that delays supply activation.
  - **Done when:** Admin can select 5+ carriers and bulk-approve or bulk-reject with one confirmation; each action is logged with the admin ID.

- [ ] **EA5** — Manual ops override audit trail
  - **File(s):** `src/app/(admin)/admin/bookings/[id]/page.tsx`, `booking_events` table usage
  - **What:** Require an admin-entered reason for any forced status change, refund, or dispute closure; write the reason and admin ID to `booking_events`.
  - **Why:** Without an audit trail, manual overrides are invisible and create liability if a customer disputes them later.
  - **Done when:** Every admin action on a booking writes a `booking_events` row with `actor`, `action`, `reason`, and `timestamp`.

- [ ] **EA6** — Admin booking support quick view
  - **File(s):** `src/app/(admin)/admin/bookings/page.tsx`, `src/app/(admin)/admin/bookings/[id]/page.tsx`
  - **What:** Add a search bar to the admin booking list that searches by booking reference, customer email, and carrier email; add a "Quick view" panel for the 10 most common support actions.
  - **Why:** Support queries arrive as "customer X says their booking is stuck" — ops needs fast lookup and one-click actions without reading raw DB records.
  - **Done when:** Admin can find any booking by reference in under 5 seconds and execute cancel, refund, or status-override from the same view.

- [ ] **EA8** — Admin carrier notes and internal tags
  - **File(s):** `src/app/(admin)/admin/carriers/[id]/page.tsx`, carrier data model, `supabase/migrations/`
  - **What:** Add an internal notes field and tag taxonomy (trusted, probation, flagged, VIP) to the admin carrier view that are never exposed to carriers.
  - **Why:** Ops needs a way to annotate carriers based on behavior patterns without surfacing those labels to the carrier.
  - **Done when:** Admin carrier detail has a notes textarea and tag selector; notes and tags persist; they are invisible to carrier-facing APIs.

### EQ — Code Quality and Test Coverage

- [ ] **EQ1** — Booking status machine unit tests
  - **File(s):** `src/lib/__tests__/status-machine.test.ts` (new), Vitest setup
  - **What:** Install Vitest, write tests for all valid transitions and all invalid transitions (completed→pending, cancelled→confirmed), and the special `disputed→completed` guard behavior.
  - **Why:** State machine regressions are easy to introduce and extremely expensive in a live marketplace; tests are the minimum safety net.
  - **Done when:** `npm run test` passes; all valid transitions are covered; invalid ones assert a thrown error or false return.

- [ ] **EQ2** — Pricing breakdown regression tests
  - **File(s):** `src/lib/__tests__/breakdown.test.ts` (new)
  - **What:** Test `calculateBookingBreakdown` with zero extras, with stairs, with helper, with both, and assert the identity equation: `total = payout + commission + bookingFee`.
  - **Why:** Commission math is a product truth, not an implementation detail; a silent drift is a financial and trust failure.
  - **Done when:** Identity assertions pass for all input combinations; commission is confirmed to apply to base price only.

- [ ] **EQ3** — Atomic booking concurrency integration test
  - **File(s):** `src/lib/__tests__/bookings.integration.test.ts` (new), Supabase local
  - **What:** Fire two simultaneous `create_booking_atomic` RPC calls against the same listing and assert exactly one succeeds; the other returns `listing_not_bookable`.
  - **Why:** The race condition fix needs a regression test that proves only one booking wins under concurrent load.
  - **Done when:** Concurrent booking test passes reliably in the local Supabase environment; capacity is correct after both attempts resolve.

- [ ] **EQ4** — Payment webhook contract tests
  - **File(s):** `src/app/api/payments/webhook/__tests__/route.test.ts` (new)
  - **What:** Write tests for `payment_failed`, `amount_capturable_updated`, `payment_intent.succeeded`, missing booking metadata, and replay-safe paths using Stripe fixture events.
  - **Why:** Webhook behavior drifts as event semantics evolve; untested webhook logic is the most common source of silent payment failures.
  - **Done when:** All five event scenarios are covered; tests pass with `npm run test`; invalid signatures return 400.

- [ ] **EQ5** — WCAG 2.1 AA audit and remediation
  - **File(s):** `src/components/**`, `src/app/**`
  - **What:** Run an automated WCAG audit (axe-core or similar) and remediate all Level AA failures: missing labels, color contrast, focus management in modals, and keyboard traps.
  - **Why:** iOS accessibility tools (VoiceOver) are used by a meaningful portion of users; WCAG compliance is also an App Store requirement for native submission.
  - **Done when:** `axe-core` reports zero Level AA violations on the search, booking, and carrier posting flows.

- [ ] **EQ6** — API route input validation coverage audit
  - **File(s):** `src/app/api/**`
  - **What:** Ensure every mutating API route (POST, PUT, PATCH, DELETE) begins with Zod schema parse and returns a structured 400 before any DB operation.
  - **Why:** Inconsistent validation is a security and data-quality risk; unvalidated routes are the most common source of bad data in early-stage products.
  - **Done when:** All mutating routes parse input with a named Zod schema before DB access; `npm run check` passes.

- [ ] **EQ7** — Stale date fix in seed data
  - **File(s):** `supabase/seed.sql`
  - **What:** Replace all hardcoded trip dates in seed data with expressions relative to `CURRENT_DATE + interval` so the demo always shows future trips.
  - **Why:** Hardcoded dates go stale and make the dev environment look empty after the date passes; this caused confusion during early testing.
  - **Done when:** `supabase db reset` produces listings with dates in the future; no hardcoded calendar dates in seed.sql.

### EV — Visual / Design System

- [ ] **V1** — Consistent card border radius and shadow system
  - **File(s):** `tailwind.config.ts`, `src/components/ui/card.tsx`, `src/components/trip/trip-card.tsx`
  - **What:** Define a single `card` token in Tailwind with standardized border radius (12px), box shadow, and hover lift — apply it to all card variants.
  - **Why:** Trip cards, booking cards, and admin cards currently use different border radii and shadow depths; visual inconsistency makes the product feel unpolished.
  - **Done when:** All card components use the same token; visual audit at 375px shows a coherent card system.

- [ ] **V2** — Typography scale — constrain to 3 sizes on mobile
  - **File(s):** `tailwind.config.ts`, `src/app/globals.css`, major page components
  - **What:** Define a mobile typography scale with exactly three semantic sizes (heading, body, caption) and enforce it across search results, booking detail, and carrier dashboard.
  - **Why:** Current pages mix 6+ type sizes creating visual noise on small screens; fewer sizes means faster reading and stronger hierarchy.
  - **Done when:** Mobile view uses ≤3 font sizes per page; pages still render correctly on 375px iPhone SE viewport.

- [ ] **V4** — Loading state standardization (spinner → skeleton)
  - **File(s):** All components using `isLoading` with spinners
  - **What:** Replace all spinner/loading indicators with skeleton components that match the shape of the loaded content; use Suspense where possible.
  - **Why:** Spinners cause layout shift when content loads; skeletons maintain page structure and feel faster.
  - **Done when:** `grep -r "Spinner\|loading-spinner"` returns zero results in `src/components`; all loading states use skeleton or Suspense fallback.

- [ ] **V6** — Safe-area CSS audit — all sticky elements
  - **File(s):** `src/app/globals.css`, `src/components/layout/site-header.tsx`, all sticky/fixed elements
  - **What:** Audit every sticky and fixed element (nav, wizard footer, booking CTA bar) and ensure `padding-bottom: env(safe-area-inset-bottom)` is applied.
  - **Why:** On iPhone with home indicator, sticky footers overlap the last interactive element if safe-area is missing; this is a blocking UX issue on current hardware.
  - **Done when:** All sticky elements clear the home indicator on iPhone 14/15; verified in Chrome DevTools with "iPhone 14 Pro" device preset.

- [ ] **V7** — Hover-only state sweep across all components
  - **File(s):** `src/components/**`
  - **What:** Run `grep -r "hover:" src/components` and add matching `active:` state to every occurrence that lacks one.
  - **Why:** Hover-only feedback is invisible on iOS; every touch target must have `active:` feedback so taps feel responsive.
  - **Done when:** `grep -r "hover:" src/components` shows no line without an adjacent `active:` class; verified manually on iPhone viewport.

### EX — External / Infrastructure

- [ ] **X1** — Vercel environment variable audit
  - **File(s):** `.env.example` (update), Vercel project settings
  - **What:** Create/update `.env.example` with all required and optional environment variables with descriptions; verify all required vars are set in Vercel production and preview environments.
  - **Why:** Missing env vars in production fail silently until a specific code path is hit; a documented `.env.example` prevents deployment gaps.
  - **Done when:** `.env.example` lists all vars from `assertRequiredEnv()` with descriptions; confirmed all are set in Vercel dashboard.

- [ ] **X3** — Resend domain verification and production sender
  - **File(s):** Resend dashboard, `.env.example`, `src/lib/notifications.ts`
  - **What:** Verify the sender domain in Resend, update `FROM_EMAIL` env var to a branded address (e.g. `notifications@moverrr.com.au`), and test lifecycle emails in production.
  - **Why:** Emails from `@resend.dev` land in spam on many clients; a verified domain is required for production deliverability.
  - **Done when:** Lifecycle emails (booking confirmation, dispute update) arrive in inbox from the branded address; SPF and DKIM pass.

- [ ] **X6** — Deployment preview URLs for PRs
  - **File(s):** `.github/workflows/ci.yml`, Vercel project settings
  - **What:** Confirm Vercel preview deployments are enabled for all PRs and that the preview URL is posted as a GitHub check so reviewers can test changes live.
  - **Why:** Text review of UI changes is slow and error-prone; a live preview per PR is the minimum for a mobile-first product.
  - **Done when:** Every PR against `main` gets a Vercel preview URL posted as a GitHub check; preview uses preview environment variables.

---

## ⚪ P4 — Post-MVP / Deferred

*Good ideas, not now. One line each — documented so they are not lost.*

- [ ] **P4-01** — LLM item classification from customer photo or description
- [ ] **P4-02** — Fixed price per item category (sofa, fridge, etc.) instead of carrier-set price
- [ ] **P4-03** — Percentage-based booking fee (3%) replacing the flat $5 — review after 50+ jobs
- [ ] **P4-04** — In-app messaging between carrier and customer
- [ ] **P4-05** — Interactive map view of active listings (pins on a map)
- [ ] **P4-06** — Live GPS tracking of carrier on trip day
- [ ] **P4-07** — Bidding / counter-offer flow for price negotiation
- [ ] **P4-08** — Surge pricing on high-demand routes or dates
- [ ] **P4-09** — Native iOS app (Swift / React Native) — web is for testing only at MVP
- [ ] **P4-10** — Native Android app
- [ ] **P4-11** — Multi-stop trip support (more than one pickup or dropoff)
- [ ] **P4-12** — Corporate/B2B accounts for business relocations
- [ ] **P4-13** — Carrier insurance-verification API integration (auto-check expiry)
- [ ] **P4-14** — Automated payout release via Stripe Connect scheduled transfers
- [ ] **P4-15** — Customer loyalty / repeat-booking discount
- [ ] **P4-16** — Carrier referral program ("refer another carrier, earn $50")
- [ ] **P4-17** — Freight broker / 3PL integration for large-volume shippers
- [ ] **P4-18** — National expansion beyond Sydney metro
- [ ] **P4-19** — Two-way carrier verification via government API (digital licence check)
- [ ] **P4-20** — Embedded insurance option for customer items
- [ ] **P4-21** — Customer item storage (short-term warehousing via carrier network)
- [ ] **P4-22** — Route optimization suggestions for carriers with multiple bookings
- [ ] **P4-23** — Carbon offset option at checkout
- [ ] **P4-24** — Carrier cooperative / shared fleet model
- [ ] **P4-25** — Subscription tier for high-volume carriers (reduced commission)
