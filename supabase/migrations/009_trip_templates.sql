create table if not exists public.trip_templates (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.carriers(id) on delete cascade,
  name text not null,
  origin_suburb text not null,
  origin_postcode text not null,
  origin_point geography(point, 4326) not null,
  destination_suburb text not null,
  destination_postcode text not null,
  destination_point geography(point, 4326) not null,
  space_size text not null check (space_size in ('S', 'M', 'L', 'XL')),
  available_volume_m3 numeric(5,2),
  max_weight_kg integer,
  detour_radius_km integer not null default 5,
  suggested_price_cents integer not null,
  stairs_ok boolean not null default false,
  stairs_extra_cents integer not null default 0,
  helper_extra_cents integer not null default 0,
  helper_available boolean not null default false,
  accepts text[] not null default '{}',
  time_window text not null default 'flexible'
    check (time_window in ('morning', 'afternoon', 'evening', 'flexible')),
  notes text,
  times_used integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_templates_carrier_id_idx
  on public.trip_templates(carrier_id);

create index if not exists trip_templates_carrier_last_used_idx
  on public.trip_templates(carrier_id, last_used_at desc nulls last);

create index if not exists trip_templates_origin_idx
  on public.trip_templates using gist(origin_point);

create index if not exists trip_templates_destination_idx
  on public.trip_templates using gist(destination_point);

alter table public.trip_templates enable row level security;

create policy "trip_templates_manage_own"
on public.trip_templates
for all
using (
  carrier_id in (
    select id from public.carriers where user_id = auth.uid()
  )
)
with check (
  carrier_id in (
    select id from public.carriers where user_id = auth.uid()
  )
);

create policy "trip_templates_admin_read_all"
on public.trip_templates
for select
using (
  exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  )
);

drop trigger if exists trip_templates_set_updated_at on public.trip_templates;
create trigger trip_templates_set_updated_at
before update on public.trip_templates
for each row
execute function public.set_updated_at();
