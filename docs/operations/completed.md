# MoveMate Shipping Digest

> Generated from GitHub on `2026-04-24T03:55:57.628Z` for `KKiranG/moverrr`.
>
> Derived artifact only. The durable source of truth is closed GitHub issues, merged pull requests, and their comments.

---

Closed issues: **15**
Merged pull requests: **47**

## Closed issues

### `#45` Customer booking detail, proof, and delivered-state polish
- Closed: 2026-04-23
- URL: [#45](https://github.com/KKiranG/moverrr/issues/45)
- Type: `type:builder-task`
- Lane: `lane:ux-builder`
- Closed state: `state:ready`
- Priority: `priority:p1`
- Risk: `risk:medium`
- Affected surfaces: `surface:customer-web`
- Done when:
  - One live booking detail path feels production-ready on mobile.
  - Delivered and disputed states are understandable without support intervention.
  - The UX is verified on customer-facing critical states.
- Verification plan:
  - manual mobile smoke for booking detail states
  - `npm run build`
  - targeted route-level checks where coverage exists
- Linked PRs: none found
- Latest activity: 2026-04-23 by KKiranG - Fixed in commit c193aa9. Changes: **Mobile layout**: 'At a glance' summary (total, pickup proof status, delivery proof status) now appears at the top of the page on mobile (`lg:hi...

### `#57` Carrier home: 'Demand this week' card exposes internal dev scaffold copy in production UI
- Closed: 2026-04-23
- URL: [#57](https://github.com/KKiranG/moverrr/issues/57)
- Type: `type:builder-task`
- Lane: `lane:ux-builder`
- Closed state: `state:ready`
- Priority: `priority:p1`
- Risk: `risk:low`
- Affected surfaces: `surface:carrier-web`
- Verification plan:
  - Load carrier home in ready mode and confirm card text is clean
  - \`npm run build\`
- Linked PRs: none found
- Latest activity: No comments yet.

### `#61` Stale 'moverrr' brand name appearing in customer-facing copy
- Closed: 2026-04-23
- URL: [#61](https://github.com/KKiranG/moverrr/issues/61)
- Type: `type:builder-task`
- Lane: `lane:ui-builder`
- Closed state: `state:ready`
- Priority: `priority:p1`
- Risk: `risk:low`
- Affected surfaces: `surface:customer-web`
- Verification plan:
  - \`grep -r \"moverrr\" src/\` to confirm all customer-facing instances resolved
  - Visual check of sticky CTA and bookings empty state
- Linked PRs: none found
- Latest activity: 2026-04-23 by KKiranG - Both named locations are already resolved in the current codebase: 1. `src/components/booking/sticky-booking-cta.tsx:35` — reads "Starting total incl. MoveMate charges" ✅ 2. `src/...

### `#59` Customer bottom tab bar disappears on /bookings, /alerts, /saved-searches — navigation regression
- Closed: 2026-04-23
- URL: [#59](https://github.com/KKiranG/moverrr/issues/59)
- Type: `type:builder-task`
- Lane: `lane:ux-builder`
- Closed state: `state:ready`
- Priority: `priority:p1`
- Risk: `risk:low`
- Affected surfaces: `surface:customer-web`
- Verification plan:
  - Navigate to each of the three pages in a mobile viewport
  - Confirm tab bar is visible and correct tab is active
  - \`npm run build\`
- Linked PRs: none found
- Latest activity: 2026-04-23 by KKiranG - Already fixed in the current codebase. `src/components/spec/shell-layout.tsx` line 7–15 shows `customerTabRoots` now includes `/bookings`, `/alerts`, and `/saved-searches`. The de...

### `#60` TripCard CTA button has wrong active state color — blue #0047b3 instead of brand accent
- Closed: 2026-04-23
- URL: [#60](https://github.com/KKiranG/moverrr/issues/60)
- Type: `type:builder-task`
- Lane: `lane:ui-builder`
- Closed state: `state:ready`
- Priority: `priority:p2`
- Risk: `risk:low`
- Affected surfaces: `surface:customer-web`
- Verification plan:
  - Visual check on mobile viewport: tap card and confirm orange-red pressed state
  - Grep for \`#0047b3\` to confirm no other stale occurrences
- Linked PRs: none found
- Latest activity: 2026-04-23 by KKiranG - Fixed in commit 31744d9. `trip-card.tsx` was fully rewritten — the old hard-coded `#0047b3` active state is gone. The CTA now uses the ink-led `var(--text-primary)` / `var(--bg-ba...

### `#58` Move intake form: 'Beds' category has duplicate value 'furniture' — same as Furniture tile
- Closed: 2026-04-23
- URL: [#58](https://github.com/KKiranG/moverrr/issues/58)
- Type: `type:builder-task`
- Lane: `lane:ux-builder`
- Closed state: `state:ready`
- Priority: `priority:p2`
- Risk: `risk:low`
- Affected surfaces: `surface:customer-web`
- Verification plan:
  - Manually select \"Beds\" and confirm submitted category value is distinct
  - \`npm run check\` passes
- Linked PRs: none found
- Latest activity: 2026-04-23 by KKiranG - Fixed in commit bb9f4f9 (PR #74). The Beds tile was removed from `move-intake-client.tsx` entirely — beds are covered by the Furniture category and a code comment now documents th...

### `#65` Fix logged-in unmatched-request identity in legacy search recovery path
- Closed: 2026-04-22
- URL: [#65](https://github.com/KKiranG/moverrr/issues/65)
- Type: `type:bug`
- Lane: `lane:backend-builder`
- Closed state: `state:pr-open`
- Priority: `priority:p1`
- Risk: `risk:medium`
- Affected surfaces: `surface:customer-web`, `surface:api`, `surface:data`
- Linked PRs: [#76](https://github.com/KKiranG/moverrr/pull/76) (merged 2026-04-22)
- Latest activity: 2026-04-22 by KKiranG - PR opened: #76\n\nThis issue is now bundled in the review branch . Checks run for the bundle: > moverrr@0.1.0 build > next build ▲ Next.js 14.2.35 - Experiments (use with caution)...

### `#46` Preview/staging deploy policy and cron strategy by environment
- Closed: 2026-04-22
- URL: [#46](https://github.com/KKiranG/moverrr/issues/46)
- Type: `type:builder-task`
- Lane: `lane:deploy`
- Closed state: `state:pr-open`
- Priority: `priority:p1`
- Risk: `risk:medium`
- Affected surfaces: `surface:ops`, `surface:github`
- Done when:
  - The environment model and deploy docs describe one coherent cron policy.
  - The chosen default matches actual platform capability.
  - Manual or alternative scheduler fallback is documented.
- Verification plan:
  - Vercel config review
  - deploy-docs sync check
  - one authenticated cron route smoke in non-production when secrets exist
- Linked PRs: [#76](https://github.com/KKiranG/moverrr/pull/76) (merged 2026-04-22)
- Latest activity: 2026-04-22 by KKiranG - PR opened: #76\n\nThis issue is now bundled in the review branch . Checks run for the bundle: > moverrr@0.1.0 build > next build ▲ Next.js 14.2.35 - Experiments (use with caution)...

### `#47` Observability follow-up: Next/Sentry instrumentation cleanup
- Closed: 2026-04-22
- URL: [#47](https://github.com/KKiranG/moverrr/issues/47)
- Type: `type:builder-task`
- Lane: `lane:performance-reliability`
- Closed state: `state:pr-open`
- Priority: `priority:p2`
- Risk: `risk:medium`
- Affected surfaces: `surface:ops`
- Done when:
  - Sentry wiring follows a supported pattern.
  - Docs explain what is wired, what is optional, and what is blocked by missing secrets.
  - The main warning noise is eliminated or intentionally suppressed with justification.
- Verification plan:
  - `npm run build`
  - config review against current Next.js/Sentry conventions
  - non-secret local verification of instrumentation load path
- Linked PRs: [#76](https://github.com/KKiranG/moverrr/pull/76) (merged 2026-04-22)
- Latest activity: 2026-04-22 by KKiranG - PR opened: #76\n\nThis issue is now bundled in the review branch . Checks run for the bundle: > moverrr@0.1.0 build > next build ▲ Next.js 14.2.35 - Experiments (use with caution)...

### `#48` Reference-material policy and deliberate archive rules
- Closed: 2026-04-22
- URL: [#48](https://github.com/KKiranG/moverrr/issues/48)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- Closed state: `state:pr-open`
- Priority: `priority:p1`
- Risk: `risk:low`
- Affected surfaces: `surface:ops`, `surface:docs`
- Done when:
  - The policy is stated once and mirrored in the key canonical docs.
  - There is no implication that repo-root tooling imports are normal.
- Verification plan:
  - docs cross-read for consistency
  - git status stays clean of accidental reference sprawl after cleanup
- Linked PRs: [#76](https://github.com/KKiranG/moverrr/pull/76) (merged 2026-04-22)
- Latest activity: 2026-04-22 by KKiranG - PR opened: #76\n\nThis issue is now bundled in the review branch . Checks run for the bundle: > moverrr@0.1.0 build > next build ▲ Next.js 14.2.35 - Experiments (use with caution)...

### `#49` Review pipeline tightening: founder digest, scope drift, and validation credibility
- Closed: 2026-04-22
- URL: [#49](https://github.com/KKiranG/moverrr/issues/49)
- Type: `type:builder-task`
- Lane: `lane:review`
- Closed state: `state:pr-open`
- Priority: `priority:p1`
- Risk: `risk:medium`
- Affected surfaces: `surface:ops`, `surface:github`, `surface:docs`
- Done when:
  - The review rubric is clearer in both docs and templates.
  - Follow-up capture is part of the review flow instead of an afterthought.
  - The system better separates merge blockers from queueable later work.
- Verification plan:
  - docs/template review
  - one dry-run packet against an active PR or issue
  - backlog/digest sanity check after template updates
- Linked PRs: [#76](https://github.com/KKiranG/moverrr/pull/76) (merged 2026-04-22)
- Latest activity: 2026-04-22 by KKiranG - PR opened: #76\n\nThis issue is now bundled in the review branch . Checks run for the bundle: > moverrr@0.1.0 build > next build ▲ Next.js 14.2.35 - Experiments (use with caution)...

### `#62` Founder decision: resolve payment capture timing truth across blueprint, rules, and code
- Closed: 2026-04-22
- URL: [#62](https://github.com/KKiranG/moverrr/issues/62)
- Type: `type:founder-decision`
- Lane: `lane:trust-safety`
- Closed state: `state:needs-founder-decision`
- Priority: `priority:p0`
- Risk: `risk:high`
- Affected surfaces: `surface:api`, `surface:payments`, `surface:docs`
- Linked PRs: [#74](https://github.com/KKiranG/moverrr/pull/74) (merged 2026-04-22)
- Latest activity: 2026-04-22 by KKiranG - Closing as resolved.

### `#39` Founder decision: resolve MoveMate pricing blueprint vs code
- Closed: 2026-04-22
- URL: [#39](https://github.com/KKiranG/moverrr/issues/39)
- Type: `type:founder-decision`
- Lane: `lane:trust-safety`
- Closed state: `state:needs-founder-decision`
- Priority: `priority:p0`
- Risk: `risk:high`
- Affected surfaces: `surface:payments`
- Linked PRs: [#74](https://github.com/KKiranG/moverrr/pull/74) (merged 2026-04-22), [#42](https://github.com/KKiranG/moverrr/pull/42) (merged 2026-04-21)
- Latest activity: 2026-04-22 by KKiranG - Closing as resolved.

### `#40` Ops follow-up: enable GitHub Project v2 fields once project scopes are available
- Closed: 2026-04-21
- URL: [#40](https://github.com/KKiranG/moverrr/issues/40)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- Closed state: `state:blocked`
- Priority: `priority:p1`
- Risk: `risk:medium`
- Affected surfaces: `surface:ops`, `surface:github`
- Context: The repo now uses GitHub issues, labels, linked PRs, and derived digests as the live work system. Repo auth can manage labels and issues, but current token scopes do not include project access.
- Done when:
  - GitHub Project v2 fields are created.
  - Views reflect lane, lock group, and state-based routing.
  - Project setup docs are updated with the exact applied configuration.
- Linked PRs: [#54](https://github.com/KKiranG/moverrr/pull/54) (merged 2026-04-21), [#42](https://github.com/KKiranG/moverrr/pull/42) (merged 2026-04-21)
- Latest activity: 2026-04-21 by KKiranG - Updated: two additional commits pushed to this branch. **49c45ae** — Fixed `--single-select-option` → `--single-select-options` flag (all 9 single-select fields now create correct...

### `#41` MoveMate revamp pass: repo OS, GitHub live workflow, and product hardening baseline
- Closed: 2026-04-21
- URL: [#41](https://github.com/KKiranG/moverrr/issues/41)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- Closed state: `state:pr-open`
- Priority: `priority:p0`
- Risk: `risk:high`
- Affected surfaces: `surface:customer-web`, `surface:carrier-web`, `surface:ops`, `surface:github`, `surface:docs`
- Context: The repo had conflicting operating docs, stale naming, markdown backlog drift, broken package/tooling assumptions, and partially mounted product flows. This work unifies the control plane and ships the core hardening ne...
- Done when:
  - Canonical repo docs agree on authority, lock groups, review packets, and GitHub-first live state.
  - Issue forms, PR template, label bootstrap, and backlog sync scripts are in place.
  - `docs/operations/todolist.md` and `docs/operations/completed.md` are derived from GitHub.
  - `npm run check`, `npm run test`, and `npm run build` pass.
  - Customer `/move/new` is a single MoveMate declaration surface feeding live results.
  - Key carrier activate/post/detail/runsheet routes are mounted to real data-driven surfaces.
  - Product-facing naming is aligned to MoveMate where safe.
- Linked PRs: [#42](https://github.com/KKiranG/moverrr/pull/42) (merged 2026-04-21)
- Latest activity: No comments yet.

## Merged PRs without linked issues

### `#87` feat: carrier-side UX/UI pass
- Merged: 2026-04-24
- URL: [#87](https://github.com/KKiranG/moverrr/pull/87)
- Branch: `claude/inspiring-shamir-a50b01` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#84` Fix carrier request boundaries and verification guards
- Merged: 2026-04-24
- URL: [#84](https://github.com/KKiranG/moverrr/pull/84)
- Branch: `codex/autoplan-risk-split-followup` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#81` refactor: AGENTS.md as universal contract; CLAUDE.md as thin overlay
- Merged: 2026-04-23
- URL: [#81](https://github.com/KKiranG/moverrr/pull/81)
- Branch: `refactor/agents-universal-contract` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: 2026-04-23 by KKiranG - Review accepted. I fixed the stale Operations Docs Check expectations so they match the new AGENTS.md-first authority model, then verified: local operations-docs snippet check, np...

### `#77` refactor: restructure repo control plane as multi-tool agent OS
- Merged: 2026-04-23
- URL: [#77](https://github.com/KKiranG/moverrr/pull/77)
- Branch: `refactor/repo-control-plane-os` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#75` Update booking flow and offer detail hierarchy
- Merged: 2026-04-22
- URL: [#75](https://github.com/KKiranG/moverrr/pull/75)
- Branch: `codex/continue-repo-alignment` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: 2026-04-22 by KKiranG - **Review fix pushed.** Found one functional bug: `listUnmatchedRequestsForCustomer(userId)` was being called with the auth user ID but the function expects the marketplace custome...

### `#69` Fix logged-in unmatched request identity
- Merged: 2026-04-22
- URL: [#69](https://github.com/KKiranG/moverrr/pull/69)
- Branch: `codex/plan-backend-trustflow-audit` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#68` Redesign homepage, carrier home, and CTA system to ink-led design
- Merged: 2026-04-22
- URL: [#68](https://github.com/KKiranG/moverrr/pull/68)
- Branch: `claude/pensive-cartwright-968cef` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#55` Harden booking detail access for customer bookings
- Merged: 2026-04-21
- URL: [#55](https://github.com/KKiranG/moverrr/pull/55)
- Branch: `codex/customer-booking-trust-hardening` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#38` Refactor frontend to align with the new design system
- Merged: 2026-04-19
- URL: [#38](https://github.com/KKiranG/moverrr/pull/38)
- Branch: `codex/claude-redesign` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#23` 🛡️ Sentinel: [HIGH] Fix Open Redirect in Login Flow
- Merged: 2026-04-19
- URL: [#23](https://github.com/KKiranG/moverrr/pull/23)
- Branch: `fix/open-redirect-login-10933400290742646249` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#36` Finish concierge activation and release prep
- Merged: 2026-04-13
- URL: [#36](https://github.com/KKiranG/moverrr/pull/36)
- Branch: `codex/mvp-completion-run` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#35` Finish MVP request ops and alert cleanup
- Merged: 2026-04-13
- URL: [#35](https://github.com/KKiranG/moverrr/pull/35)
- Branch: `codex/mvp-completion-run` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#34` Align pricing surfaces and add proof metadata and trip freshness enforcement
- Merged: 2026-04-13
- URL: [#34](https://github.com/KKiranG/moverrr/pull/34)
- Branch: `codex/customer-payments-admin-ops` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#33` Add customer payment setup and admin ops queues
- Merged: 2026-04-13
- URL: [#33](https://github.com/KKiranG/moverrr/pull/33)
- Branch: `codex/customer-payments-admin-ops` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#32` Continue customer request and recovery flows
- Merged: 2026-04-13
- URL: [#32](https://github.com/KKiranG/moverrr/pull/32)
- Branch: `codex/customer-request-continuity` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#31` Realign move requests and carrier request flows
- Merged: 2026-04-13
- URL: [#31](https://github.com/KKiranG/moverrr/pull/31)
- Branch: `codex/request-flow-realignment` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#28` Realign customer request flow and vocabulary
- Merged: 2026-04-12
- URL: [#28](https://github.com/KKiranG/moverrr/pull/28)
- Branch: `codex/blueprint-vocabulary-realignment` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#27` add agentic scaffolding: codebase map, MVP boundary, decision log, implementation skills
- Merged: 2026-04-12
- URL: [#27](https://github.com/KKiranG/moverrr/pull/27)
- Branch: `claude/agentic-scaffolding` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#26` align docs to need-first, match-ranked governing blueprint
- Merged: 2026-04-12
- URL: [#26](https://github.com/KKiranG/moverrr/pull/26)
- Branch: `claude/wonderful-payne` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#21` 🎨 Palette: Add loading spinner to login button
- Merged: 2026-04-09
- URL: [#21](https://github.com/KKiranG/moverrr/pull/21)
- Branch: `palette/login-spinner-2192493231396016864` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#22` ⚡ Bolt: Prevent redundant base queries in carrier dashboard
- Merged: 2026-04-09
- URL: [#22](https://github.com/KKiranG/moverrr/pull/22)
- Branch: `bolt-optimize-dashboard-queries-4400613408832430802` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#20` PR 10: harden carrier activation, search truth, and ops surfaces
- Merged: 2026-04-09
- URL: [#20](https://github.com/KKiranG/moverrr/pull/20)
- Branch: `codex/pr10-carrier-search-ops-hardening` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#19` claude 10: Agentic Development System — Infrastructure Backlog
- Merged: 2026-04-09
- URL: [#19](https://github.com/KKiranG/moverrr/pull/19)
- Branch: `claude/blissful-dewdney` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#18` 🧪 [Testing Improvement] Add tests for Stripe payment capture error handling
- Merged: 2026-04-09
- URL: [#18](https://github.com/KKiranG/moverrr/pull/18)
- Branch: `testing-payment-capture-failure-5634615360046744516` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#17` 🧪 Test error handling when retrieving Stripe payment intent
- Merged: 2026-04-08
- URL: [#17](https://github.com/KKiranG/moverrr/pull/17)
- Branch: `test-stripe-payment-intent-error-handling-12020301970794073655` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#16` ⚡ Optimize bulk verification fetch requests using Promise.all
- Merged: 2026-04-08
- URL: [#16](https://github.com/KKiranG/moverrr/pull/16)
- Branch: `perf/optimize-bulk-verification-877506867800733180` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#15` 🧪 testing improvement for src/lib/utils.ts formatting functions
- Merged: 2026-04-08
- URL: [#15](https://github.com/KKiranG/moverrr/pull/15)
- Branch: `testing-improvement-utils-5865401153341313659` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#14` 🔒 Fix insecure Idempotency-Key generation in booking form
- Merged: 2026-04-08
- URL: [#14](https://github.com/KKiranG/moverrr/pull/14)
- Branch: `fix-booking-idempotency-key-vuln-8649890341728551626` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#10` 🎨 Palette: Small accessibility polish (Focus states and aria labels)
- Merged: 2026-04-08
- URL: [#10](https://github.com/KKiranG/moverrr/pull/10)
- Branch: `fix/a11y-improvements-14873934033261919202` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#12` ⚡ [performance improvement] Concurrent Stale Bookings Expiry
- Merged: 2026-04-08
- URL: [#12](https://github.com/KKiranG/moverrr/pull/12)
- Branch: `perf-concurrency-stale-bookings-expiry-3176429054050442410` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#11` 🔒 [security fix] Constant-time comparison for bootstrap secret
- Merged: 2026-04-08
- URL: [#11](https://github.com/KKiranG/moverrr/pull/11)
- Branch: `fix-timing-attack-secret-comparison-7191912254029288935` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#9` PR 9: harden agent OS and task system
- Merged: 2026-04-08
- URL: [#9](https://github.com/KKiranG/moverrr/pull/9)
- Branch: `codex/pr9-agent-os-hardening` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#8` [codex] finish parallel backlog wave
- Merged: 2026-04-08
- URL: [#8](https://github.com/KKiranG/moverrr/pull/8)
- Branch: `codex/parallel-backlog-wave` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#7` [codex] Frontier Block 2: proof packs, safety policy, carrier ops, and nudges
- Merged: 2026-04-08
- URL: [#7](https://github.com/KKiranG/moverrr/pull/7)
- Branch: `codex/frontier-block-2-proof-safety-nudges` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#6` [codex] implement frontier operating system and trust sweep
- Merged: 2026-04-02
- URL: [#6](https://github.com/KKiranG/moverrr/pull/6)
- Branch: `codex/frontier-agentic-airbnb-airtasker-lesson-update` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#5` [codex] overhaul agent docs and project memory
- Merged: 2026-04-01
- URL: [#5](https://github.com/KKiranG/moverrr/pull/5)
- Branch: `codex/md-improvements` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#4` [codex] Implement backlog pass 2
- Merged: 2026-04-01
- URL: [#4](https://github.com/KKiranG/moverrr/pull/4)
- Branch: `codex/Backlog-2` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#3` [codex] Publish P0-P3 backlog implementation
- Merged: 2026-04-01
- URL: [#3](https://github.com/KKiranG/moverrr/pull/3)
- Branch: `codex/p0-p3-backlog-publish` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#2` [codex] Add 15-task marketplace improvements
- Merged: 2026-03-31
- URL: [#2](https://github.com/KKiranG/moverrr/pull/2)
- Branch: `codex/15tasks` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.

### `#1` Add agent guidance, skills, and iOS-first design enforcement
- Merged: 2026-03-31
- URL: [#1](https://github.com/KKiranG/moverrr/pull/1)
- Branch: `claude/trusting-sutherland` -> `main`
- Author: KKiranG
- Labels: none
- Latest activity: No comments yet.
