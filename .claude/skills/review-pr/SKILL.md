---
name: review-pr
description: MoveMate-specific PR review centered on invariants, trust copy, iOS contract, and verification evidence.
when_to_use: Use when reviewing a pull request in this repo.
argument-hint: [pr: #123 or branch-name]
effort: high
---

# Review PR

Use `$ARGUMENTS` to specify the PR number or branch (e.g. `#42`, `feature/carrier-signup`).

This skill produces structured findings against MoveMate's invariants, not generic code feedback.

## Read First

1. `CLAUDE.md` pricing, booking, and iOS invariants
2. `.claude/rules/` for the area changed
3. Relevant `.agent-skills/` file

## Checklist

### Trust and Thesis
- [ ] No drift toward dispatch, quote-engine, or bidding
- [ ] Savings story stays legible ("you save because your item fits a trip already happening")
- [ ] Copy is evidence-led, not vague marketing language

### iOS Contract
- [ ] Tap targets `min-h-[44px] min-w-[44px]`
- [ ] `active:` alongside every `hover:`
- [ ] Safe-area respected on fixed/sticky elements
- [ ] `capture="environment"` on proof inputs

### Pricing Invariants (if pricing was touched)
- [ ] Commission is `15%` of `basePriceCents` only
- [ ] Booking fee remains `0` unless a founder decision explicitly changes it
- [ ] No commission on stairs or helper fees

### Booking and Payment (if booking/payment was touched)
- [ ] Booking creation stays atomic via RPC
- [ ] `remaining_capacity_pct` updated correctly
- [ ] `disputed -> completed` only when dispute is `resolved` or `closed`
- [ ] Webhook and payout paths preserved

### Database (if schema was touched)
- [ ] RLS on all new tables
- [ ] GIST index on geography columns
- [ ] Migration is sequential and reversible

### Verification Evidence
- [ ] `npm run check` passes
- [ ] The changed surface was exercised directly
- [ ] At least one adversarial case was tried

## Report

End with:

```
Verdict: approve / request changes / block
Invariant violations: [list or "none"]
Missing verification evidence: [list or "complete"]
Trust or copy concerns: [list or "none"]
```
