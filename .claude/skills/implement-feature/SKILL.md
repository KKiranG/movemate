---
name: implement-feature
description: End-to-end implementation playbook for a bounded moverrr feature — schema through UI with invariant checks at each step.
when_to_use: Use when implementing a new feature after the scope is confirmed and a spec or clear task description exists. Do not use for exploratory or ambiguous tasks — run repo-explorer or spec first.
argument-hint: [feature: short description]
effort: high
---

# Implement Feature

Use `$ARGUMENTS` to name the feature being implemented.

---

## Before You Start

Confirm all of the following are true before writing a single line of code:

1. The scope is confirmed (a spec, issue, or explicit user instruction exists).
2. The feature does not contradict CLAUDE.md invariants (pricing, booking, iOS-first).
3. The MVP-BOUNDARY.md does not exclude this work.
4. You have read the relevant `.agent-skills/*.md` files for the affected domain.
5. You have checked CODEBASE-MAP.md for the relevant files to touch.

If any of these fail, stop and resolve before continuing.

---

## Implementation Sequence

Work top-down. Do not skip a layer and come back.

### Step 1 — Schema (if new data is needed)

1. Read the last migration to get the sequence number: `supabase/migrations/`.
2. Create `supabase/migrations/017_<description>.sql` (or next number).
3. New tables: `ENABLE ROW LEVEL SECURITY` immediately. Add policies before closing the file.
4. Geography columns: add a `GIST` index in the same migration.
5. Enums: add to the DB enum type; update `BookingStatus` or the domain enum in `src/types/` to match.
6. Run `supabase gen types typescript` and replace `src/types/database.ts` with the output. Never hand-edit that file.
7. Run `npm run check` — fix any TypeScript errors before moving to Step 2.

**Invariant check:** Does this table need RLS? (Answer: always yes.) Is there a GIST index if it has a geography column?

---

### Step 2 — Domain Types (if new TypeScript types are needed)

1. Open the matching file in `src/types/` (booking.ts, trip.ts, carrier.ts, etc.).
2. Add the new type or extend the existing one.
3. Do not create a new file unless the type clearly belongs to a new domain not covered by existing files.
4. Run `npm run check`.

---

### Step 3 — Data Layer

1. Open or create the relevant file in `src/lib/data/`.
2. Follow this function shape:
   ```typescript
   // 1. hasSupabaseEnv() check → graceful return for local dev
   // 2. createClient() or createAdminClient() (admin-only ops only)
   // 3. DB query with typed result
   // 4. Map result with toX() from mappers.ts
   // 5. Return typed domain object or throw AppError
   ```
3. If the query is complex or safety-critical (booking creation, capacity mutation), check whether it should be an RPC instead of inline SQL.
4. Booking creation **must** go through `create_booking_atomic` RPC — never direct INSERT.
5. Any function that changes `remaining_capacity_pct` must verify the invariant holds after the change.

**Invariant check:** Does pricing math change? If yes, stop — update `src/lib/pricing/breakdown.ts` only after explicit discussion and update `breakdown.test.ts` in the same commit.

---

### Step 4 — API Route

1. Find the right location in `src/app/api/` using CODEBASE-MAP.md.
2. Follow this route shape:
   ```typescript
   // 1. Auth check: createClient(), getUser()
   // 2. Role guard: is this carrier / customer / admin?
   // 3. Zod validation of body/params (src/lib/validation/)
   // 4. Call data layer function
   // 5. Return structured JSON or throw AppError
   ```
3. CSRF guard is enforced by `middleware.ts` for mutating routes — no need to add it manually.
4. Admin-only routes must use `createAdminClient()` and verify the user is in `getAdminEmails()`.
5. Webhook handlers must be idempotent — check for existing state before mutating.

---

### Step 5 — UI (if the feature has a customer/carrier/admin surface)

1. Identify the route group: `(customer)`, `(carrier)`, or `(admin)`.
2. Check `src/components/` for reusable components before creating new ones.
3. iOS-first checklist before marking UI done:
   - All tap targets: `min-h-[44px] min-w-[44px]`
   - Every `hover:` has an `active:` sibling
   - Sticky/fixed UI uses `env(safe-area-inset-bottom)`
   - File inputs include `image/heic,image/heif`; camera inputs use `capture="environment"`
   - Test at `375px` viewport
4. Every result card that shows a match must include a "Why this matches" explanation (match_class label or equivalent).
5. Prices shown to customers must be total all-in (base + add-ons + platform fee + GST).

---

### Step 6 — Verification

Run all of the following before calling the feature done:

```bash
npm run check
```

Then directly exercise the changed path:

- **API changes:** Call the endpoint with a valid payload, then with a missing field, then with a forbidden role.
- **Data layer:** Confirm the DB state after the operation (capacity, booking status, payout hold).
- **UI changes:** View at 375px, check tap targets, test the zero/empty state.
- **Pricing/booking changes:** Run the pricing identity test; confirm `remaining_capacity_pct` is correct before and after.

Try one adversarial input (duplicate action, stale state, wrong role, missing config).

---

## Commit Hygiene

- Commit schema + generated types together.
- Commit data layer + API route together.
- Commit UI changes separately from logic changes.
- Do not bundle unrelated fixes into the same commit.

---

## What This Skill Does Not Cover

- Pricing formula changes — require explicit founder discussion.
- New booking states — follow the checklist in CLAUDE.md § Adding a new booking state.
- New admin capabilities — run `founder-scope-check` first.
- Experiments — use `experiment-loop` skill instead.
