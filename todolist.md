# moverrr — Canonical 150-Item MVP-to-Production Backlog

> Last refreshed: `2026-04-01`
>
> This file is the backlog for **everything except**:
> - work already moved to `completed.md`
> - the separate active 15-task workstream already in progress
>
> Active workstream items intentionally excluded from this file:
> - Trip templates full feature
> - Carrier trip duplication / re-post route
> - Carrier onboarding progress tracker
> - Atomic booking RPC rollout
> - Carrier dashboard realtime live updates
> - Upstash Redis rate limiting
> - Saved searches and route alerts core feature
> - Booking status vertical stepper
> - Proof upload camera-primary mobile UI
> - Admin analytics dashboard core pass
> - Admin document preview modal
> - React error boundaries
> - Skeleton loading components
> - Dynamic SEO metadata on trip pages
> - Broad WCAG accessibility audit

## Product Guardrails

- moverrr is a **browse-first spare-capacity marketplace**.
- Do not drift into removalist dispatch, courier ops, quote-comparison, bidding, or AI matching.
- Commission math in `src/lib/pricing/breakdown.ts` is fixed unless discussed explicitly.
- iPhone-first rules are non-negotiable: `min-h-[44px]`, `active:` states, `capture="environment"`, safe-area handling, and 375px layout validation.
- Trust beats cleverness. Supply speed beats polish. Customer clarity beats automation theater.

## How To Use This Backlog

- There are **5 batches of 30 items each** for a total of **150 concrete changes**.
- Batches are intentionally sequenced:
  - Batch 1 makes bookings, money, proofs, and disputes trustworthy.
  - Batch 2 strengthens carrier supply velocity and retention.
  - Batch 3 improves browse-to-book conversion and customer confidence.
  - Batch 4 gives admin and ops the control layer needed for a real marketplace.
  - Batch 5 hardens the system for production, iOS reality, and launch discipline.
- Every item includes a real surface to touch, the reason it matters, and a crisp completion bar.

---

## Batch 1 — Transaction Trust, Booking Integrity, and Money Rails (30)

**Objective:** make every booking, cancellation, payment, proof event, and dispute state feel deterministic, supportable, and hard to break.

### Booking Expiry And Lifecycle Automation

- [ ] `B1-01` Server-side pending booking expiry runner
  Scope: `supabase/functions/expire-bookings/`, scheduler wiring, `src/lib/data/bookings.ts`, lifecycle email copy.
  Why: the booking detail countdown now exists, but inventory still depends on manual cleanup after the 2-hour window.
  Change: add a scheduled job that finds stale `pending` bookings, cancels them with an explicit expiry reason, writes `booking_events`, restores listing capacity, and notifies both customer and carrier.
  Done when: no `pending` booking can remain older than 2 hours without an admin override trail.

- [ ] `B1-02` Expiry warning nudges before auto-cancel
  Scope: booking timeline events, email templates, optional in-app banner logic.
  Why: silent expiry feels arbitrary; both sides need advance notice that the booking window is about to close.
  Change: send pre-expiry nudges at clear thresholds such as 60 minutes remaining and 15 minutes remaining, with copy tailored to customer vs carrier.
  Done when: both sides receive a predictable warning sequence before auto-expiry happens.

- [ ] `B1-03` Booking creation idempotency keys
  Scope: `src/app/api/bookings/route.ts`, `src/lib/data/bookings.ts`, possibly a new DB field or short-lived idempotency table.
  Why: mobile retries and double taps can still create user anxiety even with the atomic RPC in place.
  Change: accept and persist a request idempotency key so identical booking attempts return the same booking result instead of reprocessing.
  Done when: repeated submits from the same client action cannot create ambiguous duplicate requests.

- [ ] `B1-04` Payment-intent creation idempotency keys
  Scope: `src/app/api/payments/create-intent/route.ts`, `src/lib/data/bookings.ts`, Stripe metadata.
  Why: payment setup is a frequent retry path on mobile networks, and duplicate intents complicate support and refunds.
  Change: make payment-intent creation safely repeatable by reusing an existing compatible intent or storing an idempotent mapping per booking.
  Done when: repeated payment-setup retries for one booking resolve to one authoritative Stripe intent.

- [ ] `B1-05` Booking lifecycle timeline UI
  Scope: booking detail page, booking events mapping, admin-facing event semantics.
  Why: customers and ops need to see what happened, when, and why without reading raw status values.
  Change: render the ordered `booking_events` history with timestamps, actor labels, and user-safe descriptions for payment, confirmation, pickup, delivery, cancellation, and dispute milestones.
  Done when: the booking detail page reads like a trustworthy timeline instead of a thin state label.

- [ ] `B1-06` Structured cancellation reason taxonomy
  Scope: booking updates, admin dispute resolution flows, customer/career cancellation forms, DB schema if needed.
  Why: free-text cancellation reasons are weak for analytics, policy decisions, and customer support.
  Change: define a controlled set of cancellation reasons such as no response, carrier unavailable, customer changed plans, payment failed, and safety concern, with optional notes.
  Done when: cancellation reporting is structured enough to drive ops decisions and exception handling.

### Payment And Receipt Reliability

- [ ] `B1-07` Payment failure recovery surface on booking detail
  Scope: `src/app/(customer)/bookings/[id]/page.tsx`, payment intent retry UX, booking copy.
  Why: users need a clear path from a failed authorization back to a payable booking without contacting support.
  Change: add a booking-detail card that explains payment failure, shows what still exists, and provides a safe retry action.
  Done when: a failed payment can be retried from the booking page with no ambiguity about booking state.

- [ ] `B1-08` Distinguish cancelled authorization vs refunded capture
  Scope: DB payment status semantics, admin dispute resolution, Stripe webhook handling, user copy.
  Why: “refunded” is not the same operational state as “authorization cancelled before capture.”
  Change: split money states so pre-capture cancellation and post-capture refund are separately tracked and surfaced.
  Done when: support can tell whether money was never captured or was captured and returned.

- [ ] `B1-09` Booking receipt page and downloadable PDF
  Scope: booking detail page, print stylesheet, PDF-friendly layout, receipt identifier generation.
  Why: customers need a durable proof of purchase for reimbursement, building access, and record-keeping.
  Change: add a receipt section with receipt number, amount lines, parties, route, and timestamps, optimized for browser print-to-PDF.
  Done when: a customer can print or save a clean receipt without UI clutter.

- [ ] `B1-10` Carrier-facing payout line item on booking detail
  Scope: carrier booking surfaces, payout math display, commission explanation copy.
  Why: carriers trust the platform more when they can see exactly what they will earn from the booking.
  Change: surface carrier payout, base fare, add-ons, and commission treatment without changing the underlying pricing math.
  Done when: payout expectations are visible and consistent with `calculateBookingBreakdown()`.

- [ ] `B1-11` Booking reference number generation
  Scope: booking creation, receipt UI, support tooling, emails.
  Why: long UUIDs are poor support handles; users and ops need a short reference for calls and emails.
  Change: generate a human-friendly booking reference such as `MVR-2026-0421` or similar and surface it everywhere relevant.
  Done when: support can resolve most cases using a short booking reference rather than a raw UUID.

- [ ] `B1-12` Payment and booking state parity audit
  Scope: booking detail UI, webhook updates, admin booking view, event logging.
  Why: the system should never imply “all good” when the money state and service state are diverging.
  Change: audit every place booking status is shown and pair it with the right payment-state explanation, especially for pending, failed, cancelled, and disputed paths.
  Done when: every booking state shown to users has a matching and truthful payment explanation.

