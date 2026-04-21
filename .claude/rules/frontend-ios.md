---
paths:
  - src/app/**
  - src/components/**
  - src/hooks/**
  - src/app/globals.css
  - tailwind.config.ts
---

# Frontend + Mobile Rules

MoveMate is mobile-first. All flows are designed for phone-first use. Validate at 375px before calling any UI task done.

## Non-Negotiables

- Every interactive target must be at least `44x44`
- Every `hover:` interaction must have an `active:` sibling
- Proof/photo flows use `capture="environment"`
- File inputs that accept camera photos include `image/heic,image/heif`
- Sticky or fixed actions respect bottom safe area (`env(safe-area-inset-bottom)`)
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
- posting a trip quickly (quick-post target: under 30 seconds)
- understanding what is live and what is pending
- handling booking decision cards without confusion
- capturing proof (camera-first, large tap targets designed for in-vehicle use)
- runsheet mode: one-tap status updates that are safe while driving

Customer UX should emphasize:
- wizard-first entry (need before inventory)
- "Why this matches" explanation on every result card
- total all-in price visible before tapping into offer detail
- trust signals and fit-confidence labels
- zero-match → Alert the Network, never a dead end

## Before Finishing Frontend Work

- Check the mobile viewport manually at 375px
- Scan for new `hover:` without `active:`
- Scan for file inputs and make sure the accept/capture rules still hold
- Make sure sticky actions are not hidden by the home indicator
- Run `npm run check`
