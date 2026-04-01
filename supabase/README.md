# Supabase Workflow

## Local setup

1. Install the Supabase CLI.
2. Start local services with `npm run supabase:start`.
3. Reset the local database with migrations and seed data using `npm run supabase:reset`.

## Day-to-day commands

- `npm run supabase:start`
  Starts the local Supabase stack.

- `npm run supabase:reset`
  Reapplies all migrations and reseeds the database from [`supabase/seed.sql`](/Users/kiranghimire/Documents/moverrr/supabase/seed.sql).

- `npm run supabase:push`
  Pushes new local migrations to the linked remote project.

## Migration workflow

1. Add a new sequential SQL file in [`supabase/migrations`](/Users/kiranghimire/Documents/moverrr/supabase/migrations).
2. Run `npm run supabase:reset` locally to confirm the migration order and seed still work.
3. Run `npm run check` before pushing.
4. Use `npm run supabase:push` only after the migration is validated locally.

## Seed expectations

- [`supabase/seed.sql`](/Users/kiranghimire/Documents/moverrr/supabase/seed.sql) should always create future-dated demo listings.
- Keep auth users deterministic so QA can sign in reliably.
- Use seed data for smoke tests, not for product behavior that should live in migrations or app code.