- [ ] `B1-13` Duplicate-charge support guardrails
  Scope: Stripe metadata, admin booking view, webhook event storage, support copy.
  Why: even rare payment confusion can destroy trust early in a marketplace.
  Change: add tooling and metadata so ops can quickly prove whether a customer has one authorization, one capture, or a genuine duplicate issue.
  Done when: support can answer “was I charged twice?” from first-party data within minutes.

### Proof, Delivery, And Dispute Quality

- [ ] `B1-14` Proof upload preview and remove-before-submit
  Scope: pickup/delivery proof actions, client-side image state, mobile proof UX.
  Why: users need confidence that the correct image is attached before a status change becomes official.
  Change: show thumbnail previews, filename/size context, and a remove/replace action before final submit.
  Done when: no proof upload is effectively blind.

- [ ] `B1-15` HEIC/HEIF proof normalization path
  Scope: upload pipeline, image handling utilities, proof rendering.
  Why: iPhone-native HEIC uploads are allowed, but downstream rendering and ops consumption should be predictable.
  Change: normalize or verify proof rendering so HEIC uploads display reliably across admin and customer/carrier views.
  Done when: proof photos from iPhone never appear as “uploaded but not viewable.”

- [ ] `B1-16` Client-side proof image compression
  Scope: proof upload UI, image processing helper, upload endpoint size behavior.
  Why: mobile network latency and large photos slow down critical status updates on trip day.
  Change: compress proof images on-device before upload while preserving enough quality for dispute evidence.
  Done when: typical proof uploads feel fast on mobile data without harming legibility.

- [ ] `B1-17` Guided dispute intake by category
  Scope: dispute form, validation schema, admin dispute view.
  Why: damage, no-show, and timing disputes need different evidence to be actionable.
  Change: tailor prompts, evidence guidance, and required details based on the selected dispute category.
  Done when: incoming disputes are more structured and less dependent on follow-up clarification.

- [ ] `B1-18` Dispute evidence gallery
  Scope: booking detail page, admin dispute page, private file rendering.
  Why: evidence is currently text-heavy and hard to scan during fast operations work.
  Change: show uploaded evidence as a gallery with captions, timestamps, and clear source attribution.
  Done when: admins can resolve common disputes without hopping between raw URLs and notes.

- [ ] `B1-19` Dispute SLA and ownership markers
  Scope: admin disputes view, timestamps, escalation copy, possibly admin notes.
  Why: unresolved disputes damage trust faster than almost any other marketplace problem.
  Change: show age, current owner, next required action, and approaching SLA thresholds on every dispute card.
  Done when: the admin disputes queue visibly prioritizes what is aging and who should move it next.

- [ ] `B1-20` Delivery confirmation reminder loop
  Scope: post-delivery email/push placeholders, booking detail banners, lifecycle jobs.
  Why: captured funds and completed bookings should not depend on the customer remembering to confirm receipt manually.
  Change: add a reminder sequence after `delivered` with escalating but polite prompts to confirm receipt or raise a dispute.
  Done when: delivered bookings reliably move toward `completed` or `disputed` without dead air.

- [ ] `B1-21` Manual ops override record for forced status changes
  Scope: admin booking actions, booking events, admin notes.
  Why: support sometimes needs to override lifecycle states, but those actions must be explainable later.
  Change: require a reason and actor trail for any admin-forced status transition, refund, or dispute closure.
  Done when: every manual override is auditable from the booking history.

### Testing, Instrumentation, And Runbooks

- [ ] `B1-22` Booking status machine unit test suite
  Scope: `src/lib/__tests__/status-machine.test.ts`, transition tables, invalid transitions.
  Why: lifecycle regressions are easy to introduce and very expensive once live.
  Change: test every valid transition, every invalid transition, and the special cancelled/disputed edge cases.
  Done when: state-machine changes are protected by a clear automated safety net.

- [ ] `B1-23` Pricing breakdown regression tests
  Scope: `src/lib/__tests__/breakdown.test.ts`, commission identity rules.
  Why: commission math is a product truth, not an implementation detail.
  Change: cover stairs/helper add-ons, base-only commission, and payout/total/commission identity equations.
  Done when: the fixed pricing model cannot drift silently.

- [ ] `B1-24` Atomic booking concurrency integration test
  Scope: integration test harness, Supabase local workflow, booking fixture data.
  Why: the race-condition fix needs a regression test that proves only one booking wins.
  Change: fire parallel booking attempts against the same listing and assert a single success path plus correct capacity aftermath.
  Done when: oversell protection is verified by code rather than hope.

- [ ] `B1-25` Payment webhook contract test set
  Scope: webhook route tests, Stripe fixture events, payment-status assertions.
  Why: webhook behavior drifts easily as event semantics evolve.
  Change: encode expected handling for `payment_failed`, `amount_capturable_updated`, `succeeded`, missing booking metadata, and replay-safe paths.
  Done when: payment state transitions are test-backed and stable.

- [ ] `B1-26` Capacity restoration regression tests
  Scope: `src/lib/booking-capacity.ts`, booking cancel flows, listing status recomputation.
  Why: the new proportional capacity math is central to marketplace integrity.
  Change: test dimension-based, weight-based, and fallback-category scenarios, including partial cancellations and full sell-out cases.
  Done when: capacity behavior is deterministic across the main booking shapes.

- [ ] `B1-27` Payment and booking observability dashboard
  Scope: Sentry tags, structured logs, admin diagnostics surface, analytics events.
  Why: revenue-impacting failures need one place to inspect, not six disconnected logs.
  Change: define the key counters and incident views for booking create failures, payment intent failures, webhook failures, and capture/refund outcomes.
  Done when: payment/booking health can be assessed from a single operator dashboard.

- [ ] `B1-28` Duplicate email suppression for lifecycle sends
  Scope: notifications layer, booking events, send tracking strategy.
  Why: retry safety in booking flows should not spam users with repeated receipts or status emails.
  Change: add lightweight dedupe around high-value transactional sends based on booking id plus email type plus event state.
  Done when: transient retries do not create duplicate customer or carrier lifecycle emails.

- [ ] `B1-29` Booking support runbook
  Scope: product docs, support macros, operational decision trees.
  Why: a real marketplace needs repeatable handling for common problems long before it needs a large support team.
  Change: document how to resolve stale pending bookings, failed payments, no-response carriers, missing proof, and active disputes.
  Done when: a new operator can follow a written playbook for the 10 most common incidents.

- [ ] `B1-30` Synthetic booking journey smoke check
  Scope: QA script or automated smoke, seed data, environment readiness.
  Why: trust-critical flows need a fast “is the marketplace alive?” check before releases.
  Change: define a repeatable smoke journey from search to booking to payment intent to confirmation-ready state using seeded fixtures.
  Done when: releases can be validated with one authoritative booking smoke procedure.

---

## Batch 2 — Supply Velocity, Carrier Retention, and Operational Simplicity (30)

**Objective:** make it dramatically easier for good carriers to onboard, post, manage, and repeat routes without adding dispatch-style complexity.

### Carrier Posting And Onboarding Velocity

- [ ] `B2-01` In-place carrier post success screen
  Scope: `src/app/(carrier)/carrier/post/page.tsx`, `src/components/carrier/carrier-trip-wizard.tsx`.
  Why: redirect-only success handling feels abrupt and weakens the “I just posted supply” moment.
  Change: show a dedicated success state on the post page with next actions for dashboard, trips, and post another route.
  Done when: posting a trip ends in a clear confirmation screen before navigation elsewhere.

