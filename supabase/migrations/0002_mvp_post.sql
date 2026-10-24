-- The MVP Post — cambio de dirección (2026-10-24)
-- La app deja de ser un sistema operativo y pasa a ser un periódico con secciones:
--   portada (ediciones/columna) · y2k (collage) · alfombra (fotos de cámara) ·
--   vinilos (canciones) · cartelera (películas) · cartas (chat).
-- Se agrega un registro de actividad que alimenta los "Nuevo" de la portada,
-- el badge del ícono y las notificaciones Web Push (Edge Function `notify`).

-- ---------------------------------------------------------------------------
-- Perfiles: sin temas; preferencias de notificación por sección
-- ---------------------------------------------------------------------------
alter table public.profiles drop column theme;
alter table public.profiles add column muted_sections text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Portada: ediciones (la columna que él escribe)
-- ---------------------------------------------------------------------------
create table public.editions (
  id uuid primary key default gen_random_uuid(),
  number int generated always as identity unique,   -- "Edición n.º"
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  headline text not null check (char_length(headline) between 1 and 200),
  body text not null default '',
  cover_path text,                                   -- bucket "photos"
  cover_caption text not null default '',
  continues_to text check (continues_to in ('y2k', 'alfombra', 'vinilos', 'cartelera', 'cartas')),
  published_at timestamptz,                          -- null = borrador
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index editions_published_idx on public.editions (published_at desc);

alter table public.editions enable row level security;

-- Los borradores solo los ve quien los escribe.
create policy "members read published editions" on public.editions
  for select to authenticated
  using (public.is_member() and (published_at is not null or author_id = auth.uid()));
create policy "members write editions" on public.editions
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());
create policy "author edits edition" on public.editions
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "author deletes edition" on public.editions
  for delete to authenticated using (author_id = auth.uid());

create trigger editions_touch before update on public.editions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Estilo · Y2K: piezas del collage
-- Posición relativa al ancho del lienzo para que se vea igual en ambos iPhone:
--   x, width en fracción del ancho (0–1); y en "anchos" desde arriba (el lienzo crece hacia abajo).
-- ---------------------------------------------------------------------------
create table public.collage_items (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('photo', 'cutout', 'sticker', 'text')),
  storage_path text,                                 -- bucket "collage" (photo, cutout)
  sticker_id text,                                   -- id del catálogo estático de stickers
  body text,                                         -- texto pop
  style jsonb not null default '{}',                 -- fuente/color del texto, etc.
  bg_removed boolean not null default false,
  x real not null default 0.3,
  y real not null default 0,
  width real not null default 0.4 check (width > 0),
  rotation real not null default 0,                  -- grados
  z int not null default 0,
  locked boolean not null default false,
  locked_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind in ('photo', 'cutout') and storage_path is not null)
    or (kind = 'sticker' and sticker_id is not null)
    or (kind = 'text' and body is not null)
  )
);

create index collage_items_y_idx on public.collage_items (y);

alter table public.collage_items enable row level security;

-- Ambos mueven cualquier pieza; una pieza fijada no se mueve ni se borra hasta desfijarla.
create policy "members read collage" on public.collage_items
  for select to authenticated using (public.is_member());
create policy "members add collage" on public.collage_items
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());
create policy "members edit collage" on public.collage_items
  for update to authenticated using (public.is_member()) with check (public.is_member());
create policy "members delete unlocked collage" on public.collage_items
  for delete to authenticated using (public.is_member() and not locked);

create or replace function public.guard_collage_lock()
returns trigger
language plpgsql
as $$
begin
  if old.locked and new.locked and (
    new.x is distinct from old.x or new.y is distinct from old.y
    or new.width is distinct from old.width or new.rotation is distinct from old.rotation
    or new.z is distinct from old.z
  ) then
    raise exception 'La pieza está fijada; desfíjala antes de moverla';
  end if;
  if new.locked and not old.locked then
    new.locked_by = auth.uid();
  elsif not new.locked then
    new.locked_by = null;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger collage_items_guard before update on public.collage_items
  for each row execute function public.guard_collage_lock();

