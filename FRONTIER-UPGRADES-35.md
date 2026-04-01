# moverrr — 35 Frontier Upgrades To Do Next

These are project-specific follow-ups inspired by the strongest ideas from the local `claude code src` and `autoresearch` directories.
They are intentionally a mix of product, engineering, verification, and operating-system improvements.

## 1. Agent operating system

1. Create a `.claude/rules/search-and-matching.md` file scoped to `src/lib/matching/**`, `src/app/api/search/**`, and search UI files so matching constraints load only when those files are touched.
2. Create a `.claude/rules/payments-and-payouts.md` file scoped to Stripe, payout, and webhook files so payment-critical instructions are even tighter than the current shared ops rule.
3. Add a `.claude/rules/supabase-schema.md` file scoped to `supabase/**` and `src/types/database.ts` with migration, RPC, rollback, and RLS expectations.
4. Add a `.claude/rules/analytics-and-metrics.md` file scoped to analytics and operational reporting files so tracking stays connected to product questions instead of becoming event spam.
5. Create a `.claude/skills/release-readiness/SKILL.md` that forces a final ship-readiness pass across docs, checks, key flows, and open risks before any production push.
6. Create a `.claude/skills/dispute-resolution-audit/SKILL.md` so dispute-related changes have a repeatable trust-oriented review workflow.
7. Create a `.claude/skills/saved-search-demand-review/SKILL.md` so agents can analyze demand signals and propose supply-side responses instead of just feature changes.
8. Add a root-level `DECISIONS.md` file for short, durable product and architecture decisions that should outlive chat history.

## 2. Verification and QA

9. Add a real booking concurrency integration test that proves only one booking can win the critical race on the same listing.
10. Add an end-to-end test for the carrier template flow: save template, quick-post from template, confirm listing state.
11. Add an end-to-end test for the saved-search loop: no-result search, save search, matching listing created, notification path exercised.
12. Add a webhook replay harness for Stripe events so payment state bugs can be reproduced intentionally instead of from production incidents.
13. Add a focused review test for dispute resolution so `disputed -> completed` cannot regress silently.
14. Add a proof-upload verification harness for mobile-sensitive flows, including file accept types and camera-first behavior.
15. Add a route-contract smoke suite for core API endpoints so public, carrier, customer, and admin surfaces all get a fast response-shape sanity check.
16. Add a lightweight manual verification template that forces every meaningful task to record one happy-path check and one adversarial probe.

## 3. Product instrumentation

17. Start measuring carrier time-to-post from wizard open to successful listing creation.
18. Track template reuse rate per verified carrier so you can tell whether quick-post is materially helping supply.
19. Track search no-result rate by route pair and item category so saved searches become a supply intelligence system.
20. Track saved-search conversion to actual booking so you know whether demand capture is valuable or just vanity.
21. Track proof completion lag after pickup and delivery so ops knows where trust is leaking.
22. Track dispute resolution cycle time and resolution reason so you can see whether manual ops are manageable.
23. Track carrier weekly posting streaks so you can identify who is becoming reliable recurring supply.

## 4. Product and ops loops

24. Turn weekly carrier supply review into a fixed recurring ritual with a short markdown template: new carriers, active carriers, repeat posters, stalled carriers, highest-demand empty routes.
25. Create a weekly trust review template that surfaces proof gaps, stuck bookings, payment failures, and open disputes in one place.
26. Create a monthly "product drift" review that asks whether recent work is still strengthening browse-first spare-capacity behavior.
27. Build a simple "keep or discard" experiment ledger so UX and growth experiments follow the `autoresearch` discipline instead of accumulating half-believed ideas.
28. Give every non-trivial experiment one baseline metric and one explicit keep/discard rule before implementation starts.
29. Add a short founder-style feature brief template: problem, wedge fit, smallest version, success signal, anti-goals.

## 5. Runtime safety and observability

30. Add booking invariant logging around pricing, payout, capacity, and status transitions so silent regressions are easier to diagnose.
31. Add a stuck-state detector for bookings that sit too long in `pending`, `confirmed`, `delivered`, or `disputed`.
32. Add an internal audit report for failed emails, failed payment captures, and skipped notification sends so graceful degradation stays visible.
33. Add a supply-health view for listings with low or stale remaining capacity data so ops can spot broken inventory truth.
34. Add a demand heatmap derived from saved searches to guide Sydney route outreach and carrier recruitment.

## 6. Documentation and project memory

35. Do a monthly memory refactor pass: prune stale docs, collapse duplicate instructions, promote repeated workflow text into skills, and make sure the repo's instruction system stays as sharp as the code.
