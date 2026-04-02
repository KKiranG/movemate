---
paths:
  - "*.md"
  - ".claude/**"
  - ".agent-skills/**"
  - "README.md"
---

# Docs + Memory Rules

Documentation in this repo is part of the agent runtime, not an afterthought.

## Where Truth Belongs

- `CLAUDE.md`
  Repo-wide, always-on truth
- `.claude/rules/*.md`
  Scoped instructions that should load only for certain files
- `.agent-skills/*.md`
  Domain facts and flow-level context
- `.claude/skills/<skill>/SKILL.md`
  Reusable workflows and runbooks
- `TASK-RULES.md`
  Backlog operating system
- `README.md`
  Human-facing repo orientation

## Writing Rules

- Keep always-loaded docs lean
- Move specialized detail into rules or skills
- Prefer one canonical source over duplicated summaries
- Delete stale instructions instead of stacking new text beside them
- If a feature is already shipped, do not keep a "future feature brief" where a real workflow or reference doc should exist
- When docs conflict, the narrower scoped file wins until the stale file is corrected or deleted
- Rule files should use narrow `paths` and subsystem-level kebab-case names
- Capability indexes and workflow catalogs should point to canonical sources rather than restating them inline

## Required Sync Behavior

Update docs in the same task when you change:
- product rules
- verification commands
- workflow steps
- route structure
- agent or skill setup
- naming that future agents will rely on

## Task Tracking Files

`todolist.md` and `completed.md` are special-purpose files.
Do not touch them unless the task actually changes backlog state or the user asked for backlog grooming.

## Context Budget

Treat always-loaded docs as a scarce budget.
If detail is only useful for one subsystem or one workflow, move it closer to that work instead of expanding repo-wide prose.
