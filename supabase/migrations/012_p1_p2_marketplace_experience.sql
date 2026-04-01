alter table public.carriers
  add column if not exists vehicle_photo_url text,
  add column if not exists licence_expiry_date date,
  add column if not exists insurance_expiry_date date;

alter table public.capacity_listings
  add column if not exists is_return_trip boolean not null default false;

alter table public.trip_templates
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz;

create index if not exists idx_trip_templates_active_carrier
on public.trip_templates (carrier_id, is_archived, updated_at desc);

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (
    payment_status in (
      'pending',
      'authorized',
      'captured',
      'refunded',
      'failed',
      'authorization_cancelled'
    )
  );

alter table public.bookings
  add column if not exists payment_failure_code text,
  add column if not exists payment_failure_reason text,
  add column if not exists cancellation_reason_code text;

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
      'safety_concern'
    )
  );

create index if not exists idx_bookings_payment_status
on public.bookings (payment_status, status, created_at desc);

alter table public.reviews
  add column if not exists carrier_response text,
  add column if not exists carrier_responded_at timestamptz;
