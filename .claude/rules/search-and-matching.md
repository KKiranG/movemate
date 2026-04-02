---
paths:
  - src/lib/matching/**
  - src/lib/data/trips.ts
  - src/components/search/**
  - src/components/trip/trip-card.tsx
  - src/app/(customer)/search/**
---

# Search + Matching Rules

Search is a product-shaping surface in moverrr.

## Core Principles

- Search should explain why a trip fits, not just list rows.
- Ranking must stay deterministic and explainable.
- Hard disqualifiers should remain visible and explicit.
- Search language should stay route-first and browse-first, never drift into quotes or dispatch.

## What To Optimize

- route fit
- trust legibility
- timing clarity
- supply quality
- customer self-qualification

## What To Avoid

- hidden ranking logic
- opaque AI scoring
- freight-software jargon
- weak inventory dominating first impressions

## Search UI Expectations

- cards should show total customer price
- timing confidence should be visible before tap
- capacity should be made human, not only percent-based
- empty states should capture demand and offer next actions

## Verification

- check default ordering with a weak and a strong listing
- confirm no-result states still offer a clear next step
- confirm route-fit and pricing copy still match the actual product wedge
