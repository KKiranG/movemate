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

Then run all three — they take seconds and tell you what actually needs attention:

```bash
# 1. What needs a founder decision right now
gh issue list --repo KKiranG/moverrr --label "state:needs-founder-decision" \
  --json number,title --jq '.[] | "#\(.number) \(.title)"'

# 2. What is blocked
gh issue list --repo KKiranG/moverrr --label "state:blocked" \
  --json number,title --jq '.[] | "#\(.number) \(.title)"'

# 3. Top ready work sorted by priority
gh issue list --repo KKiranG/moverrr --label "state:ready" --json number,title,labels \
  --jq '.[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(","))]"'
```

Then read:
4. `CLAUDE.md` — refresh product invariants
5. The relevant `.claude/rules/` file for today's area

## Scope Confirmation

Present to the user:

```
Needs founder decision: [list or "none"]
Blocked: [list or "none"]
Top ready item: [ID and title]
Recent commits: [last 5, one-line each]
Uncommitted work: [clean / dirty — what files]
Proposed scope: [what you will work on this session]
```

Ask: "Does this match what you want to work on today?" Do not start implementation until scope is confirmed.

## If The User Names a Specific Task

Read the relevant `.claude/rules/` and `.agent-skills/` file for the area before proposing a plan. Do not plan from memory.

## End of Session Checklist

Before stopping:
- [ ] GitHub issue updated: add a progress comment or close it if shipped
- [ ] PR body contains `Closes #N` linking back to the issue
- [ ] `npm run check` passes if code was touched
- [ ] Docs synced if behavior, routes, or commands changed
- [ ] Any new follow-up work filed as GitHub issues with lane + lock group labels
