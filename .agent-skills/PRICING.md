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

## Launch guardrails

- fixed-price booking only for MVP
- no public counteroffer flow yet
- route price guidance should prefer real corridor distance over suburb-name similarity
- long-distance spare-capacity trips keep a minimum base price floor of `$50` once the route is `>= 250km`
- any future negotiation must stay in-platform, hide direct contact details, and be tightly bounded

## Do not add in MVP

- surge pricing
- opaque algorithmic pricing
- hidden fees
