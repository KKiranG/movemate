---
name: movemate-design-system
description: Use this skill whenever you are implementing, editing, or reviewing any UI, component, screen, API, or data model for Movemate — a need-first spare-capacity logistics marketplace. This is the canonical reference for design tokens, component patterns, screen structures, copy voice, pricing formula, matching rules, and the product's non-negotiable decisions. Trigger on any change to the web app, mobile app, or backend that touches the user-facing system, including frontend code, backend routes serving the UI, schema changes, and copy edits. Always read this skill before writing or modifying Movemate code.
---

# Movemate Design System & Build Reference

Single reference for anyone (or any agent) implementing Movemate. Read this before writing code. The full product rationale lives in `movemate-product-blueprint.md`; this file is the dense build reference.

## 0. What Movemate Is (One Paragraph)

Movemate is a need-first, match-ranked spare-capacity logistics marketplace. Customer declares a move need (item + route + timing + access). System returns a confidence-ranked shortlist of real drivers whose routes align. Prices are deterministic. Booking is request-to-book (or Fast Match up to 3 drivers). Payments are escrowed until proof-of-delivery. Drivers see clean decision cards, not message queues.

## 1. Brand Voice

**Calm, plain, trustworthy.** Short sentences. Plain English. No marketing. Show one action at a time.

- Hero lines use the serif display font, set ragged-right, never centered.
- Subline is one sentence of Inter, not two.
- Numbers (prices, counts, times) are always tabular-nums.
- Never use: "amazing", "perfect", "awesome", exclamation marks, or em-dash-separated lists in UI copy.
- Say the number ("$88") not the range unless zero-match.
- Say "driver" in customer UI, "Carrier" only in backend/DB names. In driver UI, avoid "you're a carrier" — say "driver setup", "your routes", "your payouts".

## 2. Design Tokens (from `tokens.jsx`)

### Colour — paper + ink, one clay

```js
const MM = {
  paper:     '#F7F6F2',   // app background
  paperDeep: '#EFEDE6',   // secondary background
  card:      '#FFFFFF',
  ink:       '#14120F',   // primary text and primary CTA fill
  ink70:     'rgba(20,18,15,0.70)',
  ink55:     'rgba(20,18,15,0.55)',
  ink40:     'rgba(20,18,15,0.40)',
  ink20:     'rgba(20,18,15,0.20)',
  ink10:     'rgba(20,18,15,0.10)',
  ink06:     'rgba(20,18,15,0.06)',
  hairline:  'rgba(20,18,15,0.08)',

  // single accent — one focal point per screen
  clay:      '#C9521C',
  clayInk:   '#7A2E10',
  claySoft:  '#F3E3D6',

  green:     '#2D7A3E',   // delivered, payout released, verified
  greenSoft: '#E2EEE5',
  amber:     '#B6791C',   // needs attention, access warnings
  amberSoft: '#F1E6CD',
  red:       '#A6321C',   // destructive only
};
```

**Clay rule:** exactly one clay element per screen. If you add a second, remove one. Primary CTAs use `ink` on `paper`, not clay. Clay is reserved for: Route drop-off dot, in-transit status pill, Fast Match "selected" state, one-tap runsheet `Upload proof` action.

### Typography

```js
serif: '"Instrument Serif", "Iowan Old Style", Georgia, serif',
sans:  'Inter, -apple-system, system-ui, sans-serif',
mono:  '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
```

- **Display (serif):** 28–52 px, letter-spacing -0.5 to -1.4, line-height 1.02–1.08. One per screen.
- **UI (Inter 400/500/600):** 11–22 px. 500 for labels, 600 for titles/emphasis.
- **Numeric:** mono or `fontVariantNumeric: 'tabular-nums'` for any price, count, time, or code.

### Shape

```js
r0: 6, r1: 12, r2: 18, r3: 24, r4: 32;
// cards = r3, primary CTAs = r4, pills = 9999
```

### Spacing

