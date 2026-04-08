# moverrr — Active Backlog

> Last refreshed: `2026-04-08` — backlog reconciled against the current local codebase and latest verification pass
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

---

## 🟠 P1 — User-Facing Bugs

---

## 🟡 P2 — UX & Conversion

---

## 🟢 P3 — Enhancements

### ES — Supply-Side Enhancements

### ED — Demand-Side Enhancements

- [ ] **ED4** — Booking-confirmed customer notification still needs end-to-end verification
  - **File(s):** `src/lib/data/bookings.ts`, `src/lib/notifications.ts`
  - **What:** The confirmed-booking email flow exists in code, but it still needs a full booking → carrier confirm → email verification run against real env wiring.
  - **Why:** Booking confirmation is the top trust moment in the customer journey. Silence after authorization feels like failure.
  - **Done when:** Manual booking flow confirms the customer receives the confirmed-booking email with booking reference, route, date, price, and next steps.

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

- [ ] **EP9** — Input sanitization audit is still incomplete on non-trip/booking write paths
  - **File(s):** `src/lib/utils.ts`, `src/app/api/**`, `src/lib/data/carriers.ts`
  - **What:** Review the remaining carrier/admin freetext write paths that were not covered by the latest audit pass. Feedback-response sanitization is now in place, but the broader carrier/admin profile and notes sweep still needs a source-of-truth checklist.
  - **Why:** One missed admin-facing or public-profile field is enough to leave a stored-XSS hole in the trust and ops surfaces.
  - **Done when:** The remaining carrier/admin freetext mutations are enumerated, sanitized before persistence, and verified with `npm run check`.

- [ ] **EP10** — Offline-first proof upload with service worker queue
  - **File(s):** `new file: public/service-worker.js`, `new file: src/hooks/useOfflineUpload.ts`, proof upload components under `src/components/booking/`
  - **What:** Queue proof-photo uploads for retry when a carrier is on poor mobile data instead of failing immediately.
  - **Why:** Trip-day proof capture happens in the least reliable network conditions; queued retry is safer than manual re-upload.
  - **Done when:** Offline proof uploads show a queued state and auto-retry when connectivity returns.

- [ ] **EP12** — Metadata coverage is improved but still incomplete on many internal pages
  - **File(s):** page-level files under `src/app/(carrier)`
  - **What:** Admin pages plus customer bookings, saved-searches, and auth verify now export page-specific metadata. The remaining gap is consistent metadata coverage across carrier internal pages that still inherit the layout default title.
  - **Why:** Distinct titles matter for tab clarity, indexing, and ops usability when multiple moverrr tabs are open.
  - **Done when:** Carrier internal pages export page-specific `metadata.title` or `generateMetadata()` and `npm run check` passes.

### EA — Admin and Ops Enhancements

- [ ] **EA8** — Admin carrier notes and internal tags
  - **File(s):** `src/app/(admin)/admin/carriers/[id]/page.tsx`, `src/lib/data/carriers.ts`, `supabase/migrations/`
  - **What:** Add separate internal notes and tags such as trusted, probation, flagged, and VIP to carrier admin views.
  - **Why:** Ops needs internal context beyond verification notes without leaking those labels into carrier-facing APIs.
  - **Done when:** Admin carrier detail persists internal notes/tags and they remain invisible to carrier-facing responses.

### EQ — Code Quality and Test Coverage

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

- [ ] **EQ7** — `booking-form.tsx` and `carrier-trip-wizard.tsx` form state tests
  - **File(s):** `new file: src/components/booking/__tests__/booking-form.test.tsx`, `new file: src/components/carrier/__tests__/carrier-trip-wizard.test.tsx`
  - **What:** Add unit tests covering: draft persistence/restoration, payment retry state, file upload with WebP/HEIC, form disable during submission, step validation blocking, and options-adjusted price updates.
  - **Why:** Both forms are the highest-traffic, highest-impact components and have zero test coverage today.
  - **Done when:** Tests pass and cover all states enumerated above, with `npm run check` clean.

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

- [ ] **V3** — `section-label` eyebrow text is overused — appears on 10+ cards per page
  - **File(s):** `src/app/globals.css`, all page components
  - **What:** Every card on the carrier dashboard, booking detail, and trip detail uses `.section-label` as an eyebrow. The pattern loses meaning when it appears 15 times on one page. Reserve it for primary section headers only.
  - **Why:** Overuse of eyebrow labels makes every section feel equally important — nothing is highlighted as primary.
  - **Done when:** `section-label` is used ≤3 times per page, and secondary card content uses `subtle-text` or plain `text-sm text-text-secondary` instead.

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

- [ ] **V8** — Dark mode: `bg-surface` and `bg-background` contrast insufficient in dark theme
  - **File(s):** `tailwind.config.ts`, `src/app/globals.css`
  - **What:** Dark mode is enabled via `dark:` Tailwind variants throughout the codebase, but the contrast ratio between `bg-surface` (card background) and `bg-background` (page background) in dark mode may be below WCAG AA ratio of 4.5:1 for text and insufficient card differentiation.
  - **Why:** Carriers using the app on trip day in low-light (van interior, car park) rely on dark mode for readability. Insufficient contrast in dark mode is an accessibility and safety concern.
  - **Done when:** Dark mode color pairs pass contrast checking for all text-on-background combinations, verified with a tool like `axe` or Chrome DevTools contrast checker.

### EX — External / Infrastructure

- [ ] **X1** — Vercel environment variable audit
  - **File(s):** `.env.example`, Vercel project settings
  - **What:** Verify production and preview environments contain every required runtime variable documented in the repo.
  - **Why:** Missing deployment env vars are the fastest path to "works locally, fails in production" incidents.
  - **Done when:** `.env.example` is current and Vercel production/preview env sets are confirmed against it.

- [ ] **X2** — No structured Sentry source maps for production builds
  - **File(s):** `src/lib/sentry.ts`, `next.config.js`, `package.json`
  - **What:** Sentry is initialized but source maps may not be uploaded at build time. Without source maps, Sentry error reports show minified stack traces that are unreadable.
  - **Why:** Production bugs captured by Sentry are uninvestigable without source maps. The error capture investment is wasted.
  - **Done when:** `@sentry/nextjs` is configured with `sentry.server.config.ts` and `sentry.client.config.ts`, build CI uploads source maps to Sentry, and a test error shows readable stack traces in Sentry.

- [ ] **X3** — Resend domain verification and production sender
  - **File(s):** `.env.example`, `src/lib/notifications.ts`, Resend dashboard, DNS provider
  - **What:** Verify the sending domain and switch lifecycle email to a branded production sender address.
  - **Why:** Branded deliverability matters for booking confirmations and dispute communication trust.
  - **Done when:** SPF/DKIM pass and lifecycle emails arrive from the branded sender in inboxes.

- [ ] **X4** — Health endpoint exists, but external degraded-state monitoring is not wired
  - **File(s):** `src/app/api/health/route.ts`, monitoring config outside repo
  - **What:** `/api/health` now returns structured component status for env, Supabase, Stripe, and Redis. The remaining gap is wiring an external monitor that alerts when the response reports a degraded dependency.
  - **Why:** Component-level health is only useful if someone gets paged before users notice the outage.
  - **Done when:** A monitoring tool polls `/api/health`, alerts on `"overall":"degraded"`, and is documented alongside the endpoint contract.

- [ ] **X6** — Deployment preview URLs for PRs
  - **File(s):** `.github/workflows/ci.yml`, Vercel project settings
  - **What:** Confirm each PR gets a live Vercel preview URL surfaced back into GitHub for review.
  - **Why:** Mobile-first UI review is materially faster with a live preview than a code-only pass.
  - **Done when:** Every PR against `main` shows a working Vercel preview URL in GitHub checks.

---

### EL — Listing Quality & Carrier Posting UX
- [ ] **EL3** — Listing quality gate: soft warning before publishing incomplete listings
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/validation/trip.ts`
  - **What:** Publish-quality warnings now cover vague timing, missing handling notes, and weak rule clarity. The remaining follow-up is to extend that warning system once vehicle media exists so listing completeness can include photo-backed trust without inventing a nonexistent field now.
  - **Why:** Incomplete listings harm browse quality for all customers. A soft gate reduces poor inventory reaching search without blocking motivated carriers.
  - **Done when:** Vehicle media exists in the posting model and the publish-warning system can flag missing photos without blocking publish.

- [ ] **EL4** — Post-publish first-trip onboarding checklist for new carriers
  - **File(s):** `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/components/carrier/`
  - **What:** After a carrier publishes their first trip ever, show a one-time checklist: Verify payout setup → Complete carrier profile → Add vehicle photo → Review proof checklist → Respond within 2h to bookings. Each item links directly to the relevant settings page.
  - **Why:** New carriers who publish but don't complete payout setup or profile miss bookings or cannot receive money. The checklist catches the most common post-publish activation gaps.
  - **Done when:** First-trip success state shows checklist once with working links. Re-visiting the page does not re-show the checklist.

### ET — Trust, Copy & Customer Clarity

- [ ] **ET3** — Item-type search filters using customer language
  - **File(s):** `src/components/search/search-filters.tsx`, `src/app/api/search/route.ts`
  - **What:** Add item-type filter chips: Single furniture, Appliance, Marketplace pickup, Student move, Office overflow, Boxes. Map to existing `item_category` values or a combined filter.
  - **Why:** Customers think in item terms, not logistics terms. Matching filters improve result quality and reduce mismatch bookings.
  - **Done when:** Customers can filter by item type, results narrow correctly. `npm run check` passes.

- [ ] **ET4** — Compact trust signals row on browse cards
  - **File(s):** `src/components/trip/trip-card.tsx`, `src/lib/data/trips.ts`
  - **What:** Search cards now carry a compact trust row for verification, payout readiness, and review signals. The remaining delta is surfacing a truthful completed-jobs count in that same row once listing queries expose a stable completed-job metric.
  - **Why:** Trust must be legible before the user taps through. One compact trust signal on the card improves click quality and sets correct expectations.
  - **Done when:** Cards show verification/review signals plus a real completed-jobs count when that metric is available in the browse query.

- [ ] **ET5** — Carrier profile: layered trust badges (ID checked, payout ready, proof history)
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx`, `src/components/carrier/carrier-profile-card.tsx`
  - **What:** Split the single "verified" indicator into layered specific badges: ID verified, Business details added, Payout setup complete, Insurance on file, Completed X bookings with proof. Each badge has a short tooltip explaining what it means.
  - **Why:** A single "Verified" badge is too vague to build trust. Specific badges show what was actually checked and when.
  - **Done when:** Carrier profile page shows granular trust badges. Tooltips explain each badge. No badges shown for uncompleted checks. `npm run check` passes.

- [ ] **ET7** — Trip detail: what's included vs not included structured block
  - **File(s):** `src/app/(customer)/trip/[id]/page.tsx`, `src/components/trip/trip-detail-summary.tsx`, carrier posting wizard
  - **What:** Add a structured included/not-included block from listing rules: Included — loading, blankets, transit. Not included — disassembly, stair buildings, items over 100kg. Carriers populate this during trip creation.
  - **Why:** Most move disputes come from unstated assumptions. Explicit inclusions/exclusions before booking reduce trip-day surprises.
  - **Done when:** Trip detail shows the block. Carriers can control content via listing fields. `npm run check` passes.

- [ ] **ET10** — Carrier payout ledger with CSV export
  - **File(s):** `src/app/(carrier)/carrier/payouts/page.tsx`, `src/lib/data/bookings.ts`
  - **What:** Show carriers a line-item ledger: booking reference, route date, base earnings, 15% fee deduction, net payout, payout status. Group by month. Add CSV export button.
  - **Why:** Carriers need to reconcile earnings for tax and accounting. Without a ledger, they contact support — friction that hurts repeat-carrier retention.
  - **Done when:** Payouts page shows ledger with math from `breakdown.ts`. CSV export produces a valid file. `npm run check` passes.

- [ ] **ET11** — Booking price breakdown consistency across all views
  - **File(s):** `src/components/booking/booking-checkout-panel.tsx`, `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(admin)/admin/bookings/[id]/page.tsx`, `src/components/trip/trip-card.tsx`
  - **What:** Ensure every surface uses the same breakdown function from `src/lib/pricing/breakdown.ts`. Audit and replace any inline pricing math on any surface with a call to the canonical function.
  - **Why:** Inconsistent pricing across views creates confusion and support tickets. One canonical source eliminates drift.
  - **Done when:** All surfaces produce identical breakdowns for the same booking. No surface has inline pricing math. `npm run check` passes.

- [ ] **ET12** — Trust center page (`/trust`)
  - **File(s):** new page: `src/app/(marketing)/trust/page.tsx`, `src/components/layout/site-footer.tsx`
  - **What:** Create a `/trust` page covering: payment protection, identity verification, proof capture process, dispute process, prohibited behavior, and privacy basics. Short sections, plain language. Link from footer.
  - **Why:** Support needs one canonical trust reference to link. Customers who are uncertain need one place to check without contacting support.
  - **Done when:** `/trust` page exists, is in the site footer, content is accurate for the current product, renders cleanly at 375px.

- [ ] **ET13** — Audit and rewrite vague trust copy to evidence-led language sitewide
  - **File(s):** marketing pages, `src/app/(customer)/trip/[id]/page.tsx`, checkout copy, site header copy
  - **What:** Find and replace all instances of "safe and secure," "trusted," "vetted" used without specifics. Replace with proof-led copy: "Payment held until you confirm delivery" instead of "Secure payments." Document each replacement.
  - **Why:** Vague corporate trust claims read as marketing noise. Specific, factual statements build real confidence — especially for first-time users.
  - **Done when:** No customer-facing page uses generic trust claims without concrete backing. Copy changes are documented.

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
- [ ] **P4-24** — Carrier earnings export as CSV for tax/accounting
- [ ] **P4-25** — Customer booking history PDF export
- [ ] **P4-26** — Review system: double-blind (hold both reviews until both parties submit or window expires)
- [ ] **P4-27** — Review system: structured sub-ratings (communication, item care, punctuality, proof quality, listing accuracy)
- [ ] **P4-28** — Review system: one public carrier reply per review (bounded, factual response only)
- [ ] **P4-29** — Review system: moderation policy examples published for categories of removable reviews
- [ ] **P4-30** — In-app messaging: thread header showing current booking status and next required action
- [ ] **P4-31** — In-app messaging: structured prompt chips (confirm dimensions, ask about stairs, share access photo)
- [ ] **P4-32** — In-app messaging: carrier quick replies for common access and dimension questions
- [ ] **P4-33** — In-app messaging: visible response deadline per thread for critical booking states
- [ ] **P4-34** — In-app messaging: image upload labels (item photo, pickup area, delivery proof, damage evidence)
- [ ] **P4-35** — Search: route corridor featured shelves (Eastern Suburbs pickups, Inner West → City, etc.)
- [ ] **P4-36** — Search: support-risk aware ranking (blend trust, completeness, response rate into ordering)
- [ ] **P4-37** — Trip detail: comparison drawer to view two or three listings side by side
- [ ] **P4-38** — Posting flow: live preview of how the listing card will look in search while creating
- [ ] **P4-39** — Posting flow: route frequency tracker (shows carrier how often their route type historically converts)
- [ ] **P4-40** — Carrier profile: route expertise section (repeated corridors, common item types handled, completion history)
- [ ] **P4-41** — Carrier profile: response speed and booking reliability shown in customer-friendly format
- [ ] **P4-42** — Scam reporting button on listings, carrier profiles, and suspicious in-app notifications
- [ ] **P4-43** — Carrier reliability streaks (positive reinforcement for completed job streaks with clean proof and fast responses)
- [ ] **P4-44** — Saved trip templates for repeat customers (save recurring move details for quick rebooking)
- [ ] **P4-45** — Carrier departure safety checklist before trip day (load restraint, secure packing, visibility check)
- [ ] **P4-46** — Proof quality coaching after upload (flag blurry, incomplete, or missing-angle proof photos)
- [ ] **P4-47** — Route performance analytics for carriers (which routes convert, which item types book most)
- [ ] **P4-48** — Experiment review ritual: monthly review of near-miss experiments and pending keep/discard decisions
- [ ] **P4-49** — Weekly operating review ritual with documented format (instruction quality, verification debt, trust incidents)
- [ ] **P4-50** — Cross-project operating system template (distill best moverrr agent/rule/skill patterns for future repos)
- [ ] **P4-51** — Carrier badge freshness: show when verification was last confirmed and highlight documents needing renewal
- [ ] **P4-52** — Carrier profile proof gallery: show selected before/after, pickup, and delivery proof examples from past work
- [ ] **P4-53** — Day-of-move urgent direct contact mode: unlock tap-to-call only after booking confirmed and trip is same-day
- [ ] **P4-54** — Message risk detection: flag off-platform payment prompts or suspicious patterns in threads for admin review
- [ ] **P4-55** — Dispute center: centralize disputes with structured reason codes, evidence upload, and deadline tracking
- [ ] **P4-56** — Cancellation policy matrix: define outcomes for each cancellation scenario (pre-confirm, post-confirm, carrier cancel, failed access)
- [ ] **P4-57** — Partial refund rules tied to evidence, timeline, and completed portion of the job
- [ ] **P4-58** — Rebook from completed trip: let customers rebook a trusted carrier on a similar corridor in one tap

---

---

## Moverrr — MVP Critical Blockers and Product Gaps

> Added: `2026-04-08` — based on deep repo review. These items reflect what the code actually shows vs what needs to exist for a working MVP. These are the real gaps, not wishlist items.
> Format: each item answers who it affects, what exactly needs to exist, where the code is, and what done looks like.
> Work these before anything in the P3/P4 backlog and before agentic infrastructure. Product truth first.

---

### Stripe Connect Express onboarding is not implemented — carriers cannot receive payouts

