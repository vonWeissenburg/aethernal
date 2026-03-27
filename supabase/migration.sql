-- ============================================================
-- AETHERNAL — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1) Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  onboarding_done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) Memorials
create table if not exists public.memorials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  slug text unique not null,
  type text check (type in ('human', 'animal')) default 'human',
  birth_date date,
  death_date date,
  description text,
  biography text,
  profile_photo_url text,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.memorials enable row level security;

create policy "Users can view own memorials"
  on public.memorials for select using (auth.uid() = user_id);
create policy "Public memorials are viewable by everyone"
  on public.memorials for select using (is_public = true);
create policy "Users can insert own memorials"
  on public.memorials for insert with check (auth.uid() = user_id);
create policy "Users can update own memorials"
  on public.memorials for update using (auth.uid() = user_id);
create policy "Users can delete own memorials"
  on public.memorials for delete using (auth.uid() = user_id);

-- 3) Memorial Photos
create table if not exists public.memorial_photos (
  id uuid default gen_random_uuid() primary key,
  memorial_id uuid references public.memorials on delete cascade not null,
  url text not null,
  caption text,
  order_index integer default 0,
  created_at timestamptz default now()
);

alter table public.memorial_photos enable row level security;

create policy "Users can manage own memorial photos"
  on public.memorial_photos for all using (
    exists (
      select 1 from public.memorials
      where id = memorial_photos.memorial_id
      and user_id = auth.uid()
    )
  );
create policy "Public memorial photos are viewable"
  on public.memorial_photos for select using (
    exists (
      select 1 from public.memorials
      where id = memorial_photos.memorial_id
      and is_public = true
    )
  );

-- 4) Diary Entries
create table if not exists public.diary_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  memorial_id uuid references public.memorials on delete cascade not null,
  title text,
  content text not null,
  mood text check (mood in ('sad', 'reflective', 'grateful', 'loving', 'joyful')),
  entry_date date default current_date,
  created_at timestamptz default now()
);

alter table public.diary_entries enable row level security;

create policy "Users can manage own diary entries"
  on public.diary_entries for all using (auth.uid() = user_id);

-- 5) Storage bucket for photos
insert into storage.buckets (id, name, public)
values ('memorial-photos', 'memorial-photos', true)
on conflict do nothing;

create policy "Anyone can view memorial photos"
  on storage.objects for select
  using (bucket_id = 'memorial-photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'memorial-photos' and auth.role() = 'authenticated');

create policy "Users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'memorial-photos' and auth.uid()::text = (storage.foldername(name))[1]);
