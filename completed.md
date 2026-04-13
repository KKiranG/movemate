# moverrr — Completed Work Log

> Last updated: `2026-04-13`
>
> Purpose: keep a durable record of what is already done, where it lives, why it was changed, and when it landed, so completed work can be removed from the active backlog without losing context.

---

## 2026-04-13 — Vocabulary-layer alignment for alerts, fit labels, privacy, and customer-facing copy

### `COMP-2026-04-13-14` — Returning-customer Home now surfaces recent move requests
- Moved from active backlog:
  - `B81`
- When: `2026-04-13`
- Where:
  - `src/app/page.tsx`
  - `src/components/customer/recent-move-requests.tsx`
  - `src/lib/data/move-requests.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - Returning customers were still landing on the same first-time homepage state, even though the blueprint says Home should evolve into a recent-requests plus new-search entry surface after the first completed use of the product.
- What changed:
  - Added a recent-move-requests data helper keyed off the signed-in customer profile.
  - Added a dedicated Recent Move Requests homepage section with status labels and action-led links back into bookings or the recovered move-request search flow.
  - Updated the homepage hero copy so signed-in returning customers see a “welcome back” framing while still keeping the need-first search entry front and center.
- Verification:
  - `npm run check`
  - `rg -n "Recent move requests|Pick up where you left off|Welcome back to your move queue|Open this move|Restart this move" src/app/page.tsx src/components/customer/recent-move-requests.tsx src/lib/data/move-requests.ts`
  - `node --import tsx --input-type=module -e "import { listRecentMoveRequestsForUser } from './src/lib/data/move-requests.ts'; console.log(typeof listRecentMoveRequestsForUser);"`
  - Note: live populated recent-request cards still depend on a configured Supabase session with real customer data in the running environment.

### `COMP-2026-04-13-13` — Customer support/dispute entry points and safe request-to-account payment continuity
- Moved from active backlog:
  - `B80`
- When: `2026-04-13`
- Where:
  - `src/app/(customer)/account/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/components/booking/booking-form.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - Customers still lacked clearly labeled support, dispute, and policy entry points in the real booking/account surfaces, and the request-confirmation flow still had no safe way to step out toward payment/account help without risking confusion or draft loss.
- What changed:
  - Added a support-and-disputes section to Account with direct paths into bookings, support email, and policy pages.
  - Added an explicit support/dispute/policy action card to booking detail so customers can quickly choose between email support, the dispute section, and governing policy references from the live booking record.
  - Added a payment-preparation continuity section in Account plus a request-confirmation link that safely returns customers back to the same trip/request path after checking account/payment help.
  - Rewrote backlog item `B79` to reflect the real remaining work after implementation discovery: true self-serve customer payment-method management still requires stored Stripe customer identity and backend support that do not yet exist in this repo.
- Verification:
  - `npm run check`
  - `node --input-type=module - <<'EOF'\nconst tripId='trip-123';\nconst moveRequestId='move-123';\nconst offerId='offer-123';\nconst tripParams = new URLSearchParams();\ntripParams.set('moveRequestId', moveRequestId);\ntripParams.set('offerId', offerId);\nconst returnTo = \`/trip/\${tripId}?\${tripParams.toString()}\`;\nconst next = new URLSearchParams({ focus:'payments', returnTo });\nconsole.log(\`/account?\${next.toString()}\`);\nEOF`
  - `rg -n "Payment preparation|Return to your saved request draft|Support and disputes|Open dispute section|Email support" src/app/(customer) src/components/booking`
  - Note: this batch intentionally does not claim true customer card management because the repo still lacks persisted customer Stripe identity and billing-portal/setup-intent plumbing.

### `COMP-2026-04-13-12` — Nearby-date language, borderline-fit guidance, and detail-only route context map
- Moved from active backlog:
  - `B73`, `B74`, and `B75`
- When: `2026-04-13`
- Where:
  - `src/app/(customer)/search/page.tsx`
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/components/trip/trip-card.tsx`
  - `src/components/trip/trip-detail-summary.tsx`
  - `src/lib/maps/directions.ts`
  - `src/lib/trip-presenters.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - Results and detail still made customers do too much date math on sparse corridors, fit-confidence labels still lacked enough practical meaning on borderline offers, and trip detail still had no visual route-context explainer after selection.
- What changed:
  - Added presenter helpers for plain-language nearby-date offsets so results and detail can say things like "2 days after your preferred date" instead of relying on raw calendar comparison.
  - Updated result cards and nearby-date recovery links to show timing-offset explanations when the returned trip date differs from the customer’s preferred date.
  - Added a presenter-backed "Review photos first" explanation path for borderline-fit results so customers understand why a route needs an extra fit check before request submission.
  - Added a small detail-only route-context map block using an inline SVG corridor preview, plus supporting route-context helpers in `src/lib/maps/directions.ts`, so maps now explain the trip after selection without becoming the discovery layer.
- Verification:
  - `npm run check`
  - `node --import tsx --input-type=module -e "import { getTripNearbyDateExplanation, getTripFitReviewExplanation } from './src/lib/trip-presenters.ts'; console.log(JSON.stringify({ before: getTripNearbyDateExplanation({ preferredDate: '2026-04-20', tripDate: '2026-04-18' }), after: getTripNearbyDateExplanation({ preferredDate: '2026-04-20', tripDate: '2026-04-22' }), review: getTripFitReviewExplanation({ breakdown: { pickupDistanceKm: 3.2, dropoffDistanceKm: 1.1, routeFit: 0, destinationFit: 0, reliability: 0, priceFit: 0 }, matchScore: 58, rules: { accepts: ['furniture'], stairsOk: true, stairsExtraCents: 0, helperAvailable: true, helperExtraCents: 0 }, spaceSize: 'M' }) }, null, 2));"`
  - `node --import tsx --input-type=module -e "import { getRouteContextMap } from './src/lib/maps/directions.ts'; console.log(JSON.stringify(getRouteContextMap({ originLatitude: -33.815, originLongitude: 151.001, destinationLatitude: -33.91, destinationLongitude: 151.19 }), null, 2));"`
  - `rg -n "after your preferred date|before your preferred date|Review photos first|Route context map|corridor-style view" src/app src/components src/lib`
  - Note: this route map is intentionally a lightweight explanatory preview rather than turn-by-turn navigation, so it stays within the blueprint’s map-light discovery constraint.

### `COMP-2026-04-13-11` — Alerts maturity, recovered move-request deep links, and grounded zero-match activity cues
- Moved from active backlog:
  - `B72`, `B78`, and `B82`
- When: `2026-04-13`
- Where:
  - `src/app/(customer)/search/page.tsx`
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/components/booking/booking-checkout-panel.tsx`
  - `src/components/booking/booking-form.tsx`
  - `src/components/search/alerts-manager.tsx`
  - `src/lib/alert-presenters.ts`
  - `src/lib/data/admin.ts`
  - `src/lib/data/unmatched-requests.ts`
  - `src/lib/notifications.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - Zero-match recovery still lacked grounded trust cues, matched recovery alerts still dropped customers into a generic search restart instead of the same move intent, and the Alerts page still grouped resolved alert history too loosely to support clear operational follow-up.
- What changed:
  - Added corridor activity summaries built from real upcoming trip counts, recent same-corridor trip posts, and aggregated unmatched-demand counts so zero-match recovery can show grounded route activity where data exists instead of vague reassurance.
  - Added a shared route-alert presenter layer and updated recovery-alert handling so matched alerts now point to `/search?moveRequestId=...` and route customers back into the original move request with recovered offers, plus matched-alert lifecycle emails now use that same deep link.
  - Reworked the search results page to reopen a saved move request when `moveRequestId` is present, render the recovered offers tied to that request, and carry `moveRequestId` and `offerId` through to trip detail.
  - Updated trip detail and request submission so recovered matched flows can reuse the same move request when the details are unchanged, while still falling back to a new move request if the customer materially edits the payload.
  - Split customer Alerts into active recovery alerts, matched alerts, and expired alerts with clearer state language and state-specific primary actions.
- Verification:
  - `npm run check`
  - `node --import tsx --input-type=module -e "import { buildRouteAlertSearchHref, getRouteAlertPrimaryAction } from './src/lib/alert-presenters.ts'; console.log(JSON.stringify({ matched: buildRouteAlertSearchHref({ pickupSuburb: 'Parramatta', dropoffSuburb: 'Newtown', preferredDate: '2026-04-20', itemCategory: 'furniture', moveRequestId: '123e4567-e89b-42d3-a456-426614174000', preferMoveRequest: true }), active: getRouteAlertPrimaryAction({ id:'1', status:'active', pickupSuburb:'Parramatta', dropoffSuburb:'Newtown', pickupLatitude:0, pickupLongitude:0, dropoffLatitude:0, dropoffLongitude:0, itemDescription:'Desk', notificationCount:0, expiresAt:'2026-04-20T00:00:00Z', createdAt:'2026-04-13T00:00:00Z', updatedAt:'2026-04-13T00:00:00Z' }).href }, null, 2));"`
  - `node --import tsx --input-type=module -e "import { getRouteAlertPrimaryAction } from './src/lib/alert-presenters.ts'; console.log(JSON.stringify(getRouteAlertPrimaryAction({ id:'1', status:'matched', moveRequestId:'123e4567-e89b-42d3-a456-426614174000', pickupSuburb:'Parramatta', dropoffSuburb:'Newtown', pickupLatitude:0, pickupLongitude:0, dropoffLatitude:0, dropoffLongitude:0, itemDescription:'Desk', itemCategory:'furniture', notificationCount:1, matchedAt:'2026-04-13T02:00:00Z', expiresAt:'2026-04-20T00:00:00Z', createdAt:'2026-04-13T00:00:00Z', updatedAt:'2026-04-13T00:00:00Z' }), null, 2));"`
  - `rg -n "Matched alerts|Expired alerts|Corridor activity|Recovered move request|Open recovered matches" src/app src/components src/lib`
  - Note: full persisted recovery-link exercise still depends on configured Supabase user/admin access in the running environment, so the deep-link continuity verification here is code-path and helper-path based rather than a live authenticated browser walkthrough.

### `COMP-2026-04-13-10` — Recovery alerts, bulky-photo enforcement, and request lifecycle notifications
- Moved from active backlog:
  - `B77`, `A28`, `A40`, and `A43`
- When: `2026-04-13`
- Where:
  - `src/app/(customer)/alerts/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/components/search/alerts-manager.tsx`
  - `src/components/booking/booking-form.tsx`
  - `src/lib/data/booking-requests.ts`
  - `src/lib/data/unmatched-requests.ts`
  - `src/lib/notifications.ts`
  - `src/lib/validation/booking.ts`
  - `src/types/booking-request.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - The customer request loop still broke down after a decline or expiry, Fast Match failure could still strand the user without a real continuation path, bulky-item photos were still optional in cases where carriers need them to decide safely, and the notification layer still only partially covered the request-era product model.
- What changed:
  - Added blocking bulky-item photo validation to the request confirmation flow, so awkward, oversized, or heavy items cannot be sent without at least one supporting photo.
  - Added request-failure recovery behavior in the booking-request data layer so single-request declines/expiries and all-failed Fast Match groups create or reuse unmatched-demand recovery alerts instead of leaving the move intent stranded.
  - Updated request detail and Alerts surfaces so customers can follow the next-best recovery CTA straight into recovery alerts or a route re-search path that preserves the original move intent.
  - Extended the notification layer with request lifecycle emails, alert lifecycle emails, and a trip-freshness notification hook, then wired request creation, request decline, request expiry, and recovery-alert creation into that layer while leaving the existing proof/payout booking notifications in place.
- Verification:
  - `npm run check`
  - `node --import tsx --input-type=module -e "import { getBookingTrustIssues } from './src/lib/validation/booking.ts'; console.log(JSON.stringify({ noPhoto: getBookingTrustIssues({ itemDescription: 'Three-seat sofa', itemSizeClass: 'L', itemWeightBand: '50_to_100kg', needsHelper: true, itemPhotoCount: 0 }).map((issue) => issue.code), withPhoto: getBookingTrustIssues({ itemDescription: 'Three-seat sofa', itemSizeClass: 'L', itemWeightBand: '50_to_100kg', needsHelper: true, itemPhotoCount: 1 }).map((issue) => issue.code) }, null, 2));"`
  - `rg -n "recovery alerts|Find the next-best match|Search the route again|Route alert active|Request expired|Request declined" src/app/(customer) src/components/search src/lib/data/booking-requests.ts src/lib/data/unmatched-requests.ts src/lib/notifications.ts`
  - Note: request and alert emails degrade safely if Resend is not configured, and live persisted recovery-alert creation still depends on configured Supabase admin access in the running environment.

### `COMP-2026-04-13-09` — Customer request tracking, one-round clarification replies, and blueprint-aligned booking timelines
- Moved from active backlog:
  - `B31`, `A09`, `D13`, and `A41`
- When: `2026-04-13`
- Where:
  - `supabase/migrations/028_request_clarifications.sql`
  - `src/app/api/booking-requests/[id]/route.ts`
  - `src/app/(customer)/bookings/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/components/booking/booking-status-stepper.tsx`
  - `src/components/booking/request-clarification-response-form.tsx`
  - `src/lib/data/booking-requests.ts`
  - `src/lib/data/mappers.ts`
  - `src/lib/status-machine.ts`
  - `src/lib/validation/booking-request.ts`
  - `src/types/booking-request.ts`
  - `src/types/database.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - Customer-side request tracking was still missing after the request-flow foundations landed, which meant users could submit Request-to-Book or Fast Match but had no real way to track pending requests, answer factual clarification once, or understand the boundary between pre-acceptance request state and the accepted booking timeline.
