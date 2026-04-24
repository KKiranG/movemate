alter table public.booking_requests
  drop constraint if exists booking_requests_status_check;

alter table public.booking_requests
  add constraint booking_requests_status_check
  check (
    status in (
      'pending',
      'clarification_requested',
      'accepting',
      'accepted',
      'declined',
      'expired',
      'revoked',
      'cancelled'
    )
  );

alter table public.booking_requests
  add column if not exists acceptance_claimed_at timestamptz,
  add column if not exists acceptance_claim_expires_at timestamptz;

create index if not exists idx_booking_requests_acceptance_claim_expiry
on public.booking_requests (acceptance_claim_expires_at)
where status = 'accepting';

create or replace function public.claim_booking_request_acceptance_atomic(
  p_booking_request_id uuid,
  p_carrier_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.booking_requests%rowtype;
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

  if v_request.carrier_id <> p_carrier_id then
    raise exception 'booking_request_carrier_mismatch';
  end if;

  if v_request.status = 'accepting'
     and v_request.acceptance_claim_expires_at is not null
     and v_request.acceptance_claim_expires_at <= v_now then
    update public.booking_requests
    set
      status = case
        when clarification_requested_at is not null
          and customer_response_at is null
          then 'clarification_requested'
        else 'pending'
      end,
      acceptance_claimed_at = null,
      acceptance_claim_expires_at = null,
      responded_at = null
    where id = v_request.id
    returning * into v_request;
  end if;

  if v_request.status not in ('pending', 'clarification_requested') then
    raise exception 'invalid_booking_request_transition';
  end if;

  if v_request.payment_authorization_id is null then
    raise exception 'payment_authorization_missing';
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
        and sibling.status in ('accepting', 'accepted')
        and (
          sibling.status = 'accepted'
          or sibling.acceptance_claim_expires_at is null
          or sibling.acceptance_claim_expires_at > v_now
        )
    ) then
      raise exception 'fast_match_already_claimed';
    end if;
  end if;

  update public.booking_requests
  set
    status = 'accepting',
    responded_at = v_now,
    acceptance_claimed_at = v_now,
    acceptance_claim_expires_at = v_now + interval '5 minutes'
  where id = v_request.id
  returning * into v_request;

  return v_request.payment_authorization_id;
end;
$$;

create or replace function public.release_booking_request_acceptance_claim_atomic(
  p_booking_request_id uuid,
  p_failure_code text default null,
  p_failure_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.booking_requests%rowtype;
begin
  select *
  into v_request
  from public.booking_requests
  where id = p_booking_request_id
  for update;

  if not found then
    return;
  end if;

  if v_request.status <> 'accepting' then
    return;
  end if;

  update public.booking_requests
  set
    status = case
      when clarification_requested_at is not null
        and customer_response_at is null
        then 'clarification_requested'
      else 'pending'
    end,
    responded_at = null,
    acceptance_claimed_at = null,
    acceptance_claim_expires_at = null
  where id = v_request.id;
end;
$$;

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

  if v_request.status <> 'accepting' then
    raise exception 'booking_request_acceptance_not_claimed';
  end if;

  if v_request.acceptance_claim_expires_at is not null
     and v_request.acceptance_claim_expires_at <= v_now then
    raise exception 'booking_request_acceptance_claim_expired';
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
    clarification_message = null,
    acceptance_claimed_at = null,
    acceptance_claim_expires_at = null
  where id = v_request.id;

  if v_request.request_group_id is not null then
    update public.booking_requests
    set
      status = 'revoked',
      responded_at = v_now,
      expires_at = v_now,
      acceptance_claimed_at = null,
      acceptance_claim_expires_at = null
    where request_group_id = v_request.request_group_id
      and id <> v_request.id
      and status in ('pending', 'clarification_requested', 'accepting');
  end if;

  return v_booking_id;
end;
$$;
