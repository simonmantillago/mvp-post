# Modelo de datos

Fuente de verdad: [`0001_init.sql`](../supabase/migrations/0001_init.sql) + [`0002_mvp_post.sql`](../supabase/migrations/0002_mvp_post.sql). Cambios nuevos van en migraciones nuevas (`0003_...sql`), nunca editando una ya aplicada.

## Tablas

| Tabla | Sección | Notas |
|---|---|---|
| `couple_members` | — | Los 2 `user_id`. Base de `is_member()`; toda RLS depende de esto. |
| `profiles` | Suscripción | Nombre, nick, avatar, sonidos, `muted_sections` (secciones sin push). Se crea sola con el usuario. Ya no hay `theme`. |
| `editions` | Portada | La columna. `number` = "Edición n.º" (identity). `published_at` null = borrador (solo lo ve su autor). `continues_to` = sección a la que lleva al final. |
| `collage_items` | Estilo · Y2K | Pieza del collage: `kind = photo · cutout · sticker · text`. Posición relativa (`x`, `width` en fracción del ancho; `y` en anchos), `rotation` en grados, `z`. `locked` bloquea mover/borrar (trigger + RLS). |
| `photos` / `photo_likes` | Alfombra roja | Fotos tomadas con la cámara de la app, como polaroids con `caption`. Bucket `photos/<uid>/`. |
| `songs` | Los vinilos de Big | `author_id` = quien la dedicó. `platform`, `dedication`, `cover_url` (oEmbed). |
| `watch_items` / `watch_ratings` | Cartelera | `status = want → watching → watched`. Rating 1–5 por persona. |
| `messages` | Cartas al editor | `kind = 'text' \| 'nudge'` (nudge = ¡Extra!). Solo el destinatario marca `read_at`. |
| `activity` | todas | Una fila por cada cosa nueva. Solo la llenan triggers. Alimenta "Nuevo", el badge y las notificaciones. |
| `section_reads` | todas | Hasta cuándo vio cada quien cada sección. Al entrar a una sección: `upsert (section, seen_at = now())`. |
| `push_subscriptions` | Suscripción | Una por dispositivo (endpoint). |

Secciones (`activity.section`, `section_reads.section`): `portada · y2k · alfombra · vinilos · cartelera · cartas`.

## Turno en la Cartelera
No hay tabla: le toca elegir a quien **no** fue `picked_by` del último item con `started_at` más reciente. Si no hay ninguno, empieza ella. Al pasar un item de `want` a `watching` se guarda `picked_by = auth.uid()` y `started_at = now()`.

## Collage: fijar
- Ambos pueden mover cualquier pieza no fijada. Una pieza con `locked = true` no acepta cambios de posición/tamaño/giro/orden (el trigger `guard_collage_lock` lanza error) ni se puede borrar (RLS). Para moverla hay que mandar `locked = false` (en la misma actualización se puede mover).
- `locked_by` lo pone el trigger.
- Archivos en bucket `collage/<uid>/<uuid>.webp|png` (con transparencia si se quitó el fondo). Como cualquiera puede borrar una pieza, cualquiera puede borrar archivos del bucket `collage`.

## Notificaciones push
```
insert en editions/collage_items/photos/photo_likes/songs/messages/watch_items/watch_ratings
  → trigger log_activity()        → fila en activity
  → trigger dispatch_push()       → pg_net POST a la Edge Function notify (URL + secreto en Vault)
  → notify (supabase/functions/notify) → busca al otro, sus push_subscriptions y muted_sections,
                                          arma el texto en español y manda Web Push (VAPID)
  → service worker (src/sw.ts)    → muestra la notificación, pone el badge, al tocar abre la sección
```
- Throttle: collage y likes avisan como mucho una vez cada 10 min por persona (en `dispatch_push`).
- Sin los secretos en Vault no se manda nada (la app funciona igual).
- Suscripciones vencidas (404/410) se borran solas.

### Setup de push (una vez)
1. Llaves VAPID: `npx web-push generate-vapid-keys`.
2. Secretos de la función:
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:... NOTIFY_SECRET=<aleatorio>
   ```
3. Desplegar: `npx supabase functions deploy notify --no-verify-jwt` (la protege `NOTIFY_SECRET`).
4. En Vault (SQL):
   ```sql
   select vault.create_secret('https://hckpqydapjlmafhurswt.supabase.co/functions/v1/notify', 'notify_url');
   select vault.create_secret('<el mismo NOTIFY_SECRET>', 'notify_secret');
   ```
5. `VITE_VAPID_PUBLIC_KEY` en `.env.local` y en Netlify.

### iPhone
- Solo con la app **agregada a la pantalla de inicio** (iOS 16.4+), y el permiso se pide desde un toque (botón en Suscripción o un aviso en la portada tras el primer login).
- Cada push debe mostrar una notificación (iOS revoca el permiso si no).
- El badge numérico en el ícono funciona en la app instalada (Badging API).

## Seguridad
- RLS activa en todas las tablas. Lectura: `is_member()`. Escritura: filas propias (`author_id`/`user_id = auth.uid()`), salvo `watch_items` y `collage_items`, que ambos editan.
- `activity` no tiene políticas de escritura; `unseen_count()` solo la ejecuta el service role.
- Buckets `photos`, `avatars`, `collage` privados; se leen con signed URLs (~1 h). Cada quien sube solo a su carpeta `<uid>/`.
- Registro deshabilitado en Auth.

## Setup de Supabase (hecho)
Proyecto `mvp_db` (ref `hckpqydapjlmafhurswt`), 0001 aplicada, 2 usuarios en `couple_members`, sign-ups deshabilitados. Para aplicar migraciones nuevas: `npx supabase db push --linked`.