- What changed:
  - Added the clarification persistence migration with explicit one-round fields, clarification expiry, customer-response tracking, a bounded clarification-round counter, an index for stale clarification cleanup, and a customer update policy on `booking_requests`.
  - Extended the booking-request type, mapper, validation, and data layer so clarification rounds can be requested once, customer replies can move the request back to `pending`, and stale clarification requests auto-expire before customer or carrier reads.
  - Extended `GET/PATCH /api/booking-requests/[id]` so customers can read their own request record and send a single factual clarification reply through the same resource instead of relying on shadow messaging.
  - Reworked customer `Bookings` into a request-and-booking surface, added pre-acceptance request detail inside `/bookings/[id]`, added the clarification reply form, and updated the status stepper so both request and accepted-booking timelines now use blueprint-aligned language such as Accepted, Pickup Due, and Delivered Pending Confirmation.
- Verification:
  - `npm run check`
  - `node --import tsx --input-type=module -e "import { bookingRequestCustomerResponseSchema } from './src/lib/validation/booking-request.ts'; console.log(JSON.stringify({ valid: bookingRequestCustomerResponseSchema.safeParse({ customerResponse: 'Pickup is one flight up with a wide stairwell.' }).success, invalid: bookingRequestCustomerResponseSchema.safeParse({ customerResponse: '   ' }).success }, null, 2));"`
  - `node --import tsx --input-type=module -e "import { GET, PATCH } from './src/app/api/booking-requests/[id]/route.ts'; const getRes = await GET(new Request('http://localhost/api/booking-requests/00000000-0000-0000-0000-000000000000'), { params: { id: '00000000-0000-0000-0000-000000000000' } }); console.log('get', getRes.status, await getRes.text()); const patchRes = await PATCH(new Request('http://localhost/api/booking-requests/00000000-0000-0000-0000-000000000000', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ customerResponse: 'Pickup is on the second level with lift access.' }) }), { params: { id: '00000000-0000-0000-0000-000000000000' } }); console.log('patch', patchRes.status, await patchRes.text());"`
  - `rg -n "Track requests and bookings|Request detail|open-ended|reply to clarification" src/app/(customer)/bookings src/components/booking src/lib/data/booking-requests.ts`
  - Note: live authenticated request reads and clarification updates still need a configured Supabase environment to exercise the full persisted path; route-level verification in this worktree covered the expected unauthenticated `401` guard behavior.

### `COMP-2026-04-13-08` — Customer trip detail now submits staged Request-to-Book and Fast Match flows
- Moved from active backlog:
  - `B28`, `B29`, `B30`, and `B76`
- When: `2026-04-13`
- Where:
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/components/booking/sticky-booking-cta.tsx`
  - `src/components/booking/booking-checkout-panel.tsx`
  - `src/components/booking/booking-form.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - The customer trip detail flow was still the biggest remaining legacy direct-booking leak: it framed the page like a listing detail, pushed one-path booking CTAs, and submitted directly to `/api/bookings` with payment-intent setup instead of using the new move-request and booking-request model.
- What changed:
  - Reframed the trip detail page and mobile CTA around trust, route fit, restrictions, price context, and request-choice language so the page answers whether the trip is sensible before the customer commits.
  - Added a lightweight Request-to-Book versus Fast Match explainer and choice card in checkout, then pointed the sticky CTA at that decision point instead of dropping customers straight into the old one-path form.
  - Replaced the old booking form with a three-stage confirmation flow for item details, route/access details, and final review, while keeping draft persistence, trust validation, photo upload, and iOS-safe camera capture behavior.
  - Switched final submission from legacy booking creation plus payment-intent setup to `POST /api/move-requests` followed by either `POST /api/booking-requests` or `POST /api/booking-requests/fast-match`, with honest success messaging that stays pre-acceptance until a carrier actually books the job.
- Verification:
  - `npm run check`
  - `node --import tsx --input-type=module -e "import { bookingRequestCreateSchema } from './src/lib/validation/booking-request.ts'; const result = bookingRequestCreateSchema.safeParse({ moveRequestId: '123e4567-e89b-42d3-a456-426614174000', listingId: '123e4567-e89b-42d3-a456-426614174001' }); console.log(JSON.stringify(result.success ? { success: true } : result.error.flatten(), null, 2));"`
  - `rg -n "Go to bookings|booking area|card is authorized|create-intent|/api/bookings" src/components/booking/booking-form.tsx src/components/booking/booking-checkout-panel.tsx src/app/(customer)/trip/[id]/page.tsx`
  - Note: this batch verifies the request-submission code path, schema acceptance, and copy cleanup in-repo; live authenticated writes still need a configured Supabase environment to exercise the full persisted request flow end to end.

### `COMP-2026-04-13-04` — Move-request, offers, and unmatched-demand APIs with waitlist removal
- Moved from active backlog:
  - `A20`, `A21`, `A25`, and `A29`
- When: `2026-04-13`
- Where:
  - `src/app/api/move-requests/route.ts`
  - `src/app/api/offers/route.ts`
  - `src/app/api/unmatched-requests/route.ts`
  - `src/app/api/search/route.ts`
  - `src/lib/data/profiles.ts`
  - `src/lib/data/offers.ts`
  - `src/lib/data/unmatched-requests.ts`
  - `src/lib/data/move-requests.ts`
  - `src/lib/validation/unmatched-request.ts`
  - `src/types/alert.ts`
  - `src/types/database.ts`
  - `supabase/migrations/018_unmatched_requests_guest_capture.sql`
  - `src/components/customer/waitlist-form.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - The new request-offer foundation needed real API entrypoints before the customer flow could move off legacy search-plus-booking behavior, and the old zero-match POST path was still persisting waitlist entries under the wrong product model.
- What changed:
  - Added `POST /api/move-requests` as the authenticated need-submission endpoint with rate limiting, blueprint validation, submitted-status defaulting, and analytics tracking.
  - Added `GET /api/offers` keyed by `moveRequestId`, including proper `customers.id` ownership checks and a compatibility fallback that derives ranked offers from existing trip search results when persisted offer rows do not exist yet.
  - Added authenticated `POST /api/unmatched-requests` for signed-in zero-match recovery, then updated the shared unmatched-request schema, table types, and follow-up migration so guest search recovery can also persist nullable-customer unmatched demand cleanly.
  - Replaced `POST /api/search` waitlist writes with unmatched-demand creation, added route-coordinate resolution from Maps or curated suburb fallbacks, and rewrote the zero-match customer form messaging around route requests, alerts, and concierge follow-up instead of a launch waitlist.
  - Corrected the request-flow routes to resolve `customers.id` from the signed-in auth user before writing or reading move requests and unmatched demand, instead of incorrectly using the raw auth user id as a foreign key.
- Verification:
  - `npm run check`
  - `node --import tsx --input-type=module -e "import { POST } from './src/app/api/search/route.ts'; const req = new Request('http://localhost/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({from:'Newtown',to:'Bondi',itemCategory:'furniture'})}); const res = await POST(req); console.log('status',res.status); console.log(await res.text());"`
  - `rg -n "waitlist_entries|join the waitlist|launch waitlist|Unable to join the waitlist" src/app src/components src/lib`
  - Note: direct authenticated route execution was limited in this worktree because Supabase and Maps env vars are not configured, so the live route invocation here verified the intended graceful-degradation path (`503`) rather than a full persisted write.

### `COMP-2026-04-13-05` — Request-to-Book, Fast Match, and carrier decision APIs on the booking-request model
- Moved from active backlog:
  - `A22`, `A23`, and `A24`
- When: `2026-04-13`
- Where:
  - `src/app/api/booking-requests/route.ts`
  - `src/app/api/booking-requests/fast-match/route.ts`
  - `src/app/api/booking-requests/[id]/route.ts`
  - `src/lib/data/booking-requests.ts`
  - `src/lib/data/offers.ts`
  - `src/lib/data/move-requests.ts`
  - `src/lib/data/profiles.ts`
  - `src/lib/validation/booking-request.ts`
  - `src/lib/status-machine.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - The request-offer model needed a real write path for single-carrier requests, Fast Match groups, and carrier decisions before the app could move off legacy direct-booking behavior.
- What changed:
  - Added `POST /api/booking-requests` for single-carrier Request-to-Book, including customer profile resolution, move-request ownership checks, offer persistence from derived search results when needed, duplicate-open-request prevention, and default response deadlines.
  - Added `POST /api/booking-requests/fast-match` so a customer can create one capped request group across up to three distinct carriers, with shared deadlines and request-group identifiers.
  - Added `PATCH /api/booking-requests/[id]` for carrier accept, decline, and clarification actions, backed by explicit booking-request transition rules instead of mutating legacy bookings directly first.
  - Bridged acceptance into the current live system by creating a legacy booking only when a carrier accepts, then marking the winning request accepted, revoking sibling Fast Match requests, updating offer status, and moving the move request into the booked state.
- Verification:
  - `npm run check`
  - `node --import tsx --input-type=module -e "import { POST as createRequest } from './src/app/api/booking-requests/route.ts'; const req = new Request('http://localhost/api/booking-requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({moveRequestId:'00000000-0000-0000-0000-000000000000',listingId:'00000000-0000-0000-0000-000000000001'})}); const res = await createRequest(req); console.log('status',res.status); console.log(await res.text());"`
  - `node --import tsx --input-type=module -e "import { bookingRequestCreateSchema } from './src/lib/validation/booking-request.ts'; const parsed = bookingRequestCreateSchema.safeParse({moveRequestId:'00000000-0000-0000-0000-000000000000'}); console.log(JSON.stringify(parsed, null, 2));"`
  - Note: full accepted-request execution against persisted Supabase data was not possible in this worktree because Supabase env vars are not configured here, so the live route verification covered the intended unauthenticated guard path and the new payload validation edge case.

### `COMP-2026-04-13-06` — Carrier Requests tab and decision cards on the booking-request model
- Moved from active backlog:
  - `B11`, `B38`, `B39`, `B40`, and `B90`
