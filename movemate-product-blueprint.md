# Movemate — Product & UX System Blueprint

**Version:** 2.0 (revision of the Moverrr blueprint, integrating the Movemate design system)
**Status:** Binding
**Supersedes:** `moverrr-governing-product-blueprint.md`
**Audience:** Founders, product, design, engineers, and any AI coding agent contributing to the codebase

This document is the single governing source of truth for the product. It integrates the strongest product logic from the previous Moverrr blueprint with the new Movemate visual and interaction design. Where the two conflict, this document resolves. Where either was weak, this document improves. Where the previous document was authoritative, it is preserved.

> Downstream implementers must optimise within these decisions, not reopen them. Where this document is silent, default to: *the simpler option that reduces customer uncertainty and carrier operational burden*.

---

## 1. Executive Decision

**Movemate is a need-first, match-ranked spare-capacity logistics marketplace for medium-to-large items.** The customer declares one specific need. The system returns a short, confidence-ranked list of bookable, route-compatible driver offers with deterministic all-in pricing, fit-confidence labels, and trust signals. The driver posts trips they are already taking, sets structured pricing, and accepts or declines requests through a clean decision card.

**What Movemate is:** A platform-only matching, coordination, trust, and transaction layer. Movemate does not operate logistics, own vehicles, or employ drivers.

**What Movemate is not:** not a browse-first catalogue; not a bid board; not a map-first explorer; not a removalist operating platform; not a parcel courier; not a classifieds site.

**The interaction model that wins:**

> Need declared → ranked shortlist with explanations → Request-to-Book (or Fast Match) → driver accepts → escrowed payment → structured coordination → proof-of-delivery → payout release.

**Core UX principle:** Movemate is a constraint-matching system that returns a confident verdict, not a listing marketplace that asks users to interpret logistics complexity. The product absorbs complexity so customers never think like dispatchers and drivers never think like call centres.

**Brand positioning (from the design system):** *Calm, plain, trustworthy. A premium service, not a marketplace. We speak plainly, show one action at a time, and earn the tap.*

**FIXED. Do not re-litigate.**

---

## 2. Product Thesis

Movemate solves a specific market failure: abundant spare transport capacity moves through Australian corridors every day — partially empty vans, utes, and trucks — but it is inaccessible to normal users because discovery, trust, pricing, and coordination are broken.

The customer is not buying transport inventory in the abstract. They are buying **confidence that one awkward object can be moved from A to B safely, affordably, and with minimal coordination**. Their baseline emotional state is low-grade uncertainty stacked in three layers: feasibility, cost, trust.

The driver is not building a logistics empire. They are monetising sunk costs — fuel, tolls, lease, time — on journeys already committed. Their baseline need is **zero-friction supplementary revenue without route chaos, bad-fit work, or payout uncertainty**.

Movemate replaces the high-friction, low-trust, negotiation-heavy informal economy (Marketplace "man with a van" posts, Airtasker quote loops, ad-hoc WhatsApp coordination) with a structured, verified, deterministic-price marketplace that creates value from capacity currently going to waste.

The thesis depends on three conditions:

1. **Supply exists.** It does. Informal movers, removalists with partial loads, tradies with empty utes, interstate operators with empty return legs, and SMBs with recurring runs are abundant across Australian corridors.
2. **Trust can be established.** Solvable through verification gates, structured item descriptions, proof-of-delivery, and payment protection.
3. **Matching works under sparse supply.** Solvable through demand capture (Alert the Network), founder-led manual fulfilment (Concierge Offer), and Fast Match.

---

## 3. Core User Truths

### 3.1 Customer

They are trying to move one specific thing from A to B, under uncertainty, without becoming a logistics coordinator. They fear bad-fit bookings, hidden price escalation, unreliability, damage, ghosting, and the admin cost of messaging five strangers.

They need answers in this strict order:

1. **Feasibility** — can this work for my item and my route?
2. **Cost and timing** — roughly when and roughly how much, all-in?
3. **Trust** — can I trust this driver and this platform?
4. **Confirmation** — what details do I need to lock in?

If the product reverses this order — showing supply before feasibility — the customer is forced to translate their own need into route logic before the system has. That causes abandonment.

### 3.2 Driver

They are monetising movement already happening. They fear bad-fit work (misdescribed items, undisclosed stairs, two-person lifts they cannot do alone, items that physically do not fit), route chaos, admin burden, and payout uncertainty. They also face a real safety constraint: Australian road rules prohibit mobile phone use while driving. Message-heavy flows are not just annoying — they are non-compliant.

They need: only relevant pre-filtered requests; clear fit/access data on every request; fast accept/decline decisions packaged as cards; predictable payouts tied to proof-of-delivery; fast repeat posting for recurring corridors.

**Design implication:** Customer UX and driver UX are not symmetric. Customers need *uncertainty reduction in selection*. Drivers need *uncertainty reduction in operations*. Do not mirror them.

---

## 4. Final Marketplace Model

### 4.1 Chosen Model — FIXED

Need-first, match-ranked, browse-assisted. The customer creates a Move Request via a short guided flow (item + route + timing + access). The system matches against posted Trips and returns a confidence-ranked shortlist with explanations. The customer chooses:

- **Request-to-Book** (single driver, default), or
- **Fast Match** (up to 3 drivers; first to accept wins, all siblings atomically revoked).

The driver accepts or declines via a structured decision card. No open-ended negotiation. One structured adjustment is permitted when declared conditions genuinely conflict with reality (Section 9.4).

