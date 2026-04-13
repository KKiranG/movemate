# moverrr — Active Backlog

> Last refreshed: `2026-04-12` — rebuilt against `/Users/kiranghimire/Documents/moverrr/claude-moverrr-governing-product-blueprint.md`
> Format governed by `TASK-RULES.md`. Move completed work to `completed.md` and never mark items done here.
> This backlog is a blueprint realignment pass. Preserve only work that strengthens the need-first, match-ranked, trust-structured spare-capacity marketplace.

---

## Blueprint Locks

- moverrr is a **need-first, match-ranked spare-capacity marketplace**. It is not a browse-first inventory product, quote board, bidding loop, dispatch layer, or removalist suite.
- The customer declares a move need first. The system returns a ranked answer set with deterministic total pricing, fit labels, trust signals, and a mandatory "Why this matches" explanation.
- The carrier experience is state-aware and action-led. Home is a work queue, not an analytics dashboard.
- Alert the Network replaces dead-end zero-result flows. Founder concierge is part of MVP but must route through system entities.
- Payment flow target: authorize on request submission, capture on acceptance, hold through fulfilment, release on customer confirmation or `72` hours after valid proof if no dispute exists.

## Working Assumptions

- `TASK-RULES.md` format takes precedence for every task item.
- `completed.md` stays untouched during this backlog rewrite.
- When the governing blueprint conflicts with older code, docs, or planning notes, the blueprint wins.
- The pricing direction is locked to **platform fee + GST in the customer total**. The old flat `$5` booking fee model is treated as superseded.
- Detour handling remains partially ambiguous in the blueprint. This backlog assumes detour estimation is allowed for eligibility, ranking, and explanation, but automatic detour-cost pricing needs an explicit founder decision before implementation.

## Coverage Notes

- Sections `1` through `17` of the governing blueprint are represented in active or deferred work below.
- P0 and P1 focus on product-shape correction and core model restructuring before polish or optimization work.
- P4 keeps later-phase work isolated so it does not leak back into the MVP queue.

---

## 🔴 P0 — Production Blocking

### Product / Scope Corrections

- [ ] **B07** — Demote public carrier storefront discovery as a primary customer path
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx`, `src/app/page.tsx`, `src/components/trip/trip-card.tsx`
  - **What:** Remove or demote public carrier-profile loops that encourage browsing carriers outside a declared move need.
  - **Why:** The blueprint allows trust context, but not profile storefronts as the primary discovery model.
  - **Done when:** Carrier profile pages no longer act as a top-level discovery surface and are reached only from contextual trust flows.

### Data Model and Backend Logic

- [ ] **D04** — Add `ConditionAdjustment` as a one-round structured exception entity
  - **File(s):** `new file: supabase/migrations/019_condition_adjustments.sql`, `src/types/database.ts`, `new file: src/types/condition-adjustment.ts`
  - **What:** Model one structured post-arrival adjustment with predefined reason, amount, and customer response state.
  - **Why:** The blueprint permits one structured adjustment path while rejecting open negotiation.
  - **Done when:** The schema and types support a single condition adjustment per booking with a clear accepted or rejected outcome.

- [ ] **D06** — Add `ConciergeOffer` to keep founder fulfilment on-platform
  - **File(s):** `new file: supabase/migrations/021_concierge_offers.sql`, `src/types/database.ts`, `src/lib/data/admin.ts`
  - **What:** Introduce a concierge-offer entity that links an unmatched request to an operator-sourced carrier and proposed price.
  - **Why:** The blueprint allows manual founder fulfilment only if it still flows through system entities and booking states.
  - **Done when:** Concierge offers can be created, tracked, and routed into the normal acceptance flow without off-platform bookkeeping.

- [ ] **D07** — Add `OperatorTask` for unmatched demand and stale-supply follow-up
  - **File(s):** `new file: supabase/migrations/022_operator_tasks.sql`, `src/types/database.ts`, `src/lib/data/admin.ts`
  - **What:** Create an operator-task model for unmatched requests, stale trip follow-up, and dispute/payout intervention work.
  - **Why:** The blueprint depends on a founder/operator queue to keep sparse supply and disputes alive.
  - **Done when:** Operator tasks can be generated, assigned, and resolved against unmatched requests and trust-critical incidents.

- [ ] **D08** — Reshape `Trip` for waypoints, route polyline, detour tolerance, recurrence, and freshness
  - **File(s):** `new file: supabase/migrations/023_trip_realignment.sql`, `src/types/trip.ts`, `src/lib/data/mappers.ts`
  - **What:** Extend the trip model to include route polyline data, up to two waypoints, recurrence metadata, detour tolerance, and freshness check-in fields.
  - **Why:** The current listing shape cannot fully support the blueprint’s matching, operations, and freshness rules.
  - **Done when:** Trip records can represent the route, tolerance, recurrence, and freshness signals the blueprint requires.

- [ ] **D09** — Replace booking and payment enums with the blueprint state machines
  - **File(s):** `new file: supabase/migrations/024_booking_state_realignment.sql`, `src/types/booking.ts`, `src/lib/status-machine.ts`
  - **What:** Introduce explicit booking, booking-request, and payment states that match the governing blueprint instead of the legacy direct-booking flow.
  - **Why:** State discipline is a product requirement, not a backend detail, and the current enums are too shallow.
  - **Done when:** TypeScript and database status enums align with the blueprint’s request, booking, payment, and unmatched-request transitions.

- [ ] **D10** — Store ratings as individual records with future display hooks
  - **File(s):** `new file: supabase/migrations/025_ratings_foundation.sql`, `src/types/review.ts`, `src/lib/data/feedback.ts`
  - **What:** Preserve per-rating records and tags so trust display can remain thin at MVP while supporting later review surfaces.
  - **Why:** The blueprint defers written-review display, but not structured trust data collection.
  - **Done when:** Rating storage supports star scores, structured tags, and future moderation/display without aggregate-only shortcuts.

- [ ] **D11** — Separate activation state from optional trust boosters
  - **File(s):** `new file: supabase/migrations/026_verification_levels.sql`, `src/types/carrier.ts`, `src/lib/data/carriers.ts`
  - **What:** Replace the simple `is_verified` model with explicit activation status plus optional ABN and insurance flags.
  - **Why:** The blueprint distinguishes hard activation gates from optional trust enrichment and the code should reflect that.
  - **Done when:** Carrier records can separately express unverified, activation started, pending review, active, suspended, ABN verified, and insurance uploaded states.

- [ ] **D12** — Add alert and notification preference fields for customers and carriers
  - **File(s):** `new file: supabase/migrations/027_alert_preferences.sql`, `src/types/customer.ts`, `src/types/carrier.ts`
  - **What:** Add stored preferences for push, email, and in-app notifications tied to alerts, requests, and fulfilment events.
  - **Why:** Alert the Network and request-state flows rely on notification delivery as a core product behavior.
  - **Done when:** Preferences exist in schema and types and can gate downstream notification sends.

- [ ] **D14** — Add trip freshness fields and suspension reasons
  - **File(s):** `new file: supabase/migrations/030_trip_freshness.sql`, `src/types/trip.ts`, `src/lib/data/trips.ts`
  - **What:** Add 24-hour and 2-hour check-in state, timestamps, and suspension reason storage to trips.
  - **Why:** The blueprint makes freshness enforcement mandatory to avoid stale supply poisoning trust.
  - **Done when:** Trip records support deprioritised and suspended freshness states with auditable reasons.

- [ ] **D15** — Add carrier-home mode derivation fields or presenters
  - **File(s):** `src/types/carrier.ts`, `src/lib/data/carriers.ts`, `src/app/(carrier)/carrier/dashboard/page.tsx`
  - **What:** Define how carrier home mode is derived from activation, live trips, pending requests, today work, proof blockers, and payout blockers.
  - **Why:** The blueprint treats the state-aware carrier home as a core product mechanic, not an ad hoc page heuristic.
  - **Done when:** Carrier home mode can be derived consistently in one place and consumed by page presenters.

### Booking and Marketplace Logic

- [ ] **A01** — Split direct booking creation into `MoveRequest -> Offer -> BookingRequest`
  - **File(s):** `src/app/api/bookings/route.ts`, `src/lib/data/bookings.ts`, `src/lib/validation/booking.ts`
  - **What:** Replace the direct booking write path with a staged flow that creates move requests, matches offers, and then creates booking requests.
  - **Why:** The blueprint’s marketplace model depends on explicit request and offer layers instead of skipping straight to a booking.
  - **Done when:** Booking creation no longer writes a confirmed booking from trip detail without a move-request and booking-request step.

- [ ] **A02** — Add atomic Fast Match accept-and-revoke flow
  - **File(s):** `new file: src/app/api/booking-requests/fast-match/route.ts`, `src/lib/data/bookings.ts`, `src/lib/status-machine.ts`
  - **What:** Implement Fast Match so one accepted request confirms the booking and atomically revokes sibling requests in the same group.
  - **Why:** Fast Match is a locked product mechanic and race conditions would break trust for customers and carriers.
  - **Done when:** The first accepted Fast Match request wins, siblings revoke atomically, and both sides receive the correct outcome notifications.

- [ ] **A03** — Introduce booking-request deadlines with a 12-hour default
  - **File(s):** `new file: src/app/api/booking-requests/route.ts`, `src/lib/data/bookings.ts`, `src/types/booking-request.ts`
  - **What:** Add explicit response deadlines that default to 12 hours and can extend to 24 hours for flexible bookings.
  - **Why:** The blueprint replaces the current 2-hour pending-booking assumption with a request-centric response model.
  - **Done when:** New booking requests store and enforce response deadlines that match the governing default behavior.

- [ ] **A04** — Persist deterministic `match_class` values on offers
  - **File(s):** `src/lib/data/trips.ts`, `src/lib/matching/score.ts`, `src/lib/trip-presenters.ts`
  - **What:** Generate and store match classes like `direct`, `near_pickup`, `near_dropoff`, `nearby_date`, and `needs_approval`.
  - **Why:** The blueprint requires deterministic explanation templates and grouped result sections built on match class.
  - **Done when:** Every surfaced offer has a stable match class that drives explanation text and result grouping.

- [ ] **A05** — Persist fit-confidence output as a first-class match result
  - **File(s):** `src/lib/matching/score.ts`, `src/lib/trip-presenters.ts`, `src/types/trip.ts`
  - **What:** Replace ad hoc score interpretation with explicit `likely_fits`, `review_photos`, and `needs_approval` outputs.
  - **Why:** The customer-facing fit label is a required, explainable contract in the governing product.
  - **Done when:** Fit-confidence values are computed, stored, and rendered consistently across results, details, and request flows.

- [ ] **A06** — Replace search waitlist POST behavior with unmatched-request creation
  - **File(s):** `src/app/api/search/route.ts`, `new file: src/app/api/unmatched-requests/route.ts`, `src/components/customer/waitlist-form.tsx`
  - **What:** Remove the waitlist-style POST path and create an unmatched request whenever zero-match recovery is triggered.
  - **Why:** Alert the Network is an active demand-capture flow, not a passive waitlist.
  - **Done when:** Zero-match demand is stored as unmatched requests and no production flow writes a waitlist entry for customer recovery.

- [ ] **A07** — Add Alert the Network orchestration on zero-match outcomes
  - **File(s):** `src/lib/data/trips.ts`, `src/lib/notifications.ts`, `new file: src/lib/data/unmatched-requests.ts`
  - **What:** Trigger carrier nudges, rematch subscriptions, and customer alerts when a move request has no viable offer set.
  - **Why:** The blueprint makes zero-match recovery a mandatory continuation path instead of a dead end.
  - **Done when:** A zero-match move request creates unmatched demand, notifies relevant carriers, and subscribes the customer for follow-up.

- [ ] **A08** — Add concierge-offer acceptance inside the normal booking flow
  - **File(s):** `src/lib/data/admin.ts`, `new file: src/lib/data/concierge-offers.ts`, `src/app/(admin)/admin/dashboard/page.tsx`
  - **What:** Route operator-created concierge matches into the same booking-request and booking flow used for normal marketplace fulfilment.
  - **Why:** Founder concierge is allowed only if it does not create shadow ops or off-platform transaction paths.
  - **Done when:** Concierge offers can be created, accepted, and fulfilled without bypassing core payment, proof, or payout logic.

- [ ] **A10** — Enforce one-round condition adjustments with predefined reason codes and amounts
  - **File(s):** `src/lib/data/bookings.ts`, `src/lib/status-machine.ts`, `src/types/condition-adjustment.ts`
  - **What:** Limit condition adjustments to one structured round with controlled reasons and allowed amounts.
  - **Why:** The blueprint allows realism for misdescribed conditions without opening counterproposal loops.
  - **Done when:** The product blocks a second adjustment round and only allows platform-defined adjustment reasons and amounts.

- [ ] **A11** — Reshape payment lifecycle around authorization, capture, hold, release, and paid states
  - **File(s):** `src/lib/data/bookings.ts`, `src/lib/stripe/payment-actions.ts`, `src/types/booking.ts`
  - **What:** Replace the simplified payment model with blueprint-aligned request authorization, capture on accept, held funds, pending confirmation, release, and paid states.
  - **Why:** The current payment state model is too shallow to express the trust and payout mechanics the blueprint depends on.
  - **Done when:** Payment state transitions map cleanly to the request, proof, dispute, and payout lifecycle in code and persisted records.

- [ ] **A12** — Reshape payout release around valid proof plus a 72-hour dispute window
  - **File(s):** `src/lib/data/bookings.ts`, `src/lib/status-machine.ts`, `src/components/booking/confirm-receipt-button.tsx`
  - **What:** Update payout eligibility, auto-release timing, and blocked-state handling to match the 72-hour post-proof window in the governing blueprint.
  - **Why:** The codebase still mixes older payout timing assumptions and needs one consistent trust contract.
  - **Done when:** Payout release waits for customer confirmation or 72 hours after valid proof with no dispute, and blocks correctly on disputes.

### Pricing / Negotiation / Quoting

- [ ] **A13** — Replace the flat booking-fee pricing invariant with the blueprint pricing contract
  - **File(s):** `src/lib/pricing/breakdown.ts`, `src/lib/__tests__/breakdown.test.ts`, `.agent-skills/PRICING.md`
  - **What:** Rewrite pricing helpers and tests so customer totals are built from base price, structured add-ons, platform fee, and GST instead of a flat `$5` fee.
  - **Why:** The governing blueprint supersedes the older booking-fee model and the backlog must treat that as a hard correction.
  - **Done when:** Pricing code, tests, and local guidance all describe the same blueprint-aligned customer total and carrier payout math.

- [ ] **A14** — Flag detour-pricing ambiguity and block automatic detour-cost implementation pending founder decision
  - **File(s):** `src/lib/pricing/breakdown.ts`, `.agent-skills/PRICING.md`, `README.md`
  - **What:** Add an explicit backlog and code-contract guard that allows detour estimation for matching but prevents silent rollout of automatic detour pricing.
  - **Why:** The blueprint is internally inconsistent on detour pricing and this needs an explicit decision instead of accidental implementation drift.
  - **Done when:** Pricing code paths and docs treat detour pricing as blocked behind an explicit founder decision rather than assumed behavior.

- [ ] **A15** — Enforce total all-in pricing on every offer card
  - **File(s):** `src/components/trip/trip-card.tsx`, `src/components/trip/trip-detail-summary.tsx`, `src/components/booking/price-breakdown.tsx`
  - **What:** Make offer cards, detail pages, and request confirmation surfaces render the same total customer price contract, including required fees and GST.
  - **Why:** Price transparency on first impression is a non-negotiable product rule in the blueprint.
  - **Done when:** Offer cards, detail pages, and confirmation steps all render the same total price without "starting from" or base-only shortcuts.

- [ ] **A16** — Separate hard activation gates from optional trust boosters in trust displays
  - **File(s):** `src/app/(carrier)/carrier/onboarding/page.tsx`, `src/components/carrier/carrier-trust-panel.tsx`, `src/types/carrier.ts`
  - **What:** Ensure trust displays distinguish mandatory activation completion from optional ABN and insurance badges.
  - **Why:** The blueprint treats identity, vehicle, rules, and payout as gates while leaving ABN and insurance as optional enrichment.
  - **Done when:** Carrier trust and gating UI never imply optional trust boosters are required to go live.

- [ ] **A17** — Block publication and acceptance using activation status rather than a single `is_verified` flag
  - **File(s):** `src/lib/data/carriers.ts`, `src/app/api/trips/route.ts`, `src/app/api/booking-requests/[id]/route.ts`
  - **What:** Move publication and acceptance guards onto explicit activation status instead of the legacy boolean verification shortcut.
  - **Why:** The governing product needs more precise gating semantics than a single flag can express.
  - **Done when:** Trip publishing and request acceptance are denied unless the carrier is in the active activation state.

### Carrier Experience

- [ ] **B12** — Remove the carrier stats page from primary MVP IA
  - **File(s):** `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/(carrier)/carrier/stats/page.tsx`
  - **What:** Remove Stats from primary carrier navigation and demote the page behind deferred or admin-only access.
  - **Why:** The blueprint explicitly rejects analytics-first carrier navigation in MVP.
  - **Done when:** Carrier primary navigation no longer includes Stats and the page is not used as a core workflow.

- [ ] **B13** — Rebuild carrier home hero priority around urgent action states
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/lib/data/bookings.ts`, `src/components/carrier/live-bookings-list.tsx`
  - **What:** Restructure carrier home so the hero always chooses between pending request, today work, proof needed, or payout blocked in that order.
  - **Why:** The governing blueprint defines the carrier home as a work queue disguised as a dashboard.
  - **Done when:** Carrier home surfaces the highest-priority action item first and de-emphasizes summary analytics.

