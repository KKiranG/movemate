# Matching Engine

## Principle

Matching must stay deterministic, explainable, and debuggable. Every result must explain why it matched. No opaque scoring, no AI ranking, no negotiation gravity.

## Inputs

**From MoveRequest (customer):**
- Pickup lat/lng (geocoded from address/suburb)
- Drop-off lat/lng
- Item category, variant, quantity
- Timing window (specific date or flexible range)
- Access conditions (stairs, helper, parking, lift)

**From Trip (carrier):**
- Route polyline (computed from start + end + optional waypoints via Google Maps Directions API)
- Pickup corridor tolerance (km) — derived from carrier's detour policy
- Drop-off corridor tolerance (km)
- Date, time window
- Vehicle type, capacity descriptor
- Accepted item categories with pricing
- Item constraints (stairs policy, helper policy, max item length, fragile accepted)

## Eligibility Rules (Hard Filters — binary pass/fail)

A Trip is excluded from results if ANY of these fail:

1. **Category gate:** Carrier does not accept the customer's item category
2. **Constraint gate:** Customer's access conditions conflict with carrier's hard constraints (e.g., customer: 3rd floor, no lift; carrier: ground floor only)
3. **Timing gate:** Trip date does not fall within the customer's acceptable timing window
4. **Proximity gate:** Pickup or drop-off is beyond the carrier's maximum detour tolerance from the route polyline
5. **Activation gate:** Carrier is not verified and activated
6. **Trip status gate:** Trip is inactive, expired, or suspended

A failed Trip never appears in results.

## Corridor and Radius Logic

Corridor is defined as the trip's route polyline + tolerance radius (not a city-to-city label). For each candidate Trip, calculate the shortest distance from the customer's pickup point to the route polyline, and the same for the drop-off point.

**Default tolerance bands (carrier-configurable within these bounds):**

| Route Type | Route Length | Default Corridor Tolerance | Max Endpoint Tolerance |
|---|---|---|---|
| Local/metro | Up to 40 km | 5 km | 8 km |
| Regional | 41–150 km | 10 km | 15 km |
| Intercity | 150+ km | 20 km | 25 km |

## Detour Estimation

For each eligible Trip, compute:
1. Base route duration and distance (from stored polyline)
2. Route with customer pickup and drop-off inserted (via Google Maps Directions API for selected candidates; results cached)
3. Detour delta: additional km and additional minutes

**What the customer sees:** Route-fit label ("Direct route" / "Near your pickup (~3 km)")
**What the carrier sees on the decision card:** "Pickup is 3 km from your route (~8 min detour). Drop-off is on your route."
**What the platform does NOT do:** Calculate fuel costs or make per-km pricing decisions for the carrier.

## Partial Route Matching

A partial match occurs when the carrier's route covers only part of the customer's journey.

- Show partial matches only if the uncovered portion is under 30% of the total customer route distance AND the detour is within the carrier's tolerance
- Label clearly: "Covers your pickup area. Drop-off is 15 km beyond this driver's listed route."
- Show in "Possible matches (needs approval)" section, below strong matches
- If detour exceeds the carrier's maximum, do not show — route to Alert the Network instead

## Relevance Ranking

Ranking combines signals into a single relevance score. Priority order:

1. **Route-fit score** — lower detour distance scores higher; direct routes score highest
2. **Time-fit score** — exact date match > within flexible window > nearby dates
3. **Fit-confidence score** — item tier vs capacity vs constraints; "Likely fits" ranks higher than "Needs approval"
4. **Trust score** — verification level + star rating + trips completed + response reliability
5. **Price** — tiebreaker only; not primary (prevents commoditisation via pure price sorting)

**Starting weights (tunable):** Route-fit 30%, Time-fit 25%, Fit-confidence 20%, Trust 15%, Price 10%

## Match Classification Labels (match_class)

Every result card gets a deterministic match_class label:

| match_class | Condition | Customer label |
|---|---|---|
| `direct` | Both pickup and drop-off within 2 km of route, exact date | "Direct route match" |
| `near_pickup` | Pickup 2–8 km from route, drop-off within 2 km | "Near your pickup (~X km)" |
| `near_dropoff` | Pickup within 2 km, drop-off 2–8 km from route | "Near your drop-off (~X km)" |
| `minor_detour` | Both points 2–8 km from route | "Small detour required" |
| `nearby_date` | Direct route but date offset 1–7 days | "Available N days [before/after] your preferred date" |
| `partial_route` | Route covers <100% of customer journey | "Covers X% of your route" |
| `needs_approval` | Detour > 8 km or fit confidence low | "Possible match — needs approval" |

**"Why this matches" strings are generated from these templates, not from free text.** Examples:
- `direct`, exact date: "Direct route match on your requested day."
- `near_pickup`, exact date: "Small pickup detour (~3 km), same-day delivery."
- `direct`, nearby date: "Direct route — available 2 days after your preferred date."
- `partial_route`: "Covers your pickup area. Drop-off is 12 km beyond this driver's listed route."

## Fast Match

Customer selects up to 3 offers and broadcasts the request simultaneously. First carrier to accept confirms the booking; all sibling requests in the same request_group are atomically revoked. Other carriers are notified.

**This is NOT bidding.** The carrier sees the same fixed price. No price competition. No negotiation. The carrier's only decision is accept or decline.

**Implementation rule:** The first accept must atomically revoke all sibling requests. No race conditions — first accept wins and the group is closed.

## Result Assembly

Return ranked list with Offer entities, capped at 20 results, grouped:
1. "Top Matches" — direct and near matches
2. "Possible Matches (needs approval)" — partial route and needs_approval
3. "Also available on nearby dates" — nearby_date matches

## Why This Is Not AI Matching

- deterministic → debuggable
- explainable → every result has a "Why this matches" string in plain language
- tunable → weights are documented and adjustable
- trust-aligned → the customer and carrier can always understand why a match appeared

## Data Sources

- PostGIS route polyline storage and spatial queries for candidate retrieval
- Google Maps Directions API for route polylines and detour computation in production
- Curated suburb coordinate map is a degraded fallback for local / missing-env paths only — never the production path
- Carrier ratings, trip count, response reliability for trust score
- Carrier pricing tables and constraint rules for eligibility and price computation

## Invariants

- Ranking stays deterministic and explainable
- Hard eligibility disqualifiers are never bypassed for supply-side convenience
- Do not reintroduce raw suburb `ilike` matching as the primary corridor fallback
- No AI bidding, opaque ranking, or hidden negotiation logic
