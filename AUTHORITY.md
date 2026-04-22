# MoveMate Authority Map

This file exists so agents do not have to guess what is authoritative.

## Order Of Authority

1. System, developer, and direct user instructions in the active session.
2. [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md)
3. [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md)
4. [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md)
5. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md)
6. Relevant scoped rules in `.claude/rules/**`, relevant `.agent-skills/**`, and relevant agent/skill briefs in `.claude/**`
7. The linked GitHub issue for the specific work unit
8. Derived digests in `docs/operations/**`
9. Legacy or imported reference docs

If two docs disagree at the same layer, fix the stale one in the same task.

## Canonical Docs

- Product truth: [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md)
- Repo entrypoint: [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md)
- Repo invariants: [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md)
- Live work model: [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md)
- Concurrency contract: [.claude/lock-groups.md](/Users/kiranghimire/Documents/moverrr/.claude/lock-groups.md)
- Task rules: [TASK-RULES.md](/Users/kiranghimire/Documents/moverrr/TASK-RULES.md)

## Live State Versus Derived State

Live state lives in GitHub:

- Issues
- Labels
- Assignees
- Linked PRs
- Issue and PR comments
- Project fields when scopes allow

Derived state lives in markdown:

- `docs/operations/todolist.md`
- `docs/operations/completed.md`

Derived files are snapshots and digests. They are not the live queue.

## Current Alias Policy

Use `MoveMate` for product-facing and founder-facing language.

Keep `moverrr` where renaming is risky until isolated migration work is shaped:

- deployed domains and return URLs
- Supabase project identifiers
- storage bucket and local storage keys
- historical database table or enum names
- old webhook metadata and redirect contracts
- any route aliases that still protect live links

## Reference-Only Trees

These paths may contain useful patterns, but they do not overrule MoveMate runtime truth on their own:

- `codes/**`
- `docs/reference/**`
- `docs/designs/**`
The governing product source of truth is `movemate-product-blueprint.md`. The legacy Moverrr blueprint has been deleted.

Imported workflow libraries such as gstack and OpenClaw should live as global installs or external local references, not as repo-root source trees inside MoveMate.
