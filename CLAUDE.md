# Claude Code Overlay

This is the Claude Code tool overlay. It carries only Claude-specific workflow.

**Universal truth lives in [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md).** Read that first for product thesis, invariants (pricing, booking, matching, mobile), the bounded parallelism contract, the review model, the verification bar, and escalation policy. This file does not redeclare any of that.

If this file ever appears to disagree with `AGENTS.md`, `AGENTS.md` wins — fix this file in the same task.

---

## Read Order For A Claude Session

1. [AUTHORITY.md](/Users/kiranghimire/Documents/moverrr/AUTHORITY.md) — meta-map
2. [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md) — universal contract
3. This file — Claude-specific workflow
4. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md) — issue lifecycle, review pipeline
5. Relevant `.claude/rules/**` for the surface being touched
6. The linked GitHub issue

---

## Optional Workflow Tooling — gstack

gstack is available as optional Claude/Codex workflow tooling on this Mac. It can help with planning, review, QA, and ship loops, but it is not product authority and it is not required for MoveMate work.

- Global paths:
  - Claude: `~/.claude/skills/gstack`
  - Codex: `~/.codex/skills/gstack*`
- Keep gstack as a global install. Do not vendor its skill trees into the MoveMate repo root.
- If gstack is unavailable, stale, too heavy, or replaced by Hermes or another orchestrator, continue from `AGENTS.md`, `.claude/project-ops.md`, the linked GitHub issue, and the repo verification commands.

### Browser tooling

- Prefer the browser tool that belongs to the current runtime.
- In Claude sessions where gstack is active, `/browse` and `/open-gstack-browser` remain acceptable helpers.
- In Codex, use the available Browser Use plugin or local verification tools instead of assuming gstack exists.

### Known gstack skills for this repo

`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`,
`/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`,
`/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/open-gstack-browser`,
`/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`,
`/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`,
`/plan-devex-review`, `/devex-review`, `/pair-agent`, `/careful`, `/freeze`,
`/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.

These skills are conveniences only. Product truth, pricing truth, issue authority, lock groups, and repo-operating truth come from `AGENTS.md` and the canonical docs it points to.

---

## Claude Memory Layering

Claude Code auto-loads `CLAUDE.md` at session start. It does not auto-load `AGENTS.md`. The first job of any non-trivial Claude session is therefore to read `AGENTS.md` before planning.

Claude-scoped files that continue to apply:

- `.claude/rules/**` — scoped instructions loaded for specific file surfaces
- `.claude/skills/**` — reusable workflows and runbooks
- `.claude/agents/**` — agent-role briefs
- `.claude/project-ops.md` — live-work runbook (applies to all tools despite the path)
- `.claude/lock-groups.md` — parallelism contract detail
- `.claude/capability-index.md` — index of skills, rules, and commands

---

## Session Start

Use the `/session-start` skill at the top of a fresh session. It loads GitHub live state, surfaces `state:needs-founder-decision`, `state:blocked`, and top `state:ready` work, and asks for scope confirmation before implementation.

Do not plan from memory when the user names a specific task. Read the relevant `.claude/rules/` and `.agent-skills/` file for the area first.

---

## Skill Routing

When the user's request matches an available skill, invoke it via the Skill tool. The
skill has multi-step workflows, checklists, and quality gates that produce better
results than an ad-hoc answer. When in doubt, invoke the skill. A false positive is
cheaper than a false negative.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /plan-ceo-review
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design system, brand, "how should this look" → invoke /design-consultation
- Design review of a plan → invoke /plan-design-review
- Developer experience of a plan → invoke /plan-devex-review
- "Review everything", full review pipeline → invoke /autoplan
- Bugs, errors, "why is this broken", "wtf", "this doesn't work" → invoke /investigate
- Test the site, find bugs, "does this work" → invoke /qa (or /qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /review
- Visual polish, design audit, "this looks off" → invoke /design-review
- Developer experience audit, try onboarding → invoke /devex-review
- Ship, deploy, create a PR, "send it" → invoke /ship
- Merge + deploy + verify → invoke /land-and-deploy
- Configure deployment → invoke /setup-deploy
- Post-deploy monitoring → invoke /canary
- Update docs after shipping → invoke /document-release
- Weekly retro, "how'd we do" → invoke /retro
- Second opinion, codex review → invoke /codex
- Safety mode, careful mode, lock it down → invoke /careful or /guard
- Restrict edits to a directory → invoke /freeze or /unfreeze
- Upgrade gstack, when the current session is using it → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /context-save
- Resume, restore, "where was I" → invoke /context-restore
- Security audit, OWASP, "is this secure" → invoke /cso
- Make a PDF, document, publication → invoke /make-pdf
- Launch real browser for QA in a gstack-backed Claude session → invoke /open-gstack-browser
- Import cookies for authenticated testing → invoke /setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /benchmark
- Review what gstack has learned, when relevant → invoke /learn
- Tune question sensitivity → invoke /plan-tune
- Code quality dashboard → invoke /health

---

## Claude-Specific Hooks

Hooks live at `.claude/settings.local.json` and `.claude/hooks/**`. They are Claude-runtime-only and do not affect Codex or Antigravity sessions.
