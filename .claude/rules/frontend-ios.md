---
paths:
  - src/app/**
  - src/components/**
  - src/hooks/**
  - src/app/globals.css
  - tailwind.config.ts
---

# Frontend + iOS Rules

IMPORTANT: moverrr ships as an iOS native app. The web app is a development surface, not the product center of gravity.

## Non-Negotiables

- Every interactive target must be at least `44x44`
- Every `hover:` interaction must have an `active:` sibling
- Proof/photo flows use `capture="environment"`
- File inputs that accept camera photos include `image/heic,image/heif`
- Sticky or fixed actions respect bottom safe area
- Long scroll regions use `overscroll-behavior: contain`
- Validate at `375px` width before calling a UI task done

## Design Direction

The product should feel:
- clean
- high-signal
- narrow-column
- confident rather than ornamental

Avoid:
- desktop-first layouts
- hover-only affordances
- decorative gradients with no product purpose
- tiny pills and ghost buttons that are hard to tap
- generic "marketplace" UI that hides the route-fit value proposition

## UX Priorities

Carrier UX matters first:
- posting a trip quickly
- understanding what is live
- handling bookings without confusion
- capturing proof without friction

Customer UX should emphasize:
- transparent pricing
- why the route is cheaper
- confidence in the carrier
- easy saved-search capture when no results exist

## Before Finishing Frontend Work

- Check the mobile viewport manually
- Scan for new `hover:` without `active:`
- Scan for file inputs and make sure the iOS accept/capture rules still hold
- Make sure sticky actions are not hidden by the home indicator
- Run `npm run check`
