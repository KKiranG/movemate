# moverrr — Active Backlog

> Last refreshed: `2026-04-09` — backlog reconciled against the current local codebase and PR 21 verification pass
> Format governed by `TASK-RULES.md`. Work top-to-bottom within each priority level.
> Move completed items to `completed.md` — never mark done in this file.

---

## Product Guardrails (Read Before Touching Any Item)

- moverrr is a **need-first, match-ranked spare-capacity marketplace**. Not browse-first inventory, not dispatch, not removalist booking, not AI matching.
- Commission math in `src/lib/pricing/breakdown.ts` is frozen unless explicitly discussed.
- Mobile-first rules are non-negotiable: `min-h-[44px]`, `active:` alongside every `hover:`, `capture="environment"` on proof inputs, safe-area insets on fixed elements.
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

### EA — Admin and Ops Enhancements

### EQ — Code Quality and Test Coverage

- [ ] **EQ5** — WCAG 2.1 AA audit and remediation
  - **File(s):** `src/components/**`, `src/app/**`
  - **What:** Run an automated accessibility audit and remediate Level AA issues across browse, booking, and carrier posting flows.
  - **Why:** Accessibility gaps are user-experience gaps on iPhone too, and they compound quickly once more UI ships.
  - **Done when:** Automated audit reports zero AA violations on the search, booking, and carrier-posting flows.

- [ ] **EQ7** — `booking-form.tsx` and `carrier-trip-wizard.tsx` form state tests
  - **File(s):** `new file: src/components/booking/__tests__/booking-form.test.tsx`, `new file: src/components/carrier/__tests__/carrier-trip-wizard.test.tsx`
  - **What:** Add unit tests covering: draft persistence/restoration, payment retry state, file upload with WebP/HEIC, form disable during submission, step validation blocking, and options-adjusted price updates.
  - **Why:** Both forms are the highest-traffic, highest-impact components and have zero test coverage today.
  - **Done when:** Tests pass and cover all states enumerated above, with `npm run check` clean.

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

- [ ] **X2** — Live Sentry source-map verification after repo wiring
  - **File(s):** `src/lib/sentry.ts`, `next.config.js`, `sentry.server.config.ts`, `sentry.client.config.ts`
  - **What:** The repo-side `@sentry/nextjs` wiring and source-map upload config now exist. The remaining step is a real build/deploy verification against a configured Sentry org/project so uploaded source maps and readable stack traces are proven in production or preview.
  - **Why:** Local config is not the same as an actually readable production stack trace.
  - **Done when:** A deployed test error resolves to readable application stack traces in Sentry with the configured release metadata.

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

- [ ] **ET11** — Booking price breakdown consistency across all views
  - **File(s):** `src/components/booking/booking-checkout-panel.tsx`, `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(admin)/admin/bookings/[id]/page.tsx`, `src/components/trip/trip-card.tsx`
  - **What:** Ensure every surface uses the same breakdown function from `src/lib/pricing/breakdown.ts`. Audit and replace any inline pricing math on any surface with a call to the canonical function.
  - **Why:** Inconsistent pricing across views creates confusion and support tickets. One canonical source eliminates drift.
  - **Done when:** All surfaces produce identical breakdowns for the same booking. No surface has inline pricing math. `npm run check` passes.

- [ ] **ET13** — Audit and rewrite vague trust copy to evidence-led language sitewide
  - **File(s):** marketing pages, `src/app/(customer)/trip/[id]/page.tsx`, checkout copy, site header copy
  - **What:** `/trust` now exists and the touched booking/search surfaces use more concrete payment and dispute language. The remaining work is a full sweep across untouched marketing and customer pages to replace generic trust claims with specific evidence-led copy.
  - **Why:** Vague corporate trust claims read as marketing noise. Specific, factual statements build real confidence — especially for first-time users.
  - **Done when:** No customer-facing page uses generic trust claims without concrete backing. Copy changes are documented.

---

## ⚪ After MVP / Deferred

*Explicitly out of the MVP queue. Keep these one-line, separated from launch work, and do not pull them into active delivery without a fresh prioritization pass.*