- [ ] **B14** — Add a customer Alerts route to replace Saved searches
  - **File(s):** `new file: src/app/(customer)/alerts/page.tsx`, `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`
  - **What:** Create an Alerts page for unmatched demand, matched alerts, and expired alert history.
  - **Why:** The blueprint’s no-match model is alert-driven and needs a first-class customer destination.
  - **Done when:** Customers have an Alerts page in primary navigation and no primary nav item says Saved searches.

### Admin / Operator Tooling

- [ ] **A18** — Add an operator queue for unmatched demand and stale-supply follow-up
  - **File(s):** `src/lib/data/admin.ts`, `new file: src/lib/data/operator-tasks.ts`, `new file: src/app/(admin)/admin/alerts/page.tsx`
  - **What:** Create admin queries and a dedicated view for unmatched requests, stale trips, and manual follow-up actions.
  - **Why:** Sparse-supply MVP depends on founder/operator intervention being visible, structured, and auditable.
  - **Done when:** Admin can view and act on unmatched demand and stale-supply tasks in one operator queue.

- [ ] **A19** — Enforce trip freshness suspension in matching eligibility
  - **File(s):** `src/lib/data/trips.ts`, `src/lib/matching/filter.ts`, `src/app/api/search/route.ts`
  - **What:** Exclude or deprioritise trips that miss freshness check-ins based on the 24-hour and 2-hour blueprint rules.
  - **Why:** Stale supply is a trust-breaking failure mode that the product must handle upstream.
  - **Done when:** Unconfirmed trips are deprioritised and 2-hour no-response trips are suspended before they can surface in results.

---

## 🟠 P1 — User-Facing Bugs

### Customer Experience

- [ ] **B15** — Build the four-step need-declaration wizard on the home surface
  - **File(s):** `src/app/page.tsx`, `src/components/search/search-bar.tsx`, `src/lib/validation/booking.ts`
  - **What:** Replace the current generic search form with a four-step route, item, timing, and access wizard.
  - **Why:** The blueprint makes structured need declaration the first customer action and the foundation of quality matching.
  - **Done when:** Customers can declare route, item, timing, and access in a linear wizard before any results are shown.

- [ ] **B16** — Persist move-request draft state across wizard steps and returns
  - **File(s):** `src/components/search/search-bar.tsx`, `new file: src/hooks/useMoveRequestDraft.ts`, `src/app/page.tsx`
  - **What:** Save and restore partially completed move-request inputs so the customer can resume a need declaration without re-entry.
  - **Why:** Sparse-supply validation depends on not losing intent during a longer, more structured intake flow.
  - **Done when:** Moving between steps, leaving the page, and returning restores the in-progress move request safely.

- [ ] **B17** — Require structured place selection for both route endpoints
  - **File(s):** `src/components/search/search-bar.tsx`, `src/components/shared/google-autocomplete-input.tsx`, `src/lib/validation/booking.ts`
  - **What:** Require resolvable pickup and drop-off place data instead of loose suburb text before matching proceeds.
  - **Why:** The matching pipeline in the blueprint depends on real endpoint data, not approximate text-only guesses.
  - **Done when:** The wizard blocks progression until both route endpoints resolve to structured place data.

- [ ] **B18** — Replace item free-text-first entry with category, variant, and quantity selection
  - **File(s):** `src/components/search/search-bar.tsx`, `src/components/booking/booking-form.tsx`, `src/types/trip.ts`
  - **What:** Add structured item category, variant, and quantity entry as the main item-declaration path.
  - **Why:** The blueprint rejects free-text-first item capture because it weakens fit confidence and pricing trust.
  - **Done when:** Customers choose a structured category and variant before any optional free-text notes appear.