- **Priority:** P0
- **Stage:** Now
- **Type:** Product / Payments
- **Why this matters:** The carrier payouts page shows "Finish payout setup" and links to `/carrier/onboarding`. The onboarding page only captures documents and business details. There is no Stripe Connect Express account creation code, no `stripe.accounts.create()` call, no `stripe.accountLinks.create()` call, and no redirect to Stripe's hosted onboarding flow. `stripe_account_id` is null for all carriers. The field exists in the schema (`carriers.stripe_account_id`, `carriers.stripe_onboarding_complete`). Funds can be authorized, but **no payout can ever be released** because there is no connected account to pay into. This is a total blocker for carrier economics.
- **What exactly needs to be done:** Build a Stripe Connect Express onboarding flow. Specifically: (1) Create a new API route `POST /api/carrier/stripe/connect-start` that calls `stripe.accounts.create({ type: 'express', country: 'AU', ... })`, stores the returned `account_id` in `carriers.stripe_account_id`, then generates an account link via `stripe.accountLinks.create({ account, refresh_url, return_url, type: 'account_onboarding' })` and redirects the carrier there. (2) Create a return route `GET /api/carrier/stripe/connect-return` that checks the account status via `stripe.accounts.retrieve(account_id)`, sets `stripe_onboarding_complete = true` and `onboarding_completed_at = now()` if `charges_enabled` and `payouts_enabled` are true. (3) Add a prominent CTA on the carrier payouts page and dashboard to trigger this flow when `stripe_onboarding_complete = false`. (4) Add a payout release mechanism: when a booking moves to `completed`, the admin payments page should allow triggering `stripe.transfers.create()` or `stripe.paymentIntents.capture()` to move funds to the carrier's connected account. (5) Add a Stripe Connect webhook listener for `account.updated` events to keep `stripe_onboarding_complete` in sync.
- **Likely areas affected:** `src/app/api/carrier/stripe/` (new files), `src/app/(carrier)/carrier/payouts/page.tsx`, `src/app/(carrier)/carrier/onboarding/page.tsx`, `src/lib/stripe/` (new connect helpers), `src/app/api/payments/webhook/route.ts` (add account.updated handler), `supabase/migrations/` (no schema change needed, columns exist)
- **Dependencies / open questions:** STRIPE_SECRET_KEY must be configured with Connect capabilities enabled. Need to decide: manual admin-triggered payout release or automatic on `completed` status? For MVP, manual admin trigger (EA7 in existing backlog) is safer. Founder must decide payout timing — immediately on completed, or on a schedule?
- **Edge cases / failure modes:** Carrier starts onboarding but abandons mid-flow (Stripe calls the `refresh_url` — need a "Resume payout setup" flow). Carrier account gets restricted by Stripe after approval. `stripe.transfers.create()` fails because of negative balance on platform account. Carrier hasn't set up bank account in Stripe but `charges_enabled` is true.
- **Acceptance criteria:** A test carrier can click "Set up payouts," be redirected to Stripe Connect Express, complete onboarding, return to moverrr with `stripe_onboarding_complete = true` in the database, and the payout dashboard shows "Payout setup complete." Admin payments page shows a working "Release payout" action for completed bookings.

---

### No automated mechanism expires pending bookings after 2 hours

- **Priority:** P0
- **Stage:** Now
- **Type:** Product / Ops
- **Why this matters:** `cancelExpiredPendingBookings()` exists in `src/lib/data/bookings.ts` and correctly cancels bookings past `pending_expires_at` (2 hours). But this function is never called automatically. Pending bookings issued on Friday will still be "pending" on Monday unless a manual call or page load triggers expiry. The Stripe payment intent is also authorized but not cancelled during manual non-expiry. Stuck pending bookings: (1) hold listing capacity hostage preventing new bookings, (2) leave authorized card holds on customer credit cards, (3) create phantom "pending" entries in the carrier's dashboard.
- **What exactly needs to be done:** Set up a scheduled mechanism to call `cancelExpiredPendingBookings()` every 15–30 minutes. Options in order of preference for this stack: (1) Vercel Cron Job — add a `vercel.json` with cron configuration and create `GET /api/cron/expire-pending-bookings` protected by a `CRON_SECRET` header check. Simplest, works with existing Next.js/Vercel setup. (2) Supabase Edge Function on a cron schedule. The API route approach is preferred because the cancellation logic is already in TypeScript and tests exist. Protect the endpoint so only the Vercel cron caller (via secret header) can trigger it.
- **Likely areas affected:** New file `src/app/api/cron/expire-pending-bookings/route.ts`, new file `vercel.json`, `src/lib/data/bookings.ts` (function already exists), `.env.example` (add `CRON_SECRET`)
- **Dependencies / open questions:** Vercel Pro plan required for cron jobs (or use free tier with longer intervals). Must ensure the function is idempotent — multiple concurrent calls must not double-cancel. The existing `cancelExpiredPendingBookings` should be checked for idempotency.
- **Edge cases / failure modes:** Cron fires during a high-load moment and times out partway through — partially expired batch. A booking has `pending_expires_at` in the past but the stripe cancellation fails — booking cancelled in DB but Stripe hold still active. Cron fires twice simultaneously and both pick up the same expired booking.
- **Acceptance criteria:** A booking created with `pending_expires_at` in the past is automatically cancelled within 30 minutes. The Stripe payment intent authorization is cancelled. The listing capacity is recalculated. The customer and carrier receive the expired-booking email. No manual intervention required.

---

### Carrier signup creates no carrier profile — sign-up path is undefined

- **Priority:** P0
- **Stage:** Now
- **Type:** Product / Supply
- **Why this matters:** The `handle_new_user` trigger in migration 006 creates a customer profile for any signup where `account_type != 'carrier'`. But when `account_type = 'carrier'`, the trigger does nothing — no carrier profile is created. `signup-form.tsx` does pass `account_type: accountType` in metadata, but: (1) there is no dedicated carrier signup page with different copy and expectations, (2) after carrier signup the user lands in an undefined state (no customer record, no carrier record), (3) the `/carrier/onboarding` page calls `getCarrierByUserId` which returns null and shows the onboarding form — fine, but only if the user finds that page. The site header redirects unauthenticated users to `/signup` for "Become a carrier" — there is no explicit `/signup?type=carrier` or `/carrier/signup` path.
- **What exactly needs to be done:** (1) Create a dedicated carrier signup page at `/carrier/signup` (or modify the existing signup form to have a clear carrier vs customer split). The page should explain what it means to be a carrier on moverrr, set expectations about verification, and pass `account_type: 'carrier'` to the signup form. (2) After carrier signup, redirect to `/carrier/onboarding` automatically. (3) Update the site header "Become a carrier" link to point to `/carrier/signup` instead of `/signup`. (4) Update the `handle_new_user` trigger to either also create a minimal carrier row on carrier signup, OR ensure the onboarding page gracefully handles the "no carrier profile yet" state and creates one on first form submission (check if this is already the behavior).
- **Likely areas affected:** New page `src/app/(auth)/carrier/signup/page.tsx` or modified `src/components/auth/signup-form.tsx`, `src/components/layout/site-header.tsx`, `supabase/migrations/` (optional trigger update), `src/app/(carrier)/carrier/onboarding/actions.ts`
- **Dependencies / open questions:** Founder decision: should carrier and customer be the same Supabase user (just different profiles)? Or truly separate accounts? Currently a user CAN have both a carrier and customer record. Is this intentional for MVP or a gap?
- **Edge cases / failure modes:** A carrier tries to also book a trip — do they have a customer profile? They don't after carrier signup. The redirect after signup may lose context if not handled carefully.
- **Acceptance criteria:** A new user can visit a clear "Become a carrier" page, sign up, and land directly at the carrier onboarding form without confusion. The carrier profile is created (or creatable) through the onboarding form. The `/carrier/onboarding` page is not orphaned from the signup path.

---

### Carrier has no UI to accept or reject an individual booking — pending state is opaque

- **Priority:** P1
- **Stage:** Now
- **Type:** Product / Supply
- **Why this matters:** When a customer books a trip, the booking enters `pending` state. The carrier must confirm it (transition to `confirmed`) or cancel it (transition to `cancelled`). The status machine supports this. `canActorTransitionBooking` allows carriers to move to `confirmed`, `picked_up`, `in_transit`, `delivered`. But the carrier needs to explicitly see the pending booking and take action. The `PendingBookingsAlert` component exists on the carrier dashboard. The `status-update-actions.tsx` component handles status transitions. However, it's unclear if the carrier has a clear "Accept booking" / "Decline booking" experience per individual pending booking. The 2-hour window creates urgency. If the carrier misses it, the booking auto-cancels (once AG-H2 / the cron job is set up). This needs a clear mobile-first carrier-facing experience.
- **What exactly needs to be done:** Verify that the carrier booking detail page (`/carrier/trips/[id]`) or the today page has explicit "Accept" and "Decline" buttons for `pending` bookings with: (1) the customer's item description, category, dimensions, weight, and photo; (2) pickup and dropoff addresses (not just suburb); (3) the exact amount the carrier will earn; (4) a countdown showing how much of the 2-hour window remains; (5) an "Accept" button that transitions to `confirmed`; (6) a "Decline" button (with a required reason from the `BOOKING_CANCELLATION_REASONS` list) that transitions to `cancelled`. If this UX is incomplete or missing on mobile, implement it. Make the pending bookings alert on the carrier dashboard deep-link directly to the booking needing a decision.
- **Likely areas affected:** `src/components/booking/status-update-actions.tsx`, `src/components/booking/pending-expiry-countdown.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/app/(carrier)/carrier/today/page.tsx`, `src/components/carrier/pending-bookings-alert.tsx`
- **Dependencies / open questions:** Does the status-update-actions already handle the `pending → confirmed` transition for carriers? Does it show the cancellation reason field when declining? Verify before building.
- **Edge cases / failure modes:** Carrier clicks "Accept" at the exact moment the 2-hour window expires and the cron job also runs — concurrent accept + expire. The existing atomic booking function + status machine should prevent double-processing but needs verification. Carrier declines without selecting a reason — reject the form submission.
- **Acceptance criteria:** A carrier can view a pending booking's full details, see the countdown, and click Accept or Decline. Accepting moves the booking to `confirmed` and fires the confirmation email. Declining moves it to `cancelled` with a stored reason and fires the cancellation email. All of this works on a 375px iPhone viewport with 44px tap targets.

---

### Email templates are bare inline HTML strings — not usable for a real product launch

- **Priority:** P1
- **Stage:** Now
- **Type:** Product / Trust
- **Why this matters:** The current email sending in `bookings.ts` uses ad hoc inline HTML string literals. The booking_created_customer email is 4 lines of unstyled HTML. The booking_status_update email sends a `statusMessageHtml` variable with minimal formatting. The pending_booking_expired email is a single sentence. These emails land in customer and carrier inboxes as the trust signal from moverrr. Bare HTML with no branding, no clear CTA, and no mobile layout will look like spam or an amateur product. Email is the primary async communication channel before native push is built.
- **What exactly needs to be done:** Create a reusable email layout function or template in `src/lib/email/` (new directory). The template must: (1) use responsive HTML email best practices (table-based layout or a proven approach like MJML or simple inline-CSS columns); (2) include the moverrr brand name and color accent consistently; (3) include a primary CTA button linking to the relevant booking URL; (4) include the booking reference prominently; (5) include clear "what happens next" instructions. Build this as a TypeScript function `buildEmailHtml({ type, booking, ... })` that returns the HTML string. Then update each existing `sendBookingTransactionalEmail` call to use the template function. At minimum, implement proper templates for: `booking_created_customer`, `booking_created_carrier`, `booking_status_update` (per status), `pending_booking_expired`, `dispute_resolution_update`.
- **Likely areas affected:** New dir `src/lib/email/`, `src/lib/data/bookings.ts` (update calls), `src/lib/data/admin.ts` (update calls), `src/lib/data/feedback.ts` (update calls)
- **Dependencies / open questions:** No external dependency needed — pure function returning HTML string is enough for MVP. Resend domain must be verified first (X3 in existing backlog). Decide: should each status transition have a different subject line and body? Current code has a `subjectByStatus` map — what's in it? Verify which statuses get emails.
- **Edge cases / failure modes:** HTML renders differently across email clients (Gmail, Apple Mail, Outlook). Avoid complex CSS. Test with a tool like Litmus or by sending real test emails. The `to` address may be null if env is not configured — already handled by graceful degradation.
- **Acceptance criteria:** Each email type renders with moverrr branding, a clear subject, the booking reference, the relevant action or status update, a CTA link, and "what happens next" copy. No raw HTML tag strings visible in inbox previews. Emails are readable on mobile (Gmail, Apple Mail at minimum).

---

### No notifications sent for: trip-day reminder, verification approved/rejected, review request

- **Priority:** P1
- **Stage:** Now
- **Type:** Product / Trust
- **Why this matters:** The only emails sent today are: booking_created (customer + carrier), booking_status_update (generic for all transitions), pending_booking_expired, and dispute_resolution_update. Missing critical lifecycle emails that drive trust and conversion: (1) **Carrier verification approved** — the carrier has no idea when admin verified them, so they may not know to start posting. (2) **Carrier verification rejected** — carrier submits documents and hears nothing. (3) **Trip day reminder** — carriers need a reminder on the morning of the trip day with the booking details and pickup address. (4) **Review request** — after a booking is `completed`, neither party gets a nudge to leave a review. Reviews drive trust for future customers. (5) **Delivery confirmed notification** — customer clicks "I received my item" (confirm receipt); carrier should know.
- **What exactly needs to be done:** Implement the following email triggers: (1) When `carriers.verification_status` changes to `verified` or `rejected` — send a specific email to the carrier with next steps or feedback. Add this to the admin verify endpoint (`/api/admin/carriers/[id]/verify/route.ts`). (2) Trip-day reminder: via the cron job system (also needed for AG-CI), create a daily cron that finds all `confirmed` bookings with `trip_date = today` and sends a reminder to the carrier with pickup address, customer contact, booking reference. (3) Review request: when a booking transitions to `completed`, send a `review_request` email to the customer with a link to `/bookings/[id]#review`. (4) Delivery confirmed: when the carrier marks delivery, send a notification to the customer that their item has been marked as delivered and what to do next (confirm receipt or raise a dispute).
- **Likely areas affected:** `src/app/api/admin/carriers/[id]/verify/route.ts`, `src/lib/data/bookings.ts` (status update handler), new file `src/app/api/cron/trip-day-reminders/route.ts`, `src/lib/email/` (new templates for each type), `vercel.json` (add cron entry for daily reminders)
- **Dependencies / open questions:** Trip-day reminders require the cron infrastructure (depends on the expired-bookings cron item above). Email domain must be verified (X3). Do we send review requests to both customer and carrier or just customer?
- **Edge cases / failure modes:** Booking confirmed → delivered → carrier doesn't trigger completed → no review request fires. Cover this by also sending the review request when `completed_at` is set (not just on the status transition). A carrier with multiple bookings on trip day gets one reminder per booking — is that too many emails? For MVP, one per booking is fine. Rate limit the daily reminder cron to not resend if already sent within 12 hours.
- **Acceptance criteria:** A carrier sees their verification status change via email. After a completed booking, the customer receives a review request email with a working link. Carriers receive a morning reminder for each confirmed trip-day booking. All new emails use the branded template from the previous item.

---

### Admin has no individual carrier detail page — verification is a blind approve/reject

- **Priority:** P1
- **Stage:** Now
- **Type:** Ops / Trust
- **Why this matters:** The admin carriers page (`/admin/carriers`) shows a verification queue via `VerificationQueue` component. Admins can approve or reject. But the schema shows carriers have: `licence_photo_url`, `insurance_photo_url`, `vehicle_photo_url`, `licence_expiry_date`, `insurance_expiry_date`, `bio`, `phone`, `email`, `abn`, `business_name`, `verification_notes`. There is no page to view all of this in context. Admins cannot see the document photos before clicking approve. They cannot add `verification_notes` explaining a rejection. The `internal_notes` and `internal_tags` columns exist (from migration 013) but have no UI. A carrier gets rejected with no explanation.
- **What exactly needs to be done:** Create an admin individual carrier page at `/admin/carriers/[id]/page.tsx` that shows: (1) full carrier profile (business name, ABN, contact, bio, service suburbs); (2) vehicle details and photo; (3) licence photo + expiry date with a badge if expired or expiring within 30 days; (4) insurance photo + expiry date with same badge; (5) verification history from `booking_events` or `verification_submitted_at` / `verified_at` timestamps; (6) `internal_notes` textarea (editable by admin, saved via PATCH); (7) `internal_tags` selector (trusted / probation / flagged / VIP — EA8 in existing backlog); (8) Approve / Reject buttons with required reason text (sets `verification_notes` on reject); (9) completed bookings and reviews for context; (10) Stripe Connect status. The `VerificationQueue` component's carrier rows should link to this page.
- **Likely areas affected:** New page `src/app/(admin)/admin/carriers/[id]/page.tsx`, new API route `src/app/api/admin/carriers/[id]/route.ts` (likely needs to be created as a page route, not API), `src/components/admin/` (new carrier detail components), `src/lib/data/carriers.ts` (add `getAdminCarrierById` function), update `src/components/admin/verification-queue.tsx` to link to detail page
- **Dependencies / open questions:** Private storage bucket access — the admin must be able to see the carrier's document photos. The existing storage RLS policy allows admin to read any object. Verify the signed URL generation works for admin views.
- **Edge cases / failure modes:** Admin approves a carrier whose insurance has expired (licence_expiry_date < today). Should the approve button warn about expired documents? Yes — add a visual warning on the approve button when documents are near-expiry or expired.
- **Acceptance criteria:** Admin can navigate to `/admin/carriers/[carrier-id]`, see all documents with photos rendered via signed URLs, see expiry status, add internal notes, set internal tags, and approve or reject with a stored reason. The verification queue links to this page.

---

### No scheduled job sends trip-day or saved-search match notifications

