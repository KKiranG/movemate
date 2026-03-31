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

- [ ] **A1** — Server-side pending booking expiry runner
  - **File(s):** `supabase/functions/expire-bookings/index.ts`, `src/lib/data/bookings.ts`
  - **What:** Scheduled job that finds `pending` bookings older than 2 hours, cancels them with an expiry reason, writes `booking_events`, restores listing capacity, and sends notifications to both parties.
  - **Why:** Without auto-expiry, inventory stays locked and carriers have no reliable window to plan, making the supply side feel untrustworthy.
  - **Done when:** No `pending` booking can remain older than 2 hours without an admin-override audit trail; capacity is restored and both parties are emailed.

- [ ] **A2** — Payment-intent creation idempotency
  - **File(s):** `src/app/api/payments/create-intent/route.ts`, `src/lib/data/bookings.ts`
  - **What:** Reuse an existing compatible Stripe intent for a given booking instead of creating a new one on each retry, using booking ID as the idempotency key.
  - **Why:** Mobile payment flows retry constantly; duplicate intents create unresolvable billing confusion and make disputes impossible to close cleanly.
  - **Done when:** Repeated payment-setup retries for one booking resolve to one authoritative Stripe payment intent.

- [ ] **A3** — Booking creation idempotency keys
  - **File(s):** `src/app/api/bookings/route.ts`, `src/lib/data/bookings.ts`
  - **What:** Accept a client-generated idempotency key header; return the existing booking result on duplicate submits within a 24-hour window.
  - **Why:** Double-taps and mobile retries must never create two bookings for the same customer intent, even with the atomic RPC protecting capacity.
  - **Done when:** Identical booking POST from the same client action returns the same booking without creating a second record.

- [ ] **A4** — Duplicate transactional email suppression
  - **File(s):** `src/lib/notifications.ts`, `src/lib/data/bookings.ts`
  - **What:** Track sent emails per (booking_id, email_type, status) and skip the send if already dispatched within a safe dedup window.
  - **Why:** Webhook retries and lifecycle retries can send duplicate confirmation or receipt emails, which destroys trust faster than a missing email would.
  - **Done when:** Transient retries on booking events cannot cause duplicate customer or carrier lifecycle emails.

- [ ] **A5** — Booking reference number generation
  - **File(s):** `src/lib/data/bookings.ts`, `supabase/migrations/` (new column), all email templates
  - **What:** Generate a short human-readable reference (e.g. `MVR-2026-0421`) at booking creation and surface it in receipts, emails, booking detail, and admin views.
  - **Why:** Support cannot function with raw UUIDs; a short reference is the minimum needed to field calls and resolve disputes without a full admin console.
  - **Done when:** Every booking has a short reference visible in the UI, emails, and admin views; support can find a booking by reference.

---

## 🟠 P1 — User-Facing Bugs

*Broken flows, wrong data shown, crashes, or interactions that block completion.*

- [ ] **B1** — Return / backload flag on listings
  - **File(s):** `supabase/migrations/` (new column `is_return_trip`), `src/lib/validation/trip.ts`, `src/components/carrier/carrier-trip-wizard.tsx`, `src/components/trip/trip-card.tsx`, `src/app/(customer)/search/page.tsx`
  - **What:** Add a boolean `is_return_trip` to `capacity_listings`; surface it as a toggle in the carrier wizard, a chip on browse cards, and a filter in search.
  - **Why:** Return/backload trips are the highest-value inventory type — carriers price them low, customers see real savings — but the platform currently cannot distinguish them from one-way hauls.
  - **Done when:** Carriers can flag a return leg, customers can filter for backloads, and the card shows a "Return trip" chip with savings context.

- [ ] **B2** — Payment failure recovery surface on booking detail
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/components/booking/booking-form.tsx`
  - **What:** When payment intent status is `requires_payment_method`, show a clear recovery card with the specific Stripe decline reason and a retry action — not a generic error.
  - **Why:** Customers who see a generic error assume the booking is gone and rebook from scratch, creating support load and abandoned inventory.
  - **Done when:** A failed authorization shows an actionable retry card with the specific decline reason (card declined, insufficient funds, etc.) and the booking remains in a retryable state.

- [ ] **B3** — Proof upload preview and remove-before-submit
  - **File(s):** `src/components/booking/status-update-actions.tsx`, `src/components/booking/dispute-form.tsx`
  - **What:** Show a thumbnail preview, filename, and file size after selection, with a remove/replace action before the status submit fires.
  - **Why:** Proof uploads are legally significant; submitting the wrong image is a support incident that cannot be undone without admin intervention.
  - **Done when:** No proof upload is submitted without the carrier or customer seeing a preview of exactly what they are attaching.

- [ ] **B4** — HEIC/HEIF proof normalization
  - **File(s):** `src/app/api/upload/route.ts`, `src/lib/supabase/storage.ts` (or similar)
  - **What:** After a HEIC/HEIF upload succeeds, convert or flag for display so the image renders in admin and customer-facing proof views rather than showing a broken thumbnail.
  - **Why:** iPhone camera defaults to HEIC; allowed at upload but currently breaks proof gallery rendering on the ops side, making dispute resolution harder.
  - **Done when:** Proof photos from iPhone never appear as "uploaded but not viewable" in admin or booking detail.

- [ ] **B5** — Trip edit dirty-state protection
  - **File(s):** `src/app/(carrier)/carrier/trips/[id]/page.tsx`, trip edit form component
  - **What:** Detect unsaved form state and show a browser-native `beforeunload` warning plus an in-page "Discard changes?" dialog before navigation.
  - **Why:** Carriers lose trip edits by accidentally tapping the back button — especially on iPhone where gesture navigation is the default.
  - **Done when:** Navigating away from an unsaved trip edit requires explicit confirmation.

- [ ] **B6** — Auth session auto-refresh for long forms
  - **File(s):** `src/hooks/useAuthRefresh.ts` (new), `src/app/layout.tsx` or a client wrapper
  - **What:** Call `supabase.auth.startAutoRefresh()` on mount in a client component wrapping the app layout and `stopAutoRefresh()` on unmount.
  - **Why:** JWT expires during multi-step carrier onboarding or long booking flows on mobile; the user gets a silent 401 and loses all form state.
  - **Done when:** Long-form sessions on mobile do not silently expire mid-flow; `npm run check` passes.

- [ ] **B7** — Structured cancellation reason taxonomy
  - **File(s):** `src/lib/validation/booking.ts`, booking cancellation form/modal, DB (new column or enum), email templates
  - **What:** Replace free-text cancellation notes with a controlled set of reasons (carrier unavailable, customer changed plans, payment failed, no response, safety concern) plus optional notes.
  - **Why:** Free-text reasons are unactionable for analytics and policy; structured reasons let ops quickly identify systemic problems.
  - **Done when:** Cancellation form uses a dropdown from the approved set; reason is stored and visible in admin booking view.

- [ ] **B8** — Delivery confirmation reminder loop
  - **File(s):** `supabase/functions/delivery-reminders/index.ts` (new), email templates, booking event types
  - **What:** After a booking reaches `delivered` status, send reminder emails at +2h and +24h if the customer has not confirmed receipt or raised a dispute.
  - **Why:** Without reminders, delivered bookings stall in `delivered` indefinitely, holding carrier payouts and obscuring true completion rates.
  - **Done when:** Delivered bookings without customer confirmation receive two escalating reminders; funds are not held indefinitely.

- [ ] **B9** — Booking status/payment state parity audit
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(carrier)/carrier/bookings/[id]/page.tsx`, admin booking views
  - **What:** Audit every place booking status is shown to pair it with the correct payment-state explanation, especially for pending, failed, cancelled, and disputed.
  - **Why:** Showing "Booking confirmed" when payment is still pending or failed creates serious trust failures on first use.
  - **Done when:** No booking status shown to any user contradicts the true payment state.

