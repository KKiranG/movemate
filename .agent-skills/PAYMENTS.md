# Payments

## Provider

Stripe Connect Express.

## Marketplace payment shape

- customer authorizes payment at booking time
- platform keeps the booking fee plus commission
- carrier payout is separate from customer payment authorization
- payout release should track trustworthy completion behavior

## Required flows

- create payment intent
- handle webhook events correctly
- create or link the carrier's Connect account
- support payout release after successful completion
- handle refunds and failures without breaking booking truth

## Guardrails

- do not casually change the funds flow
- do not couple payment state and booking state sloppily
- do not treat webhook handling as optional plumbing
- keep admin visibility strong for payment failures

## Operational stance

Basic payout correctness matters more than advanced automation.