- [ ] **B19** — Make bulky-item photo upload mandatory before request submission
  - **File(s):** `src/components/booking/booking-form.tsx`, `src/app/api/upload/route.ts`, `src/lib/validation/booking.ts`
  - **What:** Enforce required photo upload for bulky categories during the request flow rather than leaving it optional.
  - **Why:** Photo-backed truth is a core guardrail against fit failures and day-of-job disputes.
  - **Done when:** Large Furniture, Appliances, Sporting / Outdoor, Mattress / Bed, and Other cannot submit without the required photo evidence.

- [ ] **B20** — Move structured access questions ahead of results and make them mandatory
  - **File(s):** `src/components/search/search-bar.tsx`, `src/lib/validation/booking.ts`, `src/app/(customer)/search/page.tsx`
  - **What:** Collect stairs, lift, helper, and parking state before the results request is made.
  - **Why:** The blueprint makes access truth part of matching eligibility, not a booking afterthought.
  - **Done when:** Results cannot load until the access step is complete and the request payload includes structured access facts.

- [ ] **B21** — Group search results into Top Matches, Possible Matches, and Nearby Dates
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/lib/data/trips.ts`, `src/components/trip/trip-card.tsx`
  - **What:** Replace the flat result list with blueprint-defined grouped sections based on match class and timing offset.
  - **Why:** The product should return an answer set, not a generic listing archive.
  - **Done when:** Search results render grouped sections with the correct offer membership and empty-state fallbacks.

- [ ] **B22** — Collapse Possible Matches and Nearby Dates by default
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/components/trip/trip-card.tsx`, `src/components/search/search-results-skeleton.tsx`
  - **What:** Keep weaker or offset offers collapsed until the customer expands them intentionally.
  - **Why:** The blueprint wants the strongest recommendations to lead without overwhelming customers with weaker supply.
  - **Done when:** Possible Matches and Nearby Dates render collapsed-by-default expansion rows on first load.

- [ ] **B23** — Generate and render "Why this matches" on every offer card
  - **File(s):** `src/components/trip/trip-card.tsx`, `src/lib/trip-presenters.ts`, `src/lib/data/trips.ts`
  - **What:** Add the deterministic explanation line to every surfaced offer card and remove cards that cannot explain themselves.
  - **Why:** Match explanation is a non-negotiable product rule and key trust mechanic.
  - **Done when:** Every result card contains a plain-language explanation derived from the offer’s match class and timing fit.

- [ ] **B24** — Replace current fit labels with the blueprint confidence language
  - **File(s):** `src/components/trip/trip-card.tsx`, `src/lib/matching/score.ts`, `src/lib/trip-presenters.ts`
  - **What:** Replace score-style or loose route-fit labels with `Likely fits`, `Review photos`, and `Needs approval`.
  - **Why:** The governing product chooses human fit confidence over opaque score-driven wording.
  - **Done when:** Result and detail surfaces use only the blueprint fit-confidence labels.

- [ ] **B25** — Hard-set Best fit ordering and remove browse-archive affordances
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/components/search/search-bar.tsx`, `src/lib/trip-presenters.ts`
  - **What:** Remove customer-facing ordering controls and archive-like affordances that imply self-service browsing.
  - **Why:** The blueprint says the system, not the user, should do the ranking work.
  - **Done when:** Search results behave as a ranked answer set with no exposed sorting or archive framing.

- [ ] **B26** — Replace "general furniture inventory" fallback with blueprint recovery actions
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/components/search/save-search-form.tsx`, `src/components/customer/waitlist-form.tsx`
  - **What:** Replace general-inventory fallbacks with broaden dates, view near matches, and Alert the Network actions.
  - **Why:** General inventory fallback reintroduces browse-first logic exactly where the product should capture need and keep intent alive.
  - **Done when:** Zero-match recovery no longer suggests broad inventory browsing and instead routes through blueprint recovery options.

- [ ] **B27** — Replace save-search empty state with Alert the Network capture
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/components/search/save-search-form.tsx`, `src/app/api/search/route.ts`
  - **What:** Turn the current save-search panel into an explicit alert capture flow tied to unmatched demand and rematch notifications.
  - **Why:** The blueprint defines zero-match capture as an alert system, not a passive saved query.
  - **Done when:** The no-match panel creates or updates an alert-backed unmatched request instead of a saved search.

- [ ] **B32** — Remove direct carrier-contact panels from customer booking detail
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/lib/data/bookings.ts`, `src/types/booking.ts`
  - **What:** Remove or replace the direct carrier contact panel with structured coordination history and on-platform status tools.
  - **Why:** The blueprint keeps communication on-platform at MVP to protect trust, disputes, and payment integrity.
  - **Done when:** Customer booking detail no longer renders direct carrier contact as a standard fulfilment tool.

### Carrier Experience

- [ ] **B33** — Split carrier onboarding into three blueprint steps
  - **File(s):** `src/app/(carrier)/carrier/onboarding/page.tsx`, `src/components/carrier/carrier-onboarding-form.tsx`, `src/app/(carrier)/carrier/onboarding/actions.ts`
  - **What:** Rebuild onboarding into Identity & Business, Vehicle & Capacity, and Payout & Documents steps with saved progress.
  - **Why:** The blueprint rejects the current single-form onboarding shape as too loose and not explicit enough about the activation gate.
  - **Done when:** Onboarding progress is step-based and each step maps to the governing blueprint sections.

- [ ] **B34** — Add activation progress and resume-later behavior to carrier home mode 1
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/components/carrier/carrier-onboarding-form.tsx`, `src/lib/data/carriers.ts`
  - **What:** Surface activation progress, dominant blocker, and resume setup actions on carrier home for incomplete carriers.
  - **Why:** The blueprint says mode 1 should feel like a focused unlock flow, not a half-empty dashboard.
  - **Done when:** Unactivated carriers land on a resume-setup home with progress and next-action guidance.

- [ ] **B35** — Add blurred teaser demand for unactivated carriers based on real data
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/lib/data/admin.ts`, `src/lib/data/carriers.ts`
  - **What:** Show corridor-level demand cues derived from real unmatched demand without exposing actionable jobs before activation.
  - **Why:** The blueprint uses teaser demand to motivate activation without weakening trust gates.
  - **Done when:** Unactivated carriers see real blurred demand counts and a CTA to complete setup to unlock them.

- [ ] **B36** — Rework carrier home mode 2 around posting the next route
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/components/carrier/quick-post-templates.tsx`, `src/lib/data/templates.ts`
  - **What:** Make the verified-no-live-trips home mode about one dominant post-trip action and quick repost from templates.
  - **Why:** The blueprint treats verified idle carriers as posting-ready, not analytics-ready.
  - **Done when:** Verified carriers with no active trips see a posting-led home with quick repost actions and corridor demand cues.

- [ ] **B37** — Replace analytics cards on carrier home mode 3 with urgent action cards
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/components/carrier/live-bookings-list.tsx`, `src/lib/data/bookings.ts`
  - **What:** Remove summary metric emphasis and lead with pending requests, today work, proof blockers, and payout blockers.
  - **Why:** The blueprint explicitly rejects analytics-first carrier homes during MVP.
  - **Done when:** Carrier home mode 3 foregrounds urgent actions and relegates summary metrics out of the hero zone.

- [ ] **B42** — Surface proof and payout blockers inline during trip-day operations
  - **File(s):** `src/app/(carrier)/carrier/today/page.tsx`, `src/app/(carrier)/carrier/payouts/page.tsx`, `src/lib/data/bookings.ts`
  - **What:** Show proof-required and payout-blocked states inside Today and Payouts with direct fix actions.
  - **Why:** The blueprint treats payout predictability as a carrier trust requirement, especially on run day.
  - **Done when:** Carriers can see and resolve proof and payout blockers from Today and Payouts without hunting through unrelated surfaces.

- [ ] **B43** — Replace trip-list labels from inventory language to operational state language
  - **File(s):** `src/app/(carrier)/carrier/trips/page.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/components/carrier/trip-list-skeleton.tsx`
  - **What:** Rename list groupings and empty states to Needs Action, Today, Upcoming, Drafts, Past, and Templates.
  - **Why:** The blueprint rejects flat inventory-led trip management and defines an operational state model instead.
  - **Done when:** Carrier trips are organized and labeled using the blueprint’s operational state buckets.

- [ ] **B44** — Add one-tap repost prompts from completed trips into templates
  - **File(s):** `src/components/carrier/save-trip-template-action.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/lib/data/templates.ts`
  - **What:** Prompt carriers to repost a completed route quickly and save or refresh the underlying template automatically.
  - **Why:** The blueprint treats quick repost and repeat corridors as growth infrastructure, not a side enhancement.
  - **Done when:** Completed trips surface a one-tap repost path that reuses the route as a template.

### Trust / Verification / Risk Controls

- [ ] **B45** — Replace vague trust copy with evidence-led statements across customer surfaces
  - **File(s):** `src/app/(customer)/trip/[id]/page.tsx`, `src/app/(marketing)/trust/page.tsx`, `src/components/trip/trip-detail-summary.tsx`
  - **What:** Rewrite customer trust messaging to reference verification, proof, held funds, payout rules, and dispute handling concretely.
  - **Why:** The blueprint says trust must come from structure, not copywriting gloss.
  - **Done when:** Customer-facing trust copy references real safeguards and removes vague promise language.

- [ ] **B46** — Replace carrier profile trust badges with blueprint signals
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx`, `src/components/carrier/carrier-trust-panel.tsx`, `src/lib/trip-presenters.ts`
  - **What:** Align trust badges to verified, new but verified, trip count, optional ABN, optional insurance, and proof-backed job signals.
  - **Why:** Current trust surfaces still mix storefront and generic badge logic with weak alignment to the governing model.
  - **Done when:** Carrier profiles and trust panels show the exact trust signals supported by the blueprint and current data model.

- [ ] **B47** — Hide public written reviews until rating volume meets blueprint thresholds
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx`, `src/lib/data/feedback.ts`, `src/types/review.ts`
  - **What:** Stop showing public written reviews until a carrier has the minimum rating volume required by the blueprint.
  - **Why:** The blueprint prefers "new but verified" over thin, misleading public review surfaces in MVP.
  - **Done when:** Public review display respects the minimum ratings threshold and falls back to verified/new trust messaging when needed.