### 4.2 Why This Wins

- Reduces customer uncertainty the fastest — feasibility is confirmed within seconds.
- Works under sparse supply — Fast Match cuts latency; Alert the Network captures demand; Concierge Offer closes the gap.
- Avoids the negotiation trap — deterministic pricing kills quote loops.
- Respects driver reality — decisions arrive as tappable cards, not inbox chaos.
- Scales without rebuild — the need-first, match-ranked model works at 50 drivers and at 50,000.

### 4.3 What Is Rejected (Do Not Re-Litigate)

- Browse-first inventory as the primary experience.
- Map-first discovery as the primary surface.
- Open bidding / Airtasker-style quote board.
- Multi-round price negotiation or counter-proposals on base price.
- Auto-dispatch / Uber-style real-time matching.
- Customer-entered cubic metres or dimension-heavy input.
- "Starting from" price ranges.

### 4.4 What Is Out of Scope for MVP

Secondary corridor browse layer; multi-leg trip chaining beyond 2 waypoints; real-time in-transit tracking as a centrepiece; deep driver analytics; phone masking (cost-dependent); insurance underwriting; enterprise freight tools; SMB dedicated UI.

---

## 5. Visual & Interaction System

This is the design foundation. All screens obey it. Deviations need explicit justification.

### 5.1 Brand Voice

**Calm, plain, trustworthy.** We use fewer words, shorter sentences, plain English. We show one action at a time. We earn the tap. We never shout. We never use marketing language where operational language would do.

Examples:
- **Good:** "What needs to move?" / "Daniel is on the way to you." / "Nothing is charged until a driver accepts."
- **Bad:** "Find the perfect ride for your stuff!" / "Our amazing drivers are ready to help."

### 5.2 Colour — Near-Monochrome Paper + Ink, One Clay Accent

| Token | Value | Use |
|-------|-------|-----|
| `paper` | `#F7F6F2` | App background |
| `paperDeep` | `#EFEDE6` | Secondary background behind cards |
| `card` | `#FFFFFF` | Card surfaces |
| `ink` | `#14120F` | Primary text, primary CTA background |
| `ink70 / ink55 / ink40 / ink20 / ink10 / ink06` | Various alphas | Secondary text, hairlines, fills |
| `hairline` | `rgba(20,18,15,0.08)` | Dividers, borders |
| `clay` | `#C9521C` | **Single accent — one focal point per screen** |
| `claySoft` / `clayInk` | Softer variants | Accent pills and accent text |
| `green` / `greenSoft` | `#2D7A3E` / `#E2EEE5` | Delivered, payout released, verified |
| `amber` / `amberSoft` | `#B6791C` / `#F1E6CD` | Access-condition warnings, attention |
| `red` | `#A6321C` | Destructive / dispute |

**Clay discipline.** Clay is the screen's single focal point. If two things on a screen are clay, one is wrong. The primary CTA uses `ink` on `paper` — clay is reserved for things like the destination dot in the Route component, the Fast Match selector, in-transit status, and exceptional callouts.

### 5.3 Type

- **Display:** Instrument Serif (fallback: Iowan Old Style, Georgia). Sizes 28–56 px. Used for one headline per screen.
- **UI/Body:** Inter (weights 400/500/600). 11–22 px.
- **Numeric:** JetBrains Mono (or Inter with `font-variant-numeric: tabular-nums`) for prices, times, codes, small labels.

**One serif headline per screen.** Never stack two. Serifs anchor; they do not decorate.

### 5.4 Shape & Space

- Radii: `r0=6, r1=12, r2=18, r3=24, r4=32`. Cards use `r3`. Primary CTAs use `r4`. Pills are `999` (fully round).
- Spacing is generous. Default horizontal padding 20 px on screens. Card interior padding 14–18 px.
- Hairlines (1 px `ink06`) separate, not borders. Cards have 1 px `hairline` borders.
- Shadows are rare. Elevated cards use a subtle two-layer shadow. Sticky footers get a top hairline, not a shadow.

### 5.5 Iconography

One-weight outlined icons at 1.6 stroke, rounded caps/joins, `currentColor`. No dual-tone icons. No filled/outlined mixing. Icons are never decorative — they always carry meaning.

### 5.6 Component Primitives (canonical names)

`Screen`, `Nav`, `Card`, `KV` (label/value row), `Pill` (neutral/outline/clay/green/amber/dark), `Primary`, `Secondary`, `Route` (A→B block with ink pickup dot + clay drop-off dot), `Avatar` (ink/clay/soft tones — never photo-filled), `Icon`.

Signature components: the **Route** block (timeline rail with ink dot → clay dot) and the **serif headline + subline** opener. These are the visual signature of the product.

### 5.7 Carrier Surface — Reversal of the Previous Direction

The prior design placed driver screens on a dark ink background. **This blueprint flips that decision.** Driver screens use the same paper surface as the customer side. Differentiation is achieved through:

1. A persistent `Driver` chrome — small ink pill top-right, showing role context on every driver screen.
2. Higher information density — tighter list rhythm, smaller avatars, more operational metadata per card.
3. A different icon weight (1.8 instead of 1.6) and slightly smaller headline sizes for driver screens.
4. An **optional Night Mode** — user-toggleable, or automatically applied between sunset and sunrise based on device time — that flips to ink-background. This replaces the always-dark surface.

