create table if not exists public.booking_request_payment_authorizations (
  id uuid primary key default gen_random_uuid(),
  move_request_id uuid not null references public.move_requests(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  request_group_id uuid,
  booking_id uuid references public.bookings(id) on delete set null,
  amount_cents integer not null check (amount_cents >= 0),
  captured_amount_cents integer check (captured_amount_cents is null or captured_amount_cents >= 0),
  currency text not null default 'aud' check (currency = lower(currency)),
  stripe_payment_intent_id text unique,
  status text not null default 'pending' check (
    status in (
      'pending',
      'authorized',
      'captured',
      'capture_failed',
      'failed',
      'authorization_cancelled',
      'refund_pending',
      'refunded',
      'manual_review'
    )
  ),
  failure_code text,
  failure_reason text,
  authorized_at timestamptz,
  captured_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_requests
  add column if not exists payment_authorization_id uuid
    references public.booking_request_payment_authorizations(id) on delete set null;

create index if not exists idx_booking_request_payment_authorizations_customer
on public.booking_request_payment_authorizations (customer_id, status, created_at desc);

create index if not exists idx_booking_request_payment_authorizations_move_request
on public.booking_request_payment_authorizations (move_request_id, created_at desc);

create index if not exists idx_booking_request_payment_authorizations_group
on public.booking_request_payment_authorizations (request_group_id)
where request_group_id is not null;

create index if not exists idx_booking_requests_payment_authorization
on public.booking_requests (payment_authorization_id)
where payment_authorization_id is not null;

alter table public.booking_request_payment_authorizations enable row level security;

drop trigger if exists booking_request_payment_authorizations_set_updated_at
on public.booking_request_payment_authorizations;
create trigger booking_request_payment_authorizations_set_updated_at
before update on public.booking_request_payment_authorizations
for each row
execute function public.set_updated_at();

drop policy if exists "booking_request_payment_authorizations_customer_select_own"
on public.booking_request_payment_authorizations;
create policy "booking_request_payment_authorizations_customer_select_own"
on public.booking_request_payment_authorizations
for select
to authenticated
using (
  exists (
    select 1
    from public.customers customer_row
    where customer_row.id = booking_request_payment_authorizations.customer_id
      and customer_row.user_id = auth.uid()
  )
);

drop policy if exists "booking_request_payment_authorizations_admin_read_all"
on public.booking_request_payment_authorizations;
create policy "booking_request_payment_authorizations_admin_read_all"
on public.booking_request_payment_authorizations
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.user_id = auth.uid()
  )
);

drop policy if exists "booking_request_payment_authorizations_service_role_all"
on public.booking_request_payment_authorizations;
create policy "booking_request_payment_authorizations_service_role_all"
on public.booking_request_payment_authorizations
for all
to service_role
using (true)
with check (true);
