# Moverrr Governing Product System Blueprint

**Version:** Final  
**Status:** Binding  
**Purpose:** This document is the single governing source of truth for all product construction, engineering decisions, marketplace behaviour, UX/UI architecture, and startup execution discipline for Moverrr. Decisions marked **FIXED** must not be reopened during implementation. If a downstream implementation agent encounters ambiguity not covered here, the default is: choose the simpler option that reduces customer uncertainty and carrier operational burden.

---

## 1. Executive Decision

Moverrr is a need-first, match-ranked spare-capacity logistics marketplace for medium-to-large items. The customer declares a specific move need. The system returns a confidence-ranked shortlist of bookable, route-compatible carrier offers with deterministic pricing, fit-confidence labels, and trust signals. The carrier posts trips they are already taking, sets structured pricing, and accepts or declines booking requests through a decision-card interface.

**What Moverrr is:** A platform-only matching, coordination, trust, and transaction layer connecting real item-move needs with existing driver routes that have unused space. Moverrr does not operate logistics, own vehicles, or employ drivers.

**What Moverrr is not:**

- Not a browse-first inventory catalogue of drivers or trips.
- Not an Airtasker-style bid/quote board with open-ended negotiation.
- Not a map-first route explorer where the map is the primary decision surface.
- Not a full removalist operating platform or freight dashboard.
- Not a generic courier service or parcel delivery app.
- Not a classifieds board.

**The interaction model that wins:**

Need-first wizard → match-ranked shortlist with explanations → request-to-book (or Fast Match) → carrier accept/decline → escrowed payment → structured coordination → proof-of-delivery → payout release.

**Core UX principle:** Moverrr acts as a constraint-matching system that returns a confident shortlist, not a listing marketplace that asks users to interpret logistics complexity. The product absorbs complexity so the customer never thinks like a dispatcher and the carrier never thinks like a call centre.

**FIXED. Do not re-litigate.**

---

## 2. Product Thesis

Moverrr solves a specific market failure: there is abundant spare transport capacity moving through corridors every day — partially empty vans, utes, and trucks — but it is inaccessible to normal users because discovery, trust, pricing, and coordination are broken.

The customer is not buying transport inventory in the abstract. They are buying confidence that a specific, often awkward physical object can be moved from A to B safely, affordably, and with minimal coordination friction. Their baseline emotional state is low-grade uncertainty across three stacked anxieties: feasibility, cost, and trust.

The carrier is not building a logistics empire. They are monetising sunk costs — fuel, tolls, vehicle lease, time — on journeys they are already committed to. Their baseline need is zero-friction supplementary revenue without route chaos, bad-fit work, or payout uncertainty.

Moverrr matters because it replaces the high-friction, low-trust, negotiation-heavy informal economy (Facebook Marketplace "man with a van" posts, Airtasker quote loops, unstructured WhatsApp coordination) with a structured, verified, deterministic-price marketplace that creates value for both sides from capacity that currently goes to waste.

**The thesis depends on three conditions:**

1. **Supply exists.** It does. Informal movers on Facebook Marketplace, removalists with partial loads, tradies with empty utes, interstate operators with empty return legs, and SMBs with recurring logistics runs are abundant across Australian corridors.
2. **Trust can be established.** Solvable through verification gates, structured item descriptions, proof-of-delivery, and payment protection.
3. **Matching works under sparse supply.** Solvable through demand capture (Alert the Network), founder-led manual fulfilment, and the Fast Match mechanism.

**The deeper product question is not "how do we display spare capacity?" It is "how do we convert a messy object-move problem into a confident yes/no decision quickly enough that users do not abandon?"**

---

## 3. Core User Truths

### 3.1 Customer Truth

The customer is trying to move one specific thing from A to B, under uncertainty, without becoming a logistics coordinator. They arrive with three anxieties stacked: Can this even work? How much? Can I trust this?

**What they fear:**

- A bad-fit booking: driver arrives, item does not fit, stairs were not disclosed, the job collapses.
- Hidden price escalation and negotiation fatigue.
- Unreliability, damage, theft, or ghosting.
- Losing time coordinating between seller and mover (especially Facebook Marketplace pickups).
- Having to message five people, explain the item repeatedly, and hope for the best.

**They need answers in this strict order:**

1. **Feasibility:** Can this work for my item and my route?
2. **Cost and timing:** Roughly when and roughly how much, all-in?
3. **Trust:** Can I trust this carrier and this platform?
4. **Confirmation:** What details do I need to lock in?

**Design implication:** If the product reverses this order — showing raw supply before establishing feasibility — it forces the customer to translate their own need into route logic before the system has done that work for them. That is backwards and causes abandonment.

### 3.2 Carrier Truth

The carrier is monetising movement that is already happening. They want supplementary revenue without adding chaos, admin burden, or payout risk.

**What they fear:**

- **Bad-fit work:** Misdescribed items, undisclosed stairs, two-person lifts they cannot do alone, items that physically do not fit.
- **Route chaos:** Uncontrolled detours and time blowouts.
- **Admin burden:** Re-entering the same trip details every time, managing complex messaging, unclear booking states.
- **Payout uncertainty:** Delayed payments, disputed deliveries, unclear release triggers.
- **Unsafe communication:** Being forced into message-heavy negotiation while driving (in violation of NSW and Australian road rules on mobile phone use while driving).

**What they need from the system:**

- Only relevant, pre-filtered requests.
- Clear fit and access data on every request.
- Fast accept/decline decisions packaged as decision cards.
- Predictable payout release tied to proof-of-delivery.
- Fast repeat posting for recurring corridors.

**Design implication:** Carrier UX is not symmetric with customer UX. The customer needs uncertainty reduction in selection. The carrier needs uncertainty reduction in operations. Do not mirror them.

---

## 4. Final Marketplace Model

### 4.1 Chosen Model

**FIXED:** Need-first, match-ranked, browse-assisted.

The customer creates a Move Request via a short wizard (item + route + timing + access conditions). The system matches against posted carrier Trips and returns a confidence-ranked shortlist with explanations. The customer chooses:

- **Request-to-Book** (single carrier, default), or
- **Fast Match** (send to up to 3 carriers; first to accept confirms the booking).

The carrier accepts or declines via a structured decision card. No open-ended negotiation. One structured adjustment is permitted only when declared constraints genuinely conflict with reality (see Section 9).

### 4.2 Why This Wins

- **Reduces customer uncertainty immediately.** Feasibility is confirmed within seconds of entering the need. Price and trust signals are visible before commitment.
- **Works under sparse supply.** Fast Match reduces waiting time. Alert the Network captures demand when no matches exist. Founder manual fulfilment closes the gap.
- **Avoids negotiation friction.** Deterministic pricing eliminates Airtasker-style quote loops. The structured adjustment handles genuine mismatches without opening bargaining.
- **Keeps carrier burden low.** Carriers post trips, set prices, and respond to pre-packaged decision cards. No inbound message management, no quoting, no haggling.
- **Creates clean system logic.** The booking state machine is simple. The pricing is deterministic. The matching is algorithmic.

### 4.3 How It Behaves at MVP (Sparse Supply)

The model must gracefully handle three states:

1. **Strong matches exist.** Show ranked results with explanations. Customer selects and requests.
2. **Partial or near-matches exist.** Show them with clear labels ("Covers your pickup area — drop-off is 8 km beyond this driver's route" or "Available 3 days after your preferred date"). Customer decides.
3. **No matches exist.** Capture the need. Trigger Alert the Network. Founder manually sources a carrier through the Concierge Offer mechanism if no carrier responds within 24 hours.

### 4.4 Fast Match — Why It Exists

Under sparse supply, sequential request-to-book creates a latency problem: the customer waits up to 24 hours for one carrier to decline, then another 24 hours for the next. This can stretch into days. Fast Match solves this: the customer selects up to 3 offers, the system broadcasts the request, and the first carrier to accept confirms the booking — all others are automatically revoked.

**Why this is not the same as multi-proposal bidding:** Fast Match is "first to accept wins" at a fixed price, not "pick the best bid." The carrier sees the same fixed price. There is no competition on price, no bidding war, and no negotiation. The carrier's only decision is accept or decline.

**Implementation rule:** When one carrier accepts a Fast Match request, the system atomically revokes all sibling requests in the same group and notifies the customer and the other carriers. There are no race conditions — the first accept wins.

### 4.5 What Is FIXED

- Need-first input model.
- System-ranked results (not user-filtered browsing as primary mode).
- Deterministic pricing (carrier-set base rates + structured add-ons + platform fee + GST).
- Request-to-Book (default) + Fast Match (opt-in, up to 3 carriers).
- No open-ended negotiation, no bidding, no quote marketplace.
- One structured adjustment path for genuine constraint mismatches only.
- Alert the Network for all zero-match states.
- Founder manual fulfilment via Concierge Offer as part of MVP operating model.

### 4.6 What Is Out of Scope for MVP

- Secondary browse/explore layer for corridors.
- Algorithmic auto-dispatch.
- Real-time Uber-style matching.
- Multi-leg trip chaining or consolidation planning.
- Instant booking without carrier acceptance.
- Enterprise load-board complexity.

