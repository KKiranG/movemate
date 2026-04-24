alter table public.capacity_listings
  add column if not exists freshness_miss_count integer not null default 0,
  add column if not exists freshness_last_action text not null default 'none',
  add column if not exists freshness_suspension_reason text,
  add column if not exists last_freshness_confirmed_at timestamptz,
  add column if not exists last_freshness_unsuspended_at timestamptz;

alter table public.capacity_listings
  drop constraint if exists capacity_listings_freshness_last_action_check;

alter table public.capacity_listings
  add constraint capacity_listings_freshness_last_action_check
  check (
    freshness_last_action in (
      'none',
      'requested_24h',
      'confirmed_24h',
      'requested_2h',
      'confirmed_2h',
      'suspended',
      'unsuspended'
    )
  );

alter table public.capacity_listings
  drop constraint if exists capacity_listings_freshness_suspension_reason_check;

alter table public.capacity_listings
  add constraint capacity_listings_freshness_suspension_reason_check
  check (
    freshness_suspension_reason is null
    or freshness_suspension_reason in ('missed_2h_checkin', 'manual_ops', 'other')
  );

alter table public.admin_action_events
  alter column admin_user_id drop not null,
  add column if not exists actor_role text not null default 'admin';

alter table public.admin_action_events
  drop constraint if exists admin_action_events_entity_type_check;

alter table public.admin_action_events
  add constraint admin_action_events_entity_type_check
  check (
    entity_type in (
      'unmatched_request',
      'listing',
      'booking',
      'dispute',
      'carrier',
      'concierge_offer',
      'operator_task',
      'booking_request',
      'request_group',
      'condition_adjustment'
    )
  );

alter table public.admin_action_events
  drop constraint if exists admin_action_events_actor_role_check;

alter table public.admin_action_events
  add constraint admin_action_events_actor_role_check
  check (actor_role in ('admin', 'system'));

create table if not exists public.booking_request_events (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests (id) on delete cascade,
  move_request_id uuid not null references public.move_requests (id) on delete cascade,
  request_group_id uuid,
  actor_role text not null
    check (actor_role in ('customer', 'carrier', 'admin', 'system')),
  actor_user_id uuid,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_booking_request_events_request
on public.booking_request_events (booking_request_id, created_at desc);

create index if not exists idx_booking_request_events_group
on public.booking_request_events (request_group_id, created_at desc);

create index if not exists idx_booking_request_events_move_request
on public.booking_request_events (move_request_id, created_at desc);

create table if not exists public.condition_adjustments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  carrier_id uuid not null references public.carriers (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  reason_code text not null
    check (reason_code in ('stairs_mismatch', 'helper_required', 'item_materially_different', 'extreme_parking')),
  amount_cents integer not null
    check (amount_cents in (1500, 3000, 4500, 6000, 9000)),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  note text,
  customer_response_note text,
  response_deadline_at timestamptz not null default (timezone('utc'::text, now()) + interval '12 hours'),
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists idx_condition_adjustments_one_round
on public.condition_adjustments (booking_id);

create index if not exists idx_condition_adjustments_status
on public.condition_adjustments (status, created_at desc);

alter table public.booking_request_events enable row level security;
alter table public.condition_adjustments enable row level security;

drop trigger if exists condition_adjustments_set_updated_at on public.condition_adjustments;
create trigger condition_adjustments_set_updated_at
before update on public.condition_adjustments
for each row
execute function public.set_updated_at();

drop policy if exists "booking_request_events_customer_or_carrier_read" on public.booking_request_events;
create policy "booking_request_events_customer_or_carrier_read"
on public.booking_request_events
for select
to authenticated
using (
  exists (
    select 1
    from public.booking_requests booking_request
    left join public.customers customer on customer.id = booking_request.customer_id
    left join public.carriers carrier on carrier.id = booking_request.carrier_id
    where booking_request.id = booking_request_events.booking_request_id
      and (
        customer.user_id = auth.uid()
        or carrier.user_id = auth.uid()
      )
  )
);

drop policy if exists "booking_request_events_admin_read_all" on public.booking_request_events;
create policy "booking_request_events_admin_read_all"
on public.booking_request_events
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
  )
);

drop policy if exists "booking_request_events_service_role_all" on public.booking_request_events;
create policy "booking_request_events_service_role_all"
on public.booking_request_events
for all
to service_role
using (true)
with check (true);

drop policy if exists "condition_adjustments_customer_or_carrier_read" on public.condition_adjustments;
create policy "condition_adjustments_customer_or_carrier_read"
on public.condition_adjustments
for select
to authenticated
using (
  exists (
    select 1
    from public.customers customer
    where customer.id = condition_adjustments.customer_id
      and customer.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.carriers carrier
    where carrier.id = condition_adjustments.carrier_id
      and carrier.user_id = auth.uid()
  )
);

drop policy if exists "condition_adjustments_admin_read_all" on public.condition_adjustments;
create policy "condition_adjustments_admin_read_all"
on public.condition_adjustments
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
  )
);

drop policy if exists "condition_adjustments_service_role_all" on public.condition_adjustments;
create policy "condition_adjustments_service_role_all"
on public.condition_adjustments
for all
to service_role
using (true)
with check (true);