- [ ] **P4-01** — LLM item classification from customer photo or description
- [ ] **P4-02** — Fixed price per item category (sofa, fridge, etc.) instead of carrier-set price
- [ ] **P4-03** — Percentage-based booking fee (3%) replacing the flat $5 — review after 50+ jobs
- [ ] **P4-04** — In-app messaging between carrier and customer
- [ ] **P4-05** — Interactive map view of active listings (pins on a map)
- [ ] **P4-06** — Live GPS tracking of carrier on trip day
- [ ] **P4-07** — Bounded counter-offer flow for spare-capacity bookings
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

### Stripe Connect Express onboarding now exists, but still needs real-env verification

- **Priority:** P0
- **Stage:** Now
- **Type:** Product / Payments
- **Why this matters:** The repo now has Express account creation/resume, return handling, carrier CTAs, and `account.updated` syncing. The remaining risk is environment truth: Connect capability, return URLs, and webhook delivery all need a real preview/production verification pass before payouts are trusted operationally.
- **What exactly needs to be done:** Run a real carrier through `/api/carrier/stripe/connect-start`, complete Stripe onboarding, confirm the return route updates `stripe_onboarding_complete`, confirm `account.updated` webhook delivery, and verify the already-landed admin payment capture flow still matches the connected-account payout policy for MVP.
- **Likely areas affected:** `src/app/api/carrier/stripe/` (new files), `src/app/(carrier)/carrier/payouts/page.tsx`, `src/app/(carrier)/carrier/onboarding/page.tsx`, `src/lib/stripe/` (new connect helpers), `src/app/api/payments/webhook/route.ts` (add account.updated handler), `supabase/migrations/` (no schema change needed, columns exist)
- **Dependencies / open questions:** STRIPE_SECRET_KEY plus Connect capabilities must be enabled in the target env, and the webhook endpoint must actually receive Connect account events.
- **Edge cases / failure modes:** Carrier abandons onboarding and resumes later, Stripe restricts an already-created account, or the return path succeeds but webhook delivery lags and temporarily shows stale status.
- **Acceptance criteria:** A real carrier can complete the hosted Stripe Connect flow end-to-end and the payout dashboard reflects the completed setup without manual DB intervention.

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

### Email templates are upgraded, but live inbox QA still remains

- **Priority:** P1
- **Stage:** Now
- **Type:** Product / Trust
- **Why this matters:** The shared branded template layer is now in place and the booking/admin/dispute flows no longer rely on bare inline HTML. The remaining risk is client rendering quality and live deliverability, not repo-side template structure.
- **What exactly needs to be done:** Send the new branded templates through real Gmail/Apple Mail inboxes, verify previews and CTA rendering, and tighten any client-specific spacing or clipping defects that only show up in real inboxes.
- **Likely areas affected:** New dir `src/lib/email/`, `src/lib/data/bookings.ts` (update calls), `src/lib/data/admin.ts` (update calls), `src/lib/data/feedback.ts` (update calls)
- **Dependencies / open questions:** No external dependency needed — pure function returning HTML string is enough for MVP. Resend domain must be verified first (X3 in existing backlog). Decide: should each status transition have a different subject line and body? Current code has a `subjectByStatus` map — what's in it? Verify which statuses get emails.
- **Edge cases / failure modes:** HTML renders differently across email clients (Gmail, Apple Mail, Outlook). Avoid complex CSS. Test with a tool like Litmus or by sending real test emails. The `to` address may be null if env is not configured — already handled by graceful degradation.
- **Acceptance criteria:** Real inbox checks confirm the branded templates render cleanly on mobile clients without clipping, broken CTA buttons, or unreadable copy.

---

### Lifecycle email gaps are narrower, but scheduled reminders still need wiring

