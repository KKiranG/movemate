# Architecture Decision Log

Decisions that are already settled. Read this before proposing architectural changes. If a decision here blocks your task, surface it to the founder — do not silently override it.

Format: `[DATE] — Decision — Rationale — Status`

---

## Product Model

**[2025-Q4] — Need-first, match-ranked model over browse-first catalogue**
Carriers post real spare capacity. Customers declare a specific move need via a short wizard. The system matches and returns a confidence-ranked shortlist. Customers do not browse an open inventory of trips.
Rationale: Browse-first turns moverrr into a trip catalogue; customers cannot self-serve matching complex item+route+timing constraints.
Status: Settled. Governs all UI, matching, and copy decisions.

**[2025-Q4] — No carrier bidding**
Price is fixed at the time of posting. Carriers do not bid on customer requests.
Rationale: Bidding creates auction dynamics that erode carrier trust and complicate the savings story.
Status: Settled. Hard rejection in founder-scope-check.

**[2025-Q4] — No freeform customer-carrier messaging**
Communication is mediated through structured flows: booking requests, ConditionAdjustment (predefined reasons/amounts), clarify action on booking decisions.
Rationale: Open messaging becomes a negotiation channel and breaks the fixed-price trust model.
Status: Settled.

---

## Booking + Payments

**[2025-Q4] — Booking creation via `create_booking_atomic` RPC only**
Customer-facing booking creation must go through the `create_booking_atomic` Postgres RPC. No direct INSERT to the bookings table.
Rationale: Atomicity — capacity decrement and booking record creation must be a single transaction. Prior direct-insert bugs caused overselling.
Status: Settled. Enforced via CLAUDE.md invariant.

**[2025-Q4] — Commission applies to `basePriceCents` only**
The 15% platform commission is calculated on the base fare only, never on stairs fees or helper fees.
Rationale: Customers should not be charged a commission on optional services they chose to add. Carrier quote equity.
Status: Settled for current code. The governing blueprint describes 15% of full subtotal — this is an **unresolved conflict** that needs a founder decision before any code change.
See: MVP-BOUNDARY.md § Pricing Formula Ambiguity.

**[2025-Q4] — Manual payment capture by admin**
Stripe payment intents are authorised at booking creation but not captured until admin manually triggers capture. Capture happens after delivery confirmation.
Rationale: Human review before money moves. Disputes can be raised between delivery and capture.
Status: Settled. Admin capture route: `POST /api/admin/bookings/[id]/capture`.

**[2025-Q4] — Payout held until delivery confirmed**
Carrier payout is not released until the customer confirms receipt (or a timeout passes). Disputes pause the payout hold.
Status: Settled. See `src/lib/data/bookings.ts`.

---

## Matching

**[2025-Q4] — Polyline corridor matching, not city-to-city labels**
Matching is based on the carrier's route polyline plus a tolerance radius. No city or suburb label matching.
Rationale: City labels are too coarse for real corridor capacity. A Sydney→Newcastle carrier may pass through suburban routes.
Default tolerance bands: local ≤40km = 5km, regional 41-150km = 10km, intercity 150+ km = 20km.
Status: Settled. See `.agent-skills/MATCHING-ENGINE.md`.

**[2025-Q4] — Deterministic, explainable matching only**
No AI ranking, no learned weights, no opaque scoring. Every result has a `match_class` label from a fixed enum and a human-readable explanation generated from a deterministic template.
Rationale: Carriers and customers must be able to understand why a match appeared. Trust requires transparency.
Status: Settled. Hard rejection in founder-scope-check.

**[2025-Q4] — Ranking weights are product-defined constants**
Route-fit 30%, Time-fit 25%, Fit-confidence 20%, Trust 15%, Price 10%.
These weights are explicit constants, not trained parameters.
Status: Settled. Subject to product-level experiment only, not code-level tuning.

---

## Infrastructure

**[2025-Q4] — RLS on every table, no exceptions**
Every Supabase table must have Row Level Security enabled and explicit policies. `createAdminClient()` bypasses RLS for admin-only operations only.
Rationale: Defense in depth. A leaked client key should not expose all user data.
Status: Settled. Enforced via CLAUDE.md invariant and supabase-schema.md rule.

**[2025-Q4] — `hasSupabaseEnv()` graceful fallback for local dev**
Data layer functions return empty arrays or null rather than throwing when Supabase env is missing. This is intentional for local development without a full env setup.
Rationale: Onboarding cost. New developers should be able to run the app locally without all credentials.
Status: Settled. Do not remove these fallbacks; they are not bugs.

**[2025-Q4] — Email sending is fire-and-forget**
`src/lib/notifications.ts` sends email via Resend. Email failure must never block the critical booking or payment path.
Rationale: Resend availability is not a booking invariant. Email is a side effect, not a dependency.
Status: Settled. Enforced via CLAUDE.md invariant.

**[2025-Q4] — Mobile-first web app, not native iOS app**
moverrr is a mobile-first web application. All iOS-specific UX rules (44px targets, HEIC, safe-area, capture=environment) apply to the web app.
Note: Earlier docs described moverrr as "an iOS native app." This was corrected during the 2025-Q4 doc realignment. The product is and has always been a web app.
Status: Settled.

---

## Documentation

**[2025-Q4] — `src/types/database.ts` is auto-generated, never hand-edited**
Regenerate with `supabase gen types typescript` after every migration. Commits to this file that are not from the generator are incorrect.
Status: Settled.

**[2025-Q4] — Migrations are sequential and never reordered**
Files in `supabase/migrations/` are named `NNN_description.sql`. Numbers are never reused, gaps are not created, and existing migrations are never modified after they have been applied to any environment.
Status: Settled. Next migration: `017_`.

---

## How to Use This Log

- **Before proposing an architectural change:** check this log first. If the decision is already settled, surface it to the founder rather than overriding it.
- **When a new settled decision is reached:** add it here in the same task (do not let it drift into undocumented convention).
- **When a prior decision is overturned:** update the entry's status to `Superseded by [decision date]` and add the new decision as a fresh entry.
