# moverrr Overview

## What moverrr is

moverrr is a need-first, match-ranked spare-capacity marketplace for awkward-middle item moves.

Carriers post trips they are already taking and set structured pricing.
Customers declare a specific move need via a short wizard. The system matches against posted trips and returns a confidence-ranked shortlist with deterministic pricing, fit-confidence labels, and "Why this matches" explanations. The customer requests one carrier (Request-to-Book) or broadcasts to up to 3 (Fast Match). The carrier accepts or declines via a decision card. Payment is escrowed, proof-of-delivery releases payout.

The product is mobile-first. The web app exists to develop and validate the product.

## What moverrr is not

- not a browse-first inventory catalogue where the customer scrolls through raw listings
- not a removalist company
- not a courier dispatch layer
- not a quote-comparison funnel
- not a bidding marketplace
- not an AI-matching product

## The interaction model

```
Need-declaration wizard (route + item + timing + access)
  → match-ranked shortlist with "Why this matches" on every card
    → Request-to-Book (single carrier) or Fast Match (up to 3, first to accept wins)
      → carrier accepts/declines via decision card
        → escrowed payment
          → structured coordination + proof-of-delivery
            → payout release
```

## The wedge

Current wedge examples:
- single furniture items
- appliances
- marketplace pickups (seller → buyer)
- student moves
- small business overflow

## Key mechanisms

### Fast Match
Customer selects up to 3 offers and broadcasts the request. First carrier to accept confirms the booking; all sibling requests are atomically revoked. Not bidding — the price is fixed. The only carrier decision is accept or decline.

### Alert the Network
When zero matches exist, the need is captured as an UnmatchedRequest. Relevant carriers are notified. The customer is never shown a dead-end empty state. If no carrier responds within the SLA, the founder reviews the operator queue and may source a carrier manually.

### Concierge Offer
Founder-led manual fulfilment. When the founder sources a carrier for an unmatched request, a ConciergeOffer entity is created in the system — linking the UnmatchedRequest to the carrier. The carrier activates and accepts through the normal booking flow. The transaction completes on-platform. Data integrity is preserved.

### State-aware carrier home
The carrier home adapts to lifecycle stage:
- **Mode 1 — Activation:** Resume setup CTA, progress bar, teaser demand.
- **Mode 2 — Ready to Post:** Post a trip CTA, quick-repost buttons, demand signal.
- **Mode 3 — Active Operations:** Most urgent action (pending request, today's trips, proof needed, payout blocked).

## What matters most right now

1. recurring carrier supply — reliable inventory is the engine
2. transparent customer trust — fit labels, match explanations, price clarity
3. manageable ops and disputes — manual-first is correct at this stage
4. clear match quality — every result explains why it matches

## Current shipped surface

- need-declaration wizard and match-ranked search
- offer detail page with booking creation
- carrier onboarding and trip posting wizard
- trip templates for repeat routes (quick-repost)
- booking progression, disputes, and reviews
- admin verification and dispute handling
- route alerts / Alert the Network demand capture

## Core product question

Can moverrr convert a messy object-move problem into a confident yes/no decision fast enough that customers do not abandon — even when supply is sparse?
