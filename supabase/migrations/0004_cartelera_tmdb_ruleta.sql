-- Cartelera ronda 2: ficha de TMDB en cada cinta y el «Ruletazo».

-- Datos de la búsqueda (TMDB). poster_url y tmdb_id ya existían desde 0001.
alter table public.watch_items
  add column year int,
  add column overview text not null default '';

-- Cada giro de la ruleta decide quién elige esta noche. El turno se calcula así:
-- gana el evento más reciente entre el último giro (elige quien salió) y la última
-- película empezada (elige quien NO la eligió).
create table public.watch_spins (
  id uuid primary key default gen_random_uuid(),
  chooser uuid not null references public.profiles (id) on delete cascade,
  spun_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.watch_spins enable row level security;

create policy "members read spins" on public.watch_spins
  for select to authenticated using (public.is_member());
create policy "members spin" on public.watch_spins
  for insert to authenticated with check (public.is_member() and spun_by = auth.uid());

alter publication supabase_realtime add table public.watch_spins;
