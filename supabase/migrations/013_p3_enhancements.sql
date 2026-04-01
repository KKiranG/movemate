alter table public.capacity_listings
  add column if not exists publish_at timestamptz;

alter table public.capacity_listings
  add column if not exists source_template_id uuid references public.trip_templates(id) on delete set null;

update public.capacity_listings
set publish_at = coalesce(publish_at, created_at)
where publish_at is null;

alter table public.capacity_listings
  alter column publish_at set default now();

alter table public.reviews
  add column if not exists carrier_response text,
  add column if not exists carrier_responded_at timestamptz;

alter table public.disputes
  add column if not exists assigned_admin_user_id uuid;

alter table public.carriers
  add column if not exists internal_notes text,
  add column if not exists internal_tags text[] not null default '{}';

create table if not exists public.rate_limit_overrides (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('user', 'ip')),
  actor_value text not null,
  endpoint_key text,
  override_limit integer not null check (override_limit > 0),
  window_ms integer not null check (window_ms > 0),
  expires_at timestamptz not null,
  created_by uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_overrides_lookup
on public.rate_limit_overrides (actor_type, actor_value, endpoint_key, expires_at desc);

alter table public.rate_limit_overrides enable row level security;

drop policy if exists "admin_manage_rate_limit_overrides" on public.rate_limit_overrides;
create policy "admin_manage_rate_limit_overrides"
on public.rate_limit_overrides
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
  )
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('customer', 'carrier', 'admin')),
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  is_active boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
on public.push_subscriptions (user_id, is_active);

alter table public.push_subscriptions enable row level security;

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
on public.push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
on public.push_subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
on public.push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "authenticated_upload_carrier_documents" on storage.objects;
drop policy if exists "authenticated_read_own_private_objects" on storage.objects;

create policy "authenticated_upload_private_objects_by_prefix"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('carrier-documents', 'vehicle-photos', 'item-photos', 'proof-photos')
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1
      from public.admin_users admin_user
      where admin_user.user_id = auth.uid()
    )
  )
);

create policy "authenticated_read_private_objects_by_prefix"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('carrier-documents', 'vehicle-photos', 'item-photos', 'proof-photos')
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1
      from public.admin_users admin_user
      where admin_user.user_id = auth.uid()
    )
  )
);

create index if not exists idx_capacity_listings_source_template_id
on public.capacity_listings (source_template_id);

create or replace function public.find_matching_listings(
  p_pickup_lat float,
  p_pickup_lng float,
  p_dropoff_lat float,
  p_dropoff_lng float,
  p_date date default null,
  p_category text default null,
  p_limit integer default 20
)
returns table (
  listing_id uuid,
  carrier_id uuid,
  carrier_name text,
  carrier_rating numeric,
  vehicle_type text,
  origin_suburb text,
  destination_suburb text,
  trip_date date,
  time_window text,
  space_size text,
  price_cents integer,
  detour_radius_km numeric,
  pickup_distance_km float,
  dropoff_distance_km float,
  match_score float
)
language plpgsql
as $$
begin
  return query
  select
    cl.id as listing_id,
    c.id as carrier_id,
    c.business_name as carrier_name,
    c.average_rating as carrier_rating,
    v.type as vehicle_type,
    cl.origin_suburb,
    cl.destination_suburb,
    cl.trip_date,
    cl.time_window,
    cl.space_size,
    cl.price_cents,
    cl.detour_radius_km,
    st_distance(
      cl.origin_point,
      st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography
    ) / 1000.0 as pickup_distance_km,
    st_distance(
      cl.destination_point,
      st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography
    ) / 1000.0 as dropoff_distance_km,
    (
      (100.0 - least(
        st_distance(
          cl.origin_point,
          st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography
        ) / 1000.0,
        50.0
      )) * 0.35
      +
      (100.0 - least(
        st_distance(
          cl.destination_point,
          st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography
        ) / 1000.0,
        50.0
      )) * 0.35
      +
      (c.average_rating * 4.0) * 0.20
      +
      (100.0 - least(cl.price_cents / 100.0, 100.0)) * 0.10
    ) as match_score
  from public.capacity_listings cl
  join public.carriers c on c.id = cl.carrier_id
  join public.vehicles v on v.id = cl.vehicle_id
  where
    cl.status in ('active', 'booked_partial')
    and c.is_verified = true
    and cl.trip_date >= current_date
    and coalesce(cl.publish_at, cl.created_at) <= now()
    and cl.origin_point::geometry && st_expand(
      st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326),
      greatest(cl.detour_radius_km / 111.0, 0.01)
    )
    and cl.destination_point::geometry && st_expand(
      st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326),
      greatest(cl.detour_radius_km / 111.0, 0.01)
    )
    and st_dwithin(
      cl.origin_point,
      st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
      cl.detour_radius_km * 1000
    )
    and st_dwithin(
      cl.destination_point,
      st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography,
      cl.detour_radius_km * 1000
    )
    and (p_date is null or cl.trip_date = p_date)
    and (
      p_category is null
      or (p_category = 'furniture' and cl.accepts_furniture)
      or (p_category = 'boxes' and cl.accepts_boxes)
      or (p_category = 'appliance' and cl.accepts_appliances)
      or (p_category = 'fragile' and cl.accepts_fragile)
      or (p_category = 'other')
    )
  order by match_score desc
  limit p_limit;
end;
$$;
