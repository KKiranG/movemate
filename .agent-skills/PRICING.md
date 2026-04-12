# Pricing

## Model

- Carrier sets base price per accepted item category/tier during trip posting
- Customer pays base + applicable add-ons (stairs, helper) + detour adjustment (if applicable) + platform fee + GST
- Platform keeps platform fee (15% of base) + booking fee; GST is collected and remitted separately

## Pricing formula

```
base         = carrier_pricing_table[item_category] × quantity
add_ons      = stairs_surcharge + helper_surcharge (if applicable)
detour_adj   = carrier_detour_rate × max(0, detour_km - included_tolerance) (if detour rate is set)
subtotal     = base + add_ons + detour_adj
platform_fee = base × 15%   (applied to base only — see invariant below)
gst          = (subtotal + platform_fee) × 0.10
total        = subtotal + platform_fee + gst
carrier_payout = subtotal  (platform fee and GST never included in payout)
```

## Critical invariant

**Commission (platform fee) applies to `basePriceCents` only.**
It does not apply to stairs fees, helper fees, or detour adjustments.

Primary files:
- `src/lib/pricing/breakdown.ts`
- `src/lib/__tests__/breakdown.test.ts`

> **Pending clarification:** The governing blueprint describes `platform_fee = subtotal × 15%` (i.e., including add-ons). The existing codebase applies 15% to `basePriceCents` only. Do not change the existing invariant without an explicit decision. The formula above preserves the current code behaviour.

## Add-on rates

Carrier-set, predefined amounts (not free text):
- Stairs surcharge (per flight, e.g., $10/flight at pickup, $10/flight at drop-off)
- Helper/2-person surcharge (flat rate, e.g., $30)
- Detour rate (per km beyond included corridor tolerance, e.g., $3/km — optional; used by pricing engine)

## Customer-visible rules

Always make these legible at the offer detail page and booking confirmation:
- Carrier base rate (for item category)
- Stairs or helper add-ons
- Platform fee
- GST
- Customer total (all-in, deterministic)
- Why this is cheaper than a dedicated move

Total all-in price must appear on every result card. No "starting from." No price ranges. The price is the price.

## Price updates during booking

If the customer changes access conditions during booking confirmation (e.g., corrects from "no stairs" to "2 flights"), the price updates in real time before final submission. The customer always sees the final total before authorising payment.

## Condition Adjustment (Structured Exception Path)

If the carrier arrives at pickup and discovers the declared conditions do not match reality:
- Carrier triggers a "Condition Adjustment" with a predefined reason (stairs mismatch / helper required / item different / extreme parking)
- Carrier selects a predefined adjustment amount — not free text
- Customer receives notification and chooses Accept (price updates) or Reject (booking cancelled, carrier not penalised)
- One round only. No second adjustment. This is not negotiation.

See `CARRIER-FLOW.md` for the full decision flow.

## Pricing inputs for the carrier posting wizard

The platform shows suggested pricing ranges based on route distance and item category. Informational only — carrier chooses their own price. Ranges are derived from historical data (or pre-seeded defaults based on distance bands before data exists).

## Launch guardrails

- fixed-price booking only for MVP
- no open counter-proposal flow
- route price guidance should use real corridor distance, not suburb-name similarity
- long-distance trips (route ≥ 250 km) keep a minimum base price floor of $50
- any future negotiation must stay in-platform, never expose direct contact details

## Do not add in MVP

- surge pricing
- opaque algorithmic pricing
- hidden fees
- hourly rates displayed alongside flat rates (ambiguity creator)
- freeform pricing text fields
- customer budget bidding
