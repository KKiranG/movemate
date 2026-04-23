# MoveMate Authority Map

This file is the meta-map. It tells any AI tool — Claude Code, Codex, Antigravity, Gemini/VS Code, Jules, and future entrants — which file holds universal truth, which files are tool-specific overlays, and which files are derived or reference-only.

The universal contract itself is [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md). This file tells you how to read it.

---

## Order Of Authority

This list is definitive. Every other authority list in the repo mirrors it.

1. System, developer, and direct user instructions in the active session.
2. [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md) — product source of truth.
3. [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md) — universal agent contract (cross-tool).
4. Tool overlays — [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md), and any future `GEMINI.md`, `COPILOT.md`, etc. Overlays are additive only.
5. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md) — live-work operating runbook (applies to all tools despite the path).
6. Relevant scoped rules under `.claude/rules/**`, domain context under `.agent-skills/**`, skills and agent briefs under `.claude/**`.
7. The linked GitHub issue or PR for the current work unit.
8. Derived digests under `docs/operations/**`.
9. Legacy or imported reference material.

If two docs disagree at the same layer, fix the stale one in the same task. If a tool overlay disagrees with `AGENTS.md`, the overlay is wrong — `AGENTS.md` wins.

---

## Multi-Tool Policy

MoveMate is designed to be worked on by multiple AI tools in parallel. Different tools auto-load different files, so the shared contract lives in `AGENTS.md` and every tool-specific file stays thin.

- **Universal contract:** `AGENTS.md`. Carries product truth, invariants, parallelism model, review model, verification bar, escalation policy.
- **Tool overlays:** one thin file per tool, additive only. Current overlays:
  - `CLAUDE.md` — Claude Code (also loaded by Claude via its own auto-loader)
- Deferred overlays (create only when the tool demands it):
  - `GEMINI.md` — Antigravity / Gemini CLI if indexing hygiene alone stops being enough
  - `AGENTS-CODEX.md` or similar — only if Codex develops tool-specific needs beyond what `AGENTS.md` already covers
  - `COPILOT.md`, `CURSOR.md`, etc. — only when those tools actively work this repo

### Rules of the overlay

- An overlay may add tool-specific workflow (approved skills, routing rules, hook paths, session-start patterns).
- An overlay may not override a universal invariant declared in `AGENTS.md`.
- If an overlay disagrees with `AGENTS.md`, the overlay is stale and must be corrected in the same task.
- Adding a new tool is a one-file task: create `NEWTOOL.md`, list it here, do not rewrite `AGENTS.md` unless a universal invariant actually changed.

### Indexing hygiene

- Antigravity indexing is controlled by `.antigravityignore` at the repo root.
- Do not vendor global tooling, worktree copies, or machine-specific agent workspace material into the repo root. Keep imported libraries as global installs or external local references.

---

## Canonical Docs

- Product truth: [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md)
- Universal agent contract: [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md)
- Claude overlay: [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md)
- Live work model: [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md)
- Parallelism contract: [.claude/lock-groups.md](/Users/kiranghimire/Documents/moverrr/.claude/lock-groups.md)
- Task rules pointer: [TASK-RULES.md](/Users/kiranghimire/Documents/moverrr/TASK-RULES.md)
- Design system reference: [docs/product/design-system.md](docs/product/design-system.md)

---

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

---

## Current Alias Policy

Use `MoveMate` for product-facing and founder-facing language.

Keep `moverrr` where renaming is risky until isolated migration work is shaped:

- deployed domains and return URLs
- Supabase project identifiers
- storage bucket and local storage keys
- historical database table or enum names
- old webhook metadata and redirect contracts
- any route aliases that still protect live links

---

## Reference-Only Trees

These paths may contain useful patterns, but they do not overrule MoveMate runtime truth on their own:

- `codes/**`
- `docs/reference/**`
- `docs/designs/**`
- `docs/product/**`
- `docs/reference/decisions.md` — point-in-time decision checkpoint (full settled log: `.claude/DECISION-LOG.md`)
- `docs/reference/experiment-ledger.md` — experiment schema template
- `docs/engineering/repo-structure.md` — generated directory snapshot (not authority)

### Archive rules

- Keep reference material small, curated, and explicitly marked non-authoritative.
- Prefer external/global installs for imported tooling and local research trees instead of repo-root copies.
- Never treat archived reference as the live queue, product truth, or an excuse to skip updating canonical docs.
- If archived reference changes the understanding of product or workflow truth, update the canonical doc in the same work unit.

The governing product source of truth is `movemate-product-blueprint.md`. The legacy Moverrr blueprint has been deleted.

Imported workflow libraries such as gstack and OpenClaw should live as global installs or external local references, not as repo-root source trees inside MoveMate.