- [ ] **B10** — Distinguish cancelled authorization vs refunded capture
  - **File(s):** `src/lib/data/bookings.ts`, `src/app/api/payments/webhook/route.ts`, admin booking view
  - **What:** Split `cancelled` payment flows into `authorization_cancelled` (never captured) and `refunded` (captured and returned) as separate tracked states.
  - **Why:** Support cannot answer "was I charged?" without knowing whether money moved; this is also needed for Stripe reconciliation.
  - **Done when:** Support can determine from first-party data whether money was captured and returned, or never taken, within two clicks.

- [ ] **B11** — Onboarding autosave and resume
  - **File(s):** `src/components/carrier/carrier-onboarding-form.tsx`
  - **What:** Autosave incomplete onboarding form state to `localStorage` and restore it on return with an explicit "Resume your application" banner.
  - **Why:** Mobile onboarding gets interrupted by calls, camera use, and app switching; starting from scratch kills carrier activation rates.
  - **Done when:** Returning carriers see their previous inputs pre-filled with an option to resume or start fresh.

- [ ] **B12** — Dispute intake guided by category
  - **File(s):** `src/components/booking/dispute-form.tsx`, `src/lib/validation/booking.ts`
  - **What:** After the user selects a dispute category (damage, no-show, timing, wrong items), show tailored prompts and evidence requirements specific to that category.
  - **Why:** Generic dispute forms produce vague submissions that require 2–3 follow-up messages before ops can act.
  - **Done when:** Each category shows relevant evidence prompts; dispute data has enough detail for first-contact resolution in most cases.

- [ ] **B13** — 404 pages for trip detail and booking detail
  - **File(s):** `src/app/(customer)/trip/[id]/not-found.tsx`, `src/app/(customer)/bookings/[id]/not-found.tsx`
  - **What:** Replace blank or broken states for deleted/unauthorized resources with a deliberate not-found page and recovery CTAs.
  - **Why:** Links to expired trips are shared by carriers and customers; a blank page looks like a bug and destroys confidence.
  - **Done when:** Accessing a deleted trip shows "This trip is no longer available" with a search CTA; accessing someone else's booking shows an appropriate message.

- [ ] **B14** — Post-trip success screen (not just redirect)
  - **File(s):** `src/app/(carrier)/carrier/post/page.tsx`, `src/components/carrier/carrier-trip-wizard.tsx`
  - **What:** After successful trip posting, show a dedicated success state with next actions (go to dashboard, post another, share link) before any redirect.
  - **Why:** A bare redirect after posting feels like nothing happened; a success screen reinforces the action and reduces "did it work?" support contacts.
  - **Done when:** Posting a trip ends in a visible confirmation screen with at least two clear next-step actions.

- [ ] **B15** — Search geocoding failure fallback with user message
  - **File(s):** `src/app/api/search/route.ts`, `src/app/(customer)/search/page.tsx`
  - **What:** When PostGIS geocoding fails, return `{ results: [], geocodingAvailable: false }` and render a clear banner instead of an empty results page.
  - **Why:** Silent geocoding failures look like no supply exists; customers abandon thinking the product is empty when it is actually a backend error.
  - **Done when:** Geocoding failures show a user-friendly message distinguishing "no results for your search" from "we have a location lookup issue."

---

## 🟡 P2 — UX & Conversion

*Directly affects carrier posting rate or customer booking rate. Sub-sections: carrier supply, customer demand.*

### Carrier Supply Velocity

