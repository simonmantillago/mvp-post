-- Efecto de revelado de cada polaroid (Alfombra roja). Es solo de presentación: el archivo guardado sigue siendo la foto original.
-- Lo cambia quien tomó la foto (política "author edits photo" de 0001); Realtime ya publica photos.
alter table public.photos
  add column effect text not null default 'original'
  check (effect in ('original', 'grano', 'vintage', 'flash', 'noir', 'digicam'));
