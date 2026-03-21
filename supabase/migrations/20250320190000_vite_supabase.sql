-- PostCraft: profiles, posts, carousels + RLS (Supabase Auth)

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  profile_url text,
  voice_profile_json jsonb,
  timezone text default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.post_status as enum ('DRAFT', 'SCHEDULED', 'POSTED');

create type public.carousel_template as enum ('MINIMAL', 'BOLD', 'EDITORIAL');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  variants_json jsonb not null default '[]'::jsonb,
  status public.post_status not null default 'DRAFT',
  scheduled_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_user_id_status_idx on public.posts (user_id, status);
create index posts_scheduled_at_idx on public.posts (scheduled_at);

create table public.carousels (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts (id) on delete cascade,
  template public.carousel_template not null,
  slides_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.carousels enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "posts_all_own"
  on public.posts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "carousels_all_own"
  on public.carousels for all
  using (
    exists (
      select 1 from public.posts p
      where p.id = carousels.post_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.posts p
      where p.id = carousels.post_id and p.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_postcraft
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