- [ ] **B48** — Add structured included, not included, and add-on rules to trip detail
  - **File(s):** `src/components/trip/trip-detail-summary.tsx`, `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/validation/trip.ts`
  - **What:** Render carrier constraints and supported extras as explicit included / not included / add-on blocks rather than mixed prose.
  - **Why:** Clear service boundaries reduce disputes and are part of the product’s trust structure.
  - **Done when:** Trip detail shows structured service rules derived from carrier-configured constraints and add-ons.

- [ ] **B49** — Rewrite cancellation and misdescription policy blocks to match blueprint rules
  - **File(s):** `src/components/trip/trip-detail-summary.tsx`, `src/components/booking/booking-form.tsx`, `src/app/(marketing)/terms/page.tsx`
  - **What:** Align cancellation, misdescription, and dispute-policy copy to the bounded condition-adjustment and trust model in the governing blueprint.
  - **Why:** Policy copy is part of the product contract and must not describe superseded booking behavior.
  - **Done when:** Customer and carrier policy surfaces describe the same cancellation and misdescription rules as the blueprint.

- [ ] **B50** — Add structured parking difficulty handling to matching and trip rules
  - **File(s):** `src/lib/validation/booking.ts`, `src/components/search/search-bar.tsx`, `src/components/carrier/carrier-trip-wizard.tsx`
  - **What:** Promote parking difficulty from loose notes into structured request and carrier-rule inputs.
  - **Why:** Parking difficulty is a blueprint-defined access input that can affect fit and operational burden.
  - **Done when:** Customers declare parking difficulty structurally and carriers can express parking-related constraints or clarification needs.

### Frontend Architecture and State

- [ ] **B51** — Split customer navigation state around Home, Bookings, Alerts, and Account
  - **File(s):** `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/layout.tsx`
  - **What:** Refactor the customer nav state and routes so they reflect the governing information architecture instead of browse and saved-search concepts.
  - **Why:** The wrong top-level IA keeps dragging the experience back toward the wrong product shape.
  - **Done when:** Customer nav state, badges, and route highlighting align to the four blueprint destinations.

- [ ] **B52** — Split carrier navigation state around Home, Requests, Trips, Payouts, and Account
  - **File(s):** `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/layout.tsx`
  - **What:** Update carrier nav state to support the five blueprint destinations and remove stat/dashboard bias.
  - **Why:** Carrier IA is a core product decision, not a secondary polish issue.
  - **Done when:** Carrier nav renders the five blueprint destinations with correct active state and badge behavior.

- [ ] **B56** — Stop linking homepage and search results into public carrier storefront loops
  - **File(s):** `src/app/page.tsx`, `src/app/(customer)/search/page.tsx`, `src/app/(customer)/carrier/[id]/page.tsx`
  - **What:** Remove or demote carrier-profile deep links that take customers out of the need-first selection flow too early.
  - **Why:** Public profile loops encourage browsing people instead of solving the move problem.
  - **Done when:** Search and home flows no longer promote public carrier browsing ahead of move-request progression.

### API and Integration Changes

- [ ] **A26** — Add `POST /api/concierge-offers` for founder-initiated supply recovery
  - **File(s):** `new file: src/app/api/concierge-offers/route.ts`, `new file: src/lib/data/concierge-offers.ts`, `src/lib/data/admin.ts`
  - **What:** Add the operator-only API for creating concierge offers against unmatched requests.
  - **Why:** Founder manual fulfilment must stay visible and on-platform during MVP.
  - **Done when:** Operators can create concierge offers through a dedicated admin API backed by explicit schema and audit writes.

- [ ] **A27** — Add `PATCH /api/condition-adjustments/[id]` for customer accept or reject
  - **File(s):** `new file: src/app/api/condition-adjustments/[id]/route.ts`, `src/lib/data/bookings.ts`, `src/types/condition-adjustment.ts`
  - **What:** Create the customer response API for structured adjustments so the flow remains bounded and audited.
  - **Why:** Condition adjustments are a controlled exception path and need explicit state transitions.
  - **Done when:** Customers can accept or reject one adjustment through a dedicated API and the booking updates correctly.

- [ ] **A30** — Notify non-winning Fast Match carriers when another carrier accepts first
  - **File(s):** `src/lib/notifications.ts`, `src/lib/data/bookings.ts`, `new file: src/app/api/booking-requests/fast-match/route.ts`
  - **What:** Send explicit revocation outcomes to sibling Fast Match carriers when another carrier wins the request.
  - **Why:** Fast Match needs clean closure for all parties to avoid ghost requests and trust erosion.
  - **Done when:** Losing Fast Match carriers receive revocation notices tied to the winning acceptance event.

### Simplification / Removals

- [ ] **B58** — Remove Waitlist form usage from customer zero-match flows
  - **File(s):** `src/components/customer/waitlist-form.tsx`, `src/app/(customer)/search/page.tsx`, `src/app/api/search/route.ts`
  - **What:** Retire the waitlist form from customer recovery surfaces so it cannot be mistaken for the active marketplace demand flow.
  - **Why:** Waitlist semantics conflict with Alert the Network and founder concierge language.
  - **Done when:** No customer-facing no-match path renders or posts the waitlist form.

- [ ] **B64** — Add Alerts page sections for Active, Matched, and Expired demand
  - **File(s):** `new file: src/app/(customer)/alerts/page.tsx`, `new file: src/components/search/alerts-manager.tsx`, `new file: src/lib/data/unmatched-requests.ts`
  - **What:** Organize customer alerts into operational states so demand capture feels alive and understandable.
  - **Why:** Alert history needs explicit states if it is going to replace saved searches cleanly.
  - **Done when:** Customers can view active, matched, and expired alert items from a dedicated alerts manager.

- [ ] **B65** — Add Requests badge count to carrier nav and home
  - **File(s):** `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`
  - **What:** Surface pending-request counts where carriers decide their next action, not only inside deep pages.
  - **Why:** Requests are the highest-urgency carrier workflow and need explicit nav visibility.
  - **Done when:** Pending request counts render in carrier nav and home states with correct live or refreshed values.

- [ ] **B66** — Split live-bookings copy into pending requests versus active bookings
  - **File(s):** `src/components/carrier/live-bookings-list.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/lib/data/bookings.ts`
  - **What:** Separate pending requests from accepted fulfilment work instead of calling both "incoming jobs" or bookings.
  - **Why:** The blueprint draws a clean line between booking requests and accepted bookings.
  - **Done when:** Carrier surfaces label pending decisions and active fulfilment work separately and correctly.

---

## 🟡 P2 — UX & Conversion

### Customer Experience

- [ ] **B69** — Add example job presets on the homepage
  - **File(s):** `src/app/page.tsx`, `src/components/search/search-bar.tsx`, `src/lib/constants.ts`
  - **What:** Add example move presets like sofa pickup, appliance move, and awkward-item runs that prefill the need declaration flow.
  - **Why:** The blueprint uses example jobs to teach the product mental model quickly without browse shelves.
  - **Done when:** The homepage shows tappable example jobs that prefill the wizard and reinforce the spare-capacity use case.

- [ ] **B70** — Add a desktop-compressed wizard card while preserving mobile one-question-per-screen flow
  - **File(s):** `src/app/page.tsx`, `src/components/search/search-bar.tsx`, `src/app/globals.css`
  - **What:** Present the same need declaration on desktop in a tighter card while keeping the mobile step flow intact.
  - **Why:** The blueprint allows a compressed desktop input card but keeps the mobile-first interaction order fixed.
  - **Done when:** Desktop shows a compact but equivalent wizard entry and mobile still renders one primary decision per screen.

- [ ] **B71** — Add visible progress indicators across the wizard and request-confirmation flow
  - **File(s):** `src/components/search/search-bar.tsx`, `src/components/booking/booking-form.tsx`, `src/app/globals.css`
  - **What:** Add progress indicators so customers know how many steps remain in the need declaration and request confirmation flow.
  - **Why:** A more structured flow needs clear progress cues to reduce abandonment and keep trust high.
  - **Done when:** Wizard and request-confirmation screens show a consistent step progress pattern.

- [ ] **B79** — Add real customer payment-method management backed by stored Stripe customer identity
  - **File(s):** `src/components/booking/booking-form.tsx`, `src/app/(customer)/account/page.tsx`, `src/lib/stripe/client.ts`, `src/types/database.ts`, `src/lib/data/bookings.ts`
  - **What:** Persist a customer Stripe identity and add actual add/update payment-method flows from Account and request confirmation rather than just continuity links.
  - **Why:** The request flow needs genuine self-serve payment-method management before acceptance; the current repo only supports safe return-to-request continuity and booking-level payment retries.
  - **Done when:** Customers can open a real payment-method management flow from request confirmation or Account, update their card details, and return to the in-progress request safely.

### Carrier Experience

- [ ] **B83** — Add a true under-30-second quick-post path
  - **File(s):** `src/components/carrier/quick-post-templates.tsx`, `src/components/carrier/carrier-post-prefill.tsx`, `src/app/(carrier)/carrier/post/page.tsx`
  - **What:** Make quick post require only the minimum route, date, time, vehicle, capacity, and pricing confirmations when posting from a template.
  - **Why:** The blueprint treats fast repost as the carrier retention engine and sets an aggressive speed target.
  - **Done when:** A template-based repost can be completed in a handful of taps without reopening the full advanced wizard.

- [ ] **B84** — Add advanced-post support for up to two waypoints and return-trip creation
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/types/trip.ts`, `src/lib/data/trips.ts`
  - **What:** Extend advanced posting to support two optional waypoints and explicit return-trip generation.
  - **Why:** The blueprint allows limited multi-leg realism without turning the product into route optimization software.
  - **Done when:** Advanced posting can define up to two waypoints and optionally create a linked reverse-direction trip.

- [ ] **B85** — Add limited recurring-run creation up to four weeks ahead
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/components/carrier/template-library.tsx`, `src/lib/data/trips.ts`
  - **What:** Support weekly, fortnightly, or selected-day repeat runs that auto-generate near-term future trips.
  - **Why:** Repeat corridors are a key supply pattern in the blueprint and need light recurring support.
  - **Done when:** Carriers can create recurring trips that generate up to four weeks of future trip records.

- [ ] **B86** — Add structured detour-tolerance controls with carrier-friendly presets
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/validation/trip.ts`, `src/types/trip.ts`
  - **What:** Add strict, standard, and flexible detour-tolerance presets plus bounded custom values for advanced posting.
  - **Why:** The matching engine needs explicit tolerance inputs and carriers need a simple way to set them.
  - **Done when:** Carriers can set detour tolerance with presets or bounded custom values during posting.

- [ ] **B87** — Add accepted-category-specific pricing tables to posting
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/validation/trip.ts`, `src/types/trip.ts`
  - **What:** Replace single base-price entry with structured pricing per accepted category or tier.
  - **Why:** The blueprint prices by item category or tier and does not rely on one generic listing price.
  - **Done when:** Posting requires carriers to set rates for every accepted category or tier they publish.