**Why flipped (briefly):** Australian outdoor sunlight readability on dark UI is poor. The prior design already inverted to paper for active stops and the payout card, which proved dark failed in action-dense regions. Brand voice ("calm, plain, trustworthy") is a paper-ink system. Coherence wins; differentiation comes from density and role chrome, not colour inversion.

---

## 6. Customer Experience Architecture

### 6.1 Home — The Anti-Marketplace

Home has one job: get the customer into the need-declaration flow.

**Composition:**

- Top: wordmark + avatar icon.
- Hero: one serif question — *"What needs to move?"* — with a subline: *"Tell us once. We'll match you with a driver already going that way."*
- **The Search Block** — a single elevated card containing two pill-style fields: `From — suburb or address` (ink-outlined dot) and `To` (clay-filled dot). This is the wizard's entry point; tapping it opens the declaration flow.
- Below: "Start from" — three suggested presets (*A sofa or armchair* / *A fridge or large appliance* / *A marketplace pickup*). Each is a one-line card with indicative price hint ("From around $65 in metro"). Tapping prefills the item step.
- At the very bottom, understated: *"Have spare space in your van? Drive with Movemate"*.

**What is NOT on home:**
- No featured trips. No map. No categories. No driver profiles. No inventory.

### 6.2 Declare — Single Scroll, Not Four Screens

**Revision from the previous blueprint.** The old wizard split route / item / timing / access across 4 screens. The new design collapses this into **one progressive-disclosure scroll**, which is genuinely better UX. Adopted.

Structure:

- **Route** — collapsed/confirmed at the top once set. Uses the `Route` component.
- **What's moving** — a 2×3 grid of category cards (Sofa, Bed, Fridge, Boxes, Desk, Other). Tap to select (inverts to ink fill). Selected category reveals an inline **variant card** (e.g., 2-seater / 3-seater / Modular / L-shape for sofa).
- **When** — two-row card: a dated row ("Sat 26 Apr — AM/Midday/PM") and a "Flexible within a week" toggle.
- **Access & Handling** — the last section, mandatory before continuing. Structured toggles:
  - Stairs at pickup / drop-off (None / 1–2 / 3+)
  - Lift available (Yes / No)
  - Help available (Yes / No)
  - Parking difficulty (Easy / Unsure / Difficult)

Sticky footer: `Continue — access details` → `Find drivers`.

**Why access is collected here, not at booking:** access data feeds the matching engine's eligibility filter. If the customer says "3rd floor, no lift, no help" the system removes drivers with "ground floor only" constraints from results. The customer never sees incompatible drivers. This is the primary defence against the Ghost Dimension failure mode (Section 11.4).

### 6.3 Matches — A Verdict, Not a List

The match results page is a ranked verdict, not a filterable catalogue. No user-facing sort. No filters. Default is "Best fit."

**Composition:**

- Serif headline: *"3 drivers going your way"*. Subline: *"Newtown → Bondi Beach · Sat 26 Apr · 3-seater sofa · 2nd floor pickup"*.
- 3–5 match cards. Each card contains:
  - Avatar + first name + last initial + verified tick.
  - Vehicle + trips + rating — single line, muted.
  - All-in price (right-aligned, tabular numerics) + "all in" label.
  - **Why-this-matches pill** in a deep-paper strip — *"Direct route on your day"* / *"Small pickup detour (~2 km)"* / *"Near your drop-off (~3 km)"*. **Mandatory on every card.**
  - Fit pill (`Likely fits` / `Review photos` / `Needs approval`) + Verified pill.
