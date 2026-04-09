alter table public.bookings
  add column if not exists item_size_class text,
  add column if not exists item_weight_band text;

alter table public.bookings
  drop constraint if exists bookings_item_size_class_check,
  drop constraint if exists bookings_item_weight_band_check;

alter table public.bookings
  add constraint bookings_item_size_class_check
    check (item_size_class is null or item_size_class in ('S', 'M', 'L', 'XL')),
  add constraint bookings_item_weight_band_check
    check (
      item_weight_band is null or item_weight_band in ('under_20kg', '20_to_50kg', '50_to_100kg', 'over_100kg')
    );

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists "service role manages stripe webhook events" on public.stripe_webhook_events;
create policy "service role manages stripe webhook events"
on public.stripe_webhook_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.estimate_booking_capacity_pct(
  p_listing_volume_m3 numeric,
  p_listing_weight_kg numeric,
  p_item_dimensions text,
  p_item_weight_kg numeric,
  p_item_category text,
  p_item_size_class text default null,
  p_item_weight_band text default null
)
returns integer
language plpgsql
immutable
as $$
declare
  v_numbers text[];
  v_units text[];
  v_largest_raw numeric := 0;
  v_has_explicit_meters boolean := false;
  v_has_explicit_centimeters boolean := false;
  v_dimension_1_m numeric := 0;
  v_dimension_2_m numeric := 0;
  v_dimension_3_m numeric := 0;
  v_volume_m3 numeric := 0;
  v_volume_pct integer := 0;
  v_weight_pct integer := 0;
  v_size_class_pct integer := case p_item_size_class
    when 'S' then 15
    when 'M' then 30
    when 'L' then 50
    when 'XL' then 75
    else 0
  end;
  v_weight_band_pct integer := case p_item_weight_band
    when 'under_20kg' then 10
    when '20_to_50kg' then 20
    when '50_to_100kg' then 35
    when 'over_100kg' then 50
    else 0
  end;
  v_fallback_pct integer := case p_item_category
    when 'furniture' then 35
    when 'boxes' then 15
    when 'appliance' then 30
    when 'fragile' then 20
    else 20
  end;
  v_estimated_pct integer := 0;
begin
  select
    array_agg(match[1]),
    array_agg(coalesce(lower(match[2]), ''))
  into v_numbers, v_units
  from regexp_matches(
    coalesce(p_item_dimensions, ''),
    '(\d+(?:\.\d+)?)\s*(cm|m)?',
    'gi'
  ) as match;

  if array_length(v_numbers, 1) >= 3 then
    v_largest_raw := greatest(
      v_numbers[1]::numeric,
      v_numbers[2]::numeric,
      v_numbers[3]::numeric
    );
    v_has_explicit_meters := 'm' = any(v_units);
    v_has_explicit_centimeters := 'cm' = any(v_units);

    v_dimension_1_m := case
      when v_units[1] = 'm' then v_numbers[1]::numeric
      when v_units[1] = 'cm' then v_numbers[1]::numeric / 100
      when v_has_explicit_meters and not v_has_explicit_centimeters then v_numbers[1]::numeric
      when v_largest_raw <= 10 then v_numbers[1]::numeric
      else v_numbers[1]::numeric / 100
    end;
    v_dimension_2_m := case
      when v_units[2] = 'm' then v_numbers[2]::numeric
      when v_units[2] = 'cm' then v_numbers[2]::numeric / 100
      when v_has_explicit_meters and not v_has_explicit_centimeters then v_numbers[2]::numeric
      when v_largest_raw <= 10 then v_numbers[2]::numeric
      else v_numbers[2]::numeric / 100
    end;
    v_dimension_3_m := case
      when v_units[3] = 'm' then v_numbers[3]::numeric
      when v_units[3] = 'cm' then v_numbers[3]::numeric / 100
      when v_has_explicit_meters and not v_has_explicit_centimeters then v_numbers[3]::numeric
      when v_largest_raw <= 10 then v_numbers[3]::numeric
      else v_numbers[3]::numeric / 100
    end;

    v_volume_m3 := v_dimension_1_m * v_dimension_2_m * v_dimension_3_m;
  end if;

  if coalesce(p_listing_volume_m3, 0) > 0 and v_volume_m3 > 0 then
    v_volume_pct := ceil((v_volume_m3 / p_listing_volume_m3) * 100);
  end if;

  if coalesce(p_listing_weight_kg, 0) > 0 and coalesce(p_item_weight_kg, 0) > 0 then
    v_weight_pct := ceil((p_item_weight_kg / p_listing_weight_kg) * 100);
  end if;

  v_estimated_pct := greatest(
    coalesce(v_volume_pct, 0),
    coalesce(v_weight_pct, 0),
    coalesce(v_size_class_pct, 0),
    coalesce(v_weight_band_pct, 0),
    v_fallback_pct
  );

  return least(100, greatest(5, v_estimated_pct));
