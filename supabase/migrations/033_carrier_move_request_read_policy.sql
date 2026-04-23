drop policy if exists "move_requests_carrier_select_requested" on public.move_requests;
create policy "move_requests_carrier_select_requested"
on public.move_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.booking_requests booking_request
    join public.carriers carrier_row
      on carrier_row.id = booking_request.carrier_id
    where booking_request.move_request_id = move_requests.id
      and carrier_row.user_id = auth.uid()
  )
);
