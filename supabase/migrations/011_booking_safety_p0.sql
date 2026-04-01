create sequence if not exists public.booking_reference_seq
start with 421
increment by 1;

create or replace function public.generate_booking_reference()
returns text
language plpgsql
volatile
as $$
declare
  v_year text := to_char(timezone('Australia/Sydney', now()), 'YYYY');
  v_sequence text := lpad(nextval('public.booking_reference_seq')::text, 4, '0');
begin
  return 'MVR-' || v_year || '-' || v_sequence;
end;
$$;

alter table public.bookings
  add column if not exists booking_reference text,
  add column if not exists pending_expires_at timestamptz;

alter table public.bookings
  alter column booking_reference set default public.generate_booking_reference(),
  alter column pending_expires_at set default (now() + interval '2 hours');

update public.bookings
set
  booking_reference = coalesce(booking_reference, public.generate_booking_reference()),
  pending_expires_at = coalesce(pending_expires_at, created_at + interval '2 hours')
where booking_reference is null
   or pending_expires_at is null;

alter table public.bookings
  alter column booking_reference set not null,
  alter column pending_expires_at set not null;

create unique index if not exists idx_bookings_booking_reference
on public.bookings (booking_reference);

create index if not exists idx_bookings_pending_expiry
on public.bookings (status, pending_expires_at)
where status = 'pending';

create table if not exists public.booking_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  idempotency_key text not null,
  request_hash text,
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique (customer_id, idempotency_key)
);

create index if not exists idx_booking_idempotency_lookup
on public.booking_idempotency_keys (customer_id, idempotency_key);

create index if not exists idx_booking_idempotency_expiry
on public.booking_idempotency_keys (expires_at);

create table if not exists public.booking_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  recipient_email text not null,
  email_type text not null,
  booking_status text,
  dedupe_key text not null,
  provider text not null default 'resend',
  provider_message_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_booking_email_deliveries_dedupe
on public.booking_email_deliveries (dedupe_key);

create index if not exists idx_booking_email_deliveries_lookup
on public.booking_email_deliveries (booking_id, email_type, booking_status, recipient_email, created_at desc);

alter table public.booking_idempotency_keys enable row level security;
alter table public.booking_email_deliveries enable row level security;

drop trigger if exists booking_idempotency_keys_set_updated_at on public.booking_idempotency_keys;
create trigger booking_idempotency_keys_set_updated_at
before update on public.booking_idempotency_keys
for each row
execute function public.set_updated_at();

create or replace function public.recalculate_listing_capacity(
  p_listing_id uuid
)
returns table (
  remaining_capacity_pct integer,
  listing_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.capacity_listings%rowtype;
  v_active_booking_count integer := 0;
  v_remaining_capacity_pct integer := 100;
  v_listing_status text := 'active';
begin
  select *
  into v_listing
  from public.capacity_listings
  where id = p_listing_id
  for update;

  if not found then
    return;
  end if;

  select count(*)
  into v_active_booking_count
  from public.bookings as booking
  where booking.listing_id = p_listing_id
    and booking.status <> 'cancelled';

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

  v_listing_status := case
    when v_listing.status in ('cancelled', 'expired', 'draft') then v_listing.status
    when v_remaining_capacity_pct <= 0 then 'booked_full'
    when v_active_booking_count > 0 then 'booked_partial'
    else 'active'
  end;

  update public.capacity_listings
  set
    remaining_capacity_pct = v_remaining_capacity_pct,
    status = v_listing_status
  where id = p_listing_id;

  return query
  select v_remaining_capacity_pct, v_listing_status;
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

  perform public.recalculate_listing_capacity(p_listing_id);

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

  if p_client_idempotency_key is not null then
    update public.booking_idempotency_keys
    set
      booking_id = v_booking_id,
      last_seen_at = now(),
      expires_at = now() + interval '24 hours'
    where customer_id = p_customer_id
      and idempotency_key = p_client_idempotency_key;
  end if;

  return v_booking_id;
end;
$$;
