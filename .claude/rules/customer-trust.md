---
paths:
  - src/app/(customer)/**
  - src/components/trip/**
  - src/components/search/**
  - src/components/booking/booking-checkout-panel.tsx
  - src/components/booking/booking-form.tsx
---

# Customer Trust Rules

Customer trust comes from specific evidence, not vague reassurance.

## Show Early (on every result card)

- "Why this matches" — deterministic explanation (e.g., "Going your way on your requested day")
- Fit-confidence label: "Good fit" / "Photos help" / "Fit check needed"
- Total all-in price (base + add-ons + platform fee + GST) — no "starting from"
- Carrier trust signals: "Verified" badge, star rating (if ≥3 ratings), trip count
- Route-fit label — confidence-based only: "Going your way" / "Close to your pickup" / "Close to your drop-off" / "Nearby route match" / "May need carrier approval"
- Never use "Direct route" or km estimates unless backed by road-detour calculation (not straight-line proximity)

## Show on Offer Detail Page

- Full price breakdown line by line (base rate + stairs + platform fee + GST = total)
- Vehicle photo and human-readable capacity descriptor
- Carrier's item constraints, clearly stated (e.g., "Ground floor only. Max item length: 2m.")
- Cancellation and misdescription policy — plain language
- What proof exists and when it is captured (pickup photo optional; delivery photo mandatory)
- "Verified" identity status and member-since date always shown
- Reviews only shown after 3+ ratings; never show "0 stars" or "New" without context

## Copy Rules

- say what is verified (identity, vehicle)
- say what payment does next (authorised now; charged only when carrier accepts)
- say what proof is required and when
- avoid vague claims like "safe and secure" without specifics behind them
- avoid corporate reassurance fluff

## Empty States and Zero-Match

- never a dead-end "No results" screen
- show Alert the Network CTA and capture the need as an UnmatchedRequest
- always offer at least one recovery path with a clear, actionable next step

## Verification

- result card shows total all-in price, "Why this matches" line, and fit-confidence label
- offer detail shows full price breakdown including GST
- checkout shows updated price if access conditions changed
- zero-match routes to Alert the Network, not an empty state
