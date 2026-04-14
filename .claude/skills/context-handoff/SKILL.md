---
name: context-handoff
description: Multi-session continuity protocol — what to capture before ending a session and what to read at the start of a new one to resume cleanly.
when_to_use: Use at the end of any session involving non-trivial in-progress work, or at the start of a new session that continues prior work. Also use when handing off a task to a specialist agent.
argument-hint: [direction: start | end | handoff]
effort: low
---

# Context Handoff

Use `$ARGUMENTS` to specify the direction: `start`, `end`, or `handoff`.

---

## END — Capturing State Before Closing a Session

Run this before the session ends if work is partially complete.

### 1. State Snapshot

Write a brief note (can be in a reply, not a file) covering:

- **Active task:** What are we building or fixing right now?
- **Completed steps:** What has been implemented and verified?
- **Next step:** The exact next action, file, and line if possible.
- **Blocked on:** Anything waiting for a founder decision or external input.
- **Do not retry:** Approaches tried and explicitly rejected this session.

### 2. Commit or Save Work in Progress

- If code is in a state that compiles and passes `npm run check`, commit it to the branch.
- If it does not compile, add a `// WIP:` comment at the exact line where work stopped, then commit.
- Never leave uncommitted work in a worktree — worktrees are cleaned up automatically.

### 3. Update Backlog If Task Changed State

- If a task moved from in-progress to complete, mark it in `docs/operations/docs/operations/todolist.md` and add to `docs/operations/docs/operations/completed.md`.
- If a task changed shape (scoped down, pivoted), update the backlog entry.
- Do not create new backlog items here unless specifically asked.

### 4. Decisions Made This Session

If any founder-grade go/no-go was reached during this session, add it to `.claude/DECISION-LOG.md` before closing.

---

## START — Reading Into a Resumed Session

Run this at the start of a new session that continues prior work.

### Reading Order

Read in this sequence — stop when you have enough context to act:

1. **`CLAUDE.md`** — invariants and non-goals (loaded automatically, review if task is near a boundary)
2. **`.claude/DECISION-LOG.md`** — settled decisions that may affect the current task
3. **`.claude/MVP-BOUNDARY.md`** — confirm the work is in scope
4. **`.claude/CODEBASE-MAP.md`** — file locations for the affected area
5. **Matching `.agent-skills/*.md`** — domain context for the area being changed
6. **`docs/operations/docs/operations/todolist.md`** — current backlog item being worked on
7. **Recent git log on the branch** — what has already been committed

```bash
git log --oneline -10
git diff main...HEAD --name-only
```

### Do Not Assume

- Do not assume a decision made in a prior session is still live — check DECISION-LOG.md and the current code.
- Do not assume a file mentioned in a prior message still exists at the same path — verify with Glob or Grep.
- Do not re-run an approach that was marked as rejected.

---

## HANDOFF — Delegating to a Specialist Agent

Use this when handing a bounded task to a `feature-implementer`, `verifier`, `schema-reviewer`, or other specialist.

### Brief the Agent With

1. **Exact task:** One sentence, specific file and function if known.
2. **What has been done:** Steps completed and their verification status.
3. **What not to do:** Approaches rejected; invariants that block certain paths.
4. **Files to read first:** Exact paths from CODEBASE-MAP.md or from your prior exploration.
5. **Verification target:** What passing looks like (specific test, CLI command, visible behavior).

### Do Not

- Tell the agent "based on your findings, implement X" — synthesize first, then brief.
- Brief with only a description of the problem; include the file paths and what you already know.
- Assume the agent will check DECISION-LOG.md or MVP-BOUNDARY.md unprompted — include relevant constraints in the brief.

---

## Quick Reference: What Survives Compaction

Per CLAUDE.md § Compaction Preservation, these must survive context compaction:

- Active task ID and title
- User decisions made this session (go/no-go)
- Failed approaches (do not retry them)
- Invariants confirmed (pricing identity, booking-state transitions, capacity math)
- Scope boundaries (what was explicitly out of scope)

If any of these would be lost, write them to a scratchpad or restate them at the top of the next message.
