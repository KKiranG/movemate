---
name: write-task
description: Draft or sharpen moverrr backlog items in the house format, with duplicate and verifiability checks before any append.
when_to_use: Use when the user wants to add, rewrite, split, or tighten a backlog item in `docs/operations/docs/operations/todolist.md`.
argument-hint: [task description or existing task ID]
allowed-tools: [Read, Glob, Grep, Edit]
effort: high
---

# Write Task

Use this workflow to keep backlog quality high.

## Read First

1. `TASK-RULES.md`
2. `.claude/task-template.md`
3. The relevant section of `docs/operations/docs/operations/todolist.md`

## Drafting Rules

1. Use the template shape exactly.
2. Check for duplicates before proposing anything new.
3. If a related task already exists, rewrite or split that task instead of cloning it.
4. Re-read the draft and confirm:
   - `Done when` is third-party verifiable
   - `What` describes a real behavior change
   - `Why` states marketplace, trust, ops, or user impact
5. If the lead verb is `investigate`, `improve`, `enhance`, or `consider`, rewrite the task.

## Output Format

- duplicate check result
- draft task in house format
- short note explaining why the draft is sharp enough to verify

Ask the user to confirm the draft before editing `docs/operations/docs/operations/todolist.md`.
