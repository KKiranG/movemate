---
name: verify-moverrr-change
description: Run a real moverrr verification pass after non-trivial changes, with explicit evidence instead of ceremonial "looks good" validation.
when_to_use: Use when the user asks to verify, audit, sanity-check, or review a change, or when you are about to finish a meaningful implementation. Examples: "verify this works", "do a final pass", "review the booking flow", "sanity check this PR", or "make sure the mobile UI is correct".
---

# Verify moverrr Change

Use this skill after non-trivial work. The point is to prove behavior, not to narrate confidence.

## Baseline

Always do these first:

1. Read `CLAUDE.md` and the relevant `.claude/rules/` file.
2. Read the matching `.agent-skills/` file for the area you changed.
3. Run:

```bash
npm run check
```

If that fails, do not claim the work is done.

## Then Verify The Actual Change

Match the verification to the change type:

- **Frontend**
  Check the mobile viewport at `375px`, tap targets, `active:` states, safe-area handling, and any file-input rules.
- **Backend / API**
  Hit the path directly or exercise the logic with representative inputs. Validate error handling too, not just the happy path.
- **Bookings / pricing / payments**
  Re-check commission math, booking fee, status transitions, dispute guard behavior, and capacity updates.
- **Database / migrations**
  Inspect RLS, indexes, reversibility where relevant, and the effect on current flows.
- **Docs / memory**
  Check for stale paths, duplicate truth, contradictions, and future-tense docs for already shipped features.

## Adversarial Probe

Always run at least one "try to break it" check:

- boundary value
- duplicate submission
- empty state
- stale or missing config
- narrow viewport
- role mismatch

If you did not try to break anything, the verification pass is incomplete.

## Reporting Format

End with a compact verdict:

- what you checked
- what evidence you saw
- what still remains unverified, if anything

Be literal. If you could not verify something, say so plainly.
