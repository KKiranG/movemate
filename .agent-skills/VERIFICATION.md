# Verification

## Principle

Verification is a separate job from implementation.
The goal is to prove the change works and to try to break it.

## Always start here

Run:

```bash
npm run check
```

If that fails, the task is not done.

## Then verify by change type

### Frontend

- mobile viewport at `375px`
- tap target size
- `active:` feedback
- empty, loading, and error states
- file-input rules for proof flows

### Backend / API

- direct route or function exercise
- response shape and status
- one edge case
- one adversarial input

### Booking / pricing / payments

- pricing identity
- booking state invariants
- dispute completion guard
- capacity updates
- payment or webhook behavior when relevant

### Docs / memory

- no stale paths
- no conflicting instructions
- no duplicate source of truth

## Reporting bar

State:
- what you ran
- what you observed
- whether the result passed, failed, or remained partially unverified

Do not turn "I read the code and it looks right" into a verification claim.
