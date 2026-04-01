# API Routes

## Route groups

### Public

- `GET /api/health`
- `GET /api/search`
- `GET /api/trips/[id]`

### Shared authenticated

- `POST /api/upload`

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

### Customer-facing

- `POST /api/bookings`
- `GET /api/bookings`
- `PATCH /api/bookings/[id]`
- `POST /api/bookings/[id]/confirm-receipt`
- `POST /api/bookings/[id]/dispute`
- `POST /api/bookings/[id]/review`
- `GET /api/saved-searches`
- `POST /api/saved-searches`
- `DELETE /api/saved-searches/[id]`
- `PATCH /api/saved-searches/[id]`

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

## API boundary rules

- authenticate early
- validate with Zod before DB work
- return structured application errors
- keep analytics and email off the critical path where reasonable
- do not bypass booking, pricing, or auth invariants for convenience

## High-risk route families

- bookings
- payments
- upload
- admin verification and disputes

Those paths need explicit verification, not just type safety.
