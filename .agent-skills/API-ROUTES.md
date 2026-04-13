# API Routes

## Route groups

### Public

- `GET /api/health`
- `GET /api/search` — legacy search endpoint; transitioning to move-requests flow
- `GET /api/trips/[id]` — offer detail page data

### Shared authenticated

- `POST /api/upload`

### Need-first flow (customer)

- `POST /api/move-requests` — create a MoveRequest (wizard completion)
- `GET /api/offers?moveRequestId=...` — retrieve match-ranked Offers for a MoveRequest
- `POST /api/booking-requests` — create a booking request (single or Fast Match group)
- `POST /api/booking-requests/fast-match` — create a capped Fast Match request group
- `PATCH /api/booking-requests/[id]` — accept / decline / request clarification (carrier-facing)
- `POST /api/unmatched-requests` — Alert the Network (zero-match demand capture)
- `PATCH /api/unmatched-requests/[id]` — update status (customer cancels, match found)
- `GET /api/alerts`
- `POST /api/alerts`
- `PATCH /api/alerts/[id]`
- `DELETE /api/alerts/[id]`
- `PATCH /api/concierge-offers/[id]` — customer accepts or declines a founder-sourced concierge offer

### Carrier-facing

- `GET /api/trips`
- `POST /api/trips`
- `PATCH /api/trips/[id]`
- `DELETE /api/trips/[id]`
- `GET /api/trips/templates`
- `POST /api/trips/templates`
- `PATCH /api/trips/templates/[id]`
- `DELETE /api/trips/templates/[id]`
- `POST /api/trips/templates/[id]/post`
- `GET /api/trips/price-guidance`

### Customer-facing (bookings)

- `POST /api/bookings` — deprecated guard; bookings are created from accepted booking requests
- `GET /api/bookings`
- `PATCH /api/bookings/[id]`
- `POST /api/bookings/[id]/confirm-receipt`
- `POST /api/bookings/[id]/dispute`
- `POST /api/bookings/[id]/review`
- `POST /api/bookings/[id]/condition-adjustment` — carrier triggers structured adjustment
- `PATCH /api/bookings/[id]/condition-adjustment` — customer accepts or rejects adjustment
- `GET /api/saved-searches` — compatibility wrapper around alerts
- `POST /api/saved-searches` — compatibility wrapper around alerts
- `DELETE /api/saved-searches/[id]` — compatibility wrapper around alerts
- `PATCH /api/saved-searches/[id]` — compatibility wrapper around alerts

### Payments

- `GET /api/payments`
- `POST /api/payments/create-intent`
- `POST /api/payments/webhook`

### Reviews

- `POST /api/reviews/[id]/response`

### Admin

- `GET /api/admin`
- `GET /api/admin/bookings`
- `GET /api/admin/carriers`
- `PATCH /api/admin/carriers/[id]`
- `POST /api/admin/carriers/[id]/verify`
- `PATCH /api/admin/disputes/[id]`
- `GET /api/admin/rate-limit`
- `POST /api/concierge-offers` — founder creates and sends concierge offer for an unmatched request
- `PATCH /api/concierge-offers/[id]` — admin cancels, or customer accepts/declines, a concierge offer

## API boundary rules

- authenticate early
- validate with Zod before DB work
- return structured application errors
- keep analytics and email off the critical path where reasonable
- do not bypass booking, pricing, or auth invariants for convenience

## High-risk route families

- booking-requests (Fast Match atomicity)
- bookings (state machine, capacity invariants)
- condition-adjustment (structured exception path — not a negotiation channel)
- payments (capture timing, webhook idempotency)
- upload
- admin verification and disputes

Those paths need explicit verification, not just type safety.
