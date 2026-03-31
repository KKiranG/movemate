create or replace function public.estimate_booking_capacity_pct(
  p_listing_volume_m3 numeric,
  p_listing_weight_kg numeric,
  p_item_dimensions text,
  p_item_weight_kg numeric,
  p_item_category text
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

  v_estimated_pct := case
    when v_volume_pct > 0 or v_weight_pct > 0 then greatest(v_volume_pct, v_weight_pct)
    else v_fallback_pct
  end;

  return least(100, greatest(5, v_estimated_pct));
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
  p_dropoff_contact_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.capacity_listings%rowtype;
  v_base_price_cents integer;
  v_stairs_fee_cents integer;
  v_helper_fee_cents integer;
  v_platform_commission_cents integer;
  v_booking_fee_cents integer := 500;
  v_total_price_cents integer;
  v_carrier_payout_cents integer;
  v_booking_id uuid;
  v_remaining_capacity_pct integer;
begin
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

  select greatest(
    0,
    100 - coalesce(sum(
      public.estimate_booking_capacity_pct(
        v_listing.available_volume_m3,
        v_listing.available_weight_kg,
        booking.item_dimensions,
        booking.item_weight_kg,
        booking.item_category
      )
    ), 0)::integer
  )
  into v_remaining_capacity_pct
  from public.bookings as booking
  where booking.listing_id = p_listing_id
    and booking.status <> 'cancelled';

  update public.capacity_listings
  set
    remaining_capacity_pct = v_remaining_capacity_pct,
    status = case
      when v_remaining_capacity_pct <= 0 then 'booked_full'
      else 'booked_partial'
    end
  where id = p_listing_id;

  insert into public.booking_events (
    booking_id,
    event_type,
    actor_role,
    actor_user_id,
    metadata
  ) values (
    v_booking_id,
    'booking_created',
    'customer',
    p_actor_user_id,
    jsonb_build_object(
      'listingId', p_listing_id,
      'totalPriceCents', v_total_price_cents
    )
  );

  return v_booking_id;
end;
$$;
