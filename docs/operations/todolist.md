# MoveMate Strategic Backlog Snapshot

> Generated from GitHub on `2026-04-24T03:55:57.625Z` for `KKiranG/moverrr`.
>
> Derived artifact only. Update issues, labels, fields, and linked pull requests in GitHub instead of editing this file by hand.

---

Open issues: **27**

## State summary

- `state:ready`: 13
- `state:pr-open`: 2
- `state:needs-founder-decision`: 1
- `state:shaping`: 4
- `state:duplicate`: 1
- `state:inbox`: 6

## Open issues by state

## state:ready

### `#90` P0: /move/alert stub — zero-match recovery path does not create UnmatchedRequest
- URL: [#90](https://github.com/KKiranG/moverrr/issues/90)
- Type: `type:bug`
- Lane: `lane:ux-builder`
- State: `state:ready`
- Priority: `priority:p0`
- Size: `size:m`
- Risk: `risk:high`
- Updated: 2026-04-24
- Affected surfaces: `surface:customer-web`, `surface:api`, `surface:data`
- Linked PRs: [#93](https://github.com/KKiranG/moverrr/pull/93) (merged 2026-04-24)
- Latest activity: 2026-04-24 by KKiranG - Campaign update: this branch wires /move/alert to create real unmatched demand. - With a valid moveRequestId, the page loads the customer-owned move request and POSTs to a dedicat...

### `#63` Fast Match accept/revoke must be atomic across request groups
- URL: [#63](https://github.com/KKiranG/moverrr/issues/63)
- Type: `type:builder-task`
- Lane: `lane:backend-builder`
- State: `state:ready`
- Priority: `priority:p0`
- Size: `size:l`
- Risk: `risk:critical`
- Updated: 2026-04-24
- Affected surfaces: `surface:api`, `surface:data`, `surface:payments`
- Linked PRs: none found
- Latest activity: 2026-04-24 by KKiranG - ## Production-readiness triage addendum - Lock Group: `matching-pricing-state` - Touches shared logic: yes - Safe for parallelism: no - Rollback risk: high. This is core booking s...

### `#91` P0: /move/new/book/[offerId]/pay — Stripe placeholder, no real payment flow
- URL: [#91](https://github.com/KKiranG/moverrr/issues/91)
- Type: `type:bug`
- Lane: `lane:trust-safety`
- State: `state:ready`
- Priority: `priority:p0`
- Size: `size:m`
- Risk: `risk:critical`
- Updated: 2026-04-24
- Affected surfaces: `surface:customer-web`, `surface:api`, `surface:payments`
- Linked PRs: [#93](https://github.com/KKiranG/moverrr/pull/93) (merged 2026-04-24)
- Latest activity: 2026-04-24 by KKiranG - Campaign update: this branch removes the most dangerous part of the scaffold by disabling fake submission and replacing the visible Stripe placeholder with an explicit unavailable...

### `#82` Fix duplicate Supabase migration version prefixes
- URL: [#82](https://github.com/KKiranG/moverrr/issues/82)
- Type: `type:builder-task`
- Lane: `lane:backend-builder`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:s`
- Risk: `risk:medium`
- Updated: 2026-04-24
- Affected surfaces: `surface:data`, `surface:ops`
- Linked PRs: [#83](https://github.com/KKiranG/moverrr/pull/83) (closed)
- Latest activity: 2026-04-24 by KKiranG - ## Production-readiness triage addendum - Lock Group: `system-hygiene` - Touches shared logic: yes, but at the migration ledger level rather than app runtime - Safe for parallelis...

### `#44` Carrier auth/profile consolidation and duplicate route cleanup
- URL: [#44](https://github.com/KKiranG/moverrr/issues/44)
- Type: `type:builder-task`
- Lane: `lane:backend-builder`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:l`
- Risk: `risk:high`
- Updated: 2026-04-21
- Lock group: `carrier-activation-posting`
- Affected surfaces: `surface:carrier-web`
- Blocked by: None after PR #42 lands.
- Linked PRs: none found
- Done when:
  - Carrier auth and activation ownership is coherent.
  - Duplicate route families are removed or clearly redirected.
  - One smoke-tested happy path exists from carrier login to activation to trip posting.
- Touches shared logic: Yes
- Verification plan:
  - `npm run build`
  - carrier auth/activation smoke path
  - targeted checks around profile/session helpers
- Latest activity: No comments yet.

### `#43` Auth route hardening and suspense-safe query-param handling
- URL: [#43](https://github.com/KKiranG/moverrr/issues/43)
- Type: `type:builder-task`
- Lane: `lane:backend-builder`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Lock group: `customer-booking-lifecycle`
- Affected surfaces: `surface:customer-web`, `surface:carrier-web`
- Blocked by: None after PR #42 lands.
- Linked PRs: [#80](https://github.com/KKiranG/moverrr/pull/80) (merged 2026-04-23)
- Done when:
  - Login, signup, reset-password, and protected-route redirects are consistent.
  - Auth query-param handling is centralized or clearly bounded.
  - The affected routes pass `npm run build` and auth-focused checks.
- Touches shared logic: Yes
- Verification plan:
  - `npm run build`
  - route smoke for `/login`, `/signup`, `/reset-password`, and one protected customer/carrier route
  - targeted unit coverage for redirect guard behavior where feasible
- Latest activity: 2026-04-23 by KKiranG - Review accepted after PR #81 merged first. I refreshed this branch on top of #81/main and confirmed the only overlap keeps #81's AGENTS.md-first capability-index structure while a...

### `#67` Require owned private proof paths for booking proof uploads
- URL: [#67](https://github.com/KKiranG/moverrr/issues/67)
- Type: `type:builder-task`
- Lane: `lane:trust-safety`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:m`
- Risk: `risk:high`
- Updated: 2026-04-21
- Affected surfaces: `surface:api`, `surface:data`, `surface:payments`
- Linked PRs: none found
- Latest activity: No comments yet.

### `#64` Harden CSRF coverage for mutating authenticated API routes
- URL: [#64](https://github.com/KKiranG/moverrr/issues/64)
- Type: `type:builder-task`
- Lane: `lane:trust-safety`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:m`
- Risk: `risk:high`
- Updated: 2026-04-21
- Affected surfaces: `surface:api`
- Linked PRs: [#83](https://github.com/KKiranG/moverrr/pull/83) (closed)
- Latest activity: 2026-04-24 by KKiranG - Superseded by #84. PR #84 is a strict superset: it adds the same RLS policy but also layers an app-level booking_requests!inner carrier filter, a carrierBookingDependenciesMatch()...

### `#94` Private repo transition: lock down visibility and agent access
- URL: [#94](https://github.com/KKiranG/moverrr/issues/94)
- Type: `type:builder-task`
- Lane: `lane:deploy`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:s`
- Risk: `risk:medium`
- Updated: 2026-04-24
- Affected surfaces: `surface:ops`, `surface:github`, `surface:docs`
- Linked PRs: none found
- Latest activity: No comments yet.

### `#79` Full codebase CSS token sweep: replace raw var(--*) with design system classes
- URL: [#79](https://github.com/KKiranG/moverrr/issues/79)
- Type: `type:builder-task`
- Lane: `lane:ui-builder`
- State: `state:ready`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-23
- Linked PRs: [#80](https://github.com/KKiranG/moverrr/pull/80) (merged 2026-04-23)
- Latest activity: 2026-04-23 by KKiranG - Review accepted after PR #81 merged first. I refreshed this branch on top of #81/main and confirmed the only overlap keeps #81's AGENTS.md-first capability-index structure while a...

### `#50` Skills expansion: strengthen thin carrier-quality-review, copy-guardian, admin-queue-review, postmortem stubs
- URL: [#50](https://github.com/KKiranG/moverrr/issues/50)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- State: `state:ready`
- Priority: `priority:p2`
- Size: `size:s`
- Risk: `risk:low`
- Updated: 2026-04-21
- Affected surfaces: `surface:ops`, `surface:docs`
- Linked PRs: none found
- Latest activity: No comments yet.

### `#51` E2E test setup: Playwright smoke tests for critical customer journeys
- URL: [#51](https://github.com/KKiranG/moverrr/issues/51)
- Type: `type:builder-task`
- Lane: `lane:testing`
- State: `state:ready`
- Priority: `priority:p2`
- Size: `size:l`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Affected surfaces: `surface:customer-web`
- Linked PRs: none found
- Latest activity: No comments yet.

### `#52` Rename verify-moverrr-change skill to verify-movemate-change
- URL: [#52](https://github.com/KKiranG/moverrr/issues/52)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- State: `state:ready`
- Priority: `priority:p3`
- Size: `size:xs`
- Risk: `risk:low`
- Updated: 2026-04-21
- Affected surfaces: `surface:ops`, `surface:docs`
- Linked PRs: [#80](https://github.com/KKiranG/moverrr/pull/80) (merged 2026-04-23)
- Latest activity: 2026-04-23 by KKiranG - Review accepted after PR #81 merged first. I refreshed this branch on top of #81/main and confirmed the only overlap keeps #81's AGENTS.md-first capability-index structure while a...

## state:pr-open

### `#71` Implement minimum job floor in pricing code
- URL: [#71](https://github.com/KKiranG/moverrr/issues/71)
- Type: `type:builder-task`
- Lane: `lane:trust-safety`
- State: `state:pr-open`
- Priority: `priority:p1`
- Size: `size:s`
- Risk: `risk:medium`
- Updated: 2026-04-23
- Lock group: `matching-pricing-state`
- Affected surfaces: `surface:api`, `surface:payments`
- Blocked by: None (pricing model is resolved in #39)
- Linked PRs: [#86](https://github.com/KKiranG/moverrr/pull/86) (merged 2026-04-24)
- Touches shared logic: Yes
- Latest activity: 2026-04-23 by KKiranG - PR opened: #86. Verification: `npm run check` passed; `npm test` passed (82 passed, 2 skipped, 0 failed). Follow-up #85 captures the larger per-category carrier pricing floors wor...

### `#78` Add RLS policy + getMoveRequestByIdForCarrier to finish #66 loader decoupling
- URL: [#78](https://github.com/KKiranG/moverrr/issues/78)
- Type: `type:builder-task`
- Lane: `lane:trust-safety`
- State: `state:pr-open`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-23
- Linked PRs: [#83](https://github.com/KKiranG/moverrr/pull/83) (closed), [#80](https://github.com/KKiranG/moverrr/pull/80) (merged 2026-04-23)
- Latest activity: 2026-04-24 by KKiranG - Superseded by #84. PR #84 is a strict superset: it adds the same RLS policy but also layers an app-level booking_requests!inner carrier filter, a carrierBookingDependenciesMatch()...

## state:needs-founder-decision

### `#70` Founder decision: carrier job-type preference configuration
- URL: [#70](https://github.com/KKiranG/moverrr/issues/70)
- Type: `type:founder-decision`
- Lane: `lane:trust-safety`
- State: `state:needs-founder-decision`
- Priority: `priority:p1`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-22
- Lock group: `matching-pricing-state`
- Affected surfaces: `surface:api`
- Blocked by: None
- Linked PRs: none found
- Context: 1. What options should carriers be able to declare? E.g.: - Single-person job only (no 2-person lifts) - 2-person job only (always requires customer or second person) - Open to 1-person job, but requires helper if stair...
- Touches shared logic: Yes
- Latest activity: No comments yet.

## state:shaping

### `#89` Product decision: route-fit label language on result cards ("Direct route", km display)
- URL: [#89](https://github.com/KKiranG/moverrr/issues/89)
- Type: `type:founder-decision`
- Lane: `lane:ui-builder`
- State: `state:shaping`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-24
- Linked PRs: [#93](https://github.com/KKiranG/moverrr/pull/93) (merged 2026-04-24)
- Latest activity: No comments yet.

### `#88` Product decision: fit-confidence label copy for customer-facing result cards
- URL: [#88](https://github.com/KKiranG/moverrr/issues/88)
- Type: `type:founder-decision`
- Lane: `lane:ui-builder`
- State: `state:shaping`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-24
- Linked PRs: [#93](https://github.com/KKiranG/moverrr/pull/93) (merged 2026-04-24)
- Latest activity: No comments yet.

### `#95` Route alert compatibility cleanup: retire saved-search naming and direct trip notification path
- URL: [#95](https://github.com/KKiranG/moverrr/issues/95)
- Type: `type:builder-task`
- Lane: `lane:backend-builder`
- State: `state:shaping`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-24
- Affected surfaces: `surface:customer-web`, `surface:api`, `surface:data`, `surface:ops`
- Linked PRs: none found
- Latest activity: No comments yet.

### `#96` GitHub Project sync: remove hard-coded field IDs and sync issue-body routing fields
- URL: [#96](https://github.com/KKiranG/moverrr/issues/96)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- State: `state:shaping`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-24
- Affected surfaces: `surface:ops`, `surface:github`, `surface:docs`
- Linked PRs: none found
- Latest activity: No comments yet.

## state:duplicate

### `#56` Pay page is a stub scaffold — trust-critical checkout surface is broken
- URL: [#56](https://github.com/KKiranG/moverrr/issues/56)
- Type: `type:builder-task`
- Lane: `lane:ux-builder`
- State: `state:duplicate`
- Priority: `priority:p0`
- Size: `size:m`
- Risk: `risk:high`
- Updated: 2026-04-24
- Lock group: `customer-booking-lifecycle`
- Affected surfaces: `surface:customer-web`
- Blocked by: None currently — but requires Stripe keys to be configured.
- Linked PRs: none found
- Touches shared logic: Yes
- Verification plan:
  - End-to-end test with a Stripe test card
  - Confirm authorisation-only mode (not capture)
  - Check mobile layout at 375px
- Latest activity: 2026-04-24 by KKiranG - Marked as duplicate of #91. #91 is the shaped trust-safety P0 for the reachable pay/submitted scaffold and real Stripe authorization path. This branch removes the fake submit path...

## state:inbox

### `#72` Align bookings.ts payment capture to driver acceptance
- URL: [#72](https://github.com/KKiranG/moverrr/issues/72)
- Type: `type:builder-task`
- Lane: `lane:trust-safety`
- State: `state:inbox`
- Priority: `priority:p0`
- Size: `size:m`
- Risk: `risk:high`
- Updated: 2026-04-24
- Lock group: `matching-pricing-state`
- Affected surfaces: `surface:api`, `surface:payments`
- Blocked by: None (decision resolved in #62)
- Linked PRs: none found
- Touches shared logic: Yes
- Latest activity: 2026-04-24 by KKiranG - Campaign update: stale docs were corrected so the decision log now matches the canonical payment truth: authorize on request submission, capture on driver acceptance, payout relea...

### `#73` Verify stairs pricing is a fixed add-on in carrier posting flow
- URL: [#73](https://github.com/KKiranG/moverrr/issues/73)
- Type: `type:builder-task`
- Lane: `lane:trust-safety`
- State: `state:inbox`
- Priority: `priority:p1`
- Size: `size:s`
- Risk: `risk:medium`
- Updated: 2026-04-22
- Lock group: `matching-pricing-state`
- Affected surfaces: `surface:api`, `surface:payments`
- Blocked by: None
- Linked PRs: none found
- Touches shared logic: Yes
- Latest activity: No comments yet.

### `#92` P0: /account/profile Save button is a no-op — customers cannot update their name
- URL: [#92](https://github.com/KKiranG/moverrr/issues/92)
- Type: `type:bug`
- Lane: `lane:ui-builder`
- State: `state:inbox`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-24
- Linked PRs: [#93](https://github.com/KKiranG/moverrr/pull/93) (merged 2026-04-24)
- Latest activity: No comments yet.

### `#85` Add per-category pricing floors to carrier posting templates
- URL: [#85](https://github.com/KKiranG/moverrr/issues/85)
- Type: `type:builder-task`
- Lane: `lane:backend-builder`
- State: `state:inbox`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-23
- Affected surfaces: `surface:carrier-web`, `surface:data`
- Linked PRs: [#86](https://github.com/KKiranG/moverrr/pull/86) (merged 2026-04-24)
- Latest activity: No comments yet.

### `#66` Decouple customer and carrier request detail loaders from admin-only offer access
- URL: [#66](https://github.com/KKiranG/moverrr/issues/66)
- Type: `type:builder-task`
- Lane: `lane:backend-builder`
- State: `state:inbox`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Affected surfaces: `surface:customer-web`, `surface:carrier-web`, `surface:api`, `surface:data`
- Linked PRs: [#80](https://github.com/KKiranG/moverrr/pull/80) (merged 2026-04-23)
- Latest activity: 2026-04-23 by KKiranG - Review accepted after PR #81 merged first. I refreshed this branch on top of #81/main and confirmed the only overlap keeps #81's AGENTS.md-first capability-index structure while a...

### `#53` npm audit: review and resolve high-severity advisory violations
- URL: [#53](https://github.com/KKiranG/moverrr/issues/53)
- Type: `type:builder-task`
- Lane: `lane:performance-reliability`
- State: `state:inbox`
- Priority: `priority:p2`
- Size: `size:s`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Affected surfaces: `surface:ops`
- Linked PRs: [#83](https://github.com/KKiranG/moverrr/pull/83) (closed)
- Latest activity: 2026-04-24 by KKiranG - Superseded by #84. PR #84 is a strict superset: it adds the same RLS policy but also layers an app-level booking_requests!inner carrier filter, a carrierBookingDependenciesMatch()...