- When: `2026-04-13`
- Where:
  - `src/app/(carrier)/carrier/requests/page.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/components/carrier/pending-bookings-alert.tsx`
  - `src/components/carrier/request-clarification-sheet.tsx`
  - `src/lib/data/booking-requests.ts`
  - `src/types/carrier.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - The carrier experience still treated Requests as a shell over legacy pending bookings, which left the new booking-request model unused and preserved the wrong action language at the exact point where carrier trust and response speed matter most.
- What changed:
  - Rebuilt the dedicated carrier Requests page around live booking-request decision cards instead of legacy pending bookings, while keeping the Requests route as a first-class tab in the MVP IA.
  - Added a typed carrier request-card view model in the data layer so carrier home and the Requests page can both read payout, route fit, access complexity, item context, response deadline, and Fast Match grouping from the booking-request model.
  - Reworked the shared request card UI to use Accept, Decline, and Request Clarification actions backed by the new booking-request APIs instead of confirm/cancel booking mutations.
  - Added a structured clarification sheet with predefined reason codes and factual-message entry, plus lightweight external item-photo thumbnails so carriers can review real move context before deciding.
- Verification:
  - `npm run check`
  - `rg -n "Confirm|Decline|pending bookings|booking request queue until the full booking-request model lands|Needs decision|Request clarification|Fast Match|Request to Book" src/app/(carrier)/carrier/requests/page.tsx src/components/carrier/pending-bookings-alert.tsx src/components/carrier/request-clarification-sheet.tsx src/app/(carrier)/carrier/dashboard/page.tsx`
  - `node --import tsx --input-type=module -e "import { PATCH } from './src/app/api/booking-requests/[id]/route.ts'; const req = new Request('http://localhost/api/booking-requests/00000000-0000-0000-0000-000000000000',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'clarify'})}); const res = await PATCH(req,{params:{id:'00000000-0000-0000-0000-000000000000'}}); console.log('status',res.status); console.log(await res.text());"`
  - Note: live carrier-side request mutation against persisted booking-request rows still needs a configured Supabase environment, so the direct route execution here verified the intended unauthenticated guard path while `npm run check` covered the integrated code path.

### `COMP-2026-04-13-07` — Runsheet-first Today view and clearer payout blockers across carrier ops
- Moved from active backlog:
  - `B41`, `B91`, and `B92`
- When: `2026-04-13`
- Where:
  - `src/app/(carrier)/carrier/today/page.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/app/(carrier)/carrier/payouts/page.tsx`
  - `src/components/booking/status-update-actions.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - The carrier trip-day experience was still a trip-health dashboard instead of a runsheet, and payout blockers were explained inconsistently across Home, Today, and Payouts.
- What changed:
  - Rebuilt Today around grouped live stops per trip, with the next operational step, inline proof/exception controls, payout context, and direct trip-detail escape hatches on every stop card.
  - Moved Today away from abstract health-score-first thinking and toward an actual stop-by-stop runsheet that foregrounds the live work carriers need to complete now.
  - Exposed the existing one-tap persisted status and proof actions directly inline on each live stop in Today, using the booking states the backend already supports instead of hiding those actions inside trip detail only.
  - Added a consistent `Clears when` explanation line to payout-block cards on carrier Home, Today, and Payouts so carriers can see exactly what unblocks funds and where to act next.
- Verification:
  - `npm run check`
  - `rg -n "Trip health|Which active routes need attention|score is deterministic and only moves|Clears when|Runsheet|StatusUpdateActions" src/app/(carrier)/carrier/today/page.tsx src/app/(carrier)/carrier/dashboard/page.tsx src/app/(carrier)/carrier/payouts/page.tsx`
  - `node --import tsx --input-type=module -e "import { PATCH } from './src/app/api/bookings/[id]/route.ts'; const req = new Request('http://localhost/api/bookings/00000000-0000-0000-0000-000000000000',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({nextStatus:'picked_up'})}); const res = await PATCH(req,{params:{id:'00000000-0000-0000-0000-000000000000'}}); console.log('status',res.status); console.log(await res.text());"`
  - Note: Today now exposes the real persisted inline actions the current backend supports (`confirmed` through `delivered`) rather than inventing additional trip-day states that do not yet exist in the data model.

### `COMP-2026-04-13-01` — Alert naming, route-fit labels, privacy boundaries, and plain-language fit copy
- Moved from active backlog:
  - `B08`, `B09`, `B53`, `B54`, `B62`, and `B63`
- When: `2026-04-13`
- Where:
  - `src/components/search/save-alert-form.tsx`
  - `src/components/search/alerts-manager.tsx`
  - `src/app/(customer)/alerts/page.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/app/(customer)/saved-searches/page.tsx`
  - `src/components/trip/trip-card.tsx`
  - `src/components/trip/trip-detail-summary.tsx`
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/app/(customer)/carrier/[id]/page.tsx`
  - `src/components/booking/booking-form.tsx`
  - `src/lib/trip-presenters.ts`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - The user-facing vocabulary layer still leaked legacy saved-search naming, dashboard framing, inconsistent privacy promises, route-fit wording drift, and freight-style fit language that pulled the product away from the governing blueprint.
- What changed:
  - Renamed the customer alert surface and its main components to alert-based names, kept `/alerts` as the canonical route, and left `/saved-searches` as a compatibility redirect rather than a primary customer destination.
  - Reworked result-card and trip-detail fit language around blueprint route-fit and fit-confidence labels, replacing raw capacity framing with plain-language suitability guidance and route-fit explanations.
  - Removed customer-visible carrier phone sharing from booking detail, tightened privacy messaging so exact addresses and direct contact stay hidden until confirmation, and aligned the touched request and booking surfaces around on-platform coordination.
  - Cleaned the remaining dashboard-centric wording from admin operations failure messaging and softened request-form copy so customer item details describe lift effort and fit in plain language instead of freight-style terminology.
- Verification:
  - `npm run check`
  - `rg -n "save-search-form|saved-searches-manager|SaveSearchForm|SavedSearchesManager|Small detour required|carrierPhone|tap-to-call|Call carrier|% capacity|capacity left|admin dashboard" src/app src/components src/lib`

### `COMP-2026-04-13-02` — Pricing-language cleanup and request-state wording across cards, checkout, and request detail
- Moved from active backlog:
  - `B60`, `B61`, and `B68`
- When: `2026-04-13`
- Where:
  - `src/components/trip/trip-card.tsx`
  - `src/components/trip/trip-detail-summary.tsx`
  - `src/components/booking/sticky-booking-cta.tsx`
  - `src/components/booking/price-breakdown.tsx`
  - `src/components/booking/booking-checkout-panel.tsx`
  - `src/components/booking/booking-form.tsx`
  - `src/components/booking/booking-status-stepper.tsx`
  - `src/components/booking/pending-expiry-countdown.tsx`
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - The remaining customer-facing purchase flow still described a superseded flat booking-fee model and still sounded like an instant booking flow instead of a request that waits on carrier review.
- What changed:
  - Removed flat booking-fee language from the touched customer-facing result, detail, CTA, and breakdown surfaces, replacing it with total-price and moverrr-charge wording that does not teach the old pricing mental model.
  - Reworked trip-card hierarchy so cards now surface total price, fit, route quality, timing, trust, and an explicit "Why this matches" explanation before the customer taps through.
  - Shifted checkout, submit, success, and pending-state copy toward request submission and carrier review language so the customer sees the right next-step expectations before and after submitting.
  - Aligned the pending booking detail timeline and response-window language with the request-submitted state instead of implying a fully confirmed booking.
- Verification:
  - `npm run check`
  - `rg -n "booking fee|Book into this trip|Book now|Booking created|Creating booking|Continue to payment|fixed \\$5 booking fee|Awaiting Confirmation|Carrier has 2 hours to confirm|booking timeline before you pay|Starting total includes the fixed booking fee" src/app src/components`

### `COMP-2026-04-13-03` — Request-flow schema foundation, typed entity layer, and compatibility scaffolding
- Moved from active backlog:
  - `D01`, `D02`, `D03`, `D05`, and `D16`
- When: `2026-04-13`
- Where:
  - `supabase/migrations/017_request_flow_foundation.sql`
  - `src/types/database.ts`
  - `src/types/move-request.ts`
  - `src/types/booking-request.ts`
  - `src/types/alert.ts`
  - `src/types/booking.ts`
  - `src/types/trip.ts`
  - `src/lib/data/mappers.ts`
  - `src/lib/data/move-requests.ts`
  - `src/lib/data/offers.ts`
  - `src/lib/data/booking-requests.ts`
  - `src/lib/data/unmatched-requests.ts`
  - `src/lib/validation/move-request.ts`
  - `src/lib/validation/booking-request.ts`
  - `src/lib/validation/unmatched-request.ts`
  - `src/lib/demo-data.ts`
  - `src/lib/__tests__/carrier-today.test.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - The deeper request-offer migration needed real persisted entities, type contracts, and compatibility mapping before any API or UI layer could safely move off the legacy direct-booking model.
- What changed:
  - Added the new request-flow foundation migration with `move_requests`, `offers`, `booking_requests`, and `unmatched_requests`, including RLS policies, customer/carrier/admin access rules, updated-at triggers, and GIST indexes on new geography columns.
  - Added first-class TypeScript models and database table definitions for move requests, offers, booking requests, and unmatched requests, plus zod validation for the new payload shapes.
  - Added minimal data-layer helpers and mapper functions so the new entities can be created, listed, and read in code now instead of existing only as database stubs.
  - Added compatibility flow references onto `Trip` and `Booking`, then updated the mapper layer and fixture data so legacy listings/bookings and the new request-flow entities can coexist during the migration period.
- Verification:
  - `npm run check`
  - `rg -n "enable row level security|using gist|move_requests|offers|booking_requests|unmatched_requests" supabase/migrations/017_request_flow_foundation.sql src/types/database.ts src/lib/data src/lib/validation`

## 2026-04-12 — Need-first public surface realignment

### `COMP-2026-04-12-01` — Need-first homepage, fixed best-fit search ordering, and public copy correction
- Moved from active backlog:
  - `B01`, `B02`, `B04`, `B05`, `B57`, and `B67`
