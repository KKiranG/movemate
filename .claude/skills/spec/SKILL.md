---
name: spec
description: Interview-first feature specification workflow that produces an implementation-ready SPEC.md before any code is written.
when_to_use: Use when starting large feature work that needs think-first rigor before implementation begins.
argument-hint: [feature: short description]
effort: high
invocation: manual
---

# Spec

Use this skill to produce a durable feature spec before touching code. Do not start implementation until the spec is confirmed.

## Interview

Ask the user to confirm:

1. What user problem does this solve?
2. Who is affected: carrier, customer, or admin?
3. Does this fit moverrr's need-first, match-ranked spare-capacity thesis? If not, stop here and flag to the founder.
4. What is the smallest version worth shipping?
5. What would make this undeniably done?

## Thesis Check

If the feature pushes moverrr toward dispatch, bidding, quote comparison, or removalist packaging — stop and flag it before continuing. Document the concern explicitly.

## Output

Write `SPEC.md` at the repo root:

```md
# Spec: [Feature Name]

## Problem
One sentence.

## Who It Affects
carrier | customer | admin

## Thesis Check
Pass / fail. If fail, describe why and what the founder needs to decide.

## Smallest Shippable Version
- bullet list

## Files Likely Affected
- exact paths

## Acceptance Criteria
Verifiable outcomes, not aspirational goals.

## Open Questions
Anything blocking implementation that requires a founder decision.
```

After writing, ask: "Does this spec match what you want to build?" Do not implement until confirmed.