- **Priority:** P1
- **Stage:** Now
- **Type:** Product / Trust
- **Why this matters:** Verification approved/rejected emails, review-request emails, and customer delivery-confirmed emails now exist. The remaining gap is scheduled reminder infrastructure rather than zero lifecycle coverage.
- **What exactly needs to be done:** Wire trip-day and delivery reminder scheduling to the chosen cron/runtime path, dedupe reminder sends, and verify the reminder copy against real booking timelines.
- **Likely areas affected:** `src/app/api/admin/carriers/[id]/verify/route.ts`, `src/lib/data/bookings.ts` (status update handler), new file `src/app/api/cron/trip-day-reminders/route.ts`, `src/lib/email/` (new templates for each type), `vercel.json` (add cron entry for daily reminders)
- **Dependencies / open questions:** Trip-day reminders require the cron infrastructure (depends on the expired-bookings cron item above). Email domain must be verified (X3). Do we send review requests to both customer and carrier or just customer?
- **Edge cases / failure modes:** Booking confirmed → delivered → carrier doesn't trigger completed → no review request fires. Cover this by also sending the review request when `completed_at` is set (not just on the status transition). A carrier with multiple bookings on trip day gets one reminder per booking — is that too many emails? For MVP, one per booking is fine. Rate limit the daily reminder cron to not resend if already sent within 12 hours.
- **Acceptance criteria:** Daily reminders send automatically for eligible bookings without duplicate reminder spam, while the already-landed verification/review/delivery emails continue to dedupe correctly.

---

### Admin carrier detail is now live, but verification-history depth can still improve

- **Priority:** P1
- **Stage:** Now
- **Type:** Ops / Trust
- **Why this matters:** The admin detail page, document links, internal notes/tags, required rejection reason, and queue deep-links now exist. The remaining gap is richer historical context rather than blind verification.
- **What exactly needs to be done:** Extend the detail page with deeper verification-history records and any document-renewal warnings that ops decides are still missing after live usage.
- **Likely areas affected:** New page `src/app/(admin)/admin/carriers/[id]/page.tsx`, new API route `src/app/api/admin/carriers/[id]/route.ts` (likely needs to be created as a page route, not API), `src/components/admin/` (new carrier detail components), `src/lib/data/carriers.ts` (add `getAdminCarrierById` function), update `src/components/admin/verification-queue.tsx` to link to detail page
- **Dependencies / open questions:** Private storage bucket access — the admin must be able to see the carrier's document photos. The existing storage RLS policy allows admin to read any object. Verify the signed URL generation works for admin views.
- **Edge cases / failure modes:** Admin approves a carrier whose insurance has expired (licence_expiry_date < today). Should the approve button warn about expired documents? Yes — add a visual warning on the approve button when documents are near-expiry or expired.
- **Acceptance criteria:** Ops can audit the full verification timeline, not just the current document/state snapshot.

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

### Search cards now explain route fit, but fallback consistency still needs QA

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Customer trust
- **Why this matters:** Browse cards now show plain-language route-fit labels and real distance cues when spatial data exists. The remaining product risk is inconsistency on fallback or low-signal searches where those cues are absent, making some result sets feel richer than others.
- **What exactly needs to be done:** QA the browse card across spatial, fallback, and flexible-date result sets. Add a graceful fallback explanation when exact pickup/dropoff distances are unavailable so cards never regress into feeling opaque again.
- **Likely areas affected:** `src/components/trip/trip-card.tsx`, `src/types/trip.ts` (TripSearchResult already has matchScore + scoreBreakdown), `src/app/(customer)/search/page.tsx`
- **Dependencies / open questions:** The current card suppresses distance cues when the fallback path cannot produce truthful kilometre values. Decide whether that should remain silent or be replaced by a softer route-fit explanation.
- **Edge cases / failure modes:** Flexible-date grouped results may mix cards with exact spatial cues and cards with only route-fit labels, which can feel uneven if the copy hierarchy is not deliberate.
- **Acceptance criteria:** Result cards remain legible and trustworthy across both spatial and fallback searches, and mobile QA confirms the fit cue still reads clearly at `375px`.

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