- [ ] **C1** — Sticky mobile footer for carrier wizard
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/app/globals.css`
  - **What:** Move wizard navigation (Back / Next / Save) into a sticky footer with `pb-[env(safe-area-inset-bottom)]` padding so controls stay reachable without scrolling.
  - **Why:** On iPhone the Back/Next buttons fall below the viewport on Step 2+ of the posting wizard, forcing carriers to scroll just to advance.
  - **Done when:** Wizard controls are always visible and tappable at 375px viewport height without scrolling; all buttons meet 44px minimum.

- [ ] **C2** — Carrier remaining tap-target audit
  - **File(s):** `src/app/(carrier)/carrier/**`, `src/components/carrier/**`
  - **What:** Audit every carrier-facing CTA, link, icon action, and segmented control for `min-h-[44px] min-w-[44px]` compliance and add `active:` states where missing.
  - **Why:** Undersized targets on the supply side create friction for repeat posting, which is the single most important retention loop.
  - **Done when:** `grep -r "hover:" src/components/carrier` shows no `hover:` class without a matching `active:` sibling; element inspector confirms 44px minimums.

- [ ] **C3** — Onboarding document preview before submit
  - **File(s):** `src/components/carrier/carrier-onboarding-form.tsx`
  - **What:** Show previews for uploaded licence and insurance files with replace/remove actions before final onboarding submission.
  - **Why:** Carriers cannot discover blurry or wrong documents until admin rejects them; preview-before-submit prevents the main rejection reason.
  - **Done when:** Both onboarding uploads show a thumbnail or PDF icon preview with a "Replace" action before the form is submitted.

- [ ] **C4** — Verification blockers explanation card
  - **File(s):** `src/components/carrier/carrier-onboarding-form.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`
  - **What:** After onboarding submission, show a plain-language card listing exactly what is missing or rejected and what the carrier should do next.
  - **Why:** "Under review" with no detail causes carriers to abandon the platform assuming rejection; clarity drives completion.
  - **Done when:** Carriers with pending or rejected verification see specific next steps, not just a generic "under review" state.

- [ ] **C5** — Price suggestion rationale panel
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/data/listings.ts`
  - **What:** In Step 3 of the wizard, show "Similar Sydney jobs: $X–$Y" using real `capacity_listings` price data for the route, with a brief explanation of how spare-capacity pricing compares to a dedicated truck.
  - **Why:** Carriers under-price out of uncertainty or over-price out of habit; market-data context drives better supply quality and faster bookings.
  - **Done when:** Step 3 shows a live price range from real listing data with ≥5 examples; if insufficient data, falls back to a helpful static range.

- [ ] **C6** — Detour radius guidance and presets
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`
  - **What:** Replace the bare detour radius input with labeled presets (e.g. "2km — tight route", "5km — flexible", "10km — open to detours") plus helper text explaining how detour radius affects match quality.
  - **Why:** Most carriers do not understand what detour radius means; leaving it blank or entering a wrong value silently reduces match quality.
  - **Done when:** Carriers set detour radius using a preset or input with clear impact explanation; no carrier should be confused about what the field does.

- [ ] **C7** — Special notes preset chips
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`
  - **What:** Add tappable preset chips for common notes (tail-lift unavailable, apartment access OK, marketplace pickup friendly, weekdays only, fragile items only) that append text to the notes field.
  - **Why:** Carriers repeat the same handling notes across many trips; chips reduce typing friction and improve note consistency.
  - **Done when:** At least 6 preset chips are available; each inserts clean text into the notes field without replacing existing content.

- [ ] **C8** — Trip expiry reminder sequence
  - **File(s):** `supabase/functions/trip-expiry-reminders/index.ts` (new), carrier email templates
  - **What:** Send a reminder email 48h before a listing expires with a direct "Repost this route" CTA that links to the quick-post template or re-post flow.
  - **Why:** Expired inventory is a silent retention failure; carriers who get a nudge repost at much higher rates than those who don't.
  - **Done when:** Listings expiring within 48 hours trigger a carrier email with a direct repost link; templates land correctly in Resend.

- [ ] **C9** — Carrier payout line item on booking detail
  - **File(s):** `src/app/(carrier)/carrier/bookings/[id]/page.tsx` (or booking detail component)
  - **What:** Show the carrier's exact payout (base + add-ons − 15% commission) as a line-item breakdown on the booking detail page, consistent with `calculateBookingBreakdown()`.
  - **Why:** Carriers trust the platform more when they can see the math; hidden commission creates resentment and churn.
  - **Done when:** Booking detail shows carrier payout, base fare, add-ons, and commission amount in a clear breakdown matching the formula in `breakdown.ts`.

- [ ] **C10** — Carrier payouts dashboard
  - **File(s):** `src/app/(carrier)/carrier/payouts/page.tsx` (new), `src/lib/data/bookings.ts`
  - **What:** Add a payouts tab showing upcoming expected payout, completed-but-unreleased earnings, refunded jobs, and a historical payout record by month.
  - **Why:** Earnings transparency is a core retention lever; carriers who can see their income pipeline are far less likely to switch to direct channels.
  - **Done when:** Carriers can answer "what have I earned and what is still pending?" from a single screen without contacting support.

- [ ] **C11** — Carrier performance metrics page
  - **File(s):** `src/app/(carrier)/carrier/stats/page.tsx` (new), `src/lib/data/bookings.ts`
  - **What:** Show acceptance rate, completion rate, average rating, dispute count, and repeat-route usage for the authenticated carrier.
  - **Why:** Carriers want to improve but have no feedback loop today; visible metrics drive quality behaviors.
  - **Done when:** Carrier stats page loads with real aggregated data and includes helpful context (e.g. "industry average: 85% acceptance").

- [ ] **C12** — Template management hardening
  - **File(s):** `src/app/(carrier)/carrier/templates/page.tsx`, `src/lib/data/templates.ts`, `src/app/api/trips/templates/**`
  - **What:** Add rename, archive, delete, and duplicate actions to the templates list so carriers can manage their route library without accumulating stale entries.
  - **Why:** Templates are only useful if they stay organized; without management tools, the template list becomes noise after a few months.
  - **Done when:** Carriers can rename, archive, delete, and duplicate templates; archived templates do not appear in the quick-post surface.

- [ ] **C13** — Licence and insurance expiry reminders
  - **File(s):** `supabase/migrations/` (expiry date columns), `supabase/functions/doc-expiry-reminders/index.ts`, `src/types/database.ts`
  - **What:** Store document expiry dates in the carrier profile; send reminder emails at 30 and 7 days before expiry with resubmission instructions.
  - **Why:** Trust degrades silently when documents expire post-onboarding; catches the problem before admin or customers notice.
  - **Done when:** Carrier profile stores expiry dates for licence and insurance; reminders fire at both thresholds with a resubmission link.

- [ ] **C14** — Lane-level profitability insight on dashboard
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/lib/data/bookings.ts`
  - **What:** Aggregate completed jobs and earnings by origin–destination pair and surface the top 3 corridors by earnings on the dashboard.
  - **Why:** Repeat lanes are the supply wedge; carriers who see which routes are profitable post them more often.
  - **Done when:** Dashboard shows top-earning corridors with job count and total earnings; uses real booking data, not demo fixtures.

- [ ] **C15** — Vehicle photo in onboarding
  - **File(s):** `src/components/carrier/carrier-onboarding-form.tsx`, `src/app/api/upload/route.ts`, carrier data model
  - **What:** Add an optional vehicle photo upload step in onboarding (with `capture="environment"` for iPhone camera) that admins see during verification.
  - **Why:** Vehicle photos are the fastest admin trust signal and later become a browse-time trust layer for customers.
  - **Done when:** Carriers can upload a vehicle photo; it appears in the admin verification queue alongside licence and insurance.

### Customer Demand & Browse-to-Book

- [ ] **D1** — Time-window visual bar on search result cards
  - **File(s):** `src/components/trip/trip-card.tsx`, `src/components/ui/time-bar.tsx` (new)
  - **What:** Render the listing's time window (e.g. 09:00–14:00) as a simple horizontal bar on the card, similar to GoGet's availability indicator, so customers can compare pickup windows at a glance.
  - **Why:** Time compatibility is the #1 filter customers apply mentally before tapping a card; surfacing it on the card reduces wasted detail-page visits.
  - **Done when:** Every search card shows a visual time bar using the listing's `time_window` field; renders correctly at 375px.

- [ ] **D2** — Savings context block on trip detail
  - **File(s):** `src/app/(customer)/trip/[id]/page.tsx`
  - **What:** Add a callout on trip detail showing estimated savings vs a dedicated truck (e.g. "Typically $150–$250 cheaper than booking a dedicated van") using the item category and route context.
  - **Why:** Customers do not understand spare-capacity pricing intuitively; a savings frame converts curiosity to booking intent.
  - **Done when:** Trip detail shows a savings estimate with a brief explanation of the spare-capacity model; no maps or dynamic pricing required.

- [ ] **D3** — Browse by item category
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/components/search/search-bar.tsx`, `src/app/api/search/route.ts`
  - **What:** Add a category filter row (sofa, fridge, boxes, furniture, bulky item, etc.) to the search surface so customers can browse by what they need moved, not just route.
  - **Why:** Some customers know their item before they know their route; category-first browsing is a secondary intent pattern the product should support.
  - **Done when:** Category filter is visible in search; selecting a category filters results to matching listings; filter state persists in URL params.

- [ ] **D4** — Near-time fallback results on empty search
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/app/api/search/route.ts`
  - **What:** When the exact search date has no results, automatically show trips within ±3 days with a "No trips on your date — showing nearby dates" banner.
  - **Why:** Empty results are the highest abandonment point; near-date fallbacks show the product has real supply without requiring users to manually adjust dates.
  - **Done when:** Empty date searches show nearby-date results with a clear banner; date chips let users snap to adjacent days.

- [ ] **D5** — Save search from results page
  - **File(s):** `src/components/search/save-search-form.tsx`, `src/app/(customer)/search/page.tsx`
  - **What:** Show "Save this search — get notified when new trips appear" below the results list (not just on empty results); use the existing `saved_searches` API.
  - **Why:** Customers with results today may want to book a future trip; capturing the intent now converts dormant demand into future bookings.
  - **Done when:** Save search CTA appears on both empty and populated result pages; saved searches store correctly and appear in the customer account.

- [ ] **D6** — Pending booking expiry countdown timer
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`
  - **What:** Show a live countdown timer ("Expires in 1h 42m") on pending bookings so customers understand the urgency without reading status copy.
  - **Why:** Without a timer, customers are confused about why a pending booking disappeared; the timer also drives payment completion before expiry.
  - **Done when:** Pending bookings show a live countdown derived from `created_at + 2 hours`; timer disappears once booking moves past pending.

- [ ] **D7** — "Book similar trip" CTA on completed bookings
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(customer)/bookings/page.tsx`
  - **What:** Add a "Book a similar trip" action on completed booking detail that pre-fills the search with the same route and approximate item type.
  - **Why:** Repeat customers are the cheapest demand; making re-booking frictionless is the single best way to drive second bookings.
  - **Done when:** Completed booking detail shows a "Book similar" button that takes the customer to search pre-filled with the same route.

- [ ] **D8** — Customer booking preparation checklist
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, booking confirmation email template
  - **What:** After a booking is confirmed, show a checklist of what the customer should prepare (have items ready, be at pickup address, note the time window, have ID available for proof photo).
  - **Why:** Carriers cite customer unpreparedness as a leading friction point; a pre-trip checklist reduces no-shows and delays.
  - **Done when:** Confirmed bookings show a preparation checklist; the same checklist appears in the confirmation email.

- [ ] **D9** — Item size category descriptions in booking form
  - **File(s):** `src/components/booking/booking-form.tsx`, `src/components/trip/trip-card.tsx`
  - **What:** Add plain-language descriptions to each item size category (small = fits in a hatchback, medium = single-item furniture, large = multi-item/heavy) with visual size guides.
  - **Why:** Customers routinely select the wrong size category, causing carrier surprises and disputes; better labels prevent the mismatch before booking.
  - **Done when:** Each size option has a description and weight/dimension hint; customers can select confidently without guessing.

- [ ] **D10** — Share trip link action on trip detail
  - **File(s):** `src/app/(customer)/trip/[id]/page.tsx`
  - **What:** Add a native share button (using `navigator.share` with fallback to clipboard copy) so customers can share a trip link with the person whose item is being moved.
  - **Why:** Many bookings involve a third party at pickup or dropoff; sharing the trip link lets them follow the booking without needing an account.
  - **Done when:** Trip detail has a share button; on iOS it triggers the native share sheet with the trip URL; on desktop it copies to clipboard.

- [ ] **D11** — Booking receipt page and print-to-PDF
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, print styles in `src/app/globals.css`
  - **What:** Add a receipt section with receipt number, line-item amounts, parties, route, and timestamps, and add a print stylesheet that hides nav, buttons, and footers.
  - **Why:** Customers need a proof of purchase for employer reimbursement and building access; not having this creates support tickets.
  - **Done when:** Booking detail has a "Print receipt" button; printed output is clean and contains all required fields.

- [ ] **D12** — Capacity indicator on browse cards
  - **File(s):** `src/components/trip/trip-card.tsx`, `src/lib/data/listings.ts`
  - **What:** Show a simple "Spots remaining" or "Almost full" indicator based on `remaining_capacity_pct` on each trip card.
  - **Why:** Scarcity signals are the most reliable driver of booking urgency in marketplace products; "Almost full" converts browsing to booking intent.
  - **Done when:** Cards show capacity status; "Almost full" appears when `remaining_capacity_pct < 30%`; no indicator when plenty of space remains.

- [ ] **D13** — Customer carrier profile page
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx` (new), `src/lib/data/carriers.ts`
  - **What:** Create a public carrier profile page showing name, verified badge, vehicle type, completed job count, average rating, and active listings.
  - **Why:** Customers want to know who is moving their possessions before booking; a carrier profile page is the primary trust artifact.
  - **Done when:** Tapping a carrier name/badge on a trip card navigates to their profile with real data; page has canonical SEO metadata.

- [ ] **D14** — Dynamic OG metadata on trip pages
  - **File(s):** `src/app/(customer)/trip/[id]/page.tsx`, Next.js metadata API
  - **What:** Generate `og:title`, `og:description`, and `og:image` per trip using route, price, date, and carrier name so shared links preview correctly.
  - **Why:** Shared trip links from the WhatsApp/Facebook/SMS flow produce blank previews today; rich previews materially increase click-through from shares.
  - **Done when:** Sharing a trip URL on WhatsApp or Slack shows the trip route, price, and date in the link preview.

- [ ] **D15** — Search suburb autocomplete keyboard navigation
  - **File(s):** `src/components/search/search-bar.tsx`, suburb autocomplete component
  - **What:** Add `aria-activedescendant`, keyboard arrow-key navigation (↑/↓ to move, Enter to select, Escape to close), and a loading skeleton during fetch to the suburb autocomplete.
  - **Why:** The autocomplete is currently mouse/tap only; keyboard users and accessibility-tool users cannot complete a search without a pointer device.
  - **Done when:** The autocomplete is fully keyboard-navigable and passes basic WCAG 2.1 AA keyboard interaction criteria.

---

## 🟢 P3 — Enhancements

*Operational tools, polish, trust builders. Grouped by area.*

### ES — Supply-Side Enhancements

- [ ] **ES1** — Supabase Realtime booking alert with badge
  - **File(s):** `src/components/carrier/live-bookings-list.tsx`, carrier dashboard
  - **What:** Add a notification badge that increments when a new booking request arrives via Realtime, and resets when the carrier views the booking.
  - **Why:** Carriers should know a booking came in without refreshing; a badge converts attention to action.
  - **Done when:** New booking requests show an animated badge on the dashboard before the carrier navigates to the bookings list.

- [ ] **ES2** — Carrier activity feed
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/lib/data/bookings.ts`
  - **What:** Render a chronological feed of recent events (trip posted, booking requested, booking confirmed, review received, payout processed) on the carrier dashboard.
  - **Why:** Returning carriers need instant orientation on what changed since their last visit, especially on days with multiple active trips.
  - **Done when:** Activity feed shows last 20 events with timestamps; events link to the relevant booking or trip.

- [ ] **ES3** — Carrier dashboard booking-status badge counts
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`
  - **What:** Add count badges per status (pending, confirmed, in-transit, disputed) in the dashboard header so carriers see their workload at a glance.
  - **Why:** Carriers with 3+ active bookings cannot prioritize without seeing which ones need action; status counts solve this in one line.
  - **Done when:** Dashboard header shows live status counts that update when Realtime subscription fires.

- [ ] **ES4** — Multi-vehicle support groundwork
  - **File(s):** `src/components/carrier/carrier-onboarding-form.tsx`, `src/app/(carrier)/carrier/trips/page.tsx`, `src/lib/data/listings.ts`
  - **What:** Remove hardcoded "single vehicle" assumptions from carrier flows so a carrier can eventually associate a trip with one of several vehicles.
  - **Why:** Strong carriers run more than one vehicle; locking to single-vehicle now will require a painful migration when the first multi-vehicle carrier onboards.
  - **Done when:** `npm run check` passes with no regressions; no code path assumes a carrier has exactly one vehicle.

- [ ] **ES5** — Publish/unpublish scheduling for trips
  - **File(s):** `src/lib/validation/trip.ts`, `src/lib/data/listings.ts`, trip edit form, DB (new `publish_at` column)
  - **What:** Support an optional `publish_at` timestamp so carriers can prepare trip listings in advance that become visible to customers on a specific date/time.
  - **Why:** Carriers often know about a trip a week ahead but want to list it when the window for booking opens, not immediately.
  - **Done when:** Carriers can set a future publish date; listing is invisible to search until that timestamp; `npm run check` passes.

- [ ] **ES6** — Quick-post from expired / cancelled trips
  - **File(s):** `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/components/carrier/carrier-post-prefill.tsx`
  - **What:** Add a "Post similar trip" button on expired and cancelled trips that pre-fills the wizard with the same route, vehicle, and price defaults.
  - **Why:** Reposting the same corridor is the most common carrier action after expiry; a one-tap path removes the biggest friction point.
  - **Done when:** Expired and cancelled trip detail shows "Post similar" that opens the wizard with all fields pre-filled; carrier only needs to set a new date.

- [ ] **ES6a** — Carrier review response capability
  - **File(s):** `src/app/(carrier)/carrier/reviews/page.tsx` (or booking detail), `src/lib/data/reviews.ts`, `supabase/migrations/`
  - **What:** Allow carriers to post one reply per customer review; display the response below the review in the carrier profile.
  - **Why:** Carrier responses to negative reviews are the highest trust signal for future customers; platforms without this lose supply to competitors that offer it.
  - **Done when:** Carriers can submit one response per review; response is visible on the public carrier profile.

- [ ] **ES7** — Recurring availability helper
  - **File(s):** `src/app/(carrier)/carrier/templates/page.tsx`, `src/lib/data/templates.ts`
  - **What:** Add a weekly schedule helper that suggests "Post your Sydney→Wollongong run every Friday" based on template history and lets the carrier confirm with one tap.
  - **Why:** Recurring spare-capacity is the core supply wedge; making it effortless is the main supply retention moat.
  - **Done when:** Carriers with 2+ templates on the same corridor see a recurring suggestion; confirming creates a draft trip for the next matching weekday.

- [ ] **ES8** — Template analytics — post count and reuse rate
  - **File(s):** `src/app/(carrier)/carrier/templates/page.tsx`, `src/lib/data/templates.ts`, analytics events
  - **What:** Show per-template usage stats (number of trips posted, bookings received, completion rate) so carriers can see which templates perform.
  - **Why:** Template ROI must be visible; carriers who see a template convert well will use it more; the team can see whether the feature drives supply.
  - **Done when:** Template list shows post count and total earnings per template; data uses real booking joins, not estimates.

### ED — Demand-Side Enhancements

- [ ] **ED1** — Customer saved search management page
  - **File(s):** `src/app/(customer)/saved-searches/page.tsx` (new), `src/lib/data/saved-searches.ts`
  - **What:** Add a "My Saved Searches" page in the customer account showing all active alerts with delete and edit actions.
  - **Why:** Customers who create alerts need a way to manage them; without a management page the feature is fire-and-forget and feels unsupported.
  - **Done when:** Customer account nav includes "Saved Searches"; page lists all alerts with toggle, edit, and delete; `npm run check` passes.

- [ ] **ED2** — Saved search email — rich HTML template
  - **File(s):** `supabase/functions/notify-saved-searches/index.ts`, email template
  - **What:** Replace the plain-text saved-search alert email with an HTML email showing the matched trip's route, price, carrier rating, and a "Book now" CTA button.
  - **Why:** A plain-text email with a URL converts at a fraction of the rate of a visually clear summary with a direct booking button.
  - **Done when:** Saved search alert emails render a clean trip card with route, price, and a direct booking CTA; tested in Resend dashboard.

- [ ] **ED3** — Structured booking confirmation email
  - **File(s):** `src/lib/notifications.ts`, booking confirmation email template
  - **What:** Replace the plain confirmation email with an HTML template showing route, pickup window, carrier name, total paid, booking reference, and preparation checklist.
  - **Why:** Confirmation emails are the primary trust artifact for first-time customers; a professional email immediately after booking validates the purchase decision.
  - **Done when:** Booking confirmation emails render correctly in Gmail/Apple Mail mobile with all required fields; Resend preview confirms rendering.

- [ ] **ED4** — Customer review and rating flow
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/lib/data/reviews.ts`, `supabase/migrations/`
  - **What:** Add a post-delivery review prompt on the booking detail page (1–5 stars + optional comment) that becomes available when status reaches `completed`.
  - **Why:** Reviews are the primary trust signal for new customers; without them, carrier profiles look empty and supply quality is invisible.
  - **Done when:** Completed bookings show a review prompt; submitted reviews appear on the carrier profile; duplicate review submission is blocked.

- [ ] **ED5** — Proof-of-delivery gallery for customer
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`
  - **What:** Show proof photos uploaded by the carrier for pickup and delivery as a gallery in the customer booking detail, with timestamps and status labels.
  - **Why:** Customers who can see proof photos feel confident the delivery happened correctly; this reduces "did they actually pick it up?" support contacts.
  - **Done when:** Booking detail shows proof gallery when proof photos are present; HEIC files render (or show a fallback); photos are private to booking parties.

- [ ] **ED6** — Web push notifications for booking updates
  - **File(s):** `src/lib/notifications.ts`, `public/service-worker.js` (new), `src/hooks/usePushNotifications.ts` (new)
  - **What:** Implement web push via the Push API for key booking events (booking confirmed, trip day reminder, delivery confirmed) with an opt-in prompt on booking creation.
  - **Why:** Email is too slow for same-day logistics; push notifications are the next-best option before a native app exists.
  - **Done when:** Customers and carriers who opt in receive push notifications for key booking milestones; VAPID keys are configured via env vars.

### EP — Platform and Infrastructure Enhancements

- [ ] **EP1** — React error boundaries on major page sections
  - **File(s):** `src/components/shared/error-boundary.tsx`, search results, carrier dashboard, booking detail, admin pages
  - **What:** Wrap search results, the carrier live-bookings list, booking detail, and admin tables in error boundaries so a single component crash does not blank the whole page.
  - **Why:** Component-level crashes currently white-screen the entire page; error boundaries contain damage and give the user a retry path.
  - **Done when:** Deliberately throwing in any wrapped component shows an in-section error state, not a blank page.

- [ ] **EP2** — Skeleton loading states for major lists
  - **File(s):** `src/components/search/search-results-skeleton.tsx`, `src/components/carrier/trip-list-skeleton.tsx`, booking list skeleton
  - **What:** Replace null/empty states during data fetch with skeleton placeholder components that match the layout of the loaded content.
  - **Why:** Blank white areas during loading look like broken pages on mobile; skeletons communicate that content is coming.
  - **Done when:** Search results, carrier trip list, and customer booking list show skeleton placeholders during the Suspense fallback.

- [ ] **EP3** — PostGIS bounding-box pre-filter in search RPC
  - **File(s):** `supabase/migrations/` (new migration), matching RPC function
  - **What:** Add a `&&` bounding-box operator before the `ST_DWithin` call in `find_matching_listings` to use the GIST index before the expensive distance calculation.
  - **Why:** Without the bbox pre-filter, every search scans the full listings table with `ST_DWithin`; this degrades badly at scale.
  - **Done when:** Query plan for search shows a GIST index scan before the `ST_DWithin` filter; `npm run check` passes.

- [ ] **EP4** — GitHub Actions CI pipeline
  - **File(s):** `.github/workflows/ci.yml` (new)
  - **What:** Add a CI workflow that runs `npm run check` and `npm run test` on every pull request against `main`.
  - **Why:** Without CI, type regressions and broken tests reach the branch silently; this is the minimum quality gate for a team of any size.
  - **Done when:** PRs to `main` block merge if `npm run check` or `npm run test` fails; pipeline runs in under 3 minutes.

- [ ] **EP5** — Analytics deduplication in React strict mode
  - **File(s):** `src/lib/analytics.ts` or analytics hooks, any component that fires `trackAnalyticsEvent` on mount
  - **What:** Use a `useRef` dedup guard to prevent double-firing of analytics events in React 18 strict mode's double-mount behavior.
  - **Why:** Strict mode double-mounts inflate event counts in development and on Vercel preview deployments, polluting analytics before launch.
  - **Done when:** Search and booking-started events fire exactly once per user action in both development and production; verified via analytics dashboard.

- [ ] **EP6** — Sentry environment tagging and release tracking
  - **File(s):** `src/lib/sentry.ts`, `next.config.js`, CI pipeline
  - **What:** Tag all Sentry events with `environment` (production/preview/development), `release` (git SHA), and `feature` context; wire release creation into the CI deploy step.
  - **Why:** Without environment and release tags, Sentry is noisy and unactionable; you cannot tell if an error is new, regressed, or from a test environment.
  - **Done when:** Production Sentry events show correct environment, release SHA, and feature tags; preview-deploy errors are filtered from production alerts.

- [ ] **EP7** — `/api/health` endpoint
  - **File(s):** `src/app/api/health/route.ts` (new)
  - **What:** Create a health endpoint that checks Supabase connectivity, Stripe key presence, and required env vars; returns `200 { status: "ok" }` or `503` with specifics.
  - **Why:** Vercel and monitoring tools need a reliable probe endpoint; this also gives ops a fast "is the backend alive?" check during incidents.
  - **Done when:** `GET /api/health` returns `200` in a working environment; returns `503` with `{ failing: ["supabase"] }` when a dependency is unavailable.

- [ ] **EP8** — Rate limit observability and admin override
  - **File(s):** `src/lib/rate-limit.ts`, `src/app/api/admin/rate-limit/route.ts` (new)
  - **What:** Log rate-limit hits to Sentry with user context; add an admin endpoint to temporarily increase limits for specific IPs or user IDs during carrier onboarding events.
  - **Why:** A flat rate limit will block legitimate carrier onboarding bursts; ops need visibility and a manual escape valve.
  - **Done when:** Rate limit hits appear in Sentry with `userId` and `endpoint` tags; admin can override a specific user's limit via the admin endpoint.

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

- [ ] **EA1** — Dispute SLA and ownership markers
  - **File(s):** `src/app/(admin)/admin/disputes/page.tsx`, `src/components/admin/dispute-card.tsx`
  - **What:** Show dispute age, current assignee, next required action, and a red "SLA at risk" badge when a dispute is older than 48 hours without resolution progress.
  - **Why:** Unresolved disputes compound trust damage; a visible SLA marker forces prioritization without a separate ticketing system.
  - **Done when:** Admin disputes list shows age, owner, and SLA risk for each open dispute; disputes >48h are highlighted.

- [ ] **EA2** — Dispute evidence gallery in admin view
  - **File(s):** `src/app/(admin)/admin/disputes/[id]/page.tsx`
  - **What:** Show uploaded evidence as a visual gallery with captions, timestamps, and source attribution (customer vs carrier) instead of raw URL lists.
  - **Why:** Evidence scattered across raw URLs requires too much context-switching during dispute resolution; a gallery view enables fast first-contact resolution.
  - **Done when:** Admin dispute detail shows all evidence in a gallery; admins can resolve most disputes without opening each URL separately.

- [ ] **EA3** — Admin bulk carrier approve/reject
  - **File(s):** `src/app/(admin)/admin/verification/page.tsx`, `src/components/admin/verification-queue.tsx`
  - **What:** Add checkboxes to the verification queue with a bulk approve/reject action bar that processes all selected carriers in one API call.
  - **Why:** Early ops will have batches of verifications to process; doing them one-by-one is the bottleneck that delays supply activation.
  - **Done when:** Admin can select 5+ carriers and bulk-approve or bulk-reject with one confirmation; each action is logged with the admin ID.

- [ ] **EA4** — Admin analytics dashboard — fill rate and match rate
  - **File(s):** `src/app/(admin)/admin/dashboard/page.tsx`, `src/lib/data/admin.ts`
  - **What:** Add fill rate (booked_pct of active listing capacity), match rate (searches resulting in a booking), average job value, and disputes-per-100-jobs metrics to the admin dashboard.
  - **Why:** These four metrics are the health scorecard of a spare-capacity marketplace; without them, ops is flying blind.
  - **Done when:** All four metrics display with real aggregated data; metrics refresh on page load; values are clearly labeled with calculation method.

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

- [ ] **EA7** — Payment and booking observability dashboard
  - **File(s):** `src/app/(admin)/admin/payments/page.tsx` (new), `src/lib/data/admin.ts`
  - **What:** Add an admin payments view showing booking creation failures, payment intent failures, webhook failures, and capture/refund outcomes over the last 7 and 30 days.
  - **Why:** Revenue-impacting failures need a single dashboard; scattered Sentry events and Stripe logs are too slow for incident response.
  - **Done when:** Admin payments page shows failure counts, failure types, and links to Sentry for the underlying events.

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

- [ ] **V3** — Status badge design system
  - **File(s):** `src/components/ui/badge.tsx`, all status-displaying components
  - **What:** Create a `StatusBadge` component with a fixed color mapping (pending=yellow, confirmed=green, disputed=red, completed=grey, cancelled=muted) and apply it consistently.
  - **Why:** Status colors are currently inconsistent across carrier dashboard, admin views, and booking detail; customers and ops read status by color, not label.
  - **Done when:** Every booking status is rendered via `StatusBadge`; colors match the defined mapping; no raw status strings displayed as plain text.

- [ ] **V4** — Loading state standardization (spinner → skeleton)
  - **File(s):** All components using `isLoading` with spinners
  - **What:** Replace all spinner/loading indicators with skeleton components that match the shape of the loaded content; use Suspense where possible.
  - **Why:** Spinners cause layout shift when content loads; skeletons maintain page structure and feel faster.
  - **Done when:** `grep -r "Spinner\|loading-spinner"` returns zero results in `src/components`; all loading states use skeleton or Suspense fallback.

- [ ] **V5** — Dark mode foundation (system preference only)
  - **File(s):** `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`
  - **What:** Enable `darkMode: 'media'` in Tailwind and add dark-mode variants to the most visible surfaces (background, card, text) so the product respects system dark preference.
  - **Why:** iOS users expect dark mode support; a product that ignores system preference feels unfinished on iPhone.
  - **Done when:** Enabling dark mode on iPhone shows dark backgrounds and legible text on search, trip detail, and booking pages; no white-on-white text.

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

- [ ] **V8** — Focused-input ring standardization
  - **File(s):** `src/app/globals.css`, `tailwind.config.ts`, input/select/textarea components
  - **What:** Define a standard `focus-visible` ring style (2px offset, brand color) and apply it to all form inputs, selects, and textareas via a Tailwind plugin or CSS layer.
  - **Why:** Focus rings are inconsistent across form components; keyboard and VoiceOver users need a reliable focus indicator to navigate forms.
  - **Done when:** Every focusable form element shows the same `focus-visible` ring style; no element uses browser-default outline only.

### EX — External / Infrastructure

- [ ] **X1** — Vercel environment variable audit
  - **File(s):** `.env.example` (update), Vercel project settings
  - **What:** Create/update `.env.example` with all required and optional environment variables with descriptions; verify all required vars are set in Vercel production and preview environments.
  - **Why:** Missing env vars in production fail silently until a specific code path is hit; a documented `.env.example` prevents deployment gaps.
  - **Done when:** `.env.example` lists all vars from `assertRequiredEnv()` with descriptions; confirmed all are set in Vercel dashboard.

- [ ] **X2** — Supabase migration apply workflow documentation
  - **File(s):** `supabase/README.md` (new), `package.json` scripts
  - **What:** Document the local development workflow (`supabase start`, `supabase db reset`, `supabase db push`) and add npm scripts for common operations.
  - **Why:** The Supabase local workflow is not obvious to new contributors; without documentation, each session requires rediscovery.
  - **Done when:** `supabase/README.md` explains local setup, migration apply, and seed reset; `npm run supabase:reset` works end-to-end.

- [ ] **X3** — Resend domain verification and production sender
  - **File(s):** Resend dashboard, `.env.example`, `src/lib/notifications.ts`
  - **What:** Verify the sender domain in Resend, update `FROM_EMAIL` env var to a branded address (e.g. `notifications@moverrr.com.au`), and test lifecycle emails in production.
  - **Why:** Emails from `@resend.dev` land in spam on many clients; a verified domain is required for production deliverability.
  - **Done when:** Lifecycle emails (booking confirmation, dispute update) arrive in inbox from the branded address; SPF and DKIM pass.

- [ ] **X4** — Stripe webhook endpoint hardening
  - **File(s):** `src/app/api/payments/webhook/route.ts`, Stripe dashboard
  - **What:** Ensure the webhook signing secret is set via `STRIPE_WEBHOOK_SECRET` env var; add a pre-flight check that rejects unsigned requests with 400 before any processing.
  - **Why:** An unsigned webhook endpoint can be replayed by any caller; signing validation is mandatory for any production payment system.
  - **Done when:** Webhook route rejects requests without a valid Stripe signature; Stripe dashboard shows successful delivery in test mode.

- [ ] **X5** — Supabase storage bucket policies audit
  - **File(s):** `supabase/migrations/` (storage policy migration), `src/app/api/upload/route.ts`
  - **What:** Audit all storage buckets (proof-photos, carrier-documents) and ensure RLS-equivalent bucket policies restrict access to the booking parties and admin only.
  - **Why:** Public storage buckets would expose private proof photos and carrier documents to anyone with the URL — a serious privacy and trust failure.
  - **Done when:** Proof-photo URLs return 403 for unauthenticated requests and requests from non-party users; admin can access any bucket.

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
