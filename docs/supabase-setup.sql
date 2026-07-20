create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  constraint app_users_username_format check (username ~ '^[a-zA-Z0-9_-]{3,20}$')
);

create table if not exists public.user_sessions (
  token_hash text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.favorite_stations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  station_uuid text not null,
  created_at timestamptz not null default now(),
  unique (user_id, station_uuid)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  theme text not null default 'dark',
  default_country text not null default 'AR',
  auto_play boolean not null default false,
  volume numeric not null default 0.7,
  updated_at timestamptz not null default now()
);

alter table public.app_users enable row level security;
alter table public.user_sessions enable row level security;
alter table public.favorite_stations enable row level security;
alter table public.user_preferences enable row level security;

create index if not exists user_sessions_user_id_idx on public.user_sessions(user_id);
create index if not exists user_sessions_expires_at_idx on public.user_sessions(expires_at);
create index if not exists favorite_stations_user_id_idx on public.favorite_stations(user_id);
