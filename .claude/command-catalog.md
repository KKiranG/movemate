# MoveMate Command Catalog

Use this file as the discoverable index of repeatable repo workflows.

## Core Commands

- `npm run check`
  Required baseline verification for meaningful changes.
- `npm run test`
  Unit and regression coverage under `src/lib/__tests__/`.
- `npm run webhook:replay -- <fixture-path> [--booking-id=<id>]`
  Replay a known Stripe payment-intent sequence through the local webhook handler logic.
- `npm run supabase:db:push`
  Push sequential local migrations.
- `npm run supabase:db:reset`
  Reset local DB when migration verification needs a clean state.

## Workflow Skills

- `verify-movemate-change`
  Final evidence-led verification pass.
- `verify-web-ui`
  375px and touch-state focused verification.
- `verify-api`
  Route and error-contract verification.
- `verify-admin-ops`
  Admin queue, disputes, payouts, and ops validation.
- `release-readiness`
  Final ship gate for docs, flows, and open risks.
- `dispute-resolution-audit`
  Dispute and proof-specific review loop.
- `saved-search-demand-review`
  Turn no-result demand into supply and copy actions.
- `carrier-quality-review`
  Audit listing quality and trust weakness.
- `admin-queue-review`
  Daily or weekly founder ops scan.
- `metrics-review`
  Turn metrics into decisions.
- `copy-guardian`
  Catch wedge drift in product language.
- `postmortem`
  Action-oriented incident review.
- `experiment-design`
  Baseline-first experiment setup.
- `chrome-qa-tester`
  Browser-driven QA that turns findings into precise backlog items.
- `monthly-memory-refactor`
  Read-only docs and instruction drift audit before cleanup work.
- `write-task`
  Draft or sharpen backlog items using the house format before any append.
- `fix-issue`
  Issue → thesis check → implement → verify → PR workflow.
- `spec`
  Interview-first feature spec that produces `SPEC.md` before implementation starts.
- `review-pr`
  Structured PR review against moverrr invariants, trust copy, iOS contract, and verification evidence.
- `session-start`
  Session kickoff that loads top backlog item, recent git state, and relevant memory before coding.

## Worktree Commands

- `git worktree list` — list all active worktrees
- `git worktree add .claude/worktrees/<name> -b <branch>` — create a new worktree
- `git worktree remove .claude/worktrees/<name>` — remove a worktree
- `git worktree prune` — clean up stale worktree refs

Naming: `docs/<slug>`, `research/<slug>`, `feature/<slug>`, `verify/<slug>`, `fix/<slug>`

## Semantics

- read-only
  Exploration and audit only.
- verification-only
  No implementation; prove or disprove behavior.
- release-sensitive
  Affects deployment confidence or production trust.
- destructive
  Changes git, data, or environment state and requires extra caution.
