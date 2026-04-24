# MoveMate Project Ops

This is the canonical repo operating-system doc for live work, concurrency, review, and founder-facing reporting.

## Purpose

MoveMate should be executable by shaped issues and bounded reviewers, not by repeated prompting or markdown guesswork. The work unit must carry enough structure that smaller builders can act safely and reviewers can adjudicate without re-deriving product truth every time.

The workflow layer is replaceable. gstack, Hermes, Codex/Claude subagents, Jules, Gemini/Antigravity, or future tools may execute this operating model, but none of them own product truth, issue authority, lock groups, or verification policy.

## Authority Mirror

Authority order matches [AUTHORITY.md](/Users/kiranghimire/Documents/moverrr/AUTHORITY.md):

1. Active session instructions
2. `movemate-product-blueprint.md`
3. `AGENTS.md` (universal agent contract)
4. Tool overlays (`CLAUDE.md`, future `GEMINI.md`, etc.) — additive only
5. this file (`.claude/project-ops.md`)
6. relevant rules and skills under `.claude/**`
7. linked GitHub issue
8. derived digests
9. legacy references

## Live Work System

GitHub is authoritative for live state.

Use:

- issues for work units
- labels for routing and state
- linked PRs for execution history
- comments for review packets, blockers, and follow-up evidence
- project fields for queue metadata when GitHub project scopes are available

Markdown files under `docs/operations/` are derived digests only.

## Lane Model

Use one primary lane per issue:

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

If work spans multiple lanes, pick the owning lane and record the others in the issue body instead of adding ambiguity.

## Lock Groups

Lock groups are the parallelism contract. See [.claude/lock-groups.md](/Users/kiranghimire/Documents/moverrr/.claude/lock-groups.md).

Minimum issue fields:

- `Lock Group`
- `Safe for parallelism`
- `Touches shared logic`

If shared logic is touched, default to `Safe for parallelism: no`.

## Required Issue Fields

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
- `Rollback risk`

## Issue Lifecycle

Use this progression:

1. `inbox`
2. `shaping`
3. `ready`
4. `claimed`
5. `in-progress`
6. `pr-open`
7. `needs-review`
8. `done`

Resolution-only states:

- `blocked`
- `needs-founder-decision`
- `duplicate`
- `rejected`
- `deferred`

## Claim Rules

- Builders may only claim `ready` issues.
- An issue is not ready without lane + lock group + verification plan.
- Only one builder owns a lock group at a time unless the issue explicitly says parallel-safe and the file surfaces do not collide.
- If the issue grows into two independent work units, split it before implementation continues.

## Worker Handoff Packet

Use this shape when a coordinator delegates implementation to another model or tool:

- `Intent`
- `Why it matters`
- `Exact scope`
- `Likely files / surfaces`
- `Non-goals`
- `Product invariants`
- `Lock Group`
- `Touches shared logic`
- `Safe for parallelism`
- `Validation commands`
- `Expected output`
- `Stop conditions`

Subagents and external tools are workers, not product authority. They should return concise evidence-backed summaries and list any files they changed.

## Scout / Audit Packet

Use this shape for read-heavy discovery that should not mutate code:

- `Question to answer`
- `Surfaces inspected`
- `Evidence found`
- `Contradictions or risks`
- `Existing issues / PRs that already cover it`
- `Recommended action`
- `New issue needed: yes / no`

Scouts may inspect across lock groups, but should not edit across them.

## Review Pipeline

### Daily Review Loop

Run this at the start of a serious autonomous work session or daily review lane:

1. List open PRs and issues marked `state:pr-open`, `state:needs-review`, `state:blocked`, and `state:needs-founder-decision`.
2. Run mechanical screening before any product judgment.
3. Classify each item as `merge-candidate`, `needs-revision`, `duplicate`, `blocked`, `needs-founder-decision`, or `reject`.
4. Send only true product/business tradeoffs to founder review; do not ask the founder to inspect raw diffs by default.

### Pass 1 — Mechanical Screening

Check:

- issue/PR scope match
- touched files versus intended surfaces
- overlap with open PRs
- lane or lock-group conflicts
- invariant violations
- validation credibility

Outcomes:

- `merge-candidate`
- `needs-revision`
- `duplicate`
- `blocked`
- `needs-founder-decision`
- `reject`

### Pass 2 — Frontier adjudication

Required for:

- pricing
- booking
- trust and safety
- matching
- migrations
- core product logic

Packet must state:

- verdict
- rationale
- explicit risk
- required revisions or founder packet

Review packets must also separate:

- must-fix blockers that stop merge now
- queueable follow-up issues that should not be smuggled into the current PR

If scope drift is real but non-blocking, capture it as a follow-up issue or explicit queue item instead of leaving it as an ambiguous note.

### Pass 3 — Founder digest

The founder sees:

- what shipped
- what was approved or rejected
- what is blocked
- what needs decision
- the next ranked queue

The founder should not be asked to inspect raw diffs by default.

## Founder Decision Packet

Use this exact shape when escalation is unavoidable:

- `Issue / PR`
- `What changed`
- `Why it matters`
- `Product invariant affected`
- `Options` (usually 2-3)
- `Recommendation`
- `Trade-off`
- `Files affected`
- `Validation evidence`
- `Exact founder decision needed`
- `Risk if we wait`
- `Risk if we choose wrong`

After the decision is made, distill durable product or operating truth into `.claude/agent-memory/product-decisions.md` and update the canonical source that governs behavior. Do not preserve raw chat as the only record of a founder decision.

## Review Packet Storage

Store the packet summary in:

- the PR body when possible
- a PR comment if the body is already crowded
- the linked issue if the work is blocked or reshaped before merge

Validation credibility must be explicit in the packet:

- what was directly rerun
- what was only spot-checked manually
- what could not be rerun
- whether the remaining evidence is strong enough to merge safely

## Documentation Ownership

If work changes product truth, workflow truth, or deploy truth, the same work unit must update the relevant canonical docs.

Do not spray new docs across the repo. Prefer updating:

- `AGENTS.md` (universal truth)
- `CLAUDE.md` (Claude overlay only — additive)
- `TASK-RULES.md`
- this file
- narrow scoped rules only when necessary

## Markdown Artifact Policy

`docs/operations/todolist.md`:

- strategic backlog snapshot
- derived from GitHub
- useful for founder scanning
- not claimable state

`docs/operations/completed.md`:

- shipping digest
- derived from merged PRs and issue completion notes
- not the transactional source of truth

## GitHub Project Setup

Current repo auth can manage labels and issues, but project scopes may be unavailable.

If project scopes are missing:

- keep the exact field schema in the repo
- provide a bootstrap script or manual checklist
- do not claim the project was fully applied

Required project fields:

- Lane
- Lock Group
- Priority
- Size
- Risk
- Blocked By
- Safe for Parallelism
- Touches Shared Logic
- Founder Decision Needed
- Verification Status

## Scheduled Agent Rules

Scheduled agents may:

- shape issues
- refresh derived digests
- prepare review packets
- run safe verification

Scheduled agents may not:

- claim live work without a ready issue
- modify pricing economics
- rewrite product truth
- fabricate GitHub project application
- force-merge or auto-merge without an explicit policy

## Checkpoint / Resume

For long-running work, leave a compact handoff with:

- changed files
- why they changed
- assumptions made
- blockers
- next action

Use [.claude/checkpoint-template.md](/Users/kiranghimire/Documents/moverrr/.claude/checkpoint-template.md).