- [ ] `B2-02` Sticky mobile footer for the carrier wizard
  Scope: trip wizard layout, safe-area spacing, mobile keyboard interactions.
  Why: Next/Back/Save controls should stay reachable one-handed on iPhone instead of falling below the fold.
  Change: move wizard actions into a sticky footer with safe-area padding and clear disabled/active states.
  Done when: the posting wizard is comfortable to use at 375px without repeated scrolling.

- [ ] `B2-03` Remaining carrier tap-target audit
  Scope: carrier dashboard, trip detail, quick-post templates, edit forms, list actions.
  Why: undersized touch targets create avoidable operational friction on the supply side.
  Change: audit every carrier CTA, link, segmented control, and icon action for the 44pt rule.
  Done when: all carrier-facing interactive controls meet the iOS touch contract.

- [ ] `B2-04` Carrier active-state audit
  Scope: carrier routes, dashboard cards, trip cards, form actions, quick-post UI.
  Why: hover-only affordances still sneak in easily and feel broken on iPhone.
  Change: add matching `active:` feedback everywhere carrier flows currently rely on hover or no state at all.
  Done when: no carrier interaction relies on desktop hover feedback to feel responsive.

- [ ] `B2-05` True byte-based onboarding upload progress
  Scope: carrier onboarding form, upload helper, fetch/XHR progress handling.
  Why: staged progress is better than nothing, but it still does not tell the carrier what the network is actually doing.
  Change: wire uploads through measurable progress events or explicitly relabel them as phased progress if byte accuracy is not possible.
  Done when: onboarding upload progress is honest, specific, and non-confusing.

- [ ] `B2-06` Onboarding document preview before submit
  Scope: onboarding form, private file preview, image/PDF handling.
  Why: carriers should not discover a wrong or blurry document only after admin rejection.
  Change: show previews for uploaded licence and insurance files with replace/remove actions before final submission.
  Done when: onboarding docs are verifiable by the carrier before they commit the form.

- [ ] `B2-07` Onboarding draft autosave and resume
  Scope: onboarding form state, `localStorage` or draft persistence, recovery UX.
  Why: mobile onboarding frequently gets interrupted by calls, camera use, and multitasking.
  Change: autosave unfinished onboarding data locally and recover it on return with an explicit resume banner.
  Done when: carriers do not lose onboarding progress after accidental navigation or refresh.

- [ ] `B2-08` Verification blockers explanation card
  Scope: onboarding review state UI, carrier dashboard, post-submission messaging.
  Why: carriers should know exactly why they are not yet verified, not just that they are “submitted.”
  Change: add a plain-language explanation area that spells out missing or rejected trust signals and next steps.
  Done when: verification delays are legible and actionable from the carrier side.

- [ ] `B2-09` Vehicle photo support in onboarding
  Scope: onboarding data model, uploads, carrier profile surfaces.
  Why: vehicle photos increase admin trust and later improve browse-time trust signals.
  Change: let carriers upload one or more vehicle photos with captions and preview states.
  Done when: ops can visually verify the vehicle as part of onboarding and customers can later benefit from that trust layer.

- [ ] `B2-10` Licence and insurance expiry reminders
  Scope: carrier data model, reminder jobs, admin verification state.
  Why: trust degrades silently when documents expire after onboarding.
  Change: track expiry dates where available and warn carriers/admins ahead of expiry with resubmission actions.
  Done when: document freshness is maintained proactively rather than discovered late.

### Carrier Dashboard And Repeat Usage

- [ ] `B2-11` Carrier dashboard booking-status badges
  Scope: carrier dashboard cards, live bookings list, trip list presentation.
  Why: carriers need quick scanability for which jobs are pending, confirmed, in-transit, or disputed.
  Change: add consistent color-coded status badges and counts to the dashboard and trip list surfaces.
  Done when: booking workload is scannable at a glance without reading paragraphs.

- [ ] `B2-12` Carrier payouts dashboard
  Scope: new carrier payouts page, booking payout aggregation, release-status model.
  Why: earnings transparency is a core retention lever for supply.
  Change: show upcoming payout total, completed-but-unreleased earnings, refunded jobs, and historical payout records.
  Done when: a carrier can answer “what have I earned and what is still pending?” in one screen.

- [ ] `B2-13` Carrier performance metrics page
  Scope: dashboard extensions, analytics aggregation, carrier-facing coaching copy.
  Why: trusted carriers should be able to improve their own conversion and service quality.
  Change: add acceptance rate, completion rate, average rating, dispute count, and repeat-route usage metrics with explanatory copy.
  Done when: carriers can self-assess performance without admin intervention.

- [ ] `B2-14` Lane-level profitability and fill insight
  Scope: dashboard analytics, trip templates, route grouping.
  Why: repeat lanes are the core supply wedge; carriers should know which corridors are worth reposting.
  Change: aggregate completed jobs and earnings by corridor so carriers can spot their strongest repeat routes.
  Done when: the dashboard can answer “which route should I post again next week?”

- [ ] `B2-15` Trip edit unsaved-changes protection
  Scope: trip edit form, route guard prompts, dirty-state handling.
  Why: losing edits is a small paper cut that compounds quickly for repeat supply posters.
  Change: detect dirty state and warn before navigation or refresh on trip edit surfaces.
  Done when: carriers do not lose trip edits by accident.

- [ ] `B2-16` Publish/unpublish scheduling for trips
  Scope: listing model, carrier trip edit flow, search visibility behavior.
  Why: carriers often know a trip exists before they want it visible to customers.
  Change: support scheduled publish and optional auto-unpublish timing for active routes without turning the product into dispatch.
  Done when: carriers can prepare supply in advance and control when it becomes browsable.

- [ ] `B2-17` Trip expiry reminder sequence
  Scope: trip lifecycle emails, dashboard banners, template/quick-post hooks.
  Why: expired inventory is a missed retention moment if the carrier never gets nudged to repost it.
  Change: warn carriers ahead of route expiry and provide a direct path back into posting or template reuse.
  Done when: supply decay drives a repost motion instead of silent inactivity.

- [ ] `B2-18` Route map preview in the posting flow
  Scope: carrier wizard, maps utilities, route summary UI.
  Why: carriers need to visually confirm they are posting the right corridor before publishing supply.
  Change: render a lightweight route preview from origin to destination with corridor summary rather than raw suburb text alone.
  Done when: carriers can visually sanity-check a route before publishing.

- [ ] `B2-19` Price suggestion rationale panel
  Scope: price suggestion UI, pricing helper, carrier trust copy.
  Why: a suggested price with no explanation feels arbitrary and is easy to ignore.
  Change: explain the price range using route length, space size, spare-capacity framing, and dedicated-truck savings context.
  Done when: suggested pricing feels like a helpful guide rather than a black box.

- [ ] `B2-20` Detour radius guidance and presets
  Scope: carrier wizard, trip edit form, copy.
  Why: detour radius is an unfamiliar lever for many carriers and has major match-quality impact.
  Change: add presets, helper text, and examples showing how tighter vs wider detour settings affect route fit and customer expectations.
  Done when: carriers can set detour radius confidently without guesswork.

