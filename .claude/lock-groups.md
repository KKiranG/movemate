# MoveMate Lock Groups

Lock groups define safe parallelism. Priority labels do not.

Rule:

- Only one build agent should own one lock group at a time.
- At most one active build agent owns one lock group at a time.
- If work touches shared logic across groups, treat it as not parallel-safe unless explicitly reviewed and split.

## Groups

### `customer-acquisition`

Owns:

- home page
- public marketing pages
- top-of-funnel trust copy
- discovery and declaration entrypoints

Collision warning:

- Avoid concurrent work with `customer-booking-lifecycle` if both change shared customer primitives or route-state helpers.

### `customer-booking-lifecycle`

Owns:

- move declaration flow
- results
- offer detail
- checkout / request submit
- customer booking detail, proof, disputes, and post-booking actions

Collision warning:

- Often touches pricing, booking state, and shared presenters. Mark `Touches shared logic: yes` when it does.

### `carrier-activation-posting`

Owns:

- carrier onboarding
- carrier auth-to-setup flow
- trip posting
- templates and quick-post

### `carrier-operations`

Owns:

- carrier request queue
- trip detail
- runsheets
- payout blocker surfaces
- driver operational home states

### `matching-pricing-state`

Owns:

- matching logic
- pricing helpers
- booking states
- payment lifecycle
- recovery demand logic

Collision warning:

- This is shared logic by default. Parallel work here is rare and should be deliberate.

### `admin-operator`

Owns:

- admin queues
- trust and safety operations
- founder or operator review surfaces

### `system-hygiene`

Owns:

- docs
- GitHub templates
- CI
- scripts
- env/deploy scaffolding
- repo operating system

## Collision Rules

- If a task changes shared primitives, presenters, schema, or pricing helpers, mark `Touches shared logic: yes`.
- If two tasks need the same shared logic and cannot be cleanly split, serialize them.
- If a task is docs-only and describes a product or workflow truth already changing elsewhere, it is blocked until the source work lands or is reviewed together.