### Price guidance is maps-backed now, but live-corridor quality still needs QA

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Carrier experience
- **Why this matters:** The guidance path now uses maps-backed corridor proximity and an intercity price floor instead of suburb-name heuristics, but the remaining risk is market-truth quality: thin samples, weak launch corridors, or missing maps env can still produce less-helpful guidance than the strongest routes.
- **What exactly needs to be done:** Run route-level QA on the launch corridors, confirm the carrier posting wizard keeps showing sensible ranges when maps env is present, and tighten fallback messaging when sample size is too weak to anchor pricing confidently.
- **Likely areas affected:** `src/app/api/trips/price-guidance/route.ts`, `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/data/listings.ts`
- **Dependencies / open questions:** Launch-corridor density and real production sample size still determine how useful the guidance feels in practice.
- **Acceptance criteria:** The pricing step shows believable guidance on the launch corridors, weak-sample routes degrade cleanly, and no misleading pseudo-precision is shown when maps-backed evidence is thin.

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
- **Why this matters:** The MVP code path now assumes a simple policy: cancellations void uncaptured authorizations or refund captured payments in full. The remaining founder question is whether moverrr wants anything stricter than that once the launch trust loop is proven.
- **What exactly needs to be done:** Confirm the current MVP policy in writing: full void or full refund, no cancellation fees, no carrier compensation before a more mature policy exists. If the founder wants late-cancellation fees or partial refunds later, define the exact matrix and move that work into a separate post-MVP implementation item instead of leaving the MVP policy ambiguous.
- **Likely areas affected:** `src/lib/data/bookings.ts` (cancellation path), `src/lib/email/` (cancellation copy), `src/components/booking/booking-checkout-panel.tsx` (cancellation policy copy)
- **Dependencies / open questions:** None — founder decision.
- **Acceptance criteria:** The written MVP policy is recorded in `.agent-skills/PAYMENTS.md`, and any future late-cancellation penalties are explicitly deferred instead of implied.

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

### No-result search recovery is stronger, but adjacent-route suggestions still need work

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Demand
- **Why this matters:** The search page now explains the gap, keeps save-search as the primary recovery CTA, and offers nearby-date or broader-corridor escape hatches. The missing piece is better adjacent-route recovery when there is no exact or nearby-date supply.
- **What exactly needs to be done:** Add a secondary recovery query that can suggest close corridor alternatives, not just nearby dates or broader item-category results, and verify the hierarchy still keeps save-search as the main action.
- **Likely areas affected:** `src/app/(customer)/search/page.tsx`, `src/components/search/save-search-form.tsx`, `src/components/customer/waitlist-form.tsx`
- **Dependencies / open questions:** Decide whether “nearby” should bias origin suburb, destination suburb, or a corridor-level match once route density improves.
- **Acceptance criteria:** No-result search still prioritizes save-search, and when exact matches are missing it can suggest at least one useful adjacent-route recovery path without cluttering the mobile layout.

---

### Booking reference now appears immediately, but cross-surface consistency still needs a QA sweep

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Trust
- **Why this matters:** The booking form now exposes the reference before redirecting. The remaining work is QA consistency across success state, detail page, and delivered emails in real user journeys.
- **What exactly needs to be done:** Verify the same reference format stays visible and identical across checkout success, booking detail, and the branded email templates in a live booking run.
- **Likely areas affected:** `src/components/booking/booking-checkout-panel.tsx`, `src/app/(customer)/bookings/[id]/page.tsx`
- **Acceptance criteria:** The same booking reference is immediately visible at checkout success and matches the detail page plus email record for the same booking.

---

## Moverrr — Trust, Payments, and Operations

> Items that protect the money flow, build trust, and ensure ops clarity during MVP.

---

## Moverrr — Marketplace Logic and Search

> Items that improve the core matching and browse experience.

---