- [ ] **B88** — Add structured stairs and helper policy builders with predefined amounts
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/validation/trip.ts`, `src/lib/pricing/breakdown.ts`
  - **What:** Build structured add-on inputs for stairs and helper rules without freeform pricing.
  - **Why:** Deterministic pricing depends on structured add-ons, not optional notes or ad hoc side pricing.
  - **Done when:** Posting can store and validate structured stairs and helper rules with platform-supported amounts.

- [ ] **B89** — Add publish blockers for missing photo, categories, pricing, or constraints
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/validation/trip.ts`, `src/app/api/trips/route.ts`
  - **What:** Convert current soft quality warnings into hard publish blockers where the blueprint requires them.
  - **Why:** Supply-quality enforcement is a first-order marketplace rule in the governing product.
  - **Done when:** Trips cannot publish unless required route, vehicle, category, pricing, and constraint fields are complete.

### Admin / Operator Tooling

- [ ] **A31** — Create operator tasks when unmatched demand crosses SLA
  - **File(s):** `new file: src/lib/data/operator-tasks.ts`, `src/lib/data/unmatched-requests.ts`, `src/lib/notifications.ts`
  - **What:** Generate operator tasks when unmatched requests receive no carrier response within the configured SLA.
  - **Why:** Sparse-supply MVP depends on founder follow-up when demand would otherwise go cold.
  - **Done when:** SLA breaches on unmatched demand automatically produce operator tasks tied to the original request.

- [ ] **A32** — Add an admin view for unmatched demand by status and corridor
  - **File(s):** `new file: src/app/(admin)/admin/alerts/page.tsx`, `src/lib/data/admin.ts`, `src/lib/data/unmatched-requests.ts`
  - **What:** Provide a dedicated admin page for active, notified, matched, and expired unmatched requests grouped by corridor.
  - **Why:** Admin needs a clear view of demand capture if Alert the Network is a core operating loop.
  - **Done when:** Admin can review unmatched demand by state, corridor, and urgency from a dedicated page.

- [ ] **A33** — Add concierge-offer creation UI from unmatched demand
  - **File(s):** `new file: src/app/(admin)/admin/alerts/page.tsx`, `new file: src/components/admin/concierge-offer-form.tsx`, `src/lib/data/admin.ts`
  - **What:** Let operators create a concierge offer directly from an unmatched-demand item.
  - **Why:** Founder manual fulfilment only works cleanly if the operator path is part of the product system.
  - **Done when:** Admin can create a concierge offer from an unmatched request without off-platform notes or ad hoc DB edits.

- [ ] **A34** — Add a stale-trip review surface for unconfirmed and auto-suspended supply
  - **File(s):** `src/app/(admin)/admin/dashboard/page.tsx`, `src/lib/data/admin.ts`, `src/lib/data/trips.ts`
  - **What:** Surface trips that missed 24-hour or 2-hour freshness checks and need admin review or carrier follow-up.
  - **Why:** Freshness enforcement needs visible operational follow-up to preserve trust.
  - **Done when:** Admin has a surface that lists stale or suspended trips with direct follow-up actions.

- [ ] **A35** — Add a founder dispute review surface keyed to proof, timeline, and payment state
  - **File(s):** `src/app/(admin)/admin/disputes/page.tsx`, `src/components/admin/resolve-dispute-actions.tsx`, `src/lib/data/bookings.ts`
  - **What:** Align dispute review with proof records, structured events, and payout-block states instead of legacy booking summaries.
  - **Why:** Founder-adjudicated disputes are part of MVP trust and need the right evidence model.
  - **Done when:** Dispute review surfaces show the full request, proof, timeline, and payment context needed for a founder decision.

- [ ] **A36** — Add an activation review checklist aligned to the blueprint gate
  - **File(s):** `src/app/(admin)/admin/verification/page.tsx`, `src/components/admin/verification-queue.tsx`, `src/lib/data/carriers.ts`
  - **What:** Replace generic verification review with an explicit gate checklist for identity, vehicle, rules, and payout readiness.
  - **Why:** Verification is a hard gate in the blueprint and needs checklist-level enforcement rather than generic approval behavior.
  - **Done when:** Admin verification review reflects the exact go-live gate fields required by the blueprint.

- [ ] **A37** — Add audit events for concierge, suspension, dispute, and activation interventions
  - **File(s):** `src/lib/data/admin.ts`, `new file: src/lib/data/operator-tasks.ts`, `src/types/admin.ts`
  - **What:** Record structured admin actions for concierge fulfilment, trip suspensions, dispute decisions, and activation outcomes.
  - **Why:** Founder-led manual operations need durable audit trails to keep product truth and ops history aligned.
  - **Done when:** Key operator interventions write explicit admin audit events tied to the relevant entities.

- [ ] **A38** — Add matched-alert notification logs for customer and carrier follow-up
  - **File(s):** `src/lib/notifications.ts`, `src/lib/data/unmatched-requests.ts`, `src/lib/data/admin.ts`
  - **What:** Persist notification-send state for alert-matched events so follow-up and dedupe work reliably.
  - **Why:** Demand capture only works if matched alerts are delivered once and tracked cleanly.
  - **Done when:** Alert-match sends can be audited, deduped, and reviewed from stored notification logs.

### Design System / UX Consistency

- [ ] **V01** — Normalize result-card hierarchy around fit, price, timing, trust, and explanation
  - **File(s):** `src/components/trip/trip-card.tsx`, `src/components/ui/card.tsx`, `src/app/globals.css`
  - **What:** Establish one card hierarchy that puts fit, price, timing, trust, and explanation in a consistent visual order.
  - **Why:** Ranked-answer cards need a stable decision pattern so customers can compare without browsing fatigue.
  - **Done when:** Offer cards use one hierarchy that emphasizes fit, total price, timing, trust, and explanation consistently.

- [ ] **V02** — Create a shared state-card pattern for request submitted, no match, alert matched, and payout blocked
  - **File(s):** `src/components/ui/card.tsx`, `new file: src/components/shared/state-card.tsx`, `src/app/globals.css`
  - **What:** Add a reusable state-card component for high-signal marketplace states that need clear actions and explanations.
  - **Why:** Blueprint flows depend on a handful of recurring high-importance states and should not re-solve them page by page.
  - **Done when:** Core state surfaces reuse a shared pattern for layout, emphasis, and CTA placement.

- [ ] **V03** — Reduce section-label overuse on customer and carrier operational pages
  - **File(s):** `src/app/globals.css`, `src/app/(customer)/search/page.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`
  - **What:** Cut repetitive eyebrow labels so headings and state changes regain visual meaning.
  - **Why:** Overusing section labels flattens information hierarchy on already dense operational pages.
  - **Done when:** Primary operational screens use section labels sparingly and reserve them for real section changes.

- [ ] **V04** — Create consistent trust-badge tokens for required and optional trust signals
  - **File(s):** `src/components/ui/badge.tsx`, `src/components/carrier/carrier-trust-panel.tsx`, `src/app/(customer)/carrier/[id]/page.tsx`
  - **What:** Standardize badge styling for verified, new but verified, ABN verified, insured, and proof-backed trust states.
  - **Why:** Trust surfaces need a coherent visual language if structure is going to do the reassurance work.
  - **Done when:** Trust signals across customer and carrier surfaces use a shared badge system with distinct meanings.

- [ ] **V05** — Create warning-tone tokens for access complexity, freshness risk, and payout blocks
  - **File(s):** `src/app/globals.css`, `src/components/ui/badge.tsx`, `src/app/(carrier)/carrier/today/page.tsx`
  - **What:** Define and apply warning tones for access-heavy jobs, stale-supply risk, and payout blockers.
  - **Why:** Risk states need fast scannability without reading long explanatory paragraphs.
  - **Done when:** Access, freshness, and payout-risk states render with a consistent warning tone across the product.

- [ ] **V06** — Create a consistent CTA stack for primary versus secondary marketplace actions
  - **File(s):** `src/components/ui/button.tsx`, `src/app/(customer)/trip/[id]/page.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`
  - **What:** Standardize how primary and secondary CTAs stack on mobile across request, alert, proof, and payout surfaces.
  - **Why:** The blueprint depends on one dominant action per screen and CTA order should reinforce that.
  - **Done when:** Mobile CTA ordering is consistent across core customer and carrier flows.

- [ ] **V07** — Add skeletons for wizard, results, requests, and alerts that preserve layout meaning
  - **File(s):** `src/components/search/search-results-skeleton.tsx`, `src/components/carrier/trip-list-skeleton.tsx`, `new file: src/components/search/alerts-skeleton.tsx`
  - **What:** Replace generic loading placeholders with skeletons that mirror the eventual ranked-answer and work-queue layouts.
  - **Why:** Loading states should support the product model instead of feeling like generic browsing chrome.
  - **Done when:** Wizard, results, requests, and alerts all have layout-preserving skeleton states.

- [ ] **V08** — Audit sticky CTA bars and nav for safe-area compliance in the realigned flows
  - **File(s):** `src/app/globals.css`, `src/components/booking/sticky-booking-cta.tsx`, `src/components/layout/mobile-nav.tsx`
  - **What:** Ensure sticky CTAs, bottom nav, and sheets still respect iPhone safe areas after the flow realignment.
  - **Why:** Mobile-first trust and conversion fall apart fast when sticky controls overlap the home indicator or action bars.
  - **Done when:** Sticky controls across customer and carrier flows clear safe areas on a `375px` viewport.

### Hardening / Edge Cases

- [ ] **A39** — Handle move-request expiry and reactivation without losing alert history
  - **File(s):** `new file: src/lib/data/move-requests.ts`, `new file: src/lib/data/unmatched-requests.ts`, `src/types/move-request.ts`
  - **What:** Define how stale move requests expire, reactivate, or clone into new requests without dropping their alert and match history.
  - **Why:** Need persistence and recovery are central to sparse-supply behavior and cannot rely on ephemeral form state.
  - **Done when:** Expired move requests can be reactivated or duplicated in a controlled way without corrupting alert state.

- [ ] **A42** — Recompute offer pricing previews when access facts change before submission
  - **File(s):** `src/components/booking/booking-form.tsx`, `src/lib/pricing/breakdown.ts`, `src/lib/data/trips.ts`
  - **What:** Update offer and confirmation pricing previews whenever the customer changes structured access facts during confirmation.
  - **Why:** The blueprint promises deterministic pricing from structured inputs and requires real-time recalculation before commitment.
  - **Done when:** Editing access facts in confirmation updates the total and breakdown before the request is submitted.

