---
name: docs-memory-sync
description: Keep moverrr's docs, project memory, agent instructions, and skills aligned with the current product instead of letting stale guidance accumulate.
when_to_use: Use when a task changes product rules, route structure, commands, workflows, agent setup, or when the user asks to improve markdown files, prompts, or project instructions. Examples: "update CLAUDE.md", "clean up the docs", "improve skills", "fix stale instructions", or "reorganize our agent setup".
paths:
  - "*.md"
  - ".claude/**"
  - ".agent-skills/**"
---

# Docs Memory Sync

Use this skill when the repo's instruction system needs to be made sharper.

## First Decide Where The Truth Belongs

- `CLAUDE.md`
  Only repo-wide truths that should load every session.
- `.claude/rules/*.md`
  Scoped detail that should only load for relevant files.
- `.agent-skills/*.md`
  Domain facts and subsystem context.
- `.claude/skills/<skill>/SKILL.md`
  Repeatable workflows.
- `README.md`
  Human-facing orientation.

## Cleanup Rules

- delete stale instructions instead of layering more prose beside them
- do not keep future-tense feature briefs for features that already shipped
- replace duplicated summaries with one canonical source
- prefer real paths, real commands, and current terminology

## Required Cross-Check

When you finish, scan for:
- conflicting rules
- dead file references
- duplicated product context
- missing links between flows and workflow skills

If the docs changed because code changed, mention what truth was synchronized.