### Maps-first search is live, but degraded fallback coverage still needs expansion

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Search
- **Why this matters:** Google Maps is now the production source of truth for suburb resolution and route relevance, which closes the worst `ilike` mismatch class. The remaining risk sits in degraded mode: missing-env/local fallback still depends on the curated Sydney suburb map, so suburbs outside the launch corridors can degrade less gracefully than the strongest routes.
- **What exactly needs to be done:** Expand the curated suburb coordinate map, add regression cases for near-name suburbs and adjacent corridors, and document exactly which degraded fallback paths are still coordinate-backed versus heuristic.
- **Likely areas affected:** `src/lib/data/trips.ts`, `src/lib/maps/sydney-suburb-coords.ts`, search-ranking tests
- **Acceptance criteria:** The degraded fallback covers the launch corridors plus common adjacent Sydney suburbs, and regression tests catch false-equivalence cases such as similarly named suburbs.

---

## Agentic Development System — Infrastructure Backlog

> Most of this lane shipped on `2026-04-09`. Only intentionally deferred runtime-team work remains active below.

> Added: `2026-04-08` — based on review of Claude Code best practices (subagents, skills, hooks, agent teams, session management, context discipline).
> These items upgrade how AI agents are configured, equipped, and constrained in this repo. They are NOT product features — they are operating system improvements.
> Each item is written with enough precision that an AI agent can implement it without needing further clarification.
> Work these in order within each category, as later items often depend on earlier foundations.

---

### AG-T — Agent Teams Configuration
*Still intentionally deferred until the runtime semantics are proven locally.*

- [ ] **AG-T1** — Enable experimental agent teams in project settings
  - **File(s):** `.claude/settings.json`, `.claude/agents.md`
  - **What:** Add the project env flag and document when teams beat simple subagents.
  - **Why:** The repo role map could support teams, but earlier PRs deliberately avoided enabling unverified runtime features.
  - **Done when:** Agent teams are locally verified and documented.

- [ ] **AG-T2** — Add agent-team quality hooks
  - **File(s):** `.claude/settings.json`, new scripts under `.claude/scripts/`
  - **What:** Add teammate-idle and task-completed quality gates once team events are available locally.
  - **Why:** Team review quality should be structural, not ceremonial.
  - **Done when:** Low-evidence team outputs are blocked automatically.

## Agent Operating System — Rule Files, Docs & OS Meta-Tasks

> Remaining meta-work after the 2026-04-09 operating-system cleanup. Shipped rule files, the experiment ledger, and the capability index were removed from active backlog because they already exist in the repo.

---

### EO — Operating System Tasks

No active EO items remain after the 2026-04-09 docs, hooks, and verification-template sweep.

## Moverrr — Critical Gaps Found in Deep Repo Review

> Added: `2026-04-08` — findings from a full codebase survey that go beyond what was already in the backlog. Each item below was verified by reading the actual code, not inferred. These are not wishlist items — they are holes in the current implementation.

---

### Degraded fallback ranking still needs formula parity with the RPC path

- **Priority:** P2
- **Stage:** Pre-MVP
- **Type:** Product / Search
- **Why this matters:** Production search is now maps-first, which removes the worst ranking drift from real user traffic. The remaining gap lives in degraded mode: local or missing-env fallback still relies on a TypeScript scoring path that is not guaranteed to match the RPC formula exactly.
- **What exactly needs to be done:** Make the RPC formula the documented source of truth, align `score.ts` numerically with it, and add a parity test so degraded fallback ranking cannot silently drift away from the production path again.
- **Likely areas affected:** `src/lib/matching/score.ts` (update price formula), `src/lib/__tests__/score.test.ts` (add formula-parity test), `supabase/migrations/013_p3_enhancements.sql` (note: read-only reference for the SQL formula), `src/lib/matching/rank.ts` (`estimateDistanceKm` replacement)
- **Dependencies / open questions:** The EP1 item (suburb coordinate lookup) is a dependency for fixing the text-fallback path. The score formula fix in TypeScript can be done independently of EP1. Verify: what is `score.ts` currently producing for the price component? Is it `Math.max(0, (1 - priceCents / 30000) * 10)` exactly? Read the file to confirm before writing the fix.
- **Acceptance criteria:** A unit test asserts that the degraded `score.ts` path produces the same numeric result as the RPC formula for the same inputs, and the fallback ranking path is documented as a degraded mirror of the production search contract.

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
