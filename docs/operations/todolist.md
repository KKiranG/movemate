# Moverrr Active Backlog

Last reviewed: `2026-04-15` — rewritten from live Chrome testing at 606px (mobile) and 1280px (desktop) plus static codebase audit. Three bugs fixed in-session: B01 (HTML entity), C01 (nav tap target), C02 (safe-area-inset).

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

### UX / Copy

- [ ] **B01** — ~~Fix `&apos;` HTML entity rendering as literal text in hero headline~~ ✅ Fixed in-session 2026-04-15
  - **File(s):** `src/app/page.tsx:73`, `src/app/(customer)/search/page.tsx:576`
  - **What:** Hero h1 rendered "We&apos;ll" as a visible string instead of "We'll" because `&apos;` was inside a JS string literal (not a JSX element), so React passed it as raw text rather than decoding the HTML entity.
  - **Why:** Largest text on every first visit — trust-destroying first impression for all users.
  - **Done when:** `document.querySelector('h1').textContent` returns "We'll" — confirmed in Chrome after fix.

- [ ] **B02** — Replace generic `og:title: "moverrr"` with page-specific open graph titles
  - **File(s):** `src/app/layout.tsx` (default openGraph block), plus per-page `metadata` exports in `src/app/(customer)/trip/[id]/page.tsx`, `src/app/(customer)/search/page.tsx`, `src/app/(marketing)/become-a-carrier/page.tsx`
  - **What:** Every page shares to social with `og:title: "moverrr"` — the root layout sets it once and no page-level metadata overrides it. Trip and search pages generate page-specific `<title>` but not `og:title`.
  - **Why:** Social shares (WhatsApp, iMessage, Slack preview) always show "moverrr" with no context — missed acquisition signal when a user shares a specific trip or route.
  - **Done when:** Sharing `/search?from=Sydney&to=Melbourne&when=2026-04-20` produces an og:title of "Sydney to Melbourne moves · moverrr" — verified via JS meta tag check.

- [ ] **B03** — Add `og:title` template to root metadata so page titles automatically populate it
  - **File(s):** `src/app/layout.tsx`
  - **What:** Root `openGraph.title` is a static string; Next.js 14 supports `openGraph: { title: { template: '%s · moverrr', default: 'moverrr' } }` to inherit from each page's `metadata.title`.
  - **Why:** One-line fix that makes every existing page-specific title flow into og:title automatically, no per-page changes needed.
  - **Done when:** Homepage og:title is "moverrr", search result page og:title is "Sydney to Melbourne moves · moverrr" — verified via `document.querySelector('meta[property="og:title"]').content`.

### Technical Debt / Cleanup

- [ ] **A49** — Finish internal alert naming cleanup behind the compatibility layer
  - **File(s):** `src/lib/data/alerts.ts`, `src/lib/data/saved-searches.ts`, `src/app/api/alerts/route.ts`, `src/app/api/saved-searches/route.ts`, `src/app/api/saved-searches/[id]/route.ts`
  - **What:** Remove the remaining saved-search-first helper naming from the live alert flow while preserving short-term compatibility wrappers where required.
  - **Why:** User-facing alerts are already realigned, but the internal naming still leaks the old model and makes future maintenance harder.
  - **Done when:** The live alert flow is implemented through alert-native helpers and payloads, with saved-search naming limited to explicit compatibility wrappers only.

---

## 🟡 P2 — UX & Conversion

### iOS / Mobile Compliance

- [ ] **C01** — ~~Fix desktop nav link tap targets below 44px minimum~~ ✅ Fixed in-session 2026-04-15
  - **File(s):** `src/components/layout/site-header.tsx:87`
  - **What:** Desktop nav `<Link>` elements used `px-2 py-1` giving rendered height of ~28px — confirmed via tap-target JS at 606px viewport. Added `min-h-[44px]` to the className.
  - **Why:** iOS tap target contract requires ≥44px on all interactive elements.
  - **Done when:** Tap-target JS returns no violations for nav links — confirmed in Chrome after fix.

- [ ] **C02** — ~~Fix safe-area-inset applied to wrong element in carrier trip wizard fixed footer~~ ✅ Fixed in-session 2026-04-15
  - **File(s):** `src/components/carrier/carrier-trip-wizard.tsx:1014`
  - **What:** `pb-[env(safe-area-inset-bottom)]` was on the inner wrapper div, but `py-3` on the outer fixed container overrode it. Bottom buttons were clipped behind the home indicator on notched iPhones. Moved padding to the outer fixed div as `pt-3 pb-[env(safe-area-inset-bottom)]`.
  - **Why:** Carrier proof-capture and wizard navigation are in-vehicle use cases — hidden buttons are a P2 operational hazard.
  - **Done when:** On iPhone with home indicator, wizard Back/Next buttons are fully visible above the home bar.