- **Priority:** P1
- **Stage:** Now
- **Type:** Product / Notifications
- **Why this matters:** The `saved_searches` table exists and users can save search queries. When a new trip is posted that matches a saved search, there is no mechanism to notify the interested customer. This is the primary demand-activation tool in a supply-first marketplace. Without match notifications, customers who searched "Bondi to CBD" in October have no reason to come back in November when a matching trip appears. Also: delivery reminders at 2 hours before the time window (`DELIVERY_REMINDER_HOURS = [2, 24]` in constants) are defined but never sent.
- **What exactly needs to be done:** Implement two cron jobs: (1) **Saved search match notifier** — runs every hour or after each new trip is posted (`PostToolUse`-style trigger or cron). For each newly active `capacity_listing`, find all `saved_searches` where the saved `from` and `to` suburbs spatially match the listing's origin/destination within the listing's `detour_radius_km`. Send a `saved_search_match` email to each user who has that saved search, with the listing details and a direct link to the trip page. Deduplication: do not send the same match email twice for the same (saved_search_id, listing_id) pair. This requires either a `saved_search_notifications_sent` table or a `last_notified_listing_id` on saved_searches. (2) **Delivery reminder** — for bookings in `confirmed` status where `trip_date = today` and the time window starts in 2 or 24 hours, send a delivery reminder to both carrier and customer.
- **Likely areas affected:** New migration for `saved_search_notifications` table (dedupe), new `src/app/api/cron/saved-search-notify/route.ts`, new `src/app/api/cron/delivery-reminders/route.ts`, `vercel.json` (cron schedule), `src/lib/email/` (new templates), `src/lib/data/trips.ts` (spatial query for matching saved searches)
- **Dependencies / open questions:** The `saved_searches` table stores `from_suburb`, `to_suburb`, and `category`. The spatial matching needs to be PostGIS-based or Google Maps geocoded. For MVP, suburb text matching is acceptable for saved search notifications. The geocoding upgrade (EP1 in existing backlog) improves match quality later. Founder decision: should the customer opt-in explicitly to email notifications for saved searches? Or is saving the search implicit consent?
- **Edge cases / failure modes:** A popular route triggers 500 saved search matches simultaneously — email sending rate limit. Use Resend's batch endpoint or queue with delays. A customer saves a search and immediately gets flooded with every existing matching listing. On first match-check, only notify about listings posted AFTER the saved search was created.
- **Acceptance criteria:** When a carrier posts a Bondi to CBD trip, all customers with a saved "Bondi → CBD" search receive an email within 1 hour. The email includes route, date, price, carrier name, and a link. Each customer receives at most one email per matching listing (deduplication). Customers who saved the search before the cron was deployed are not retroactively flooded.

---

### Carrier cannot mark a booking as "accepted by third-party contact" at pickup — no contact delegation flow

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / UX
- **Why this matters:** The booking schema has `pickup_contact_name` and `pickup_contact_phone` fields. The customer can specify that someone else will be at the pickup address (e.g. "My flatmate Alex, 0412 000 000"). But the carrier's proof flow requires `handoffConfirmed: true` in `pickupProofSchema`. If the carrier picks up from a third-party contact (not the customer), the "handoff confirmed" field is technically accurate but the UX doesn't reflect this. More importantly, the carrier currently has no way to call or contact the pickup person from within the app — they'd need to copy the number and switch apps. On a tight same-day schedule this is friction.
- **What exactly needs to be done:** (1) On the carrier's booking detail for a `confirmed` or `pending` booking, display the pickup contact details prominently with a tap-to-call link (`tel:` href) for the pickup contact and dropoff contact phone numbers. (2) On the proof capture screen, if `pickup_contact_name` is set, update the label from "Handoff confirmed" to "Handoff confirmed with [pickup_contact_name]" so the carrier knows who they're confirming handoff with. (3) Same for delivery: if `dropoff_contact_name` is set, label it "Delivered to [dropoff_contact_name]."
- **Likely areas affected:** `src/components/booking/status-update-actions.tsx`, carrier booking detail page, `src/components/booking/booking-checkout-panel.tsx`
- **Dependencies / open questions:** None — this is a pure UI enhancement using data already captured.
- **Edge cases / failure modes:** `pickup_contact_phone` may be null or empty. Handle gracefully — don't show the tap-to-call link if no phone number.
- **Acceptance criteria:** The carrier sees a tap-to-call link for pickup and dropoff contacts on their booking view. The proof capture labels reference the contact name when one is provided. No new data capture required.

---

### Search result cards don't show why a trip matches the customer's query

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Customer trust
- **Why this matters:** The `TripCard` component and search results show route, date, price, and space size. The matching score is calculated and available in `TripSearchResult.matchScore` and `scoreBreakdown`. But customers see no explanation of why a trip appeared in their results or how well it fits. "Route fit" is the core value proposition — a customer who searches "Bondi to CBD" should see that a Randwick to Sydney trip is "2.1km from your pickup and 0.8km from your dropoff" — not just a generic card. Without this, the browsing experience feels like a generic list.
- **What exactly needs to be done:** Add a "match quality" indicator to `TripCard` that uses the `matchScore` and `scoreBreakdown` from the search result. Specifically: (1) show pickup distance ("1.4km from pickup") when `pickupDistanceKm` is available in the `scoreBreakdown`; (2) show dropoff distance ("0.9km from dropoff"); (3) show a visual fit indicator (e.g. a colored bar or "Strong match / Decent match / Loose match" badge) based on `matchScore` ranges (>70: strong, 50-70: decent, <50: loose); (4) the "match score" terminology must NOT be shown to customers — use plain language only. Note: `scoreBreakdown` with pickup/dropoff distances is already returned from `scoreMatch()` — this is primarily a UI change.
- **Likely areas affected:** `src/components/trip/trip-card.tsx`, `src/types/trip.ts` (TripSearchResult already has matchScore + scoreBreakdown), `src/app/(customer)/search/page.tsx`
- **Dependencies / open questions:** `scoreBreakdown` must be passed through from the search RPC to the TripSearchResult type. Check if it's currently available in the data flow. The PostGIS RPC returns `pickup_distance_km` and `dropoff_distance_km` — confirm these flow through to the frontend.
- **Edge cases / failure modes:** When search uses the text-fallback path (no Google Maps), `pickupDistanceKm` is 0 (the `queryTripsByDateWindow` path calls `toTripSearchResult(trip, 0)`). In this case, don't show distance indicators — show nothing rather than "0km from pickup." Detect this with `matchScore === 0` or `pickupDistanceKm === 0`.
- **Acceptance criteria:** On a successful spatial search, each TripCard shows pickup and dropoff distances. The card includes a plain-language fit indicator. A trip that is 8km from the customer's pickup (outside detour radius) does not appear in results (already filtered). At 375px viewport the distance info is readable without truncation.

---

### Capacity model is opaque — "remaining_capacity_pct" is not explained to customers or carriers

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / UX
- **Why this matters:** The `capacity_listings.remaining_capacity_pct` drives whether a listing is bookable and how much space is left. But this percentage is not explained to customers in human terms. A carrier who has "60% remaining" doesn't know if that means one sofa or three boxes fit. The `estimate_booking_capacity_pct()` function in the DB estimates capacity based on dimensions and category, but items rarely have exact dimensions (customers type "medium-sized fridge" not "W70cm D80cm H160cm"). The result is that capacity decisions happen behind the scenes without either party understanding them.
- **What exactly needs to be done:** (1) On the trip detail page, replace or supplement "remaining_capacity_pct" with a human translation: for a listing with `space_size = 'L'` at 60% capacity, show something like "~40% taken — roughly one large item or several boxes still fit." Map `space_size` + `remaining_capacity_pct` to human descriptions using the `SPACE_SIZE_DESCRIPTIONS` constants already defined. (2) On the carrier dashboard, when a trip is `booked_partial`, show the number of accepted bookings and remaining capacity in human terms ("2 bookings confirmed, roughly half the truck is taken"). (3) For customers, on the booking form, show a small note like "Based on your item description, the carrier has space for your booking" when the item fits.
- **Likely areas affected:** `src/app/(customer)/trip/[id]/page.tsx`, `src/components/trip/trip-detail-summary.tsx`, `src/app/(carrier)/carrier/trips/page.tsx`, `src/lib/constants.ts` (SPACE_SIZE_DESCRIPTIONS already exists)
- **Dependencies / open questions:** The `estimate_booking_capacity_pct` DB function uses `item_dimensions`, `item_weight_kg`, and `item_category` — which the customer fills in during booking, not before. The pre-booking trip page can only show remaining capacity percentage, not a per-item fit check. Use coarse heuristics (S item takes ~15%, M takes ~30%, L takes ~50%) for the human description.
- **Edge cases / failure modes:** `remaining_capacity_pct` could be 0 on a trip but `status = 'booked_partial'` (race condition or estimation error). Always show the authoritative "bookable or not" status, not just the percentage.
- **Acceptance criteria:** The trip detail page shows remaining capacity in human terms, not just a percentage. The carrier dashboard shows booked-partial trips with a human-readable capacity summary. The copy does not use percentage numbers exposed raw to customers.

---

### Price guidance endpoint exists but the implementation and UX is unknown

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Carrier experience
- **Why this matters:** `GET /api/trips/price-guidance` exists. `suggested_price_cents` exists as a column on `capacity_listings`. Carriers post at a price they choose but have no anchor. Without price guidance, carriers either underprice (reducing earnings) or overprice (making the listing non-competitive). The price guidance feature — if implemented correctly — is one of the most impactful supply-quality improvements. But if it's a placeholder returning nothing useful, carriers get no help.
- **What exactly needs to be done:** (1) Inspect what `GET /api/trips/price-guidance` actually returns (read the route file). (2) If it returns useful market-rate data based on route + date + space size, verify it's connected to the carrier trip posting wizard UI. (3) If it's a placeholder or returns static data, implement real logic: query recent completed bookings on similar routes (origin/destination within a radius) to compute median/P25/P75 base price. Return `{ suggestedCents, rangeMinCents, rangeMaxCents, sampleSize }`. (4) In the carrier trip wizard pricing step, show the guidance as: "Similar trips on this route have earned $80–$140. Your price: [input]." (5) Update the `suggested_price_cents` field on the listing when the carrier uses the guidance as a reference (for analytics).
- **Likely areas affected:** `src/app/api/trips/price-guidance/route.ts` (inspect first), `src/components/carrier/carrier-trip-wizard.tsx` (add guidance display), `src/lib/data/trips.ts` (market rate query)
- **Dependencies / open questions:** First inspect what the route currently returns — this may already be partially implemented.
- **Edge cases / failure modes:** New routes with no historical data — return a `sampleSize: 0` and show no guidance rather than a misleading number. Route from a suburb with no carriers yet — same. Don't show guidance if `sampleSize < 3` (too noisy).
- **Acceptance criteria:** When a carrier enters a route in the posting wizard, the pricing step shows the market rate range for that route (or gracefully shows nothing if no data). The `suggested_price_cents` field is populated on submitted listings.

---

## Moverrr — Founder Decisions and Open Product Questions

> These items are not implementable without a founder decision. They have real codebase implications. Implement nothing here until each question is answered. Once answered, the decision becomes a reference in CLAUDE.md or the relevant .agent-skills/ file.

---

### FD-01: Can a customer book more than one item on a single trip listing?

- **Priority:** P0
- **Stage:** Now
- **Type:** Founder Decision
- **Why this matters:** The current schema has one booking per (customer, listing) pair by design. But a customer moving house might want to send a sofa AND a washing machine on the same trip. The booking model captures one `item_category`, one `item_description`, one `item_dimensions`, one `item_photo_urls` array. The capacity estimation function (`estimate_booking_capacity_pct`) handles one item. If a customer books twice on the same listing, are they allowed? Does the system prevent it?
- **What exactly needs to be done:** Founder must decide: (A) one item per booking, customer must make two separate bookings (simple, matches current model); (B) multi-item booking with a quantity and category list (requires schema change, more complex UX); (C) one booking with a single "item bundle" description and a human-entered total weight/size. Option A is safest for MVP. If A, document explicitly. If B or C, plan the schema change.
- **Likely areas affected:** `supabase/migrations/` (if B or C), `src/lib/data/bookings.ts`, `src/components/booking/booking-form.tsx`, capacity estimation logic
- **Dependencies / open questions:** None — this is a pure founder decision.
- **Acceptance criteria:** A written decision is recorded in `.agent-skills/CUSTOMER-FLOW.md` and `CLAUDE.md` (if it changes a core invariant).

---

### FD-02: Who can cancel a confirmed booking, and what are the financial consequences?

- **Priority:** P0
- **Stage:** Now
- **Type:** Founder Decision
- **Why this matters:** The status machine allows `confirmed → cancelled` by any actor. But there is no cancellation policy. If a carrier cancels a confirmed booking: does the customer get a full refund? If a customer cancels a confirmed booking: does the carrier receive any compensation? The `cancellation_reason_code` field exists. The payment is authorized but not captured. Cancellation policy affects carrier trust and customer trust equally.
- **What exactly needs to be done:** Decide: (A) customer cancellation before pickup → full refund, no carrier compensation; (B) carrier cancellation → full refund + apology email; (C) late cancellation (within 24 hours of trip date) → partial refund logic. For MVP simplicity: all cancellations result in full authorization void (no capture), no cancellation fees. Document this explicitly. If any more nuanced policy is chosen, it must be reflected in the booking form copy ("Cancellations are free before pickup") and in the relevant email templates.
- **Likely areas affected:** `src/lib/data/bookings.ts` (cancellation path), `src/lib/email/` (cancellation copy), `src/components/booking/booking-checkout-panel.tsx` (cancellation policy copy)
- **Dependencies / open questions:** None — founder decision.
- **Acceptance criteria:** A written cancellation policy is defined and recorded in `.agent-skills/PAYMENTS.md`. The booking form checkout panel displays the policy clearly. The cancellation path in `bookings.ts` correctly voids the authorization per the policy.

---

### FD-03: What is the carrier response time requirement for pending bookings?

- **Priority:** P1
- **Stage:** Now
- **Type:** Founder Decision
- **Why this matters:** `PENDING_BOOKING_HOLD_MS = 7,200,000` (2 hours) is the current timeout. This is correct for day-of same-day bookings. But if a customer books 3 days in advance, the carrier has 2 hours to respond regardless. Is 2 hours the right window for all advance bookings? A carrier who posts a Friday trip on Tuesday might not check the app until Thursday. Should advance bookings have a 48-hour response window? Should the window shrink as the trip date approaches?
- **What exactly needs to be done:** Decide: (A) flat 2-hour window for all bookings (simple, currently implemented); (B) dynamic window based on days-until-trip (e.g. if trip is >72h away, allow 24h response; if trip is <24h away, allow 1h response). Option A is correct for MVP and should stay unless carriers report missing bookings.
- **Likely areas affected:** `supabase/migrations/011_booking_safety_p0.sql` (`pending_expires_at` default), `src/lib/constants.ts` (PENDING_BOOKING_HOLD_MS), cron job logic
- **Acceptance criteria:** Decision documented in `.agent-skills/CARRIER-FLOW.md`.

---

### FD-04: What does carrier quality/verification actually require?

- **Priority:** P1
- **Stage:** Now
- **Type:** Founder Decision
- **Why this matters:** The admin verification queue shows carrier documents but there is no defined checklist of what makes a carrier "approved." The admin currently eyeballs licence and insurance photos and clicks approve. For trust: what exactly must be verified? (1) Valid NSW driver's licence with expiry date? (2) Comprehensive goods-in-transit insurance or just CTP? (3) ABN / business registration? (4) Vehicle registration document? (5) Clean background (how would admin know)? Without a defined standard, different admins approve different quality carriers.
- **What exactly needs to be done:** Founder defines a written carrier quality checklist. This becomes the admin verification guide. Minimum viable version: (A) valid driver's licence visible and readable, (B) insurance certificate with minimum $X cover for goods in transit, (C) vehicle photo clearly shows the vehicle type matches what was declared. This checklist should appear on the admin carrier detail page (FD-01 depends on this being built). Consider adding a `verification_checklist_completed` field or similar to track which checks were confirmed.
- **Likely areas affected:** Admin carrier detail page (to be built), `src/app/api/admin/carriers/[id]/verify/route.ts`, `.agent-skills/VERIFICATION.md`
- **Acceptance criteria:** A written checklist exists. The admin carrier detail page displays it during verification. Verification_notes must reference the checklist on rejection.

---

### FD-05: What is the savings story and how is it calculated?

- **Priority:** P1
- **Stage:** Now
- **Type:** Founder Decision / Product
- **Why this matters:** `dedicatedEstimateCents` appears in the trip detail page code: `const savingsCents = Math.max(0, trip.dedicatedEstimateCents - trip.priceCents)`. But where does `dedicatedEstimateCents` come from? If it's hardcoded or estimated poorly, the savings claim is dishonest. The savings story ("You saved $80 vs a dedicated move") is the primary customer value proposition. If it's inaccurate, the trust damage is significant.
- **What exactly needs to be done:** (1) Find where `dedicatedEstimateCents` is computed (in `toTrip` mapper or elsewhere). (2) Verify the estimation methodology is defensible (not just `price * 2.5`). (3) Decide: do we show the savings claim at all if the estimate is rough? Options: (A) show "Up to $X cheaper than a dedicated move — based on typical full-truck rates" with a clear disclaimer; (B) only show savings when the estimate is grounded in real market data; (C) show the savings claim only when the carrier's price is significantly below the estimate. For MVP, a conservative estimate with a clear "typical full-truck rate" disclaimer is honest.
- **Likely areas affected:** `src/lib/data/mappers.ts` (toTrip function), `src/app/(customer)/trip/[id]/page.tsx`, `src/components/trip/trip-detail-summary.tsx`
- **Acceptance criteria:** The savings claim is grounded in a documented methodology. If the estimate is rough, the copy uses hedged language ("typically", "up to"). The methodology is documented in `.agent-skills/PRICING.md`.

---

### FD-06: What is the launch corridor and first supply target?

- **Priority:** P1
- **Stage:** Now
- **Type:** Founder Decision / Growth
- **Why this matters:** The app works for "Sydney" broadly but a sparse marketplace with 3 carriers spread across all of Sydney is less useful than 10 carriers dominating Bondi-to-CBD and similar high-frequency routes. A launch corridor strategy (focus on 2-3 specific routes first) concentrates supply, makes early customers much more likely to find a match, and creates faster signal on what's working. No route targeting or supply density analytics exist in the admin.
- **What exactly needs to be done:** Founder defines: (1) the 2-3 specific launch corridors (e.g. "Eastern Suburbs → Sydney CBD, Inner West → CBD, Northern Beaches → CBD"); (2) the target number of active listings on each corridor for launch; (3) how admin will monitor corridor density. This decision drives carrier acquisition targeting and how admin analytics should be built.
- **Likely areas affected:** Admin dashboard (add corridor density view), carrier onboarding copy, launch outreach strategy
- **Acceptance criteria:** A launch corridor document exists (can be a single `.md` file). Admin can see how many active listings exist per corridor today.

---

## Moverrr — Carrier Supply System

> Items specific to building out strong, reliable carrier supply. Supply is the primary flywheel.

---