Screen horizontal padding: 20 px. Card interior padding: 14–18 px. Gap between cards: 10–14 px. Sticky footers get `borderTop: 1px ${hairline}`, never a shadow.

### Icon rules

One-weight outline, stroke 1.6 (customer) or 1.8 (driver) for density. Rounded linecap/linejoin. `currentColor`. Never mix filled and outlined icons.

## 3. Component Primitives

Canonical components, wire up exactly these names:

| Component | Purpose |
|---|---|
| `Screen({ bg, children })` | Root screen wrapper. Default `bg={MM.paper}`. |
| `Nav({ title, back, action })` | Top nav bar. Back is a circular icon button; title is optional. |
| `Card({ pad, elevated, onDark, children })` | Standard surface. Default `pad=16`, `r3`, hairline border. |
| `KV({ k, v, bold, size })` | Label/value row. Label muted, value right-aligned tabular. |
| `Pill({ tone, icon, children })` | Status/category chip. Tones: neutral, outline, clay, green, amber, dark. |
| `Primary({ icon, children })` | Single accent CTA. `ink` fill, `paper` text, `r4`, 56 px tall, two-layer shadow. |
| `Secondary({ icon, children })` | Outlined button, 52 px. |
| `Route({ from, to, fromNote, toNote, compact })` | A→B block. Signature component. Ink outline pickup dot, clay drop-off dot, connector rail. |
| `Avatar({ name, size, tone })` | Initials avatar. Tones: ink, clay, soft. Never photo. |
| `Icon({ name, size, color, stroke })` | Icon registry. One of: arrowR, arrowL, check, close, pin, truck, box, sofa, bed, fridge, clock, calendar, stairs, chev, chevD, shield, star, plus, minus, dot, search, camera, user, chat, bell, settings, route, nav, phone, upload, filter, info, sparkle, receipt, check2. |

### Component patterns (must follow)

- **Sticky footer pattern:** footer div with `padding: 12px 20px 32px`, `background: MM.paper`, `borderTop: 1px solid MM.hairline`, containing the `Primary` CTA. Use on every flow screen with an action.
- **Trust Ribbon:** 3-column card with icon + value + label in each column, `borderRight: 1px ${hairline}` on columns 1 and 2. Canonical pattern on offer detail.
- **Route block:** always use the `Route` component. Never recreate the pickup/drop-off layout inline.
- **Access notes card:** when showing access info to a driver, use amber-tinted bg `rgba(182,121,28,0.12)`, amber border `rgba(182,121,28,0.35)`, amber header uppercase label "Access notes" with stairs icon.
- **Inverted payout card:** on driver decision card, the payout block uses paper/card bg inside an otherwise dark container (when night mode is on). This is intentional — payout must be the brightest thing on the screen.

## 4. Copy Patterns (Canonical Phrasings)

These exact strings are canonical. Translate them verbatim; do not "improve" the tone.

| Context | Copy |
|---|---|
| Home hero | "What needs to move?" |
| Home subline | "Tell us once. We'll match you with a driver already going that way." |
| Carrier side-door | "Have spare space in your van? Drive with Movemate" |
| Matches headline (n drivers) | "{n} drivers going your way" |
| Match card why-this-matches | "Direct route on your day" / "Small pickup detour (~{n} km)" / "Near your drop-off (~{n} km)" / "Available {n} days {before|after} your preferred date" / "Covers {pct}% of your route" |
| Fast Match footer | "Tap a driver to book. Or pick up to 3 — first one to accept wins." |
| Payment authorise explainer | "Charged when {name} accepts. Released if they decline." |
| Zero match headline | "No drivers going that way — yet." |
| Zero match 48h line | "If still nothing in 48 hrs, our team finds a driver for you manually — same price, no premium." |
| Zero match no-charge | "Nothing is charged until a driver accepts." |
| Driver landing hero | "Turn the road you're already on into income." |
| Driver review turnaround | "Manually reviewed · typically within 24 hr" |
| Driver activation hero | "You're one step from unlocking jobs." |
| Driver ready hero | "Post your next route." |
| Decision card countdown | "{hrs} hr {min} min to respond" |
| Runsheet headline | "{n} stops · {m} jobs" |
| Delivered headline | "Delivered. All good?" |
| Proof photo stamp | "{time} · {street address}" + below: "GPS + timestamp verified" |

