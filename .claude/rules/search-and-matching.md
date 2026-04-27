---
paths:
  - src/lib/matching/**
  - src/lib/data/trips.ts
  - src/components/search/**
  - src/components/trip/trip-card.tsx
  - src/app/(customer)/search/**
---

# Matching + Results Rules

The results surface is a product-shaping surface in MoveMate. It is a ranked answer set, not a filterable browse archive.

## Core Principles

- Results explain why each option fits — "Why this matches" is mandatory on every result card.
- Ranking must stay deterministic and explainable (see `MATCHING-ENGINE.md` for match_class labels).
- Hard eligibility disqualifiers should remain visible and explicit in code.
- Results language should stay need-first and match-focused — never drift into catalogue browsing, quotes, or dispatch.

## What To Optimize

- route fit (every result explains the match, not just lists the row)
- match explanation clarity ("Going your way" / "Close to your pickup" / "Nearby route match")
- trust legibility (verified badge, trip count, star rating if ≥3)
- total all-in price on every card (including platform fee and GST)
- timing clarity
- zero-match path (always routes to Alert the Network — never a dead end)

## What To Avoid

- hidden ranking logic
- opaque AI scoring
- freight-software jargon
- raw cubic-metre capacity on customer-facing cards
- weak inventory dominating first impressions without match explanation
- "starting from" price ranges — the price is the price

## Result Card Expectations

- total all-in price (base + add-ons + platform fee + GST) shown prominently
- "Why this matches" explanation line on every card
- fit-confidence label: "Likely fits" / "Review photos" / "Needs approval"
- route-fit label: "Going your way" / "Close to your pickup" / "Close to your drop-off" / "Nearby route match" / "May need carrier approval" — never "Direct route" or km estimates
- timing confidence visible before tap
- trust signals: "Verified" badge + star rating (if ≥3) + trip count

## Zero-Match State

- never show a dead-end empty state
- show near-matches if they exist (same corridor within 7 days, adjacent corridors, partial segments)
- if truly zero: show Alert the Network CTA and capture the need as an UnmatchedRequest
- always offer at least one recovery path

## Verification

- check default ordering with a weak and a strong listing
- confirm "Why this matches" string is present and uses the correct match_class template
- confirm no-result states route to Alert the Network (not just empty)
- confirm result card price is total all-in (not base-only)
- confirm route-fit and pricing copy still match the actual product wedge
