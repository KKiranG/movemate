create or replace function public.accept_booking_request_atomic(
  p_booking_request_id uuid,
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
  p_pickup_address text default null,
  p_pickup_suburb text default null,
  p_pickup_postcode text default null,
  p_pickup_lat double precision default null,
  p_pickup_lng double precision default null,
  p_pickup_access_notes text default null,
  p_pickup_contact_name text default null,
  p_pickup_contact_phone text default null,
  p_dropoff_address text default null,
  p_dropoff_suburb text default null,
  p_dropoff_postcode text default null,
  p_dropoff_lat double precision default null,
  p_dropoff_lng double precision default null,
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
  v_request public.booking_requests%rowtype;
  v_booking_id uuid;
  v_now timestamptz := now();
begin
  select *
  into v_request
  from public.booking_requests
  where id = p_booking_request_id
  for update;

  if not found then
    raise exception 'booking_request_not_found';
  end if;

  if v_request.status not in ('pending', 'clarification_requested') then
    raise exception 'invalid_booking_request_transition';
  end if;

  if v_request.customer_id <> p_customer_id
     or v_request.carrier_id <> p_carrier_id
     or v_request.listing_id <> p_listing_id then
    raise exception 'booking_request_dependency_mismatch';
  end if;

  if v_request.request_group_id is not null then
    perform pg_advisory_xact_lock(
      hashtext('booking_request_group'),
      hashtext(v_request.request_group_id::text)
    );

    if exists (
      select 1
      from public.booking_requests sibling
      where sibling.request_group_id = v_request.request_group_id
        and sibling.id <> v_request.id
        and sibling.status = 'accepted'
    ) then
      raise exception 'fast_match_already_accepted';
    end if;
  end if;

  v_booking_id := public.create_booking_atomic(
    p_listing_id := p_listing_id,
    p_customer_id := p_customer_id,
    p_carrier_id := p_carrier_id,
    p_actor_user_id := p_actor_user_id,
    p_item_description := p_item_description,
    p_item_category := p_item_category,
    p_item_dimensions := p_item_dimensions,
    p_item_weight_kg := p_item_weight_kg,
    p_item_size_class := p_item_size_class,
    p_item_weight_band := p_item_weight_band,
    p_item_photo_urls := p_item_photo_urls,
    p_needs_stairs := p_needs_stairs,
    p_needs_helper := p_needs_helper,
    p_special_instructions := p_special_instructions,
    p_pickup_address := p_pickup_address,
    p_pickup_suburb := p_pickup_suburb,
    p_pickup_postcode := p_pickup_postcode,
    p_pickup_lat := p_pickup_lat,
    p_pickup_lng := p_pickup_lng,
    p_pickup_access_notes := p_pickup_access_notes,
    p_pickup_contact_name := p_pickup_contact_name,
    p_pickup_contact_phone := p_pickup_contact_phone,
    p_dropoff_address := p_dropoff_address,
    p_dropoff_suburb := p_dropoff_suburb,
    p_dropoff_postcode := p_dropoff_postcode,
    p_dropoff_lat := p_dropoff_lat,
    p_dropoff_lng := p_dropoff_lng,
    p_dropoff_access_notes := p_dropoff_access_notes,
    p_dropoff_contact_name := p_dropoff_contact_name,
    p_dropoff_contact_phone := p_dropoff_contact_phone,
    p_client_idempotency_key := p_client_idempotency_key,
    p_idempotency_request_hash := p_idempotency_request_hash
  );

  update public.bookings
  set
    move_request_id = v_request.move_request_id,
    offer_id = v_request.offer_id,
    booking_request_id = v_request.id,
    request_group_id = v_request.request_group_id
  where id = v_booking_id;

  update public.booking_requests
  set
    status = 'accepted',
    booking_id = v_booking_id,
    responded_at = v_now,
    clarification_reason = null,
    clarification_message = null
  where id = v_request.id;

  if v_request.request_group_id is not null then
    update public.booking_requests
    set
      status = 'revoked',
      responded_at = v_now,
      expires_at = v_now
    where request_group_id = v_request.request_group_id
      and id <> v_request.id
      and status in ('pending', 'clarification_requested');
  end if;

  return v_booking_id;
end;
$$;