## 5. Screen Layouts (Blueprints)

### Customer — Home
```
[Wordmark]                        [user icon]
48 px
[serif H1: "What needs to move?"]
[subline]
24 px
[Search block card: From / To with dots]
28 px
[STARTS] Label: "Start from"
[Preset row: sofa]
[Preset row: fridge]
[Preset row: marketplace pickup]
...flex fill...
[Driver side-door link, centered]
```

### Customer — Declare
Single scroll. Sections: Route (collapsed once set) → What's moving (category grid + variant picker) → When (date row + flexible toggle) → Access & Handling (stairs/lift/helper/parking). Sticky footer: `Continue — access details` → `Find drivers`.

### Customer — Matches
```
[Nav: back — Fast match action]
[serif H1: "N drivers going your way"]
[subline: route · date · item · floor]
18 px
[MatchCard × 3, first one elevated]
  - Avatar + name + verified
  - Vehicle · trips · rating
  - Price all-in (right)
  - Why-this-matches pill (paperDeep strip)
  - Fit pill + Verified pill
[Nearby dates disclosure row — dashed border]
[Sticky footer: Fast Match instruction]
```

### Customer — Offer Detail
Driver identity row → Trust Ribbon (3-col) → Route card with match line → Vehicle card with constraint pills → Price breakdown (KV rows + total) → Context line below total → Policy line → Sticky footer with `+` Fast Match adder + `Request {name} — ${price}`.

### Customer — Confirm & Pay
Moving-with card → Exact addresses card (editable) → Photo of item card → Price card → Payment method row → Sticky footer: `Authorise ${price}` + "Charged when {name} accepts..." line.

### Customer — Track
Clay pill + serif status → ETA subline → Driver bar (avatar + name + vehicle + rego + phone/chat icons) → Timeline card (done/active/upcoming steps) → Item summary card → Bottom sheet quick-replies (horizontally scrollable pills).

### Customer — Delivered
Green check + serif "Delivered. All good?" → Proof photo with stamp → GPS verified line → Rating card (5 stars + tag pills) → Primary: `Confirm receipt — release payment` + dispute secondary link.

### Customer — Zero Match
Route icon + serif "No drivers going that way — yet." → Explanation line → What happens card (3 numbered rows) → Indicative price card → Primary: `Alert the network` + no-charge line.

### Driver — Home Mode 1 (Activation)
Driver chrome → Amber pill "X of 3 steps done" → Serif "You're one step from unlocking jobs." → Progress track (3 rows) → Teaser demand blurred with gradient mask → Primary: `Resume setup`.

### Driver — Home Mode 2 (Ready)
Driver chrome → Green Verified pill → Serif "Post your next route." → Your routes list (templates with demand signal + Repost button) → Demand panel (clay-tinted, featured corridor) → Primary: `+ Post a new trip`.

### Driver — Decision Card
Close + amber countdown pill → "New request" label → Serif "{name} wants to move a {item}." → Route panel (timeline rail) → Access notes amber card → Item row (photo + spec) → **Inverted payout card** → Customer trust strip → Footer: `Accept — ${payout}` primary; `Decline` + `Clarify` secondary row.

### Driver — Runsheet
"Today · {date}" label → Serif "{n} stops · {m} jobs" → Green payout banner → Stop cards:
- Done: muted, reduced weight, timestamp.
- **Active: inverted to white-paper card with ink text and two CTAs `Navigate` + `I've arrived`.**
- Upcoming: paper card, muted.

Footer: `Condition issue` + `Upload proof` (clay when active).

## 6. Pricing Formula (Deterministic — Never Deviate)