- [ ] `B2-21` Special notes preset chips
  Scope: carrier trip wizard, edit form, reusable notes snippets.
  Why: carriers repeat the same handling and access notes across many trips.
  Change: add quick-insert chips for common notes such as tail-lift unavailable, apartment access okay, and marketplace pickup friendly.
  Done when: special notes are faster to author and more consistent.

- [ ] `B2-22` Carrier activity feed
  Scope: dashboard, analytics events, booking events, trip events.
  Why: a marketplace feels alive when carriers can see a chronological feed of what changed recently.
  Change: show trip posted, booking requested, booking confirmed, review received, dispute opened, and payout milestones in one feed.
  Done when: returning carriers can instantly orient to what happened since their last visit.

- [ ] `B2-23` Richer live bookings list actions
  Scope: `src/components/carrier/live-bookings-list.tsx`, carrier dashboard composition.
  Why: realtime updates are only useful if the carrier can act from the list without extra navigation.
  Change: add quick links or drawers for confirm, view proof requirements, contact guidance, and booking detail entry points.
  Done when: the live list is operationally useful, not just informational.

- [ ] `B2-24` Public carrier trust card improvements
  Scope: trip cards, trip detail summary, carrier data model.
  Why: supply quality is the product, and customers need more reasons to trust a carrier beyond a name.
  Change: surface tenure, repeat completed jobs, verified status context, and vehicle details in a compact, browse-friendly card.
  Done when: trust signals are visible before the booking form starts.

- [ ] `B2-25` Multi-vehicle support groundwork
  Scope: carrier onboarding, vehicles table usage, dashboard assumptions.
  Why: strong carriers will eventually run more than one active vehicle, and the current model assumes only one.
  Change: audit flows and remove “single active vehicle only” assumptions where they would block future expansion.
  Done when: the codebase can support a second vehicle without deep structural rework.

- [ ] `B2-26` Recurring availability calendar
  Scope: carrier dashboard, trip creation helpers, templates integration.
  Why: supply should be easy to post repeatedly for weekly or repeated runs without turning moverrr into dispatch.
  Change: add a simple recurring availability helper that turns common lanes into repeated draft or ready-to-post trips.
  Done when: regular carriers can express recurring spare capacity efficiently.

- [ ] `B2-27` Template management hardening after the active template feature lands
  Scope: templates CRUD, dashboard organization, naming, archive/delete flows.
  Why: once templates exist, they need stewardship or they become clutter fast.
  Change: add rename, archive, delete, duplicate, and usage sorting to keep the template library useful over time.
  Done when: template-heavy carriers can manage route templates without accumulating junk.

- [ ] `B2-28` Template analytics and reuse measurement
  Scope: analytics events, dashboard metrics, template data model.
  Why: if templates are a supply-retention wedge, the team needs to see whether they actually shorten post time and drive repeat usage.
  Change: instrument save-template, quick-post, and template-derived completion flows and expose reuse metrics.
  Done when: template ROI is visible in product analytics and carrier dashboards.

- [ ] `B2-29` Carrier support center page
  Scope: new carrier help surface, FAQ, ops escalation links.
  Why: supply users need a dependable place for rules, proof requirements, payout timing, and dispute guidance.
  Change: add a simple carrier support page linked from dashboard and onboarding states.
  Done when: common support questions no longer depend on ad hoc chat or admin memory.

- [ ] `B2-30` Carrier retention weekly review package
  Scope: analytics definitions, ops docs, dashboard export or digest.
  Why: the marketplace should learn fast from why carriers stop posting, not just celebrate new ones.
  Change: define a weekly retention review around active carriers, repeat posters, repost lag, template usage, and verification drop-off.
  Done when: supply retention has a concrete weekly operating cadence rather than intuition alone.

---

## Batch 3 — Demand Conversion, Browse Quality, and Customer Confidence (30)

**Objective:** make the browse-first customer journey feel obviously trustworthy, easy to understand, and worth completing on a phone.

### Search And Browse Improvements

- [ ] `B3-01` Search filters for price, time window, and space size
  Scope: search page, search API, trip search input types, UI chips or selects.
  Why: customers need better control once enough supply exists, especially for awkward-middle jobs.
  Change: add optional filters for budget band, morning/afternoon/evening, and space size without overcomplicating the browse surface.
  Done when: customers can narrow supply with three practical filters that map directly to real listings.

- [ ] `B3-02` Search sort options
  Scope: search page, ranking strategy, query params.
  Why: “best fit” should not be the only mental model once users compare multiple trips.
  Change: support sorts such as best fit, soonest, cheapest, and highest-rated carrier.
  Done when: searchers can intentionally change ranking instead of accepting one opaque order.

- [ ] `B3-03` Search result fit badges
  Scope: trip cards, match breakdown display, search results copy.
  Why: match quality is easier to trust when the system explains why a route is a good fit.
  Change: show compact fit badges like “Near your route,” “High savings,” “Verified carrier,” or “Flexible detour.”
  Done when: the best reasons to click a card are visible in the results list itself.

- [ ] `B3-04` 375px search card spacing and CTA consistency
  Scope: `src/components/trip/trip-card.tsx`, search page layout, mobile spacing system.
  Why: browse-stage trust can die on cramped or inconsistent small-screen cards.
  Change: audit card spacing, price alignment, badges, and CTA rhythm specifically for iPhone SE width.
  Done when: trip cards feel intentional and readable at 375px without pinch-zoom or awkward wraps.

- [ ] `B3-05` Route corridor summary chips
  Scope: search page, trip cards, search result header.
  Why: customers often search mental corridors, not just exact suburb pairs.
  Change: surface route corridor cues like “Western Sydney → Eastern Suburbs” alongside the exact suburbs.
  Done when: route fit feels easier to scan and compare across listings.

- [ ] `B3-06` Flexible-date search helper
  Scope: search input model, search UX, query logic.
  Why: a strict one-day search can make real spare-capacity supply look thinner than it is.
  Change: add an optional “show nearby dates” mode that broadens browse results within a constrained window.
  Done when: customers can widen a search without abandoning the browse-first flow.

- [ ] `B3-07` Search management page for saved searches
  Scope: customer account area, saved search list, delete/pause controls.
  Why: once saved searches exist, users need to manage them or notification fatigue sets in.
  Change: provide a customer page to view, pause, delete, and understand active saved searches and notification history.
  Done when: saved searches are a product feature, not just a one-time form submit.

- [ ] `B3-08` Empty-state system beyond one CTA
  Scope: search empty states, customer bookings empty state, future saved-search states.
  Why: every no-results moment is a demand-capture opportunity, not just a dead-end.
  Change: define a reusable empty-state system that can suggest save search, widen date, adjust space size, or browse similar corridors.
  Done when: empty states consistently help the customer take a smart next step.

- [ ] `B3-09` Search-to-booking funnel instrumentation
  Scope: analytics events, search page, trip detail, booking form milestones.
  Why: the team needs to know where browse intent is dying: no results, low clickthrough, booking abandonment, or payment failure.
  Change: instrument impression, card click, trip detail view, booking start, payment setup, and booking completion steps.
  Done when: conversion drop-off is measurable across the core browse-first journey.

- [ ] `B3-10` Search API caching and latency review
  Scope: search route, data layer, Next caching strategy, slow query behavior.
  Why: search must feel fast on mobile even before large-scale optimization work.
  Change: inspect cold and warm paths, cache where safe, and add latency instrumentation around geocoding and matching.
  Done when: the team can explain and improve the main sources of search slowness.

### Trip Detail And Booking Form Clarity