### 4.7 What Must NOT Be Re-Litigated

- "Should we let users browse listings before entering their need?" — No.
- "Should carriers negotiate freely in chat?" — No.
- "Should maps be the main discovery surface?" — No.
- "Should we add open bidding?" — No.
- "Should we let customers post a job and wait for quotes?" — No.

---

## 5. Customer Experience Architecture

### 5.1 Homepage

The homepage has one job: get the customer into the need-declaration wizard.

**Above the fold:**

- A headline that teaches the mental model: "Move your item on a trip already happening."
- A subline: "Find trusted drivers with spare space on routes going your way."
- The need-declaration wizard input block (compact, 4 fields visible — see 5.2).

**Below the fold (secondary):**

- 2–3 tappable example jobs that teach the use case faster than prose: "Sofa from Newtown to Burwood," "Fridge from Bondi to Parramatta," "Marketplace pickup from Surry Hills to Chatswood." These are preset buttons that pre-fill the wizard.
- A brief "How it works" strip: 3 steps with icons. "Tell us what you need moved → See your best-fit options → Book and track."
- Trust scaffolding: "Verified drivers. Upfront pricing. Payment protection."

**What is NOT on the homepage:**

- No featured trip listings above the fold.
- No map.
- No category tiles or browse filters.
- No carrier profiles.
- No raw inventory.

**FIXED:** The homepage is a single-purpose entry point into the need-declaration wizard, not a marketplace browse surface.

### 5.2 Need-Declaration Wizard

A short, linear, mobile-first wizard. Four screens on mobile; can be compressed to a single input card on desktop. Progressive disclosure: each screen asks one question.

**Screen A — Route:**

- Pickup location (suburb/address with Google Places Autocomplete).
- Drop-off location (suburb/address with Google Places Autocomplete).
- CTA: "Next."

**Screen B — Item:**

- A visual grid of item category icons (see Section 8 for the full list). Customer taps one.
- For the selected category: quantity selector (default 1, max 10).
- For high-risk categories (Large Furniture, Appliances): a variant picker with 2–3 options to improve fit confidence (e.g., "2-seater sofa / 3-seater sofa / L-shaped sofa").
- For "Other": free-text description + mandatory photo.
- CTA: "Next."

**Screen C — Timing:**

- Three options: "On this date" (date picker + time window: AM / Midday / PM), "Flexible within a week," "Flexible — anytime."
- Default: "Flexible within a week."
- CTA: "Next."

**Screen D — Access & Handling (minimal but mandatory):**

- Stairs at pickup? (None / 1–2 flights / 3+)
- Stairs at drop-off? (None / 1–2 flights / 3+)
- Lift/elevator available? (Yes / No)
- Help available at pickup/drop-off? (Yes / No)
- Parking difficulty? (Easy / Unsure / Difficult)
- CTA: "Find drivers."

**Why access questions are collected here (not at booking):** This data feeds the matching engine. If the customer says "3rd floor, no lift, no help," the system filters out carriers with "ground floor only" or "single-person lift only" constraints. The customer never sees incompatible carriers. This is the minimum viable defence against the Ghost Dimension failure mode — and collecting it earlier means better matches, not just better bookings.

**Implementation note:** All four inputs (route, item, timing, access) are mandatory. The system cannot match without them. The need is stored as a structured MoveRequest object regardless of whether matches are found.

### 5.3 Results Page (Match-Ranked Shortlist)

The results page is a ranked answer set, not a filterable browse archive. Default sort is "Best fit." No user-facing sort controls at MVP.

**Layout structure:**

1. **"Top Matches"** — 3–5 cards, the strongest options. Each card includes a "Why this matches" explanation line.
2. **"Possible Matches (needs approval)"** — partial or near-route matches where the carrier may need to extend or detour. Labelled clearly. Collapsed by default; tappable to expand.
3. **"Also available on nearby dates"** — a single collapsed row showing the closest temporal alternatives. Tappable to expand.

**Each result card displays:**

| Element | Example |
|---------|---------|
| Carrier name | "James T." (first name + last initial) |
| Profile photo | Thumbnail |
| Vehicle type icon | Van / Ute / Truck |
| Route summary | "Bondi → Parramatta via Inner West" |
| Date and time window | "This Friday, 9am–1pm" |
| All-in price | "$95" — total including platform fee and GST, shown prominently |
| Fit indicator | "Likely fits" / "Review photos" / "Needs approval" |
| Route fit label | "Direct route" / "Near your pickup (~3 km)" / "Near your drop-off (~5 km)" |
| Trust signal | "Verified" badge + star rating (if ≥3 ratings) + "12 trips completed" |
| "Why this matches" | "Direct route match on your requested day" or "Small pickup detour, same-day delivery" |

**What is NOT on the card:**

- No cubic-metre capacity figures.
- No detailed route maps.
- No raw match scores or proximity numbers.
- No carrier bio.
- No "starting from" price ranges — the price is the price.

**Implementation rule:** "Why this matches" is generated from deterministic string templates based on match_class (direct / near_pickup / near_dropoff / nearby_date / partial_route) and detour estimate. Examples:

- Direct match, exact date: "Direct route match on your requested day."
- Near pickup, exact date: "Small pickup detour (~3 km), same-day delivery."
- Direct match, nearby date: "Direct route — available 2 days after your preferred date."
- Partial route: "Covers your pickup area. Drop-off is 12 km beyond this driver's listed route."

**Zero results:** See Section 11. The customer never sees a dead-end empty state.

### 5.4 Detail Page

The detail page answers: "Why is this specific option safe and sensible for my move?"

**Content:**

- **Carrier profile:** Photo, first name, member since date, trips completed, star rating (if ≥3 ratings). Optional tags from past reviews ("On time," "Careful handler").
- **Vehicle:** Photo (required), type, general capacity descriptor ("Large van — fits most furniture"). Carriers set item restrictions which are displayed clearly: "Max item length: 2m. Ground floor only. Single-person lift only."
- **Route:** Text description of the corridor. A small map showing the route line with customer pickup and drop-off pins as explanatory context (not a decision tool). Detour estimate if applicable ("Pickup is ~3 km from the driver's route, ~8 min detour").
- **Accepted item types:** Icons/tags showing what this carrier accepts.
- **Price breakdown:**

| Line | Amount |
|------|--------|
| Base rate (Large Furniture) | $70.00 |
| Stairs add-on (1–2 flights at drop-off) | $15.00 |
| Platform fee | $12.75 |
| GST | $9.78 |
| **Total** | **$107.53** |

- **Cancellation and misdescription policy:** Clear statement: "Inaccurate item descriptions or undisclosed access difficulties may result in cancellation. See our cancellation policy."
- **Reviews:** If any exist, show the 3 most recent with star rating and tags. If none exist, show only verification status and trip count.
- **Primary CTA:** "Request this driver" (or "Add to Fast Match" if Fast Match is being used).
- **Secondary CTA:** "Add to Fast Match" (if not already selected).

### 5.5 Booking Request Flow

When the customer taps "Request this driver" (or confirms their Fast Match selection), a confirmation flow collects final details via progressive disclosure:

**Step 1 — Confirm Item Details:**

- Show the item category, variant (if applicable), and quantity from the wizard. Allow edits.
- **Photo upload:** Mandatory for bulky items (Large Furniture, Appliances, Sporting & Outdoor, Other). Recommended for all others. Minimum 1 photo, recommended 2–3.
- Optional notes field for handling instructions ("fragile glass top on dining table").

**Step 2 — Confirm Access Details:**

- Pre-filled from wizard. Allow edits.
- Collect exact pickup address (street-level) if only suburb was entered earlier.
- Collect exact drop-off address.
- Optional: pickup/drop-off contact name and phone if different from customer's own.

**Step 3 — Confirm Price:**

- Show the full price breakdown (base + add-ons + platform fee + GST).
- If access conditions from Step 2 differ from what was entered in the wizard, the price updates in real time to reflect add-ons. The customer sees the updated total before committing.
- The customer agrees to the price and the terms.

**Step 4 — Payment:**

- Collect payment method via Stripe.
- Payment is **authorised** (not charged) at this point. The charge is captured only when a carrier accepts.
- If the carrier declines or the request expires, the authorisation is released automatically.

**Step 5 — Submit Request.**

For **Request-to-Book:** The request goes to one carrier. The carrier has a configurable response window (default: 12 hours, extendable to 24 hours for flexibility). If declined or expired, the customer is notified and shown the next-best option with a single tap to re-request.

For **Fast Match:** The request goes to up to 3 carriers simultaneously. First to accept confirms the booking. Others are atomically revoked. If all decline or expire, the customer is notified and the need routes to Alert the Network.

### 5.6 Post-Booking Coordination

After the carrier accepts:

**Both sides see a shared booking detail screen with:**

- Confirmed item, addresses, date, time window, price.
- A status timeline: Requested → Accepted → Pickup window → Picked up → In transit → Delivered → Confirmed.

**Structured coordination (not open-ended chat):**