### Carrier document expiry warnings are not surfaced to the carrier or admin

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Trust
- **Why this matters:** `licence_expiry_date` and `insurance_expiry_date` columns exist on carriers. The constants file defines `DOCUMENT_EXPIRY_REMINDER_DAYS = [30, 7]`. But no code currently: (1) sends expiry reminder emails to carriers, (2) warns admin during verification that a carrier's licence expires in 15 days, (3) shows a banner on the carrier dashboard if their licence is expiring. An expired-licence carrier posting trips is a liability issue.
- **What exactly needs to be done:** (1) Add a cron job that runs daily, finds carriers with `licence_expiry_date` or `insurance_expiry_date` within 30 and 7 days, and sends expiry reminder emails. (2) On the carrier onboarding page and carrier dashboard, show a yellow/red banner when documents are expiring soon. (3) When admin views a carrier for verification, show a badge next to document dates: "Expires in 12 days" or "EXPIRED" in red if past due. (4) When a carrier's insurance expires and `is_verified = true`, consider a flag or auto-de-verification policy (founder decision FD-04 related).
- **Likely areas affected:** New cron `src/app/api/cron/document-expiry-reminders/route.ts`, `src/app/(carrier)/carrier/onboarding/page.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`, admin carrier detail page, `src/lib/email/` (expiry reminder template)
- **Dependencies / open questions:** Cron infrastructure must be set up first. Founder decision: does an expired licence auto-suspend the carrier or just flag them?
- **Acceptance criteria:** A carrier receives an email 30 days and 7 days before document expiry. The carrier dashboard shows an expiry warning when within 30 days. Admin sees expiry status badges on the carrier detail page.

---

### Return trip / backload search is poorly discoverable — no carrier-facing explanation exists

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Supply
- **Why this matters:** `is_return_trip = true` exists on `capacity_listings`. The search API supports `isReturnTrip` filter. Customers can filter for return trips. But: (1) carriers posting a trip have no UI explanation of what "is this a return trip?" means or why to mark it — there's no copy explaining "backloads." (2) The customer search has a "backload" filter button but it may not be labeled clearly enough to drive adoption. (3) The value of return trip inventory — lower cost than a fresh trip — is not surfaced in the savings story for return trips.
- **What exactly needs to be done:** (1) In the carrier trip posting wizard, add a clear "Is this a return trip?" toggle with copy: "Mark this as a return trip if you're already heading back empty. Customers looking for cheaper backload moves will find this first." (2) In search results, when `isReturnTrip = true` for a listing, add a "Return trip" badge to the TripCard with a tooltip: "The carrier is already heading this way — prices may be lower." (3) In the trip detail, mention "This carrier is on their return leg — you may benefit from a lower price." (4) In the savings story copy, specifically call out return trips as an explanation for the price difference.
- **Likely areas affected:** `src/components/carrier/carrier-trip-wizard.tsx`, `src/components/trip/trip-card.tsx`, `src/app/(customer)/trip/[id]/page.tsx`, search page
- **Acceptance criteria:** Carriers are clearly prompted about return trip status during posting. Return trip listings are visually distinguished in search results. The value proposition of return trips is communicated to customers.

---

### No post-booking feedback loop tells the carrier which listings perform well

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Supply
- **Why this matters:** `getCarrierLaneInsights()` is called on the carrier dashboard. This function exists but the content of its output is unknown from the review. If it returns meaningful route performance data, it may already partially address this. If not: carriers who post 10 trips but get few bookings don't know why. Is it the price? The route? The timing? Without feedback, carriers can't improve their listings, leading to supply quality degradation over time.
- **What exactly needs to be done:** (1) Inspect `getCarrierLaneInsights()` in `src/lib/data/bookings.ts` — what does it return? (2) If insufficient: compute for each carrier listing: view count (from analytics_events where event_name = 'trip_viewed'), booking conversion rate (bookings / views), average booking price relative to listing price, and average customer rating per route. (3) Show this on the carrier dashboard per active listing: "3 views, 1 booking (33% conversion), ⭐4.8 on this route." (4) Add a specific "weak listing" indicator on listings with high views but low bookings, suggesting a price or rules change.
- **Likely areas affected:** `src/lib/data/bookings.ts` (`getCarrierLaneInsights` — inspect first), `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/app/(carrier)/carrier/stats/page.tsx`
- **Dependencies / open questions:** View tracking via analytics_events requires that `trip_viewed` events are being recorded when customers view trip pages. Verify this.
- **Acceptance criteria:** The carrier dashboard or stats page shows, per active listing, the number of views and bookings. Weak-performing listings are visually flagged with an actionable suggestion.

---

## Moverrr — Customer Demand and Booking Flow

> Items specific to the customer experience — the demand side of the marketplace.

---

### Item dimension capture is free-text only — no structure to aid capacity estimation

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Matching
- **Why this matters:** The booking form captures `item_dimensions` as a free-text string (`text` in schema). The `estimate_booking_capacity_pct` DB function tries to use this, but customers write things like "medium-sized fridge" or "big sofa" — not "W70cm D80cm H160cm." The capacity estimation is therefore guesswork. This means: (1) carriers can get surprised by larger items than expected; (2) `remaining_capacity_pct` recalculation is unreliable; (3) mismatches between booked space and actual item are a leading cause of trip-day disputes.
- **What exactly needs to be done:** In the booking form, replace or supplement the free-text `item_dimensions` field with: (1) a structured size picker using the existing `ITEM_SIZE_DESCRIPTIONS` constants (S, M, L, XL) that maps to approximate dimensions shown to the customer; (2) optional precise dimensions as an expandable field for carriers who need accuracy; (3) an estimated weight range selector (under 20kg, 20-50kg, 50-100kg, over 100kg). Store the structured size in a new `item_size_class` field (S/M/L/XL) in addition to or instead of free-text dimensions. This structured field feeds `estimate_booking_capacity_pct` more reliably.
- **Likely areas affected:** `src/components/booking/booking-form.tsx`, `src/lib/validation/booking.ts`, `supabase/migrations/` (add `item_size_class` column), `src/lib/constants.ts` (ITEM_SIZE_DESCRIPTIONS already exists), DB function `estimate_booking_capacity_pct` (update to use size class)
- **Dependencies / open questions:** Migration needed. Does adding a structured field break existing bookings that only have text dimensions? Handle backward compatibility.
- **Acceptance criteria:** The booking form shows size class options with human descriptions. The chosen size class is stored and used for capacity estimation. Carrier trip day experience is improved because item size expectations are set clearly at booking time.

---

### No-result search state captures waitlist demand but offers no immediate recovery

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Demand
- **Why this matters:** The search page has a `SaveSearchForm` and `WaitlistForm` for customers who find no results. Both exist. But: (1) does the no-result state clearly explain WHY there are no results (no carriers on this route, wrong date, no capacity)? (2) Is the waitlist form clearly differentiated from the save-search form? (3) Is there any immediate recovery path — "Try these nearby trips" or "Broaden your date range"?
- **What exactly needs to be done:** (1) Read the current no-result state rendering in the search page. (2) Add a "no results" state that explains the gap: "No trips from [from] to [to] on [date] yet" with sub-copy: "moverrr works best with a bit of flexibility — try a date range or nearby suburbs." (3) Add a "Similar trips" row: show 3 trips on nearby routes (same origin suburb, any destination) or same route on adjacent dates as recovery options. (4) Ensure the save-search form is the primary CTA above the waitlist form, not equal or below. The save-search captures demand for notification; waitlist captures intent before the product exists. In MVP, save-search is more actionable.
- **Likely areas affected:** `src/app/(customer)/search/page.tsx`, `src/components/search/save-search-form.tsx`, `src/components/customer/waitlist-form.tsx`
- **Dependencies / open questions:** The "similar trips" query needs a fallback search that ignores date but keeps route, or ignores destination but keeps origin. Implement as a secondary query when the primary returns 0 results.
- **Acceptance criteria:** No-result state includes an explanation, a save-search CTA as primary action, and at least one nearby trip suggestion when available. On mobile at 375px, the save-search form is visible without scrolling past the no-result explanation.

---

### Customer cannot see their booking reference before leaving the booking confirmation page

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Trust
- **Why this matters:** After booking, the customer should immediately see their booking reference (MVR-YYYY-NNNN format). This reference is: (1) what they use if contacting support; (2) what appears in the email; (3) what they search for in disputes. If the confirmation page doesn't prominently display the reference, customers don't have it handy when the carrier calls or when something goes wrong.
- **What exactly needs to be done:** Verify the booking confirmation state on the trip detail page or booking checkout panel. Confirm the `booking_reference` is displayed immediately after a booking is created. It should appear: (1) prominently on the success state of the booking checkout panel; (2) in the booking confirmation email (this already appears — check the email template); (3) as the heading on the `/bookings/[id]` detail page.
- **Likely areas affected:** `src/components/booking/booking-checkout-panel.tsx`, `src/app/(customer)/bookings/[id]/page.tsx`
- **Acceptance criteria:** After completing a booking, the customer sees "Your booking reference: MVR-2026-XXXX" without having to navigate away. The reference is on the booking detail page. The reference appears in the booking email.

---

## Moverrr — Trust, Payments, and Operations

> Items that protect the money flow, build trust, and ensure ops clarity during MVP.

---

### Off-platform payment detection exists but has no admin visibility

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Trust / Ops
- **Why this matters:** `src/lib/validation/booking.ts` validates special instructions against `OFF_PLATFORM_PAYMENT_RULES` patterns like "payid", "bank transfer", "cash only." This is excellent trust enforcement. But: (1) does the rejection surface a clear message to the customer explaining why? (2) Are attempted off-platform payment messages logged for admin visibility? A carrier who repeatedly prompts customers to "just pay cash" is gaming the marketplace and destroying trust. Admin needs visibility when patterns are detected.
- **What exactly needs to be done:** (1) Verify the current error message shown to customers when an off-platform payment pattern is detected — it should clearly explain: "Payments must go through moverrr for your protection. Please remove bank transfer or cash payment references." (2) When an off-platform pattern is detected in the booking special instructions, log a `booking_event` with `event_type: 'off_platform_payment_detected'` and the attempted pattern. (3) On the admin carrier detail page, flag carriers who appear in these events. (4) Consider: if the same carrier has triggered this 3+ times, add a `flagged` internal tag automatically.
- **Likely areas affected:** `src/lib/validation/booking.ts`, `src/app/api/bookings/route.ts`, `src/lib/data/bookings.ts` (add event logging), admin carrier detail page
- **Acceptance criteria:** When a customer enters "cash only" in special instructions, a clear error message explains why it's rejected. The attempted pattern is logged as a booking event. Admin can see a carrier's off-platform pattern history.

---

### Payment webhook handling lacks an idempotency guard for replayed events

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Payments / Trust
- **Why this matters:** The `applyPaymentIntentEvent` function processes `payment_intent.succeeded`, `payment_intent.payment_failed`, etc. The function already checks for `skipped_already_captured` outcomes, but the `PaymentIntentEventResult` type only handles state transitions — there's no explicit webhook idempotency table or log. Stripe can and does replay events. A replayed `payment_intent.succeeded` event that causes a second capture attempt is catastrophic.
- **What exactly needs to be done:** (1) Inspect the webhook handler in detail to confirm whether the existing `skipped_already_captured` check in `applyPaymentIntentEvent` is sufficient for all event types. (2) If not: add a `stripe_webhook_events` table with columns `(stripe_event_id text primary key, event_type text, processed_at timestamptz)`. Before processing any webhook event, INSERT the event ID — if it already exists (duplicate), return `{ received: true }` immediately without processing. (3) Add an index on `stripe_event_id`. (4) Add RLS (admin-only access, or no RLS needed if this table is only written from the webhook server route using service role).
- **Likely areas affected:** `src/app/api/payments/webhook/route.ts`, `src/lib/stripe/payment-intent-events.ts`, new migration for `stripe_webhook_events` table
- **Dependencies / open questions:** EQ4 in existing backlog covers webhook contract tests — implement the idempotency table as part of that work or as a standalone migration.
- **Acceptance criteria:** Replaying a webhook event (via `npm run webhook:replay`) for an already-processed booking produces `{ received: true }` without changing any booking state. The `stripe_webhook_events` table contains one row per event ID.

---

### Admin has no quick-scan operations view for all open issues

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Ops
- **Why this matters:** The admin dashboard, bookings page, carriers page, disputes page, and payments page are all separate pages. A founder doing daily ops must visit 4-5 pages to understand: what pending disputes exist, what payment captures are stuck, what carriers need verification, what bookings are stalled. There is no single "ops status" view that shows all open issues in one place.
- **What exactly needs to be done:** Create or upgrade the admin dashboard page (`/admin/dashboard`) to show a single-screen daily ops snapshot: (1) count of carriers pending verification with a link; (2) count of open disputes with a link; (3) count of bookings in `completed` status with `payment_status != captured` (stuck payment) with a link; (4) count of `pending` bookings near expiry (expiring in < 30 minutes) with a link; (5) count of document expiry warnings (carriers with documents expiring in 30 days). This is a queue-status overview, not analytics. Each count is a link to the relevant queue. Cards with count > 0 should have a visual emphasis (colored border or icon).
- **Likely areas affected:** `src/app/(admin)/admin/dashboard/page.tsx`, `src/lib/data/admin.ts` (add dashboard summary query), `src/components/admin/` (ops summary cards)
- **Acceptance criteria:** The admin dashboard shows all 5 queue counts with links. Items requiring action have visual emphasis. A founder can do a daily ops scan in under 60 seconds from this page.

---

## Moverrr — Marketplace Logic and Search

> Items that improve the core matching and browse experience.

---

### The distance estimation fallback uses `ilike` — gives equal weight to "Bondi" and "Bondi Junction"

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Search
- **Why this matters:** This is already tracked as EP1 in the existing backlog with full detail. Including a pointer here because it's a core trust issue: a carrier posting "Bondi Beach to CBD" appears for "Bondi Junction to CBD" searches with no distance penalty. These suburbs are ~3km apart. A customer who books based on suburb match and then finds the pickup is 3km away from their actual location is a bad experience.
- **What exactly needs to be done:** See EP1 in existing backlog for the full task specification. The key missing piece: when geocoding fails (no Google Maps credentials), the fallback should use a curated suburb-to-coordinates lookup table for the most common Sydney suburbs, rather than raw text matching. This avoids the "Bondi" ≈ "Bondi Junction" problem without requiring live geocoding API calls.
- **Likely areas affected:** `src/lib/data/trips.ts` (`queryTripsByDateWindow`), new file `src/lib/maps/suburb-coords.ts` (Sydney suburb coordinate lookup)
- **Acceptance criteria:** See EP1 in existing backlog.

---

### Search has no date range option — a customer who is flexible gets no benefit

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Demand
- **Why this matters:** The search accepts a single `when` date. A customer who is flexible ("anytime this week") must submit separate searches for each day. The `queryTripsByDateWindow` function accepts a `dates: string[]` array but the search API only passes one date from the URL param. Flexible date search is a simple improvement that increases the chance of match when supply is sparse.
- **What exactly needs to be done:** Add a "Flexible dates" option to the search bar alongside the specific date picker. When "Flexible" is selected, search ±3 days from today (or let the user select a week range). Pass the array of dates to `searchTrips()`. The results page should group by date when flexible dates are used. This is primarily a UI change since the backend `queryTripsByDateWindow` already accepts an array.
- **Likely areas affected:** `src/components/search/search-bar.tsx`, `src/app/api/search/route.ts`, `src/lib/data/trips.ts` (`searchTrips` input type)
- **Dependencies / open questions:** When flexible dates are used with spatial search (PostGIS RPC), does the RPC also support date arrays? Inspect `find_matching_listings` — it accepts `p_date date` (single). Would need to modify the RPC or call it multiple times. For MVP, text-fallback mode with date arrays is simpler.
- **Acceptance criteria:** Customer can select "Flexible (±3 days)" from the date picker and see results across multiple dates. Results are grouped by date. The search URL reflects the flexible selection.

---

## Agentic Development System — Infrastructure Backlog

> Previously added section preserved as-is below.

> Added: `2026-04-08` — based on review of Claude Code best practices (subagents, skills, hooks, agent teams, session management, context discipline).
> These items upgrade how AI agents are configured, equipped, and constrained in this repo. They are NOT product features — they are operating system improvements.
> Each item is written with enough precision that an AI agent can implement it without needing further clarification.
> Work these in order within each category, as later items often depend on earlier foundations.

---

### AG-H — Hooks Infrastructure
*Hooks are deterministic guarantees — they always run, unlike CLAUDE.md instructions which are advisory. None currently exist in this repo. This is the highest-leverage category.*

- [ ] **AG-H1** — Create `.claude/settings.json` with macOS Notification hook
  - **File(s):** new file: `.claude/settings.json`
  - **What:** Create a project-level settings.json (separate from settings.local.json which is personal) containing a `Notification` hook that fires `osascript -e 'display notification "Claude needs input — moverrr" with title "Claude Code"'` on macOS whenever Claude is waiting for user input or permission.
  - **Why:** When running long agentic tasks (subagents, verifiers, large implementations), the user steps away and misses when Claude is blocked. A native macOS alert means no stalled sessions because Claude sat idle for 30 minutes waiting for a permission prompt.
  - **Done when:** `.claude/settings.json` exists with a valid `hooks.Notification` entry, `/hooks` in Claude Code shows it listed under Notification events, and a test permission prompt triggers a visible macOS notification.

- [ ] **AG-H2** — Add PostToolUse hook to run type-check after any Edit or Write to TypeScript files
  - **File(s):** `.claude/settings.json`
  - **What:** Add a `PostToolUse` hook with matcher `"Edit|Write"` that runs `npx tsc --noEmit --project tsconfig.json 2>&1 | tail -20` only when the edited file matches `*.ts` or `*.tsx`. Output failures into Claude's context via stdout so it sees type errors immediately after each file edit and can fix them before moving on.
  - **Why:** TypeScript errors currently only surface when Claude runs `npm run check` at the end of a task. A mid-task type-check hook catches regressions instantly, before Claude has written five more files that compound the same mistake. This is the single-highest-leverage change to code quality per line of config.
  - **Done when:** Editing a `.tsx` file with a deliberate type error causes the hook to fire and the type error appears in Claude's next context turn, visible in the session transcript.

