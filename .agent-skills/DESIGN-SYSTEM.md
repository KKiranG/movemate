# Design System

## Visual direction

moverrr should feel:
- clean
- high-signal
- information-dense
- confident

The reference blend is:
- Perplexity-clean structure
- strong, direct marketplace clarity

## Typography and layout

- headings: Instrument Sans
- body: system stack
- max content width around `640px`
- mobile side padding around `16px`
- cards use a restrained radius

## Core interaction rules

- `44px` minimum touch targets
- every `hover:` state needs an `active:` sibling
- prefer skeletons to spinners
- transitions stay restrained
- touch feedback should feel deliberate, not ornamental

## iOS-first rules

- proof uploads use `capture="environment"`
- file inputs accept `image/heic,image/heif`
- sticky/fixed surfaces respect safe-area insets
- scroll containers use `overscroll-behavior: contain`
- validate at `375px`

## Avoid

- decorative gradients with no product purpose
- tiny pill buttons
- hover-only behavior
- generic marketplace polish that hides the route-fit story
- native tiny checkboxes for important carrier toggles
