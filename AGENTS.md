# moverrr — Codex Agent Guidance

## What This Product Is (Non-Negotiable)

moverrr is a **browse-first spare-capacity marketplace**.
Carriers post existing trips with spare space. Customers browse and book into those trips.
Revenue: 15% platform commission on carrier price + $5 flat booking fee per job.

**This is NOT:**
- A removalist booking platform
- A courier dispatch service
- A quote-comparison engine
- A product with AI matching or bidding

If a feature request pushes toward any of these, stop and ask before building.

---

## iOS-First Design Contract

This product ships as an **iOS native app**. The web app is for development testing only.

Every UI decision must work natively on iPhone first.

| Rule | Enforcement |
|------|------------|
| All tap targets | `min-h-[44px] min-w-[44px]` — no exceptions |
| Touch feedback | Every tap target needs `active:` state alongside any `hover:` |
| Camera inputs | Proof upload must use `capture="environment"` for direct rear camera |
| Safe area | Sticky/fixed elements: `pb-[env(safe-area-inset-bottom)]` |
| Scroll containers | `overscroll-behavior: contain` |
| No hover-only states | `hover:` without `active:` sibling is a bug |
| File types | Always include `image/heic` and `image/heif` — iOS camera default |
| Viewport | Test at 375px (iPhone SE) minimum |

---

## Commission Math (Do Not Change Without Discussion)

```
Customer pays:   base + stairs_fee + helper_fee + $5 booking_fee
Carrier earns:   base + stairs_fee + helper_fee − (base × 15%)
Platform earns:  (base × 15%) + $5 booking_fee
```

**Commission applies only to `basePriceCents`, NOT to `stairsFeeCents` or `helperFeeCents`.** This is intentional.

Implementation: `src/lib/pricing/breakdown.ts`
Tests: `src/lib/__tests__/breakdown.test.ts` (verify identity: `total = payout + commission + bookingFee`)

---

## Booking State Machine Rules

Transitions defined in `src/lib/status-machine.ts` (pure — no DB access).
Guards enforced in `updateBookingStatusForActor` in `src/lib/data/bookings.ts`.

**Critical guard:** `disputed → completed` requires `disputes.status = 'resolved'` or `'closed'`.
Check this in the application layer, not the state machine.

**Booking creation must use the atomic RPC** (`create_booking_atomic`), never two-step read-then-write.
This prevents inventory oversell on concurrent bookings.

---

## Intentional Graceful Degradation (Do Not "Fix" These)

These are deliberate for local development — not bugs:

- `hasSupabaseEnv()` returning `false` → return empty arrays, not errors
- `sendTransactionalEmail()` with no Resend config → returns `{ skipped: true }`, does not throw
- `enforceRateLimit()` → falls back to in-memory `Map` when `UPSTASH_REDIS_REST_URL` is absent

In production, `assertRequiredEnv()` (called from `next.config.js`) will catch missing vars at startup.

---

## Database Rules

1. **RLS on every new table** — no exceptions, ever
2. **GIST index on every geography column** — PostGIS spatial queries need it
3. **Admin operations use `createAdminClient()`** (service-role) — never bypass RLS for non-admin code
4. **New migrations go in `supabase/migrations/`** — sequential naming (`NNN_description.sql`)
5. **`remaining_capacity_pct` must be updated** whenever a booking is created or cancelled

---

## Code Conventions

```typescript
// Errors: always AppError with statusCode + code
throw new AppError(400, 'listing_not_bookable', 'This listing is no longer available')

// At API boundary:
return toErrorResponse(error)

// Validation: always Zod, always before DB operations
const parsed = tripSchema.parse(body)

// API route guard — first line after handler signature:
const user = await requireSessionUser(request)  // or requireAdminUser

// Analytics: fire-and-forget, never await in critical path
trackAnalyticsEvent('booking_created', { bookingId })  // no await

// Email: fire-and-forget, but CHECK result.error for Sentry
const result = await sendTransactionalEmail(...)
if (result.error) captureAppError(result.error, { context: 'booking_email' })
```

---

## Before Finishing Any Task

```bash
npm run check          # lint + typecheck — must pass clean
```

Then verify manually:
- [ ] No new `hover:` classes without matching `active:` state
- [ ] No new tables created without RLS policies
- [ ] Commission logic in `breakdown.ts` unchanged (if touching pricing)
- [ ] Any new `<input type="file">` in proof/photo flows has `capture="environment"`
- [ ] Any new interactive element in carrier flow has `min-h-[44px]`

---

## Priority Order

When deciding what matters most:

**Trust → Simplicity → Supply speed → Customer clarity → Automation → Polish**

The carrier posting their first trip is more important than a beautiful landing page.
A disputed booking resolved quickly is more important than advanced analytics.

---

## What Success Looks Like (MVP)

- 10+ active verified carriers posting usable availability weekly
- 50+ completed Sydney metro jobs in the wedge (single furniture, bulky items, marketplace pickups)
- 30%+ of inbound demand matches genuine spare capacity
- Disputes manageable without full-time ops
- Several carriers prefer moverrr over existing channels (Facebook groups, Airtasker)

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Booking creation (atomic) | `src/lib/data/bookings.ts` |
| Commission math | `src/lib/pricing/breakdown.ts` |
| State machine (pure) | `src/lib/status-machine.ts` |
| Dispute resolution | `src/lib/data/admin.ts` |
| Payment webhook | `src/app/api/payments/webhook/route.ts` |
| Trip validation | `src/lib/validation/trip.ts` |
| Upload endpoint | `src/app/api/upload/route.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| Carrier wizard | `src/components/carrier/carrier-trip-wizard.tsx` |
| Global styles | `src/app/globals.css` |
| Tailwind config | `tailwind.config.ts` |
| Env validation | `src/lib/env.ts` |
| Notifications | `src/lib/notifications.ts` |
| Auth helpers | `src/lib/auth.ts` |
| Matching score | `src/lib/matching/score.ts` |
| DB migrations | `supabase/migrations/` |

---

## Agent Roles

See `.Codex/agents.md` for agent definitions and their exact scopes.
See `.agent-skills/` for concise domain knowledge files agents should read before working on a feature.
See `.Codex/skills/` for step-by-step runbooks for complex autonomous tasks.