```
base       = driver_pricing[category][variant]
add_ons    = stairs_surcharge + helper_surcharge
             (stairs = stairs_rate × (pickup_flights + dropoff_flights))
             (helper = helper_rate if helper_required)
detour_adj = max(0, detour_km - included_tolerance) × detour_rate
subtotal   = (base × quantity) + add_ons + detour_adj
platform   = subtotal × 0.15
gst        = (subtotal + platform) × 0.10
total      = subtotal + platform + gst
payout     = subtotal
```

**Display rules:**
- Every surface visible to the customer shows **total all-in**. No "starting from". No hourly mixing.
- Breakdown visible on offer detail and confirm-pay screens.
- Real-time recompute if access inputs change during booking confirmation.

## 7. Matching Engine Rules

**Eligibility (hard filters, binary):**
1. Driver accepts the item category.
2. Driver constraints compatible with customer access.
3. Trip date within customer's window.
4. Pickup AND drop-off within driver's max detour tolerance.

**Default tolerance bands:**

| Route | Length | Default | Max endpoint |
|---|---|---|---|
| Metro | ≤ 40 km | 5 km | 8 km |
| Regional | 41–150 km | 10 km | 15 km |
| Intercity | > 150 km | 20 km | 25 km |

**Ranking weights:** Route-fit 30% · Time-fit 25% · Fit-confidence 20% · Trust 15% · Price 10%.

**Match classes** (drive the why-this-matches copy; generate deterministically):
`direct` / `near_pickup` / `near_dropoff` / `minor_detour` / `nearby_date` / `partial_route` / `needs_approval`.

**Partial matches** — show only if uncovered portion < 30% of total distance AND within tolerance.

## 8. State Machines (Implement Exactly)

### Activation
`unverified → activation_started → pending_review → active` (or `suspended` from active; rejection returns to `unverified` with reason).

### Trip
`draft → published → in_progress → completed` (or `suspended` on 2h check-in failure; `expired`; `cancelled`).

### Booking Request
`pending → accepted|declined|expired|revoked|clarification_requested → pending` (one clarification round only).

### Fast Match Group
`created → broadcast_pending → group_confirmed` (on first accept, atomically revoke all siblings). OR `group_failed` → suggest widen dates + Alert the Network. **First accept wins is atomic — no race conditions.**

### Booking
`confirmed → pickup_due → picked_up → in_transit → delivered_pending_confirmation → completed` (or `disputed → resolved_*`).

### Payout
`held → pending_confirmation → released → paid` (or `blocked` on dispute).

### Unmatched Request
`active → notified → matched|expired|cancelled`. Expiry is 30 days from creation.

## 9. Data Model (Core Entities)

`User`, `CustomerProfile`, `CarrierProfile`, `Verification`, `Vehicle`, `TripTemplate`, `Trip`, `MoveRequest`, `Offer`, `BookingRequest`, `Booking`, `ConditionAdjustment`, `Proof`, `UnmatchedRequest`, `ConciergeOffer`, `Rating`, `Notification`.

Key field conventions:
- All routes as polylines in PostGIS `geography(LineString, 4326)`.
- All addresses stored as both formatted string AND `geography(Point, 4326)` + suburb.
- All timestamps UTC; display in `Australia/Sydney`.
- All prices stored in cents (int), never float.
- Status fields are enums, never free strings.

See `movemate-product-blueprint.md` Section 14 for full field specs.

## 10. Non-Negotiable Rules

These are the "never do this" rules. Every PR is reviewed against them.

| Never | Why |
|---|---|
| Show supply before the customer declares intent | Violates need-first |
| Show cubic metres or dimensions to the customer | Customers don't reason in m³ |
| Use freeform pricing inputs | Kills deterministic pricing |
| Allow an unverified carrier to appear in results or accept a booking | Destroys trust |
| Open a chat thread before a booking exists | Creates negotiation gravity |
| Display "starting from" prices or ranges (except zero-match indicative) | Ambiguity kills trust |
| Use two clay-coloured elements on the same screen | Breaks visual hierarchy |
| Use two serif headlines on one screen | Breaks typographic rhythm |
| Dead-end a zero-match state without Alert the Network | Destroys conversion |
| Ship a match card without a "why this matches" explanation | Violates match explicability |
| Use emoji in UI copy | Off-brand |
| Store prices in float | Rounding bugs |
| Let a driver negotiate a counter-proposal | Turns the product into Airtasker |
| Use localStorage or sessionStorage in the client | Breaks session trust and test env |