- When: `2026-04-12`
- Where:
  - `README.md`
  - `src/app/page.tsx`
  - `src/app/layout.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/app/(marketing)/become-a-carrier/page.tsx`
  - `src/components/search/search-bar.tsx`
  - `src/components/layout/site-header.tsx`
  - `src/components/layout/site-footer.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - The public customer entry and matched-results flow were still teaching a browse-first product shape, and the old sort controls made results behave like an archive instead of a ranked answer set.
- What changed:
  - Rebuilt the homepage around need declaration, example jobs, and trust scaffolding, while removing the featured live-inventory shelf and the homepage dependency on public trip-card data.
  - Locked customer search to one deterministic best-fit ordering, removed all customer-facing sort controls, and stripped sort params from the touched search/detail flow.
  - Rewrote the search empty-state, helper, and route-alert copy so it talks about move needs, ranked matches, and route watch behavior instead of browsing inventory.
  - Updated root metadata, footer/header language, carrier marketing copy, and README product notes so always-visible product framing now points toward need-first matching.
- Verification:
  - `npm run check`
  - `rg -n "SearchSort|sort-desktop|sort-mobile|general furniture inventory" src/app src/components README.md`

### `COMP-2026-04-12-02` — Navigation IA, alerts route, and carrier-home shell alignment
- Moved from active backlog:
  - `B03`, `B06`, `B10`, `B55`, and `B59`
- When: `2026-04-12`
- Where:
  - `src/components/layout/site-header.tsx`
  - `src/components/layout/mobile-nav.tsx`
  - `src/app/(customer)/alerts/page.tsx`
  - `src/app/(customer)/saved-searches/page.tsx`
  - `src/app/(customer)/account/page.tsx`
  - `src/app/(customer)/bookings/page.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/app/(carrier)/carrier/requests/page.tsx`
  - `src/app/(carrier)/carrier/account/page.tsx`
  - `src/app/(carrier)/carrier/trips/page.tsx`
  - `src/app/(carrier)/carrier/payouts/page.tsx`
  - `src/app/(carrier)/carrier/today/page.tsx`
  - `src/app/(carrier)/carrier/templates/page.tsx`
  - `src/app/(carrier)/carrier/stats/page.tsx`
  - `src/app/(auth)/signup/page.tsx`
  - `src/app/(auth)/carrier/signup/page.tsx`
  - `src/app/(auth)/login/page.tsx`
  - `src/components/search/save-search-form.tsx`
  - `src/components/search/saved-searches-manager.tsx`
  - `src/components/carrier/pending-bookings-alert.tsx`
  - `src/components/carrier/carrier-post-success-card.tsx`
  - `src/components/carrier/save-trip-template-action.tsx`
  - `src/components/booking/status-update-actions.tsx`
  - `todolist.md`
  - `completed.md`
- Why:
  - The realigned backlog needed actual MVP destinations for `Alerts`, `Account`, and `Requests`, and the product still leaked the old saved-search and carrier-dashboard mental models in user-facing surfaces.
- What changed:
  - Added real shell routes for customer `Alerts` and `Account`, plus carrier `Requests` and `Account`, then rewired the main header and mobile nav to the blueprint IA for signed-in customer and carrier states.
  - Redirected the old `/saved-searches` page to `/alerts` and rewrote the customer-facing saved-search manager and form copy so the surface now behaves like route alerts instead of passive saved browsing.
  - Renamed the primary carrier operational surface to `Carrier home` across metadata, intros, back-links, empty states, and post-action messaging, while removing the stats-page CTA from carrier home.
  - Rewrote auth and empty-state copy so signup, login, and customer bookings reinforce need declaration, alerts, and request handling instead of browse-first inventory behavior.
- Verification:
  - `npm run check`
  - `rg -n "Saved searches|saved searches|saved search|Back to dashboard|Go to dashboard|Carrier dashboard|carrier dashboard|your dashboard|from your dashboard|dashboard refresh|manage saved searches|customers can browse|let customers browse|Browse trips to get started" src/app src/components`

---

## 2026-04-09 — Maps-first matching, booking integrity, trust hardening, and backlog truth sync

### `COMP-2026-04-09-44` — PR 21 hardened maps-backed search, payment reversals, booking shape, and admin trust visibility
- Moved from active backlog:
  - `EP4`, `EQ6`, `EQ8`, and `ET12`
- Closed or materially resolved from the MVP critical blockers section:
  - carrier onboarding atomicity
  - structured booking size and weight capture for capacity estimation
  - Stripe webhook replay idempotency storage and duplicate short-circuiting
  - cancellation void/refund handling through one shared payment-reversal path
  - off-platform payment detection with admin visibility
  - Google Maps-first production search resolution plus distance-backed guidance guardrails
  - trust-center page and evidence-led trust copy on touched surfaces
- When: `2026-04-09`
- Where:
  - `supabase/migrations/016_pr21_maps_payments_and_booking_shape.sql`
  - `src/lib/maps/google.ts`
  - `src/lib/maps/haversine.ts`
  - `src/lib/pricing/guardrails.ts`
  - `src/lib/stripe/payment-actions.ts`
  - `src/lib/data/trips.ts`
  - `src/lib/data/listings.ts`
  - `src/lib/data/carriers.ts`
  - `src/lib/data/bookings.ts`
  - `src/lib/data/admin.ts`
  - `src/app/api/payments/webhook/route.ts`
  - `src/app/api/bookings/route.ts`
  - `src/app/api/admin/route.ts`
  - `src/app/api/admin/rate-limit/route.ts`
  - `src/app/api/reviews/[id]/response/route.ts`
  - `src/app/api/trips/route.ts`
  - `src/app/api/trips/price-guidance/route.ts`
  - `src/components/booking/booking-form.tsx`
  - `src/components/carrier/carrier-trip-wizard.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/app/(marketing)/trust/page.tsx`
  - `src/components/layout/site-footer.tsx`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `src/app/(admin)/admin/bookings/page.tsx`
  - `src/app/(admin)/admin/disputes/page.tsx`
  - `src/app/(admin)/admin/payments/page.tsx`
  - `src/app/(admin)/admin/carriers/[id]/page.tsx`
  - `src/lib/validation/booking.ts`
  - `src/lib/validation/trip.ts`
  - `src/types/booking.ts`
  - `src/types/trip.ts`
  - `src/types/database.ts`
  - `.agent-skills/AUTH.md`
  - `.agent-skills/MATCHING-ENGINE.md`
  - `.agent-skills/PRICING.md`
  - `.agent-skills/PAYMENTS.md`
  - `src/lib/__tests__/pricing-guardrails.test.ts`
  - `src/lib/__tests__/payment-reversal.test.ts`
  - `src/app/api/payments/webhook/__tests__/idempotency.test.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - The remaining hard gaps had shifted from missing basic screens to truth-of-system issues: production search still needed a commercial maps source of truth, booking capacity still leaned too hard on free text, cancellation money flow was split and under-specified, webhook replays still lacked durable guards, and the backlog still described several already-shipped gaps as if they were open.
- What changed:
  - Promoted Google Maps to the production route-resolution path, kept the curated Sydney suburb map only as degraded fallback, and replaced the old corridor-pricing heuristics with distance-backed guidance plus a hard `$50` floor for long-distance spare-capacity trips.
  - Moved carrier onboarding onto a single atomic RPC so the carrier row and first vehicle cannot split on partial failure, then carried the same “hard fail when privileged access is missing” rule into admin-only booking mutations.
  - Centralized booking cancellation money flow through a shared reversal helper so uncaptured bookings void authorizations, captured bookings refund cleanly, and dispute/admin cancellation paths no longer drift.
  - Added structured booking size and weight capture, updated the booking validation/trust model, and taught the capacity-estimation SQL path to prefer those stronger signals over free text.
  - Added off-platform payment attempt visibility for admins, durable Stripe webhook replay claims, retry-state admin fallbacks on the major admin pages, and a customer-facing `/trust` page that states payment and dispute protection in evidence-led language.
  - Synced the repo memory and the backlog so shipped PR 21 work is no longer listed as open and the remaining items now reflect the narrower follow-ups that are still genuinely real.
- Verification:
  - `npm run check`
  - `npm test -- src/lib/__tests__/booking-validation.test.ts src/lib/__tests__/pricing-guardrails.test.ts src/lib/__tests__/payment-reversal.test.ts src/lib/__tests__/webhook-events.test.ts src/lib/__tests__/booking-payment-capture.test.ts src/app/api/payments/webhook/__tests__/replay.test.ts src/app/api/payments/webhook/__tests__/idempotency.test.ts`

---

## 2026-04-09 — Agentic Development System — Infrastructure

### `COMP-2026-04-09-43` — Hooks, agent hardening, skill upgrades, new skills, new agents, and CI docs check
- Moved from active backlog:
  - `AG-H1`, `AG-H2`, `AG-H4`, `AG-H6`, `AG-A3`, `AG-A5`, `AG-A6`, `AG-A7`, `AG-A8`, `AG-S1`, `AG-S2`, `AG-S3`, `AG-S4`, `AG-S5`, `AG-S6`, `AG-S7`, `AG-NS2`, `AG-NS3`, `AG-NS5`, `AG-NS6`, `AG-NA1`, `AG-NA2`, `AG-C1`, `AG-M2`, `AG-CI1`, `AG-CI2`, `AG-X1`, `AG-X3`, `EO10`, and `EO12`
- When: `2026-04-09`
- Where:
  - `.claude/settings.json`
  - `.claude/scripts/typecheck-on-edit.sh`
  - `.claude/scripts/docs-sync-reminder.sh`
  - `.claude/scripts/log-subagent.sh`
  - `.claude/scripts/pricing-check.sh`
  - `.claude/agents/schema-reviewer.md`
  - `.claude/agents/payments-verifier.md`
  - `.claude/agents/feature-implementer.md`
  - `.claude/agents/docs-keeper.md`
  - `.claude/agents/repo-explorer.md`
  - `.claude/agents/product-researcher.md`
  - `.claude/agents/debugger.md`
  - `.claude/agents/test-runner.md`
  - `.claude/skills/verify-web-ui/SKILL.md`
  - `.claude/skills/verify-api/SKILL.md`
  - `.claude/skills/verify-admin-ops/SKILL.md`
  - `.claude/skills/verify-moverrr-change/SKILL.md`
  - `.claude/skills/booking-safety-audit/SKILL.md`
  - `.claude/skills/dispute-resolution-audit/SKILL.md`
  - `.claude/skills/release-readiness/SKILL.md`
  - `.claude/skills/postmortem/SKILL.md`
  - `.claude/skills/experiment-design/SKILL.md`
  - `.claude/skills/metrics-review/SKILL.md`
  - `.claude/skills/admin-queue-review/SKILL.md`
  - `.claude/skills/saved-search-demand-review/SKILL.md`
  - `.claude/skills/carrier-quality-review/SKILL.md`
  - `.claude/skills/chrome-qa-tester/SKILL.md`
  - `.claude/skills/fix-issue/SKILL.md`
  - `.claude/skills/spec/SKILL.md`
  - `.claude/skills/review-pr/SKILL.md`
  - `.claude/skills/session-start/SKILL.md`
  - `.claude/skills/booking-safety-audit/examples/pricing-check.md`
  - `.claude/skills/verify-moverrr-change/examples/verification-report.md`
  - `.claude/skills/release-readiness/examples/release-checklist.md`
  - `CLAUDE.md`
  - `.gitignore`
  - `.claude/operating-system.md`
  - `.claude/command-catalog.md`
  - `.github/workflows/claude-docs-check.yml`
  - `todolist.md`
  - `completed.md`
- Why:
  - The repo’s agent operating system still had a second layer of unfinished runtime hardening: hooks were incomplete, several specialist agents still lacked tighter contracts, high-value skills needed stronger report scaffolding, and the remaining workflow skills and agents were still only backlog ideas.
- What changed:
  - Added the remaining shared hooks for notifications, typecheck-on-edit, docs-sync reminders, pricing guards, and subagent session logging.
  - Hardened the schema, payments, feature, docs, and explorer agent contracts with stronger trigger rules, turn limits, background behavior, isolation, and skill preload alignment.
  - Created the `debugger` and `test-runner` agents plus the `fix-issue`, `spec`, `review-pr`, and `session-start` workflow skills.
  - Backfilled structured report templates, argument hints, adversarial probes, examples, and path-scoping into the remaining verification and review skills.
  - Added repo-side docs consistency automation and synced the backlog so the shipped agent OS surface is no longer listed as open work.
- Verification:
  - `npm run check` not applicable for the infrastructure-only subset Claude landed
  - reviewed the changed `.md`, `.sh`, `.json`, and `.yml` files for structural consistency and repo-path correctness

---

## 2026-04-09 — Carrier activation, branded lifecycle email, search truth, admin carrier detail, and repo-side observability wiring

### `COMP-2026-04-09-42` — PR 10 closed the carrier activation and search-truth architecture wave
- Moved from active backlog:
  - `EP12`, `EA8`, `ET3`, and `ET10`
- Closed or materially resolved from the MVP critical blockers section:
  - dedicated carrier signup path
  - Stripe Connect Express onboarding start/return/webhook sync
  - branded transactional email templates
  - admin carrier detail page with internal notes/tags and required rejection reasons
  - immediate booking-reference success state
  - flexible-date search and coordinate-backed suburb fallback
- When: `2026-04-09`
- Where:
  - `src/app/(auth)/carrier/signup/page.tsx`
  - `src/components/auth/signup-form.tsx`
  - `src/components/layout/site-header.tsx`
  - `src/app/(marketing)/become-a-carrier/page.tsx`
  - `src/lib/stripe/connect.ts`
  - `src/app/api/carrier/stripe/connect-start/route.ts`
  - `src/app/api/carrier/stripe/connect-return/route.ts`
  - `src/app/api/payments/webhook/route.ts`
  - `src/components/carrier/connect-payout-button.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/app/(carrier)/carrier/onboarding/page.tsx`
  - `src/app/(carrier)/carrier/payouts/page.tsx`
  - `src/app/api/carrier/payouts/export/route.ts`
  - `src/lib/email/index.ts`
  - `src/lib/data/bookings.ts`
  - `src/lib/data/admin.ts`
  - `src/lib/data/feedback.ts`
  - `src/app/api/admin/carriers/[id]/verify/route.ts`
  - `src/app/(customer)/search/page.tsx`
  - `src/components/search/search-bar.tsx`
  - `src/components/trip/trip-card.tsx`
  - `src/lib/maps/sydney-suburb-coords.ts`
  - `src/lib/data/trips.ts`
  - `src/types/trip.ts`
  - `src/components/booking/booking-form.tsx`
  - `src/lib/data/carriers.ts`
  - `src/components/admin/carrier-ops-form.tsx`
  - `src/components/admin/verification-queue.tsx`
  - `src/app/(admin)/admin/carriers/[id]/page.tsx`
  - `src/app/api/admin/carriers/[id]/route.ts`
  - `src/app/api/payments/create-intent/route.ts`
  - `src/app/api/bookings/[id]/review/route.ts`
  - `src/app/api/bookings/[id]/confirm-receipt/route.ts`
  - `src/app/api/saved-searches/route.ts`
  - `src/app/api/saved-searches/[id]/route.ts`
  - `src/app/api/trips/templates/route.ts`
  - `src/app/api/trips/templates/[id]/route.ts`
  - `src/app/api/trips/templates/[id]/post/route.ts`
  - `src/app/(carrier)/carrier/post/page.tsx`
  - `src/app/(carrier)/carrier/stats/page.tsx`
  - `src/app/(carrier)/carrier/templates/page.tsx`
  - `src/app/(carrier)/carrier/trips/page.tsx`
  - `src/app/(carrier)/carrier/trips/[id]/page.tsx`
  - `next.config.js`
  - `sentry.server.config.ts`
  - `sentry.client.config.ts`
  - `todolist.md`
  - `completed.md`