- [ ] **AG-H3** — Add PreToolUse hook to block dangerous Bash patterns
  - **File(s):** new file: `.claude/scripts/validate-bash.sh`, `.claude/settings.json`
  - **What:** Create a shell script at `.claude/scripts/validate-bash.sh` that reads JSON from stdin (the PreToolUse hook payload), extracts the `tool_input.command`, and exits with code 2 (blocking) if the command matches any of: `git push --force`, `git push -f`, `git reset --hard`, `rm -rf /`, `drop table`, `DELETE FROM` without a WHERE clause, `supabase db reset` (without explicit allowance). Register this as a `PreToolUse` hook with matcher `"Bash"` in `.claude/settings.json`. The script should print a clear reason to stderr so Claude sees why it was blocked.
  - **Why:** Prevents the most catastrophic irreversible actions from running autonomously. Even in `dontAsk` or `auto` permission mode, these specific patterns warrant a hard block rather than a soft advisory.
  - **Done when:** The script exists and is `chmod +x`, it's wired in settings.json, and attempting `git push --force` via Claude's Bash tool returns a blocked status with an explanation in the transcript.

- [ ] **AG-H4** — Add Stop hook that reminds Claude to sync docs when the session ends
  - **File(s):** `.claude/settings.json`
  - **What:** Add a `Stop` hook that runs a short check: if any `.md` file in `.claude/`, `.agent-skills/`, or root `CLAUDE.md` or `TASK-RULES.md` appears in the session's list of changed files, echo a reminder message "Docs changed this session — run docs-memory-sync before closing" to stdout so it surfaces in the session summary. This is a prompt reminder, not a blocker.
  - **Why:** The operating-system.md says "If truth changed, update the matching docs in the same task" but there's no enforcement. A stop-hook reminder creates a lightweight close-out ritual without blocking anything.
  - **Done when:** After a session that modifies a .claude/ file, the Stop hook fires and the reminder appears in the Claude Code output.

- [ ] **AG-H5** — Add permission allowlists for safe-to-approve commands to settings.json
  - **File(s):** `.claude/settings.json`
  - **What:** Add a `permissions.allow` array to settings.json (not settings.local.json, so the team inherits it) that pre-approves these specific patterns without requiring user click-through: `Bash(npm run check)`, `Bash(npm run test*)`, `Bash(npm run lint)`, `Bash(npx tsc*)`, `Bash(git status)`, `Bash(git diff*)`, `Bash(git log*)`, `Bash(git branch*)`. Do NOT pre-approve `git push`, `git commit`, or any write-to-disk operation beyond what's already in settings.local.json.
  - **Why:** The current settings require approval for every `npm run check`, which is the primary verification command. Clicking through 20 approval prompts per session means users stop reviewing and just click through — defeating the purpose of permission prompts entirely. Pre-approve the genuinely safe read + lint operations so approvals remain meaningful for write-risk actions.
  - **Done when:** Running `npm run check` via Claude's Bash tool in auto or default permission mode no longer triggers a permission prompt, while `git push` and file edits still do.

- [ ] **AG-H6** — Add SubagentStop hook that logs completed subagent type and duration to a session log
  - **File(s):** `.claude/settings.json`, new file: `.claude/scripts/log-subagent.sh`
  - **What:** Create a `SubagentStop` hook that appends a line to `.claude/session-log.jsonl` (gitignored) with: timestamp, subagent type name (from hook matcher input), and the fact it completed. This is a background observability hook, not a blocker. The log should be newline-delimited JSON objects: `{"ts": "2026-04-08T...", "event": "subagent_stop", "type": "verifier"}`.
  - **Why:** When the user runs a multi-subagent session (verifier + docs-keeper + schema-reviewer simultaneously), there's currently no record of what ran, when, or in what order. This lightweight append-only log creates observability for agentic sessions without any performance cost.
  - **Done when:** After a session that uses the verifier subagent, `.claude/session-log.jsonl` contains a valid JSON line with the verifier's stop event and a real timestamp.

---

### AG-A — Agent Configuration Upgrades
*The existing 10 agents are well-described but lack modern subagent configuration features: persistent memory, worktree isolation, preloaded skills, and refined tool restrictions. These are upgrades to existing files.*

- [ ] **AG-A1** — Add `memory: project` and memory instructions to the `verifier` agent
  - **File(s):** `.claude/agents/verifier.md`
  - **What:** Add `memory: project` to the verifier's YAML frontmatter. Add a memory instruction section to the agent body: "After each verification pass, update your agent memory with: (1) patterns that passed or failed this repo, (2) any adversarial probe that found a real bug, (3) recurring trust invariants that needed checking. Write to `MEMORY.md` in your memory directory. Keep entries short and evidence-backed." The memory directory will be `.claude/agent-memory/verifier/`.
  - **Why:** The verifier currently forgets every session. Over time it should learn: which adversarial probes historically find real issues in moverrr, which paths are highest-risk, and what the booking/payment invariants look like in practice. Persistent memory turns a stateless verification bot into an institutional-knowledge holder.
  - **Done when:** The verifier's frontmatter has `memory: project`, a `MEMORY.md` appears in `.claude/agent-memory/verifier/` after the first verification run, and the agent's memory instructions are in the body.

- [ ] **AG-A2** — Add `memory: project` to `docs-keeper` and `repo-explorer` agents
  - **File(s):** `.claude/agents/docs-keeper.md`, `.claude/agents/repo-explorer.md`
  - **What:** Add `memory: project` to both agents' frontmatter. For docs-keeper, add: "After each sync task, record what stale patterns you found and where they lived — this builds a map of where docs tend to rot." For repo-explorer, add: "After each deep survey, record key architectural decisions, non-obvious file locations, and naming patterns — this reduces context-reading time on future sessions."
  - **Why:** Both agents do heavy reading that produces institutional knowledge. The docs-keeper repeatedly discovers the same stale patterns in the same files. The repo-explorer re-traces the same architecture every session. Persistent memory eliminates redundant re-discovery, which costs context tokens and time.
  - **Done when:** Both agents have `memory: project` in frontmatter, `.claude/agent-memory/docs-keeper/MEMORY.md` and `.claude/agent-memory/repo-explorer/MEMORY.md` exist with at least one meaningful entry after first use.

- [ ] **AG-A3** — Add `isolation: worktree` to `schema-reviewer` agent
  - **File(s):** `.claude/agents/schema-reviewer.md`
  - **What:** Add `isolation: worktree` to the schema-reviewer's frontmatter. Add a note to the body: "You run in an isolated git worktree. You may read all files freely. If you need to test migration reversibility, you can apply migrations against a test state without risking the main working directory."
  - **Why:** Schema review of migrations is highest-risk work — a bad migration applied to the wrong DB or a missed rollback analysis can be catastrophic. Running in a worktree means the reviewer is always isolated from any in-progress main-branch work, and any test-running it does doesn't pollute the working tree.
  - **Done when:** `schema-reviewer` frontmatter has `isolation: worktree`, and invoking it spawns in a separate worktree (visible in `git worktree list`).

- [ ] **AG-A4** — Add `tools` restriction to `repo-explorer` and `product-researcher` agents (read-only enforcement)
  - **File(s):** `.claude/agents/repo-explorer.md`, `.claude/agents/product-researcher.md`
  - **What:** Add `tools: Read, Grep, Glob, Bash` to both agents (explicitly disallowing Edit, Write, and Agent spawning). Both agents' bodies already say they should not mutate code, but currently both inherit all tools. Making the restriction structural rather than advisory means a confused agent cannot edit files even if it tries.
  - **Why:** A product researcher that accidentally edits a file, or a repo explorer that writes to a config, is dangerous. Tool restriction is the difference between an advisory rule ("you shouldn't do this") and a structural guarantee ("you can't do this even if you try").
  - **Done when:** Both agents have explicit `tools:` frontmatter fields, and attempting to use Edit or Write through either agent returns a "tool not available" error.

- [ ] **AG-A5** — Add `skills` preloading to `payments-verifier` and `schema-reviewer` agents
  - **File(s):** `.claude/agents/payments-verifier.md`, `.claude/agents/schema-reviewer.md`
  - **What:** Add `skills: [booking-safety-audit]` to `payments-verifier` frontmatter, and `skills: [booking-safety-audit]` to `schema-reviewer` frontmatter. This injects the full booking-safety-audit skill content into each agent's context at startup, so they have the invariants, failure modes, and verification steps loaded without needing to discover and invoke the skill themselves.
  - **Why:** The payments-verifier and schema-reviewer always need the booking safety invariants (commission math, atomic booking, capacity invariants). Currently they'd need to load the skill themselves, consuming extra turns. Preloading gives them this knowledge instantly and reduces context churn.
  - **Done when:** Both agents have `skills:` in frontmatter, and when spawned their first context turn already contains the booking-safety-audit skill content without needing to invoke it.

- [ ] **AG-A6** — Improve `feature-implementer` agent description for better auto-delegation trigger
  - **File(s):** `.claude/agents/feature-implementer.md`
  - **What:** Rewrite the `description` frontmatter field to front-load the trigger conditions more specifically. Current description: "Use for bounded end-to-end implementation once the problem is understood and the scope fits moverrr's product thesis." New description should be ~250 chars, starting with: "Implement a specific, scoped code change across files. Use proactively when a task has clear scope, known files, and fits the browse-first marketplace model. Not for exploratory work — use repo-explorer first if scope is unclear."
  - **Why:** Agent auto-delegation works by Claude matching the user's request against the description. The current description is passive and doesn't auto-trigger well. A description front-loaded with action verbs and trigger conditions ("implement", "scoped", "known files") gets correctly auto-delegated more often.
  - **Done when:** The description is updated, is ≤250 characters, starts with a clear trigger pattern, and in testing Claude correctly auto-delegates "implement the paused trip status" to feature-implementer without being told explicitly.

- [ ] **AG-A7** — Add `background: true` to `docs-keeper` and `copy-guardian` agents
  - **File(s):** `.claude/agents/docs-keeper.md`, `.claude/agents/copy-guardian.md`
  - **What:** Add `background: true` to both agents' frontmatter. This means when Claude spawns them, they run concurrently while the main conversation continues, reporting back when done rather than blocking.
  - **Why:** Docs sync and copy review are exactly the kind of work that doesn't need to block the main session. A feature-implementer can finish shipping a feature while the docs-keeper updates memory in parallel. This is the write/reviewer parallel pattern applied to moverrr's natural workflow.
  - **Done when:** Both agents have `background: true` in frontmatter, and spawning them from the main conversation doesn't block the user from continuing to interact with Claude.

- [ ] **AG-A8** — Add `maxTurns: 30` to exploratory/research agents, `maxTurns: 50` to implementers
  - **File(s):** `.claude/agents/repo-explorer.md`, `.claude/agents/product-researcher.md`, `.claude/agents/feature-implementer.md`
  - **What:** Add `maxTurns: 30` to repo-explorer and product-researcher, and `maxTurns: 50` to feature-implementer. These are reasonable limits that prevent runaway agents from consuming unlimited context. The verifier, payments-verifier, and schema-reviewer should NOT get maxTurns limits — they should be allowed to be thorough.
  - **Why:** Without maxTurns, a confused repo-explorer can recursively read hundreds of files until it hits the context limit, wasting tokens and producing no useful output. A limit forces the agent to be decisive: report with what it has rather than endlessly searching.
  - **Done when:** The three agents have `maxTurns:` in frontmatter, and in testing a deliberately open-ended exploration task terminates within the turn limit rather than running indefinitely.

---

### AG-S — Skill System Upgrades
*Skills currently lack several modern frontmatter features. These upgrades make skills smarter about when to run, how to run, and with what restrictions.*

- [ ] **AG-S1** — Add `disable-model-invocation: true` to side-effect and release-sensitive workflow skills
  - **File(s):** `.claude/skills/release-readiness/SKILL.md`, `.claude/skills/postmortem/SKILL.md`, `.claude/skills/experiment-design/SKILL.md`, `.claude/skills/dispute-resolution-audit/SKILL.md`
  - **What:** Add `disable-model-invocation: true` to the frontmatter of these four skills. They should only run when the user explicitly invokes `/release-readiness`, `/postmortem`, `/experiment-design`, or `/dispute-resolution-audit` — never auto-triggered by Claude because the conversation topic happens to mention "release" or "dispute."
  - **Why:** These skills have real-world side effects or represent the start of a formal process. Claude auto-triggering a postmortem review mid-conversation because someone mentioned a bug is disruptive. Manual-only invocation keeps these as deliberate rituals, not passive reactions.
  - **Done when:** All four skills have `disable-model-invocation: true` in frontmatter, and Claude does not spontaneously load them when their topics come up in conversation.

- [ ] **AG-S2** — Add `context: fork` with `agent: Explore` to three read-heavy research skills
  - **File(s):** `.claude/skills/saved-search-demand-review/SKILL.md`, `.claude/skills/admin-queue-review/SKILL.md`, `.claude/skills/carrier-quality-review/SKILL.md`
  - **What:** Add `context: fork` and `agent: Explore` to the frontmatter of each. Also add `allowed-tools: Read, Grep, Glob, Bash` to each. These skills do large amounts of file reading and code traversal. Running them in a forked Explore subagent keeps that exploratory context out of the main conversation, so the main session doesn't get filled with file contents from a research pass.
  - **Why:** A saved-search demand review reads many saved-search records, routes, and no-result data. A carrier quality review reads listing data, proof counts, and profile completeness. This is exactly the "isolate high-volume operations" subagent pattern from the best practices doc. The result (a focused summary) returns to the main conversation; the noise stays in the fork.
  - **Done when:** All three skills have `context: fork` and `agent: Explore` in frontmatter, and invoking one via `/saved-search-demand-review` spawns a visible Explore subagent rather than running inline in the main conversation.

- [ ] **AG-S3** — Add `effort: high` to trust-critical and complex workflow skills
  - **File(s):** `.claude/skills/booking-safety-audit/SKILL.md`, `.claude/skills/dispute-resolution-audit/SKILL.md`, `.claude/skills/verify-moverrr-change/SKILL.md`, `.claude/skills/release-readiness/SKILL.md`
  - **What:** Add `effort: high` to the frontmatter of these four skills. This tells Claude to use its highest reasoning capability when these skills are active, overriding any lower default session effort level.
  - **Why:** These are the highest-stakes workflows in moverrr — booking safety, dispute resolution, final verification, and release gating. Getting them wrong has real financial and trust consequences. High effort ensures the model is not cutting corners when it matters most.
  - **Done when:** All four skills have `effort: high` in frontmatter.

- [ ] **AG-S4** — Add `$ARGUMENTS` support and `argument-hint` to parameterizable skills
  - **File(s):** `.claude/skills/verify-moverrr-change/SKILL.md`, `.claude/skills/verify-api/SKILL.md`, `.claude/skills/verify-web-ui/SKILL.md`, `.claude/skills/metrics-review/SKILL.md`
  - **What:** For each skill, add `argument-hint` to frontmatter indicating what arguments are accepted. Add `$ARGUMENTS` into the skill body at the logical point where the argument should be used. For example: verify-moverrr-change gets `argument-hint: "[area: bookings|payments|search|ui|docs]"` and its body uses `$ARGUMENTS` to scope which verification mode to run. Verify-api gets `argument-hint: "[route-path]"` so `/verify-api /api/bookings` runs the API verification against that specific route. metrics-review gets `argument-hint: "[date-range or focus-area]"`.
  - **Why:** Right now you can only invoke `/verify-moverrr-change` with no arguments, and it has to infer scope. Adding `$ARGUMENTS` means `/verify-moverrr-change bookings` scopes the entire pass to booking-related verification — faster, more focused, and less context-consuming.
  - **Done when:** All four skills have `argument-hint:` in frontmatter and `$ARGUMENTS` in the body at a meaningful point. Running `/verify-api /api/bookings` correctly scopes the verification to that route.

- [ ] **AG-S5** — Add dynamic context injection to `metrics-review` and `admin-queue-review` skills
  - **File(s):** `.claude/skills/metrics-review/SKILL.md`, `.claude/skills/admin-queue-review/SKILL.md`
  - **What:** Add shell command injection using the `` !`command` `` syntax at the top of each skill, before Claude reads anything. For metrics-review, inject: `` !`git log --oneline --since="7 days ago" | head -20` `` (recent changes) and `` !`date` `` (current date context). For admin-queue-review, inject: `` !`git log --oneline -10` `` and `` !`npm run check 2>&1 | tail -5` `` (current health state). This pre-populates the skill with live repo state before Claude starts reasoning.
  - **Why:** Metrics review needs to know what changed in the last week to understand which metrics are relevant. Admin queue review needs current repo health context. Currently these skills run with zero live state — the injected commands give Claude real data without requiring it to run commands itself, saving turns and keeping context cleaner.
  - **Done when:** Both skills have `` !`command` `` blocks at the top, and when invoked the output of those commands appears in the rendered skill prompt rather than the raw backtick syntax.

- [ ] **AG-S6** — Add supporting files directory to complex multi-phase skills
  - **File(s):** `.claude/skills/booking-safety-audit/`, `.claude/skills/verify-moverrr-change/`, `.claude/skills/release-readiness/`
  - **What:** For each of these three skills, create a `examples/` subdirectory. In booking-safety-audit/examples/, create `pricing-identity.md` showing a worked example of correct commission math with real numbers. In verify-moverrr-change/examples/, create `verification-report-example.md` showing a correctly formatted adversarial probe and evidence report. In release-readiness/examples/, create `release-checklist-example.md` showing a completed release readiness check with "ship-ready" verdict. Reference these from the respective SKILL.md with a line like "For a worked example, see [examples/pricing-identity.md](examples/pricing-identity.md)."
  - **Why:** Claude currently has to infer what a good verification report looks like from the SKILL.md instructions alone. A concrete example dramatically improves output consistency and reduces the chance of ceremonial "looks good" reports. The example files are loaded on demand, not into every context, keeping the always-loaded token cost zero.
  - **Done when:** Each skill directory has an `examples/` subdirectory with a relevant example file, and the SKILL.md references it.

- [ ] **AG-S7** — Add `paths` frontmatter to domain-specific skills for auto-activation
  - **File(s):** `.claude/skills/booking-safety-audit/SKILL.md`, `.claude/skills/ios-touch-audit/SKILL.md`
  - **What:** `booking-safety-audit` already has `paths:` configured correctly — verify this is correct and complete. For `ios-touch-audit`, add `paths: [src/components/**, src/app/**, src/hooks/**, tailwind.config.ts, src/app/globals.css]` so Claude auto-loads the touch audit context when working on frontend files. Verify other skills: `verify-api` should have `paths: [src/app/api/**]`, `chrome-qa-tester` should have `paths: [src/app/**, src/components/**]`.
  - **Why:** Path-scoped auto-activation means Claude gets domain context exactly when it's relevant, without requiring the user to manually invoke skills. This is the "reference content" use case for skills — ambient domain knowledge that loads on demand based on what files are being touched.
  - **Done when:** Each updated skill has correct `paths:` frontmatter. When editing a file that matches a path pattern, Claude's context shows the skill description as available without explicit invocation.

