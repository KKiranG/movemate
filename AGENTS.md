# MoveMate — Universal Agent Contract

This file is the universal contract for every AI tool working in this repo — Claude Code, Codex, Antigravity, Gemini/VS Code models, Jules, and any future entrant. Auto-loaders for different tools pick up different files, so the product truth, invariants, and operating rules live here and nowhere else.

**Rule of the model:**

- A tool overlay (`CLAUDE.md`, future `GEMINI.md`, etc.) may add tool-specific workflow but may not override a universal invariant.
- If two universal rules ever conflict, the narrower-scoped rule wins until the stale one is corrected in the same task.
- If truth changed, update the relevant docs in the same work unit. Do not leave the repo with two rival constitutions.

---

## Read Order

Before any non-trivial work, read in this order:

1. [AUTHORITY.md](/Users/kiranghimire/Documents/moverrr/AUTHORITY.md) — meta-map, alias policy, reference-tree rules
2. **This file** — product truth, invariants, parallelism contract
3. The tool overlay for the tool you are running in: [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md) for Claude Code; other overlays if present
4. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md) — issue lifecycle, review pipeline, founder digest (applies to all tools despite path)
5. [.claude/lock-groups.md](/Users/kiranghimire/Documents/moverrr/.claude/lock-groups.md) — parallelism contract detail
6. Relevant `.claude/rules/**` scoped rules for the surface you are touching
7. Relevant `.agent-skills/**` domain context
8. The linked GitHub issue and the PR template

---

## Authority Order

This list is definitive. Every other authority list in the repo mirrors it.

1. Active session instructions from the human user
2. [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md) — product source of truth
3. This file (`AGENTS.md`) — universal agent contract
4. Tool overlays (`CLAUDE.md`, future `GEMINI.md`, etc.) — additive tool-specific rules only
5. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md) — live-work operating runbook
6. Relevant scoped rules, skills, and agent briefs under `.claude/**`
7. The linked GitHub issue or PR for the current work unit
8. Derived snapshots in `docs/operations/**`
9. Legacy or imported reference material

If two docs disagree at the same layer, fix the stale one in the same task.

---

## Product Truth

MoveMate is a need-first, match-ranked spare-capacity marketplace for awkward-middle moves. The customer declares a move need once. The system returns a short ranked set of route-compatible options with deterministic all-in pricing, trust signals, and clear next steps. Drivers monetize trips they are already taking through structured posting, request review, proof-backed delivery, and payout release.

MoveMate is:

- need-first
- match-ranked
- spare-capacity
- trust-first
- structured pricing / booking / proof / payout aware

MoveMate is not:

- browse-first
- a quote marketplace
- a bidding marketplace
- a dispatch layer
- a generic removalist platform
- vague "AI matching"

Priority order:

`Trust -> Simplicity -> Supply speed -> Customer clarity -> Automation -> Polish`

---

## Core Invariants

### Product shape

- Need-first beats browse-first.
- Trust is a product feature, not decoration.
- Sparse supply recovery matters as much as happy-path matching.
- Customer and driver UX are asymmetric on purpose.
- iOS-quality touch ergonomics matter even when Android compatibility must remain intact.

### Pricing

- Platform commission is 15% of `basePriceCents` only — never applied to stairs, helper, or any other add-on.
- Pricing code in `src/lib/pricing/breakdown.ts` is canonical. Blueprint §9.2 is aligned to it.
- Pricing template must support: minimum job floor per category, base price by category/variant, same-category quantity, a fixed stairs add-on, and a fixed helper add-on.
- Parking difficulty is captured as operational/fit data and is not a pricing factor.
- Detour is not a pricing factor in the MoveMate model. No detour surcharge exists. Detour tolerance is a matching and eligibility input only.
- Do not resurrect the historical flat booking-fee model. `bookingFeeCents` stays 0 unless the founder explicitly changes it.

### Booking and dispute flow

- Customer flow is `declare need -> ranked offers -> Request to Book or Fast Match -> driver decision -> proof -> confirmation -> payout release`.
- Fast Match is first-accept-wins and must revoke siblings atomically.
- One factual clarification round is allowed. One structured adjustment path is allowed for genuine mismatch.
- Payment is authorised before acceptance, captured on acceptance, and released only after confirmation or the proof-backed auto-release window.
- Proof and payout logic are trust-critical and require stronger review.

### Matching and trust

- Match ranking is deterministic and explanation-backed.
- Result cards must show why the match fits, not just a price.
- Access, stairs, helper, and parking details are matching inputs, not optional polish.
- No direct-contact or off-platform drift should appear in customer-facing flows.

### Mobile and UX

- Customer-facing quality is the highest app-level priority after repo constitution and operating-system stability.
- Tap targets must stay usable on iPhone-sized viewports.
- Sticky actions must respect safe areas.
- One clay focal point per screen; primary CTAs stay ink-led unless a component pattern explicitly says otherwise.

---

## Live Work System

GitHub is the live work system. Markdown is derived.

- Issues hold the shaped work unit.
- Labels, linked PRs, comments, and assignees hold live state.
- GitHub Project fields hold queue metadata when project scopes are available.
- `docs/operations/todolist.md` is a strategic backlog snapshot, not a claimable queue.
- `docs/operations/completed.md` is a shipping digest, not a transactional completion log.

