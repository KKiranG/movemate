# MVP Boundary

This file defines what is definitively in scope for the current moverrr MVP and what is explicitly deferred. Read this before implementing any new feature to avoid building outside the current product boundary.

**This is not a backlog file.** It is a scope gate. Do not add tasks here. Use `docs/operations/docs/operations/todolist.md` for backlog items.

---

## What Is In MVP

### Customer Side
- Need-declaration wizard (4 screens: Route → Item → Timing → Access)
- Match-ranked shortlist with "Why this matches" explanation per result
- Request-to-book flow (single offer)
- Fast Match: customer selects up to 3 offers; first carrier to accept wins
- Alert the Network: zero-match → customer submits UnmatchedRequest; carriers notified
- Booking management: view status, confirm receipt, raise dispute
- Review submission after delivery
- Saved searches (notify on match)

### Carrier Side
- Onboarding: profile, vehicle, documents, Stripe Connect
- Trip posting (manual and from template)
- Quick Post: repeat corridor under 30 seconds via template
- State-aware carrier home (Mode 1: Activation, Mode 2: Ready to Post, Mode 3: Active Operations)
- Booking decision cards: accept / decline / clarify
- Trip freshness check-ins (24h and 2h pings)
- Trip-day runsheet (today's pickups and deliveries in route order)
- ConditionAdjustment: structured exception when on-site mismatch discovered
- Payout via Stripe Connect

### Admin / Ops
- Booking queue management
- Payment capture (manual admin trigger)
- Dispute resolution
- Carrier verification
- Concierge Offer: founder manually fulfils an UnmatchedRequest via system entity

### Infrastructure
- Stripe payment intents + webhook
- PostGIS corridor matching with match_class labels
- RLS on all tables
- Email notifications via Resend (fire-and-forget)
- Rate limiting

---

## What Is Explicitly Out of MVP

Stop immediately and run `founder-scope-check` if a task or request drifts toward any of the following.

| Deferred feature | Why deferred |
|---|---|
| Carrier bidding for jobs | Breaks need-first model; turns into a dispatch auction |
| Customer quote collection or comparison | Turns moverrr into a quote funnel |
| Real-time GPS tracking of vehicles | High infra cost; not needed for trust at this stage |
| AI or ML ranking / opaque matching | Matching must stay deterministic and explainable |
| In-app messaging between carrier and customer | Negotiation channel — ConditionAdjustment is the structured path |
| Repeat-booking or subscription bookings | Complex capacity logic; defer until supply is stable |
| Customer price negotiation | Breaks fixed-price trust model |
| Bulk move / multi-stop coordinator | Removalist workflow — not moverrr's shape |
| Native iOS / Android app | Mobile-first web is the current platform |
| Multi-carrier convoy bookings | Scope complexity far exceeds MVP need |
| White-label or B2B accounts | No validated demand at MVP stage |
| Public carrier profiles / discovery pages | Carrier is supply, not a brand to browse |

---

## Pricing Formula Ambiguity (Pending Founder Decision)

The existing code charges 15% commission on `basePriceCents` only (not stairs/helper add-ons).
The governing blueprint describes 15% of the full subtotal including add-ons.

**No code change should be made to pricing without an explicit founder confirmation of which formula is correct.** Until that confirmation is received, the existing code behavior is canonical.

---

## When to Update This File

Update MVP-BOUNDARY.md only when the founder explicitly confirms:
- a deferred feature is now in scope, or
- a new item has been explicitly ruled out of the current product cycle.

Do not add items based on inference or backlog content alone.
