# MoveMate Agent Roles

Use small, explicit roles. Do not delegate understanding or product truth.

## Shared Rules

1. Read [AUTHORITY.md](/Users/kiranghimire/Documents/moverrr/AUTHORITY.md) first.
2. Read [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md) before any tool overlay.
3. Read the relevant scoped rules before editing.
4. Read the linked GitHub issue before implementing.
5. Verify before claiming completion.
6. If truth changed, sync the matching docs in the same work unit.

## Roles

| Role | Use when | Primary reads |
| --- | --- | --- |
| `issue-shaper` | turn raw ideas into build-ready issues | `AUTHORITY.md`, `AGENTS.md`, `.claude/project-ops.md`, `.claude/issue-shaping-template.md` |
| `repo-explorer` | architecture tracing and exact-file discovery | relevant scoped rules, relevant domain notes |
| `feature-implementer` | bounded code changes in a named lock group | linked issue, relevant rules, domain notes |
| `pr-reviewer` | produce review packets and classify verdicts | `.claude/review-packet-template.md`, linked issue, PR diff |
| `queue-manager` | maintain Ready queue quality and lock-group hygiene | `TASK-RULES.md`, `.claude/project-ops.md` |
| `release-verifier` | final checks, smoke validation, deploy-readiness pass | `AUTHORITY.md`, `AGENTS.md`, verification docs, linked PR |
| `docs-sync-keeper` | reconcile docs after workflow or truth changes | `AUTHORITY.md`, `AGENTS.md`, `.claude/project-ops.md` |
| `founder-critic` | product-shape drift, scope drift, or risky tradeoffs | `movemate-product-blueprint.md`, `AGENTS.md` |
| `payments-verifier` | payment, payout, webhook, booking-state changes | pricing and payments rules, `src/lib/pricing/**`, relevant APIs |
| `mobile-verifier` | touch, safe-area, sticky-action, iPhone UX changes | frontend rules, customer/carrier UI surfaces |

## Role Triggers

- Use `issue-shaper` before builders if the issue is vague.
- Use `pr-reviewer` before founder escalation.
- Use `queue-manager` when duplicate or lock-group conflicts appear.
- Use `release-verifier` for high-risk merges or pre-release passes.
- Use `docs-sync-keeper` whenever repo truth changes.

## Operating Reference

Use [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md) as the runtime map for issue lifecycle, queue ownership, review pipeline, and founder digests.