Rules:

- No builder may claim work outside a `Ready` issue with a named lane and lock group.
- Routine implementation must not append to derived digests by hand.
- If markdown and GitHub disagree, GitHub wins and the markdown is refreshed.

---

## Bounded Parallelism Contract

Parallelism is deliberate and bounded. Always-on unbounded session sprawl is an anti-pattern.

### Lanes

- **One planning / coordinator lane** — shapes issues, grooms the backlog, writes review packets, routes work, writes founder digests.
- **Two to four builder lanes** — at most one builder per lock group, one git worktree per builder.
- **One review / ship lane** — merges PRs, runs final verification, closes issues, refreshes derived digests.
- **Optional QA / browser lane** — runs browser-driven verification, design review, or QA skills on demand. Read-heavy.

Lock groups (full detail in [`.claude/lock-groups.md`](/Users/kiranghimire/Documents/moverrr/.claude/lock-groups.md)):

- `customer-acquisition`
- `customer-booking-lifecycle`
- `carrier-activation-posting`
- `carrier-operations`
- `matching-pricing-state`
- `admin-operator`
- `system-hygiene`

Only one build agent may own one lock group at a time unless the issue is explicitly marked `Safe for parallelism: yes` and the file surfaces do not collide.

### Anti-patterns

- Self-claimed work without a shaped `Ready` issue.
- Two builders on the same lock group.
- Builders touching shared pricing, booking-state, or matching code without `Touches shared logic: yes` and coordinator approval.
- Long-running background agents that rewrite product truth.

Workflow layers that provide parallelism scaffolding (gstack, Hermes-style orchestrators, or similar) are welcome but must respect this contract.

---

## Required Issue Shape

Every build-ready issue must define:

- `Outcome`
- `Why it matters`
- `Non-goals`
- `Lane`
- `Lock Group`
- `Priority`
- `Size`
- `Risk level`
- `Files or surfaces likely touched`
- `Blocked by`
- `Safe for parallelism`
- `Touches shared logic`
- `Founder decision needed`
- `Acceptance criteria`
- `Invariants to preserve`
- `Verification`
- `Rollout / fallback`

Template: [.claude/issue-shaping-template.md](/Users/kiranghimire/Documents/moverrr/.claude/issue-shaping-template.md).

---

## Review Model

Review happens through packets, not raw diffs by default.

1. **Mechanical screen** — scope match, touched-file sanity, overlap with open PRs, lane or lock-group conflicts, invariant violations, validation credibility.
2. **Frontier adjudication** — required for pricing, booking, trust and safety, matching, migrations, and core product logic. Packet states verdict, rationale, risk, required revisions, and any founder-packet ask.
3. **Founder digest** — only when a real decision is needed.

Packet template: [.claude/review-packet-template.md](/Users/kiranghimire/Documents/moverrr/.claude/review-packet-template.md).

Packets must separate must-fix merge blockers from queueable follow-up issues. Scope drift that is real but non-blocking becomes a follow-up issue, not an ambiguous note.

---

## Verification Bar

Do not call work done without:

- the relevant checks run (`npm run check` at minimum; build or tests when they apply)
- evidence recorded (what was directly exercised, what was only spot-checked, what could not be run)
- residual risk stated plainly
- docs synced if truth changed

If verification was blocked by environment, state the exact blocker in the PR under "Residual risk."

---

## Escalation

Escalate only when the work truly needs a founder decision:

- pricing economics
- product-strategy forks
- risky migration cutovers
- legal or trust-policy changes
- cases where preserving two incompatible truths would silently ship confusion

Do not escalate routine engineering judgment, doc cleanup, or obvious stale wording.

---

## Workflow Layer

gstack is the approved workflow layer for Claude and Codex in this repo. Other tool-specific workflow layers (for example, an Antigravity-specific skill pack, or a future Hermes orchestrator) are also welcome as long as they respect this contract.

- Tool overlays list the exact approved skills and invocation conventions per tool.
- Workflow layers never overrule product truth, pricing truth, or repo invariants declared here.
- Do not vendor external workflow libraries into the repo root. Keep them as global installs or external local references.

---

## Reference And Archive Rules

- Canonical docs (this file, `AUTHORITY.md`, `movemate-product-blueprint.md`, `.claude/project-ops.md`, scoped rules, skills, linked GitHub issue) carry the truth.
- Derived snapshots stay derived. `docs/operations/**` is never a claimable queue.
- `docs/reference/**` is the only in-repo home for intentionally archived non-authoritative reference. Every addition states source, purpose, and why the canonical docs were not the right home.
- Do not vendor global tooling, local research dumps, browser exports, or machine-specific agent workspace material into the repo root.
- If reference material changes the understanding of product or workflow truth, update the canonical doc in the same work unit. Do not leave insight stranded in archive material.

---

## Durability

This contract is designed to outlast individual tool generations. When a new AI tool enters the workflow:

1. Add a thin tool overlay (e.g. `NEWTOOL.md`) that covers only tool-specific skills, commands, and routing.
2. Update `AUTHORITY.md`'s Multi-Tool Policy to list the new overlay.
3. Do not rewrite this file unless a universal invariant actually changed.