- [ ] **A44** — Add structured decline reasons without turning declines into free-text support work
  - **File(s):** `src/components/carrier/pending-bookings-alert.tsx`, `src/lib/data/bookings.ts`, `src/types/booking-request.ts`
  - **What:** Add predefined carrier decline reasons and avoid free-text decline paths as the default response mode.
  - **Why:** The blueprint values operational clarity and low typing burden over message-heavy decline explanations.
  - **Done when:** Carrier declines can capture bounded reasons without requiring long-form text entry.

- [ ] **A45** — Notify affected customers when a trip auto-suspends on failed freshness check
  - **File(s):** `src/lib/notifications.ts`, `src/lib/data/trips.ts`, `src/lib/data/bookings.ts`
  - **What:** Send customer-facing suspension notifications and next actions when a trip misses the 2-hour check-in and is removed from fulfilment.
  - **Why:** Auto-suspension protects trust only if customers learn about the change quickly and clearly.
  - **Done when:** Affected customers receive suspension notifications with the correct recovery path when their trip loses freshness.

- [ ] **A46** — Invalidate stale offers when a trip changes after results were shown
  - **File(s):** `src/lib/data/trips.ts`, `new file: src/lib/data/offers.ts`, `src/app/(customer)/search/page.tsx`
  - **What:** Expire or regenerate offers when the underlying trip route, pricing, capacity, or constraints change materially.
  - **Why:** Offer truth must remain trustworthy if carriers edit or lose availability after a customer has already seen a match.
  - **Done when:** Stale offers cannot be requested without a refresh and the customer receives a clear reload path.

### Technical Debt / Cleanup

- [ ] **A47** — Replace ad hoc result-breakdown structures with a single offer presenter contract
  - **File(s):** `src/lib/data/trips.ts`, `src/lib/trip-presenters.ts`, `src/types/trip.ts`
  - **What:** Consolidate how route fit, detour, pricing preview, and trust data are prepared for customer offer rendering.
  - **Why:** Realigned results logic will sprawl quickly if presenters and API responses diverge by surface.
  - **Done when:** Result, detail, and alert surfaces consume one offer-presentation contract.

- [ ] **A48** — Replace listing-first terminology in presenter utilities and constants
  - **File(s):** `src/lib/trip-presenters.ts`, `src/lib/constants.ts`, `src/lib/data/mappers.ts`
  - **What:** Rename helpers and constants that still encode listing-first or inventory-first semantics.
  - **Why:** Internal terminology guides future implementation choices and should reflect the blueprint model.
  - **Done when:** Core presenter and constant names prefer trip, offer, move request, and alert language over inventory language.

- [ ] **A49** — Replace saved-search-specific notification naming with alert naming
  - **File(s):** `src/lib/notifications.ts`, `src/lib/data/saved-searches.ts`, `src/lib/email/index.ts`
  - **What:** Rename notification templates, event names, and helpers so alert capture replaces saved-search semantics in the codebase.
  - **Why:** Notification naming should describe the active no-match loop the product actually uses.
  - **Done when:** Notification helpers and template names reference alerts and unmatched demand instead of saved searches.

- [ ] **A50** — Remove browse-first analytics events that no longer map to the product model
  - **File(s):** `src/lib/analytics.ts`, `src/app/api/search/route.ts`, `src/app/api/bookings/route.ts`
  - **What:** Remove or rename analytics events that assume browse-first inventory, direct booking, or saved-search semantics.
  - **Why:** Measurement should reflect the governing product funnel or later data interpretation will drift.
  - **Done when:** Core analytics events map to move request, offers, booking requests, alerts, and fulfilment rather than browse-first shortcuts.

- [ ] **A51** — Consolidate customer draft state around `MoveRequest`
  - **File(s):** `src/components/search/search-bar.tsx`, `src/components/booking/booking-form.tsx`, `new file: src/hooks/useMoveRequestDraft.ts`
  - **What:** Collapse duplicated draft logic into a shared move-request draft layer used by home, results, and confirmation flows.
  - **Why:** The current search-draft and booking-draft split does not fit the need-first request model.
  - **Done when:** Customer draft state is managed through one move-request-oriented abstraction rather than separate search and booking drafts.

- [ ] **A52** — Consolidate carrier action derivation for Home, Requests, Trips, and Today
  - **File(s):** `src/lib/data/bookings.ts`, `src/lib/data/carriers.ts`, `src/app/(carrier)/carrier/dashboard/page.tsx`
  - **What:** Centralize how carrier next actions are derived so multiple pages do not compute urgency and state differently.
  - **Why:** The state-aware carrier experience will drift fast if each page invents its own action logic.
  - **Done when:** Carrier next-action derivation lives in one reusable layer consumed across operational surfaces.

---

## 🟢 P3 — Enhancements

### Frontend Architecture and State

- [ ] **B93** — Add recent move-request summaries to Home for returning customers
  - **File(s):** `src/app/page.tsx`, `new file: src/components/customer/recent-move-requests.tsx`, `new file: src/lib/data/move-requests.ts`
  - **What:** Show recent move requests and their latest state on Home after the customer has used the flow before.
  - **Why:** Home should become a lightweight command surface for repeat customers rather than a fixed first-time-only page.
  - **Done when:** Returning customers can see their recent move requests and start a new one from Home.

- [ ] **B94** — Add matched-alert badges to customer nav and account surfaces
  - **File(s):** `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/(customer)/account/page.tsx`
  - **What:** Surface matched-alert counts in navigation and account views so recovered demand is hard to miss.
  - **Why:** Alert recovery only works if customers notice when a match becomes available later.
  - **Done when:** Customers can see matched-alert counts from nav and account without opening the Alerts page first.

- [ ] **B95** — Add differentiated carrier-home empty states for no templates versus no live trips
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/components/carrier/quick-post-templates.tsx`, `src/lib/data/templates.ts`
  - **What:** Tailor carrier home messaging based on whether the carrier lacks templates, lacks live trips, or has both.
  - **Why:** Empty-state specificity helps carriers recover faster and encourages repeat posting behavior.
  - **Done when:** Carrier home empty states explain the next best action for no-template and no-live-trip cases separately.

- [ ] **B96** — Add per-trip health reasons to operational views without reviving stats-first design
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/app/(carrier)/carrier/today/page.tsx`, `src/lib/data/bookings.ts`
  - **What:** Keep useful operational health reasons visible in Home and Today without reintroducing metrics-led stats panels.
  - **Why:** Carrier ops still need quality signals, but the blueprint wants them subordinate to work-queue actions.
  - **Done when:** Carriers can see specific health reasons tied to active work inside Home and Today.