end;
$$;

create or replace function public.upsert_carrier_onboarding_atomic(
  p_user_id uuid,
  p_business_name text,
  p_contact_name text,
  p_phone text,
  p_email text,
  p_abn text default null,
  p_bio text default null,
  p_licence_photo_url text default null,
  p_insurance_photo_url text default null,
  p_vehicle_photo_url text default null,
  p_service_suburbs text[] default '{}',
  p_licence_expiry_date date default null,
  p_insurance_expiry_date date default null,
  p_vehicle_type text default 'van',
  p_vehicle_make text default null,
  p_vehicle_model text default null,
  p_vehicle_volume_m3 numeric default 1,
  p_vehicle_weight_kg numeric default 100,
  p_rego_plate text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_carrier public.carriers%rowtype;
  v_existing_vehicle_id uuid;
begin
  insert into public.carriers (
    user_id,
    business_name,
    contact_name,
    phone,
    email,
    abn,
    bio,
    licence_photo_url,
    insurance_photo_url,
    vehicle_photo_url,
    service_suburbs,
    verification_status,
    verification_submitted_at,
    licence_expiry_date,
    insurance_expiry_date
  ) values (
    p_user_id,
    p_business_name,
    p_contact_name,
    p_phone,
    p_email,
    nullif(p_abn, ''),
    nullif(p_bio, ''),
    nullif(p_licence_photo_url, ''),
    nullif(p_insurance_photo_url, ''),
    nullif(p_vehicle_photo_url, ''),
    coalesce(p_service_suburbs, '{}'),
    'submitted',
    now(),
    p_licence_expiry_date,
    p_insurance_expiry_date
  )
  on conflict (user_id)
  do update set
    business_name = excluded.business_name,
    contact_name = excluded.contact_name,
    phone = excluded.phone,
    email = excluded.email,
    abn = excluded.abn,
    bio = excluded.bio,
    licence_photo_url = excluded.licence_photo_url,
    insurance_photo_url = excluded.insurance_photo_url,
    vehicle_photo_url = excluded.vehicle_photo_url,
    service_suburbs = excluded.service_suburbs,
    verification_status = 'submitted',
    verification_submitted_at = now(),
    licence_expiry_date = excluded.licence_expiry_date,
    insurance_expiry_date = excluded.insurance_expiry_date
  returning * into v_carrier;

  select id
  into v_existing_vehicle_id
  from public.vehicles
  where carrier_id = v_carrier.id
    and is_active = true
  order by created_at asc
  limit 1;

  if v_existing_vehicle_id is not null then
    update public.vehicles
    set
      type = p_vehicle_type,
      make = nullif(p_vehicle_make, ''),
      model = nullif(p_vehicle_model, ''),
      rego_plate = nullif(p_rego_plate, ''),
      max_volume_m3 = p_vehicle_volume_m3,
      max_weight_kg = p_vehicle_weight_kg,
      photo_urls = case
        when nullif(p_vehicle_photo_url, '') is null then '{}'
        else array[nullif(p_vehicle_photo_url, '')]
      end,
      is_active = true
    where id = v_existing_vehicle_id;
  else
    insert into public.vehicles (
      carrier_id,
      type,
      make,
      model,
      rego_plate,
      max_volume_m3,
      max_weight_kg,
      photo_urls,
      is_active
    ) values (
      v_carrier.id,
      p_vehicle_type,
      nullif(p_vehicle_make, ''),
      nullif(p_vehicle_model, ''),
      nullif(p_rego_plate, ''),
      p_vehicle_volume_m3,
      p_vehicle_weight_kg,
      case
        when nullif(p_vehicle_photo_url, '') is null then '{}'
        else array[nullif(p_vehicle_photo_url, '')]
      end,
      true
    );
  end if;

  return v_carrier.id;
end;
$$;

create or replace function public.create_booking_atomic(
  p_listing_id uuid,
  p_customer_id uuid,
  p_carrier_id uuid,
  p_actor_user_id uuid,
  p_item_description text,
  p_item_category text,
  p_item_dimensions text default null,
  p_item_weight_kg numeric default null,
  p_item_size_class text default null,
  p_item_weight_band text default null,
  p_item_photo_urls text[] default '{}',
  p_needs_stairs boolean default false,
  p_needs_helper boolean default false,
  p_special_instructions text default null,
  p_pickup_address text,
  p_pickup_suburb text,
  p_pickup_postcode text,
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_pickup_access_notes text default null,
  p_pickup_contact_name text default null,
  p_pickup_contact_phone text default null,
  p_dropoff_address text,
  p_dropoff_suburb text,
  p_dropoff_postcode text,
  p_dropoff_lat double precision,
  p_dropoff_lng double precision,
  p_dropoff_access_notes text default null,
  p_dropoff_contact_name text default null,
  p_dropoff_contact_phone text default null,
  p_client_idempotency_key text default null,
  p_idempotency_request_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.capacity_listings%rowtype;
  v_idempotency_row public.booking_idempotency_keys%rowtype;
  v_base_price_cents integer;
  v_stairs_fee_cents integer;
  v_helper_fee_cents integer;
  v_platform_commission_cents integer;
  v_booking_fee_cents integer := 500;
  v_total_price_cents integer;
  v_carrier_payout_cents integer;
  v_booking_id uuid;
begin
  if p_client_idempotency_key is not null then
    perform pg_advisory_xact_lock(
      hashtext(p_customer_id::text),
      hashtext(p_client_idempotency_key)
    );

    select *
    into v_idempotency_row
    from public.booking_idempotency_keys
    where customer_id = p_customer_id
      and idempotency_key = p_client_idempotency_key
    for update;

    if found then
      if v_idempotency_row.expires_at > now() then
        if v_idempotency_row.request_hash is not null
           and p_idempotency_request_hash is not null
           and v_idempotency_row.request_hash <> p_idempotency_request_hash then
          raise exception 'idempotency_key_reused';
        end if;

        if v_idempotency_row.booking_id is not null then
          update public.booking_idempotency_keys
          set last_seen_at = now()
          where id = v_idempotency_row.id;

          return v_idempotency_row.booking_id;
        end if;

        update public.booking_idempotency_keys
        set
          request_hash = coalesce(p_idempotency_request_hash, request_hash),
          last_seen_at = now(),
          expires_at = now() + interval '24 hours'
        where id = v_idempotency_row.id
        returning * into v_idempotency_row;
      else
        update public.booking_idempotency_keys
        set
          request_hash = p_idempotency_request_hash,
          booking_id = null,
          last_seen_at = now(),
          expires_at = now() + interval '24 hours'
        where id = v_idempotency_row.id
        returning * into v_idempotency_row;
      end if;
    else
      insert into public.booking_idempotency_keys (
        customer_id,
        idempotency_key,
        request_hash
      )
      values (
        p_customer_id,
        p_client_idempotency_key,
        p_idempotency_request_hash
      )
      returning * into v_idempotency_row;
    end if;
  end if;

  select *
  into v_listing
  from public.capacity_listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  if v_listing.status not in ('active', 'booked_partial') or v_listing.remaining_capacity_pct <= 0 then
    raise exception 'listing_not_bookable';
  end if;

  if v_listing.carrier_id <> p_carrier_id then
    raise exception 'carrier_mismatch';
  end if;

  v_base_price_cents := v_listing.price_cents;
  v_stairs_fee_cents := case when p_needs_stairs then coalesce(v_listing.stairs_extra_cents, 0) else 0 end;
  v_helper_fee_cents := case when p_needs_helper then coalesce(v_listing.helper_extra_cents, 0) else 0 end;
  v_platform_commission_cents := round(v_base_price_cents * 0.15);
  v_total_price_cents := v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents + v_booking_fee_cents;
  v_carrier_payout_cents := v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents - v_platform_commission_cents;

  insert into public.bookings (
    listing_id,
    customer_id,
    carrier_id,
    item_description,
    item_category,
    item_dimensions,
    item_weight_kg,
    item_size_class,
    item_weight_band,
    item_photo_urls,
    needs_stairs,
    needs_helper,
    special_instructions,
    pickup_address,
    pickup_suburb,
    pickup_postcode,
    pickup_point,
    pickup_access_notes,
    pickup_contact_name,
    pickup_contact_phone,
    dropoff_address,
    dropoff_suburb,
    dropoff_postcode,
    dropoff_point,
    dropoff_access_notes,
    dropoff_contact_name,
    dropoff_contact_phone,
    base_price_cents,
    stairs_fee_cents,
    helper_fee_cents,
    booking_fee_cents,
    total_price_cents,
    carrier_payout_cents,
    platform_commission_cents,
    payment_status,
    status
  ) values (
    p_listing_id,
    p_customer_id,
    p_carrier_id,
    p_item_description,
    p_item_category,
    p_item_dimensions,
    p_item_weight_kg,
    p_item_size_class,
    p_item_weight_band,
    coalesce(p_item_photo_urls, '{}'),
    p_needs_stairs,
    p_needs_helper,
    p_special_instructions,
    p_pickup_address,
    p_pickup_suburb,
    p_pickup_postcode,
    st_setsrid(st_makepoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    p_pickup_access_notes,
    p_pickup_contact_name,
    p_pickup_contact_phone,
    p_dropoff_address,
    p_dropoff_suburb,
    p_dropoff_postcode,
    st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography,
    p_dropoff_access_notes,
    p_dropoff_contact_name,
    p_dropoff_contact_phone,
    v_base_price_cents,
    v_stairs_fee_cents,
    v_helper_fee_cents,
    v_booking_fee_cents,
    v_total_price_cents,
    v_carrier_payout_cents,
    v_platform_commission_cents,
    'pending',
    'pending'
  )
  returning id into v_booking_id;

  perform public.recalculate_listing_capacity(p_listing_id);

  if p_client_idempotency_key is not null then
    update public.booking_idempotency_keys
    set
      booking_id = v_booking_id,
      last_seen_at = now(),
      expires_at = now() + interval '24 hours'
    where id = v_idempotency_row.id;
  end if;

  insert into public.booking_events (
    booking_id,
    actor_role,
    actor_user_id,
    event_type,
    metadata
  ) values (
    v_booking_id,
    'customer',
    p_actor_user_id,
    'booking_created',
    jsonb_build_object(
      'listingId', p_listing_id,
      'customerId', p_customer_id,
      'carrierId', p_carrier_id,
      'itemSizeClass', p_item_size_class,
      'itemWeightBand', p_item_weight_band,
      'needsStairs', p_needs_stairs,
      'needsHelper', p_needs_helper
    )
  );

  return v_booking_id;
end;
$$;