- [ ] `B3-11` Trip detail savings context block
  Scope: trip detail page, constants, pricing comparison copy.
  Why: customers should understand why spare capacity is economically attractive before they hit the booking form.
  Change: add a tasteful block comparing this trip price to a dedicated-truck estimate and explain the browse-first value prop.
  Done when: price savings are explicit and believable on every trip detail page.

- [ ] `B3-12` Verified carrier explainer
  Scope: trip cards, trip detail page, verification UI copy.
  Why: “Verified” means little unless the customer understands what was actually verified.
  Change: add a short explainer for licence, insurance, and manual review so trust badges carry real meaning.
  Done when: verified status conveys a concrete trust layer instead of generic reassurance.

- [ ] `B3-13` Fee breakdown explainer
  Scope: booking form, price breakdown component, support FAQ.
  Why: booking fee, stairs fee, and helper fee are rational, but they need explicit framing to avoid surprise.
  Change: explain what each line item means and when it appears, without changing the underlying pricing contract.
  Done when: customers can understand total price composition before committing.

- [ ] `B3-14` Trip detail FAQ block
  Scope: trip detail page, reusable FAQ content, support load reduction.
  Why: common questions about pickup timing, proof photos, stairs, and cancellation policy should be answered before support is needed.
  Change: add a compact FAQ tuned to the spare-capacity model rather than a generic moving service.
  Done when: the trip detail page answers the most common trust questions inline.

- [ ] `B3-15` Booking form inline validation helper text
  Scope: booking form, Zod mapping, client error presentation.
  Why: form-only error messages after submit are avoidable friction on mobile.
  Change: add inline helper text and early validation for dimensions, contact fields, access notes, and missing address selection.
  Done when: most customer errors are prevented before the final submit attempt.

- [ ] `B3-16` Near-capacity warning on booking form
  Scope: trip detail page, booking form, trip capacity data.
  Why: customers should understand when they are booking one of the last viable spaces on a route.
  Change: show a clear “limited spare capacity left” banner when remaining capacity is below a defined threshold.
  Done when: urgency is honest and tied to actual capacity state.

- [ ] `B3-17` Item photo preview thumbnails
  Scope: booking form, client file state, upload UX.
  Why: booking confidence improves when the user can see what they are about to send.
  Change: show local preview thumbnails for item photos with replace/remove actions before upload.
  Done when: item photo upload is visual and reversible.

- [ ] `B3-18` Dimension helper presets and examples
  Scope: booking form, helper copy, item dimension field UX.
  Why: many users do not know how to describe furniture dimensions cleanly.
  Change: provide examples and optional quick-select presets for common items like sofa, mattress, fridge, or desk.
  Done when: the dimensions field is less intimidating and yields cleaner data.

- [ ] `B3-19` Maps-unavailable address fallback
  Scope: address components, booking form, search UX, degraded-mode copy.
  Why: the marketplace should degrade gracefully if Google Maps is unavailable or rate-limited.
  Change: allow manual suburb/postcode entry with honest limitations and validation instead of dead-ending the flow.
  Done when: missing maps config or transient failures do not completely block core customer actions.

- [ ] `B3-20` Preserve booking form state through auth redirect
  Scope: booking form, login redirect, client persistence.
  Why: being forced to log in should not erase a half-completed booking.
  Change: persist the form state locally before redirect and restore it after auth return.
  Done when: login interruptions do not force customers to re-enter item and address details.

- [ ] `B3-21` Customer booking detail share action
  Scope: booking detail page, mobile share sheet, copy.
  Why: users often need to share booking details with family, building managers, or recipients.
  Change: add a native-friendly share action with a safe summary and direct link where appropriate.
  Done when: a customer can share booking details in one tap on mobile.

- [ ] `B3-22` “Book a similar trip” CTA after completion
  Scope: completed booking detail state, search prefill behavior.
  Why: repeat usage should be easy for customers who have a second bulky-item job soon after a successful booking.
  Change: offer a one-tap path back to search using the prior route and item defaults as a starting point.
  Done when: repeat demand has a native product path instead of relying on memory.

- [ ] `B3-23` Booking confirmation screen cleanup
  Scope: post-booking redirect path, booking detail intro state, messaging.
  Why: the moment after booking should reassure the customer about what happens next.
  Change: refine the initial booking confirmation experience around response window, payment state, and next milestones.
  Done when: the first post-booking screen answers “what happens now?”

- [ ] `B3-24` Post-booking preparation checklist
  Scope: booking detail page, lifecycle emails, job-day readiness copy.
  Why: customers need guidance on how to prepare proof access, pickup contacts, and building constraints before trip day.
  Change: add a simple checklist that updates by booking status and can be reused in reminder emails.
  Done when: customers are more prepared and carriers encounter fewer avoidable pickup problems.

- [ ] `B3-25` Lifecycle email set beyond booking receipt
  Scope: notifications system, templates, status triggers.
  Why: transactional trust depends on timely, high-signal lifecycle communication.
  Change: add confirmation, pickup, transit, delivered, completion, dispute, and cancellation templates with consistent tone and structured content.
  Done when: the major lifecycle moments each have a deliberate email template instead of generic copy.

- [ ] `B3-26` Customer notification center
  Scope: new customer settings page or account area, saved searches, booking alerts.
  Why: users need a simple place to understand what notifications they may receive and which searches/bookings are active.
  Change: centralize saved search alerts and booking lifecycle notification expectations into one account surface.
  Done when: notification behavior is transparent and manageable.

- [ ] `B3-27` Print layout polish for booking detail
  Scope: booking detail print CSS, receipt section, page composition.
  Why: once print/PDF exists, the layout must actually look professional in print mode.
  Change: strip navigation noise, preserve key sections, and tune spacing and typography for print output.
  Done when: browser print output looks intentional rather than accidental.

- [ ] `B3-28` Customer support escalation CTA
  Scope: booking detail page, dispute states, failed payment states.
  Why: some situations need human help, and the path should be visible but not dominant.
  Change: add contextual support CTAs for payment trouble, overdue pending response, and active dispute states.
  Done when: customers know when and how to get help without leaving the app feeling stuck.

- [ ] `B3-29` Customer messaging around stairs/helper add-ons
  Scope: booking form, price breakdown, FAQ content.
  Why: add-on charges are predictable to the business but not always to the customer.
  Change: make the conditions for stairs and helper fees unmistakably clear where those toggles are chosen.
  Done when: customers understand why selecting those options changes the price.

- [ ] `B3-30` SMS fallback opt-in for critical booking milestones
  Scope: customer profile/contact preferences, notification strategy, future provider integration.
  Why: email is fine for most cases, but missed day-of updates are costly.
  Change: add a backlog item for optional SMS alerts on confirmation, pickup, and delivery milestones without making SMS the default.
  Done when: the product has a clear plan and surface for high-value SMS alerts.

---

## Batch 4 — Admin Ops, Marketplace Control, and Supply-Demand Steering (30)

**Objective:** give the team the minimum viable operating system required to run a trustworthy marketplace without drowning in ad hoc manual work.

### Admin Queue And Incident Handling

- [ ] `B4-01` Ops booking-event viewer
  Scope: admin booking detail or new ops viewer, booking events rendering, filters.
  Why: lifecycle debugging should not require raw DB inspection.
  Change: build an admin event viewer that shows booking events, payment events, manual overrides, and timestamps in one chronological stream.
  Done when: most booking investigations can happen from the product UI.