---

### AG-NS — New Skills to Create
*These skills are either referenced in existing docs but not built, or are standard workflows that are missing from the current skill library.*

- [ ] **AG-NS1** — Create `monthly-memory-refactor` skill
  - **File(s):** new dir: `.claude/skills/monthly-memory-refactor/`, new file: `.claude/skills/monthly-memory-refactor/SKILL.md`
  - **What:** Create a skill with `disable-model-invocation: true` (manual-only). The skill body should implement the monthly refactor ritual already described in operating-system.md: (1) read all files in `.claude/rules/`, `.agent-skills/`, and `.claude/agents/`, (2) identify stale references (paths that no longer exist, features that have shipped, duplicate truths), (3) identify over-long always-loaded files that should be moved to narrower scopes, (4) produce a specific list of proposed changes with file-level precision, (5) get user confirmation before any edits. Add `effort: high` and `context: fork` with `agent: repo-explorer`. Add `argument-hint: "[focus: rules|agents|skills|all]"`.
  - **Why:** Operating-system.md explicitly calls for a monthly memory refactor but no skill exists to run it. Without a skill, this ritual either doesn't happen or happens inconsistently without a documented process. Stale docs are a product bug — this skill is the cure.
  - **Done when:** The skill exists, `/monthly-memory-refactor` can be invoked and produces a specific actionable list of stale/redundant doc entries with file and line references.

- [ ] **AG-NS2** — Create `fix-issue` skill for GitHub issue → implement → PR workflow
  - **File(s):** new dir: `.claude/skills/fix-issue/`, new file: `.claude/skills/fix-issue/SKILL.md`
  - **What:** Create a skill with `disable-model-invocation: true`, `argument-hint: "[issue-number]"`, and `allowed-tools: Bash(gh *)`. The skill body: (1) run `` !`gh issue view $ARGUMENTS` `` to fetch the issue details before Claude starts, (2) instruct Claude to understand the problem from the issue, (3) run repo-explorer subagent to find relevant files, (4) implement the fix following all CLAUDE.md invariants, (5) run `npm run check`, (6) create a descriptive commit referencing the issue number, (7) push and open a PR with `gh pr create` linking the issue. The skill must gate on "does this fit the browse-first marketplace thesis?" before implementing.
  - **Why:** GitHub issue → implement → PR is a repeatable workflow that currently requires the user to manually orchestrate. A skill codifies the full loop including the product-shape check that prevents issues from being "fixed" in ways that drift moverrr toward dispatch or quote-comparison.
  - **Done when:** `/fix-issue 42` fetches issue 42, implements the fix, runs checks, and opens a PR — all in one skill invocation.

- [ ] **AG-NS3** — Create `spec` skill for interview-driven feature specification
  - **File(s):** new dir: `.claude/skills/spec/`, new file: `.claude/skills/spec/SKILL.md`
  - **What:** Create a skill with `disable-model-invocation: true` and `argument-hint: "[feature-description]"`. The skill body instructs Claude to: (1) use `AskUserQuestion` to interview the user about the feature, asking about implementation approach, UX edge cases, trust implications, pricing impacts, mobile behavior, and tradeoffs — digging into the hard parts, not obvious questions, (2) ask specifically "does this fit the spare-capacity browse-first model or does it drift toward dispatch?", (3) after the interview is complete, write a complete spec to `SPEC.md` in the project root. Add a note: "Once the spec is written, start a fresh session to implement it — clean context, focused scope." Add `effort: high` to the frontmatter.
  - **Why:** The best practices doc explicitly recommends this interview-then-spec pattern for larger features. Currently there's no way to invoke this workflow deliberately. Having it as a named skill makes the "think before building" ritual explicit and repeatable.
  - **Done when:** `/spec add paused trip status` interviews the user about that feature and produces a well-structured SPEC.md that an AI can implement from.

- [ ] **AG-NS4** — Create `write-task` skill that enforces TASK-RULES.md format for AI-generated backlog items
  - **File(s):** new dir: `.claude/skills/write-task/`, new file: `.claude/skills/write-task/SKILL.md`
  - **What:** Create a skill with `disable-model-invocation: true`, `argument-hint: "[task description or area]"`. The skill body must: (1) read TASK-RULES.md before writing anything, (2) dynamically inject current todolist.md via `` !`tail -100 todolist.md` `` to check for duplicates before writing, (3) instruct Claude to draft the task in the required format (ID, Files, What, Why, Done when), (4) explicitly check: "Would removing the 'Done when' make this unverifiable? If yes, rewrite it." (5) Check for duplicates against what was injected. (6) Ask the user to confirm the draft before appending to todolist.md. The skill should also enforce ID conventions from TASK-RULES.md.
  - **Why:** The user's core complaint is that AI writes vague, unverifiable tasks to todolist.md. This skill puts TASK-RULES.md as the first thing read, injects a duplicate-check, and requires draft confirmation before appending. It makes "AI writes a task" a governed process rather than a free-form write.
  - **Done when:** `/write-task fix the search pagination` produces a task draft in TASK-RULES.md format that is specific, has a verifiable "Done when," checks for duplicates, and asks for confirmation before appending.

- [ ] **AG-NS5** — Create `review-pr` skill for structured PR review workflow
  - **File(s):** new dir: `.claude/skills/review-pr/`, new file: `.claude/skills/review-pr/SKILL.md`
  - **What:** Create a skill with `disable-model-invocation: true`, `argument-hint: "[PR-number or 'current']"`, `context: fork`, `agent: repo-explorer`. Dynamic context injection at top: `` !`gh pr diff $ARGUMENTS` ``, `` !`gh pr view $ARGUMENTS --comments` ``, `` !`gh pr diff $ARGUMENTS --name-only` ``. Skill body: (1) review for CLAUDE.md invariant violations (pricing math, iOS-first rules, RLS bypass, commission logic), (2) review for trust copy drift using copy-guardian patterns, (3) check that verification evidence exists in the PR description (not just "looks good"), (4) produce structured feedback as: Critical (must fix), Warnings (should fix), Suggestions (consider). Add `effort: high`.
  - **Why:** A moverrr-specific PR review skill uses the project's actual invariants (pricing, iOS rules, trust language) rather than a generic code quality lens. Currently there's no structured way to invoke a full product-aware PR review in one command.
  - **Done when:** `/review-pr 47` fetches PR 47, reads the diff, and produces structured feedback organized by criticality, with specific file:line references.

- [ ] **AG-NS6** — Create `session-start` skill for structured task kickoff following TASK-RULES.md session loop
  - **File(s):** new dir: `.claude/skills/session-start/`, new file: `.claude/skills/session-start/SKILL.md`
  - **What:** Create a skill with `disable-model-invocation: true`. Dynamic context injection: `` !`head -50 todolist.md` `` (top backlog items), `` !`git log --oneline -5` `` (recent commits), `` !`git status` `` (current state). Skill body: (1) present the highest-priority unblocked task from the injected todolist snapshot, (2) read the relevant .claude/rules/ file for that task area, (3) read the matching .agent-skills/ file, (4) confirm the task scope and approach with the user before proceeding. The skill should explicitly follow the TASK-RULES.md session loop: "read the current task, read the relevant code, implement the smallest complete change, verify, close out."
  - **Why:** Currently every session starts with re-reading context ad hoc. This skill formalizes the session kickoff ritual: current highest-priority task, right context loaded, user confirms scope before Claude writes a line of code.
  - **Done when:** `/session-start` presents the top backlog item with its full context and asks for session scope confirmation before any implementation begins.

---

### AG-NA — New Agents to Create
*These agents address gaps in the current role map. They handle specific task types that the existing agents don't cover cleanly.*

- [ ] **AG-NA1** — Create `debugger` agent for systematic root-cause analysis and fixes
  - **File(s):** new file: `.claude/agents/debugger.md`
  - **What:** Create a new agent with: `name: debugger`, `description: Systematic debugging specialist for errors, test failures, unexpected behavior, and production incidents. Use proactively when encountering any error — captures root cause, not just symptom. Use when: bug report, test failure, error message, unexpected output.`, `tools: Read, Edit, Bash, Grep, Glob`, `model: inherit`, `effort: high`, `background: false` (needs interactive clarification). Agent body: (1) capture error + stack trace, (2) identify reproduction steps, (3) form hypotheses about root cause, (4) test each hypothesis with the smallest probe, (5) implement minimal fix, (6) verify fix with adversarial check, (7) report: root cause, evidence, fix, prevention suggestion.
  - **Why:** Currently debugging is done by the main Claude or the feature-implementer. Neither has a systematic debugging protocol. The debugger agent enforces the root-cause discipline: it won't just suppress an error — it finds out why it's happening. This matters especially for trust-critical paths (booking creation failures, payment webhook misses) where suppressing the symptom is worse than the bug.
  - **Done when:** The agent file exists, `claude agents` shows it in the project agents list, and invoking it on a known bug produces a root-cause analysis with evidence rather than a speculative "try this" fix.

- [ ] **AG-NA2** — Create `test-runner` agent that isolates test output from main context
  - **File(s):** new file: `.claude/agents/test-runner.md`
  - **What:** Create a new agent with: `name: test-runner`, `description: Run tests and return only failures. Use when you need test results without polluting main context with verbose test output. Runs npm run test and reports only: failed tests, error messages, file:line references. Does not fix failures.`, `tools: Bash(npm run test*), Read, Grep`, `model: haiku` (fast and cheap for this task), `background: true`, `maxTurns: 10`. Body: Run `npm run test 2>&1`, filter for FAIL/PASS lines, extract failing test names and error messages, return compact summary only.
  - **Why:** Running `npm run test` directly in the main conversation floods the context with test output (hundreds of lines of PASS statements). A dedicated test-runner agent returns only failures in a compact format, and does so in a background context that doesn't consume the main conversation's token budget.
  - **Done when:** Invoking the test-runner agent returns only failing tests with error messages in 3-5 lines of output, not the full test runner output.

- [ ] **AG-NA3** — Create `backlog-groomer` agent for AI-driven backlog quality maintenance
  - **File(s):** new file: `.claude/agents/backlog-groomer.md`
  - **What:** Create a new agent with: `name: backlog-groomer`, `description: Review todolist.md for quality issues: vague tasks, missing 'Done when' criteria, duplicates, priority mismatches, and drift toward dispatch/quote-engine patterns. Use when backlog has grown vague or needs triage. Does not add new tasks — only reviews and flags existing ones.`, `tools: Read, Glob`, `model: sonnet`, `background: false` (needs user interaction), `effort: medium`, `memory: project`. Body: (1) read TASK-RULES.md fully, (2) read todolist.md fully, (3) for each task: check has File(s), What, Why, Done when, is specific and verifiable, is not a duplicate, doesn't drift product thesis, (4) produce a list of tasks that fail quality criteria with specific fixes suggested, (5) ask user to confirm before modifying anything.
  - **Why:** The user's core complaint: AI writes vague tasks to todolist.md. The backlog-groomer agent applies TASK-RULES.md as an audit tool on the existing backlog. Persistent memory lets it remember "this type of vague phrasing keeps appearing" and proactively flag it in future sessions.
  - **Done when:** The agent exists, invoking it produces a quality audit of todolist.md with specific flagged items and suggested rewrites, without modifying the file until user confirms.

---

### AG-C — CLAUDE.md Improvements
*The CLAUDE.md is good but can be leaner and more explicit about session management patterns. The goal is: every line earns its place in the always-loaded context.*

- [ ] **AG-C1** — Add compaction instructions to CLAUDE.md so auto-compact preserves critical context
  - **File(s):** `CLAUDE.md`
  - **What:** Add a short section near the top of CLAUDE.md (before the Product Thesis section) titled "Compaction Instructions." Content: "When compacting, always preserve: (1) the full list of files modified this session, (2) any explicit user decisions about approach or scope, (3) open pricing math or booking invariant questions, (4) the current task ID from todolist.md being worked on, (5) any failed approaches that were explicitly ruled out. Do NOT preserve: verbose command output, full file contents that can be re-read, and exploratory questions that were answered."
  - **Why:** The document says Claude's auto-compaction "summarizes what matters most" — but it doesn't know what matters most for moverrr specifically. These instructions teach the compaction process what to preserve. Without them, a compacted session might lose the information that "the user ruled out approach X" or "the task was EP1, not EP2."
  - **Done when:** CLAUDE.md has a compaction instructions section, and after a manual `/compact` the resulting summary demonstrably preserves the types of context listed.

- [ ] **AG-C2** — Add `@import` reference for TASK-RULES.md in CLAUDE.md
  - **File(s):** `CLAUDE.md`
  - **What:** In the "Working Rhythm" section of CLAUDE.md, add a line: "The task system is governed by `@TASK-RULES.md`. When writing or modifying backlog items, read that file first." This uses the CLAUDE.md `@import` pattern — Claude will read TASK-RULES.md when this section is relevant. Do NOT paste TASK-RULES.md content inline into CLAUDE.md; the `@path` reference loads it on demand without bloating the always-loaded context.
  - **Why:** Currently TASK-RULES.md exists but there's no guarantee that Claude loads it before writing backlog items. The `@import` syntax in CLAUDE.md creates an explicit demand-load relationship: when the working rhythm section matters, TASK-RULES.md gets read. This is the key missing link between the task system quality rules and actual AI-written tasks.
  - **Done when:** CLAUDE.md has the `@TASK-RULES.md` reference in the Working Rhythm section, and when Claude is asked to write a task, it demonstrably reads TASK-RULES.md first (visible in the transcript).

- [ ] **AG-C3** — Add explicit session management patterns section to CLAUDE.md
  - **File(s):** `CLAUDE.md`
  - **What:** Add a lean "Session Discipline" section to CLAUDE.md with these rules: (1) "Use `/clear` between unrelated tasks — never carry context from a debugging session into a new feature." (2) "Use `/compact Focus on <area>` when context is large but the task continues — this preserves relevant context and discards noise." (3) "Use `/btw` for quick one-off questions that should not enter context history." (4) "If Claude has been corrected on the same issue twice, `/clear` and re-prompt with what was learned." (5) "Use subagents for any investigation that reads more than 5 files." Keep this section to ≤10 lines.
  - **Why:** These session management patterns from the best practices doc are nowhere documented in the repo. Without them, every session accumulates context noise until performance degrades. Claude and the user need shared vocabulary for these patterns.
  - **Done when:** CLAUDE.md has a Session Discipline section ≤10 lines, with `/clear`, `/compact`, and `/btw` patterns clearly stated.

- [ ] **AG-C4** — Audit and prune CLAUDE.md for lines that don't change Claude's behavior
  - **File(s):** `CLAUDE.md`
  - **What:** Go through CLAUDE.md line by line and for each line ask: "Would removing this cause Claude to make a mistake?" If the answer is no, either delete the line or move it to the narrowest relevant scoped rule file. Specifically look for: (a) rules that duplicate what's in `.claude/rules/` files, (b) general programming advice Claude already follows without being told, (c) architectural descriptions that are better in `.agent-skills/OVERVIEW.md`. After pruning, CLAUDE.md should be noticeably shorter — target: under 150 lines. The Core Invariants section (pricing math, booking flow, iOS rules) must stay — those are genuinely non-obvious and Claude needs them always loaded.
  - **Why:** The best practices doc is explicit: "If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise." CLAUDE.md is currently long and dense. Every redundant line increases the chance that the critical invariants (commission math, iOS rules) get deprioritized because they're surrounded by lower-stakes guidance.
  - **Done when:** CLAUDE.md is ≤150 lines, the Core Invariants are intact and prominent, and a line-by-line audit confirms every remaining line would cause a real mistake if removed.

---

### AG-T — Agent Teams Configuration
*Agent teams are experimental but worth enabling for parallel investigation workflows. The existing agent role map maps almost perfectly onto team workflows.*

- [ ] **AG-T1** — Enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in project settings.json
  - **File(s):** `.claude/settings.json`
  - **What:** Add to `.claude/settings.json` under an `env` key: `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"`. This enables the experimental agent teams feature for all project sessions. Also add to `.claude/agents.md` a short section "Agent Teams" that documents: (1) use teams when tasks have 3+ independent investigation paths, (2) typical team: repo-explorer (architecture), product-researcher (user-facing behavior), feature-implementer (implementation path), (3) use subagents instead when work is sequential or same-file.
  - **Why:** The moverrr agent role map is already structured in a way that maps perfectly to team workflows. A typical "implement EP1 geospatial search fix" involves independent tracks: explore the current search code, check the customer-facing impact, implement the fix. These can run in parallel with agent teams rather than sequentially, cutting elapsed time by 3x on suitable tasks.
  - **Done when:** `.claude/settings.json` has the env key, Claude Code shows agent team capabilities available, and agents.md documents when to use teams vs subagents.

- [ ] **AG-T2** — Add TeammateIdle and TaskCompleted hooks for agent team quality enforcement
  - **File(s):** `.claude/settings.json`
  - **What:** Add to the hooks section of settings.json: a `TeammateIdle` hook that runs a check script (`.claude/scripts/check-teammate-idle.sh`) that reads the hook JSON input and exits with code 2 if the teammate's task description matches "verify" or "review" but their last message contains "looks good" or "LGTM" without citing specific evidence. This blocks the teammate from going idle with a ceremonial "looks good" and forces them to provide evidence. Also add a `TaskCompleted` hook for tasks tagged as payment or booking-related that runs a check: does the completion message mention `npm run check`? If not, block completion with code 2.
  - **Why:** Agent teams are most valuable when teammates are held to the same verification discipline as the main agent. Without hooks, a reviewer teammate can fire off "looks good" and go idle — exactly the ceremonial review the operating-system.md prohibits. Hooks enforce the evidence requirement structurally.
  - **Done when:** The hook scripts exist, are in `.claude/settings.json`, and a test teammate that produces a "looks good" verification is blocked from going idle by the hook.

---

### AG-M — Context & Memory Architecture
*Structural improvements to how context is managed across sessions and how institutional knowledge accumulates.*

