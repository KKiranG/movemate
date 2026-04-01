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
- carrier ratings
- listing price
- listing rules and capacity constraints
