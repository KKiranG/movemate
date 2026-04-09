# Matching Engine

## Principle

Matching must stay deterministic, explainable, and debuggable.

## Hard disqualifiers

- pickup outside detour radius
- dropoff outside detour radius
- item does not fit available space
- carrier does not accept the category
- listing is inactive or expired
- carrier is not verified

## Ranking signals

- pickup route fit
- dropoff route fit
- carrier reliability
- price fit

## Why this is not AI matching

- easier to debug
- easier to explain to customers and carriers
- easier to tune while the marketplace is young
- better aligned with trust-first product behavior

## Data sources

- PostGIS distance filters
- Google Maps geocoding and distance resolution in production
- carrier ratings
- listing price
- listing rules and capacity constraints

## Launch-path search truth

- Google Maps is the production source of truth for suburb resolution and route-fit inputs
- the curated Sydney suburb coordinate map is only a degraded fallback for local or missing-env paths
- ranking must stay route-fit first and explainable in customer language
- do not reintroduce raw suburb `ilike` matching as the primary corridor fallback
