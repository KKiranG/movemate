# MoveMate

MoveMate is a need-first, match-ranked spare-capacity marketplace for awkward-middle moves. Customers declare a move need once, see a short ranked set of route-compatible matches, request one driver or use Fast Match, and only release payout after proof-backed delivery.

This repository contains two things:

1. The MoveMate product application.
2. The repo operating system that lets shaped issues, smaller agents, reviewers, and release checks work safely in parallel.

## Read Order

Start here when you are orienting to the repo:

1. [AUTHORITY.md](/Users/kiranghimire/Documents/moverrr/AUTHORITY.md) — meta-map
2. [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md) — universal agent contract
3. The tool overlay for the tool you are running in: [CLAUDE.md](/Users/kiranghimire/Documents/moverrr/CLAUDE.md) for Claude Code; future `GEMINI.md` for Antigravity/Gemini
4. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md)
5. [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md)

## Live Work System

GitHub is the live work system:

- Issues hold the shaped work unit.
- Labels, linked PRs, comments, and assignees hold live state.
- GitHub Project fields hold queue metadata when project scopes are available.

Markdown backlog files are derived artifacts only:

- [docs/operations/todolist.md](/Users/kiranghimire/Documents/moverrr/docs/operations/todolist.md)
- [docs/operations/completed.md](/Users/kiranghimire/Documents/moverrr/docs/operations/completed.md)

Do not use those files as a transactional queue.

## Product Truth

Product thesis and invariants live in [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md) (universal agent contract) and [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md) (product source of truth). This README does not redeclare them.

## Stack

- Next.js 14
- React 18
- TypeScript
- Supabase
- Stripe
- Resend
- Vercel

## Commands

```bash
npm ci
npm run dev
npm run check
npm run test
npm run build
npm run ops:labels
npm run ops:sync-backlog
```

## Workflow Tooling

MoveMate's repo operating system is tool-neutral. Use the workflow tooling available in your runtime, but do not make product or task authority depend on that tool.

gstack is available as optional helper tooling on this machine:

- Claude global install path: `~/.claude/skills/gstack`
- Codex global install path: `~/.codex/skills/gstack*`
- Claude repo hook: `.claude/hooks/check-gstack.sh`

gstack, Hermes-style orchestration, Codex/Claude subagents, Jules, Gemini/Antigravity, and future tools may help with planning, review, QA, and ship loops. MoveMate product truth, issue authority, lock groups, and verification rules still come from the canonical docs in this repo.

Keep workflow libraries as global or external dependencies. Do not vendor their skill trees into the MoveMate repo root.

## Naming Policy

The product name is `MoveMate`.

Some legacy technical identifiers still use `moverrr` because changing them in-place would create unnecessary breakage or migration churn. Those aliases are tracked in [AUTHORITY.md](/Users/kiranghimire/Documents/moverrr/AUTHORITY.md) and the operating docs until an isolated rename pass is ready.

## Reference Policy

Treat repo material in three buckets:

1. Canonical authority: the docs in the read order above plus the linked GitHub issue and PR history.
2. Derived snapshots: `docs/operations/**`, which summarize live GitHub state but never replace it.
3. Reference-only material: optional non-authoritative notes, examples, or archived research.

Keep imported workflow libraries and machine-local research outside this repo root. If a small curated reference file is worth keeping in-repo, store it under [`docs/reference/`](docs/reference/README.md), mark it as non-authoritative, and update the canonical doc that actually carries the truth. Do not treat archived reference as product source of truth, queue state, or vendored tooling.
