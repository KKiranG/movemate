# Database

## Core tables

- `carriers`
- `vehicles`
- `capacity_listings`
- `customers`
- `bookings`
- `trip_templates`
- `saved_searches`
- `reviews`
- `disputes`
- `booking_events`

## Important functions and derived truth

- `create_booking_atomic`
- `recalculate_listing_capacity`
- `remaining_capacity_pct`

## Hard rules

- enable RLS on every new marketplace table
- add a GIST index to every geography column
- keep admin-only privileged operations behind `createAdminClient()`
- use sequential migrations in `supabase/migrations/`
- preserve booking and inventory consistency when statuses change

## Design principles

- PostGIS is the spatial backbone
- marketplace truth should stay explicit, not inferred from vague flags
- booking history and dispute history should stay auditable
- schema changes should reinforce explainability, not hide business logic

## Common mistakes

- creating a table without policies
- forgetting the geography index
- mixing app-layer guard logic into a pure state helper
- changing booking or listing behavior without syncing capacity logic