- Why:
  - The hardest remaining product gaps had shifted from “missing feature basics” to “truthful system architecture”: carriers needed a real payout path, emails needed a reusable trust layer, search needed route truth instead of suburb text hacks, and admin ops needed one place to make evidence-backed carrier decisions.
- What changed:
  - Added a dedicated carrier signup path and redirected supply-intent CTAs into it, while keeping the existing shared-user plus onboarding-upsert model intact for MVP.
  - Landed Stripe Connect Express account creation/resume, return-path syncing, carrier-facing payout CTAs, webhook `account.updated` handling, a carrier payout ledger, and CSV export.
  - Replaced bare inline booking/admin/dispute HTML with a branded shared template layer, then added verification-approved/rejected, review-request, and delivery-confirmed lifecycle emails on top of that system.
  - Reworked search fallback to use curated Sydney suburb coordinates instead of raw suburb `ilike`, added flexible-date search with grouped browse results, exposed plain-language route-fit cues on cards, and shifted search filters into customer-language item intents.
  - Added an admin carrier detail page with document access, expiry context, internal notes, internal tags, rejection-reason enforcement, and queue deep-links, plus boundary-schema hardening for a broad set of mutating API routes.
  - Added carrier-page metadata coverage and repo-side Sentry Next.js/source-map wiring so internal tabs and observability config both match the current product state.
- Verification:
  - `npm run check`
  - `npm test`
## 2026-04-09 — Agent OS hardening, shared memory, and task-system cleanup

### `COMP-2026-04-09-41` — Core agent operating system hardening, repo-portable workflows, and backlog truth sync
- Moved from active backlog:
  - `AG-H3`, `AG-H5`, `AG-A1`, `AG-A2`, `AG-A4`, `AG-NS1`, `AG-NS4`, `AG-NA3`, `AG-C2`, `AG-C3`, `AG-C4`, `AG-M1`, `AG-TS1`, `AG-TS2`, `AG-X2`, and `AG-X4`
- Removed from active backlog as stale duplicates already shipped in earlier records:
  - `EO1`, `EO2`, `EO3`, `EO4`, `EO5`, `EO6`, `EO7`, `EO8`, `EO9`, and `EO11`
- When: `2026-04-09`
- Where:
  - `CLAUDE.md`
  - `TASK-RULES.md`
  - `.gitignore`
  - `.claude/settings.json`
  - `.claude/task-template.md`
  - `.claude/operating-system.md`
  - `.claude/capability-index.md`
  - `.claude/command-catalog.md`
  - `.claude/agents.md`
  - `.claude/agents/backlog-groomer.md`
  - `.claude/agents/verifier.md`
  - `.claude/agents/docs-keeper.md`
  - `.claude/agents/repo-explorer.md`
  - `.claude/agents/product-researcher.md`
  - `.claude/scripts/README.md`
  - `.claude/scripts/validate-bash.sh`
  - `.claude/agent-memory/README.md`
  - `.claude/agent-memory/verifier/MEMORY.md`
  - `.claude/agent-memory/docs-keeper/MEMORY.md`
  - `.claude/agent-memory/repo-explorer/MEMORY.md`
  - `.claude/agent-memory/backlog-groomer/MEMORY.md`
  - `.claude/skills/monthly-memory-refactor/SKILL.md`
  - `.claude/skills/write-task/SKILL.md`
  - `todolist.md`
  - `completed.md`
- Why:
  - The repo’s agent operating system had grown partly real and partly aspirational. This wave made the durable runtime pieces real, removed already-shipped backlog noise, and tightened the task-writing loop so future agent work stays trustworthy.
- What changed:
  - Added a shared `.claude/settings.json` with safe command allowlists plus a committed Bash guard that blocks force-pushes, hard resets, dangerous deletes, and raw `supabase db reset`.
  - Created committed project agent memory, seeded the memory directories for the verifier, docs-keeper, repo-explorer, and backlog-groomer, and upgraded the existing read-heavy agents so the memory and read-only contract is structural instead of advisory.
  - Rebuilt `CLAUDE.md` into a leaner always-loaded contract, added the `@TASK-RULES.md` linkage, tightened session-discipline guidance, and aligned `TASK-RULES.md` plus `.claude/task-template.md` around sharper AI-written backlog items.
  - Added the repo-portable `monthly-memory-refactor` and `write-task` skills plus the new `backlog-groomer` agent, then updated the capability index, operating-system map, command catalog, and agent overview so the new workflows are discoverable.
  - Synced the backlog itself by moving the landed AG items out of `todolist.md`, removing stale EO duplicates that were already shipped, and narrowing the remaining operating-system follow-ups to work that is still genuinely open.
- Verification:
  - `npm run check`
  - direct `validate-bash.sh` stdin tests for allowed and blocked command patterns
  - `wc -l CLAUDE.md`

## 2026-04-08 — Parallel backlog wave: carrier multi-vehicle flows, search pagination, admin recovery, and trust clarity

### `COMP-2026-04-08-40` — Multi-vehicle posting, paused listings, paginated browse, admin capture recovery, and backlog cleanup
- Moved from active backlog:
  - `ES4`, `ES5`, `EP1`, `EP2`, `EP5`, `EA5`, `EA7`, `EL5`, `EL6`, `ET1`, `ET2`, `ET6`, `ET8`, and `ET9`
- Removed from active backlog as stale duplicates already shipped in earlier records:
  - `EL1`, `EL2`, `EA2`, `EA6`, `EQ3`, `EQ4`, and `P4-23`
- When: `2026-04-08`
- Where:
  - `src/app/(admin)/admin/bookings/page.tsx`
  - `src/app/(admin)/admin/bookings/[id]/page.tsx`
  - `src/app/(admin)/admin/carriers/page.tsx`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `src/app/(admin)/admin/disputes/page.tsx`
  - `src/app/(admin)/admin/disputes/[id]/page.tsx`
  - `src/app/(admin)/admin/payments/page.tsx`
  - `src/app/(admin)/admin/verification/page.tsx`
  - `src/app/(auth)/verify/page.tsx`
  - `src/app/(carrier)/carrier/post/page.tsx`
  - `src/app/(carrier)/carrier/trips/page.tsx`
  - `src/app/(customer)/bookings/page.tsx`
  - `src/app/(customer)/saved-searches/page.tsx`
  - `src/app/(customer)/search/page.tsx`
  - `src/app/api/admin/bookings/[id]/capture/route.ts`
  - `src/app/api/bookings/[id]/route.ts`
  - `src/app/api/bookings/route.ts`
  - `src/app/api/search/route.ts`
  - `src/components/admin/admin-booking-actions.tsx`
  - `src/components/booking/booking-checkout-panel.tsx`
  - `src/components/carrier/carrier-post-prefill.tsx`
  - `src/components/carrier/carrier-trip-wizard.tsx`
  - `src/components/carrier/quick-post-templates.tsx`
  - `src/components/carrier/trip-edit-form.tsx`
  - `src/components/trip/trip-card.tsx`
  - `src/components/trip/trip-detail-summary.tsx`
  - `src/lib/analytics.ts`
  - `src/lib/data/admin.ts`
  - `src/lib/data/bookings.ts`
  - `src/lib/data/carriers.ts`
  - `src/lib/data/feedback.ts`
  - `src/lib/data/trips.ts`
  - `src/lib/validation/trip.ts`
  - `src/lib/__tests__/trip-validation.test.ts`
  - `src/lib/__tests__/booking-proof-flow.test.ts`
  - `src/lib/__tests__/booking-status-regression.test.ts`
  - `src/types/database.ts`
  - `src/types/trip.ts`
  - `supabase/migrations/015_parallel_backlog_wave.sql`
- Why:
  - The active backlog had drifted away from the actual product state. This wave closed the highest-leverage remaining deltas in browse, carrier posting, and admin recovery while also cleaning out duplicate tasks that were already shipped in earlier waves.
- What changed:
  - Removed remaining single-vehicle assumptions from carrier posting surfaces, threaded explicit `vehicleId` selection through the wizard and repost/template hydration, and added paused-listing support so supply can be hidden without destructive cancel-and-repost flows.
  - Added publish-quality warnings, item presets, and item-fit contradiction warnings in the carrier wizard, while keeping hard blockers reserved for true inventory contradictions.
  - Reworked customer search to expose cumulative pagination metadata and a “Show more trips” flow, while keeping the nearby-date geospatial fallback on the RPC path instead of dropping back to suburb `ilike` matching for that date-window search.
  - Added analytics dedupe keys for search and booking-start funnel events, extended metadata coverage across internal admin/auth/customer pages, and tightened remaining public-facing pricing or trust copy on trip cards, trip detail, and checkout.
  - Added an admin booking detail surface with required override reasons, manual payment capture recovery, booking-event audit trail persistence, and a dedicated admin capture API guarded to `completed + authorized` bookings.
  - Refreshed the backlog itself so partially shipped items were narrowed, and stale duplicates already covered by earlier completed work no longer pollute the active list.
- Verification:
  - `npm run check`
  - `npm test -- src/lib/__tests__/trip-validation.test.ts src/lib/__tests__/booking-status-regression.test.ts src/lib/__tests__/booking-proof-flow.test.ts`

## 2026-04-05 — Frontier Block 2: Proof Packs, Safety Policy, Carrier Ops, and Automated Nudges

### `COMP-2026-04-05-39` — Proof packs, exception logging, safety policy, payout-hold clarity, carrier today ops, trip health, and automated nudges
- Moved from active backlog:
  - `FRONTIER-UPGRADES-and-learnings.md` items `66`, `73`, `81`, `82`, `83`, `87`, `88`, `89`, `91`, and `92`
