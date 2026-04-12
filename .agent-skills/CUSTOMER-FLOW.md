# Customer Flow

## Core promise

Customers should understand that they are booking into real spare capacity on a trip already happening, not requesting a quote or browsing a catalogue.

The product makes three things obvious:
- this carrier is already travelling this route
- this is why the price is lower
- this is what happens next

## The interaction model

The customer never browses raw inventory first. They declare their need; the system does the matching.

```
Need-declaration wizard → match-ranked shortlist → offer detail → booking request → coordination
```

## Need-Declaration Wizard

A short, linear, mobile-first wizard. Four sequential screens. All screens are mandatory.

### Screen A — Route
- Pickup location (suburb/address, Google Places Autocomplete)
- Drop-off location

### Screen B — Item
- Visual grid of item category icons; customer taps one
- Quantity selector (default 1)
- Variant picker for high-risk categories (e.g., sofa size, appliance type)
- For "Other": free-text description + mandatory photo

### Screen C — Timing
- On this date (date picker + AM / Midday / PM window)
- Flexible within a week
- Flexible — anytime

### Screen D — Access & Handling (mandatory)
- Stairs at pickup (None / 1–2 flights / 3+)
- Stairs at drop-off (None / 1–2 flights / 3+)
- Lift available (Yes / No)
- Help available (Yes / No)
- Parking difficulty (Easy / Unsure / Difficult)

The need is stored as a MoveRequest object before results are shown.

**Why access questions come first:** This data feeds the eligibility filter. Carriers with "ground floor only" are filtered out before the customer sees them when the customer declares 3rd-floor conditions. Mismatches are prevented upstream, not discovered on the day.

## Match-Ranked Results

Results are a ranked answer set, not a filterable browse archive. Default sort is "Best fit." No user-facing sort controls at MVP.

### Structure
1. **Top Matches** — 3–5 cards, strongest options, each with a "Why this matches" line.
2. **Possible Matches (needs approval)** — partial or near-route matches; collapsed by default.
3. **Also available on nearby dates** — closest temporal alternatives; collapsed.

### Each result card shows
- Carrier name (first name + last initial), photo, vehicle type icon
- Route summary and date/time window
- **Total all-in price** (base + add-ons + platform fee + GST) — shown prominently; no "starting from"
- Fit indicator: "Likely fits" / "Review photos" / "Needs approval"
- Route fit label: "Direct route" / "Near your pickup (~3 km)" etc.
- Trust signal: "Verified" badge + star rating (if ≥3 ratings) + trip count
- **"Why this matches"** — deterministic string from match_class (see MATCHING-ENGINE.md): e.g., "Direct route match on your requested day" or "Small pickup detour (~3 km), same-day delivery"

### What is NOT on the card
- No cubic-metre capacity figures
- No detailed route maps
- No raw match scores
- No carrier bio
- No price ranges — the price is the price

## Offer Detail Page

Answers: "Why is this specific option safe and sensible for my move?"

Content:
- Carrier profile: photo, first name, member since, trips completed, star rating (if ≥3), review tags
- Vehicle: photo, type, human-readable capacity descriptor; carrier's item constraints shown clearly
- Route: text description; small map as context (not the decision tool); detour estimate if applicable
- Accepted item types
- Full price breakdown: base rate + stairs add-on + platform fee + GST = total
- Cancellation and misdescription policy
- Reviews (3 most recent, if any; verification status + trip count if fewer than 3)
- Primary CTA: "Request this driver" or "Add to Fast Match"

## Booking Request Flow

### Request-to-Book (default)
Request goes to one carrier. Carrier has a configurable response window (default 12 hours). If declined or expired, customer is shown the next-best option with a single tap to re-request.

### Fast Match (opt-in, up to 3 carriers)
Customer selects up to 3 offers. Request is broadcast simultaneously. First to accept confirms the booking; all sibling requests are atomically revoked. Not bidding — the price is fixed. If all decline or expire, the need routes to Alert the Network.

### Booking confirmation steps
1. **Confirm item details** — category, variant, quantity; mandatory photo for bulky items; optional handling notes
2. **Confirm access details** — pre-filled from wizard; exact addresses collected; if access differs, price updates in real time before submission
3. **Confirm price** — full breakdown including any access add-ons
4. **Payment** — payment is authorised (not charged) at submission; captured only when carrier accepts; released automatically if carrier declines or request expires

## Post-Booking Coordination

After carrier accepts, both sides see a shared booking detail screen:
- Confirmed item, addresses, date, time window, price
- Status timeline: Requested → Accepted → Pickup window → Picked up → In transit → Delivered → Confirmed

Coordination is structured, not open-ended chat:
- Carrier sends one-tap status updates ("On my way", "Arrived at pickup", "Item loaded", "Delivered")
- Customer receives push notifications for each update
- Pre-built quick responses reduce the need for free text while driving
- Phone numbers are not shared at MVP; all communication is on-platform

On delivery:
- Carrier taps "Delivered" and uploads timestamped, GPS-tagged proof photo
- Customer receives notification to confirm receipt
- Customer confirms → payout released
- Customer does not confirm within 72 hours and no dispute raised → payout auto-releases on proof
- Customer disputes within 72 hours → payout blocked, founder adjudicates

## Zero-Match Path

The customer never sees a dead-end empty state.

1. The system first checks for near-matches (same corridor within 7 days, adjacent corridors, partial route segments).
2. If truly zero: the UI shows a clear, reassuring message and captures the need as an UnmatchedRequest.
3. "Alert the Network" — relevant carriers are notified of the demand.
4. Customer is notified when a match appears (push + email).
5. Founder reviews the operator queue if no carrier responds within the SLA.

CTA on zero-match: "Alert the Network — we'll notify drivers on your route."

## Post-Booking customer actions
- Track booking status via status timeline
- Confirm receipt (triggers payout release)
- Open a dispute within 72 hours of delivery
- Leave a review after completion

## Anti-patterns
- hiding fees until the end
- showing raw inventory before the customer has declared a need
- treating the results page as a filterable browse archive
- empty states that just say "No results" with no next step
- any flow that creates negotiation gravity