- Carrier sends one-tap status updates: "On my way" → "10 minutes away" → "Arrived at pickup" → "Item loaded" → "Arrived at drop-off" → "Delivered."
- Customer receives push notifications for each status update.
- Pre-built quick responses are surfaced for carriers: "Running 15 mins late," "Parking is difficult — please meet outside," "Need help loading."
- Free-text in-app messaging is available but not emphasised. The UI nudges structured communication to reduce unsafe typing while driving.

**On delivery:**

- Carrier taps "Delivered" and uploads a timestamped, GPS-tagged photo of the delivered item.
- Customer receives notification to confirm receipt ("Tap to confirm your item arrived safely").
- Customer taps "Received" to release payment.
- If the customer does not confirm within 72 hours and no dispute is raised, payout auto-releases based on the carrier's proof-of-delivery.

**Communication rule:** Phone numbers are not shared between parties at MVP. All communication happens through the platform. This protects against disintermediation and provides a dispute record.

---

## 6. Carrier Experience Architecture

### 6.1 Acquisition

A single, outcome-led landing page:

- Headline: "Turn your empty van space into extra cash."
- Promise: "You're already driving. Moverrr lets you fill your spare space and earn more from trips you're already taking."
- Three proof points: "Set your own prices. Choose which jobs to accept. Get paid within 48 hours of delivery."
- One CTA: "Start earning."

### 6.2 Signup (Account Creation)

**FIXED:** Account creation is deliberately frictionless. Supply activation is a separate, strict gate.

Account creation collects only:

- Full name
- Email
- Phone number
- Password

The carrier now has an account. They can log in and see the platform. They cannot post trips or accept bookings.

### 6.3 Supply Activation (Verification Gate)

**FIXED:** No carrier can appear in customer search results, accept a booking request, or see full customer details until activation is complete and manually approved.

**Why:** Sending real customer leads to unverified carriers with unknown vehicles destroys demand-side trust. A single bad experience — carrier arrives with the wrong vehicle, fails to show, or damages the item — permanently loses the customer.

**Activation is a three-step flow with saved progress and clear "resume later" option:**

**Step 1 — Identity & Business:**

