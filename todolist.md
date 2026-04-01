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

_No active P0 items right now._

## 🟠 P1 — User-Facing Bugs

_No active P1 items right now._

## 🟡 P2 — UX & Conversion

_No active P2 items right now._

## 🟢 P3 — Enhancements

### ES — Supply-Side Enhancements

- [ ] **ES4** — Multi-vehicle support groundwork
  - **File(s):** `src/components/carrier/carrier-onboarding-form.tsx`, `src/app/(carrier)/carrier/trips/page.tsx`, `src/lib/data/listings.ts`
  - **What:** Remove remaining single-vehicle assumptions from carrier flows so trips can be associated with one of several vehicles later without another UX rewrite.
  - **Why:** Strong carriers will outgrow the single-vehicle model first; deferring the groundwork too long turns the first serious fleet into a migration project.
  - **Done when:** Carrier flows no longer assume exactly one vehicle exists and `npm run check` passes cleanly.

### ED — Demand-Side Enhancements

- [ ] **ED6** — Web push notifications for booking updates
  - **File(s):** `src/lib/notifications.ts`, `new file: public/service-worker.js`, `new file: src/hooks/usePushNotifications.ts`
  - **What:** Add opt-in web push for booking confirmed, trip-day reminder, and delivery-confirmed milestones.
  - **Why:** Same-day logistics needs faster-than-email notification loops before the native iOS app exists.
  - **Done when:** Opted-in customers and carriers receive push notifications for key booking milestones and VAPID env vars are wired.

### EP — Platform and Infrastructure Enhancements

- [ ] **EP4** — `getPrivilegedSupabaseClient` in bookings still allows unsafe fallback paths
  - **File(s):** `src/lib/data/bookings.ts`
  - **What:** Remove silent privileged-client fallbacks for admin-only booking operations so background or cross-user mutations fail loudly instead of no-oping under RLS.
  - **Why:** Silent no-ops leave stale capacity, incomplete audit events, and false confidence in staging or automation flows.
  - **Done when:** Admin-only booking operations hard-fail without service-role access and `npm run check` passes.

- [ ] **EP5** — Analytics deduplication in React strict mode
  - **File(s):** `src/lib/analytics.ts`, components that fire `trackAnalyticsEvent` on mount
  - **What:** Add dedup guards around mount-triggered analytics events so strict-mode double mounts do not double-count funnel activity.
  - **Why:** Inflated preview/dev analytics make conversion baselines noisy before launch.
  - **Done when:** Search and booking-started events fire once per real action in both development and production paths.

- [ ] **EP9** — Input sanitization audit across all freetext fields
  - **File(s):** `src/lib/utils.ts`, `src/app/api/**`
  - **What:** Finish the route-by-route audit to ensure every persisted freetext field is sanitized immediately after validation and before DB writes.
  - **Why:** One missed admin-facing field is enough to leave a stored-XSS hole in the ops surfaces.
  - **Done when:** All mutating freetext routes consistently apply `sanitizeText()` before persistence and `npm run check` passes.

- [ ] **EP10** — Offline-first proof upload with service worker queue
  - **File(s):** `new file: public/service-worker.js`, `new file: src/hooks/useOfflineUpload.ts`, proof upload components under `src/components/booking/`
  - **What:** Queue proof-photo uploads for retry when a carrier is on poor mobile data instead of failing immediately.
  - **Why:** Trip-day proof capture happens in the least reliable network conditions; queued retry is safer than manual re-upload.
  - **Done when:** Offline proof uploads show a queued state and auto-retry when connectivity returns.

### EA — Admin and Ops Enhancements

- [ ] **EA5** — Manual ops override audit trail
  - **File(s):** `src/app/(admin)/admin/bookings/[id]/page.tsx`, `src/lib/data/bookings.ts`, `booking_events` table usage
  - **What:** Require an admin-entered reason for forced status changes, refunds, and other manual overrides, then persist that reason and actor ID to `booking_events`.
  - **Why:** Manual interventions need a durable audit trail for later support reviews and liability questions.
  - **Done when:** Every admin booking override writes `actor`, `action`, `reason`, and `timestamp` to `booking_events`.

- [ ] **EA8** — Admin carrier notes and internal tags
  - **File(s):** `src/app/(admin)/admin/carriers/[id]/page.tsx`, `src/lib/data/carriers.ts`, `supabase/migrations/`
  - **What:** Add separate internal notes and tags such as trusted, probation, flagged, and VIP to carrier admin views.
  - **Why:** Ops needs internal context beyond verification notes without leaking those labels into carrier-facing APIs.
  - **Done when:** Admin carrier detail persists internal notes/tags and they remain invisible to carrier-facing responses.

### EQ — Code Quality and Test Coverage

- [ ] **EQ3** — Atomic booking concurrency integration test
  - **File(s):** `new file: src/lib/__tests__/bookings.integration.test.ts`, local Supabase setup
  - **What:** Prove two simultaneous `create_booking_atomic` attempts against one listing only allow one winner.
  - **Why:** The oversell fix is too important to trust without a real concurrency regression test.
  - **Done when:** Local Supabase integration test reliably shows one success, one `listing_not_bookable`, and correct remaining capacity.

- [ ] **EQ4** — Payment webhook contract tests
  - **File(s):** `new file: src/app/api/payments/webhook/__tests__/route.test.ts`
  - **What:** Cover webhook handling for payment failure, capturable updates, succeeded intents, missing booking metadata, replay-safe paths, and invalid signatures.
  - **Why:** Payment webhooks are a silent-failure hotspot and need fixture-backed contract coverage.
  - **Done when:** Contract tests pass for all target Stripe event cases and invalid signatures return 400.

