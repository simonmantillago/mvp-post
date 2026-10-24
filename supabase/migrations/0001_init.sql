-- MVP OS — esquema inicial
-- Solo dos personas usan la app. Todo el acceso pasa por public.is_member().

-- ---------------------------------------------------------------------------
-- Pareja
-- ---------------------------------------------------------------------------
create table public.couple_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.couple_members enable row level security;

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.couple_members where user_id = auth.uid());
$$;

create policy "members read members" on public.couple_members
  for select to authenticated using (public.is_member());

-- ---------------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  nick text not null default '',               -- frase de estado estilo MSN
  avatar_path text,                            -- ruta en bucket "avatars"
  theme text not null default 'bliss'
    check (theme in ('bliss', 'manhattan', 'leopardo')),
  sounds_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "members read profiles" on public.profiles
  for select to authenticated using (public.is_member());
create policy "own profile update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Paparazzi (fotos)
-- ---------------------------------------------------------------------------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  storage_path text not null,                  -- ruta en bucket "photos"
  caption text not null default '',
  taken_with_flash boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.photo_likes (
  photo_id uuid not null references public.photos (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

alter table public.photos enable row level security;
alter table public.photo_likes enable row level security;

create policy "members read photos" on public.photos
  for select to authenticated using (public.is_member());
create policy "members add photos" on public.photos
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());
create policy "author edits photo" on public.photos
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "author deletes photo" on public.photos
  for delete to authenticated using (author_id = auth.uid());

create policy "members read likes" on public.photo_likes
  for select to authenticated using (public.is_member());
create policy "members like" on public.photo_likes
  for insert to authenticated with check (public.is_member() and user_id = auth.uid());
create policy "members unlike" on public.photo_likes
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- MVP Messenger (chat + zumbidos)
-- ---------------------------------------------------------------------------
create table public.messages (
  id bigint generated always as identity primary key,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'nudge')),
  body text not null default '' check (char_length(body) <= 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_created_at_idx on public.messages (created_at desc);

alter table public.messages enable row level security;

create policy "members read messages" on public.messages
  for select to authenticated using (public.is_member());
create policy "members send messages" on public.messages
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());
-- Solo el destinatario marca como leído (el autor no puede).
create policy "recipient marks read" on public.messages
  for update to authenticated using (public.is_member() and author_id <> auth.uid())
  with check (public.is_member() and author_id <> auth.uid());

-- ---------------------------------------------------------------------------
-- CD Player (playlist compartida)
-- ---------------------------------------------------------------------------
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  url text not null,
  platform text not null default 'other' check (platform in ('spotify', 'youtube', 'other')),
  title text not null default '',
  artist text not null default '',
  dedication text not null default '',
  created_at timestamptz not null default now()
);

alter table public.songs enable row level security;

create policy "members read songs" on public.songs
  for select to authenticated using (public.is_member());
create policy "members add songs" on public.songs
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());
create policy "author edits song" on public.songs
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "author deletes song" on public.songs
  for delete to authenticated using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Blockbuster (series y películas)
-- El turno se calcula: le toca elegir a quien NO eligió el último item que pasó a "watching".
-- ---------------------------------------------------------------------------
create table public.watch_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'movie' check (kind in ('movie', 'series')),
  status text not null default 'want' check (status in ('want', 'watching', 'watched')),
  season int,
  episode int,
  poster_url text,
  tmdb_id int,
  note text not null default '',
  added_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  picked_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.watch_ratings (
  item_id uuid not null references public.watch_items (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

alter table public.watch_items enable row level security;
alter table public.watch_ratings enable row level security;

create policy "members all watch_items" on public.watch_items
  for all to authenticated using (public.is_member()) with check (public.is_member());
create policy "members read ratings" on public.watch_ratings
  for select to authenticated using (public.is_member());
create policy "own rating write" on public.watch_ratings
  for all to authenticated using (user_id = auth.uid()) with check (public.is_member() and user_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger watch_items_touch before update on public.watch_items
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Push (fase final de v1)
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "own subscriptions" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (public.is_member() and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages, public.photos, public.songs, public.watch_items;

-- ---------------------------------------------------------------------------
-- Storage (buckets privados; la app usa signed URLs)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false), ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "members read media" on storage.objects
  for select to authenticated
  using (bucket_id in ('photos', 'avatars') and public.is_member());

-- Cada quien sube dentro de su carpeta: <bucket>/<user_id>/archivo
create policy "members upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('photos', 'avatars')
    and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner deletes media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('photos', 'avatars') and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner updates media" on storage.objects
  for update to authenticated
  using (bucket_id in ('photos', 'avatars') and (storage.foldername(name))[1] = auth.uid()::text);
