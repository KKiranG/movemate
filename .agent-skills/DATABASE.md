# Database

## Core tables (current schema)

- `carriers`
- `vehicles`
- `capacity_listings` (trips)
- `customers`
- `bookings`
- `trip_templates`
- `saved_searches`
- `reviews`
- `disputes`
- `booking_events`

## New/planned entities (blueprint model)

The following entities are introduced by the governing product model. Add them when implementing the corresponding features.

### `move_requests`
The customer's declared move need. Created at wizard completion, persists regardless of whether matches are found.

Key fields: `customer_id`, `pickup` (lat/lng + address + suburb), `dropoff`, `item_category`, `item_variant`, `item_quantity`, `item_photos[]`, `item_notes`, `timing_window{type, date, flexibility_range}`, `access_spec{stairs_pickup, stairs_dropoff, lift_available, helper_available, parking_difficulty}`, `status` (draft / submitted / matched / expired), `created_at`

### `offers`
A computed match linking a Trip to a MoveRequest. Created by the matching pipeline.

Key fields: `trip_id`, `move_request_id`, `computed_match_score`, `match_class` (direct / near_pickup / near_dropoff / minor_detour / nearby_date / partial_route / needs_approval), `match_explanation` (string), `detour_estimate_km`, `detour_estimate_min`, `fit_confidence` (likely_fits / review_photos / needs_approval), `computed_price_total`, `price_breakdown{base, add_ons{}, platform_fee, gst}`, `created_at`

### `booking_requests`
The customer's request to a specific carrier (Request-to-Book) or a group of carriers (Fast Match).

Key fields: `customer_id`, `offer_id`, `request_group_id` (for Fast Match; null for single), `status` (pending / accepted / declined / expired / revoked / clarification_requested), `response_deadline`, `submitted_at`, `responded_at`

### `condition_adjustments`
The structured exception path when the carrier discovers on-site that declared conditions do not match reality.

Key fields: `booking_id`, `triggered_by` (carrier_id), `reason` (enum: stairs_mismatch / helper_required / item_different / parking_extreme), `adjustment_amount`, `customer_response` (accepted / rejected / pending), `created_at`, `responded_at`

### `unmatched_requests`
Demand capture when zero matches exist. Powers Alert the Network.

Key fields: `move_request_id`, `customer_id`, `route_pickup`, `route_dropoff`, `timing_window`, `item_spec`, `access_spec`, `alert_status` (active / notified / matched / expired / cancelled), `carriers_notified[]`, `operator_task_created` (boolean), `concierge_offer_id` (optional), `created_at`, `expires_at` (30 days from creation)

### `concierge_offers`
Founder-led manual fulfilment. Created by the operator when manually sourcing a carrier for an unmatched request.

Key fields: `unmatched_request_id`, `operator_id`, `carrier_id`, `proposed_price`, `status` (proposed / carrier_accepted / customer_confirmed / cancelled), `created_at`

## Trip entity additions

The `capacity_listings` (trips) table should include:
- `checkin_24h_confirmed` (boolean) — trip freshness check-in
- `checkin_2h_confirmed` (boolean) — trip freshness check-in
- `recurring` (boolean), `recurrence_pattern` (optional)
- `waypoints[]` (up to 2 intermediate stops)
- `route_polyline` (geometry) — computed from start + end + waypoints

## Important functions and derived truth

- `create_booking_atomic`
- `accept_booking_request_atomic`
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
