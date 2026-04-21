# MoveMate Strategic Backlog Snapshot

> Generated from GitHub on `2026-04-21T07:04:02.007Z` for `KKiranG/moverrr`.
>
> Derived artifact only. Update issues, labels, fields, and linked pull requests in GitHub instead of editing this file by hand.

---

Open issues: **10**

## State summary

- `state:ready`: 7
- `state:pr-open`: 1
- `state:blocked`: 1
- `state:needs-founder-decision`: 1

## Open issues by state

## state:ready

### `#45` Customer booking detail, proof, and delivered-state polish
- URL: [#45](https://github.com/KKiranG/moverrr/issues/45)
- Type: `type:builder-task`
- Lane: `lane:ux-builder`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:l`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Lock group: `customer-booking-lifecycle`
- Affected surfaces: `surface:customer-web`
- Blocked by: None after PR #42 lands.
- Linked PRs: none found
- Done when:
  - One live booking detail path feels production-ready on mobile.
  - Delivered and disputed states are understandable without support intervention.
  - The UX is verified on customer-facing critical states.
- Verification plan:
  - manual mobile smoke for booking detail states
  - `npm run build`
  - targeted route-level checks where coverage exists
- Latest activity: No comments yet.

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
- Linked PRs: none found
- Done when:
  - Login, signup, reset-password, and protected-route redirects are consistent.
  - Auth query-param handling is centralized or clearly bounded.
  - The affected routes pass `npm run build` and auth-focused checks.
- Verification plan:
  - `npm run build`
  - route smoke for `/login`, `/signup`, `/reset-password`, and one protected customer/carrier route
  - targeted unit coverage for redirect guard behavior where feasible
- Latest activity: No comments yet.

### `#48` Reference-material policy and deliberate archive rules
- URL: [#48](https://github.com/KKiranG/moverrr/issues/48)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:s`
- Risk: `risk:low`
- Updated: 2026-04-21
- Lock group: `system-hygiene`
- Affected surfaces: `surface:ops`, `surface:docs`
- Blocked by: None.
- Linked PRs: none found
- Done when:
  - The policy is stated once and mirrored in the key canonical docs.
  - There is no implication that repo-root tooling imports are normal.
- Verification plan:
  - docs cross-read for consistency
  - git status stays clean of accidental reference sprawl after cleanup
- Latest activity: No comments yet.

### `#49` Review pipeline tightening: founder digest, scope drift, and validation credibility
- URL: [#49](https://github.com/KKiranG/moverrr/issues/49)
- Type: `type:builder-task`
- Lane: `lane:review`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Lock group: `system-hygiene`
- Affected surfaces: `surface:ops`, `surface:github`, `surface:docs`
- Blocked by: GitHub Project v2 field automation remains blocked separately in #40.
- Linked PRs: none found
- Done when:
  - The review rubric is clearer in both docs and templates.
  - Follow-up capture is part of the review flow instead of an afterthought.
  - The system better separates merge blockers from queueable later work.
- Verification plan:
  - docs/template review
  - one dry-run packet against an active PR or issue
  - backlog/digest sanity check after template updates
- Latest activity: No comments yet.

### `#46` Preview/staging deploy policy and cron strategy by environment
- URL: [#46](https://github.com/KKiranG/moverrr/issues/46)
- Type: `type:builder-task`
- Lane: `lane:deploy`
- State: `state:ready`
- Priority: `priority:p1`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Lock group: `system-hygiene`
- Affected surfaces: `surface:ops`, `surface:github`
- Blocked by: Platform and credential constraints may affect the final scheduler choice.
- Linked PRs: none found
- Done when:
  - The environment model and deploy docs describe one coherent cron policy.
  - The chosen default matches actual platform capability.
  - Manual or alternative scheduler fallback is documented.
- Verification plan:
  - Vercel config review
  - deploy-docs sync check
  - one authenticated cron route smoke in non-production when secrets exist
- Latest activity: No comments yet.

### `#47` Observability follow-up: Next/Sentry instrumentation cleanup
- URL: [#47](https://github.com/KKiranG/moverrr/issues/47)
- Type: `type:builder-task`
- Lane: `lane:performance-reliability`
- State: `state:ready`
- Priority: `priority:p2`
- Size: `size:m`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Lock group: `system-hygiene`
- Affected surfaces: `surface:ops`
- Blocked by: Real Sentry credentials are still needed for full end-to-end verification.
- Linked PRs: none found
- Done when:
  - Sentry wiring follows a supported pattern.
  - Docs explain what is wired, what is optional, and what is blocked by missing secrets.
  - The main warning noise is eliminated or intentionally suppressed with justification.
- Verification plan:
  - `npm run build`
  - config review against current Next.js/Sentry conventions
  - non-secret local verification of instrumentation load path
- Latest activity: No comments yet.

## state:pr-open

### `#41` MoveMate revamp pass: repo OS, GitHub live workflow, and product hardening baseline
- URL: [#41](https://github.com/KKiranG/moverrr/issues/41)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- State: `state:pr-open`
- Priority: `priority:p0`
- Size: `size:xl`
- Risk: `risk:high`
- Updated: 2026-04-21
- Lock group: `system-hygiene`
- Affected surfaces: `surface:customer-web`, `surface:carrier-web`, `surface:ops`, `surface:github`, `surface:docs`
- Blocked by: none
- Founder decision: No founder decision needed for the revamp pass itself. Pricing economics remain frozen separately in issue #39.
- Founder decision detail: Issue #39 handles the unresolved pricing direction. Issue #40 handles GitHub Project v2 scopes.
- Linked PRs: [#42](https://github.com/KKiranG/moverrr/pull/42) (open)
- Context: The repo had conflicting operating docs, stale naming, markdown backlog drift, broken package/tooling assumptions, and partially mounted product flows. This work unifies the control plane and ships the core hardening ne...
- Done when:
  - Canonical repo docs agree on authority, lock groups, review packets, and GitHub-first live state.
  - Issue forms, PR template, label bootstrap, and backlog sync scripts are in place.
  - `docs/operations/todolist.md` and `docs/operations/completed.md` are derived from GitHub.
  - `npm run check`, `npm run test`, and `npm run build` pass.
  - Customer `/move/new` is a single MoveMate declaration surface feeding live results.
  - Key carrier activate/post/detail/runsheet routes are mounted to real data-driven surfaces.
  - Product-facing naming is aligned to MoveMate where safe.
- Safe parallelism: No. This work crosses the repo operating system, GitHub workflow, and shared product flows.
- Latest activity: No comments yet.

## state:blocked

### `#40` Ops follow-up: enable GitHub Project v2 fields once project scopes are available
- URL: [#40](https://github.com/KKiranG/moverrr/issues/40)
- Type: `type:builder-task`
- Lane: `lane:docs-sync`
- State: `state:blocked`
- Priority: `priority:p1`
- Size: `size:s`
- Risk: `risk:medium`
- Updated: 2026-04-21
- Lock group: `system-hygiene`
- Affected surfaces: `surface:ops`, `surface:github`
- Blocked by: GitHub token needs `read:project` and project-write scopes.
- Founder decision: No founder decision needed
- Linked PRs: [#42](https://github.com/KKiranG/moverrr/pull/42) (open)
- Context: The repo now uses GitHub issues, labels, linked PRs, and derived digests as the live work system. Repo auth can manage labels and issues, but current token scopes do not include project access.
- Done when:
  - GitHub Project v2 fields are created.
  - Views reflect lane, lock group, and state-based routing.
  - Project setup docs are updated with the exact applied configuration.
- Safe parallelism: Product work can continue safely while this remains blocked.
- Latest activity: No comments yet.

## state:needs-founder-decision

### `#39` Founder decision: resolve MoveMate pricing blueprint vs code
- URL: [#39](https://github.com/KKiranG/moverrr/issues/39)
- Type: `type:founder-decision`
- Lane: `lane:trust-safety`
- State: `state:needs-founder-decision`
- Priority: `priority:p0`
- Size: `size:m`
- Risk: `risk:high`
- Updated: 2026-04-21
- Lock group: `matching-pricing-state`
- Affected surfaces: `surface:payments`
- Blocked by: none
- Founder decision: Founder decision required now
- Founder decision detail: Current code is frozen as canonical for this pass. The decision needed is whether a later migration should preserve that model or intentionally change it.
- Linked PRs: [#42](https://github.com/KKiranG/moverrr/pull/42) (open)
- Context: Choose whether MoveMate should keep the current pricing implementation or move to a revised marketplace pricing model in a separate scoped change.
- Done when:
  - Founder confirms the pricing direction.
  - Follow-up implementation stays scoped to the chosen direction.
  - Canonical docs and reviewer rules are aligned.
- Safe parallelism: Other work can continue outside pricing economics, but no builder should silently change pricing rules while this decision is open.
- Latest activity: No comments yet.