-- ---------------------------------------------------------------------------
-- Los vinilos de Big: portada de la canción (oEmbed)
-- ---------------------------------------------------------------------------
alter table public.songs add column cover_url text;

-- ---------------------------------------------------------------------------
-- Actividad: una fila por cada cosa nueva que hace uno de los dos
-- ---------------------------------------------------------------------------
create table public.activity (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in (
    'edition_published', 'collage_added', 'photo_taken', 'photo_liked', 'song_dedicated',
    'letter', 'extra', 'movie_added', 'movie_picked', 'movie_rated'
  )),
  section text not null check (section in ('portada', 'y2k', 'alfombra', 'vinilos', 'cartelera', 'cartas')),
  ref_id text,
  preview text,
  created_at timestamptz not null default now()
);

create index activity_created_at_idx on public.activity (created_at desc);

alter table public.activity enable row level security;

create policy "members read activity" on public.activity
  for select to authenticated using (public.is_member());
-- Sin políticas de escritura: solo la llenan los triggers.

-- Hasta cuándo vio cada quien cada sección (para "Nuevo" y el badge).
create table public.section_reads (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  section text not null check (section in ('portada', 'y2k', 'alfombra', 'vinilos', 'cartelera', 'cartas')),
  seen_at timestamptz not null default now(),
  primary key (user_id, section)
);

alter table public.section_reads enable row level security;

create policy "own section reads" on public.section_reads
  for all to authenticated using (user_id = auth.uid()) with check (public.is_member() and user_id = auth.uid());

-- Pendientes por sección para quien consulta.
create or replace function public.unseen_by_section()
returns table (section text, unseen int)
language sql
stable
security invoker
set search_path = public
as $$
  select a.section, count(*)::int
  from public.activity a
  left join public.section_reads r on r.user_id = auth.uid() and r.section = a.section
  where a.actor_id <> auth.uid() and a.created_at > coalesce(r.seen_at, '-infinity')
  group by a.section;
$$;

