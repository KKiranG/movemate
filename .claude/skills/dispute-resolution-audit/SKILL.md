---
name: dispute-resolution-audit
description: Audit dispute, proof, resolution, refund, and status-guard work with a trust-first verification lens.
when_to_use: Use when changes touch disputes, proof capture, admin resolution, payout blocking, or `disputed -> completed` behavior.
effort: high
invocation: manual
---

# Dispute Resolution Audit

Invoke this skill explicitly — do not auto-trigger from casual mentions of disputes.

1. Read `operations-and-trust.md`, `payments-and-payouts.md`, and the dispute-related code.
2. Verify the proof requirements at pickup, delivery, and dispute intake.
3. Try the unresolved-dispute completion path and confirm it fails.
4. Confirm audit events, resolution notes, and any payout effects are legible.

## Adversarial Probe

Run at least one named probe:

- disputed-completion-without-resolution: attempt `disputed -> completed` while dispute is still open — confirm blocked
- missing-proof-at-dispute: raise a dispute without proof photos — confirm intake works or fails as intended
- double-resolution: resolve a dispute twice — confirm idempotent or correctly rejected

Always report:
- what evidence exists
- what status guards you tested
- adversarial probe: [name + what you tried + result]
- any unresolved trust gap