- [ ] `B4-02` Admin carrier verification bulk actions
  Scope: verification queue, selection state, batch API handling.
  Why: once carrier review volume grows, one-by-one decisions will slow supply too much.
  Change: support multi-select approve/reject flows with shared notes and confirmation safety.
  Done when: admins can clear obvious verification batches quickly without sacrificing control.

- [ ] `B4-03` Admin carrier list filters and search
  Scope: admin carrier pages, query params, list UI.
  Why: a growing carrier base becomes unmanageable without verification-state and suburb filters.
  Change: add filters for submitted, verified, rejected, missing docs, service suburb, and recent activity.
  Done when: ops can find the exact carrier segment they need in seconds.

- [ ] `B4-04` Admin booking list filters and search
  Scope: admin bookings page, filters, pagination, search fields.
  Why: support work gets expensive fast if operators cannot isolate the exact booking state or corridor in question.
  Change: add filters for status, payment status, age, dispute presence, corridor, and booking reference.
  Done when: admin booking triage is fast enough for daily ops rather than spreadsheet workarounds.

- [ ] `B4-05` Verification badges in admin carrier lists
  Scope: admin carrier list UI, carrier row model, badge system.
  Why: status visibility should be instant, not buried in detail rows.
  Change: display consistent badges for verification status, document completeness, and trust exceptions.
  Done when: admins can visually scan queue state before opening details.

- [ ] `B4-06` Admin carrier detail drawer
  Scope: carrier admin surfaces, reusable drawer/dialog pattern.
  Why: verification and support reviews are faster when key context appears in-place.
  Change: add a side drawer or modal with carrier profile, vehicle, documents, notes, and recent bookings.
  Done when: ops can inspect a carrier without losing queue position.

- [ ] `B4-07` Document preview hardening after the active modal work lands
  Scope: dialog UX, keyboard handling, zooming, PDF/image variants, mobile admin behavior.
  Why: the first modal implementation will solve access, but not necessarily usability for real review work.
  Change: add pagination, zoom, file-type handling, and solid mobile close/focus behavior to the admin preview pattern.
  Done when: document review feels production-ready across image and PDF documents.

- [ ] `B4-08` Verification checklist presets and rejection macros
  Scope: verification queue, note presets, email copy.
  Why: consistent review language speeds up supply approval while keeping standards legible.
  Change: add reusable notes/macros such as “insurance unreadable,” “rego mismatch,” and “service area too broad for MVP.”
  Done when: verification decisions are faster and more consistent across admins.

- [ ] `B4-09` Open disputes filtered views
  Scope: admin disputes page, age/status/category filters, views.
  Why: not all disputes deserve the same urgency or handling path.
  Change: support filtered views by category, age, status, payout impact, and evidence completeness.
  Done when: high-risk disputes surface ahead of low-risk ones.

- [ ] `B4-10` Dispute response macro library
  Scope: admin dispute actions, template notes, lifecycle emails.
  Why: common dispute outcomes should not require writing from scratch every time.
  Change: define macros for “waiting on evidence,” “resolved in customer favor,” “resolved in carrier favor,” and “closed with no action.”
  Done when: dispute communication is faster and more consistent.

- [ ] `B4-11` Dispute evidence bundle download
  Scope: admin disputes page, private file access, document assembly.
  Why: some cases need a portable evidence packet for offline review or legal/safety escalation.
  Change: allow ops to download a bundle or summary package containing notes, proof links, and timeline data.
  Done when: dispute evidence can be exported cleanly for serious cases.

- [ ] `B4-12` Pending-over-2-hours exception dashboard
  Scope: admin dashboard, bookings queries, review queue.
  Why: stale pending bookings are one of the highest-value exceptions to spot early.
  Change: add a dedicated surface for pending bookings approaching or breaching the response window.
  Done when: “carrier never responded” stops being a hidden operational surprise.

- [ ] `B4-13` Payment-failed exception dashboard
  Scope: admin dashboard, booking/payment filters, support actions.
  Why: failed payments create revenue loss and customer confusion if they are not visible quickly.
  Change: surface recent failed authorizations, affected bookings, retry state, and customer contact options.
  Done when: ops can actively clear payment failures instead of discovering them reactively.

- [ ] `B4-14` Proof-missing and proof-mismatch queue
  Scope: booking events, proof upload data, admin ops view.
  Why: missing proof or suspicious proof directly undermines trust on delivered jobs.
  Change: create an admin view for bookings that crossed operational milestones without required proof or with incomplete proof attachments.
  Done when: proof integrity can be monitored as an ops queue, not just through random support escalations.

### Supply-Demand Steering And Analytics

- [ ] `B4-15` Saved-search demand heatmap by lane
  Scope: saved searches data, admin dashboard, corridor aggregation.
  Why: the marketplace should deliberately recruit supply where demand is already visible.
  Change: aggregate saved searches by origin/destination corridor and date window to show real unmet demand.
  Done when: supply outreach can prioritize the strongest unmet lanes.

- [ ] `B4-16` Supply gap dashboard
  Scope: saved searches, active listings, bookings, admin analytics.
  Why: the product wedge lives or dies on matching genuine spare capacity to observed demand.
  Change: compare saved-search demand against live supply and completed bookings by corridor and item type.
  Done when: the team can see where supply is missing, weak, or converting poorly.

- [ ] `B4-17` Fill-rate by suburb pair
  Scope: admin analytics, listing/bookings aggregation.
  Why: route-level learning is more valuable than global vanity metrics in the MVP stage.
  Change: calculate how often demand on a given suburb pair finds supply and completes successfully.
  Done when: corridor performance can be reviewed at the lane level, not only marketplace-wide.

- [ ] `B4-18` Repeat-carrier cohort reporting
  Scope: carrier analytics, dashboard metrics, cohort definitions.
  Why: repeat supply is a stronger signal than one-time onboarding volume.
  Change: measure weekly active carriers, repeat posters, repeat completers, and churned carriers by cohort.
  Done when: supply health is assessed through retained behavior rather than signups alone.

- [ ] `B4-19` Email delivery diagnostics view
  Scope: notifications data, admin support tooling, send results logging.
  Why: lifecycle trust depends on whether critical emails were actually sent or skipped.
  Change: log and surface send/skipped/error states for transaction emails by booking or saved search.
  Done when: support can answer “did we email them?” from the product.

- [ ] `B4-20` Notification template previewer
  Scope: admin tools, email templates, preview data.
  Why: ops and founders need to see lifecycle communications without waiting for a real trigger.
  Change: build a preview tool for booking confirmation, verification decisions, disputes, and saved-search alerts.
  Done when: template quality can be reviewed and iterated safely in-app.

- [ ] `B4-21` Admin outbound note composer
  Scope: admin booking/dispute surfaces, communications layer, notes audit.
  Why: ops sometimes needs to send a contextual manual update without leaving the product.
  Change: provide a limited admin composer for sending logged notes to customer or carrier from the relevant record.
  Done when: manual comms can be sent from inside moverrr with an audit trail.

- [ ] `B4-22` Admin audit log table
  Scope: new DB table with RLS/service-role patterns, admin writes, UI viewer.
  Why: verification, refunds, overrides, and dispute outcomes should be traceable.
  Change: capture admin actor, action type, entity id, notes, and timestamp for sensitive marketplace actions.
  Done when: key ops actions have a durable audit trail outside generic booking events.

