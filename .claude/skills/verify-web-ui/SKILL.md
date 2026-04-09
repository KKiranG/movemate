---
name: verify-web-ui
description: Verify customer and carrier web UI with iPhone-first checks, not generic desktop QA.
when_to_use: Use after meaningful UI work on browse, booking, or posting surfaces.
argument-hint: [surface: browse|booking|carrier-posting|admin]
---

# Verify Web UI

Use `$ARGUMENTS` to scope to a specific surface (e.g. `browse`, `booking`, `carrier-posting`).

## Check

- 375px viewport
- tap targets `min-h-[44px] min-w-[44px]`
- `active:` states alongside every `hover:`
- empty/loading/error states
- sticky safe-area `env(safe-area-inset-bottom)` behavior
- file-input `capture="environment"` on proof flows

## Adversarial Probe

Run at least one named try-to-break-it check and report it by name:

- narrow-viewport: resize to 375px and interact with the changed surface
- tap-on-hover-only: find any interactive element without an `active:` class
- safe-area-overflow: scroll to the bottom and confirm no content is behind the home indicator
- empty-state: trigger an empty result and confirm the state is not blank

## Report

End every run with:

```
Checks run: [list]
Evidence observed: [screenshots, console logs, CSS values]
Pass / fail / partial: [verdict]
Adversarial probe: [name of probe + what you tried + result]
Residual risk: [anything not verified]
```
