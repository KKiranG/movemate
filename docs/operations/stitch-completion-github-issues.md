# Stitch Customer Completion GitHub Issue Bodies

`gh` is not available in this shell, so these are ready-to-file GitHub issue bodies. Create the two tracker issues first, then create the six child issues and link them back to the tracker issue numbers.

## Tracker 1 — Backend: Stitch Customer Completion Backend Tracker

## Outcome
Complete the backend and integration seams needed to turn the Stitch-derived customer flow from mock-first UI into production-backed MoveMate behavior.

## Why it matters
The customer UI now expresses the intended need-first flow, but each mock surface needs a named backend replacement seam so future work does not become a second rewrite.

## Non-goals
- Do not rebuild pricing economics.
- Do not add bidding, quote-board, direct-contact, or chat-heavy behavior.
- Do not force full payment lifecycle cutover in a UI PR.

## Lane
backend-builder

## Lock Group
customer-booking-lifecycle

## Priority
p1

## Size
xl

## Risk level
high

## Files or surfaces likely touched
Customer move request routes, booking request routes, presenter/adapters, pricing breakdown, payment authorization, unmatched request, proof/receipt presenters, E2E fixtures.

## Blocked by
Current Stitch UI branch landing and dependency-backed verification.

## Safe for parallelism
no

## Touches shared logic
yes

## Founder decision needed
no

## Acceptance criteria
- [ ] Backend contracts exist for every mock customer-flow surface.
- [ ] Mock/live adapters can be swapped without rewriting the UI.
- [ ] Request-to-book, fallback, proof, receipt, and unmatched paths have production presenters.

## Backend checklist (25)
- [ ] Move-request draft persistence supports route, item, access, and timing state.
- [ ] Multi-item payload shape supports selected item, variant, quantity, and handling notes.
- [ ] Item photo upload seam supports camera-first future wiring.
- [ ] Route address normalization supports pickup/drop-off labels and resolved addresses.
- [ ] Access validation covers stairs, lift, parking, and customer-help state.
- [ ] Timing flexibility model supports date choice, time window, nearby days, and any-window.
- [ ] Match explanation presenter converts match metadata into customer-safe copy.
- [ ] Fixed all-in price adapter maps canonical pricing breakdown into UI rows.
- [ ] Request-to-book adapter creates one carrier request from selected offer.
- [ ] Fast Match adapter remains bounded and first-accept-wins.
- [ ] Decline fallback presenter returns next-best option without restarting the flow.
- [ ] Expiry fallback presenter handles response-window timeout.
- [ ] Keep-looking adapter creates/updates unmatched request demand.
- [ ] Payment authorization presenter distinguishes authorization from capture.
- [ ] Booking timeline presenter maps booking status to customer status steps.
- [ ] Proof metadata presenter exposes timestamp/GPS/photo state.
- [ ] Receipt presenter exposes final charged lines and proof-backed status.
- [ ] Account payment status presenter exposes default method and recovery state.
- [ ] Notification preferences support match, request, proof, and receipt updates.
- [ ] Seeded demo data covers Stitch customer flow.
- [ ] E2E fixtures cover public mock mode and authenticated seeded mode.
- [ ] Mock/live feature flag selects mock adapter or production adapter.
- [ ] Analytics events cover start, item, access, timing, match, request, fallback, receipt.
- [ ] API response contracts are typed and validated.
- [ ] Migration/backfill plan covers stored drafts and existing move requests.

## Verification
- automated: `npm run check`, targeted presenter tests, `npm test`, customer E2E subset.
- manual: browser QA `/move/new` at mobile viewport.
- blocked by env: production Supabase/Stripe behavior unless seeded env is configured.

## Rollout / fallback
Keep mock mode available behind a local/test flag until live adapters are verified.

## Rollback risk
Medium-high if live booking/request routes are changed without presenter tests.

---

## Tracker 2 — UX: Stitch Customer Completion UX Tracker

## Outcome
Complete the UX refinements needed for the Stitch-derived customer flow to reach the intended first-pass implementation quality.

## Why it matters
The design reference contains many concrete screens and interaction patterns. The app should preserve those ideas while adapting them to MoveMate product truth.

## Non-goals
- Do not redesign the product from scratch.
- Do not add backend complexity inside UI components.
- Do not implement carrier screens in this customer-flow tracker.

## Lane
ux-builder

## Lock Group
customer-booking-lifecycle

## Priority
p1

## Size
xl

## Risk level
medium

## Files or surfaces likely touched
`/move/new`, customer flow primitives, customer shell/chrome, customer E2E tests.

## Blocked by
Dependency-backed browser QA.

## Safe for parallelism
no

## Touches shared logic
no

## Founder decision needed
no

## Acceptance criteria
- [ ] Customer can complete primary and fallback flow at 375px/390px.
- [ ] Stitch intent is represented without quote-board, bidding, detour-pricing, or direct-contact patterns.
- [ ] Each mock surface has a visible or code-level seam for later live integration.

## UX checklist (55)
### Home / route (8)
- [ ] Warm paper home screen matches Stitch tone.
- [ ] Route card is the hero, not item browsing.
- [ ] Pickup field is editable and accessible.
- [ ] Drop-off field is editable and accessible.
- [ ] Route rail uses outlined origin and purple/blue destination.
- [ ] Item chips are secondary entry points.
- [ ] Fixed-price trust note is visible.
- [ ] Bottom action respects safe area.

