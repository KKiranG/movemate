---
name: session-start
description: Kickoff workflow that loads the top backlog item, recent git state, and relevant memory before implementation begins.
when_to_use: Use at the start of a new work session to orient before touching code.
effort: medium
---

# Session Start

Use this skill to start a session properly instead of jumping straight to code.

## Load Context

Run these before anything else:

```bash
git log --oneline -10
git status
```

Then read:
1. `docs/operations/todolist.md` — top uncompleted item by priority
2. `CLAUDE.md` — refresh product invariants
3. The relevant `.claude/rules/` file for today's area

## Scope Confirmation

Present to the user:

```
Top backlog item: [ID and title]
Recent commits: [last 5, one-line each]
Uncommitted work: [clean / dirty — what files]
Proposed scope: [what you will work on this session]
```

Ask: "Does this match what you want to work on today?" Do not start implementation until scope is confirmed.

## If The User Names a Specific Task

Read the relevant `.claude/rules/` and `.agent-skills/` file for the area before proposing a plan. Do not plan from memory.

## End of Session Checklist

Before stopping:
- [ ] Completed items moved from `docs/operations/todolist.md` to `docs/operations/completed.md`
- [ ] `npm run check` passes if code was touched
- [ ] Docs synced if behavior, routes, or commands changed
- [ ] New follow-up tasks added to `docs/operations/todolist.md` with proper IDs
