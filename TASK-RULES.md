# MoveMate Task Rules

The live task system is GitHub-first.

This file defines how shaped work enters the queue, how builders claim it, and how markdown artifacts stay derived instead of becoming transactional state.

## Authoritative Live State

Live state belongs in:

- GitHub Issues
- labels
- assignees
- linked PRs
- issue and PR comments
- GitHub Project fields when scopes are available

## Derived Artifacts

These files are snapshots and digests only:

- `docs/operations/todolist.md`
- `docs/operations/completed.md`

Hard rules:

- Do not claim work from those markdown files.
- Do not mark work done there as part of routine implementation.
- Do not use priority buckets as the concurrency model.
- If the digests are stale, sync them from GitHub instead of treating them as truth.

## Work Unit Contract

A builder-ready issue must contain:

- outcome
- why it matters
- non-goals
- lane
- lock group
- priority
- size
- risk level
- affected files or surfaces
- blocked by
- safe for parallelism
- touches shared logic
- founder decision needed
- acceptance criteria
- invariants to preserve
- verification plan
- rollout or fallback notes

Use [.claude/issue-shaping-template.md](/Users/kiranghimire/Documents/moverrr/.claude/issue-shaping-template.md).

## Lanes

Current lanes:

- `ux-builder`
- `ui-builder`
- `backend-builder`
- `trust-safety`
- `performance-reliability`
- `scout`
- `docs-sync`
- `review`
- `deploy`
- `testing`

## Lock Groups

Parallelism is controlled by lock groups.

One build agent may own one lock group at a time unless the issue explicitly says `Safe for parallelism: yes` and `.claude/lock-groups.md` says the touched surfaces do not collide.

See [.claude/lock-groups.md](/Users/kiranghimire/Documents/moverrr/.claude/lock-groups.md).

## Lifecycle

Recommended lifecycle:

`inbox -> shaping -> ready -> claimed -> in-progress -> pr-open -> needs-review -> done`

Other valid states:

- `blocked`
- `needs-founder-decision`
- `duplicate`
- `rejected`
- `deferred`

## Builder Rules

- Do not start implementation from a vague idea or an unshaped issue.
- Do not widen scope because adjacent cleanup looks tempting.
- If work changes product truth or operational truth, sync docs in the same issue or PR.
- If issue scope and touched files drift apart, stop and reshape or split the work.

## Review Packets

Every non-trivial PR should carry a review packet summary:

- verdict
- issue match
- invariant scan
- overlap scan
- scope drift check
- risk scan
- validation credibility
- founder decision needed

Use [.claude/review-packet-template.md](/Users/kiranghimire/Documents/moverrr/.claude/review-packet-template.md).

## Docs Sync Responsibility

When you change any of the following, you own the matching doc sync:

- workflow or queue rules
- product truth
- pricing, booking, payout, or dispute logic
- environment or deploy expectations
- lock-group boundaries
- review pipeline behavior

## Scheduled Agents

Scheduled or autonomous agents may:

- shape issues
- update issue comments
- generate review packets
- sync derived digests
- run allowed verification

Scheduled or autonomous agents may not:

- self-claim work outside a `Ready` issue
- change pricing economics
- make destructive git history changes
- fabricate deployment or GitHub project completion
