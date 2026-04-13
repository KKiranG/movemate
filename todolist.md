# Moverrr Active Backlog

Last reviewed: `2026-04-14`

The repo has been pushed through the major MVP realignment and release-prep hardening passes. This file now keeps only the true remaining items worth carrying forward from the previous backlog. Everything else was either completed in code, intentionally deferred beyond MVP, or superseded by the governing blueprint and subsequent implementation.

---

## 🔴 P0 — Production Blocking

### Data Model and Backend Logic

- [ ] **D09** — Finish database-native request, booking, and payment state-machine alignment
  - **File(s):** `supabase/migrations/`, `src/types/booking.ts`, `src/types/database.ts`, `src/lib/status-machine.ts`, `src/lib/data/bookings.ts`, `src/lib/data/booking-requests.ts`
  - **What:** Replace the remaining legacy database enum/state assumptions with a fully canonical request-era state model so the DB contract matches the TypeScript/request-flow contract end to end.
  - **Why:** The app now behaves mostly like the blueprint state machine, but the persistence layer still carries compatibility-era status shapes in places.
  - **Done when:** Database enums, generated types, state presenters, and write paths all use the same request-first booking and payment lifecycle without legacy translation glue.

- [ ] **D19** — Resolve duplicate migration numbering before the next schema wave
  - **File(s):** `supabase/migrations/010_capacity_recalculation.sql`, `supabase/migrations/010_saved_searches.sql`, `supabase/migrations/031_activation_trip_and_concierge_completion.sql`, `supabase/migrations/031_request_events_condition_adjustments_and_freshness_audit.sql`
  - **What:** Renumber or otherwise reconcile the duplicate migration sequence entries so future schema rollout is deterministic.
  - **Why:** The current migration directory still has duplicate `010` and `031` prefixes, which is a deployment and maintenance risk even though the local code has moved forward.
  - **Done when:** Migration ordering is unambiguous and the repo no longer carries duplicate sequence numbers.

---

## 🟠 P1 — User-Facing Bugs

### Technical Debt / Cleanup

- [ ] **A49** — Finish internal alert naming cleanup behind the compatibility layer
  - **File(s):** `src/lib/data/alerts.ts`, `src/lib/data/saved-searches.ts`, `src/app/api/alerts/route.ts`, `src/app/api/saved-searches/route.ts`, `src/app/api/saved-searches/[id]/route.ts`
  - **What:** Remove the remaining saved-search-first helper naming from the live alert flow while preserving short-term compatibility wrappers where required.
  - **Why:** User-facing alerts are already realigned, but the internal naming still leaks the old model and makes future maintenance harder.
  - **Done when:** The live alert flow is implemented through alert-native helpers and payloads, with saved-search naming limited to explicit compatibility wrappers only.

---

## 🟡 P2 — UX & Conversion

### Technical Debt / Cleanup

- [ ] **A71** — Rename listing-centric internals toward trip, offer, request, and alert language
  - **File(s):** `src/lib/data/listings.ts`, `src/lib/data/trips.ts`, `src/lib/data/mappers.ts`, `src/lib/trip-presenters.ts`, `src/types/trip.ts`
  - **What:** Continue removing listing-first architecture names where the real source of truth is now trips, offers, move requests, booking requests, and alerts.
  - **Why:** The repo’s product shape is now much closer to the governing blueprint than its oldest internal names suggest.
  - **Done when:** Core internal modules and helper boundaries no longer imply that “listing” is the primary marketplace concept except where a legacy DB table still truly requires it.

- [ ] **A72** — Finish replacing dashboard and stats language with work-queue language
  - **File(s):** `src/app/(carrier)/carrier/dashboard/page.tsx`, `src/app/(carrier)/carrier/stats/page.tsx`, `src/components/layout/page-intro.tsx`, `README.md`, repo docs touched by carrier-surface naming
  - **What:** Sweep the last carrier-facing and repo-facing references that still describe the action-led carrier surface as a dashboard or stats-led product area.
  - **Why:** The carrier experience is now operationally action-first, and the remaining wording should reinforce that consistently.
  - **Done when:** Carrier home, related docs, and helper copy all describe the surface as a work queue / carrier home, with historical stats clearly secondary.

---

## 🟢 P3 — Enhancements

### Hardening / Edge Cases

- [ ] **R01** — Run a live env-backed release verification across the canonical request flow
  - **File(s):** `release verification only`
  - **What:** Re-run the major customer, carrier, admin, request, payment, concierge, and freshness flows against a configured Supabase/Stripe/Resend environment instead of degraded local guards only.
  - **Why:** The repo has been heavily hardened, but several checks in the recent completion runs still relied on graceful no-env behavior because credentials were not available in this worktree.
  - **Done when:** A live environment verification pass confirms the canonical request flow, concierge recovery, payout lifecycle, and freshness/suspension ops without relying on degraded local fallbacks.

---

## ⚪ P4 — Post-MVP / Deferred

No active deferred items are being carried here right now. Any future deferred work should only be re-added if it is clearly outside the MVP boundary and still worth tracking.
