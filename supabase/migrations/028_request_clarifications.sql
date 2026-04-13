alter table public.booking_requests
add column if not exists clarification_round_count integer not null default 0 check (
  clarification_round_count >= 0 and clarification_round_count <= 1
);

alter table public.booking_requests
add column if not exists clarification_requested_at timestamptz;

alter table public.booking_requests
add column if not exists clarification_expires_at timestamptz;

alter table public.booking_requests
add column if not exists customer_response_at timestamptz;

update public.booking_requests
set clarification_round_count = 1,
    clarification_requested_at = coalesce(clarification_requested_at, responded_at, updated_at),
    clarification_expires_at = coalesce(clarification_expires_at, response_deadline_at)
where status = 'clarification_requested';

drop policy if exists "booking_requests_customer_update_own" on public.booking_requests;
create policy "booking_requests_customer_update_own"
on public.booking_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.customers customer_row
    where customer_row.id = booking_requests.customer_id
      and customer_row.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.customers customer_row
    where customer_row.id = booking_requests.customer_id
      and customer_row.user_id = auth.uid()
  )
);

create index if not exists idx_booking_requests_clarification_expiry
on public.booking_requests (clarification_expires_at)
where status = 'clarification_requested';
