-- Migration 039: Mover handling policy + stairs tranches (Issue #70)
--
-- Adds three-option handling policy to carrier trips/templates, replaces the
-- binary stairs flag with per-tranche pricing, and adds structured
-- mover-preference and access fields to customer move requests and bookings.
--
-- Old columns (helper_available, helper_extra_cents, needs_helper,
-- helper_fee_cents, needs_stairs, stairs_ok, stairs_extra_cents) are kept for
-- backward compatibility. New fields drive all new logic.

-- ─── Carrier-side enums ──────────────────────────────────────────────────────

create type handling_policy as enum (
  'solo_only',           -- carrier travels alone; single-person jobs only
  'solo_customer_help',  -- carrier alone; accepts jobs where customer helps lift
  'two_movers'           -- carrier brings two people; eligible for two-mover jobs
);

-- ─── Customer-side enums ─────────────────────────────────────────────────────

create type mover_preference as enum (
  'one_mover',    -- item is manageable, access is simple
  'customer_help', -- customer will help lift
  'two_movers'    -- carrier must supply two movers
);

create type stairs_level as enum (
  'none',   -- ground floor or no significant stairs
  'low',    -- 1 flight or basement/underground access
  'medium', -- 2 flights
  'high'    -- 3 or more flights
);

-- ─── capacity_listings ───────────────────────────────────────────────────────

alter table capacity_listings
  add column handling_policy       handling_policy not null default 'solo_only',
  add column stairs_low_cents      integer         not null default 0,
  add column stairs_medium_cents   integer         not null default 0,
  add column stairs_high_cents     integer         not null default 0,
  add column second_mover_extra_cents integer      not null default 0;

-- Backfill handling_policy from legacy helper_available
update capacity_listings
  set handling_policy = 'solo_customer_help'
  where helper_available = true;

-- Backfill stairs tranche from legacy single stairs_extra_cents
update capacity_listings
  set stairs_low_cents = stairs_extra_cents
  where stairs_ok = true and stairs_extra_cents > 0;

-- Backfill second mover from legacy helper_extra_cents
update capacity_listings
  set second_mover_extra_cents = helper_extra_cents
  where helper_extra_cents > 0;

-- ─── trip_templates ──────────────────────────────────────────────────────────

alter table trip_templates
  add column handling_policy       handling_policy not null default 'solo_only',
  add column stairs_low_cents      integer         not null default 0,
  add column stairs_medium_cents   integer         not null default 0,
  add column stairs_high_cents     integer         not null default 0,
  add column second_mover_extra_cents integer      not null default 0;

update trip_templates
  set handling_policy = 'solo_customer_help'
  where helper_available = true;

update trip_templates
  set stairs_low_cents = stairs_extra_cents
  where stairs_ok = true and stairs_extra_cents > 0;

update trip_templates
  set second_mover_extra_cents = helper_extra_cents
  where helper_extra_cents > 0;

-- ─── move_requests ───────────────────────────────────────────────────────────

alter table move_requests
  add column customer_mover_preference mover_preference not null default 'one_mover',
  add column stairs_level_pickup       stairs_level     not null default 'none',
  add column stairs_level_dropoff      stairs_level     not null default 'none',
  add column lift_available_pickup     boolean          not null default false,
  add column lift_available_dropoff    boolean          not null default false;

-- Backfill: needs_helper=true → customer_help (conservative approximation)
update move_requests
  set customer_mover_preference = 'customer_help'
  where needs_helper = true;

-- Backfill: needs_stairs=true → low (conservative: we don't know the actual level)
update move_requests
  set stairs_level_pickup = 'low'
  where needs_stairs = true;

-- ─── bookings ────────────────────────────────────────────────────────────────

alter table bookings
  add column customer_mover_preference mover_preference not null default 'one_mover',
  add column stairs_level_pickup       stairs_level     not null default 'none',
  add column stairs_level_dropoff      stairs_level     not null default 'none',
  add column lift_available_pickup     boolean          not null default false,
  add column lift_available_dropoff    boolean          not null default false,
  add column second_mover_fee_cents    integer          not null default 0;

alter table offers
  add column second_mover_fee_cents integer not null default 0 check (second_mover_fee_cents >= 0);

update bookings
  set customer_mover_preference = 'customer_help'
  where needs_helper = true;

update bookings
  set stairs_level_pickup = 'low'
  where needs_stairs = true;

-- Backfill second_mover_fee_cents from legacy helper_fee_cents
update bookings
  set second_mover_fee_cents = helper_fee_cents
  where helper_fee_cents > 0;

update offers
  set second_mover_fee_cents = helper_fee_cents
  where helper_fee_cents > 0;

-- Rebuild create_booking_atomic so database-created bookings use the same
-- handling-policy and stairs-tranche model as app-derived offers.
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
  p_idempotency_request_hash text default null,
  p_customer_mover_preference mover_preference default null,
  p_stairs_level_pickup stairs_level default null,
  p_stairs_level_dropoff stairs_level default null,
  p_lift_available_pickup boolean default null,
  p_lift_available_dropoff boolean default null,
  p_move_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.capacity_listings%rowtype;
  v_move_request public.move_requests%rowtype;
  v_idempotency_row public.booking_idempotency_keys%rowtype;
  v_customer_mover_preference mover_preference;
  v_stairs_level_pickup stairs_level;
  v_stairs_level_dropoff stairs_level;
  v_lift_available_pickup boolean;
  v_lift_available_dropoff boolean;
  v_base_price_cents integer;
  v_pickup_stairs_fee_cents integer;
  v_dropoff_stairs_fee_cents integer;
  v_stairs_fee_cents integer;
  v_helper_fee_cents integer := 0;
  v_second_mover_fee_cents integer;
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

  if p_move_request_id is not null then
    select *
    into v_move_request
    from public.move_requests
    where id = p_move_request_id;
  end if;

  v_customer_mover_preference := coalesce(
    p_customer_mover_preference,
    v_move_request.customer_mover_preference,
    case when p_needs_helper then 'two_movers'::mover_preference else 'one_mover'::mover_preference end
  );
  v_stairs_level_pickup := coalesce(
    p_stairs_level_pickup,
    v_move_request.stairs_level_pickup,
    case when p_needs_stairs then 'low'::stairs_level else 'none'::stairs_level end
  );
  v_stairs_level_dropoff := coalesce(
    p_stairs_level_dropoff,
    v_move_request.stairs_level_dropoff,
    'none'::stairs_level
  );
  v_lift_available_pickup := coalesce(p_lift_available_pickup, v_move_request.lift_available_pickup, false);
  v_lift_available_dropoff := coalesce(p_lift_available_dropoff, v_move_request.lift_available_dropoff, false);

  v_base_price_cents := greatest(v_listing.price_cents, coalesce(v_listing.minimum_base_price_cents, 0));
  v_pickup_stairs_fee_cents := case
    when v_lift_available_pickup or v_stairs_level_pickup = 'none' then 0
    when v_stairs_level_pickup = 'low' then coalesce(v_listing.stairs_low_cents, v_listing.stairs_extra_cents, 0)
    when v_stairs_level_pickup = 'medium' then coalesce(v_listing.stairs_medium_cents, 0)
    else coalesce(v_listing.stairs_high_cents, 0)
  end;
  v_dropoff_stairs_fee_cents := case
    when v_lift_available_dropoff or v_stairs_level_dropoff = 'none' then 0
    when v_stairs_level_dropoff = 'low' then coalesce(v_listing.stairs_low_cents, v_listing.stairs_extra_cents, 0)
    when v_stairs_level_dropoff = 'medium' then coalesce(v_listing.stairs_medium_cents, 0)
    else coalesce(v_listing.stairs_high_cents, 0)
  end;
  v_stairs_fee_cents := v_pickup_stairs_fee_cents + v_dropoff_stairs_fee_cents;
  v_second_mover_fee_cents := case
    when v_listing.handling_policy = 'two_movers' and v_customer_mover_preference = 'two_movers'
      then coalesce(v_listing.second_mover_extra_cents, 0)
    else 0
  end;
  v_platform_fee_cents := round(v_base_price_cents * 0.15);
  v_gst_cents := round(((v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents + v_second_mover_fee_cents) + v_platform_fee_cents) * 0.10);
  v_total_price_cents := (v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents + v_second_mover_fee_cents) + v_platform_fee_cents + v_gst_cents;
  v_carrier_payout_cents := v_base_price_cents + v_stairs_fee_cents + v_helper_fee_cents + v_second_mover_fee_cents;

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
    customer_mover_preference,
    stairs_level_pickup,
    stairs_level_dropoff,
    lift_available_pickup,
    lift_available_dropoff,
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
    second_mover_fee_cents,
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
    v_stairs_level_pickup <> 'none' or v_stairs_level_dropoff <> 'none',
    v_customer_mover_preference <> 'one_mover',
    v_customer_mover_preference,
    v_stairs_level_pickup,
    v_stairs_level_dropoff,
    v_lift_available_pickup,
    v_lift_available_dropoff,
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
    v_second_mover_fee_cents,
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
  p_idempotency_request_hash text default null,
  p_customer_mover_preference mover_preference default null,
  p_stairs_level_pickup stairs_level default null,
  p_stairs_level_dropoff stairs_level default null,
  p_lift_available_pickup boolean default null,
  p_lift_available_dropoff boolean default null
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
    p_idempotency_request_hash := p_idempotency_request_hash,
    p_customer_mover_preference := p_customer_mover_preference,
    p_stairs_level_pickup := p_stairs_level_pickup,
    p_stairs_level_dropoff := p_stairs_level_dropoff,
    p_lift_available_pickup := p_lift_available_pickup,
    p_lift_available_dropoff := p_lift_available_dropoff,
    p_move_request_id := v_request.move_request_id
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
