# Pricing

## Model

- carrier sets the base price
- customer pays base price plus applicable extras plus the flat booking fee
- platform keeps `15%` of base price plus the booking fee

## Critical invariant

Commission applies to `basePriceCents` only.
It does not apply to stairs or helper fees.

## Customer-visible rules

Pricing should stay transparent.
Always make these legible:
- carrier price
- stairs or helper extras
- booking fee
- customer total
- why this is cheaper than a dedicated move

## Suggested pricing inputs

- route distance
- space size
- stairs
- helper
- whether the trip is already happening anyway

## Do not add in MVP

- surge pricing
- opaque algorithmic pricing
- hidden fees