- [ ] **AG-M1** — Create `.claude/agent-memory/` directory structure and add to .gitignore
  - **File(s):** new dir: `.claude/agent-memory/`, `.gitignore`
  - **What:** Create the directory `.claude/agent-memory/` which will hold persistent memory files for agents that have `memory: project` enabled. Create a placeholder `.gitkeep` inside. Add `.claude/agent-memory-local/` to `.gitignore` (this is the `memory: local` scope directory). Add `.claude/agent-memory/` to git tracking (it should be committed — this is the shared institutional memory). Create `.claude/agent-memory/README.md` explaining: "This directory stores persistent memory for project-scoped subagents. Files here accumulate cross-session institutional knowledge. Do not delete — treat as part of the operating system."
  - **Why:** When AG-A1 through AG-A3 add `memory: project` to agents, they'll need this directory to exist. Without it, agents may fail to initialize or write to unexpected locations. The README prevents future contributors (human or AI) from deleting what looks like a temporary directory.
  - **Done when:** `.claude/agent-memory/` exists with README.md, is committed to git, `.claude/agent-memory-local/` is gitignored, and `git status` confirms the directory is tracked.

- [ ] **AG-M2** — Document worktree naming and cleanup rules in operating-system.md
  - **File(s):** `.claude/operating-system.md`
  - **What:** Expand the existing "Worktrees" section in operating-system.md with: (1) explicit naming convention examples for moverrr work patterns (`feature/ep1-geospatial-search`, `verify/booking-concurrency`, `docs/rule-refactor`), (2) cleanup rule: "Always clean up worktrees after the task. Run `git worktree list` and prune stale ones with `git worktree prune`." (3) A note: "schema-reviewer always uses a worktree (AG-A3). Feature implementations should default to a worktree for any task touching more than 3 files." Add the cleanup command to command-catalog.md as well.
  - **Why:** Worktrees are mentioned in operating-system.md but not operationalized — there are no examples, no naming conventions applied to moverrr's actual task types, and no cleanup protocol. Without cleanup rules, stale worktrees accumulate and create confusion about which branch is the "live" one.
  - **Done when:** operating-system.md has expanded worktree section with moverrr-specific examples and cleanup steps. command-catalog.md has `git worktree prune` listed.

---

### AG-TS — Task System Improvements
*The todolist.md quality issue identified by the user: AI-written tasks tend to be vague. These items address the system-level causes.*

- [ ] **AG-TS1** — Add explicit "AI writing tasks" protocol to TASK-RULES.md
  - **File(s):** `TASK-RULES.md`
  - **What:** Add a new section "When AI Writes Tasks" to TASK-RULES.md with these rules: (1) "Read this entire file before writing any task." (2) "Draft the task in the required format, then re-read your own draft and check: Is 'Done when' verifiable without ambiguity? Does 'What' describe a behavior change, not an implementation detail? Does 'Why' state user/business impact, not just technical justification?" (3) "If a task you're about to write is similar to an existing task, do not add it — update or clarify the existing one instead." (4) "Never write a task with 'investigate', 'improve', 'enhance', or 'consider' as the primary action — these are hypotheses, not tasks." (5) "After writing a task, show it to the user for confirmation before appending to todolist.md."
  - **Why:** The quality problems with AI-written tasks are systemic: Claude doesn't re-read what it writes, doesn't check for duplicates, and doesn't verify the "Done when" is actually verifiable. These five rules address each failure mode specifically.
  - **Done when:** TASK-RULES.md has the "When AI Writes Tasks" section. The next AI-written task in a session where this file is loaded follows all five rules.

- [ ] **AG-TS2** — Create a task template file that AI must fill before writing to todolist.md
  - **File(s):** new file: `.claude/task-template.md`
  - **What:** Create a fill-in-the-blank task template at `.claude/task-template.md`. Content: "## Task Draft\n- [ ] **[ID]** — [Title: action verb + specific behavior]\n  - **File(s):** [exact file path or 'new file: path']\n  - **What:** [one sentence: what specific behavior changes. NOT 'improve' or 'enhance']\n  - **Why:** [one sentence: which user (carrier/customer/admin), what they experience differently, why that matters to marketplace trust/supply/clarity]\n  - **Done when:** [specific observable outcome — what does passing look like? must be checkable without author context]\n\n## Pre-submit checklist\n- [ ] Done when is verifiable by a third party who didn't write the task\n- [ ] No duplicate exists in todolist.md\n- [ ] File paths are exact (not 'src/components/**')\n- [ ] This doesn't bundle two separate outcomes into one task\n- [ ] Priority (P0/P1/P2/P3/P4) is assigned and justified". Reference this from TASK-RULES.md.
  - **Why:** A fill-in template with a pre-submit checklist turns "write a task" from a free-form action into a structured process with verifiable gates. The checklist items directly address the most common failure modes seen in AI-written tasks.
  - **Done when:** The file exists, TASK-RULES.md references it, and when AI uses it to write a task the result passes all checklist items.

---

### AG-CI — CI & Automation Patterns
*Non-interactive `claude -p` usage for automated quality gates and CI integration.*

- [ ] **AG-CI1** — Add a GitHub Actions workflow that runs docs/memory drift check on PR
  - **File(s):** new file: `.github/workflows/claude-docs-check.yml`
  - **What:** Create a GitHub Actions workflow that runs on PR to main. The workflow uses `claude -p` in non-interactive mode to check: "Read CLAUDE.md and the files listed in .claude/operating-system.md capability index. Verify they are internally consistent — no broken path references, no instructions for features that don't exist, no duplicate truth between CLAUDE.md and .claude/rules/. Output a brief report. Exit 0 if clean, exit 1 if issues found." The workflow should use `--allowedTools "Read,Grep,Glob"` to restrict it to read-only operations. Add `ANTHROPIC_API_KEY` as a required secret in the workflow.
  - **Why:** Stale docs are a product bug. Currently docs drift is only caught when a human or AI happens to notice it. A CI check that runs on every PR creates automatic enforcement without requiring any human attention for clean PRs.
  - **Done when:** The workflow file exists, runs successfully on a test PR, produces a readable report, and exits 1 when given a deliberately inconsistent test state.

- [ ] **AG-CI2** — Add `claude -p` based pricing math regression check as a pre-commit hook
  - **File(s):** new file: `.claude/scripts/pricing-check.sh`, `.claude/settings.json` or `.husky/pre-commit`
  - **What:** Create a shell script that uses `claude -p` with `--output-format json` to check: "Read src/lib/pricing/breakdown.ts and src/lib/__tests__/breakdown.test.ts. Verify the commission formula is EXACTLY: commission = basePriceCents * 0.15, total = basePriceCents + stairsFee + helperFee + 500, carrier earns = basePriceCents + stairsFee + helperFee - commission. If any of these are violated, output the violation and exit 1. If all pass, output OK and exit 0." Register this as a pre-commit hook (via `.husky/pre-commit` or similar). Use `--allowedTools "Read"` to keep it read-only.
  - **Why:** Commission math is a frozen invariant that must never change accidentally. A pre-commit hook using Claude to verify the pricing identity means any change to the formula — even a seemingly innocent refactor — gets caught before it reaches main. This is the "give Claude a way to verify its own work" pattern applied to the most critical business rule in the codebase.
  - **Done when:** The script exists, is registered as a pre-commit hook, runs in ≤15 seconds, and blocks a commit that contains a deliberately wrong commission formula.

---

### AG-X — Cross-Cutting Infrastructure
*Improvements that span multiple categories or enable future agentic work.*

- [ ] **AG-X1** — Add `CLAUDE.local.md` to `.gitignore` and document its use
  - **File(s):** `.gitignore`, `CLAUDE.md`
  - **What:** Add `CLAUDE.local.md` to `.gitignore`. Add a line to CLAUDE.md under the "Configure your environment" area (or at the bottom): "Personal overrides: Use `CLAUDE.local.md` at the project root for session-specific personal preferences that should not be committed (e.g. personal tool path preferences, local Supabase connection details, personal work style notes). This file is gitignored and never shared."
  - **Why:** The best practices doc mentions `CLAUDE.local.md` for personal project-specific notes. Currently there's no gitignore entry and no documentation about it. Team members who want personal overrides have no clean place to put them and might accidentally put personal notes in CLAUDE.md (which is committed).
  - **Done when:** `CLAUDE.local.md` is in `.gitignore`, CLAUDE.md mentions it, and a test `CLAUDE.local.md` file does not appear in `git status` as untracked.

- [ ] **AG-X2** — Create a `scripts/` directory under `.claude/` with shared hook scripts
  - **File(s):** new dir: `.claude/scripts/`, new files as referenced by AG-H3, AG-H6, AG-CI2
  - **What:** Create `.claude/scripts/` directory. Create `.claude/scripts/.gitignore` that excludes nothing (all scripts should be committed). Create a `README.md` in `.claude/scripts/` that explains: "Scripts in this directory are invoked by hooks, skills, and CI workflows. Each script must be chmod +x. Scripts receive JSON via stdin when invoked by hooks. See the Claude Code hooks documentation for the input schema." Ensure all hook scripts created in AG-H3 and AG-H6 are placed here and are executable.
  - **Why:** Currently hook scripts have no designated location. Without a standard location, scripts get placed in ad hoc spots (project root, /tmp, random paths), making maintenance impossible. A committed `.claude/scripts/` directory gives hooks a stable home that travels with the repo.
  - **Done when:** `.claude/scripts/` exists with README.md, all hook scripts are stored there, all are `chmod +x`, and the scripts are referenced correctly from `.claude/settings.json`.

- [ ] **AG-X3** — Audit and update all agent `description` fields to front-load trigger keywords and be ≤250 chars
  - **File(s):** all files in `.claude/agents/*.md`
  - **What:** Read each agent's `description` field. For each: (1) check it is ≤250 characters (descriptions over 250 chars get truncated in Claude's context, defeating their purpose), (2) check it starts with the primary trigger condition ("Use when...", "Implement...", "Review..."), (3) check it includes the key action verbs Claude would see in a user request. Rewrite any that fail these checks. The founder-critic description is a good example to follow. The feature-implementer description is currently borderline (see AG-A6 for that specific fix).
  - **Why:** Auto-delegation only works when Claude can accurately match a user request to an agent description. Descriptions that are over-long, passive, or don't front-load trigger conditions get missed. This audit ensures the entire agent roster is correctly tuned for auto-delegation.
  - **Done when:** All 10 agent descriptions are ≤250 characters, start with a clear trigger condition, and have been tested to auto-delegate correctly for a representative request.

- [ ] **AG-X4** — Update capability-index.md to include new agents and skills added from this backlog
  - **File(s):** `.claude/capability-index.md`, `.claude/operating-system.md`
  - **What:** After completing the new agents (AG-NA1, AG-NA2, AG-NA3) and new skills (AG-NS1 through AG-NS6), update capability-index.md to list them under the appropriate sections. Also update the capability index in operating-system.md. This is a docs-sync task that should run as the final step after any AG- work is completed.
  - **Why:** The capability-index.md is the "fast inventory of what exists." If new agents and skills exist but aren't listed there, AI agents looking for tools won't find them. This is exactly the stale-docs problem the docs-keeper is designed to prevent — but it needs to be explicitly tracked as a task.
  - **Done when:** capability-index.md accurately lists all agents and skills including any added from this AG- backlog. operating-system.md capability index section matches. No new agent or skill exists that isn't listed in the index.

---

> **Implementation note:** Start with AG-H1 and AG-H5 (settings.json foundation), then AG-M1 (agent-memory directory), then agent upgrades (AG-A series) which depend on settings.json existing. Skills upgrades (AG-S series) are independent and can run in parallel. New skills (AG-NS series) are independent of everything. CI work (AG-CI) requires agent teams context but not agent teams activation.
>
> Delegate each category to the `feature-implementer` agent once the category is ready. Use the `verifier` agent after each category to confirm what was added actually works as described. Use `docs-keeper` after the full AG- sweep to sync capability-index.md.

---

## Agent Operating System — Rule Files, Docs & OS Meta-Tasks

> These items improve the agent operating system: scoped rule files that auto-load for specific code areas, experiment discipline infrastructure, and capability documentation. They are not product features — they are the foundation that makes all other work faster and safer.

---

### EO — Operating System Tasks

- [ ] **EO1** — Create `.claude/rules/search-and-matching.md`
  - **File(s):** new file: `.claude/rules/search-and-matching.md`
  - **What:** Create a scoped rule file with `paths: [src/lib/matching/**, src/app/api/search/**, src/app/(customer)/search/**]`. Cover: route-fit logic expectations, score formula parity requirement (TypeScript `score.ts` must match the `find_matching_listings` SQL RPC formula exactly), explainability constraints (no opaque ranking), detour radius invariant, and fallback path behavior.
  - **Why:** Matching is product-shaping logic. Without a local rule file, search/matching work inherits only generic repo guidance and misses the critical formula-parity and explainability constraints.
  - **Done when:** File exists with narrow `paths` frontmatter, covers all matching invariants, and auto-loads when files under `src/lib/matching/` are edited.

- [ ] **EO2** — Create `.claude/rules/payments-and-payouts.md`
  - **File(s):** new file: `.claude/rules/payments-and-payouts.md`
  - **What:** Create a scoped rule file with `paths: [src/lib/stripe/**, src/app/api/payments/**, src/app/api/bookings/**/confirm-receipt/**]`. Cover: manual capture flow and timing, webhook idempotency requirements, refund policy by payment state, Connect account requirements, reconciliation expectations, and commission math reference.
  - **Why:** Funds flow is the highest-risk product area. Narrower scoped memory prevents missed invariants during payment work that only loads for generic backend rules today.
  - **Done when:** File exists with narrow paths covering all payment-critical files. Auto-loads when payment or webhook code is touched.

- [ ] **EO3** — Create `.claude/rules/supabase-schema.md`
  - **File(s):** new file: `.claude/rules/supabase-schema.md`
  - **What:** Create a scoped rule file with `paths: [supabase/migrations/**, src/types/database.ts]`. Cover: RLS requirement for every new table, GIST index requirement for geography columns, sequential migration numbering (the 010/010 duplicate is the canonical bad example), RPC vs direct query policy, rollback analysis requirement, and type-sync expectations.
  - **Why:** Schema work without local constraints leads to missed RLS, duplicate migration numbers, or missing indexes — all of which have caused actual bugs in this repo.
  - **Done when:** File exists, auto-loads when editing migration files, and covers all schema discipline from CLAUDE.md core invariants.

- [ ] **EO4** — Create `.claude/rules/analytics-and-metrics.md`
  - **File(s):** new file: `.claude/rules/analytics-and-metrics.md`
  - **What:** Create a scoped rule for analytics files. Cover: the core metrics moverrr actually measures (browse-to-book conversion, supply density per corridor, carrier response rate), event idempotency requirements, dedupe expectations, and the distinction between actionable marketplace metrics and vanity metrics.
  - **Why:** Analytics work without local rules tends to add events that don't map to real marketplace decisions, and duplicates inflate funnel baselines before launch.
  - **Done when:** File exists with relevant paths and covers core metric definitions and event hygiene expectations.

- [ ] **EO5** — Create `.claude/rules/customer-trust.md`
  - **File(s):** new file: `.claude/rules/customer-trust.md`
  - **What:** Create a scoped rule with `paths: [src/app/(customer)/trip/**, src/components/booking/**, src/app/(customer)/search/**]`. Cover: savings story accuracy requirements, total-price display rules (never show base price only), "what happens next" clarity requirements, and proof-led vs brand-claim copy standards.
  - **Why:** Customer trust copy and UX decisions are product-shaping. Local rules keep these decisions consistent when touching customer-facing pages and components.
  - **Done when:** File exists with correct paths, covers trust-relevant UX and copy expectations. Auto-loads when customer-facing pages are edited.

- [ ] **EO6** — Create `.claude/rules/carrier-growth.md`
  - **File(s):** new file: `.claude/rules/carrier-growth.md`
  - **What:** Create a scoped rule with `paths: [src/app/(carrier)/**, src/components/carrier/**]`. Cover: activation speed priority (carriers must be able to post in <5 mins), repeat-posting value over novel supply, supply density focus, verification clarity expectations, and the "carriers are operating businesses" mental model.
  - **Why:** Carrier code without supply-context guidance can add friction that kills the repeat-posting flywheel — the most important supply mechanism.
  - **Done when:** File exists and auto-loads when carrier-facing files are edited.

- [ ] **EO7** — Create `.claude/rules/admin-operations.md`
  - **File(s):** new file: `.claude/rules/admin-operations.md`
  - **What:** Create a scoped rule with `paths: [src/app/(admin)/**]`. Cover: manual-first ops philosophy, queue-based workflow expectations (one founder, one queue), audit trail requirements for every manual override, `createAdminClient()` usage policy for RLS bypass, and admin-specific security expectations.
  - **Why:** Admin code changes without ops-context guidance can produce UIs that don't fit the single-founder workflow or that miss the audit trail requirements.
  - **Done when:** File exists and auto-loads when admin pages or admin data functions are edited.

- [ ] **EO8** — Create experiment ledger for keep/discard tracking
  - **File(s):** new file: `.claude/experiment-ledger.md`
  - **What:** Create a ledger file with fixed format: experiment name, baseline metric, single change made, result observed, keep/discard decision, date. Include at least one worked example entry. Add a reference to it from the CLAUDE.md Working Rhythm section.
  - **Why:** Without a ledger, experiment outcomes disappear into chat history. The keep/discard discipline borrowed from `autoresearch` is only useful if results are recorded and consulted before starting a new experiment.
  - **Done when:** File exists with correct format, at least one entry, CLAUDE.md Working Rhythm section references it.

- [ ] **EO9** — Create or update capability index for all agents, skills, and rule files
  - **File(s):** new or updated: `.claude/capability-index.md`
  - **What:** Create a one-page index: all current agents (name, trigger, model), all skills (invocation command, when to use), all rule files (paths they cover). One line per item. Keep it scannable. Must be updated whenever an agent, skill, or rule is added.
  - **Why:** A future agent or contributor needs to discover capabilities without reading every individual file. The index is the table of contents for the operating system.
  - **Done when:** Capability index exists, is accurate for all current agents/skills/rules, is committed to git, and matches what `claude agents` shows.

