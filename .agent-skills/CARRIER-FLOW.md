# Carrier Flow

## Why carrier flow matters most

Carrier supply is the engine of the marketplace.
If posting or managing trips feels slow, confusing, or risky, the marketplace model collapses.

## Carrier journey overview

### Signup (account creation)
Frictionless. Collects: full name, email, phone, password.
The carrier can log in but cannot post trips or accept bookings yet.

### Supply Activation (verification gate — strict)
No carrier can appear in customer results, accept a booking, or see full customer details until activation is manually approved.

Activation is a three-step flow with saved progress:
1. **Identity & Business** — legal name, driver's licence upload (validated via Stripe Identity), optional ABN
2. **Vehicle & Capacity** — vehicle type, rego, photo, available space descriptor, accepted item categories, structured item constraints (ground floor only, stairs policy, max item length, single-person lift only, fragile accepted)
3. **Payout & Documents** — Stripe Connect payout setup (required gate), optional insurance certificate

Review is manual at MVP. Target turnaround: 24 hours. Carrier notified with specific approve/reject reasons.

**Teaser demand for unactivated carriers:** Unactivated carriers see a blurred demand summary for their operating area. Computed from real data. CTA: "Complete your setup to unlock these jobs."

## State-Aware Carrier Home (3 modes)

The carrier home is not a static dashboard. It adapts to the carrier's lifecycle stage.

### Mode 1 — Activation (unverified or incomplete)
- Hero: "You're N steps from unlocking jobs."
- Primary CTA: "Resume setup."
- Progress bar showing completion state.
- Teaser demand (blurred).
- Nothing else — no analytics, no trip list, no clutter.

### Mode 2 — Ready to Post (verified, no active trips)
- Hero: "Post your next route."
- Primary CTA: "Post a trip."
- Quick-repost buttons for saved templates (sorted by recency) if templates exist.
- Demand signal: "N customers are looking for moves on [corridor] this week."
- No analytics dashboards.

### Mode 3 — Active Operations (has live or upcoming trips, pending requests)
- Hero: the most urgent action, in this priority order:
  1. Pending booking request → "You have a new booking request. Review it."
  2. Trip happening today → today's runsheet view
  3. Proof needed → "Upload delivery proof to release your $X payout."
  4. Payout blocked → "Complete [step] to release $X."
- Below: compact list of upcoming trips with status badges.

## Trip Posting

**Quick Post (repeat carriers — target: under 30 seconds)**
- Select a saved template or previous trip
- Confirm or adjust: route, date, time window, vehicle, capacity, pricing
- Publish

**Advanced Post (new routes — full wizard)**
1. Route (start + end, optional up to 2 waypoints, optional return trip toggle)
2. Schedule (date, time window, optional "regular run" toggle → weekly / fortnightly / specific days; auto-generates up to 4 weeks ahead)
3. Vehicle & Capacity (select vehicle, available space descriptor, accepted item categories, item constraints)
4. Detour & Pricing (max detour tolerance in km for eligibility only; base price per accepted category/tier; fixed stairs and helper add-ons)
5. Review & Publish (or save as draft)

**Supply quality requirements to publish:**
- Vehicle photo(s) ≥1
- Route defined (start + end, date, time window)
- At least one accepted item category
- Pricing set for every accepted category
- Stairs/helper policy set

**Templates:** Auto-generated after each trip post. Carrier can name and repost with one tap + date confirmation. Templates are first-class, not a settings feature.

**Recurring trips:** If "regular run" is toggled, the system auto-generates future listings at the selected frequency, up to 4 weeks ahead.

## Trip Management

Trips are organised by operational state, not a flat chronological list:

| State | Content |
|---|---|
| Needs Action | Pending booking requests, unconfirmed trips within 48h, proof-of-delivery overdue |
| Today | Trips happening today (runsheet view) |
| Upcoming | Confirmed trips with accepted bookings |
| Drafts | Unpublished trips |
| Past | Completed trips with payout status |
| Templates | Saved corridor templates for quick repost |

Templates are a first-class tab within the Trips view.

## Booking Request Decision Cards

When a customer submits a booking request, the carrier receives a push notification and sees a decision card:

