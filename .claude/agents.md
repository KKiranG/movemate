# moverrr — Agent System

This repo now uses a layered Claude-style setup:

- `CLAUDE.md` for always-on product truth
- `.claude/rules/` for file-scoped memory
- `.agent-skills/` for subsystem knowledge
- `.claude/skills/` for reusable workflows
- `.claude/agents/` for specialized role briefs

The goal is not "more instructions." The goal is sharper operating contracts.

## Shared Rules For Every Agent

1. Read `CLAUDE.md` first.
2. Read the relevant `.claude/rules/*.md` file before touching that area.
3. Read the matching `.agent-skills/*.md` file for domain context.
4. Use a specialized skill when the work is a repeatable workflow.
5. Never delegate understanding.
6. Verify before reporting completion.
7. If truth changed, update the matching docs in the same task.

## Role Map

| Agent | Use when | Primary reads |
| --- | --- | --- |
| `founder-critic` | feature shaping, prioritization, scope drift, marketplace strategy | `CLAUDE.md`, `.agent-skills/OVERVIEW.md`, `.agent-skills/PRICING.md` |
| `repo-explorer` | architecture tracing, codebase surveys, exact-file questions | relevant `.claude/rules/*.md`, relevant `.agent-skills/*.md` |
| `feature-implementer` | bounded build work across code, schema, and UI | relevant rules, domain skill, relevant workflow skill |
| `verifier` | independent validation after meaningful changes | `CLAUDE.md`, `.agent-skills/VERIFICATION.md`, matching workflow skill |
| `docs-keeper` | documentation cleanup, memory alignment, stale-instruction fixes | `.claude/rules/docs-and-memory.md`, relevant `.agent-skills/*.md` |

## Delegation Rules

- Use explorers for evidence gathering, not for final decisions.
- Use implementers for bounded execution, not for fuzzy strategy.
- Use verifiers after non-trivial work, especially backend, payments, booking, migrations, or multi-file UI changes.
- Use the founder critic before green-lighting features that may distort the product wedge.
- Use the docs keeper when flows, invariants, or commands changed and memory needs to stay current.

## Important Lessons Borrowed From Frontier Agent Systems

- Split explore, plan, implement, and verify instead of doing everything in one pass.
- Prefer small, explicit role definitions over one giant "smart agent."
- Keep always-loaded instructions lean; move deep detail into scoped rules and on-demand skills.
- Treat documentation, prompts, and skills as part of the product operating system.
- Use evidence-backed verification, not ceremonial "looks good" reviews.

## Actual Role Files

The role briefs live here:

- `.claude/agents/founder-critic.md`
- `.claude/agents/repo-explorer.md`
- `.claude/agents/feature-implementer.md`
- `.claude/agents/verifier.md`
- `.claude/agents/docs-keeper.md`

Keep the overview here human-readable.
Keep the role-specific behavior in the actual agent files.
