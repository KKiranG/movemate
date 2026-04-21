---
name: write-task
description: Draft and file a MoveMate GitHub issue in the structured format, with duplicate and verifiability checks before filing.
when_to_use: Use when the user wants to capture, rewrite, split, or tighten a work item. Files a GitHub issue — not a markdown backlog entry.
argument-hint: [task description]
allowed-tools: [Read, Glob, Grep, Bash]
effort: high
---

# Write Task

Use this workflow to keep issue quality high before filing.

## Read First

1. `TASK-RULES.md` — issue contract requirements
2. `.claude/issue-shaping-template.md` — field reference
3. Check for duplicates:
   ```bash
   gh issue list --repo KKiranG/moverrr --state open --json number,title \
     --jq '.[] | "#\(.number) \(.title)"'
   ```

## Drafting Rules

1. Use the `.claude/issue-shaping-template.md` field shape.
2. Check for duplicates before proposing anything new.
3. If a related issue exists, refine it instead of duplicating.
4. Confirm before filing:
   - `Done when` is third-party verifiable
   - `What` describes a real behavior change
   - `Why` states marketplace, trust, ops, or user impact
   - Lane and lock group are both named
5. If the lead verb is `investigate`, `improve`, `enhance`, or `consider`, rewrite the task.

## Output Format

- duplicate check result
- draft issue in house format (outcome, why, lane, lock group, risk, acceptance criteria, verification plan)
- short note explaining why the draft is sharp enough to verify

Ask the user to confirm, then file with:
```bash
gh issue create --repo KKiranG/moverrr \
  --title "..." \
  --label "type:builder-task,lane:...,state:ready,priority:...,size:...,risk:..." \
  --body "..."
```
