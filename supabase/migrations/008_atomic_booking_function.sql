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
  v_capacity_delta integer := 25;
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

  if p_needs_stairs and not coalesce(v_listing.stairs_ok, false) then
    raise exception 'listing_not_bookable';
  end if;

  if p_needs_helper and not coalesce(v_listing.helper_available, false) then
    raise exception 'listing_not_bookable';
  end if;

  v_base_price_cents := v_listing.price_cents;
  v_stairs_fee_cents := case when p_needs_stairs then coalesce(v_listing.stairs_extra_cents, 0) else 0 end;
  v_helper_fee_cents := case when p_needs_helper then coalesce(v_listing.helper_extra_cents, 0) else 0 end;
  v_platform_commission_cents := round(v_base_price_cents * 0.15);
  v_total_price_cents := v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents + v_booking_fee_cents;
  v_carrier_payout_cents := v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents - v_platform_commission_cents;
  v_remaining_capacity_pct := greatest(0, v_listing.remaining_capacity_pct - v_capacity_delta);

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