- [ ] **EQ5** — WCAG 2.1 AA audit and remediation
  - **File(s):** `src/components/**`, `src/app/**`
  - **What:** Run an automated accessibility audit and remediate Level AA issues across browse, booking, and carrier posting flows.
  - **Why:** Accessibility gaps are user-experience gaps on iPhone too, and they compound quickly once more UI ships.
  - **Done when:** Automated audit reports zero AA violations on the search, booking, and carrier-posting flows.

- [ ] **EQ6** — API route input validation coverage audit
  - **File(s):** `src/app/api/**`
  - **What:** Finish converting every mutating API route to named Zod schemas parsed before any DB access.
  - **Why:** Inconsistent validation is a security and data-quality risk, even after the highest-risk routes have been hardened.
  - **Done when:** All mutating API routes use named Zod schemas at the boundary and `npm run check` passes.

- [ ] **EQ8** — Admin route error-boundary coverage
  - **File(s):** `src/app/(admin)/admin/**`, `src/components/shared/error-boundary.tsx`
  - **What:** Wrap admin page sections so a partial loader failure degrades to a retry card instead of crashing the full admin surface.
  - **Why:** Ops needs partial visibility during incidents more than it needs a perfect all-or-nothing dashboard render.
  - **Done when:** Admin sections fail independently with retryable UI and the full admin page no longer hard-crashes on one loader error.

### EV — Visual / Design System

- [ ] **V1** — Consistent card border radius and shadow system
  - **File(s):** `tailwind.config.ts`, `src/components/ui/card.tsx`, `src/components/trip/trip-card.tsx`
  - **What:** Define one shared card token for radius, shadow, and hover/active lift, then apply it everywhere cards appear.
  - **Why:** A cleaner, repeatable card system reduces visual drift as more ops and marketplace surfaces ship.
  - **Done when:** Major card surfaces use one shared token and visual audit at 375px reads as a single system.

- [ ] **V2** — Typography scale constrained on mobile
  - **File(s):** `tailwind.config.ts`, `src/app/globals.css`, major page components
  - **What:** Normalize mobile pages onto a three-size semantic typography scale.
  - **Why:** Too many font sizes make the iPhone layouts feel noisy and less trustworthy.
  - **Done when:** Mobile pages use three or fewer text sizes per page without losing hierarchy.

- [ ] **V4** — Loading state standardization (spinner to skeleton)
  - **File(s):** components using spinner-based loading under `src/components/**`
  - **What:** Replace remaining spinner-only loading states with skeletons or structured Suspense fallbacks.
  - **Why:** Skeletons preserve layout and feel faster on mobile than floating spinners.
  - **Done when:** Spinner-only loading states are removed from shared components in favor of skeleton or Suspense patterns.

- [ ] **V6** — Safe-area CSS audit for all sticky elements
  - **File(s):** `src/app/globals.css`, sticky/fixed UI components under `src/components/**`
  - **What:** Finish the audit so every sticky header, footer, CTA bar, and sheet clears the iPhone home indicator and notch areas.
  - **Why:** One missed sticky element can make the app feel broken on the exact devices MVP users are testing on.
  - **Done when:** All sticky elements respect safe-area insets on iPhone 14/15 class viewports.

- [ ] **V7** — Hover-only state sweep across all components
  - **File(s):** `src/components/**`
  - **What:** Complete the touch-feedback audit so every `hover:` treatment has an `active:` counterpart.
  - **Why:** Hover-only feedback is invisible on iOS and makes taps feel unresponsive.
  - **Done when:** Interactive components no longer rely on hover-only feedback and `npm run check` passes.

### EX — External / Infrastructure

- [ ] **X1** — Vercel environment variable audit
  - **File(s):** `.env.example`, Vercel project settings
  - **What:** Verify production and preview environments contain every required runtime variable documented in the repo.
  - **Why:** Missing deployment env vars are the fastest path to “works locally, fails in production” incidents.
  - **Done when:** `.env.example` is current and Vercel production/preview env sets are confirmed against it.

- [ ] **X3** — Resend domain verification and production sender
  - **File(s):** `.env.example`, `src/lib/notifications.ts`, Resend dashboard, DNS provider
  - **What:** Verify the sending domain and switch lifecycle email to a branded production sender address.
  - **Why:** Branded deliverability matters for booking confirmations and dispute communication trust.
  - **Done when:** SPF/DKIM pass and lifecycle emails arrive from the branded sender in inboxes.

- [ ] **X6** — Deployment preview URLs for PRs
  - **File(s):** `.github/workflows/ci.yml`, Vercel project settings
  - **What:** Confirm each PR gets a live Vercel preview URL surfaced back into GitHub for review.
  - **Why:** Mobile-first UI review is materially faster with a live preview than a code-only pass.
  - **Done when:** Every PR against `main` shows a working Vercel preview URL in GitHub checks.

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
- [ ] **P4-26** — Carrier "availability calendar" — block out dates they can't run
- [ ] **P4-27** — Customer "I need a move by [date]" reverse listing
- [ ] **P4-28** — Carrier-to-carrier job handoff for routes they can't service
- [ ] **P4-29** — Automated dispute categorisation using LLM on description text
- [ ] **P4-30** — SMS notifications as fallback when push/email not engaged