- [ ] **B97** — Add delivered-pending-confirmation reminders to customer and carrier surfaces
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(carrier)/carrier/payouts/page.tsx`, `src/lib/notifications.ts`
  - **What:** Surface reminders when a booking is delivered and waiting on customer confirmation or auto-release.
  - **Why:** The 72-hour dispute and auto-release window should stay legible to both sides after delivery.
  - **Done when:** Customer and carrier surfaces show pending-confirmation reminders with the correct timing and outcome expectations.

- [ ] **B98** — Add notification deep links to exact request cards and alert items
  - **File(s):** `src/lib/notifications.ts`, `new file: src/app/(carrier)/carrier/requests/page.tsx`, `new file: src/app/(customer)/alerts/page.tsx`
  - **What:** Ensure notifications open the exact request or alert context instead of generic list pages.
  - **Why:** Direct deep links make the action-led product feel much faster and cleaner on mobile.
  - **Done when:** Request and alert notifications navigate directly to the relevant card or record state.

### API and Integration Changes

- [ ] **A53** — Add event-driven notification fanout for request, booking, alert, and freshness events
  - **File(s):** `src/lib/notifications.ts`, `src/lib/data/bookings.ts`, `src/lib/data/trips.ts`
  - **What:** Expand notification fanout so request, alert, proof, payout, and freshness events share one event-driven model.
  - **Why:** The realigned product introduces more stateful events and needs a predictable notification layer.
  - **Done when:** The notification layer can fan out the full blueprint event set from one event-driven contract.

- [ ] **A54** — Add email templates for request accepted, request declined, alert matched, trip suspended, and payout released
  - **File(s):** `src/lib/email/index.ts`, `src/lib/notifications.ts`, `src/lib/data/bookings.ts`
  - **What:** Create missing lifecycle templates for the new request, alert, and freshness events.
  - **Why:** The blueprint relies on clear lifecycle communication, especially when supply is sparse or state changes are delayed.
  - **Done when:** Email templates exist for the core realigned lifecycle events and are wired to notification sends.

- [ ] **A55** — Add push-notification preference toggles with fallback channels
  - **File(s):** `src/lib/notifications.ts`, `src/app/(customer)/account/page.tsx`, `src/app/(carrier)/carrier/account/page.tsx`
  - **What:** Add push toggles and fallback channel logic for customers and carriers as alerts and request events expand.
  - **Why:** Blueprint flows assume push is important, but the product still needs graceful fallback behavior.
  - **Done when:** Users can manage push preferences and the system can fall back to email or in-app when push is unavailable.

- [ ] **A56** — Add operator audit events for concierge, suspension, dispute, and verification actions
  - **File(s):** `src/lib/data/admin.ts`, `new file: src/lib/data/operator-tasks.ts`, `src/types/admin.ts`
  - **What:** Persist structured admin event records for the main manual interventions used in MVP.
  - **Why:** Admin and founder actions are part of product truth during MVP and should be auditable.
  - **Done when:** Manual concierge, suspension, dispute, and verification actions write durable operator audit events.

- [ ] **A57** — Add reusable geospatial helpers for corridor overlap and partial-route labels
  - **File(s):** `src/lib/maps/directions.ts`, `src/lib/maps/distance.ts`, `src/lib/data/trips.ts`
  - **What:** Create shared helpers for corridor overlap, partial-route percentage, and route-fit labeling instead of ad hoc calculations.
  - **Why:** Matching logic will need consistent geospatial semantics across offers, alerts, and admin surfaces.
  - **Done when:** Corridor overlap and partial-route helpers are reusable and power customer-facing match labels consistently.

- [ ] **A58** — Add cached detour estimation for top candidates only
  - **File(s):** `src/lib/maps/directions.ts`, `src/lib/data/trips.ts`, `src/lib/matching/score.ts`
  - **What:** Add cached detour estimation so the system can explain top candidates without turning every search into a full routing burst.
  - **Why:** The blueprint allows lightweight detour estimation but does not want a heavy route-optimization engine.
  - **Done when:** Detour estimates are cached for surfaced candidates and not recomputed wastefully on every request.

### Hardening / Edge Cases

- [ ] **D17** — Add RLS policies for new move-request, offer, booking-request, alert, and operator tables
  - **File(s):** `new file: supabase/migrations/031_realignment_rls.sql`, `src/types/database.ts`, `supabase/migrations/004_create_rls_policies.sql`
  - **What:** Apply row-level security for every new realignment table and align access with customer, carrier, admin, and service-role boundaries.
  - **Why:** Every new trust-critical table needs RLS, especially when founder concierge and notifications are involved.
  - **Done when:** All new tables have explicit RLS policies and policy coverage matches the realigned roles.

- [ ] **D18** — Add GIST indexes for new geography columns and route polylines
  - **File(s):** `new file: supabase/migrations/032_realignment_geo_indexes.sql`, `src/types/database.ts`, `supabase/migrations/005_create_indexes.sql`
  - **What:** Add the required geospatial indexes for move-request points, unmatched requests, and realigned trip route geometry.
  - **Why:** The matching and alert system cannot scale or stay correct without the right spatial indexes.
  - **Done when:** All new geography and line geometry columns have the required GIST indexes.

- [ ] **D19** — Correct migration sequencing before adding realignment migrations
  - **File(s):** `supabase/migrations/010_capacity_recalculation.sql`, `supabase/migrations/010_saved_searches.sql`, `new file: supabase/migrations/033_fix_migration_sequence.sql`
  - **What:** Resolve the duplicate `010` migration numbering so future realignment migrations can apply predictably.
  - **Why:** Sequential migration integrity is a repository rule and the current duplicate numbering is a latent deployment risk.
  - **Done when:** Migration ordering is unambiguous and future realignment migrations can be added without sequence collisions.

- [ ] **D20** — Add a backfill plan for migrating live listing and booking data into request-based entities
  - **File(s):** `new file: supabase/migrations/034_backfill_request_entities.sql`, `src/lib/data/mappers.ts`, `src/lib/data/bookings.ts`
  - **What:** Define how legacy listings and bookings are backfilled into move requests, offers, and booking requests without losing continuity.
  - **Why:** The model realignment needs a path from existing data to new entities or rollout will stall.
  - **Done when:** A backfill migration or scripted path exists for core historical data needed by the new model.

- [ ] **D21** — Add a dual-read compatibility layer during the legacy-to-realigned transition
  - **File(s):** `src/lib/data/bookings.ts`, `src/lib/data/trips.ts`, `src/lib/data/mappers.ts`
  - **What:** Allow read paths to serve legacy and new model records during the transition period.
  - **Why:** A cold switch would break live screens before the new model is fully rolled out.
  - **Done when:** Core read paths can tolerate legacy and realigned records until cutover is complete.

- [ ] **A59** — Add feature flags for home, results, request-flow, and alert switchover
  - **File(s):** `src/lib/env.ts`, `next.config.js`, `src/app/page.tsx`
  - **What:** Gate the main flow transitions behind explicit feature flags so rollout can happen in bounded slices.
  - **Why:** A large product-shape realignment needs controlled rollout points to reduce blast radius.
  - **Done when:** Home, results, request flow, and alerts can be toggled independently through config or env flags.

- [ ] **A60** — Add a shadow-write path for new request entities before legacy write removal
  - **File(s):** `src/lib/data/bookings.ts`, `new file: src/lib/data/move-requests.ts`, `new file: src/lib/data/offers.ts`
  - **What:** Write new move-request and offer records alongside the legacy flow before cutting legacy writes entirely.
  - **Why:** Shadow writes let the team validate the new model without breaking live screens immediately.
  - **Done when:** Legacy booking creation can optionally shadow-write the new entities for validation and comparison.

- [ ] **A61** — Add a guard so legacy search fallback cannot regress to a dead-end waitlist
  - **File(s):** `src/app/(customer)/search/page.tsx`, `src/app/api/search/route.ts`, `src/lib/data/unmatched-requests.ts`
  - **What:** Block any path that would drop a customer into a dead-end empty state or legacy waitlist behavior during the transition.
  - **Why:** Zero-match continuation is one of the most important product corrections in the realignment.
  - **Done when:** Search fallback always routes into near matches, nearby dates, or alert capture even during mixed-model rollout.

- [ ] **A62** — Validate proof records for GPS and timestamp before payout-pending state
  - **File(s):** `src/lib/data/bookings.ts`, `src/types/booking.ts`, `src/components/booking/private-proof-tile.tsx`
  - **What:** Enforce proof metadata requirements before the system can move into payout-pending confirmation.
  - **Why:** The blueprint’s trust model depends on valid proof, not just uploaded images.
  - **Done when:** Proof uploads must contain required metadata before they can unlock the payout-pending state.

- [ ] **A63** — Add the payout auto-release scheduler with dispute-window enforcement
  - **File(s):** `new file: src/app/api/cron/payout-auto-release/route.ts`, `src/lib/data/bookings.ts`, `vercel.json`
  - **What:** Schedule auto-release of payouts after valid proof and 72 hours without dispute.
  - **Why:** The product’s payout promise is incomplete unless the auto-release path runs automatically and predictably.
  - **Done when:** Auto-release runs on schedule, respects disputes, and updates payout state without manual intervention.

- [ ] **A64** — Add 24-hour and 2-hour trip-freshness schedulers
  - **File(s):** `new file: src/app/api/cron/trip-freshness-checks/route.ts`, `src/lib/data/trips.ts`, `vercel.json`
  - **What:** Schedule freshness reminders, deprioritisation, and suspension actions around the blueprint check-in rules.
  - **Why:** Freshness enforcement is mandatory and cannot depend on page loads or manual review alone.
  - **Done when:** The platform sends check-ins and applies deprioritisation or suspension based on missed responses.

### Technical Debt / Cleanup

- [ ] **A65** — Remove legacy waitlist writes once `UnmatchedRequest` is live
  - **File(s):** `src/app/api/search/route.ts`, `src/components/customer/waitlist-form.tsx`, `supabase/migrations/006_extend_marketplace_infra.sql`
  - **What:** Delete legacy waitlist write paths after unmatched-demand flow is fully available.
  - **Why:** Keeping two zero-match persistence models alive will create product and reporting drift.
  - **Done when:** No production code writes waitlist entries for customer demand capture.

- [ ] **A66** — Remove legacy saved-search matcher once alerts cover rematch behavior
  - **File(s):** `src/lib/data/saved-searches.ts`, `src/app/api/saved-searches/route.ts`, `src/app/api/saved-searches/[id]/route.ts`
  - **What:** Retire saved-search-specific rematch behavior after alerts and unmatched-demand rematching replace it.
  - **Why:** Two rematch systems will compete conceptually and operationally if they remain live together.
  - **Done when:** Alert-based rematching is the only live rematch path and saved-search-specific matching code is removed.

- [ ] **A67** — Remove flat booking-fee helpers after the pricing contract is replaced
  - **File(s):** `src/lib/pricing/breakdown.ts`, `src/lib/trip-presenters.ts`, `src/components/trip/trip-detail-summary.tsx`
  - **What:** Delete helper names, presenter logic, and UI copy that depend on the flat booking-fee model once the new pricing model lands.
  - **Why:** Leaving the old pricing primitives in place will cause drift and accidental reintroduction later.
  - **Done when:** The codebase no longer carries flat booking-fee helper names or customer-facing references.

- [ ] **A68** — Remove direct customer-to-carrier phone fields from customer presenters
  - **File(s):** `src/lib/data/bookings.ts`, `src/types/booking.ts`, `src/app/(customer)/bookings/[id]/page.tsx`
  - **What:** Stop mapping carrier phone fields into customer-facing presenter data for MVP flows.
  - **Why:** The blueprint’s on-platform communication rule should be reflected in data-presenter boundaries too.
  - **Done when:** Customer presenter payloads no longer include carrier phone data by default.

- [ ] **A69** — Remove public carrier listing shelves that bypass need-first entry
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx`, `src/app/page.tsx`, `src/lib/data/trips.ts`
  - **What:** Remove or hide trip shelves whose main purpose is browsing a carrier’s public inventory.
  - **Why:** Inventory shelves on profile-like pages preserve a browse-first loop the blueprint rejects.
  - **Done when:** Public carrier surfaces no longer function as alternative browsing entry points to live supply.

- [ ] **A70** — Remove percentage-capacity copy helpers from customer presenters
  - **File(s):** `src/lib/trip-presenters.ts`, `src/components/trip/trip-card.tsx`, `src/components/trip/trip-detail-summary.tsx`
  - **What:** Delete presenter helpers that convert raw remaining-capacity percentages directly into customer-facing copy.
  - **Why:** The blueprint wants human fit language, not percentage-led capacity explanations.
  - **Done when:** Customer-facing presenter helpers no longer expose percentage-capacity phrasing directly.

- [ ] **A71** — Rename listing-centric modules toward trip, offer, request, and alert language
  - **File(s):** `src/lib/data/listings.ts`, `src/lib/data/trips.ts`, `src/lib/data/mappers.ts`
  - **What:** Rename modules and helper boundaries that still encode listings as the primary product concept.
  - **Why:** Internal architecture should describe the realigned model so future work follows the right abstractions.
  - **Done when:** Core module names reflect trips, offers, booking requests, move requests, and alerts instead of generic listings.

- [ ] **A72** — Replace dashboard and stats language with command-centre and work-queue language
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/app/(carrier)/carrier/stats/page.tsx`, `src/components/layout/page-intro.tsx`
  - **What:** Remove dashboard and stats language from carrier-facing operational surfaces and replace it with work-queue language.
  - **Why:** Product language should reinforce action-led carrier behavior, not deferred analytics ambitions.
  - **Done when:** Carrier operational pages no longer describe themselves primarily through dashboard or stats framing.

---

## ⚪ P4 — Post-MVP / Deferred

### Deferred Later-Phase Items

- [ ] **E01** — Add a secondary corridor browse layer after liquidity supports it
  - **File(s):** `new file: src/app/(customer)/explore/page.tsx`, `src/app/page.tsx`, `src/lib/data/trips.ts`
  - **What:** Build a secondary corridor-explore surface only after the need-first flow proves out and supply density supports browsing.
  - **Why:** The blueprint allows a later browse layer but explicitly rejects it as the MVP primary model.
  - **Done when:** A deferred explore surface can be enabled without replacing the need-first home flow.

- [ ] **E02** — Add richer public carrier storefront features after the core flow stabilizes
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx`, `src/lib/data/feedback.ts`, `src/lib/trip-presenters.ts`
  - **What:** Consider richer carrier public profiles only after need-first matching, trust, and fulfilment loops are stable.
  - **Why:** Public storefront depth is not part of the MVP product shape and should not compete with request-led discovery.
  - **Done when:** Any expanded carrier profile work is explicitly built as a secondary trust surface, not a discovery path.