- Legal name confirmation.
- ID verification (driver's licence upload; validated against name). Implementation: use Stripe Identity or equivalent automated verification.
- ABN (optional — flagged as "improves your trust ranking" but not a gate).

**Step 2 — Vehicle & Capacity:**

- Vehicle type: select from Ute / Van / Small Truck / Large Truck (with representative images for each).
- Vehicle registration number.
- Vehicle photo (exterior, showing cargo area — required; minimum 1 photo).
- Typical available space: select from "Quarter empty / Half empty / Mostly empty / Completely empty."
- Accepted item categories: checkboxes from the predefined category list (see Section 8).
- Item constraints: structured toggles and fields:
  - "Ground floor only" (Yes/No)
  - "Single-person lift only" (Yes/No)
  - "Stairs OK — up to N flights" (dropdown: 1 / 2 / 3+)
  - "Max single-item length" (optional; dropdown: 1m / 1.5m / 2m / 2.5m / 3m+)
  - "Fragile items accepted" (Yes/No)

**Step 3 — Payout & Documents:**

- Stripe Connect payout setup (required — cannot complete activation without this).
- Insurance certificate upload (optional for MVP — flagged as trust boost and future badge, not a gate).
- Submit for review.

**Review is manual at MVP.** Founder reviews each submission. Target turnaround: 24 hours. Carrier is notified of approval or rejection with specific reasons.

**Teaser demand for unactivated carriers:** An unactivated carrier who logs in sees a blurred demand summary for their operating area: "There are 6 pending requests on routes near Western Sydney this week worth ~$580." The explicit CTA: "Complete your setup to unlock these jobs." This number must be computed from real data; do not fabricate.

### 6.4 Carrier Home (State-Aware Command Centre)

**FIXED:** The carrier home is a state-aware work queue that adapts to the carrier's lifecycle stage. A single static dashboard for all carrier states is explicitly rejected.

**Mode 1 — Activation (unverified or incomplete):**

- Hero: "You're 2 steps from unlocking jobs."
- Primary CTA: "Resume setup."
- Progress bar showing completion state.
- Teaser demand (blurred).
- Nothing else. No analytics, no trip lists, no clutter.

**Mode 2 — Ready to Post (verified, no active trips):**

- Hero: "Post your next route."
- Primary CTA: "Post a trip."
- If templates exist: "Quick repost" buttons for saved corridors, sorted by recency.
- If no templates: brief explanation of how posting works.
- Demand signal: "3 customers are looking for moves on the Sydney–Newcastle corridor this week."
- No analytics dashboards.

**Mode 3 — Active Operations (has live or upcoming trips or pending requests):**

- Hero: the most urgent action item, in this priority order:
  1. Pending booking request → "You have a new booking request. Review it."
  2. Trip happening today → Today/runsheet view with pickup/delivery sequence.
  3. Proof needed → "Upload delivery proof to release your $85 payout."
  4. Payout blocked → "Complete [step] to release $X."
- Below the hero: compact list of upcoming trips with status badges.
- Pending requests are shown as decision cards (see 6.7).

### 6.5 Trip Posting

**FIXED:** Two modes.

**Quick Post (repeat carriers, target: under 30 seconds):**

- Select a saved template or previous trip.
- Confirm or adjust: route, date, time window, vehicle, capacity, pricing.
- Publish.

**Advanced Post (new routes, full wizard):**

**Step 1 — Route:**
- Start location (Google Places Autocomplete).
- End location (Google Places Autocomplete).
- Optional: up to 2 intermediate waypoints (supports multi-leg trips like Blacktown → Parramatta → Chatswood).
- Optional: "Return trip available" toggle — if toggled, a second trip is created for the reverse direction on the same or a specified return date.

**Step 2 — Schedule:**
- Date.
- Time window (departure window, e.g., "9am–1pm").
- Optional: "This is a regular run" toggle → select frequency (weekly / fortnightly / specific days). System auto-generates future trip listings up to 4 weeks ahead.

**Step 3 — Vehicle & Capacity:**
- Select vehicle (from registered vehicles on the carrier profile).
- Available space: select from "Quarter empty / Half empty / Mostly empty / Completely empty."
- Accepted item categories: checkboxes.
- Item constraints: structured toggles (ground floor only, stairs policy, max item length, single-person lift only, fragile accepted).

**Step 4 — Detour & Pricing:**
- Max detour tolerance: carrier sets a maximum in km or minutes (e.g., "10 km" or "15 min"). This is a hard boundary the matching engine respects.
- Pricing table: set a base price for each accepted item category/tier. Platform shows suggested ranges (informational only) based on route distance and category.
- Add-on rates (optional but recommended): stairs surcharge, helper surcharge. These are predefined amounts, not free text.
- Detour rate (optional): per-km or per-minute rate for out-of-corridor pickups/drop-offs, used by the pricing engine to compute total price.

**Step 5 — Review & Publish.** Or save as draft.

**Supply-quality enforcement (hard requirements to publish):**

- Vehicle photo(s) ≥1.
- Route defined (start + end, date, time window).
- At least one accepted item category.
- Pricing set for every accepted category.
- Stairs/helper policy set.

**Templates:** After a carrier posts a trip, the system auto-generates a template for that corridor. The carrier can rename it ("Sydney–Newcastle weekly run") and repost with one tap + date confirmation.

**Recurring trips:** If "regular run" is toggled, the system auto-generates future listings at the selected frequency, up to 4 weeks ahead. The carrier can cancel or modify individual instances.

### 6.6 Trip Management

Trips are organised by operational state, not as a flat chronological list:

| State | Content |
|-------|---------|
| **Needs Action** | Pending booking requests, unconfirmed trips within 48 hours, proof-of-delivery overdue. |
| **Today** | Trips happening today (runsheet view). |
| **Upcoming** | Confirmed trips with accepted bookings. |
| **Drafts** | Unpublished trips. |
| **Past** | Completed trips with payout status. |
| **Templates** | Saved corridor templates for quick repost. |

Templates are a first-class view within the Trips tab, not buried in settings.

### 6.7 Booking Request Handling

When a customer submits a booking request, the carrier receives a push notification and sees a **decision card**:

| Element | Content |
|---------|---------|
| Item | Category, variant, quantity, customer-uploaded photo |
| Route fit | "Pickup in Newtown (3 km from your route, ~8 min detour). Drop-off in Burwood (on your route)." |
| Access summary | "Ground floor pickup. Drop-off: 2nd floor, no lift, no help." **Highlighted in amber if access complexity exists.** |
| Payout | "$70.00 (after platform fee)" — the carrier's net take |
| Response deadline | "Respond within 12 hours" with countdown |
| Actions | **Accept** / **Decline** (with optional reason) / **Request Clarification** |

**Request Clarification** is NOT a negotiation channel. It exists only for factual gaps or contradictions: "Photo shows a 3-seater sofa but you selected Small Furniture — can you confirm?" The carrier selects from predefined clarification reasons. One round only.

**No counter-proposals at MVP (with one structured exception).** See Section 9 for the structured adjustment path.

**If the carrier declines:** The customer is notified and shown the next-best available option. The carrier is not penalised for declining, but persistent declining without posting trips will eventually reduce visibility in rankings (post-MVP).

### 6.8 Trip-Day Operations (Runsheet Mode)

**FIXED:** When a carrier has a trip today, the app transforms into an operational runsheet. This is the default carrier home surface on trip day.

**Runsheet view shows:**

- Timeline of today's pickups and drop-offs, in route order.
- For each stop: customer first name, item summary (icon + quantity), address, one-tap navigation link (opens Google Maps / Waze externally), one-tap status update buttons.
- Status flow per stop: "On my way" → "Arrived" → "Item loaded" or "Item delivered" → "Upload proof photo."
- Payout blockers shown inline: "Upload delivery photo to release $85."
- Quick-tap updates designed for safe use while driving: large tap targets, minimal typing, pre-built response templates.

### 6.9 Proof of Delivery & Payout

**Proof of delivery:**

- Carrier taps "Delivered" and uploads a photo (minimum 1, timestamped, GPS-tagged by the app automatically).
- Customer receives notification to confirm receipt.
- If customer confirms: payout is released to carrier's Stripe Connect account.
- If customer does not confirm within 72 hours and no dispute is raised: payout auto-releases based on proof.
- If customer disputes within 72 hours: payout is blocked. Founder adjudicates manually at MVP.

**Payout visibility (carrier sees):**

| Field | Status Options |
|-------|---------------|
| Per-trip payout | Pending confirmation / Processing / Paid |
| Breakdown | Gross amount, platform fee deducted, GST, net payout |
| Blockers | "Waiting for customer confirmation" / "Proof photo required" / "Stripe setup incomplete" |
| Aggregates | This week / This month / All time |

### 6.10 Repeat Usage Loop

**FIXED:** Templates and quick-post are the carrier retention engine, not a side feature. If posting a repeat corridor takes more than 30 seconds, the product is failing.

The loop:
1. Complete a trip.
2. System prompts: "Post this route again?" with one-tap repost for next week.
3. Template is auto-generated from the completed trip.
4. Carrier sees demand signal for that corridor ("4 customers searched this corridor this week").
5. Carrier reposts. Habit forms.

---

## 7. Matching and Route Logic

### 7.1 Core Matching Model

**FIXED:** The platform makes strong relevance judgments (ranking + eligibility filters) but does not pretend to optimise real-world routes beyond basic detour estimation. The carrier retains final accept/decline authority.

### 7.2 Inputs

**From MoveRequest (customer):**

- Pickup lat/lng (geocoded from address/suburb).
- Drop-off lat/lng.
- Item category, variant (if applicable), quantity.
- Timing window (specific date or flexible range).
- Access conditions (stairs, helper, parking, lift).

**From Trip (carrier):**

- Route polyline (computed from start + end + optional waypoints via Google Maps Directions API).
- Pickup corridor tolerance (km) — derived from carrier's detour policy.
- Drop-off corridor tolerance (km).
- Date, time window.
- Vehicle type, capacity descriptor.
- Accepted item categories with pricing.
- Item constraints (stairs policy, helper policy, max item length, fragile accepted).

### 7.3 Eligibility Rules (Hard Filters)

A Trip is excluded from results if ANY of these fail:

1. **Category gate:** Carrier does not accept the customer's item category.
2. **Constraint gate:** Customer's access conditions conflict with carrier's hard constraints (e.g., customer says "3rd floor, no lift" and carrier has "ground floor only").
3. **Timing gate:** Trip date does not fall within the customer's acceptable window.
4. **Proximity gate:** Pickup or drop-off is beyond the carrier's maximum detour tolerance from the route polyline.

These are binary pass/fail. A failed Trip never appears in results.

### 7.4 Corridor and Radius Logic

Corridor is defined as the trip's route polyline + tolerance radius (not a city-to-city label). For each candidate Trip, calculate the shortest distance from the customer's pickup point to the route polyline, and the same for the drop-off point.

**Default tolerance bands (carrier-configurable within these bounds):**

| Route Type | Route Length | Default Corridor Tolerance | Max Endpoint Tolerance |
|------------|-------------|---------------------------|----------------------|
| Local/metro | Up to 40 km | 5 km | 8 km |
| Regional | 41–150 km | 10 km | 15 km |
| Intercity | 150+ km | 20 km | 25 km |

Carrier can set their own detour tolerance (strict / standard / flexible) or a specific km/minute value, within the bounds above.

### 7.5 Detour Estimation

**FIXED:** The platform computes a lightweight detour estimate for ranking and carrier decision cards. It does not claim precision beyond that.

**Implementation:**

For each eligible Trip, compute:
1. Base route duration and distance (from the Trip's stored polyline).
2. Route with customer pickup and drop-off inserted (approximate, using Google Maps Directions API for selected candidates).
3. Detour delta: additional km and additional minutes.

**What the customer sees:** Route-fit label ("Direct route" / "Near your pickup (~3 km)" / "Detour required (~12 min)").

**What the carrier sees on the decision card:** "Pickup is 3 km from your route (~8 min detour). Drop-off is on your route."

**What the platform does NOT do:** Calculate fuel costs, per-km detour pricing decisions, or time-value trade-offs. That is the carrier's judgment.

### 7.6 Partial Route Matching

A partial match occurs when the carrier's route covers only part of the customer's journey (e.g., carrier goes Brisbane to Beenleigh, customer needs Brisbane to Gold Coast).

**Rules:**

- Show partial matches only if the uncovered portion is under 30% of the total customer route distance AND the detour is within the carrier's tolerance.
- Label clearly: "Covers your pickup area. Drop-off is 15 km beyond this driver's listed route."
- Show in the "Possible matches (needs approval)" section, below strong matches.
- If detour exceeds the carrier's maximum, do not show. Route to Alert the Network instead.

### 7.7 Relevance Ranking

Ranking combines multiple signals into a single relevance score. Ranking inputs (in priority order):

1. **Route-fit score** — lower detour distance scores higher; direct routes score highest.
2. **Time-fit score** — exact date match > within flexible window > nearby dates.
3. **Fit-confidence score** — item tier vs capacity vs constraints; "Likely fits" ranks higher than "Needs approval."
4. **Trust score** — verification level + star rating + trips completed + response reliability.
5. **Price** — as a tiebreaker, not primary. This prevents commoditisation via pure price sorting.

**Starting weights (tunable):** Route-fit 30%, Time-fit 25%, Fit-confidence 20%, Trust 15%, Price 10%.

### 7.8 Match Classification Labels

Every result card gets a match_class label, generated deterministically:

| match_class | Condition | Customer Label |
|-------------|-----------|----------------|
| `direct` | Both pickup and drop-off within 2 km of route, exact date | "Direct route match" |
| `near_pickup` | Pickup 2–8 km from route, drop-off within 2 km | "Near your pickup (~X km)" |
| `near_dropoff` | Pickup within 2 km, drop-off 2–8 km from route | "Near your drop-off (~X km)" |
| `minor_detour` | Both points 2–8 km from route | "Small detour required" |
| `nearby_date` | Direct route but date offset 1–7 days | "Available [N] days [before/after] your preferred date" |
| `partial_route` | Route covers <100% of customer journey | "Covers [X]% of your route" |
| `needs_approval` | Detour > 8 km or fit confidence low | "Possible match — needs approval" |

---

## 8. Item and Capacity Model

### 8.1 Item Categories

**Customer-facing categories (MVP):**

| Category | Examples | Default Tier | Photo Required |
|----------|----------|-------------|----------------|
| Boxes & Parcels | Moving boxes, packages, small electronics | Small | No (recommended) |
| Small Furniture | Coffee table, bookshelf, chair, small desk, TV | Medium | Recommended |
| Large Furniture | Sofa, dining table, bed frame, wardrobe, large desk | Large | **Mandatory** |
| Appliances | Fridge, washing machine, dryer, dishwasher, oven | Large | **Mandatory** |
| Sporting & Outdoor | Bicycle, surfboard, kayak, BBQ, gym equipment | Medium–Large | **Mandatory** |
| Mattress & Bed | Mattress, bed base, ensemble | Large | **Mandatory** |
| Other | Free-text description | Variable | **Mandatory** |

**High-risk categories require a variant picker:**

| Category | Variants |
|----------|----------|
| Large Furniture — Sofa | 2-seater / 3-seater / L-shaped / Modular |
| Appliances | Fridge / Washing machine / Dryer / Dishwasher / Other appliance |
| Mattress & Bed | Single / Double / Queen / King |

Variants improve fit-confidence scoring and pricing accuracy without creating a deep taxonomy.

### 8.2 Item Selection UX

The customer sees a visual grid of category icons. They tap one. A quantity selector appears (default 1, max 10). For categories with variants, the variant picker appears. For "Other," a text field and mandatory photo upload appear.

No dimensions asked. No weight asked. No cubic-metre inputs. The customer's photo + structured category/variant selection is the definitive item description.

### 8.3 Capacity Communication

Carriers describe available space using human-readable descriptors:

- Quarter empty
- Half empty
- Mostly empty
- Completely empty

The system translates these into approximate "space units" internally for fit-confidence scoring. The customer sees human-language capacity descriptions generated from the mapping:

- "Space for ~1 couch OR ~12 standard boxes."
- "Fits most single large items."
- "Suitable for boxes and small furniture."

**FIXED:** Cubic metres are never shown to the customer. They may exist internally for scoring, but the product never exposes them.

### 8.4 Fit Confidence

The system computes fit confidence from: item category + variant + quantity vs vehicle type + available space descriptor + carrier's accepted categories + carrier's max-item-length setting.

**Customer sees one of three labels:**

| Label | Condition |
|-------|-----------|
| **Likely fits** | Item tier within capacity, category accepted, no constraint conflicts |
| **Review photos** | Borderline capacity or unusual item; carrier should review photos before accepting |
| **Needs approval** | Low confidence; "Other" category; partial match; or constraint ambiguity |

Carriers who only accept "Likely fits" and "Review photos" can opt out of "Needs approval" requests entirely.

---

## 9. Pricing and Negotiation Logic

### 9.1 Chosen Model

**FIXED:** Deterministic pricing via carrier-set base rates + structured add-ons + platform fee + GST. No open-ended negotiation. One structured adjustment path for genuine constraint mismatches only.

### 9.2 How Pricing Works

**Carrier sets (during trip posting or in template):**

- Base price per accepted item category/tier for this trip.
- Structured add-on rates:
  - Stairs surcharge (per flight, predefined amounts: e.g., $10/flight at pickup, $10/flight at drop-off).
  - Helper/2-person surcharge (flat rate, e.g., $30).
  - Detour rate (per km beyond included corridor tolerance, e.g., $3/km — optional).

**Platform applies:**

- Platform service fee (percentage-based; initially 15% of carrier's base + add-ons).
- GST on the total (as required under Australian tax law).

**The formula:**

```
Total Price = Base(item_tier, quantity) + Add-ons(stairs, helper) + Detour_adjustment(if applicable) + Platform_fee + GST
```

**Customer sees:** A single total price on the result card. The breakdown (carrier fee + add-ons + platform fee + GST) is shown on the detail page and at booking confirmation. The price is deterministic: it is computed from structured inputs, not negotiated.

**Implementation note:** The price is calculated at the time results are generated and locked when the booking request is submitted. If the customer changes access conditions during booking confirmation (e.g., corrects from "no stairs" to "2 flights"), the price updates in real time before final submission.

### 9.3 Platform-Suggested Pricing Ranges

When a carrier sets base prices during trip posting, the platform shows suggested ranges based on route distance and item category. These are derived from historical transaction data (once available) or pre-seeded defaults based on distance bands. Informational only — the carrier chooses their price.

### 9.4 The Structured Adjustment (Single Exception Path)

**Situation:** The carrier arrives at the pickup and discovers that the declared conditions do not match reality. The sofa is on the 3rd floor, not the ground floor. The item is materially larger than the selected category. The parking requires a 15-minute walk.

**Mechanism:**

1. The carrier triggers a "Condition Adjustment" from the booking screen.
2. The carrier selects a predefined reason from a structured dropdown:
   - Stairs mismatch (actual vs declared).
   - Helper requirement (item requires 2 people, not declared).
   - Item materially different from selected tier/variant.
   - Extreme parking/wait scenario beyond declared conditions.
3. The carrier selects an adjustment amount from predefined options (not free text): e.g., "+$15 for additional 2 flights of stairs" or "+$30 for helper required."
4. The customer receives a notification with the adjustment reason and amount.
5. The customer taps **Accept** (price updates, booking continues) or **Reject** (booking is cancelled under the misdescription policy; carrier is not penalised).
6. **No second round.** One adjustment, one response. Done.

**Why this exists (and why it is not negotiation):** Bad-fit scenarios are structurally common in spare-capacity logistics. The customer may genuinely not know they have narrow stairs or a heavy item. Killing the booking entirely when the carrier is already there wastes everyone's time. The structured adjustment handles the real-world mismatch without opening a negotiation channel.

**What this is NOT:** It is not a counter-proposal system. The carrier cannot adjust the base price or request an arbitrary amount. The reasons and amounts are predefined by the platform. The carrier cannot use this to negotiate a higher rate — only to correct a genuine mismatch between declared and actual conditions.

### 9.5 What Is Explicitly Rejected

- Counter-proposals on base price.
- Customer budget bidding ("I'll pay $50 for this").
- "Quote me" or "Make me an offer" flows.
- Multi-round price negotiation.
- Pricing hidden until after messaging.
- Hourly rates displayed alongside flat rates (ambiguity creator).
- Freeform pricing text.

**FIXED. Do not re-litigate.**

---

## 10. Trust, Verification, and Risk Controls

### 10.1 Platform Trust

MVP platform trust consists of:

- Verified carrier identity before live supply.
- Escrowed payment (authorised on request submission, charged on acceptance, held until delivery confirmation).
- Structured booking records providing a dispute trail.
- Delivery proof requirement (photo + GPS + timestamp).
- Clear cancellation and misdescription policy.
- Founder-adjudicated disputes at MVP.
- Explicit statement of what Moverrr does and does not cover.

**Honesty over fake reassurance:** Moverrr should not market a vague "guarantee" unless there is a defined, funded policy behind it. At MVP, the guarantee is: "If something goes wrong, Moverrr will help resolve it." The coverage is: item damage during transit (capped at a customer-declared value, default $500), carrier no-show after acceptance, and significant deviation from agreed service. Funded from platform margin. Adjudicated by founder.

### 10.2 Carrier Trust

**Required to go live (hard gate):**

- Identity verified (driver's licence, validated via Stripe Identity or equivalent).
- Vehicle details completed (type, rego, photo).
- Service rules set (accepted categories, constraints).
- Stripe Connect payout account active.

**Optional trust badges (not gates):**

- ABN verified.
- Goods-in-transit insurance certificate uploaded.

**Customer-facing trust signals:**

| Signal | Displayed When |
|--------|---------------|
| "Verified" badge | ID verification passed |
| Star rating (1–5) | After 3+ completed trips with ratings |
| "New on Moverrr, verified" | Fewer than 3 ratings |
| Trip count | Always (e.g., "12 trips completed") |
| "Member since [date]" | Always |
| Review tags ("On time", "Careful handler", "Good communication") | After 3+ ratings with tags |
| "ABN verified" badge | If ABN confirmed |
| "Insured" badge | If insurance certificate uploaded |

### 10.3 Rating and Review Model

**MVP:** After delivery confirmation, both sides are prompted:

- Star rating (1–5).
- Optional tags: "On time" / "Careful handler" / "Good communication" (customer rates carrier); "Easy pickup" / "Accurate description" / "Friendly" (carrier rates customer).
- Written review: optional free text (post-MVP for display; collected now for data).

**Display rules:** Rating and tags are shown only after 3+ ratings. Before that, show verification status and trip count only. Do not show "0 stars" or "New."

### 10.4 Ghost Dimension Controls

The Ghost Dimension problem — customers misrepresenting item size, omitting stairs, or failing to mention two-person lift requirements — is one of the most dangerous failure modes.

**Layered defence:**

1. **Customer-side (wizard, Screen D):** Structured access questions collected before results are shown. These feed the matching engine's eligibility filter.
2. **Carrier-side (trip posting):** Structured constraint toggles. "Ground floor only." "Single-person lift only." "Max item length: 2m."
3. **System enforcement:** If the customer's access conditions conflict with the carrier's constraints, the carrier does not appear in results. The conflict is never visible to either party — the match simply does not happen.
4. **Photo requirement:** Mandatory for all bulky items.
5. **Terms enforcement:** Booking confirmation includes: "Inaccurate item descriptions or undisclosed access difficulties may result in cancellation without refund."
6. **Structured adjustment:** If the real-world conditions differ from declared inputs, the carrier can trigger the condition adjustment (Section 9.4), or cancel without penalty under the misdescription policy.

### 10.5 Proof of Delivery

- Carrier uploads a timestamped, GPS-tagged photo of the delivered item at the drop-off location.
- Optional: pickup-condition photo (recommended for high-value items; not mandatory at MVP).
- Customer confirms receipt.
- If customer does not confirm within 72 hours and no dispute is raised: auto-release based on proof.
- Disputes are founder-adjudicated at MVP.

### 10.6 Payout Release Logic

```
Customer submits request → Payment AUTHORISED (hold)
Carrier accepts → Payment CHARGED (captured)
Carrier delivers + uploads proof → Payout PENDING CONFIRMATION
Customer confirms "Received" → Payout RELEASED
  OR
72 hours pass without dispute + valid proof exists → Payout AUTO-RELEASED
  OR
Customer opens dispute within 72 hours → Payout BLOCKED → Founder adjudicates
```

### 10.7 Trip Freshness & Confirmation Pings

**FIXED:** Mandatory check-in system to prevent stale supply.

| Timing | Trigger | Consequence of No Response |
|--------|---------|--------------------------|
| 24 hours before trip | Push notification: "Do you still have space for tomorrow's trip?" | Trip flagged as "unconfirmed." Deprioritised in matching results. |
| 2 hours before trip | Push notification: "Confirm your trip is still on." | Trip auto-suspended. Affected customers notified: "Your carrier hasn't confirmed. We're finding alternatives." |

If a carrier repeatedly fails to confirm, their trust score degrades and they receive fewer match opportunities.

---

## 11. No-Match and Demand Capture Logic

**FIXED:** This is a core survival mechanism, not a secondary feature. Every zero-match state routes into Alert the Network. The customer never hits a dead end.

### 11.1 What Happens When There Are Zero Strong Matches

**Step 1 — Show near-matches if they exist.**

Before declaring zero results, the system checks for:
- Carriers on the same corridor within 7 days of the requested date.
- Carriers on adjacent corridors (wider radius) on the requested date.
- Carriers covering a partial route segment.

If any exist, show them below a contextual header: "No exact matches right now, but these drivers are close."

**Step 2 — If truly zero matches: Alert the Network.**

The UI shows:

- A clear, reassuring message: "No drivers are currently listed on this route for your dates."
- Immediate action: "We'll alert drivers in your area and notify you when a match appears."
- Credible social proof (computed from real data): "There are [X] verified drivers who travel corridors near [route summary]." If X is 3, say 3.
- Secondary option: "Want to broaden your dates?" (link back to wizard timing step).
- One-tap CTA: "Alert the Network."

### 11.2 What Gets Stored

An **UnmatchedRequest** (demand object) containing:

- Route (pickup/drop-off geocodes and suburb names).
- Timing window (original + any broadened range).
- Item category, variant, quantity.
- Access conditions.
- Photos (if already provided).
- Customer contact and notification preference.
- Status: active / notified / matched / expired.
- Created timestamp.
- Expiry: 30 days from creation.

### 11.3 What Gets Triggered

1. **Carrier notification:** All verified carriers whose saved corridors or past trip routes overlap with the customer's corridor receive a push notification: "New request: [Item] from [Origin] to [Destination], [Date range]. Post a trip to claim it."
2. **Carrier feed inclusion:** The request appears in the carrier's "Requests" or "Opportunities" feed (teaser if carrier is unactivated).
3. **Re-match checks:** Whenever a new Trip is published, the system checks against all active UnmatchedRequests. If a match is found, the customer is notified: "A driver is now available on your route. Tap to view."
4. **Operator task queue:** If no carrier responds within a configurable SLA threshold (default: 2 hours for urgent, 24 hours for flexible), a task is created in the internal operator queue for manual outreach.
5. **Expiry notification:** At 30 days, the customer is notified: "Your request has expired. Would you like to search again?"

### 11.4 Concierge Offer (Founder Manual Fulfilment)

**FIXED:** Founder-led manual fulfilment is part of the MVP operating model.

**Mechanism:**

- The founder identifies an unmatched request from the operator queue.
- The founder personally sources a carrier (from Airtasker, Facebook Marketplace groups, personal network, cold outreach, or an existing Moverrr carrier who hasn't posted a trip for this corridor).
- If the carrier is new: founder walks them through activation on the platform. The carrier must complete activation before accepting.
- The founder creates a **Concierge Offer** entity linked to the UnmatchedRequest. This is a system entity, not an off-platform workaround. It records: which UnmatchedRequest is being fulfilled, which carrier is being matched, the proposed price, and the operator who created it.
- The carrier reviews and accepts through the normal booking flow.
- The customer is notified and confirms through the normal booking flow.
- The transaction completes through the platform. Data integrity is preserved.

**Why this matters:** Every manually sourced transaction does three things simultaneously: (1) converts a customer, (2) activates a carrier, and (3) validates demand on that corridor. This is how marketplace supply is bootstrapped.

---

## 12. Information Architecture

### 12.1 Customer Side (Mobile-First)

**Bottom navigation (4 tabs):**

| Tab | Label | Content |
|-----|-------|---------|
| 1 | Home | Need-declaration wizard (primary action). After first use: recent searches + "New search" CTA. |
| 2 | Bookings | Active bookings (with live status timeline), Past bookings, Pending requests. |
| 3 | Alerts | Saved demand alerts (Alert the Network items) with status: Active / Matched / Expired. |
| 4 | Account | Profile, payment methods, settings, help, support, cancellation policy, Moverrr guarantee info. |

Search is not a separate tab. Home IS the search entry point.

### 12.2 Carrier Side (Mobile-First)

**Bottom navigation (5 tabs):**

| Tab | Label | Content |
|-----|-------|---------|
| 1 | Home | State-aware command centre (Section 6.4). |
| 2 | Requests | Pending booking decision cards. Badge count for unreviewed requests. |
| 3 | Trips | All trips by state: Needs Action / Today / Upcoming / Drafts / Past / Templates. |
| 4 | Payouts | Payout history, pending payouts, blockers, Stripe status, aggregates. |
| 5 | Account | Profile, vehicle info, documents, verification status, service rules, settings. |

**Why Requests is a separate tab (not merged into Home):** Pending requests are the carrier's highest-urgency action. A dedicated tab with a badge ensures they are never buried. The Home surface shows the most urgent single item; the Requests tab shows all pending decisions.

### 12.3 Mobile-First Constraints

- All flows are linear. No tabs mid-flow.
- Progress indicators at the top of multi-step flows.
- One primary CTA per screen.
- Cards, not tables.
- Thumb-zone-friendly button placement.
- All critical actions achievable in under 3 taps from the home screen.
- Large tap targets for carrier operational actions (designed for use in vehicles).

---

## 13. MVP Scope

### 13.1 Must Be Included Now

**Customer:**
- Need-first wizard (route + item + timing + access).
- Match-ranked results with fit labels, match explanations, and deterministic prices.
- Offer detail page with price breakdown, route context, and trust signals.
- Request-to-Book + Fast Match (up to 3).
- Photo upload (mandatory for bulky items).
- Booking status timeline + push notifications.
- Alert the Network demand capture.

**Carrier:**
- Frictionless signup + strict verification gate (ID, vehicle, Stripe).
- Advanced trip posting wizard + quick repost from templates.
- Booking request decision cards (accept/decline/clarify).
- State-aware carrier home (3 modes).
- Today/runsheet view on trip day.
- Proof-of-delivery capture (photo + GPS + timestamp).
- Payouts view with status and blockers.
- Templates as first-class entity.
- Trip freshness check-in pings (24h + 2h).

**Trust & System:**
- Deterministic pricing (base + add-ons + platform fee + GST).
- Structured adjustment (single exception path for condition mismatches).
- Polyline-based corridor matching with detour estimation.
- Dispute process (founder-adjudicated).
- Payout hold + release + 72-hour auto-release.
- Concierge Offer entity for manual fulfilment.
- Total-price display (including GST and all mandatory fees).

### 13.2 Must Be Deferred

- Written review display (collect data now; display post-MVP).
- Secondary corridor browse/explore layer.
- Live real-time tracking during transit.
- Deep carrier analytics dashboards.
- Phone masking / telephony integrations (cost-dependent).
- Insurance marketplace or underwriting.
- SMB/business dedicated account management UI.
- Calendar integration for carriers.
- Advanced multi-stop route optimisation beyond 2 waypoints.

### 13.3 Must NOT Be Built Yet

- Open bidding or auction mechanics.
- Customer budget bidding.
- Multi-round price negotiation.
- Browse-first public inventory as the primary homepage.
- Split-screen map-first results.
- Enterprise freight features.
- Volumetric packing simulation or visual van-loading UI.
- Dispatch-style auto-assignment.
- Algorithmic detour cost calculation for pricing.
- Cubic-metre customer-facing UI.

### 13.4 Future-Ready Hooks (Architecture Only, No Build)

These must exist in the data model and state logic without bloating the MVP frontend:

- Trip entity includes fields for waypoints (even if MVP UI allows max 2).
- Item taxonomy is extensible (new categories/variants added without restructuring matching).
- Carrier profile has a "service_type" field (individual / business) — not exposed in MVP UI but supports future SMB features.
- User entity supports dual-role (same user can be both customer and carrier) — architecture allows it, MVP does not build the switching UI.
- Rating records are stored individually (not just aggregates) — supports future review display and trust algorithm improvements.
- UnmatchedRequest entity stores enough structured data for future supply-demand analytics.
- Verification levels are extensible (add new tiers without schema changes).
- Recurring trip patterns are stored (even if MVP only auto-generates 4 weeks ahead).

---

## 14. Backend and System Implications

### 14.1 Core Entities

**User**
- id, email, phone, password_hash, role (customer / carrier / operator / dual), created_at, status.

**CustomerProfile**
- user_id, name, default_address, payment_methods (Stripe customer_id), location (suburb/region).

**CarrierProfile**
- user_id, name, activation_status (enum: unverified / activation_started / pending_review / active / suspended), operating_area (suburb/region), ABN (optional), insurance_uploaded (boolean), rating_aggregate, rating_count, trip_count, response_reliability_score.

**Verification**
- carrier_id, identity_status (unverified / pending / verified / failed), payout_status (unstarted / pending / active), vehicle_status (incomplete / complete), reviewed_by, reviewed_at.

**Vehicle**
- carrier_id, type (ute / van / small_truck / large_truck), rego, photos[], capacity_units_total, capacity_descriptor (quarter / half / mostly / completely_empty), max_item_length_bucket (optional).

**TripTemplate**
- carrier_id, name, route_start, route_end, waypoints[], default_tolerance_km, default_pricing_table{}, default_constraints{}, created_at.

**Trip**
- id, carrier_id, template_id (optional), route_start (lat/lng + address), route_end (lat/lng + address), waypoints[] (lat/lng + address, max 2), route_polyline (geometry), date, time_window_start, time_window_end, vehicle_id, capacity_descriptor, accepted_categories[], constraints{stairs_policy, helper_policy, max_item_length, fragile_accepted}, pricing_table{category → base_price, add-ons → amounts, detour_rate}, detour_tolerance_km, status (draft / published / suspended / in_progress / completed / expired / cancelled), recurring (boolean), recurrence_pattern (optional), checkin_24h_confirmed (boolean), checkin_2h_confirmed (boolean), created_at.

**MoveRequest**
- id, customer_id, pickup (lat/lng + address + suburb), dropoff (lat/lng + address + suburb), item_category, item_variant (optional), item_quantity, item_photos[], item_notes (optional), timing_window{type, date, flexibility_range}, access_spec{stairs_pickup, stairs_dropoff, lift_available, helper_available, parking_difficulty}, status (draft / submitted / matched / expired), created_at.

**Offer (Match)**
- id, trip_id, move_request_id, computed_match_score, match_class (direct / near_pickup / near_dropoff / minor_detour / nearby_date / partial_route / needs_approval), match_explanation (string), detour_estimate_km, detour_estimate_min, fit_confidence (likely_fits / review_photos / needs_approval), computed_price_total, price_breakdown{base, add_ons{}, detour_adj, platform_fee, gst}, created_at.

**BookingRequest**
- id, customer_id, offer_id, request_group_id (for Fast Match; null for single request), status (pending / accepted / declined / expired / revoked / clarification_requested), response_deadline, submitted_at, responded_at.

**Booking**
- id, booking_request_id, customer_id, carrier_id, trip_id, item_spec{}, access_spec{}, price_total, carrier_payout, platform_fee, gst, payment_intent_id (Stripe), status (confirmed / pickup_due / picked_up / in_transit / delivered_pending_confirmation / completed / disputed / cancelled / refunded), confirmed_at, delivered_at, customer_confirmed_at, auto_release_at.

**ConditionAdjustment** (the structured adjustment entity)
- id, booking_id, triggered_by (carrier_id), reason (enum: stairs_mismatch / helper_required / item_different / parking_extreme), adjustment_amount, customer_response (accepted / rejected / pending), created_at, responded_at.

**Proof**
- id, booking_id, type (pickup / delivery), photos[], timestamp, gps_lat, gps_lng, created_at.

**UnmatchedRequest**
- id, move_request_id, customer_id, route_pickup, route_dropoff, timing_window, item_spec, access_spec, alert_status (active / notified / matched / expired / cancelled), carriers_notified[], operator_task_created (boolean), concierge_offer_id (optional), created_at, expires_at.

**ConciergeOffer**
- id, unmatched_request_id, operator_id, carrier_id, proposed_price, status (proposed / carrier_accepted / customer_confirmed / cancelled), created_at.

**Rating**
- id, booking_id, rater_id, rater_role (customer / carrier), ratee_id, score (1–5), tags[] (enum set), review_text (optional), created_at.

**Notification**
- id, user_id, type (enum), payload{}, channel (push / email / in_app), status (pending / sent / read), created_at.

### 14.2 State Machines

**Carrier Activation:**
```
unverified → activation_started → pending_review → active
pending_review → unverified (rejected with reasons)
active → suspended (policy violation)
```

**Trip:**
```
draft → published → in_progress → completed
published → suspended (check-in failed)
published → expired (date passed)
published → cancelled (carrier cancels)
```

**BookingRequest:**
```
pending → accepted → (creates Booking)
pending → declined
pending → expired (response deadline passed)
pending → revoked (Fast Match: another carrier accepted first)
pending → clarification_requested → pending (after clarification provided)
```

**BookingRequest Group (Fast Match):**
```
created → broadcast_pending
On first accept: group_confirmed (atomic) → revoke all siblings
If all decline/expire: group_failed → suggest widen dates + Alert the Network
```

**Booking:**
```
confirmed → pickup_due → picked_up → in_transit → delivered_pending_confirmation → completed
delivered_pending_confirmation → completed (customer confirms OR auto-release at 72h)
delivered_pending_confirmation → disputed (customer opens dispute within 72h)
confirmed → cancelled (by either party, with policy rules)
disputed → resolved_carrier / resolved_customer / resolved_split
```

**Payout:**
```
held (payment captured on acceptance) → pending_confirmation (proof uploaded) → released (customer confirms or auto-release) → paid (Stripe transfer complete)
pending_confirmation → blocked (dispute opened)
```

**UnmatchedRequest:**
```
active → notified (carriers alerted) → matched (new trip matches) → (links to Offer)
active → expired (30 days)
active → cancelled (customer cancels)
```

### 14.3 Matching Pipeline (Technical Requirements)

1. **Candidate retrieval:** Geospatial index query (PostGIS or equivalent) on Trip route bounding boxes to find trips whose corridors overlap with the MoveRequest's pickup and drop-off regions.
2. **Eligibility filter (hard constraints):** Category match + access-constraint compatibility + timing overlap + proximity within tolerance. Binary pass/fail.
3. **Detour compute:** For eligible candidates, compute detour estimate using Google Maps Directions API (insert pickup and drop-off into the trip's route). Cache results.
4. **Scoring:** Apply relevance ranking formula (Section 7.7) to produce a ranked list.
5. **Match explanation generator:** Deterministic string templates based on match_class + detour data (Section 7.8).
6. **Price computation:** For each eligible candidate, compute total price from carrier's pricing table + access add-ons + detour adjustment + platform fee + GST.
7. **Result assembly:** Return ranked list with Offer entities, capped at 20 results, grouped into "Top matches" / "Possible matches" / "Nearby dates."

### 14.4 Pricing Computation (Deterministic)

```
base = carrier_pricing_table[item_category]
add_ons = sum(applicable add-ons based on access_spec):
    stairs_surcharge = carrier_stairs_rate × (pickup_flights + dropoff_flights) if flights > 0
    helper_surcharge = carrier_helper_rate if helper_required and carrier_offers_helper
detour_adj = carrier_detour_rate × max(0, detour_km - included_tolerance) if detour_rate set
subtotal = (base × quantity) + add_ons + detour_adj
platform_fee = subtotal × platform_fee_rate (15% initially)
gst = (subtotal + platform_fee) × 0.10
total = subtotal + platform_fee + gst
carrier_payout = subtotal (base + add_ons + detour_adj)
```

### 14.5 Notification Logic

| Event | Recipient | Channel | Priority |
|-------|-----------|---------|----------|
| New booking request | Carrier | Push + in-app | High |
| Booking accepted | Customer | Push + email + in-app | High |
| Booking declined / expired | Customer | Push + in-app | Medium |
| Fast Match — booking confirmed | Customer + non-accepted carriers | Push + in-app | High |
| Carrier status update (on my way, arrived, etc.) | Customer | Push + in-app | Medium |
| Delivery proof uploaded | Customer | Push + in-app | Medium |
| Customer confirms receipt | Carrier | In-app | Low |
| 72-hour auto-release | Both | Push + in-app | Medium |
| Payout released | Carrier | Push + in-app | Medium |
| Condition adjustment proposed | Customer | Push + in-app | High |
| Alert the Network — new demand | Relevant carriers | Push | Medium |
| Alert the Network — match found | Customer | Push + email | High |
| Trip check-in (24h) | Carrier | Push | Medium |
| Trip check-in (2h) | Carrier | Push | High |
| Check-in failed — trip suspended | Customer + carrier | Push + in-app | High |
| Clarification requested | Customer | Push + in-app | Medium |
| UnmatchedRequest expiring (7-day warning) | Customer | Push + email | Low |

### 14.6 Supply-Quality Enforcement Points

| Enforcement | Description |
|-------------|-------------|
| Carrier cannot publish trip | Without completing activation |
| Carrier cannot publish trip | Without vehicle photos, accepted categories, pricing, and constraint rules set |
| Trip auto-suspends | If carrier does not confirm 2h check-in |
| Trip deprioritised | If carrier does not confirm 24h check-in |
| Item photo required | For all bulky and "Other" category items at booking |
| Access questions mandatory | Before matching (wizard Screen D) |
| Structured pricing only | No freeform price text fields |
| Customer request blocked | If key details are missing (route, item, timing, access) |
| Stale supply removed | Trips past their date auto-expire |
| Low-rating review | Carrier rating below 3.0 after 5+ trips triggers manual review |

---

## 15. Product Principles for Revamping the Current Project

### 15.1 What the Existing Product Must STOP Doing

1. **Stop showing trip listings as the primary homepage.** The homepage is a need-declaration entry point.
2. **Stop exposing raw capacity data to customers.** No cubic metres. No dimensions. Customers see categories, fit labels, and photos.
3. **Stop treating all carriers identically.** The carrier home must be state-aware.
4. **Stop allowing booking without structured item and access information.** Photo, floor level, stairs, and helper availability must be collected before matching.
5. **Stop treating onboarding as a single long form.** It must be a stepped, resumable activation flow.
6. **Stop hiding match quality behind opaque ranking.** Every result must explain WHY it matches.
7. **Stop allowing ambiguous pricing.** No mixing hourly and flat rates. No "starting from." The price is the price.
8. **Stop treating empty results as a dead end.** Every zero-match state must trigger Alert the Network.
9. **Stop letting carrier dashboard be a static analytics surface.** It is a work queue.

### 15.2 What Must Be Simplified

1. **Search results:** Remove multi-dimensional sorting and filtering. Default "Best fit." Explain matches.
2. **Booking form:** Progressive disclosure. One decision per screen. Pre-fill from wizard data.
3. **Carrier trip posting:** Quick-post path for repeat corridors in under 30 seconds.
4. **Carrier dashboard:** Replace with state-aware home.
5. **Pricing:** Remove all freeform pricing inputs. Structured tables only.
6. **Communication:** Replace open chat default with structured status updates.

### 15.3 New Governing Principles

1. **Need before inventory.** Do not show supply before the system understands the move.
2. **Answer, not archive.** Results are the system's best answer, not a warehouse of options.
3. **Explain every match.** "Why this matches" is mandatory on every result card.
4. **Absorb complexity.** The system does the logistical math so the customer never has to.
5. **Structured trust beats vague reassurance.** Trust comes from verification, constraints, proof, and payout clarity — not badges alone.
6. **Bad-fit prevention is a core product job.** Hidden stairs, misdescribed items, and weak constraint rules are not edge cases. They are the most dangerous failure modes.
7. **Sparse supply must still feel alive.** Alert the Network and founder-assisted fulfilment, not dead-end emptiness.
8. **Carrier home is a work queue.** Show what matters next, not vanity metrics.
9. **Reposting is the growth mechanic.** Templates and repeat corridors are core retention, not side features.
10. **No negotiation gravity.** Every design decision must resist sliding into a quote board.
11. **Maps explain; they do not lead.** Visual route context is secondary to structured match explanation.
12. **State discipline is product quality.** Validation, expiry, proof, freshness checks, and activation rules are product features, not backend housekeeping.
13. **One screen, one question.** Mobile flows are linear with progressive disclosure.
14. **Price on every card.** Total, all-in, deterministic.

---

## 16. Final Recommendation

### What We Are Building

A need-first, match-ranked spare-capacity logistics marketplace where customers declare a specific move need and the system returns a confidence-ranked shortlist of verified, route-compatible carriers with deterministic all-in pricing, fit-confidence labels, and trust signals. Carriers post trips they are already taking, set structured pricing with access-based add-ons, and accept or decline pre-packaged booking requests. The platform handles matching, trust enforcement, escrowed payment, proof-of-delivery, and payout release.

### Why This Is the Right Product Direction

1. **It reduces customer uncertainty the fastest.** The need-first wizard with access questions means every result shown is pre-filtered for feasibility. The customer never performs route math, capacity estimation, or trust assessment from scratch. The system does it.

2. **It works under sparse supply.** Fast Match reduces latency when few carriers are available. Alert the Network captures demand and activates supply. Concierge Offer allows founder manual fulfilment inside the system. There is no dead end.

3. **It avoids the negotiation trap.** Deterministic pricing with structured add-ons eliminates quote loops. The single structured adjustment handles genuine real-world mismatches without opening a bargaining channel.

4. **It respects both sides' cognitive reality.** Customers are uncertain and stressed: the product narrows ambiguity fast. Carriers are busy and operational: the product packages decisions as tappable cards.

5. **It scales without a conceptual rebuild.** The need-first, match-ranked model works at 50 carriers and at 50,000. The browse layer can be added on top when supply density justifies it. The matching algorithm improves with more data. The core interaction model does not change.

### What Must Be True for This to Work

1. **Supply must be bootstrapped manually.** The founder must personally onboard the first 50–100 carriers. Concierge fulfilment is part of the operating model, not a failure mode.
2. **Carrier activation quality must be enforced.** The verification gate must not be softened under pressure to increase supply numbers. Trust compounds. One bad experience destroys it.
3. **The no-match experience must be excellent.** Alert the Network is the primary conversion mechanism during the first year.
4. **Pricing must be transparent from the first result card.** Total, all-in, deterministic. No surprises.
5. **Bad-fit prevention must work upstream.** Structured access questions + carrier constraints + mandatory photos catch mismatches before they become on-site disasters.

### The Question You Did Not Ask (But Must Be Treated as Binding)

**Where does Moverrr draw the line between "platform-only marketplace" and "implicitly operating the service"?**

Moverrr must remain a coordination and transaction layer. It does not employ drivers, set routes, or dispatch vehicles. But it must still own the trust system (verification, proof, payouts, dispute resolution). Founder concierge fulfilment is allowed in MVP only if it routes through the same system entities (ConciergeOffer → carrier activation → in-app booking → in-app payout) and does not create off-platform fulfilment paths that break data integrity.

---

## 17. Execution-Critical Decisions / Binding Product Rules

### Chosen Model

Need-first wizard → match-ranked shortlist with explanations → Request-to-Book (default) + Fast Match (up to 3) → carrier accept/decline → escrowed payment → structured coordination → proof-of-delivery → payout release.

### Rejected Alternatives (Explicit)

- Browse-first inventory feed as the primary experience.
- Map-first discovery as the primary interface.
- Airtasker-style open bidding / quote marketplace.
- Customer multi-carrier proposal wars with pick-the-best-bid.
- Algorithmic route dictatorship (platform dispatching carriers like an employer).
- Customer-entered cubic metres or dimension-heavy logistics workflow.
- Counter-proposal loops on base price.
- Generic courier-style deterministic booking (supply is heterogeneous, not commoditised).
- Enterprise freight/load-board complexity.

### Non-Negotiable Product Rules

| Rule | Rationale |
|------|-----------|
| No supply shown before intent is captured | Need-first is the core interaction model |
| No cubic metres in the customer UI | Customers do not reason in cubic metres |
| No freeform pricing | Deterministic pricing eliminates quote friction |
| No unverified carriers in results or accepting bookings | Trust gate protects demand-side experience |
| No open-ended negotiation loops | One structured adjustment max; no counter-proposals |
| No-match always becomes Alert the Network | Dead-end abandonment is existential |
| Proof-of-delivery required for payout release | Trust and dispute protection |
| Carrier UX is state-aware and action-led | Work queue, not analytics dashboard |
| Templates and quick-repost are first-class | Retention engine, not a feature |
| Access rules are structured fields, not free text | Bad-fit prevention is a core product job |
| "Why this matches" on every result card | Explain match quality; never just list supply |
| Total price on every card, including all fees and GST | Transparency before commitment |
| Maps explain; they do not lead | Route context is secondary to match explanation |
| Trip freshness check-ins are mandatory | Stale supply destroys trust |

### Assumptions Treated as Fixed for MVP

- Sparse supply is the default operating reality.
- Customers will misdescribe items sometimes; the UX must defensively constrain and verify.
- Carriers cannot safely handle message-heavy flows while driving.
- Deterministic pricing is necessary to avoid quote friction and trust collapse.
- Many moves will be flexible on timing within a date range.
- Founder manual fulfilment via Concierge Offer is part of the MVP operating model.
- Repeat corridors are the most valuable supply pattern.
- Trust is won through structure, not copywriting.

### Areas Intentionally Deferred from MVP

- Written review display (collect data now).
- Real-time tracking as a centrepiece feature.
- Complex insurance/coverage products.
- Fleet tools, dispatching, route optimisation.
- Deep provider storefronts and catalogues.
- Multi-round negotiation and bespoke quoting.
- Phone masking / telephony integrations (if costly).
- Advanced carrier analytics beyond earnings and completion rate.
- SMB/business dedicated account UI.
- Secondary corridor browse/explore layer.

### Decisions That Must NOT Be Re-Litigated During Implementation

- Need-first vs browse-first. **Decided: need-first.**
- Fixed/deterministic price vs negotiation. **Decided: deterministic.**
- Request-to-Book + Fast Match vs quote board. **Decided: Request-to-Book + Fast Match.**
- Verification gate before acceptance. **Decided: mandatory.**
- Alert-based no-match recovery vs dead-end. **Decided: Alert the Network.**
- State-aware carrier home vs static dashboard. **Decided: state-aware.**
- Maps as secondary vs maps as primary. **Decided: secondary.**
- Structured item taxonomy vs freeform text. **Decided: structured.**
- Structured access questions vs notes field. **Decided: structured.**
- Total price on every card. **Decided: mandatory.**
- "Why this matches" on every card. **Decided: mandatory.**
- One structured adjustment vs open counter-proposals. **Decided: one structured adjustment.**

---

**This document is the governing source of truth for the Moverrr product system. Downstream implementation agents must optimise within these decisions, not reopen them. Where this document is silent, the default is: choose the simpler option that reduces customer uncertainty and carrier operational burden.**
