---
name: verify-moverrr-change
description: Run a real MoveMate verification pass after non-trivial changes, with explicit evidence instead of ceremonial "looks good" validation.
when_to_use: Use when the user asks to verify, audit, sanity-check, or review a change, or when you are about to finish a meaningful implementation. Examples: "verify this works", "do a final pass", "review the booking flow", "sanity check this PR", or "make sure the mobile UI is correct".
argument-hint: [area: frontend|backend|booking|database|docs]
effort: high
---

# Verify MoveMate Change

Use `$ARGUMENTS` to scope the verification pass (e.g. `booking`, `frontend`, `database`).

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
  Re-check commission math, zero booking-fee behavior, status transitions, dispute guard behavior, and capacity updates.
- **Database / migrations**
  Inspect RLS, indexes, reversibility where relevant, and the effect on current flows.
- **Docs / memory**
  Check for stale paths, duplicate truth, contradictions, and future-tense docs for already shipped features.

## Adversarial Probe

Always run at least one named "try to break it" check and name it in the report:

- boundary value
- duplicate submission
- empty state
- stale or missing config
- narrow viewport
- role mismatch

If you did not try to break anything, the verification pass is incomplete.

## Report

End with:

```
Checks run: [list]
Evidence observed: [exact behavior, file:line, response shapes]
Pass / fail / partial: [verdict]
Adversarial probe: [name of probe + what you tried + result]
Residual risk: [anything not verified or still open]
```

Be literal. If you could not verify something, say so plainly.
