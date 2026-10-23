# Modelo de datos

Fuente de verdad: [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql). Cambios nuevos van en migraciones nuevas (`0002_...sql`), nunca editando una ya aplicada.

## Tablas

| Tabla | Para qué | Notas |
|---|---|---|
| `couple_members` | Los 2 `user_id` de la pareja | Base de `is_member()`; toda RLS depende de esto. |
| `profiles` | Nombre, nick/estado MSN, avatar, tema, sonidos | Se crea sola al crear el usuario (trigger). `theme ∈ bliss · manhattan · leopardo`. |
| `photos` / `photo_likes` | Paparazzi | Archivo en bucket `photos/<user_id>/<uuid>.jpg`. |
| `messages` | MVP Messenger | `kind = 'text' \| 'nudge'`. El zumbido es un mensaje `nudge`. Solo el destinatario marca `read_at`. |
| `songs` | CD Player | `platform = spotify \| youtube \| other`, con `dedication`. |
| `watch_items` / `watch_ratings` | Blockbuster | `status = want → watching → watched`. Rating 1–5 por persona. |
| `push_subscriptions` | Web Push | Para la fase final de v1. |

## Turno en Blockbuster
No hay tabla: le toca elegir a quien **no** fue `picked_by` del último item con `started_at` más reciente. Si no hay ninguno, empieza ella. Al pasar un item de `want` a `watching` se guarda `picked_by = auth.uid()` y `started_at = now()`.

## Seguridad
- RLS activa en todas las tablas. Lectura: `is_member()`. Escritura: solo filas propias (`author_id`/`user_id = auth.uid()`), salvo `watch_items`, que ambos editan.
- Buckets `photos` y `avatars` privados; se leen con signed URLs (`createSignedUrl`, ~1 h). Cada quien escribe solo en su carpeta `<user_id>/`.
- Registro deshabilitado en Auth (*Authentication → Sign In / Providers → Allow new users to sign up: off*).

## Setup de Supabase (una vez)
1. Crear proyecto en supabase.com (plan gratis).
2. SQL Editor → pegar y correr `0001_init.sql` (o `supabase db push` con la CLI).
3. Authentication → Users → *Add user* dos veces (email + contraseña, *Auto confirm*). En `user_metadata` poner `{"display_name": "..."}` si se quiere.
4. Insertar ambos en la pareja:
   ```sql
   insert into public.couple_members (user_id)
   select id from auth.users where email in ('ella@...', 'yo@...');
   ```
5. Deshabilitar sign-ups.
6. Copiar `Project URL` y `anon public key` a `.env.local` y a las variables de Netlify.
