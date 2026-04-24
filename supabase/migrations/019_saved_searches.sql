create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  from_suburb text not null,
  from_postcode text,
  to_suburb text not null,
  to_postcode text,
  item_category text,
  date_from date,
  date_to date,
  notify_email text not null,
  last_notified_at timestamptz,
  notification_count integer not null default 0,
  expires_at timestamptz not null default (now() + interval '90 days'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists saved_searches_user_id_idx
  on public.saved_searches(user_id);

create index if not exists saved_searches_active_idx
  on public.saved_searches(is_active, expires_at)
  where is_active = true;

create index if not exists saved_searches_from_suburb_idx
  on public.saved_searches(from_suburb)
  where is_active = true;

create index if not exists saved_searches_to_suburb_idx
  on public.saved_searches(to_suburb)
  where is_active = true;

alter table public.saved_searches enable row level security;

create policy "saved_searches_manage_own"
on public.saved_searches
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "saved_searches_admin_read_all"
on public.saved_searches
for select
using (
  exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  )
);

create policy "saved_searches_service_role_all"
on public.saved_searches
for all
to service_role
using (true)
with check (true);
