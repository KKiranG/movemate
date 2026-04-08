# moverrr — Task System

Hard rules for `todolist.md` and `completed.md`.
Treat backlog quality as product quality: if the task system is vague, the shipping loop becomes vague too.

## The Two Files

| File | Purpose |
| --- | --- |
| `todolist.md` | Single source of truth for work that is not done yet |
| `completed.md` | Permanent log of work that is already done |

Both stay at the project root.

## Governing Principles

1. **One task = one real outcome.**
   A task should describe a user, ops, trust, or quality outcome, not a random pile of edits.
2. **Every task needs evidence.**
   If "done" cannot be verified, the task is underspecified.
3. **Smallest shippable chunk wins.**
   Split broad efforts into the smallest slices that can be built, verified, and learned from.
4. **Backlog clarity beats backlog volume.**
   A shorter, sharper backlog is better than a long graveyard of vague ideas.
5. **Docs count as product infrastructure.**
   If a task changes flows, commands, or guardrails, that documentation work belongs in the same logical unit.

## `todolist.md` Rules

### Required format

```md
- [ ] **ID** — Title
  - **File(s):** exact path(s) or "new file: path"
  - **What:** one sentence describing the change
  - **Why:** one sentence on the user/business impact
  - **Done when:** specific, verifiable outcome
```

Canonical draft template: `.claude/task-template.md`

### Priority headers

Use these headers exactly:

- `## 🔴 P0 — Production Blocking`
- `## 🟠 P1 — User-Facing Bugs`
- `## 🟡 P2 — UX & Conversion`
- `## 🟢 P3 — Enhancements`
- `## ⚪ P4 — Post-MVP / Deferred`

### Quality bar for each item

Every item should make these clear:
- where the change will happen
- what real behavior changes
- why it matters to the marketplace
- how to know the task is complete

If a task touches pricing, booking states, payments, mobile UI, or database security, say that explicitly in the item.

### When AI Writes Tasks

1. Read this entire file before drafting anything.
2. Read `.claude/task-template.md` and use it as the draft shape.
3. Check `todolist.md` for duplicates before proposing a new task; if a task already exists, sharpen that one instead of adding a clone.
4. Re-read your own draft and ask:
   - is `Done when` verifiable by someone who did not write the task?
   - does `What` describe a behavior change instead of vague aspiration?
   - does `Why` explain marketplace, trust, supply, or user impact?
5. Do not use `investigate`, `improve`, `enhance`, or `consider` as the main action verb.
6. Show the draft to the user and get confirmation before appending it to `todolist.md`.

### Hard rules

1. Never mark an item done in `todolist.md`; move it out.
2. Never add vague work like "improve UX" or "make onboarding better."
3. Check for duplicates before adding new work.
4. Sort within each priority bucket by business impact.
5. Keep P4 items intentionally light; they are reminders, not near-term build specs.
6. If one task changes the shape of another, rewrite the stale task immediately.
7. Aim for a backlog that is sharp enough to scan in minutes, not hours.

## Task Sizing Rules

Split work when:
- the task touches more than one user journey
- the verification plan differs by area
- the business risk is mixed
- one part is blocked by a decision and another is not

Good task slices in this repo usually map to one of:
- a carrier posting friction removal
- a customer booking clarity fix
- an admin/trust workflow improvement
- a backend invariant hardening change
- a docs/memory alignment update

## `completed.md` Rules

### Required format

```md
### `COMP-YYYY-MM-DD-NN` — Short title
- **Moved from active backlog:** optional task IDs
- **Removed from active backlog as stale duplicates:** optional task IDs
- **When:** YYYY-MM-DD
- **Where:** list of exact paths
- **Why:** one sentence on business/user impact
- **What changed:** 2–5 concrete bullets
- **Verification:** how it was confirmed working
```

### Hard rules

1. Never delete entries.
2. Number sequentially within each date.
3. Use one entry per logical unit of work, not per file.
4. The `Why` line is mandatory.
5. Group entries under a `## YYYY-MM-DD` heading.

## Session Loop

Every meaningful work session should follow this order:

1. Read the current highest-priority relevant task.
2. Read the related code and project memory before editing.
3. Implement the smallest complete change.
4. Verify the change with real evidence.
5. Move the finished task to `completed.md`.
6. Add any newly discovered follow-up work back into `todolist.md`.

## Experiment Loop

When a task is exploratory, optimization-heavy, or strategy-shaped, borrow the `autoresearch` discipline:

1. Establish the current baseline.
2. Change one meaningful variable at a time.
3. Use a fixed verification lens.
4. Keep or discard based on evidence, not vibes.
5. Record the learning, not just the diff.

Use `EXPERIMENT-LEDGER.md` for the durable record.

### Baseline template

Before experimental work starts, write:

- current baseline
- single change
- metric
- keep threshold
- discard or reframe threshold

For moverrr, common baseline metrics are:
- time for a carrier to post a trip
- search-to-book conversion
- saved-search capture rate on no-result routes
- dispute resolution time
- admin review queue time
- proof-completion rate

## Anti-Patterns

Do not add tasks that:
- bundle product strategy, implementation, and polish into one item
- describe output without user/business impact
- assume a solution before the problem is clear
- drift moverrr toward dispatch, bidding, or quote comparison
- duplicate work that already exists in another priority bucket

Do not close work in `completed.md` with vague summaries either.
The completion log should make it obvious what shipped, why it mattered, and how it was verified.

## ID Convention

- `A` = API / backend
- `B` = browser / frontend
- `C` = iOS / mobile compliance
- `D` = database / schema
- `E` = enhancement
- `V` = visual / design system
- `X` = external / infra / devops

For enhancement work, keep the second letter meaningful:
- `ES` = supply
- `ED` = demand
- `EP` = platform
- `EA` = admin
- `EQ` = quality

## Priority Reminder

The real product order is still:

**Trust -> Simplicity -> Supply speed -> Customer clarity -> Automation -> Polish**

If a task list starts optimizing polish ahead of supply, clarity, or trust, the backlog has gone off course.