- [ ] **C03** — Carrier trip wizard dialog/sheet missing safe-area padding on mobile
  - **File(s):** `src/components/ui/dialog.tsx`
  - **What:** Dialog uses `fixed inset-4` (16px from all edges) but has no `safe-area-inset` handling — on notched devices the dialog may overlap the Dynamic Island or home indicator at its edges.
  - **Why:** Dialogs are used in the carrier booking accept/decline flow — overlap with system UI makes buttons unreachable.
  - **Done when:** Dialog renders with at least `max(16px, env(safe-area-inset-top))` top padding and `max(16px, env(safe-area-inset-bottom))` bottom padding — confirmed on a 390px iPhone viewport.

### Copy / Trust

- [ ] **B04** — Auth pages show backend config instructions as user-facing copy
  - **File(s):** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/carrier/signup/page.tsx`
  - **What:** Login renders "Supabase email and password auth is the default for MVP, with route protection across customer, carrier, and admin flows. Login requires Supabase environment variables before it can authenticate users." — visible to all visitors when Supabase env vars are absent. Confirmed live at `http://localhost:3000/login`.
  - **Why:** Any user who tries to log in or sign up with a misconfigured or partially-deployed instance sees developer-addressed text. Destroys trust and signals an incomplete product to real users.
  - **Done when:** Login/signup pages show only a clean empty state or an "authentication unavailable" message when env is not configured — no developer instructions visible to end users.

- [ ] **B05** — "Share a trip" CTA copy is ambiguous for carriers unfamiliar with the product
  - **File(s):** `src/components/layout/site-header.tsx` (nav CTA), `src/components/layout/mobile-nav.tsx`
  - **What:** The primary carrier acquisition CTA in both desktop nav and mobile nav reads "Share a trip" — confirmed via live DOM inspection. The carrier landing page and become-a-carrier page both use "Post your first trip" or "Post a route". Inconsistent and "share" implies social sharing, not commercial capacity posting.
  - **Why:** The first word a carrier sees should match the action model ("post", "add", "list capacity") not sharing, which implies different intent. Weak CTA reduces carrier supply conversion.
  - **Done when:** Nav CTA reads "Post a trip" (or consistent with final copy decision) across header, mobile nav, and become-a-carrier page — confirmed via page text check on homepage and /become-a-carrier.

- [ ] **B06** — "corridor" jargon appears in customer-facing trip detail copy
  - **File(s):** `src/components/trip/trip-detail-summary.tsx`
  - **What:** Trip detail shows "Pickup and dropoff should sit within {trip.detourRadiusKm}km of this corridor" — "corridor" is freight/logistics jargon invisible to residential customers.
  - **Why:** Customer clarity is a product priority; "corridor" requires industry knowledge to interpret. "main route" or "planned route" communicates the same constraint without jargon.
  - **Done when:** Trip detail copy reads "within {trip.detourRadiusKm}km of the planned route" (or equivalent plain-language phrasing) — confirmed via get_page_text on a trip detail page.

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

### SEO / Discoverability

- [ ] **EP01** — Add canonical URL to search result pages with query parameters
  - **File(s):** `src/app/(customer)/search/page.tsx` (generateMetadata function)
  - **What:** Search with params (e.g. `/search?from=Sydney&to=Melbourne&when=2026-04-20&type=boxes`) currently generates a canonical pointing to the full query-param URL. Each unique route/date combo creates a new indexable URL — without a canonical strategy this creates duplicate-content risk and dilutes link equity.
  - **Why:** Sydney→Melbourne is a high-intent search term; consolidating canonical to a route-level URL (e.g. `/search?from=Sydney&to=Melbourne`) captures SEO value across all date variants.
  - **Done when:** Search result pages with date/type params emit a canonical pointing to the base route URL (from+to only) — verified via meta JS check.

- [ ] **EP02** — Add `og:image` to trip detail pages for social sharing
  - **File(s):** `src/app/(customer)/trip/[id]/opengraph-image.tsx` (already exists), `src/app/(customer)/trip/[id]/page.tsx` (generateMetadata)
  - **What:** The OG image generator file exists but og:image is not wired into generateMetadata for trip detail pages — social shares of trip URLs show no preview image.
  - **Why:** Trip sharing (carrier sharing their own posting, customer sharing a find) is a zero-cost acquisition channel — a rich preview card increases click-through.
  - **Done when:** Sharing a trip URL on iMessage or Slack shows a preview image with route and price — verified via og:image meta tag presence in generateMetadata output.

### Hardening / Edge Cases

- [ ] **R01** — Run a live env-backed release verification across the canonical request flow
  - **File(s):** `release verification only`
  - **What:** Re-run the major customer, carrier, admin, request, payment, concierge, and freshness flows against a configured Supabase/Stripe/Resend environment instead of degraded local guards only.
  - **Why:** The repo has been heavily hardened, but several checks in the recent completion runs still relied on graceful no-env behavior because credentials were not available in this worktree.
  - **Done when:** A live environment verification pass confirms the canonical request flow, concierge recovery, payout lifecycle, and freshness/suspension ops without relying on degraded local fallbacks.

---

## ⚪ P4 — Post-MVP / Deferred

No active deferred items are being carried here right now. Any future deferred work should only be re-added if it is clearly outside the MVP boundary and still worth tracking.