- [ ] `B4-23` Multi-role admin permissions
  Scope: auth model, admin checks, UI gating, DB policy review.
  Why: a production marketplace will eventually need more than one all-powerful admin role.
  Change: define lightweight roles such as support, verification, and finance with least-privilege access.
  Done when: the ops layer can grow without relying on a single super-admin list.

- [ ] `B4-24` CSV export suite
  Scope: admin bookings/carriers/disputes views, export jobs, data formatting.
  Why: finance, ops reviews, and manual analysis still need spreadsheet exports at MVP stage.
  Change: add scoped CSV exports for bookings, carriers, disputes, and supply-demand analytics segments.
  Done when: admins can export clean datasets without raw DB access.

- [ ] `B4-25` Bootstrap dataset expansion
  Scope: local bootstrap tool, seed data, demo scenarios.
  Why: serious QA needs more than a single happy-path demo set.
  Change: expand deterministic demo data to cover cancelled, disputed, full-capacity, failed-payment, and expired-pending cases.
  Done when: QA and founder reviews can reliably exercise the main edge cases locally.

- [ ] `B4-26` Ops daily digest email
  Scope: scheduled job, analytics summaries, admin notifications.
  Why: a lightweight marketplace still needs a heartbeat summary without opening dashboards constantly.
  Change: send a daily digest covering new carriers, active listings, new bookings, stale pending jobs, disputes, and saved-search demand hotspots.
  Done when: the team gets a meaningful daily operating snapshot automatically.

- [ ] `B4-27` Webhook replay console
  Scope: Stripe incident handling, admin tools, replay safety.
  Why: some payment failures require intentional replay or verification, not raw log digging.
  Change: add a controlled ops tool or documented flow for replaying or reconciling webhook-driven payment state.
  Done when: webhook recovery is a deliberate process rather than improvised shell work.

- [ ] `B4-28` Fraud and risk flags
  Scope: booking records, carrier records, admin surfaces, manual review workflow.
  Why: even small marketplaces need a place to mark suspicious actors or jobs before problems compound.
  Change: support manual risk flags such as repeat cancellations, proof anomalies, payment issues, or identity concerns.
  Done when: risky records can be marked, filtered, and handled intentionally.

- [ ] `B4-29` Manual refund and capture controls
  Scope: admin finance surfaces, Stripe helpers, audit logging.
  Why: some edge cases require ops-controlled money actions rather than purely automatic behavior.
  Change: expose guarded admin actions for refund and capture with reason logging and permission checks.
  Done when: finance exceptions can be handled safely from within product tooling.

- [ ] `B4-30` Incident response runbook and drill
  Scope: ops docs, release checklist, escalation paths.
  Why: production readiness is not just code; the team needs practiced responses to major failures.
  Change: define drills for payment outage, upload failure, maps outage, saved-search spam, and bad carrier verification.
  Done when: the team has a concrete incident playbook and has rehearsed the top production failures.

---

## Batch 5 — Production Hardening, iOS Reality, QA, and Launch Discipline (30)

**Objective:** make moverrr resilient enough to ship, support, and iterate like a serious product while keeping the iOS-first experience tight.

### Session, Network, And Device Reliability

- [ ] `B5-01` Long-session auth refresh
  Scope: auth provider/hooks, middleware/session handling, mobile dwell behavior.
  Why: customers and carriers will keep the app open across real-world gaps, not idealized short sessions.
  Change: refresh auth tokens proactively during long-lived sessions and handle expiry without surprise logouts.
  Done when: long mobile sessions survive ordinary use without silent auth failure.

- [ ] `B5-02` Upload retry and resume semantics
  Scope: upload helpers, onboarding uploads, proof uploads, client UX.
  Why: intermittent mobile networks turn uploads into a frequent frustration point.
  Change: add clear retry flows, resumable patterns where feasible, and honest error states for interrupted uploads.
  Done when: a transient upload failure does not force the user to restart the whole action blindly.

- [ ] `B5-03` Offline and poor-network banners
  Scope: shared layout, key forms, API error handling.
  Why: mobile users need feedback when the problem is connectivity, not the form they just filled out.
  Change: detect offline or degraded connectivity and show lightweight banners plus calmer error messaging.
  Done when: network-related failures feel diagnosable instead of random.

- [ ] `B5-04` Mobile Safari keyboard avoidance audit
  Scope: sticky footers, forms, safe-area handling, modal layouts.
  Why: iOS Safari introduces real layout edge cases once the keyboard opens on small screens.
  Change: audit search, booking, onboarding, and carrier wizard flows for obscured CTAs and jumpy scroll behavior.
  Done when: core mobile forms remain usable with the keyboard open.

- [ ] `B5-05` Safe-area audit for all sticky and fixed elements
  Scope: global styles, sticky bars, headers, footers, dialogs.
  Why: safe-area bugs are easy to miss on desktop and extremely visible on iPhone.
  Change: ensure every sticky/fixed element respects `env(safe-area-inset-bottom)` or related inset rules where appropriate.
  Done when: no bottom CTA or top control collides with iOS hardware or browser chrome.

- [ ] `B5-06` Deep-link and share-sheet readiness
  Scope: route structure, share targets, metadata, mobile actions.
  Why: marketplace growth will depend on links being shared between people and across devices.
  Change: define the routes and metadata necessary for clean deep links into search, trip detail, booking detail, and carrier pages.
  Done when: key flows are linkable and shareable in a mobile-native way.

### Infra, Security, And Configuration Hardening

- [ ] `B5-07` Content security and allowed-origin audit
  Scope: middleware, Next config, external integrations, upload paths.
  Why: a production app should be deliberate about where requests, scripts, and assets can originate.
  Change: review and tighten origins, script dependencies, and external access patterns without breaking required integrations.
  Done when: external surface area is explicit and minimal.

- [ ] `B5-08` `.env.example` and environment docs completion
  Scope: root docs, env declarations, setup guidance.
  Why: production readiness and contributor onboarding both suffer when env requirements are tribal knowledge.
  Change: document every required and optional environment variable, what it powers, and what graceful degradation is expected locally.
  Done when: a new contributor can configure moverrr without reverse-engineering source files.

- [ ] `B5-09` CI workflow for lint, typecheck, tests, and migration sanity
  Scope: GitHub Actions or equivalent, package scripts, Supabase local checks.
  Why: production confidence needs automated gates, not manual memory.
  Change: define CI to run `npm run check`, relevant test suites, and lightweight migration validation on every PR.
  Done when: the main branch has machine-enforced quality gates.

- [ ] `B5-10` Vitest setup and coverage baseline
  Scope: `package.json`, `vitest.config.ts`, first test folders, coverage reporting.
  Why: reliability work is blocked without a consistent test runner.
  Change: add Vitest, wire scripts, and define a baseline coverage plan around pricing, status, matching, and booking integrity.
  Done when: the repo can run fast tests locally and in CI with a clear expansion path.

- [ ] `B5-11` Matching score test suite
  Scope: `src/lib/matching/score.ts`, ranking expectations, edge cases.
  Why: browse quality is core product logic and should not drift silently.
  Change: test eligibility cutoffs, score weighting, and expected ordering across realistic route scenarios.
  Done when: match behavior is intentionally encoded and regression-safe.

- [ ] `B5-12` RLS and permissions audit tests
  Scope: Supabase policies, admin/service-role boundaries, docs.
  Why: marketplace trust also means getting access control right as the schema grows.
  Change: define a review and test plan that verifies RLS coverage on new and existing tables.
  Done when: policy regressions are caught before deployment.