| Element | Content |
|---|---|
| Item | Category, variant, quantity, customer photo |
| Route fit | "Pickup in [suburb] (3 km from your route, ~8 min detour). Drop-off in [suburb] (on your route)." |
| Access summary | Stairs, lift, helper. **Highlighted in amber if access complexity exists.** |
| Payout | Carrier's net take (after platform fee) |
| Response deadline | Countdown (default 12 hours) |
| Actions | **Accept** / **Decline** (with optional reason) / **Request Clarification** |

**Request Clarification** is NOT a negotiation channel. It exists only for factual gaps (e.g., "Photo shows a 3-seater but you selected Small Furniture — can you confirm?"). Carrier selects from predefined reasons. One round only.

## Trip-Day Runsheet Mode

When a carrier has a trip today, the home surface becomes an operational runsheet:

- Timeline of today's pickups and drop-offs in route order
- For each stop: customer first name, item summary (icon + quantity), address, one-tap navigation (opens Maps/Waze externally), one-tap status update buttons
- Status flow per stop: "On my way" → "Arrived" → "Item loaded" or "Item delivered" → "Upload proof photo"
- Payout blockers shown inline: "Upload delivery photo to release $X"
- Large tap targets designed for safe use while driving — minimal typing, pre-built responses

## Proof of Delivery & Payout

- Carrier taps "Delivered" and uploads a photo (minimum 1, timestamped + GPS-tagged automatically)
- Customer receives notification to confirm receipt
- Customer confirms → payout released to Stripe Connect account
- Customer does not confirm within 72 hours and no dispute raised → payout auto-releases on proof
- Customer disputes within 72 hours → payout blocked, founder adjudicates

Carrier payout visibility:
- Per-trip payout: Pending / Processing / Paid
- Breakdown: gross amount, platform fee deducted, GST, net payout
- Blockers: "Waiting for customer confirmation" / "Proof photo required" / "Stripe setup incomplete"
- Aggregates: this week / this month / all time

## Condition Adjustment (Structured Exception Path)

If the carrier arrives at pickup and discovers the declared conditions do not match reality:

1. Carrier triggers a "Condition Adjustment" from the booking screen
2. Carrier selects a predefined reason: stairs mismatch / helper required / item materially different / extreme parking
3. Carrier selects an adjustment amount from predefined options (not free text): e.g., "+$15 for 2 extra flights of stairs"
4. Customer receives notification with the reason and amount
5. Customer taps **Accept** (price updates, booking continues) or **Reject** (booking cancelled under misdescription policy; carrier not penalised)
6. **One round only — no second adjustment, no counter-proposal**

This is not negotiation. The carrier cannot adjust the base price or request arbitrary amounts. Reasons and amounts are platform-defined.

## Trip Freshness Check-Ins

**FIXED:** Mandatory check-ins to prevent stale supply.

| Timing | Trigger | Consequence of no response |
|---|---|---|
| 24 hours before trip | "Do you still have space for tomorrow's trip?" | Trip flagged as unconfirmed; deprioritised in matching |
| 2 hours before trip | "Confirm your trip is still on." | Trip auto-suspended; affected customers notified |

Repeated failures to confirm degrade the carrier's trust score and reduce match opportunities.

## Repeat Usage Loop

Templates and quick-post are the carrier retention engine, not a side feature.

1. Complete a trip
2. System prompts: "Post this route again?" with one-tap repost for next week
3. Template auto-generated from the completed trip
4. Carrier sees demand signal for that corridor
5. Carrier reposts — habit forms

## UX principles

- carrier actions must work cleanly on mobile
- posting should feel fast and low-cognitive-load (quick post target: under 30 seconds)
- proof capture is camera-first; large tap targets designed for in-vehicle use
- the product must not require chat or negotiation to complete core tasks
- the carrier home is a work queue, not a dashboard — show what matters next

## Common mistakes

- adding optionality that slows the posting wizard
- hiding next actions inside cards with weak affordance
- making template flows feel like a mini dispatch system
- breaking touch targets or proof capture while polishing UI
- treating the carrier home as a static analytics surface
- letting Request Clarification drift into open-ended price negotiation