-- Total de pendientes de una persona (lo usa la Edge Function para el badge del ícono).
create or replace function public.unseen_count(p_user uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.activity a
  left join public.section_reads r on r.user_id = p_user and r.section = a.section
  where a.actor_id <> p_user and a.created_at > coalesce(r.seen_at, '-infinity');
$$;

revoke execute on function public.unseen_count(uuid) from public, anon, authenticated;

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_section text;
  v_actor uuid;
  v_preview text;
  v_row jsonb := to_jsonb(new);
begin
  case tg_table_name
    when 'editions' then
      if new.published_at is null or (tg_op = 'UPDATE' and old.published_at is not null) then
        return new;
      end if;
      v_kind := 'edition_published'; v_section := 'portada'; v_actor := new.author_id; v_preview := new.headline;
    when 'collage_items' then
      v_kind := 'collage_added'; v_section := 'y2k'; v_actor := new.author_id; v_preview := new.kind;
    when 'photos' then
      v_kind := 'photo_taken'; v_section := 'alfombra'; v_actor := new.author_id; v_preview := nullif(new.caption, '');
    when 'photo_likes' then
      if exists (select 1 from public.photos p where p.id = new.photo_id and p.author_id = new.user_id) then
        return new;  -- like a la propia foto: no avisa
      end if;
      v_kind := 'photo_liked'; v_section := 'alfombra'; v_actor := new.user_id;
    when 'songs' then
      v_kind := 'song_dedicated'; v_section := 'vinilos'; v_actor := new.author_id; v_preview := nullif(new.title, '');
    when 'messages' then
      v_kind := case when new.kind = 'nudge' then 'extra' else 'letter' end;
      v_section := 'cartas'; v_actor := new.author_id; v_preview := left(new.body, 140);
    when 'watch_items' then
      if tg_op = 'INSERT' then
        v_kind := 'movie_added'; v_actor := new.added_by;
      elsif new.status = 'watching' and old.status is distinct from 'watching' then
        v_kind := 'movie_picked'; v_actor := coalesce(new.picked_by, auth.uid());
      else
        return new;
      end if;
      v_section := 'cartelera'; v_preview := new.title;
    when 'watch_ratings' then
      v_kind := 'movie_rated'; v_section := 'cartelera'; v_actor := new.user_id;
      select w.title into v_preview from public.watch_items w where w.id = new.item_id;
    else
      return new;
  end case;

  if v_actor is null then
    return new;
  end if;

  insert into public.activity (actor_id, kind, section, ref_id, preview)
  values (
    v_actor, v_kind, v_section,
    coalesce(v_row ->> 'id', v_row ->> 'photo_id', v_row ->> 'item_id'),
    v_preview
  );
  return new;
end;
$$;

create trigger editions_activity after insert or update of published_at on public.editions
  for each row execute function public.log_activity();
create trigger collage_items_activity after insert on public.collage_items
  for each row execute function public.log_activity();
create trigger photos_activity after insert on public.photos
  for each row execute function public.log_activity();
create trigger photo_likes_activity after insert on public.photo_likes
  for each row execute function public.log_activity();
create trigger songs_activity after insert on public.songs
  for each row execute function public.log_activity();
create trigger messages_activity after insert on public.messages
  for each row execute function public.log_activity();
create trigger watch_items_activity after insert or update of status on public.watch_items
  for each row execute function public.log_activity();
create trigger watch_ratings_activity after insert on public.watch_ratings
  for each row execute function public.log_activity();

-- ---------------------------------------------------------------------------
-- Web Push: cada fila de actividad llama a la Edge Function `notify` (pg_net).
-- La URL y el secreto viven en Vault; sin ellos no se envía nada:
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/notify', 'notify_url');
--   select vault.create_secret('<secreto aleatorio>', 'notify_secret');
-- ---------------------------------------------------------------------------
create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  -- Collage y likes avisan como mucho una vez cada 10 minutos por persona.
  if new.kind in ('collage_added', 'photo_liked') and exists (
    select 1 from public.activity a
    where a.actor_id = new.actor_id and a.kind = new.kind and a.id <> new.id
      and a.created_at > now() - interval '10 minutes'
  ) then
    return new;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'notify_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'notify_secret';
  if v_url is null or v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    body := to_jsonb(new),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret)
  );
  return new;
end;
$$;

create trigger activity_push after insert on public.activity
  for each row execute function public.dispatch_push();

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.editions, public.collage_items, public.activity, public.photo_likes, public.watch_ratings;

-- ---------------------------------------------------------------------------
-- Storage: bucket "collage" (fotos sin fondo y recortes, PNG/WebP con transparencia).
-- En el collage cualquiera de los dos puede borrar una pieza, así que también su archivo.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('collage', 'collage', false)
on conflict (id) do nothing;

drop policy "members read media" on storage.objects;
drop policy "members upload own folder" on storage.objects;
drop policy "owner deletes media" on storage.objects;
drop policy "owner updates media" on storage.objects;

create policy "members read media" on storage.objects
  for select to authenticated
  using (bucket_id in ('photos', 'avatars', 'collage') and public.is_member());

create policy "members upload own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('photos', 'avatars', 'collage')
    and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owner deletes media" on storage.objects
  for delete to authenticated
  using (
    (bucket_id in ('photos', 'avatars') and (storage.foldername(name))[1] = auth.uid()::text)
    or (bucket_id = 'collage' and public.is_member())
  );

create policy "owner updates media" on storage.objects
  for update to authenticated
  using (bucket_id in ('photos', 'avatars', 'collage') and (storage.foldername(name))[1] = auth.uid()::text);
