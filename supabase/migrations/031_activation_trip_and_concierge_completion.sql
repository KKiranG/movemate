alter table public.carriers
  add column if not exists activation_status text
    check (activation_status in ('not_started', 'activation_started', 'pending_review', 'active', 'rejected', 'suspended')),
  add column if not exists abn_verified boolean not null default false,
  add column if not exists insurance_verified boolean not null default false;

update public.carriers
set activation_status = case
  when verification_status = 'verified' then 'active'
  when verification_status = 'submitted' then 'pending_review'
  when verification_status = 'rejected' then 'rejected'
  when coalesce(onboarding_completed_at, verification_submitted_at) is not null
    or coalesce(array_length(service_suburbs, 1), 0) > 0
    or coalesce(business_name, '') <> ''
    then 'activation_started'
  else 'not_started'
end
where activation_status is null;

update public.carriers
set abn_verified = coalesce(abn_verified, false) or (abn is not null and length(trim(abn)) > 0),
    insurance_verified = coalesce(insurance_verified, false) or insurance_photo_url is not null;

alter table public.carriers
  alter column activation_status set default 'not_started';

alter table public.capacity_listings
  add column if not exists waypoint_suburbs text[] not null default '{}',
  add column if not exists route_polyline text,
  add column if not exists recurrence_rule text,
  add column if not exists recurrence_days text[] not null default '{}',
  add column if not exists detour_tolerance_label text not null default 'standard'
    check (detour_tolerance_label in ('tight', 'standard', 'flexible'));

alter table public.bookings
  add column if not exists move_request_id uuid references public.move_requests (id) on delete set null,
  add column if not exists offer_id uuid references public.offers (id) on delete set null,
  add column if not exists booking_request_id uuid references public.booking_requests (id) on delete set null,
  add column if not exists request_group_id uuid;

create index if not exists idx_bookings_request_flow
on public.bookings (booking_request_id, move_request_id, request_group_id);

alter table public.concierge_offers
  add column if not exists customer_id uuid references public.customers (id) on delete set null,
  add column if not exists move_request_id uuid references public.move_requests (id) on delete set null,
  add column if not exists listing_id uuid references public.capacity_listings (id) on delete set null,
  add column if not exists offer_id uuid references public.offers (id) on delete set null,
  add column if not exists booking_request_id uuid references public.booking_requests (id) on delete set null,
  add column if not exists sent_at timestamptz,
  add column if not exists responded_at timestamptz,
  add column if not exists cancelled_reason text;

create index if not exists idx_concierge_offers_customer_status
on public.concierge_offers (customer_id, status, created_at desc);

create index if not exists idx_concierge_offers_request_flow
on public.concierge_offers (move_request_id, offer_id, booking_request_id);

create or replace function public.sync_legacy_carrier_verification_flags()
returns trigger
language plpgsql
as $$
begin
  if new.activation_status = 'active' then
    new.is_verified := true;
    new.verification_status := 'verified';
    new.verified_at := coalesce(new.verified_at, timezone('utc'::text, now()));
  elsif new.activation_status = 'pending_review' then
    new.is_verified := false;
    new.verification_status := 'submitted';
  elsif new.activation_status = 'rejected' then
    new.is_verified := false;
    new.verification_status := 'rejected';
    new.verified_at := null;
  elsif new.activation_status in ('not_started', 'activation_started', 'suspended') then
    new.is_verified := false;
    if new.verification_status = 'verified' then
      new.verification_status := 'pending';
    end if;
    if new.activation_status = 'not_started' then
      new.verification_status := 'pending';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists carriers_sync_legacy_verification_flags on public.carriers;
create trigger carriers_sync_legacy_verification_flags
before insert or update on public.carriers
for each row
execute function public.sync_legacy_carrier_verification_flags();
