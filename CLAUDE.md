# MoveMate Repo Truth

This file holds the always-on product and execution invariants for the MoveMate repo.

## Product Thesis

MoveMate is a need-first, match-ranked spare-capacity marketplace for awkward-middle moves. The customer declares a move need once. The system returns a short ranked set of route-compatible options with deterministic all-in pricing, trust signals, and clear next steps. Drivers monetize trips they are already taking through structured posting, request review, proof-backed delivery, and payout release.

## Authority Order

1. System, developer, and direct user instructions
2. [movemate-product-blueprint.md](/Users/kiranghimire/Documents/moverrr/movemate-product-blueprint.md)
3. This file
4. [AGENTS.md](/Users/kiranghimire/Documents/moverrr/AGENTS.md)
5. [.claude/project-ops.md](/Users/kiranghimire/Documents/moverrr/.claude/project-ops.md)
6. Relevant scoped rules, skills, and agent briefs
7. The linked GitHub issue
8. Derived markdown digests
9. Stale or legacy docs

## Core Invariants

### Product shape

- Need-first beats browse-first.
- Trust is a product feature, not decoration.
- Sparse supply recovery matters as much as happy-path matching.
- Customer and driver UX are asymmetric on purpose.
- iOS-quality touch ergonomics matter even when Android compatibility must remain intact.

### Pricing

- The current pricing code in `src/lib/pricing/breakdown.ts` is canonical for this pass.
- Current code keeps platform commission on `basePriceCents` only.
- No new pricing-economic change should ship until the founder resolves the blueprint-versus-code conflict.
- Detour-cost pricing stays blocked until an explicit founder decision.
- Do not resurrect the historical flat booking-fee model.

### Booking and dispute flow

- Customer flow is `declare need -> ranked offers -> Request to Book or Fast Match -> driver decision -> proof -> confirmation -> payout release`.
- Fast Match is first-accept-wins and must revoke siblings atomically.
- One factual clarification round is allowed. One structured adjustment path is allowed for genuine mismatch.
- Payment is authorised before acceptance, captured on acceptance, and released only after confirmation or the proof-backed auto-release window.
- Proof and payout logic are trust-critical and require stronger review.

### Matching and trust

- Match ranking is deterministic and explanation-backed.
- Result cards must show why the match fits, not just a price.
- Access, stairs, helper, and parking details are matching inputs, not optional polish.
- No direct-contact or off-platform drift should appear in customer-facing flows.

### Mobile and UX

- Customer-facing quality is the highest app-level priority after repo constitution and operating-system stability.
- Tap targets must stay usable on iPhone-sized viewports.
- Sticky actions must respect safe areas.
- One clay focal point per screen; primary CTAs stay ink-led unless a component pattern explicitly says otherwise.

## Live Work And Queue Rules

- GitHub Issues, labels, linked PRs, and comments are the live work system.
- Markdown backlog files are derived only.
- No builder should self-claim vague work outside a shaped `Ready` issue with a lane and lock group.

## gstack

gstack is the approved workflow layer for this repo in Claude and is also installed globally for Codex on this Mac.

- Use `/browse` from gstack for web browsing in Claude. Do not use `mcp__claude-in-chrome__*`.
- Approved gstack skills for this repo include:
  `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`,
  `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`,
  `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/open-gstack-browser`,
  `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`,
  `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`,
  `/plan-devex-review`, `/devex-review`, `/pair-agent`, `/careful`, `/freeze`,
  `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.
- gstack governs workflow execution and browser tooling. MoveMate product truth, pricing truth, and repo-operating truth still come from the canonical docs in this repo.
- Global paths:
  - Claude: `~/.claude/skills/gstack`
  - Codex: `~/.codex/skills/gstack*`
- Keep gstack as a global install or external local reference. Do not vendor its skill trees into the MoveMate repo root.

## Escalation

Escalate only when the work truly needs a founder decision:

- pricing economics
- product-strategy forks
- risky migration cutovers
- legal or trust-policy changes
- cases where preserving two incompatible truths would silently ship confusion

Do not escalate routine engineering judgment, doc cleanup, or obvious stale wording.

## Verification Bar

Every meaningful change should leave behind:

- a clear outcome
- a verification path
- evidence or test output
- residual risk if something could not be fully exercised

If truth changed, update the relevant docs in the same work unit.