- Collapsed row below results: *"2 more available Sun–Mon"* with disclosure chevron.
- Footer: explicit Fast Match instruction — *"Tap a driver to book. Or pick up to 3 — first one to accept wins."* A checkbox mode on each card lets the customer select up to 3 for Fast Match. (This is more explicit than the design's subtle footer line; making it explicit is deliberate — the previous blueprint flagged Fast Match as a named feature and it needs clear affordance.)

**What is NOT on a match card:** cubic metres, detailed maps, raw scores, driver bios, "starting from" ranges, per-kilometre numbers. The price is the price.

**Zero results handling** — see Section 10.

### 6.4 Offer Detail — Why This Specific Option Is Safe

The detail page answers *"why is this specific option safe and sensible for my move?"*. Composition, top to bottom:

1. Driver identity: avatar + name + verification tick + "Carrier since Aug 2024 · 72 trips".
2. **Trust ribbon** — a 3-column card: ID checked / Rating / Replies (< 2 hr). Each column: icon + value + label. This is a Movemate-specific pattern; use it wherever a driver is being evaluated.
3. Route card using the `Route` component + "Direct route match — no detour for Daniel" explanatory line.
4. Vehicle card — vehicle type icon + make/model + fit line ("Fits a 3-seater sofa comfortably") + outlined pills for constraints ("Stairs OK up to 3 flights", "2-person lift").
5. Price breakdown card using `KV` rows: Base, Stairs, Platform fee, GST, Total. Below total, one line of context: *"Lower than a dedicated removalist because Daniel is already driving this route on Saturday."*
6. Policy line (muted, small): *"Payment is authorised now, charged only when Daniel accepts. Free to cancel until accepted."*

**Sticky footer:** Primary CTA `Request Daniel — $88.03`. To its left, a square `+` button to add this driver to a Fast Match group instead.

### 6.5 Booking Confirm & Pay

Progressive disclosure confirmation:

1. **Moving with** card — driver mini-profile + "Change".
2. **Exact addresses** — expand suburb to street-level; both addresses editable inline.
3. **Photo of item** — mandatory for bulky categories, recommended otherwise. Tap to add via camera or library.
4. **Price** card — condensed KV breakdown + total.
5. **Payment method** — Apple Pay / card / Stripe. One tap changes.
6. Primary CTA: `Authorise $88.03`. Fine print: *"Charged when Daniel accepts. Released if he declines."*

**Payment discipline:** authorised on request submission → captured only on driver acceptance → held until delivery confirmation → released on customer confirm OR 72-hour auto-release if proof exists and no dispute.

### 6.6 Track — Timeline, Not Chat

After acceptance, the customer sees a status screen:

- Pill + serif headline: `In transit` / *"Daniel is on the way to you."*
- ETA subline: *"ETA 10:42 — about 18 min away"*.
- Driver bar: avatar + name + vehicle + rego. Two round icon buttons: call (disabled or routed through platform at MVP) and chat.
- Timeline card: `Request accepted` → `On the way to pickup` → `Item loaded` → `On the way to you` (active, clay dot) → `Delivered` → `You confirm receipt`. Each step has a timestamp.
- Item summary card (one line).
- Bottom sheet of **quick replies** — horizontally scrollable pills: *"Running 5 min late"*, *"Gate code is 1942"*, *"I'm at the door"*, *"Call me"*.

**Free-text chat is available** but de-emphasised. The UI nudges structured communication to keep drivers safe.

### 6.7 Delivered — Confirm & Rate

- Green check icon, serif: *"Delivered. All good?"*.
- Proof photo with a monospace stamp overlay: *"10:41 am · 62 Curlewis St"* and a muted line *"GPS + timestamp verified"*.
- Rating card: 5 stars + optional tag pills ("On time", "Careful with item", "Friendly").
- Primary: `Confirm receipt — release payment`.
- Secondary: *"Something wrong? Open a dispute"*.

---

## 7. Driver Experience Architecture

### 7.1 Acquisition

A single outcome-led landing page (accessed via the "Drive with Movemate" link on customer home):

- Persistent "Driver" chrome top-right.
- Serif: *"Turn the road you're already on into income."*
- Subline: *"Post the trip you're already taking. We send you clean, matched jobs along your route — fixed price, no bidding."*
- Three numbered value props: Fixed price per job / Real jobs, not pings / Paid fast.
- Primary CTA: `Start driver setup`. Below: *"Manually reviewed · typically within 24 hr."*

### 7.2 Signup (Account Creation)

Deliberately frictionless. Collects only: full name, email, phone, password. The driver now has an account and can see the platform. **They cannot post trips or accept bookings until activation is approved.**

### 7.3 Activation — The Hard Gate

Three-step flow with saved progress and a clear "resume later" affordance:

**Step 1 — Identity**
- Legal name confirmation.
- Driver's licence upload, automated verification via Stripe Identity (or equivalent).
- ABN (optional — displayed as a trust signal, not a gate).

**Step 2 — Vehicle & Capacity**
- Vehicle type (Ute / Van / Small Truck / Large Truck, with reference imagery).
- Registration.
- Exterior photo showing cargo area (mandatory, min 1).
- Typical available space (Quarter / Half / Mostly / Completely empty).
- Accepted item categories (checkbox).
- Structured constraints:
  - Ground floor only (Y/N)
  - Single-person lift only (Y/N)
  - Stairs OK — up to N flights (1 / 2 / 3+)
  - Max single-item length (1m / 1.5m / 2m / 2.5m / 3m+, optional)
  - Fragile items accepted (Y/N)

**Step 3 — Payout & Documents**
- Stripe Connect setup (required — gate).
- Insurance certificate upload (optional trust badge, not gate).
- Submit for review.

**Review is manual at MVP.** Founder reviews each submission. Target turnaround 24 hours. Driver is notified on approval or rejection with specific reasons.

**Teaser demand for unactivated drivers.** An unactivated driver who logs in sees a blurred demand summary: *"There are 6 pending requests on routes near Western Sydney this week worth ~$580."* CTA: `Complete your setup to unlock these jobs`. The number must be computed from real data; never fabricated.

### 7.4 Driver Home — State-Aware Command Centre

Not a static dashboard. Three modes.

**Mode 1 — Activation (unverified / incomplete)**
- Amber pill "2 of 3 steps done".
- Serif: *"You're one step from unlocking jobs."*
- Progress track: three rows (Identity / Vehicle / Payout — Stripe Connect), each with check or chevron.
- Blurred teaser demand panel at the bottom: *"Waiting for drivers like you"* with 2 corridor teasers and a mask: *"Finish setup to see real jobs."*
- Primary: `Resume setup`.

**Mode 2 — Ready to Post (verified, no active trips)**
- Green verified pill.
- Serif: *"Post your next route."*
- Subline: *"You have 2 saved routes. One-tap repost."*
- Saved routes list — for each template: origin → destination + "Last posted X days ago" + **demand signal in clay** ("3 customers waiting") + round `Repost` button.
- Demand panel: *"Demand this week"* — featured corridor card ("Inner West → Beaches · 11 customers looking for moves this week. Average payout $89").
- Primary: `+ Post a new trip`.

**Mode 3 — Active Operations (has trips/requests)**
- Hero is the single most urgent item, in this priority:
  1. Pending request (→ decision card)
  2. Trip today (→ Runsheet view)
  3. Proof needed (→ upload CTA)
  4. Payout blocked (→ unblock CTA)
- Below the hero: compact list of upcoming trips with state badges.

### 7.5 Trip Posting

Two modes.

**Quick Post** — from a saved template or a completed trip. Confirm/adjust route, date, time window, capacity, pricing. Publish. Target: under 30 seconds.

**Advanced Post** — full wizard:
1. **Route** — start + end via Places Autocomplete; up to 2 optional waypoints; optional "Return trip available" toggle.
2. **Schedule** — date + time window; optional "This is a regular run" with frequency.
3. **Vehicle & capacity** — select vehicle; space descriptor; accepted categories; constraint toggles.
4. **Detour & pricing** — max detour km/min; base price per category; predefined add-ons (stairs, helper); optional detour rate.
5. **Review & publish** (or save as draft).

**Hard requirements to publish:** vehicle photo ≥1; route defined; date + window; ≥1 accepted category; pricing set for every accepted category; stairs/helper policy set.

**Templates** auto-generate from a published trip. They are a first-class view in the Trips tab, not buried in settings.

**Recurring trips** auto-generate future listings up to 4 weeks ahead.

### 7.6 Decision Card — The Moment of Truth

When a request lands, the driver sees a structured decision card. Composition:

- Top bar: close icon + amber countdown pill (*"11 hr 48 min to respond"*).
- Label: *"New request"*.
- Serif: *"Abbie wants to move a 3-seater sofa."*
- **Route panel** — ink pickup dot → clay drop-off dot on the timeline rail, each row with detour annotation ("Newtown pickup — 3 km off your route · ~8 min detour" / "Bondi Beach drop-off — On your route").
- **Access notes in amber-tinted card** — a mandatory pattern. Any non-trivial access detail (stairs, no lift, helper needed, difficult parking) is surfaced here, never buried. Example: *"Pickup is 2 flights of stairs, no lift. Drop-off is ground floor. Customer will help lift."*
- **Item row** — photo thumbnail + category/variant + quantity + customer notes.
- **Payout card (inverted — card on paper even on driver night-mode)** — *"Your payout: $62 base + $12 stairs · paid to Stripe"* + `$74` in large tabular numerics.
- **Customer trust strip** — avatar + name + verification + completed-moves + rating.

**Footer:**
- Primary: `Accept — $74`
- Secondary row: `Decline` | `Clarify`

`Clarify` opens a single-round structured clarification flow with predefined reasons only ("Photo shows a different item than the selected category" / "Address needs confirmation" / "Stairs detail unclear"). **Not a negotiation channel.** One round only. Driver gets the customer's response, then accepts or declines.

### 7.7 Runsheet — Trip-Day Operations

On the day of a trip, Driver Home becomes the Runsheet.

- Label: *"Today · Sat 26 Apr"* → Serif: *"3 stops · 2 jobs."*
- Green-tinted payout banner at the top: *"$74 unlocks when you upload proof at stop 3."*
- Stops listed in route order. Each stop card shows state:
  - **Done** — muted, reduced weight, timestamp shown.
  - **Active** — **inverted: white-paper card with ink text, clay accents, two inline CTAs: `Navigate` (opens Maps/Waze externally) + `I've arrived` (ink-filled).** This inversion is intentional — the active stop must dominate the screen in daylight.
  - **Upcoming** — paper card, muted copy.
- Amber note inline for detour acknowledgments ("8 min detour accepted").
- Footer actions: `Condition issue` + `Upload proof` (clay when active).

### 7.8 Proof of Delivery & Payout

- On "Delivered" → mandatory photo upload (min 1, auto-timestamped, GPS-tagged by the app).
- Customer notified to confirm.
- Customer confirms → payout released to Stripe Connect.
- No confirm + no dispute within 72 hours → auto-release on proof.
- Dispute → payout blocked → founder adjudicates.

Driver sees payouts in a dedicated tab: pending / processing / paid; each entry with breakdown (gross, platform fee, GST, net) and any blocker.

### 7.9 Trip Freshness — Mandatory Check-ins

- **24 hours before trip:** push notification asking confirmation of space. No response → trip flagged "unconfirmed" and deprioritised in ranking.
- **2 hours before trip:** confirm still on. No response → trip auto-suspended, affected customers notified: *"Your driver hasn't confirmed. We're finding alternatives."*

Repeated failures degrade the driver's trust score and reduce future match opportunities.

---

## 8. Matching and Route Logic

### 8.1 Model

The platform makes strong relevance judgments (ranking + eligibility filters) but does not pretend to optimise real-world routes beyond basic detour estimation. The driver retains final accept/decline authority.

### 8.2 Eligibility (Hard Filters)

A Trip is excluded if ANY fail:

1. **Category gate** — driver does not accept the item category.
2. **Constraint gate** — customer access conditions conflict with driver constraints (e.g., "3rd floor, no lift" vs "ground floor only").
3. **Timing gate** — trip date is outside customer's acceptable window.
4. **Proximity gate** — pickup or drop-off is beyond the driver's maximum detour tolerance.

These are binary. A failed trip never appears in results.

### 8.3 Corridor & Radius

Corridor is defined as the trip's route polyline + tolerance radius. For each candidate trip, compute shortest distance from customer's pickup point to the route polyline (same for drop-off).

Default tolerance bands (driver-configurable within bounds):

| Route type | Length | Default corridor | Max endpoint |
|---|---|---|---|
| Local/metro | ≤ 40 km | 5 km | 8 km |
| Regional | 41–150 km | 10 km | 15 km |
| Intercity | > 150 km | 20 km | 25 km |

### 8.4 Detour Estimation

For each eligible trip, compute:
1. Base route duration and distance (from the stored polyline).
2. Route with pickup and drop-off inserted via Google Maps Directions API (for selected top candidates).
3. Detour delta in km and minutes.

Customer sees the route-fit label. Driver sees the km/min delta on the decision card. The platform does not calculate fuel costs or make time-value trade-offs — that is the driver's judgment.

### 8.5 Partial Route Matches

Shown only if the uncovered portion is < 30% of the customer's total route distance AND the driver's detour tolerance is not exceeded. Labelled clearly: *"Covers your pickup area. Drop-off is 15 km beyond this driver's listed route."* Displayed in the "Possible matches (needs approval)" section below strong matches.

### 8.6 Ranking

Weighted score of: Route-fit (30%) + Time-fit (25%) + Fit-confidence (20%) + Trust (15%) + Price (10%). Price is a tiebreaker, not a primary sort — this prevents commoditisation to the cheapest driver.

### 8.7 Match Classification

Every result gets a `match_class` generated deterministically:

| match_class | Condition | Customer-facing label |
|---|---|---|
| `direct` | Both points ≤ 2 km from route, exact date | "Direct route on your day" |
| `near_pickup` | Pickup 2–8 km from route, drop-off ≤ 2 km | "Small pickup detour (~X km)" |
| `near_dropoff` | Pickup ≤ 2 km, drop-off 2–8 km from route | "Near your drop-off (~X km)" |
| `minor_detour` | Both points 2–8 km from route | "Small detour required" |
| `nearby_date` | Direct route, 1–7 days offset | "Available [N] days [before/after]" |
| `partial_route` | Route covers < 100% of customer journey | "Covers [X]% of your route" |
| `needs_approval` | Detour > 8 km or low fit confidence | "Possible match — needs approval" |

The "why-this-matches" string on each card is templated from match_class + detour data. Deterministic, not generated.

---

## 9. Pricing, Negotiation, and the Structured Adjustment

### 9.1 Model — Deterministic

Carrier-set base rates + structured add-ons + platform fee + GST. No bidding, no counter-proposals, no freeform pricing. One structured adjustment path for genuine mismatches only.

### 9.2 Formula

```
base       = driver_pricing[category][variant]
add_ons    = sum of:
               stairs_surcharge = driver_stairs_rate × (pickup_flights + dropoff_flights)
               helper_surcharge = driver_helper_rate if helper_required
detour_adj = driver_detour_rate × max(0, detour_km - included_tolerance)
subtotal   = (base × quantity) + add_ons + detour_adj
platform   = subtotal × 0.15
gst        = (subtotal + platform) × 0.10
total      = subtotal + platform + gst
payout     = subtotal    # platform fee and GST withheld at settlement
```

### 9.3 Display Rule — Total Price on Every Card

Every card the customer ever sees (match result, offer detail, booking confirmation, tracking screen, dispute flow) shows the total all-in price. The breakdown is shown on detail and confirm screens. Never "starting from". Never hourly + flat mixed.

### 9.4 The Structured Adjustment — One Exception

Situation: driver arrives at pickup, conditions don't match reality. Sofa is on 3rd floor instead of declared ground. Item is materially larger than the selected variant.

Mechanism:

1. Driver taps `Condition issue` on the runsheet.
2. Driver selects a reason from a fixed dropdown: `Stairs mismatch` / `Helper required` / `Item different to selected tier/variant` / `Extreme parking`.
3. Driver selects an adjustment from predefined amounts (e.g., "+$15 for 2 extra flights"; not free text).
4. Customer receives a push notification with reason and amount.
5. Customer taps `Accept` (price updates, booking continues) or `Reject` (booking cancels under misdescription policy; driver not penalised).
6. **One round. No second adjustment. No counter.**

This is not negotiation. It is a structured repair of a factual mismatch.

---

## 10. No-Match & Demand Capture — "Alert the Network"

Zero-match states are not dead ends. They route into Alert the Network, a core conversion mechanism.

### 10.1 Flow

1. **Before declaring zero:** show near-matches if any exist — same corridor within 7 days, adjacent corridors on requested date, partial routes within tolerance.
2. **If truly zero:** show a single, reassuring screen:
   - Serif: *"No drivers going that way — yet."*
   - Explanation: *"Katoomba → Newcastle on Sat is quiet. We'll alert 38 drivers on similar corridors and let you know the moment one posts."*
   - **What happens card** — three numbered rows: *We alert drivers now* / *You get notified* / *If still nothing in 48 hrs, our team finds a driver for you manually — same price, no premium.*
   - Indicative price card: `$185–$220 · Locked when a driver accepts`.
   - Primary: `Alert the network`.
   - Below: *"Nothing is charged until a driver accepts."*

### 10.2 What Gets Stored & Triggered

An `UnmatchedRequest` entity is created. All verified drivers with saved corridors overlapping the route are notified. The request appears in their opportunities feed. Any new trip published within the 30-day window triggers a re-match check. If no driver responds within SLA (2 hours urgent / 24 hours flexible), an internal operator task is created.

### 10.3 Concierge Offer — Founder Manual Fulfilment

Founder-led fulfilment is an explicit part of the MVP operating model. Mechanism:

1. Founder picks an unmatched request from the operator queue.
2. Founder sources a driver (Airtasker, Marketplace, personal network, or an existing Movemate driver who hasn't posted this corridor).
3. If new: founder walks the driver through activation. Driver must complete activation before accepting.
4. A `ConciergeOffer` entity is created, linked to the `UnmatchedRequest`. Records: request ID, driver ID, proposed price, operator ID.
5. The driver reviews and accepts through the normal booking flow.
6. Customer is notified and confirms through the normal flow.
7. Transaction completes through the platform. Data integrity preserved. No off-platform fulfilment.

### 10.4 The Question You Didn't Ask — When Does Concierge Become a Crutch?

Concierge Offer is a bootstrapping mechanism. It must have explicit tripwires or it becomes a permanent mask on a failing supply model.

**Tripwires (reviewed weekly at MVP):**

- If Concierge fulfilments exceed **30% of completed bookings** on any given corridor in any 4-week window → that corridor is failing on supply; trigger a targeted driver-acquisition push before accepting more demand there.
- If a single operator (founder) spends more than **15 hours/week on Concierge outreach** → supply is structurally under-provisioned; pause new marketing spend until organic supply is bootstrapped.
- If **any corridor crosses 60 days of continuous Concierge dependency**, remove it from the availability surface — don't fake supply that isn't real.
- After the first 500 completed bookings, Concierge-fulfilled share must trend below 15% month-over-month. If it plateaus above 20%, pause expansion.

These are not arbitrary. They are the leading indicators that the product is monetising demand capture faster than it is producing supply — which is the specific failure mode that killed every marketplace that tried founder-led bootstrapping without a discipline layer.

---

## 11. Trust, Verification, and Risk

### 11.1 Platform Trust (What Movemate Does)

- Verified driver identity before live supply.
- Escrowed payment (authorised on request, captured on acceptance, held until delivery confirmation).
- Structured booking records (dispute trail).
- Mandatory proof-of-delivery (photo + GPS + timestamp).
- Cancellation and misdescription policy (explicit, visible at booking).
- Founder-adjudicated disputes at MVP.
- Explicit guarantee: **"If something goes wrong, Movemate will help resolve it."** Coverage: item damage during transit (capped at declared value, default $500), driver no-show after acceptance, significant deviation from agreed service. Funded from platform margin. Adjudicated by founder.

### 11.2 Driver Trust (Customer-Facing Signals)

| Signal | When displayed |
|---|---|
| `Verified` badge | ID verification passed |
| Star rating | After 3+ completed trips with ratings |
| "New on Movemate, verified" | Fewer than 3 ratings |
| Trip count | Always |
| "Carrier since [date]" | Always |
| Review tags ("On time", "Careful handler", "Good communication") | After 3+ ratings with tags |
| `ABN verified` | If confirmed |
| `Insured` | If certificate uploaded |

The **Trust Ribbon** (ID checked / Rating / Replies) on the offer detail page is the canonical trust pattern — use it consistently.

### 11.3 Rating & Review

Both sides rate after delivery confirmation: 1–5 stars + optional tags + optional free text. Written reviews are collected at MVP but **displayed post-MVP** (data gathered now for future display). Before 3 ratings exist, show verification status + trip count only, never "0 stars" or "New".

### 11.4 Ghost Dimension Defence (Layered)

The Ghost Dimension — customers misrepresenting item size, omitting stairs, failing to mention two-person lifts — is the most dangerous failure mode. Defence is layered:

1. **Structured wizard inputs** feed the eligibility filter.
2. **Structured driver constraints** pre-filter results.
3. **System enforcement** — incompatible drivers never appear; neither party ever sees the conflict.
4. **Mandatory photo** for bulky items.
5. **Booking terms** make misdescription a cancellable offence.
6. **Structured Adjustment** handles real-world mismatches without cancellation.

### 11.5 Payout Release Logic

```
Customer submits request        → Payment AUTHORISED (hold)
Driver accepts                  → Payment CHARGED (captured)
Driver delivers + uploads proof → Payout PENDING CONFIRMATION
Customer confirms               → Payout RELEASED
  OR 72 hours pass + no dispute → Payout AUTO-RELEASED on proof
  OR Customer opens dispute     → Payout BLOCKED → Founder adjudicates
```

---

## 12. Information Architecture

### 12.1 Customer (Mobile-First)

Bottom nav, 3 tabs (kept minimal):

1. **Home** — need-declaration entry; after first use, shows recent searches + "New move".
2. **Bookings** — active (with live timeline), past, and pending requests. Alerts (Alert-the-Network items) are nested here as a section, not a separate tab — they are a kind of pending booking.
3. **Account** — profile, payment methods, help, support, cancellation policy, guarantee info.

Search is not a tab. Home is search.

### 12.2 Driver (Mobile-First)

Bottom nav, 4 tabs:

1. **Home** — state-aware command centre (activation / ready / active).
2. **Requests** — pending decision cards with badge count. Separate from Home because pending requests are the highest-urgency queue and must not be buried under trip management.
3. **Trips** — all trips by state: Needs Action / Today / Upcoming / Drafts / Past / Templates.
4. **Account** — profile, vehicle, documents, verification status, service rules, payouts.

(Payouts is surfaced inside Account rather than its own tab — most drivers check payouts less than requests, and the tab count needs to stay at 4.)

### 12.3 Constraints

All flows are linear. No tabs mid-flow. One primary CTA per screen. Cards, not tables. Thumb-zone button placement. Critical actions reachable in ≤ 3 taps. Driver operational actions (Navigate, Arrived, Upload proof) use larger tap targets.

---

## 13. MVP Scope

### 13.1 Must Be Included

**Customer:** need-declaration flow (single scroll); match-ranked verdict with fit + match explanations + deterministic prices; offer detail with trust ribbon and price breakdown; Request-to-Book + Fast Match (up to 3); mandatory photo for bulky items; booking status timeline; push notifications; Alert the Network.

**Driver:** frictionless signup + strict activation gate; Advanced Post + Quick Post from templates; decision cards (accept/decline/clarify); state-aware home (3 modes); runsheet view on trip day; proof-of-delivery capture; payouts view; templates as first-class; 24h + 2h check-ins.

**Trust & System:** deterministic pricing; structured adjustment; polyline-based corridor matching; detour estimation; founder-adjudicated disputes; 72-hour auto-release; Concierge Offer entity; total all-in price everywhere.

### 13.2 Deferred (Post-MVP)

Written review display (collect now); secondary corridor browse; live in-transit tracking as a centrepiece; deep driver analytics; phone masking; insurance marketplace; SMB UI; calendar integration; multi-stop beyond 2 waypoints.

### 13.3 Future-Ready Hooks (Architecture Only)

- `Trip` entity includes `waypoints[]` (MVP UI max 2).
- Item taxonomy is extensible without matching-engine changes.
- `CarrierProfile` has `service_type` (individual/business) — unused in MVP UI.
- `User` supports dual-role (same person customer + carrier).
- Rating records stored individually, not just aggregates.
- `UnmatchedRequest` stores full structured data for future supply-demand analytics.
- Verification levels extensible.
- Recurring patterns stored.

---

## 14. Data Model (Reference)

Unchanged from the previous blueprint in substance. Kept here for consolidated reference.

**Core entities:** `User`, `CustomerProfile`, `CarrierProfile`, `Verification`, `Vehicle`, `TripTemplate`, `Trip`, `MoveRequest`, `Offer`, `BookingRequest`, `Booking`, `ConditionAdjustment`, `Proof`, `UnmatchedRequest`, `ConciergeOffer`, `Rating`, `Notification`.

**Key state machines:**

- **Activation:** `unverified → activation_started → pending_review → active` (can go to `suspended`; review can reject back to `unverified` with reasons).
- **Trip:** `draft → published → in_progress → completed`; can go `published → suspended` (check-in failed), `expired`, or `cancelled`.
- **BookingRequest:** `pending → accepted | declined | expired | revoked | clarification_requested → pending` (one clarification round).
- **Fast Match Group:** `created → broadcast_pending → group_confirmed` (on first accept, atomically revoke siblings) OR `group_failed` → suggest widen dates + Alert the Network.
- **Booking:** `confirmed → pickup_due → picked_up → in_transit → delivered_pending_confirmation → completed` OR `disputed → resolved_carrier | resolved_customer | resolved_split`.
- **Payout:** `held → pending_confirmation → released → paid`, or `blocked` on dispute.
- **UnmatchedRequest:** `active → notified → matched | expired | cancelled`.

**Full field specifications are preserved** from Section 14 of the previous blueprint and should be treated as authoritative.

---

## 15. Governing Principles (Canonical)

These are the principles any contributor — product, design, engineering, AI agent — must internalise. They are binding.

1. **Need before inventory.** Do not show supply before the system understands the move.
2. **Answer, not archive.** Results are the system's verdict, not a warehouse.
3. **Explain every match.** "Why this matches" is mandatory on every result card.
4. **Absorb complexity.** The system does the logistics math. The customer never should.
5. **Structured trust beats vague reassurance.** Trust is verification + constraints + proof + payout clarity — not copy.
6. **Bad-fit prevention is a core product job.** Ghost-dimension scenarios are not edge cases.
7. **Sparse supply must still feel alive.** Alert the Network + Concierge is the MVP conversion engine.
8. **Driver home is a work queue.** Never a dashboard. Never vanity metrics.
9. **Reposting is the retention mechanic.** Templates are first-class.
10. **No negotiation gravity.** Every decision resists sliding into a quote board.
11. **Maps explain; they do not lead.** Route context is secondary to match explanation.
12. **State discipline is product quality.** Validation, expiry, proof, freshness, activation rules are features.
13. **One screen, one question.** Mobile flows are linear and progressive.
14. **Price on every card. All-in. Deterministic.**
15. **One serif, one focal point.** One serif headline per screen. Clay appears once per screen.
16. **Paper-ink first, dark only by opt-in.** Brand coherence wins; carrier differentiation is density and chrome, not colour.

---

## 16. Decisions That Must Not Be Re-Litigated

| Question | Decision |
|---|---|
| Need-first vs browse-first | **Need-first** |
| Fixed price vs negotiation | **Fixed** |
| Request-to-Book vs quote board | **Request-to-Book + Fast Match (up to 3)** |
| Verification gate before acceptance | **Mandatory** |
| Alert-based recovery vs dead-end | **Alert the Network** |
| State-aware driver home vs static | **State-aware** |
| Maps primary vs secondary | **Secondary** |
| Item taxonomy | **Structured categories + variants** |
| Access questions | **Structured, mandatory, at declaration** |
| Total price display | **On every card** |
| "Why this matches" | **Mandatory on every card** |
| Carrier surface | **Paper by default, opt-in/auto dark** |
| Wizard layout | **Single scroll with progressive disclosure** |
| Product name | **Movemate** |

---

**End of blueprint.** Engineering, design, and AI coding agents should read this document first. The companion reference `movemate-design-system-skill.md` provides the dense implementation reference for daily build work.
