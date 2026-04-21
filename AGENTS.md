# MoveMate — Agent Operating Contract

MoveMate is the product. The agent operating system exists to help the product ship safely.

## Read Order

Before any non-trivial work:

1. [AUTHORITY.md](/Users/kiranghimire/Documents/moverrr/AUTHORITY.md)
2. [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md)
3. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md)
4. [.claude/lock-groups.md](/Users/kiranghimire/Documents/moverrr/.claude/lock-groups.md)
5. Relevant `.claude/rules/**`
6. Relevant `.agent-skills/**`
7. The linked GitHub issue and PR template for the exact task

## Product Truth

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
- vague “AI matching”

Priority order:

`Trust -> Simplicity -> Supply speed -> Customer clarity -> Automation -> Polish`

## Live Work System

GitHub Issues + labels + linked PRs are the authoritative live work system.

Rules:

- No builder may claim work outside a `Ready` issue with a named lane and lock group.
- Markdown backlog files are derived digests only.
- `docs/operations/todolist.md` is a strategic snapshot, not the live queue.
- `docs/operations/completed.md` is a shipping digest, not a transactional completion log.
- Routine implementation should not append to derived digests by hand.

## Lock Groups

Parallelism is based on lock groups, not priority buckets.

Current lock groups:

- `customer-acquisition`
- `customer-booking-lifecycle`
- `carrier-activation-posting`
- `carrier-operations`
- `matching-pricing-state`
- `admin-operator`
- `system-hygiene`

Only one build agent may own one lock group at a time unless `.claude/project-ops.md` explicitly marks the work safe for parallelism.

## Required Issue Shape

Every build-ready issue must define:

- outcome
- why it matters
- non-goals
- lane
- lock group
- priority
- size
- risk
- acceptance criteria
- invariants to preserve
- verification plan
- rollout or fallback notes

Use [.claude/issue-shaping-template.md](/Users/kiranghimire/Documents/moverrr/.claude/issue-shaping-template.md).

## Review Model

Review happens through packets, not raw diffs by default.

Required flow:

1. Mechanical screen
2. Frontier adjudication for pricing, booking, matching, trust, migrations, and core logic
3. Founder digest only when a real decision is needed

Use [.claude/review-packet-template.md](/Users/kiranghimire/Documents/moverrr/.claude/review-packet-template.md).

## Verification Standard

Do not call work done without:

- the relevant checks run
- evidence recorded
- residual risk stated
- docs synced if truth changed

## Imported Skill Libraries

gstack is an approved workflow dependency for this repo across Claude and Codex.

- Use gstack for browsing, QA, review, and ship loops.
- The canonical gstack rules live in [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md).
- gstack does not overrule MoveMate product truth or repo authority docs. It is the workflow layer, not the product source of truth.
- Keep gstack as a global install or external local reference, not as a repo-root source tree inside MoveMate.