## 11. Copy Voice Quick Rules

- Prefer "we" and "you". Avoid "our customers", "users", "the driver will".
- Write as if speaking to one person who is reasonably stressed.
- Positive framing by default. Use amber (warning), not red, for access warnings.
- Numbers are specific ("38 drivers", "~8 min detour"), never vague ("many drivers", "some time").
- Avoid ceremony. "Request Daniel — $88.03" beats "Confirm your booking request".

## 12. Accessibility Minimums

- Tap targets ≥ 44×44 px. Driver operational buttons ≥ 52×52.
- Colour contrast WCAG AA on all text over paper or ink.
- All interactive elements have a text label (buttons, icon-only actions need `aria-label`).
- Every form field has a visible label. Placeholder text is not a label.
- Status updates (toast, push) announce via live region.
- Supports 100% text scaling up to 200%.

## 13. Build Discipline for AI Coding Agents

When picking up a task:

1. **Read the blueprint section referenced in the ticket** before touching code.
2. **Grep for tokens** (`MM.ink`, `MM.clay`, etc.) and reuse existing values — never introduce a new hex colour.
3. **Reuse primitives** (`Card`, `Pill`, `Route`, `Avatar`, `KV`, `Primary`, `Secondary`, `Nav`, `Screen`) — do not recreate them.
4. **Match existing component naming** — don't invent `MatchTile` if `MatchCard` already exists.
5. **Respect the single-focal-point rule.** One clay element, one serif headline, one primary CTA per screen.
6. **Test zero-state, loading-state, error-state** for every new surface.
7. **Write the copy to match Section 4 canonical phrasings.** Do not "improve" the tone.
8. **For pricing code, use the formula in Section 6 verbatim.** No shortcuts.
9. **For new endpoints that return listings, implement the eligibility filter before ranking.** Never send incompatible drivers to the client.
10. **Commit messages:** `feat(scope): what`; reference the blueprint section, e.g., `(blueprint §6.3)`.

## 14. Directory Conventions (Suggested)

```
/app
  /(customer)
    /page.tsx                # Home
    /declare/page.tsx        # Declaration flow
    /matches/page.tsx
    /offer/[id]/page.tsx
    /book/[id]/page.tsx
    /track/[id]/page.tsx
    /delivered/[id]/page.tsx
  /(driver)
    /driver/page.tsx         # State-aware home
    /driver/requests/page.tsx
    /driver/trips/page.tsx
    /driver/account/page.tsx
    /driver/post/page.tsx    # Trip posting wizard
    /driver/runsheet/[date]/page.tsx
/components
  /primitives                # Screen, Nav, Card, KV, Pill, Primary, Secondary
  /Route.tsx
  /Avatar.tsx
  /Icon.tsx
  /MatchCard.tsx
  /TrustRibbon.tsx
  /DecisionCard.tsx
  /RunsheetStop.tsx
/lib
  /tokens.ts                 # MM export
  /pricing.ts                # Pricing formula
  /matching.ts               # Eligibility + ranking
  /copy.ts                   # Canonical strings
/db
  /schema                    # Supabase / Drizzle schema
/.agent-skills
  /docs/product/design-system.md     # this file (moved from root)
  /pricing.md
  /matching.md
  /data-model.md
```

## 15. When In Doubt

Default to: **the simpler option that reduces customer uncertainty and driver operational burden.** If that is still ambiguous, open the blueprint to Section 15 (Governing Principles) and pick the interpretation that is most consistent with those 16 principles.
