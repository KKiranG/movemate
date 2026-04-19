---
name: fix-issue
description: Turn a GitHub issue number into a scoped implementation with thesis check, implement, verify, and PR workflow.
when_to_use: Use when a GitHub issue needs to be implemented in this repo.
argument-hint: [issue: #123]
effort: high
---

# Fix Issue

Use `$ARGUMENTS` to specify the issue number (e.g. `#42`).

## Step 1 — Thesis Check

Before touching code, confirm the issue fits moverrr's thesis:

1. Does fixing this help carriers post real spare capacity, or improve customer trust/clarity?
2. Does it keep the need-first, match-ranked model intact?
3. Is it the smallest version worth shipping now?

If the answer to any of these is unclear, flag it to the founder before continuing.

## Step 2 — Understand the Issue

1. Read the issue in full.
2. Trace the relevant code path from the issue description.
3. State the root cause or the gap in one sentence before proposing a fix.

Do not start implementation until you can state the root cause clearly.

## Step 3 — Implement

- Smallest complete change only.
- No unrelated refactors.
- No changes to commission math without explicit discussion.
- Keep iOS-first invariants intact.
- If the change touches bookings, pricing, or payments — read the booking-safety-audit context first.

## Step 4 — Verify

1. `npm run check`
2. Exercise the changed path directly.
3. Try one adversarial input.

If verification did not happen, say so plainly.

## Step 5 — PR

- Branch: `fix/issue-{number}-{slug}`
- PR title: references the issue number
- PR body: root cause, change summary, verification evidence

Move the matching backlog item from `docs/operations/todolist.md` to `docs/operations/completed.md` if one exists.
