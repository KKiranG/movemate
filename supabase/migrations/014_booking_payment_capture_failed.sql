alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (
    payment_status in (
      'pending',
      'authorized',
      'captured',
      'capture_failed',
      'refunded',
      'failed',
      'authorization_cancelled'
    )
  );
