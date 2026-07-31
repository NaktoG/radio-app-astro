create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (length(trim(nickname)) > 0),
  nickname_normalized text generated always as (lower(btrim(nickname))) stored,
  accepted_anonymous_risk_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists nickname_normalized text
  generated always as (lower(btrim(nickname))) stored;

create unique index if not exists profiles_nickname_normalized_unique_idx
  on public.profiles ((lower(btrim(nickname))));

comment on column public.profiles.nickname is
  'Unique display handle. Normalized uniqueness is lower(btrim(nickname)); nickname is not a login credential, recovery factor, or authorization input.';

comment on column public.profiles.nickname_normalized is
  'Generated display-handle availability key only; RLS and authorization remain based on auth.uid().';

create table if not exists public.favorite_stations (
  user_id uuid not null references auth.users(id) on delete cascade,
  station_uuid text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, station_uuid)
);

alter table public.profiles enable row level security;
alter table public.favorite_stations enable row level security;

create policy profiles_select_own on public.profiles
  for select using ((select auth.uid()) = user_id);

create policy profiles_insert_own on public.profiles
  for insert with check ((select auth.uid()) = user_id);

create policy profiles_update_own on public.profiles
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy profiles_delete_own on public.profiles
  for delete using ((select auth.uid()) = user_id);

create policy favorite_stations_select_own on public.favorite_stations
  for select using ((select auth.uid()) = user_id);

create policy favorite_stations_insert_own on public.favorite_stations
  for insert with check ((select auth.uid()) = user_id);

create policy favorite_stations_update_own on public.favorite_stations
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy favorite_stations_delete_own on public.favorite_stations
  for delete using ((select auth.uid()) = user_id);

create index if not exists favorite_stations_user_id_idx on public.favorite_stations(user_id);