- [ ] **E03** — Add public written-review display after moderation policy and rating volume mature
  - **File(s):** `src/app/(customer)/carrier/[id]/page.tsx`, `src/lib/data/feedback.ts`, `src/types/review.ts`
  - **What:** Display written review text only after moderation policy, thresholds, and trust signals are robust enough.
  - **Why:** The blueprint defers written-review display while still collecting review data.
  - **Done when:** Public written reviews can be shown without undermining new-but-verified trust states.

- [ ] **E04** — Add double-blind review release for customer and carrier feedback
  - **File(s):** `src/lib/data/feedback.ts`, `src/components/booking/review-form.tsx`, `src/types/review.ts`
  - **What:** Introduce a delayed review-reveal model where reviews publish after both parties submit or the review window expires.
  - **Why:** This is a later trust enhancement and not required for MVP learning loops.
  - **Done when:** Review release can be configured to hold until both sides respond or the review window closes.

- [ ] **E05** — Add phone masking if on-platform coordination proves insufficient
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/lib/notifications.ts`, `src/types/booking.ts`
  - **What:** Introduce masked calling or relay contact if same-day coordination needs outgrow on-platform messaging.
  - **Why:** The blueprint defers telephony because it is costly and not core to the MVP model.
  - **Done when:** Phone masking can be enabled as a bounded coordination layer without exposing raw numbers.

- [ ] **E06** — Add live trip-day tracking with explicit privacy rules
  - **File(s):** `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(carrier)/carrier/today/page.tsx`, `src/lib/notifications.ts`
  - **What:** Consider live location tracking only after core request, proof, and payout mechanics are stable.
  - **Why:** The blueprint defers live tracking and does not want it to become the centerpiece feature.
  - **Done when:** Live tracking exists only as an explicit, bounded post-MVP add-on with clear privacy controls.

- [ ] **E07** — Add richer in-app messaging with structured chips and images
  - **File(s):** `new file: src/app/(customer)/messages/page.tsx`, `new file: src/app/(carrier)/carrier/messages/page.tsx`, `src/lib/notifications.ts`
  - **What:** Expand in-app messaging after the structured status-update model proves insufficient.
  - **Why:** The blueprint defers messaging depth and prefers structured coordination during MVP.
  - **Done when:** Messaging can support richer threads without replacing the structured coordination defaults.

- [ ] **E08** — Add carrier calendar sync for recurring runs
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx`, `src/lib/data/trips.ts`, `src/app/(carrier)/carrier/account/page.tsx`
  - **What:** Integrate recurring trips with external calendar sync only after the core repeat-route loop is stable.
  - **Why:** Calendar integration is useful but not part of the MVP retention mechanic itself.
  - **Done when:** Carriers can optionally sync recurring runs with supported calendars.

- [ ] **E09** — Add richer carrier reliability analytics outside the operational home
  - **File(s):** `src/app/(carrier)/carrier/stats/page.tsx`, `src/lib/data/bookings.ts`, `src/lib/analytics.ts`
  - **What:** Reintroduce deeper acceptance, completion, and route-performance analytics after the action-led carrier home is stable.
  - **Why:** The blueprint defers deep analytics and keeps carrier focus on posting and fulfilment first.
  - **Done when:** A non-primary analytics surface can be enabled without distorting the carrier home model.

- [ ] **E10** — Add SMB account mode and customer business workflows
  - **File(s):** `src/types/customer.ts`, `src/app/(customer)/account/page.tsx`, `src/lib/data/move-requests.ts`
  - **What:** Add small-business account affordances and repeat-business workflows after the consumer wedge proves out.
  - **Why:** SMB-specific UI is explicitly deferred in the blueprint.
  - **Done when:** Business-mode workflows are additive and do not distort the core awkward-middle customer flow.

- [ ] **E11** — Add multi-user business and fleet accounts
  - **File(s):** `src/types/carrier.ts`, `src/types/customer.ts`, `new file: src/app/(carrier)/carrier/team/page.tsx`
  - **What:** Support teams, permissions, and shared operational ownership for carrier or business accounts.
  - **Why:** Team and fleet logic are out of MVP scope and would overcomplicate the current trust and state model.
  - **Done when:** Team accounts can be enabled without changing the single-operator default assumptions baked into MVP.

- [ ] **E12** — Add advanced multi-stop optimization beyond two waypoints
  - **File(s):** `src/types/trip.ts`, `src/lib/maps/directions.ts`, `src/components/carrier/carrier-trip-wizard.tsx`
  - **What:** Extend route planning and matching beyond the limited two-waypoint support reserved for MVP realism.
  - **Why:** The blueprint explicitly rejects route-optimization depth during the first phase.
  - **Done when:** Carriers can manage richer multi-stop patterns without converting the product into a dispatch planner.

- [ ] **E13** — Add historical-data-driven pricing guidance
  - **File(s):** `src/lib/pricing/suggest.ts`, `src/lib/data/bookings.ts`, `src/components/carrier/carrier-trip-wizard.tsx`
  - **What:** Replace seed-based pricing guidance with historical transaction models when enough data exists.
  - **Why:** Pricing guidance is helpful, but the blueprint treats it as advisory and secondary to carrier-set rates.
  - **Done when:** Pricing guidance can use real corridor and category history without becoming automatic pricing.

- [ ] **E14** — Add automated detour pricing only after an explicit founder decision
  - **File(s):** `src/lib/pricing/breakdown.ts`, `src/lib/maps/directions.ts`, `src/components/carrier/carrier-trip-wizard.tsx`
  - **What:** Implement automated detour pricing only if the detour ambiguity is resolved in favor of it and product-shape risks are accepted.
  - **Why:** The blueprint is internally inconsistent here and the MVP default should remain estimation-only until decided.
  - **Done when:** Detour pricing ships only behind an explicit founder decision and documented product guardrails.

- [ ] **E15** — Add a funded insurance or coverage product with defined policy terms
  - **File(s):** `src/app/(marketing)/trust/page.tsx`, `src/types/booking.ts`, `src/lib/data/bookings.ts`
  - **What:** Build an actual coverage product only after policy funding, limits, and operational handling are real.
  - **Why:** The blueprint rejects vague guarantee language without real operational backing.
  - **Done when:** Coverage can be marketed only because a defined, funded policy exists.

- [ ] **E16** — Add a self-serve dispute center after founder-led policy stabilizes
  - **File(s):** `src/app/(customer)/account/page.tsx`, `src/app/(carrier)/carrier/account/page.tsx`, `src/components/booking/dispute-form.tsx`
  - **What:** Expand dispute tooling into a richer self-serve centre after founder adjudication patterns settle.
  - **Why:** MVP disputes are intentionally founder-led and should not become a large product subsystem too early.
  - **Done when:** A richer dispute center can be layered on without weakening the simple MVP trust model.

- [ ] **E17** — Add a map-assisted explore layer as a secondary explanatory surface
  - **File(s):** `new file: src/app/(customer)/explore-map/page.tsx`, `src/lib/maps/directions.ts`, `src/lib/data/trips.ts`
  - **What:** Add a secondary explore-map surface only once enough supply exists to justify it.
  - **Why:** Maps explain but do not lead in the blueprint and should stay secondary even later.
  - **Done when:** Any map-led browsing is clearly secondary to the need-first flow and gated behind sufficient supply density.

- [ ] **E18** — Add enterprise reporting and export surfaces
  - **File(s):** `src/app/(admin)/admin/dashboard/page.tsx`, `src/app/(carrier)/carrier/payouts/page.tsx`, `src/lib/data/admin.ts`
  - **What:** Build export and reporting surfaces for larger-scale operators or business customers only after MVP workflows are proven.
  - **Why:** Enterprise reporting is explicitly deferred and should not compete with core marketplace execution now.
  - **Done when:** Reporting exports exist as a later-phase add-on rather than a current MVP deliverable.

- [ ] **E19** — Add national corridor expansion tooling beyond the launch region
  - **File(s):** `src/lib/maps/sydney-suburb-coords.ts`, `src/lib/data/trips.ts`, `src/app/page.tsx`
  - **What:** Expand location, corridor, and launch tooling beyond the initial operating region after the local wedge proves out.
  - **Why:** Geographic expansion is later-phase work and should not distract from the launch corridor strategy.
  - **Done when:** Corridor and location tooling can support broader geography without changing the core product model.

- [ ] **E20** — Add a cross-role account switcher for dual customer and carrier users
  - **File(s):** `src/types/customer.ts`, `src/types/carrier.ts`, `src/components/layout/site-header.tsx`
  - **What:** Build a role switcher for users who operate as both customer and carrier after the underlying dual-role architecture stabilizes.
  - **Why:** The blueprint wants the architecture to support dual roles but does not require the switching UI in MVP.
  - **Done when:** Dual-role users can switch contexts without separate accounts once the underlying role model is stable.

- [ ] **E21** — Add post-MVP carrier performance coaching surfaces
  - **File(s):** `src/app/(carrier)/carrier/stats/page.tsx`, `src/lib/data/bookings.ts`, `src/lib/analytics.ts`
  - **What:** Add coaching around acceptance, completion, route quality, and trust after the core posting and fulfilment loop is stable.
  - **Why:** Performance coaching is helpful later, but the blueprint keeps it behind operational execution during MVP.
  - **Done when:** Carrier coaching can be turned on without replacing Home or Requests as the main carrier focus.

- [ ] **E22** — Add a native iOS app after the web MVP loops stabilize
  - **File(s):** `README.md`, `src/app/layout.tsx`, `src/components/layout/mobile-nav.tsx`
  - **What:** Plan and build a native iOS client only after the mobile web flow proves out for posting, requests, proof, and payouts.
  - **Why:** The blueprint treats the web MVP as the validation surface and defers native app work.
  - **Done when:** Native iOS work starts from a stable, blueprint-aligned web product instead of from the current transition state.

- [ ] **E23** — Add a native Android app after the web MVP loops stabilize
  - **File(s):** `README.md`, `src/app/layout.tsx`, `src/components/layout/mobile-nav.tsx`
  - **What:** Plan and build a native Android client only after the web MVP and iOS prioritization decisions are validated.
  - **Why:** Native platform expansion is explicitly deferred and should follow, not lead, the web MVP.
  - **Done when:** Native Android work begins only after the web MVP model is stable and clearly worth carrying to a second client.
