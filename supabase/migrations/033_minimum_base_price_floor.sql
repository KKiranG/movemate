alter table public.capacity_listings
  add column if not exists minimum_base_price_cents integer not null default 0
  check (minimum_base_price_cents >= 0);

alter table public.trip_templates
  add column if not exists minimum_base_price_cents integer not null default 0
  check (minimum_base_price_cents >= 0);

update public.capacity_listings
set minimum_base_price_cents = greatest(
  minimum_base_price_cents,
  case when coalesce(route_distance_km, 0) >= 250 then 5000 else 1000 end
);

update public.capacity_listings
set price_cents = greatest(price_cents, minimum_base_price_cents);

update public.trip_templates
set minimum_base_price_cents = greatest(
  minimum_base_price_cents,
  case
    when st_distance(origin_point, destination_point) / 1000 >= 250 then 5000
    else 1000
  end
);

update public.trip_templates
set suggested_price_cents = greatest(suggested_price_cents, minimum_base_price_cents);

alter table public.capacity_listings
  alter column minimum_base_price_cents set default 1000;

alter table public.trip_templates
  alter column minimum_base_price_cents set default 1000;

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
  v_platform_fee_cents integer;
  v_gst_cents integer;
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

  v_base_price_cents := greatest(v_listing.price_cents, coalesce(v_listing.minimum_base_price_cents, 0));
  v_stairs_fee_cents := case when p_needs_stairs then coalesce(v_listing.stairs_extra_cents, 0) else 0 end;
  v_helper_fee_cents := case when p_needs_helper then coalesce(v_listing.helper_extra_cents, 0) else 0 end;
  v_platform_fee_cents := round(v_base_price_cents * 0.15);
  v_gst_cents := round(((v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents) + v_platform_fee_cents) * 0.10);
  v_total_price_cents := (v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents) + v_platform_fee_cents + v_gst_cents;
  v_carrier_payout_cents := v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents;

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
    gst_cents,
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
    0,
    v_gst_cents,
    v_total_price_cents,
    v_carrier_payout_cents,
    v_platform_fee_cents,
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

  return v_booking_id;
end;
$$;
