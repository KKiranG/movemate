---
name: ios-touch-audit
description: Audit and tighten moverrr UI changes so they actually work for iPhone-first usage, especially in carrier and proof-heavy flows.
when_to_use: Use when editing carrier, customer, or admin UI; changing forms or buttons; touching proof/photo uploads; or doing polish on mobile layouts. Examples: "improve the dashboard UI", "fix the trip wizard", "clean up the booking page", "make mobile better", or "audit touch targets".
paths:
  - src/app/**
  - src/components/**
  - src/app/globals.css
  - tailwind.config.ts
---

# iOS Touch Audit

Use this skill whenever a UI change could be felt on an iPhone.

## Non-Negotiables

- every interactive target meets the `44x44` rule
- every `hover:` state has an `active:` sibling
- proof/photo capture uses `capture="environment"`
- camera-friendly file inputs include `image/heic,image/heif`
- sticky actions respect safe-area insets
- long scroll areas use `overscroll-behavior: contain`

## Audit Order

1. Search for new or changed interactive elements.
2. Search for `hover:` classes that may have no `active:` twin.
3. Search for `type="file"` and confirm capture/accept rules.
4. Check fixed and sticky elements for safe-area padding.
5. Validate the changed flow at `375px`.

## Priority Areas

Check carrier surfaces first:
- onboarding
- post-trip wizard
- dashboard
- trip detail
- templates

Then customer booking and admin review surfaces.

## Definition Of Done

- `npm run check` passes
- the touched flow works at `375px`
- no new hover-only interactions exist
- camera-first proof capture still works where appropriate