- When: `2026-04-05`
- Where:
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/app/(carrier)/carrier/payouts/page.tsx`
  - `src/app/(carrier)/carrier/today/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/app/api/bookings/[id]/route.ts`
  - `src/app/api/bookings/[id]/exception/route.ts`
  - `src/components/booking/booking-checkout-panel.tsx`
  - `src/components/booking/booking-form.tsx`
  - `src/components/booking/status-update-actions.tsx`
  - `src/components/carrier/carrier-post-success-card.tsx`
  - `src/components/carrier/trip-checklist.tsx`
  - `src/components/trip/trip-detail-summary.tsx`
  - `src/lib/constants.ts`
  - `src/lib/data/bookings.ts`
  - `src/lib/validation/booking.ts`
  - `src/types/booking.ts`
  - `src/types/carrier.ts`
  - `supabase/functions/carrier-next-step-nudges/*`
  - `src/lib/__tests__/booking-validation.test.ts`
  - `src/lib/__tests__/carrier-today.test.ts`
  - `src/lib/__tests__/booking-proof-flow.test.ts`
  - `src/lib/__tests__/carrier-next-step-nudges.test.ts`
- Why:
  - The next trust layer for moverrr needed to make unsafe jobs explicit, operational proof requirements structured, payout blockers legible, and obvious carrier follow-up work visible before it becomes founder cleanup.
- What changed:
  - Added visible prohibited-item and regulated-waste policy across booking, checkout, trip detail, carrier checklist, and carrier post-publish guidance, while keeping manual-handling risks as warnings instead of blockers.
  - Added a new `/carrier/today` surface plus deterministic trip-health scoring so carriers can see pending decisions, missing proof, customer-confirmation drag, and payout blockers in one operational view.
  - Refined payout-hold explanations so every hold shows the amount, missing step, what happens next, and a direct call to the relevant carrier action.
  - Reworked booking status updates to require structured pickup and delivery proof packs, store proof detail in `booking_events.metadata`, and keep the canonical proof-photo pointers on the `bookings` row.
  - Added in-the-moment exception logging through `POST /api/bookings/[id]/exception`, with audit detail stored in `booking_events.metadata` and surfaced back into the customer booking timeline.
  - Added a scheduled `carrier-next-step-nudges` edge function for pending-expiry, proof-stall, and payout-setup reminders, with graceful skip behavior when email config is missing and booking-event audit records for each outcome.
- Verification:
  - `npm run check`
  - `npm run test`

## 2026-04-02 — Frontier Operating System, Trust Surfaces, and Verification Harnesses

### `COMP-2026-04-02-36` — Frontier operating system, scoped rules, and reusable verifier workflows
- Moved from active backlog: `FRONTIER-UPGRADES-and-learnings.md` operating-system sweep
- When: `2026-04-02`
- Where:
  - `CLAUDE.md`
  - `TASK-RULES.md`
  - `.agent-skills/VERIFICATION.md`
  - `.claude/operating-system.md`
  - `.claude/capability-index.md`
  - `.claude/command-catalog.md`
  - `.claude/agents.md`
  - `.claude/agents/*.md`
  - `.claude/rules/*.md`
  - `.claude/skills/*/SKILL.md`
  - `EXPERIMENT-LEDGER.md`
  - `package.json`
- Why:
  - The frontier learnings only become useful if they are turned into the repo's actual operating system instead of staying as inspiration docs.
- What changed:
  - Added a canonical instruction map, precedence order, rule-naming convention, trust boundary, worktree policy, delegation triggers, plan template, permission matrix, verification report format, and adversarial probe checklist.
  - Added scoped rules for search and matching, payments and payouts, Supabase schema, analytics and metrics, customer trust, carrier growth, and admin operations.
  - Added new specialist role briefs and repeatable skills for release readiness, dispute review, saved-search demand review, carrier-quality review, admin queue review, metrics review, copy drift, postmortems, experiments, and surface-specific verification.
  - Added a capability index, command catalog, experiment ledger, and a webhook replay command alias so repeatable workflows are discoverable instead of hidden.
  - Consolidated the frontier source material by deleting `FRONTIER-UPGRADES-35.md` and `airtasker-airbnb-learning.md` in favor of the combined `FRONTIER-UPGRADES-and-learnings.md`.
- Verification:
  - `npm run check`
  - `npm run test`

### `COMP-2026-04-02-37` — Search, trip, booking, carrier, and founder-ops trust surfaces were upgraded from the frontier brief
- Moved from active backlog: `FRONTIER-UPGRADES-and-learnings.md` marketplace/product sweep
- When: `2026-04-02`
- Where:
  - `src/app/(customer)/search/page.tsx`
  - `src/app/(customer)/trip/[id]/page.tsx`
  - `src/app/(customer)/bookings/[id]/page.tsx`
  - `src/app/(customer)/carrier/[id]/page.tsx`
  - `src/app/(carrier)/carrier/dashboard/page.tsx`
  - `src/app/(carrier)/carrier/payouts/page.tsx`
  - `src/app/(carrier)/carrier/trips/[id]/page.tsx`
  - `src/app/(admin)/admin/dashboard/page.tsx`
  - `src/app/(admin)/admin/payments/page.tsx`
  - `src/components/trip/trip-card.tsx`
  - `src/components/trip/trip-detail-summary.tsx`
  - `src/components/booking/*.tsx`
  - `src/components/carrier/*.tsx`
  - `src/components/admin/review-queue.tsx`
  - `src/lib/data/admin.ts`
  - `src/lib/data/bookings.ts`
  - `src/lib/data/carriers.ts`
  - `src/lib/trip-presenters.ts`
  - `src/lib/validation/booking.ts`
  - `src/lib/validation/trip.ts`
- Why:
  - The browse-first marketplace gets stronger when trust, fit, pricing clarity, and next actions are visible on the surfaces customers, carriers, and the founder actually use every day.
- What changed:
  - Reworked search cards and search ordering so results explain fit, show human capacity, timing certainty, trust stacks, and truthful customer totals while downranking weaker inventory and offering nearby alternatives when supply is thin.
  - Rebuilt trip detail around the real trip first: route, timing, vehicle, remaining capacity, spare-capacity explanation, included vs not included boundaries, access compatibility, privacy limits, customer prep, and clearer payment and next-step expectations.
  - Tightened booking and dispute surfaces with fuller breakdowns, held-funds reassurance, missing-step guidance, scam-report actions, stronger off-platform boundaries, proof-pack guidance, and richer booking-state cues.
  - Expanded carrier posting and profile flows with publish-readiness checks, item-fit warnings, stronger presets and repost paths, post-publish operational guidance, layered trust badges, and proof-backed credibility signals.
  - Added a founder-ops cockpit and richer payment or payout surfaces so weak listings, verification blockers, risky bookings, and payout blockers are visible in one operational view.
- Verification:
  - `npm run check`
  - `npm run test`

### `COMP-2026-04-02-38` — Payment webhook replay, booking guard regressions, and optional live integration harnesses were added
- Moved from active backlog: `FRONTIER-UPGRADES-and-learnings.md` verification and reliability sweep
- When: `2026-04-02`
- Where:
  - `src/app/api/payments/webhook/route.ts`
  - `src/app/api/payments/webhook/__tests__/`
  - `src/lib/stripe/payment-intent-events.ts`
  - `src/lib/__tests__/webhook-events.test.ts`
  - `src/lib/__tests__/booking-atomic-rpc.test.ts`
  - `src/lib/__tests__/booking-status-regression.test.ts`
  - `src/lib/__tests__/bookings.integration.test.ts`
  - `src/lib/__tests__/helpers/supabase-rest-harness.ts`
  - `scripts/replay-payment-webhook.ts`
  - `scripts/fixtures/payment-webhooks/authorized-then-captured.json`
- Why:
  - Payment and booking trust needs replayable evidence, not memory, especially around concurrency, status guards, and webhook-driven state transitions.
- What changed:
  - Extracted Stripe payment-intent event application into a reusable helper and refactored the webhook route to run through the same event logic used by tests and replay tooling.
  - Added webhook replay fixtures, route tests, and a CLI replay path so payment event sequences can be debugged locally from known data instead of anecdotal failure reports.
  - Added regression coverage for atomic booking guarantees, dispute-to-completed guards, booking status transitions, and repeated-event behavior.
  - Added an opt-in live Supabase integration harness for booking invariants so race and state-machine behavior can also be checked against a real backend when the required env is available.
- Verification:
  - `npm run check`
  - `npm run test`
  - `src/lib/__tests__/bookings.integration.test.ts` remains opt-in and is skipped without `RUN_SUPABASE_INTEGRATION=1` plus the required Supabase admin env.

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

### `COMP-2026-04-01-16` — Carrier dashboard signals, publish scheduling, and template operations
- **When:** 2026-04-01
- **By:** Codex
- **Files changed:** `supabase/migrations/013_p3_enhancements.sql`, `src/lib/validation/trip.ts`, `src/lib/data/trips.ts`, `src/lib/data/templates.ts`, `src/types/database.ts`, `src/types/trip.ts`, `src/types/carrier.ts`, `src/lib/data/mappers.ts`, `src/components/carrier/live-bookings-list.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/components/carrier/carrier-trip-wizard.tsx`, `src/components/carrier/carrier-post-prefill.tsx`, `src/components/carrier/trip-edit-form.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/app/api/trips/templates/[id]/route.ts`, `src/components/booking/carrier-review-response-form.tsx`, `src/app/api/reviews/[id]/response/route.ts`, `src/app/(carrier)/carrier/templates/page.tsx`, `src/components/carrier/template-library.tsx`, `src/app/(carrier)/carrier/payouts/page.tsx`, `src/app/(carrier)/carrier/stats/page.tsx`
- **Why it mattered:** Carriers need faster operational visibility and lower-friction reposting so spare-capacity supply turns into repeat supply instead of one-off posts.
- **What was done:**
  - Added realtime booking badges, live status counts, and a chronological activity feed on the carrier dashboard.
  - Added optional trip `publish_at` scheduling in schema, validation, trip creation, and trip editing so listings can go live later instead of immediately.
  - Reworked expired/cancelled reposting into an explicit “Post similar trip” path and created a carrier-side review-response flow that also surfaces on the public carrier profile.
  - Added a full templates page with rename/archive/delete/duplicate actions, recurring route suggestions, and analytics powered by real template-linked listing and booking joins.
  - Added dedicated carrier payouts and performance pages to expose pending earnings, released/refunded history, acceptance/completion rates, and repeat-route insights.
- **Verification:** `npm run check`

### `COMP-2026-04-01-17` — Customer saved-search management and richer trust emails
- **When:** 2026-04-01
- **By:** Codex
- **Files changed:** `src/lib/data/saved-searches.ts`, `src/app/api/saved-searches/route.ts`, `src/app/api/saved-searches/[id]/route.ts`, `src/components/search/saved-searches-manager.tsx`, `src/app/(customer)/saved-searches/page.tsx`, `src/components/layout/site-header.tsx`, `supabase/functions/notify-saved-searches/index.ts`, `src/lib/data/bookings.ts`
- **Why it mattered:** Saved-search retention and first-booking trust both depend on customers getting clear, editable alerts and professional confirmation artifacts right after action.
- **What was done:**
  - Added a customer “Saved searches” management screen with edit, pause/resume, and delete actions backed by new PATCH support in the saved-search API.
  - Promoted saved-search access into the main navigation so the alert flow is manageable instead of fire-and-forget.
  - Replaced the saved-search alert email with a richer HTML layout and direct booking CTA.
  - Upgraded booking-created emails into structured HTML confirmations with route, carrier, total paid, booking reference, and preparation checklist details.
- **Verification:** `npm run check`

### `COMP-2026-04-01-18` — Platform health, CI, release tagging, and contributor workflow docs
- **When:** 2026-04-01
- **By:** Codex
- **Files changed:** `.github/workflows/ci.yml`, `.env.example`, `package.json`, `next.config.js`, `src/lib/sentry.ts`, `src/lib/rate-limit.ts`, `src/app/api/admin/rate-limit/route.ts`, `src/app/api/health/route.ts`, `supabase/README.md`
- **Why it mattered:** A marketplace repo without health probes, CI gates, release context, and a documented database workflow is easy to break and slow to recover during incidents.
- **What was done:**
  - Added a GitHub Actions CI workflow that runs `npm ci`, `npm run check`, and `npm run test` on pull requests to `main`.
  - Added a real `/api/health` probe and release/environment tagging for Sentry events, plus release env wiring in Next config.
  - Added rate-limit observability hooks and an admin override API backed by a new `rate_limit_overrides` table.
  - Expanded `.env.example` with descriptions and added a Supabase workflow guide plus npm aliases for reset/push commands.
- **Verification:** `npm run check`; `npm run test`

### `COMP-2026-04-01-19` — Admin dispute visibility, payment observability, and trust-surface polish
- **When:** 2026-04-01
- **By:** Codex
- **Files changed:** `src/lib/data/admin.ts`, `src/app/(admin)/admin/disputes/page.tsx`, `src/app/(admin)/admin/disputes/[id]/page.tsx`, `src/app/(admin)/admin/payments/page.tsx`, `src/components/ui/badge.tsx`, `tailwind.config.ts`, `src/app/globals.css`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`
- **Why it mattered:** Ops needs faster dispute triage and payment visibility, while the customer/carrier surfaces need consistent status language and accessible interaction styling to feel trustworthy.
- **What was done:**
  - Added dispute ownership/SLA markers in the admin list and a dedicated evidence-gallery detail page for uploaded dispute photos.
  - Added an admin payments page that summarizes payment failures, authorization cancellations, refunds, and booking-level payment issues in one view.
  - Introduced a shared `StatusBadge` system and tightened common card, focus-ring, dark-mode, and button primitives so states read consistently across the app.
- **Verification:** `npm run check`

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

### `COMP-2026-04-01-18` — Server-side pending booking expiry runner
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `supabase/functions/expire-bookings/index.ts`, `supabase/migrations/011_booking_safety_p0.sql`, `src/lib/data/bookings.ts`, `src/lib/notifications.ts`, `src/types/database.ts`
- **Why it mattered:** Pending bookings that never expire lock real trip capacity and make carrier supply feel unreliable.
- **What was done:**
  - Added a scheduled expiry edge function that finds stale `pending` bookings, cancels them with an explicit expiry reason, records audit events, recalculates listing capacity, and notifies both parties.
  - Added `pending_expires_at` plus a reusable database `recalculate_listing_capacity` function so expiry and cancellation paths restore inventory consistently.
  - Added an application helper for expiring pending bookings through the same booking lifecycle rules when run from server code.
- **Verification:** `npm run check`

### `COMP-2026-04-01-19` — Payment-intent creation is now idempotent per booking
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/lib/data/bookings.ts`
- **Why it mattered:** Mobile retries must resolve to one authoritative Stripe intent or support loses the ability to reason about payment state cleanly.
- **What was done:**
  - Reused existing non-cancelled Stripe payment intents when the stored intent still matches the booking amount, currency, and metadata.
  - Switched Stripe intent creation to use a booking-scoped idempotency key so retries land on the same intent even if the first response path is interrupted.
  - Added booking reference metadata to the payment intent for easier reconciliation.
- **Verification:** `npm run check`

### `COMP-2026-04-01-20` — Booking creation now honors client idempotency keys
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `supabase/migrations/011_booking_safety_p0.sql`, `src/app/api/bookings/route.ts`, `src/components/booking/booking-form.tsx`, `src/lib/data/bookings.ts`, `src/types/database.ts`
- **Why it mattered:** Double-submits from iPhone taps or flaky mobile networks must never create two bookings for the same customer intent.
- **What was done:**
  - Added `booking_idempotency_keys` with a 24-hour expiry window and folded the claim/return logic into the atomic booking RPC.
  - Accepted the `Idempotency-Key` header on booking creation and passed a request hash into the RPC so mismatched payload reuse is rejected safely.
  - Updated the booking form to generate and send a client idempotency key on submit.
- **Verification:** `npm run check`

### `COMP-2026-04-01-21` — Duplicate booking lifecycle emails are suppressed
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `supabase/migrations/011_booking_safety_p0.sql`, `src/lib/notifications.ts`, `src/lib/data/bookings.ts`, `src/lib/data/admin.ts`, `src/lib/data/feedback.ts`, `src/types/database.ts`
- **Why it mattered:** Duplicate lifecycle emails erode trust faster than a delayed email and make retried booking transitions look unstable.
- **What was done:**
  - Added `booking_email_deliveries` with a unique dedupe key so booking-related emails can be claimed before send and skipped on retry.
  - Routed booking creation, booking status, dispute, review, and expiry emails through the deduped send path.
  - Preserved the local-development graceful-degradation behavior by releasing the dedupe claim when email sending is skipped or fails.
- **Verification:** `npm run check`

### `COMP-2026-04-01-22` — Human-readable booking references are now first-class
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `supabase/migrations/011_booking_safety_p0.sql`, `src/app/(admin)/admin/bookings/page.tsx`, `src/app/(admin)/admin/disputes/page.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/app/(customer)/bookings/page.tsx`, `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/api/admin/bookings/route.ts`, `src/components/booking/pending-expiry-countdown.tsx`, `src/components/carrier/live-bookings-list.tsx`, `src/lib/data/admin.ts`, `src/lib/data/bookings.ts`, `src/lib/data/feedback.ts`, `src/lib/data/mappers.ts`, `src/lib/demo-data.ts`, `src/types/booking.ts`, `src/types/database.ts`
- **Why it mattered:** Support and ops cannot work efficiently off UUIDs alone; every booking needs a short reference that appears everywhere people actually use the system.
- **What was done:**
  - Added generated `MVR-YYYY-NNNN` booking references at the database layer so every booking gets a support-safe identifier at creation time.
  - Surfaced the reference in customer booking lists/detail, carrier trip booking cards, admin bookings, admin disputes, and booking-related emails.
  - Added admin booking search by reference so ops can find a booking from the short code instead of raw IDs.
- **Verification:** `npm run check`

### `COMP-2026-04-01-23` — Carrier posting and onboarding are now mobile-resilient and conversion-ready
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `supabase/migrations/012_p1_p2_marketplace_experience.sql`, `src/lib/constants.ts`, `src/lib/validation/trip.ts`, `src/lib/validation/carrier.ts`, `src/lib/data/carriers.ts`, `src/lib/data/trips.ts`, `src/lib/data/listings.ts`, `src/types/carrier.ts`, `src/types/database.ts`, `src/types/trip.ts`, `src/components/carrier/carrier-trip-wizard.tsx`, `src/components/carrier/carrier-onboarding-form.tsx`, `src/components/carrier/trip-edit-form.tsx`, `src/components/carrier/carrier-post-prefill.tsx`, `src/app/(carrier)/carrier/post/page.tsx`, `src/app/(carrier)/carrier/onboarding/page.tsx`, `src/components/admin/verification-queue.tsx`, `src/components/shared/google-autocomplete-input.tsx`, `src/app/api/trips/price-guidance/route.ts`, `src/app/api/upload/route.ts`, `src/lib/storage.ts`
- **Why it mattered:** First-trip posting and carrier verification are the supply bottlenecks for moverrr, so the mobile flow has to survive interruptions and explain exactly what a carrier needs next.
- **What was done:**
  - Added a return-trip flag, sticky safe-area wizard footer, detour presets, special-notes chips, and route price-guidance fetches so posting feels faster and clearer on iPhone-sized screens.
  - Reworked trip editing with dirty-state protection and long-form auth refresh so carriers do not silently lose edits after stepping away mid-session.
  - Rebuilt onboarding around autosave/resume, document previews, expiry-date capture, vehicle-photo upload, and a verification-blockers card that explains why an account cannot be approved yet.
  - Extended the carrier and admin data surfaces so verification review includes the new vehicle and document metadata instead of raw upload links only.
- **Verification:** `npm run check`

### `COMP-2026-04-01-24` — Booking lifecycle recovery and payment-state trust surfaces were hardened
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `supabase/migrations/012_p1_p2_marketplace_experience.sql`, `src/lib/constants.ts`, `src/lib/booking-presenters.ts`, `src/lib/data/bookings.ts`, `src/types/booking.ts`, `src/types/database.ts`, `src/app/api/bookings/[id]/route.ts`, `src/app/api/payments/webhook/route.ts`, `src/components/booking/booking-form.tsx`, `src/components/booking/dispute-form.tsx`, `src/components/booking/status-update-actions.tsx`, `src/components/booking/payment-recovery-card.tsx`, `src/components/booking/private-proof-tile.tsx`, `src/components/booking/print-receipt-button.tsx`, `src/components/ui/file-selection-preview.tsx`, `src/app/(customer)/bookings/page.tsx`, `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/app/(admin)/admin/bookings/page.tsx`
- **Why it mattered:** A marketplace loses trust fastest when a booking looks stuck, proof feels risky to submit, or money states are ambiguous after a payment problem.
- **What was done:**
  - Added retryable payment-recovery UI, explicit authorization-cancelled vs refunded states, and presenter helpers so booking detail, carrier views, and admin tools all describe payment status consistently.
  - Added proof preview and remove-before-submit flows, HEIC/HEIF-safe upload handling, guided dispute categories, and structured cancellation reasons instead of free-text-only actions.
  - Rebuilt customer booking detail around the pending-expiry countdown, preparation checklist, private proof gallery, printable receipt, and a “book similar trip” recovery path after completion.
  - Stored payment failure codes and cancellation reason codes in the data model so support and webhook processing preserve the actual failure reason instead of flattening everything into generic errors.
- **Verification:** `npm run check`

### `COMP-2026-04-01-25` — Customer browse surfaces, carrier transparency, and reminder loops were expanded for conversion
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `supabase/migrations/012_p1_p2_marketplace_experience.sql`, `src/lib/constants.ts`, `src/lib/data/listings.ts`, `src/lib/data/templates.ts`, `src/lib/data/trips.ts`, `src/lib/data/mappers.ts`, `src/types/trip.ts`, `src/app/api/search/route.ts`, `src/app/(customer)/search/page.tsx`, `src/components/search/search-bar.tsx`, `src/components/trip/trip-card.tsx`, `src/components/trip/trip-detail-summary.tsx`, `src/components/trip/share-trip-button.tsx`, `src/components/ui/time-bar.tsx`, `src/app/(customer)/trip/[id]/page.tsx`, `src/app/(customer)/trip/[id]/opengraph-image.tsx`, `src/app/(customer)/carrier/[id]/page.tsx`, `src/components/layout/app-client-effects.tsx`, `src/hooks/useAuthRefresh.ts`, `supabase/functions/delivery-reminders/index.ts`, `supabase/functions/trip-expiry-reminders/index.ts`, `supabase/functions/doc-expiry-reminders/index.ts`
- **Why it mattered:** Browse-first demand only converts if empty states stay useful, listing cards communicate spare-capacity value quickly, and both sides get reminder nudges before trust-breaking no-shows or expiries.
- **What was done:**
  - Added browse-by-category search chips, nearby-date fallback results, clear geocoding-failure messaging, time-window bars, capacity indicators, and return-trip context on search and trip cards.
  - Expanded trip detail with a savings context block, share action, richer OG image metadata, and a public carrier profile so customers can evaluate supply quality before committing.
  - Added reminder edge-function scaffolding for delivery follow-ups, expiring trips, and expiring carrier documents so the marketplace has scheduled hooks for key pre- and post-job nudges.
  - Kept long-lived customer sessions warm from the root app layer so saved-search, browse, and booking flows degrade less often when a mobile user leaves and returns.
- **Verification:** `npm run check`

### `COMP-2026-04-01-26` — Admin verification queue now surfaces document expiry risk
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/components/admin/verification-queue.tsx`, `src/app/(admin)/admin/verification/page.tsx`
- **Why it mattered:** Expiring licence or insurance documents are a trust and compliance risk, so approvers need that signal before they click approve.
- **What was done:**
  - Added expiry-state badges for carrier licence and insurance documents with healthy, review-soon, and immediate-action states.
  - Re-sorted the queue so carriers with stale or expiring documents rise above healthier carriers.
  - Added summary counters and a bulk-selection bar so review-ready carriers are easier to process in batches.
- **Verification:** `npx eslint 'src/app/(admin)/admin/bookings/page.tsx' 'src/app/(admin)/admin/disputes/page.tsx' 'src/app/(admin)/admin/disputes/[id]/page.tsx' 'src/app/(admin)/admin/verification/page.tsx' 'src/app/(admin)/admin/dashboard/page.tsx' 'src/components/admin/copy-text-button.tsx' 'src/components/admin/admin-booking-support-panel.tsx' 'src/components/admin/admin-pagination.tsx' 'src/components/admin/ops-funnel-card.tsx' 'src/components/admin/resolve-dispute-actions.tsx' 'src/components/admin/verification-queue.tsx' 'src/components/admin/verify-carrier-actions.tsx'`

### `COMP-2026-04-01-27` — Booking transitions, payments, and upload boundaries were hardened
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `middleware.ts`, `src/app/api/bookings/route.ts`, `src/app/api/bookings/[id]/route.ts`, `src/app/api/bookings/[id]/dispute/route.ts`, `src/app/api/payments/webhook/route.ts`, `src/app/api/upload/route.ts`, `src/lib/constants.ts`, `src/lib/data/bookings.ts`, `src/lib/data/feedback.ts`, `src/lib/data/trips.ts`, `src/lib/validation/booking.ts`, `src/types/booking.ts`, `src/types/database.ts`, `supabase/migrations/014_booking_payment_capture_failed.sql`
- **Why it mattered:** Silent capture failures, unsafe actor transitions, and weak upload validation were the highest-trust risks left in the booking lifecycle.
- **What was done:**
  - Wrapped Stripe capture in guarded completion logic that marks `capture_failed`, records failure detail, and blocks completion when capture does not actually succeed.
  - Fixed actor-role resolution so dual-role users can still access the right booking path and customers can no longer self-confirm carrier-side states.
  - Expanded CSRF protection to mutating booking/payment routes, added booking creation rate limiting, and tightened dispute-state transitions through the real state machine.
  - Added upload throttling plus magic-byte validation so proof and item-photo buckets reject mismatched or unsafe file types server-side.
- **Verification:** `npm run check`; `npm run test`

### `COMP-2026-04-01-28` — Customer browse and booking surfaces now reflect live intent more clearly
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/app/(customer)/bookings/page.tsx`, `src/app/(customer)/bookings/[id]/page.tsx`, `src/app/(customer)/search/page.tsx`, `src/app/(customer)/trip/[id]/page.tsx`, `src/components/booking/booking-checkout-panel.tsx`, `src/components/booking/booking-form.tsx`, `src/components/booking/booking-status-stepper.tsx`, `src/components/booking/price-breakdown.tsx`, `src/components/booking/sticky-booking-cta.tsx`, `src/components/search/search-bar.tsx`, `src/components/trip/trip-card.tsx`, `src/types/booking.ts`, `src/lib/data/bookings.ts`
- **Why it mattered:** Browse-first demand converts better when pricing updates instantly, search starts cleanly, and customers can coordinate confidently once a trip is confirmed.
- **What was done:**
  - Reworked trip detail and booking form flow with a live checkout panel, sticky mobile CTA, session-backed draft restore, progress states, and a single truthful savings figure.
  - Added empty-state recovery paths for bookings/search, URL-persisted sort controls, and desktop-first search autofocus without hardcoded suburbs.
  - Fixed booking detail evidence timestamps, added a full timeline, surfaced carrier contact info for active jobs, and kept “book similar trip” recovery in the completed state.
  - Tightened trip-card CTA language so search results feel like a clear booking surface rather than a passive listing index.
- **Verification:** `npm run check`; `npm run test`

### `COMP-2026-04-01-29` — Carrier onboarding, posting, and dashboard feedback loops became more actionable
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/app/(carrier)/carrier/onboarding/actions.ts`, `src/app/(carrier)/carrier/onboarding/page.tsx`, `src/app/(carrier)/carrier/payouts/page.tsx`, `src/app/(carrier)/carrier/post/page.tsx`, `src/app/(carrier)/carrier/stats/page.tsx`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/components/carrier/carrier-onboarding-form.tsx`, `src/components/carrier/carrier-post-prefill.tsx`, `src/components/carrier/carrier-post-success-card.tsx`, `src/components/carrier/carrier-trip-wizard.tsx`, `src/components/carrier/pending-bookings-alert.tsx`, `src/components/carrier/trip-checklist.tsx`, `src/components/carrier/trip-edit-form.tsx`, `src/lib/data/trips.ts`, `src/lib/validation/carrier.ts`, `src/lib/validation/trip.ts`
- **Why it mattered:** Supply grows faster when first-trip carriers are guided around readiness blockers and repeat carriers can act on pending demand immediately.
- **What was done:**
  - Added per-step validation, readiness gating, debounced price guidance, onboarding return redirects, and a real success state after posting a trip.
  - Scoped onboarding drafts by user, added ABN validation, and surfaced clearer verification readiness throughout the carrier flow.
  - Upgraded carrier dashboards with pending-booking urgency, active-vs-past trip separation, and clearer payouts/performance empty states for new carriers.
  - Expanded trip editing so carriers can actually update accepted categories, stairs support, and helper surcharges instead of cancel-and-repost workarounds.
- **Verification:** `npm run check`; `npm run test`

### `COMP-2026-04-01-30` — Admin support views and shared verification context were upgraded
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/app/(admin)/admin/bookings/page.tsx`, `src/app/(admin)/admin/dashboard/page.tsx`, `src/app/(admin)/admin/disputes/page.tsx`, `src/app/(admin)/admin/verification/page.tsx`, `src/app/api/admin/bookings/route.ts`, `src/app/api/admin/carriers/[id]/route.ts`, `src/app/api/admin/carriers/[id]/verify/route.ts`, `src/app/api/admin/disputes/[id]/route.ts`, `src/components/admin/admin-booking-support-panel.tsx`, `src/components/admin/admin-pagination.tsx`, `src/components/admin/copy-text-button.tsx`, `src/components/admin/ops-funnel-card.tsx`, `src/components/admin/resolve-dispute-actions.tsx`, `src/components/admin/verification-queue.tsx`, `src/lib/data/admin.ts`, `src/lib/data/bookings.ts`, `src/lib/data/carriers.ts`
- **Why it mattered:** Early ops speed depends on fast booking lookup, visible dispute urgency, and shared admin context instead of one-browser-only notes.
- **What was done:**
  - Added admin booking search by booking reference or email, real pagination, and a quick-view support panel for the most common investigation details.
  - Added dispute urgency signals, mandatory resolution notes, and booking-event audit metadata for dispute closures.
  - Added a funnel snapshot card on the admin dashboard so ops can see weekly flow drop-off instead of isolated headline metrics.
  - Moved carrier verification notes from local-only storage to debounced DB-backed autosave with local fallback, while preserving bulk verification actions.
- **Verification:** `npm run check`; `npm run test`

### `COMP-2026-04-01-31` — Runtime environment, health, and public metadata were tightened
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `.env.example`, `next.config.js`, `src/app/api/health/route.ts`, `src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/env.ts`
- **Why it mattered:** The app needs to fail fast on bad deploy config, expose a meaningful health signal, and publish safe metadata for iPhone and search surfaces.
- **What was done:**
  - Moved env enforcement to startup-oriented configuration, added security headers, and expanded `.env.example` to match the real runtime surface.
  - Added a health endpoint that checks DB/env/payment readiness instead of returning a blind OK.
  - Added robots and sitemap generation for public trip discovery, plus viewport-fit and theme-color metadata for safer iOS rendering.
  - Updated the search page to the async `searchParams` shape expected by newer Next.js routing behavior.
- **Verification:** `npm run check`

### `COMP-2026-04-01-32` — Regression coverage now protects core pricing, status, and seed assumptions
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `package.json`, `package-lock.json`, `src/lib/__tests__/breakdown.test.ts`, `src/lib/__tests__/seed.test.ts`, `src/lib/__tests__/status-machine.test.ts`
- **Why it mattered:** Commission math, booking transitions, and future-dated demo data are product truths that should not drift quietly between backlog passes.
- **What was done:**
  - Added status-machine tests for documented valid and invalid transitions.
  - Added pricing breakdown regression tests that lock the identity equation and base-only commission behavior.
  - Added seed-data regression tests that verify listings stay relative-dated and avoid hardcoded calendar values.
  - Wired a lightweight `npm run test` path into the repo so these invariants run alongside the normal checks.
- **Verification:** `npm run test`; `npm run check`

### `COMP-2026-04-01-33` — Upload boundaries, trip mutation safety, and carrier trip controls were hardened
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/app/api/upload/route.ts`, `src/app/api/trips/[id]/route.ts`, `src/app/api/payments/webhook/route.ts`, `src/lib/data/trips.ts`, `src/lib/status-machine.ts`, `src/components/booking/status-update-actions.tsx`, `src/lib/data/bookings.ts`, `src/app/(carrier)/carrier/trips/[id]/page.tsx`, `src/lib/data/mappers.ts`, `src/types/carrier.ts`, `src/lib/demo-data.ts`
- **Why it mattered:** Silent upload failures, unvalidated trip edits, webhook throttling, and weak carrier-side booking controls were all trust-critical breakpoints in the live marketplace loop.
- **What was done:**
  - Added WebP magic-byte detection, normalized reported MIME handling, and empty-`file.type` tolerance so HEIC/HEIF and WebP uploads are validated by content instead of failing early.
  - Swapped the trip PATCH route from a loose cast to real Zod parsing, with invalid payloads now rejected before any trip write.
  - Removed the shared Stripe webhook throttle, filtered nearby-date fallback results to future inventory only, and aligned fallback scoring away from bogus hardcoded values.
  - Exported the server transition map, removed the `picked_up -> delivered` shortcut, and added a carrier-side cancellation confirmation so the UI stays aligned with booking-state truth.
  - Locked the carrier trip detail page to the owning carrier, fetched only trip-scoped bookings, gated dispute intake to valid statuses, extracted the booking card out of the JSX IIFE, and made repost links omit missing coordinates safely.
- **Verification:** `npm run check`; `npm run test`

### `COMP-2026-04-01-34` — Public navigation, recovery flows, and ops visibility became more actionable
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/layout/site-footer.tsx`, `src/app/(marketing)/become-a-carrier/page.tsx`, `src/app/(marketing)/privacy/page.tsx`, `src/app/(marketing)/terms/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/components/auth/login-form.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/components/auth/reset-password-form.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/app/(carrier)/carrier/payouts/page.tsx`, `src/app/(admin)/admin/bookings/page.tsx`, `src/app/api/admin/bookings/route.ts`, `src/components/admin/admin-pagination.tsx`, `src/components/admin/resolve-dispute-actions.tsx`, `src/components/admin/verification-queue.tsx`, `src/lib/data/admin.ts`, `src/app/(admin)/admin/dashboard/page.tsx`
- **Why it mattered:** The browse-first product loses both supply and trust when navigation sends people to the wrong place, auth flows strand them, or ops cannot quickly see booking/payment state.
- **What was done:**
  - Reworked the site header around real user state: authenticated carriers now post directly, non-carriers see a public carrier acquisition path, the logo and sample-search CTA now meet the iOS tap-target contract, and mobile menu open/close state resets cleanly on navigation.
  - Added a public `become-a-carrier` landing page, a global footer with privacy/terms/contact links, a custom 404/error recovery surface, and above-the-fold homepage CTAs plus a more truthful empty-inventory headline.
  - Added cross-links between login and signup, wired a password-reset flow, and made auth/dev banners safer by limiting them to development on the touched pages.
  - Made carrier dashboard metric cards navigable, deep-linked activity feed booking items to the exact booking card, fixed the payouts “Released this month” value, added a first-trip CTA empty state, and parallelized lane-insight loading.
  - Added admin payment-status filters and counts, dispute resolution templates, verification queue age signals, and a data-freshness timestamp sourced from real booking-event data instead of render time.
- **Verification:** `npm run check`; `npm run test`

### `COMP-2026-04-01-35` — Backlog reconciliation closed the current P1/P2 wave and tightened browse loops
- **When:** `2026-04-01`
- **By:** `Codex`
- **Files changed:** `src/app/api/carrier/bookings/live/route.ts`, `src/components/carrier/live-bookings-list.tsx`, `src/components/carrier/trip-edit-form.tsx`, `src/components/search/search-bar.tsx`, `src/components/search/search-refine-button.tsx`, `src/app/(customer)/search/page.tsx`, `src/app/(customer)/trip/[id]/page.tsx`, `src/components/search/saved-searches-manager.tsx`, `todolist.md`, `completed.md`
- **Why it mattered:** After the larger worker pass, the active backlog still mixed genuinely open work with stale claims about issues that were already fixed. The browse loop also still had one live-data regression and a few mobile navigation gaps.
- **What was done:**
  - Replaced the live carrier-bookings row remap with an authenticated refresh endpoint so Supabase realtime updates preserve the full booking payload instead of stripping fields and events.
  - Hardened trip-edit navigation-guard cleanup so a successful save does not leave a stale unsaved-changes prompt behind on the next navigation.
  - Added a mobile “Refine search” shortcut, preserved search context when customers move from results to trip detail and back again, and added a direct “Search now” action plus clearer last-match context on saved searches.
  - Reconciled `todolist.md` against verified code, removing the cleared P1/P2 wave plus verified P3 items and rewriting stale partials like metadata coverage and health monitoring into the narrower issues that are still actually open.
- **Backlog items moved from active to completed:**
  - `B1`, `B4`, `B5`, `B6`, `B7`, `B8`, `B9`, `B10`, `B11`, `B12`, `B13`, `B14`, `B16`, `B17`, `B18`, `B19`, `B20`, `B22`
  - `C1`, `C2`, `C5`, `C6`, `C7`, `C8`, `C9`, `C10`, `C11`, `C12`, `C13`, `C15`, `C17`, `C18`, `C20`, `C21`, `C22`, `C24`, `C27`
  - `ES1`, `ES2`, `ES3`, `ED1`, `ED2`, `ED3`, `ED5`, `ED7`
  - `EP3`, `EP6`, `EP7`, `EP8`, `EP13`
  - `EA3`, `EA4`
  - `EQ1`, `EQ2`
  - `V5`, `V9`, `V10`
  - `X5`
- **Verification:** `npm run check`; `npm run test`

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
