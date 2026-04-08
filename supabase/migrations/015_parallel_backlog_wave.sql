alter table public.capacity_listings
  drop constraint if exists capacity_listings_status_check;

alter table public.capacity_listings
  add constraint capacity_listings_status_check
  check (status in ('draft', 'active', 'paused', 'booked_partial', 'booked_full', 'expired', 'cancelled'));

alter table public.analytics_events
  add column if not exists dedupe_key text;

create unique index if not exists idx_analytics_events_dedupe_key
on public.analytics_events (dedupe_key)
where dedupe_key is not null;

create or replace function public.find_matching_listings_paged(
  p_pickup_lat float,
  p_pickup_lng float,
  p_dropoff_lat float,
  p_dropoff_lng float,
  p_date date default null,
  p_category text default null,
  p_page integer default 1,
  p_page_size integer default 20
)
returns table (
  listing_id uuid,
  pickup_distance_km float,
  dropoff_distance_km float,
  match_score float,
  total_count bigint
)
language sql
as $$
  with scored as (
    select
      cl.id as listing_id,
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
  )
  select
    scored.listing_id,
    scored.pickup_distance_km,
    scored.dropoff_distance_km,
    scored.match_score,
    count(*) over() as total_count
  from scored
  order by scored.match_score desc
  limit greatest(p_page_size, 1)
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$;

create or replace function public.find_matching_listings_nearby_dates(
  p_pickup_lat float,
  p_pickup_lng float,
  p_dropoff_lat float,
  p_dropoff_lng float,
  p_dates date[],
  p_category text default null,
  p_is_return_trip boolean default false,
  p_page integer default 1,
  p_page_size integer default 20
)
returns table (
  listing_id uuid,
  pickup_distance_km float,
  dropoff_distance_km float,
  match_score float,
  total_count bigint
)
language sql
as $$
  with scored as (
    select
      cl.id as listing_id,
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
      and cl.trip_date = any(p_dates)
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
      and (
        p_category is null
        or (p_category = 'furniture' and cl.accepts_furniture)
        or (p_category = 'boxes' and cl.accepts_boxes)
        or (p_category = 'appliance' and cl.accepts_appliances)
        or (p_category = 'fragile' and cl.accepts_fragile)
        or (p_category = 'other')
      )
      and (not p_is_return_trip or cl.is_return_trip)
  )
  select
    scored.listing_id,
    scored.pickup_distance_km,
    scored.dropoff_distance_km,
    scored.match_score,
    count(*) over() as total_count
  from scored
  order by scored.match_score desc
  limit greatest(p_page_size, 1)
  offset greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$;