- [ ] **EO10** — Standardize verifier report format across all verification skills
  - **File(s):** `.claude/skills/verify-moverrr-change/SKILL.md`, related verification skill files
  - **What:** Add a standard report template to all verification skills: checks run, evidence observed (specific file/line/log output), pass/fail per check, residual risk. Each verifier skill must produce a report following this template rather than a narrative.
  - **Why:** Verification reports without structure produce "looks good" outputs that don't distinguish evidence from confidence. A template makes reports comparable and auditable.
  - **Done when:** All verification skills include the report template format. The next verification run produces a structured report following it.

- [ ] **EO11** — Add permission matrix to operating-system.md (autonomous vs confirm vs second-opinion)
  - **File(s):** `.claude/operating-system.md`
  - **What:** Add a simple permission matrix: read-only and lint operations (auto-approve), file edits within task scope (confirm once per task), destructive operations and git push (always confirm), trust-critical paths — pricing, booking, payments (always confirm + second opinion or verifier). Match the categories in CLAUDE.md.
  - **Why:** Autonomy policy should be documented, not assumed. A written matrix makes confirmation expectations consistent across sessions and reduces "should I ask?" friction.
  - **Done when:** operating-system.md has a permission matrix section. Categories match CLAUDE.md risk tiers.

- [ ] **EO12** — Add adversarial probe checklist to all serious verification passes
  - **File(s):** `.claude/skills/verify-moverrr-change/SKILL.md`, `.claude/agents/verifier.md`
  - **What:** Add a short adversarial probe checklist to the verifier agent and verify-moverrr-change skill: concurrency (two simultaneous requests), boundary values (0, max, null), duplicate actions (double-submit), stale states (expired auth, closed booking), narrow viewport (375px), missing config (no Stripe key). At least one adversarial probe must be in every verification pass.
  - **Why:** The strongest verification lesson: try to break it. A checklist makes adversarial thinking deliberate rather than optional.
  - **Done when:** Verifier agent and skill include the probe checklist. Next verification pass includes at least one named adversarial probe with evidence of what happened.

---

## Moverrr — Critical Gaps Found in Deep Repo Review

> Added: `2026-04-08` — findings from a full codebase survey that go beyond what was already in the backlog. Each item below was verified by reading the actual code, not inferred. These are not wishlist items — they are holes in the current implementation.

---

### No code calls `stripe.paymentIntents.capture()` — every authorization will expire uncaptured

- **Priority:** P0
- **Stage:** Now
- **Type:** Product / Payments
- **Why this matters:** The booking intent is created with `capture_method: "manual"` in `src/app/api/payments/create-intent/route.ts`. Stripe hold-and-capture requires that the application explicitly call `stripe.paymentIntents.capture(intentId)` before the authorization expires (Stripe default: 7 days). The `applyPaymentIntentEvent()` function in `src/lib/stripe/payment-intent-events.ts` handles `payment_intent.succeeded` (which fires AFTER a capture), but no code anywhere in the visible codebase calls `stripe.paymentIntents.capture()`. The trigger for capture — when a booking transitions to `completed` — is absent. This means: (1) every booking that reaches `completed` status silently lets the authorized payment expire after 7 days, (2) no money is ever collected, (3) the platform earns zero, (4) the existing `EA7` item assumes "payment capture happens automatically when a booking moves to completed" — this is factually wrong. Capture never happens.
- **What exactly needs to be done:** Find the exact location where `updateBookingStatusForActor` handles the `delivered → completed` transition (in `src/lib/data/bookings.ts`). In that code path, after the status update, add: (1) retrieve the booking's `stripe_payment_intent_id`; (2) call `stripe.paymentIntents.capture(paymentIntentId)`; (3) on success, update `payment_status = 'captured'` and `completed_at = now()`; (4) on failure (Stripe error), set `payment_status = 'capture_failed'`, log a Sentry error with the booking ID and intent ID, and trigger an admin alert. Separately, verify that the `customer_confirmed_at` path (confirm-receipt button) is what drives the `completed` transition — if so, the capture call goes in that route handler (`src/app/api/bookings/[id]/confirm-receipt/route.ts`). Also check: when admin forces a booking to `completed`, the same capture path must fire. The `EA7` admin manual override item should be scoped to capture retry when automatic capture fails, not as the primary capture path.
- **Likely areas affected:** `src/app/api/bookings/[id]/confirm-receipt/route.ts`, `src/lib/data/bookings.ts` (updateBookingStatusForActor for completed transition), `src/lib/stripe/` (add a `capturePaymentIntent` helper), `src/app/api/payments/webhook/route.ts` (verify succeeded handler is correct after capture is wired)
- **Dependencies / open questions:** Confirm: is `completed` set by customer confirm-receipt, by admin, or by automatic trigger? The confirm-receipt route is the likely primary path. The admin path is a secondary recovery path (EA7). The automatic trigger (when carrier marks `delivered`) does NOT complete the booking — the customer must confirm receipt, which is correct per the status machine. Verify this is the actual flow in the codebase before wiring capture.
- **Edge cases / failure modes:** Stripe capture called on an already-expired authorization — returns a 402 error. Need to handle this and notify admin. Capture called twice (race condition between customer confirm + admin override) — Stripe returns `payment_intent already captured` error, which is safe to swallow. Customer confirms receipt but the Stripe API is down — booking moves to `completed` but payment stays `authorized`. Need a reconciliation job or admin alert. Capture succeeds but the DB update fails — payment is taken but booking shows wrong status. Wrap in a try-catch that retries the status update.
- **Acceptance criteria:** When a customer clicks "I received my item" on the confirm-receipt page, `stripe.paymentIntents.capture()` is called. The booking's `payment_status` changes to `captured`. The `payment_intent.succeeded` webhook fires from Stripe (async) and the handler correctly identifies it as already captured (idempotent). A test booking flow can be completed end-to-end with real Stripe test keys showing a captured charge. The admin payments page shows `payment_status = captured` for completed bookings.

---

### Carrier onboarding is not atomic — a carrier can exist without a vehicle

- **Priority:** P1
- **Stage:** Now
- **Type:** Product / Trust
- **Why this matters:** `upsertCarrierOnboarding()` in `src/lib/data/carriers.ts` does two sequential operations: (1) upsert the carrier row (sets `verification_status = 'submitted'`), (2) upsert the vehicle row. These are separate Supabase calls with no transaction wrapper. If the carrier upsert succeeds but the vehicle upsert fails (network error, validation failure, any Supabase error), the resulting state is: a carrier row exists with `verification_status = 'submitted'`, but no active vehicle. Downstream: (a) `createTripForCarrier` requires an active vehicle — the carrier cannot post trips, (b) the admin verification queue shows this carrier as submitted with documents but no vehicle, leading to confused verification, (c) the carrier's dashboard may show a broken state. This failure can happen silently — the user sees a success page after onboarding but their account is in a broken partial state.
- **What exactly needs to be done:** Wrap the carrier and vehicle upserts in a single Supabase RPC call that runs atomically in a database transaction. Create a new migration with a stored procedure `upsert_carrier_onboarding(carrier_data jsonb, vehicle_data jsonb)` that does both operations in one transaction. If either fails, both roll back. Alternatively, use `supabase.rpc('upsert_carrier_with_vehicle', {...})`. Update `upsertCarrierOnboarding()` to call this RPC instead of two separate calls. This follows the same pattern as `create_booking_atomic` (migration 011). Also add: a recovery path in the carrier onboarding page that detects the broken state (carrier row exists but no vehicle) and allows re-submission of just the vehicle data.
- **Likely areas affected:** New migration `supabase/migrations/015_atomic_carrier_onboarding.sql`, `src/lib/data/carriers.ts` (`upsertCarrierOnboarding` function), `src/app/(carrier)/carrier/onboarding/page.tsx` (add recovery state detection)
- **Dependencies / open questions:** Check if there are any existing carriers in the broken state (carrier row without vehicle). A one-time migration fix may be needed. Also check: the `carrier-onboarding-form.tsx` currently makes a single form submission — does it call `upsertCarrierOnboarding` directly or via an API route? Locate the actual call site before adding the RPC.
- **Edge cases / failure modes:** The onboarding form is submitted twice quickly (double-tap on mobile). The RPC must be idempotent — second call updates rather than fails. Admin forces a re-verification of a carrier — does that re-call this function? It should not; admin verification is a separate path.
- **Acceptance criteria:** Submitting the carrier onboarding form either results in both a carrier record and a vehicle record, or neither. No partial state is possible. `npm run check` passes. A test that simulates a vehicle upsert failure confirms the carrier row is also rolled back.

---

### Match score is computed differently in TypeScript and in the PostGIS RPC — results vary by geocoding availability

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Search
- **Why this matters:** Search has two code paths: (1) when Google Maps geocoding is available, it calls the `find_matching_listings` Supabase RPC which computes `match_score` in SQL using PostGIS distances; (2) when geocoding is unavailable (no API key, local dev), it calls `queryTripsByDateWindow` and then `scoreMatch()` in `src/lib/matching/score.ts`. These two paths compute `match_score` differently: the SQL RPC uses `(100.0 - least(cl.price_cents / 100.0, 100.0)) * 0.10` for price fit, while the TypeScript `scoreMatch()` uses `Math.max(0, (1 - priceCents / 30000) * 10)`. At a price of $100: SQL gives `(100 - 1.0) * 0.10 = 9.9`, TypeScript gives `(1 - 100/30000) * 10 = 9.97`. Close but not the same. More importantly: the SQL path uses real PostGIS `ST_Distance` for spatial scoring; the TypeScript path uses `estimateDistanceKm()` which is a string comparison (exact match = 1km, via-stop = 4km, no match = 16km). These formulas produce materially different rankings. A carrier who scores 85 on the RPC path might score 40 on the text fallback path.
- **What exactly needs to be done:** Decide on a canonical scoring formula and implement it in both places. Recommended approach: (1) keep the RPC formula as authoritative (it uses real distances); (2) update `score.ts` to match the RPC formula exactly, documented with a comment "must match find_matching_listings RPC scoring"; (3) add a unit test that asserts both formulas produce the same score for the same inputs (pickup 2km, dropoff 1.5km, rating 4.5, price $100 → expected score X). Also fix the ranking in the text-fallback path: `estimateDistanceKm` using suburb string matching is too coarse — use the suburb-coordinate lookup table (also needed for EP1 fix) to compute real km distances in the text-fallback path.
- **Likely areas affected:** `src/lib/matching/score.ts` (update price formula), `src/lib/__tests__/score.test.ts` (add formula-parity test), `supabase/migrations/013_p3_enhancements.sql` (note: read-only reference for the SQL formula), `src/lib/matching/rank.ts` (`estimateDistanceKm` replacement)
- **Dependencies / open questions:** The EP1 item (suburb coordinate lookup) is a dependency for fixing the text-fallback path. The score formula fix in TypeScript can be done independently of EP1. Verify: what is `score.ts` currently producing for the price component? Is it `Math.max(0, (1 - priceCents / 30000) * 10)` exactly? Read the file to confirm before writing the fix.
- **Acceptance criteria:** A unit test asserts that `scoreMatch({ pickupDistanceKm: 2, dropoffDistanceKm: 1.5, carrierRating: 4.5, priceCents: 10000 })` produces the exact same numeric result as the SQL formula applied to the same inputs. The `find_matching_listings` SQL formula is documented with a comment referencing `score.ts`. The text-fallback ranking path no longer uses string comparison for distance estimation.

---

### Duplicate migration sequence number 010 — two migrations share the same number

- **Priority:** P1
- **Stage:** Now
- **Type:** Ops / Infrastructure
- **Why this matters:** Both `010_capacity_recalculation.sql` and `010_saved_searches.sql` carry sequence number `010`. Supabase CLI applies migrations in alphabetical filename order. Since both start with `010_`, alphabetical order determines which runs first: `010_capacity_recalculation.sql` (c < s) runs before `010_saved_searches.sql`. This is currently not causing visible errors because the two migrations don't conflict — but: (1) it violates the sequential numbering convention used by every other migration; (2) if a future migration depends on the ordering of these two, the assumption could break; (3) if the migration ledger is ever replayed from scratch (new environment setup), the duplicate number creates confusion and potential for ordering mistakes; (4) `supabase db status` may show confusing output.
- **What exactly needs to be done:** Rename `010_saved_searches.sql` to `014_saved_searches.sql` (or whichever is the next available number after `013_p3_enhancements.sql`). Check: does any other migration reference `010_saved_searches` by name? If the migration has already been applied to the production database (likely yes), Supabase tracks applied migrations by filename — renaming will cause Supabase to treat it as a new migration and attempt to re-apply it. To avoid this: (1) create a new migration `014_rename_saved_searches_tracking.sql` that does nothing except document the rename; (2) in the Supabase `schema_migrations` table, manually update the record from `010_saved_searches` to `014_saved_searches` OR just document that the rename was done post-hoc and skip the DB record update since the tables already exist and the migration is idempotent. Check with `supabase migration status` before and after to confirm.
- **Likely areas affected:** `supabase/migrations/010_saved_searches.sql` (rename), `supabase/migrations/` (numbering audit), Supabase `schema_migrations` table (may need a manual update in production)
- **Dependencies / open questions:** This MUST be done carefully in production — renaming an applied migration filename can cause `supabase migration repair` to be needed. Do a dry run locally first: `supabase db reset` and confirm both migrations apply cleanly after the rename. Coordinate with any pending migration work that uses number `014` or beyond.
- **Acceptance criteria:** `supabase/migrations/` has no duplicate sequence numbers. `supabase migration status` shows all migrations as applied with no gaps or duplicates. `supabase db reset` in local dev applies all migrations cleanly in order.

---

### Admin has no individual booking detail page — BookingSupportPanel is unreachable

- **Priority:** P1
- **Stage:** Now
- **Type:** Ops / Admin
- **Why this matters:** `src/components/admin/admin-booking-support-panel.tsx` exists and shows booking details, status history, and manual ops actions. The admin bookings LIST page (`/admin/bookings`) exists. But there is no `/admin/bookings/[id]` page route — the component has no page to live in. The EA5 item references `src/app/(admin)/admin/bookings/[id]/page.tsx` as if it exists — it does not. This means: (1) admin cannot drill into an individual booking from the bookings list; (2) the manual override features planned in EA5 and EA7 have no UI surface to be added to; (3) when a customer contacts support about a booking reference (MVR-YYYY-NNNN), admin cannot look up that booking in the app — they'd need to query the database directly.
- **What exactly needs to be done:** Create `src/app/(admin)/admin/bookings/[id]/page.tsx`. This page should: (1) use `requirePageAdminUser()` for auth; (2) load the full booking by ID including all related records (listing, customer, carrier, events, payments, disputes, reviews); (3) render `AdminBookingSupportPanel` with the full booking data; (4) add a booking reference search input at the top of the `/admin/bookings` list page so admin can look up a booking by reference (MVR-YYYY-NNNN) without scrolling. The booking detail page is the surface for EA5 (manual override audit) and EA7 (manual payment capture) — those items cannot be implemented without this page existing first.
- **Likely areas affected:** New page `src/app/(admin)/admin/bookings/[id]/page.tsx`, `src/app/(admin)/admin/bookings/page.tsx` (add reference search input), `src/components/admin/admin-booking-support-panel.tsx` (may need props update), `src/lib/data/admin.ts` (add `getAdminBookingById` function)
- **Dependencies / open questions:** What data does `AdminBookingSupportPanel` currently expect as props? Read the component before building the page. The page needs a data loader that joins booking + listing + carrier + customer + booking_events. Use `createAdminClient()` for the query (RLS bypass needed for cross-user joins).
- **Acceptance criteria:** Navigating to `/admin/bookings/[booking-id]` shows the full booking detail. The admin bookings list links each booking row to its detail page. A booking reference search on the list page works. `npm run check` passes. EA5 and EA7 can reference this page as their target UI surface.

---

### No refund code exists — `payment_status.refunded` is an unreachable state

- **Priority:** P1
- **Stage:** Now
- **Type:** Payments / Trust
- **Why this matters:** The `payment_status` column includes `refunded` as a valid enum value. The booking schema has `cancellation_reason_code` and `cancelled_at`. The cancellation flow (booking moves to `cancelled`) is wired in the status machine. But there is no `stripe.refunds.create()` call anywhere in the codebase. When a booking is cancelled after authorization: (1) the Stripe payment authorization should be voided (for pre-capture: `stripe.paymentIntents.cancel()`); (2) if capture already happened: `stripe.refunds.create({ payment_intent: intentId })`; (3) if authorization never happened: nothing to do. Currently none of these calls exist. The result: cancelled bookings leave authorized card holds on customer accounts indefinitely until Stripe's authorization expires (7 days). If capture has somehow already run (after the P0 capture fix is implemented), cancellations never return money to the customer. This is a regulatory and trust issue.
- **What exactly needs to be done:** In the cancellation code path (wherever `status → cancelled` is handled in `updateBookingStatusForActor`), add payment handling based on current payment state: (1) `payment_status = 'pending'` — no Stripe action needed; (2) `payment_status = 'authorized'` — call `stripe.paymentIntents.cancel(intentId)` to void the hold; (3) `payment_status = 'captured'` — call `stripe.refunds.create({ payment_intent: intentId })` for a full refund; update `payment_status = 'refunded'`. (4) `payment_status = 'capture_failed'` or `failed` — no action. Add Sentry logging on all Stripe calls. The cancellation policy decision (FD-02) must be resolved first — it determines whether partial vs full refunds apply for late cancellations. For MVP: always void or fully refund.
- **Likely areas affected:** `src/lib/data/bookings.ts` (cancellation path in `updateBookingStatusForActor`), `src/lib/stripe/` (add `voidPaymentIntent` and `refundPaymentIntent` helpers), `src/app/api/payments/webhook/route.ts` (handle `charge.refunded` webhook event), `src/lib/email/` (add cancellation + refund email template)
- **Dependencies / open questions:** Resolve FD-02 (cancellation policy) before implementing. FD-02 is the founder decision item already in the backlog. The refund code should not be built until the policy is decided — otherwise the code will need to be changed immediately. However, the `stripe.paymentIntents.cancel()` path (for pre-capture voids) is unambiguously correct for MVP regardless of policy.
- **Acceptance criteria:** When a booking with `payment_status = 'authorized'` is cancelled, the Stripe authorization is voided within the same API request. When a booking with `payment_status = 'captured'` is cancelled, `stripe.refunds.create()` is called and `payment_status` updates to `refunded`. A test cancellation flow in Stripe test mode shows the authorization void or refund in the Stripe dashboard. The customer receives a cancellation + refund email.