### Item flow (10)
- [ ] Full item grid covers sofa, bed, fridge, mattress, washer, desk, table, wardrobe, TV/unit, boxes, gym, other.
- [ ] Item icons are clear at mobile size.
- [ ] Selected item summary is visible.
- [ ] Variant bottom sheet supports item type.
- [ ] Quantity stepper has 44px targets.
- [ ] Helper recommendation is shown.
- [ ] Photo prompt exists.
- [ ] Photo state can be toggled in mock mode.
- [ ] Other item explains later description/photo need.
- [ ] Item flow keeps one decision per screen.

### Access (8)
- [ ] Pickup access card has stairs/lift/parking.
- [ ] Drop-off access card has stairs/lift/parking.
- [ ] Stairs controls are segmented and tappable.
- [ ] Lift toggles are iOS-sized.
- [ ] Parking uses Easy/Unsure/Tight language.
- [ ] Customer-help option is explicit.
- [ ] Access copy explains matching and pricing impact.
- [ ] Validation prevents missing required state.

### Timing (7)
- [ ] Horizontal date chips are present.
- [ ] 2x2 time window grid is present.
- [ ] Nearby-days flexibility toggle is present.
- [ ] Any-window flexibility toggle is present.
- [ ] Timing copy explains route-fit benefit.
- [ ] Find drivers button validates required state.
- [ ] Timing screen stays uncluttered.

### Matches (8)
- [ ] Results headline says 3 drivers ready.
- [ ] Best match has distinct top treatment.
- [ ] Secondary matches are compact.
- [ ] All-in price is prominent.
- [ ] Why-this-fits copy is deterministic and customer-safe.
- [ ] Trust chips are visible.
- [ ] No sort/filter browse controls.
- [ ] Keep-looking fallback is visible.

### Offer / confirm (8)
- [ ] Driver profile header is clear.
- [ ] Trust ribbon is present.
- [ ] Why-this-driver-fits card is present.
- [ ] Vehicle fit card is present.
- [ ] Route summary card is present.
- [ ] Price breakdown is all-in and fixed.
- [ ] Payment copy says authorize now, capture on acceptance.
- [ ] Sticky request CTA is clear.

### Post-booking / account (6)
- [ ] Pending screen has countdown/avatar treatment.
- [ ] Tracking screen is directional and operational.
- [ ] Delivered screen includes proof placeholder.
- [ ] Review/receipt confirmation is present.
- [ ] Booking detail screen includes timeline and receipt.
- [ ] Account screen shows payment/notification seams.

## Verification
- automated: `npm run check`, customer E2E subset.
- manual: mobile browser QA for primary/fallback paths.
- blocked by env: real payment/proof data until backend adapters are live.

## Rollout / fallback
Keep flow mock-first until live adapters pass E2E.

## Rollback risk
Medium; route is isolated to `/move/new` but customer acquisition and booking flow depend on it.

---

## Child Issue — Backend Contracts And Mock/Live Adapter Seam

## Outcome
Promote the current Stitch customer contracts into a stable adapter layer that can serve mock mode now and live API data later.

## Acceptance criteria
- [ ] UI imports a view model/adapter rather than raw mock constants.
- [ ] Contracts cover route, item, access, timing, matches, offer, request, proof, receipt, and account state.
- [ ] Presenter tests cover validation and match/price/booking presenters.

## Verification
- `npm run check`
- targeted contract tests

---

## Child Issue — Payment And Request Lifecycle Integration

## Outcome
Wire the confirm/request/pending UI to real request-to-book and payment authorization presenters without changing payment economics.

## Acceptance criteria
- [ ] Request sends to one selected offer by default.
- [ ] Payment copy and data reflect authorize-before-acceptance and capture-on-acceptance.
- [ ] Decline and expiry return next-best fallback state.

## Verification
- payment/request presenter tests
- existing payment webhook/request tests

---

## Child Issue — Matching Result Explanation Integration

## Outcome
Replace mock match cards with production match data and deterministic customer-safe explanation strings.

## Acceptance criteria
- [ ] Top matches render from live move-request offers.
- [ ] Match explanations avoid internal score/detour language.
- [ ] All-in prices use canonical breakdown.

## Verification
- search/matching tests
- customer E2E route to results

---

## Child Issue — Proof, Receipt, And Booking Detail Integration

## Outcome
Wire delivered, receipt, and booking detail screens to production booking/proof state.

## Acceptance criteria
- [ ] Timeline maps real booking states.
- [ ] Proof card uses real proof metadata when present.
- [ ] Receipt shows final charged lines and payout-release copy.

## Verification
- booking proof tests
- booking visibility E2E

---

## Child Issue — Customer Stitch E2E And Browser QA

## Outcome
Create durable E2E coverage for the Stitch customer flow at mobile viewport.

## Acceptance criteria
- [ ] Public `/move/new` loads without auth redirect.
- [ ] Primary flow reaches matches.
- [ ] Declined fallback, keep-looking, booking detail, receipt, and account paths are exercised.
- [ ] Test artifacts include screenshots on failure.

## Verification
- `npm run e2e -- customer-move.test.ts public-smoke.test.ts`
- manual 375px/390px browser pass

---

## Child Issue — UX Completion Polish

## Outcome
Finish visual and interaction polish after browser QA identifies concrete defects.

## Acceptance criteria
- [ ] Text does not overflow at 375px.
- [ ] Sticky CTAs do not overlap content or home indicator.
- [ ] All touch targets are at least 44px.
- [ ] Purple/blue accent is used consistently and sparingly.

## Verification
- mobile browser QA
- screenshot review