- [ ] `B5-13` Migration smoke test script
  Scope: local dev scripts, Supabase workflow, release checklist.
  Why: schema safety degrades quickly when migrations are authored but not exercised end-to-end.
  Change: create a repeatable smoke path for reset, migrate, and minimal data validation on local Supabase.
  Done when: migration safety is a repeatable step, not a best-effort habit.

- [ ] `B5-14` Database backup and restore runbook
  Scope: ops docs, hosting context, recovery procedures.
  Why: production readiness includes knowing how to recover from operator error or bad migrations.
  Change: document backup cadence, restore steps, owner responsibilities, and validation checks after restore.
  Done when: recovery is documented clearly enough to execute under pressure.

- [ ] `B5-15` Edge function and cron monitoring
  Scope: Supabase functions, scheduled jobs, alerts, error logging.
  Why: once background jobs exist, silent failure becomes a serious product risk.
  Change: define heartbeat monitoring and error alerts for booking expiry, saved-search alerts, digests, and other scheduled work.
  Done when: background automation failures are surfaced promptly.

### Observability, Performance, And QA Discipline

- [ ] `B5-16` Sentry instrumentation sweep
  Scope: search, booking, upload, saved-search, admin, notification, and payment paths.
  Why: production bugs should arrive with context, not mystery.
  Change: capture high-value failures consistently with feature, action, and entity tags across the major workflows.
  Done when: the top failure modes are observable with enough context to debug fast.

- [ ] `B5-17` Performance budget and bundle analysis
  Scope: Next build outputs, client bundles, route-level costs.
  Why: a browse-first mobile marketplace cannot feel sluggish on first meaningful use.
  Change: measure route bundles, define performance budgets, and prune unnecessary client weight.
  Done when: the team knows which routes are too heavy and what the acceptable target is.

- [ ] `B5-18` Image and font optimization pass
  Scope: global assets, image rendering, font loading strategy, layout stability.
  Why: visual trust and performance both benefit from deliberate asset loading.
  Change: optimize fonts, ensure images are correctly sized and cached, and reduce unnecessary layout shift.
  Done when: asset loading is deliberate and mobile-first rather than incidental.

- [ ] `B5-19` Slow-query logging and index review
  Scope: Supabase queries, search RPC, admin list pages, dashboard aggregation.
  Why: production load issues often start as “feels slow sometimes” long before they become outages.
  Change: identify the heaviest queries, capture latency, and add indexes or caching where justified.
  Done when: the slowest routes have known causes and a tuning plan.

- [ ] `B5-20` Synthetic monitoring for critical journeys
  Scope: production or staging monitoring, smoke accounts, route checks.
  Why: uptime is not enough; the important thing is whether booking/search actually works.
  Change: define synthetic checks for landing → search, trip detail render, booking create, and admin login.
  Done when: the team is alerted when a critical user journey breaks even if the app still “loads.”

- [ ] `B5-21` Manual QA scripts for iPhone form factors
  Scope: QA docs, release checklist, responsive audit.
  Why: the product is iOS-first, so manual validation should reflect that reality.
  Change: define explicit QA scripts for iPhone SE width, current standard iPhone size, and larger-device safe-area behavior.
  Done when: releases are checked against real mobile expectations instead of desktop assumptions.

- [ ] `B5-22` Smoke seed data and synthetic fixtures
  Scope: bootstrap tooling, demo data, QA environments.
  Why: repeatable QA requires deterministic fixture states, not ad hoc data setup.
  Change: expand smoke seeds to support search-rich, payment-failed, dispute-heavy, and supply-light scenarios.
  Done when: demo and QA environments can be set up quickly for common review cases.

- [ ] `B5-23` Accessibility regression checks after the active audit lands
  Scope: test tooling, manual QA checklist, future axe integration.
  Why: one audit is not enough; accessibility quality regresses unless checked repeatedly.
  Change: add a minimal regression process or tooling layer to keep labels, tap targets, skip links, and contrast from slipping.
  Done when: accessibility is maintained as a living standard rather than a one-time cleanup.

- [ ] `B5-24` Release checklist and staged rollout process
  Scope: docs, CI, migration discipline, monitoring checks.
  Why: production confidence comes from process as much as code.
  Change: define the exact order for migrations, smoke tests, env checks, synthetic checks, and rollback decisions before shipping.
  Done when: releases follow a repeatable staged process rather than improvisation.

- [ ] `B5-25` Privacy policy, terms, and carrier agreement pages
  Scope: marketing/legal pages, footer navigation, onboarding references.
  Why: a real marketplace handling payments, documents, and proof photos needs a trustworthy legal baseline.
  Change: create product-aligned legal pages and link to them in auth, onboarding, and footer surfaces.
  Done when: the product has first-party legal surfaces appropriate for launch.

- [ ] `B5-26` Data retention and deletion tooling
  Scope: user account handling, proof uploads, saved searches, admin workflows.
  Why: production readiness includes knowing what data is kept, why, and how to remove it.
  Change: define retention rules for proofs, disputes, saved searches, and inactive accounts, plus an admin/user deletion flow where appropriate.
  Done when: data lifecycle is documented and implementable.

- [ ] `B5-27` App Store content and launch asset checklist
  Scope: product marketing materials, screenshots, copy, trust messaging.
  Why: even if web is the dev shell, the real product context is iOS distribution and positioning.
  Change: define screenshot needs, review text, trust copy, marketplace explanation, and onboarding visuals required for launch readiness.
  Done when: launch collateral requirements are explicit enough to execute without starting from zero.

- [ ] `B5-28` Launch scorecard dashboard
  Scope: admin analytics, weekly metrics, completed bookings, active carriers, saved-search demand.
  Why: the team needs a sharp read on whether moverrr is actually approaching the MVP success criteria.
  Change: define a scorecard around active verified carriers, weekly posted trips, completed jobs, dispute rate, and saved-search demand matched.
  Done when: founders can answer “are we closer to MVP proof?” from one view.

- [ ] `B5-29` Weekly operating review cadence
  Scope: docs, metric definitions, founder workflow.
  Why: early marketplaces win by tight weekly learning loops, not by collecting dashboards no one reviews.
  Change: define the weekly review ritual covering supply, demand, conversion, disputes, retention, and launch blockers.
  Done when: backlog priority can be updated from a disciplined operating rhythm.

- [ ] `B5-30` Degraded-mode product checklist
  Scope: docs, env fallback behavior, user messaging.
  Why: parts of moverrr are intentionally graceful in local dev, but production also needs a plan for partial outages.
  Change: document how the product should behave during maps issues, email outages, upload trouble, webhook lag, or saved-search job failures.
  Done when: degraded-mode behavior is an intentional product stance rather than accidental behavior.

---

## Summary By Batch

- Batch 1: protect trust in bookings, payments, proofs, disputes, and operational truth.
- Batch 2: make carriers faster to onboard, easier to retain, and more willing to repost real spare-capacity routes.
- Batch 3: improve browse quality, search conversion, and customer confidence without drifting into quote-led behavior.
- Batch 4: give the team the ops layer required to run a real marketplace with small-team leverage.
- Batch 5: harden moverrr for production, iOS usage reality, and disciplined launch execution.

## Definition Of “Backlog Ready”

Each item above should only be marked done when:

- the change still respects browse-first spare-capacity positioning
- iOS-first interaction rules have been checked
- database additions have RLS and correct indexing where relevant
- pricing math has not been altered accidentally
- `npm run check` passes
- `completed.md` is updated with the implementation record
