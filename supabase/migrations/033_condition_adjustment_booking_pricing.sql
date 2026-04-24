alter table public.bookings
  add column if not exists adjustment_fee_cents integer not null default 0;

alter table public.bookings
  drop constraint if exists bookings_adjustment_fee_cents_check;

alter table public.bookings
  add constraint bookings_adjustment_fee_cents_check
  check (adjustment_fee_cents >= 0);

alter table public.bookings
  drop constraint if exists bookings_cancellation_reason_code_check;

alter table public.bookings
  add constraint bookings_cancellation_reason_code_check
  check (
    cancellation_reason_code is null
    or cancellation_reason_code in (
      'carrier_unavailable',
      'customer_changed_plans',
      'payment_failed',
      'no_response',
      'safety_concern',
      'misdescription'
    )
  );
