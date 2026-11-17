# The MVP Post

Una PWA privada para dos personas con forma de **periódico neoyorquino de 2003**. La portada es una columna que uno le escribe al otro, y cada sección del periódico es un mundo con su propia estética:

- **Carrie's Column**: ediciones semanales con titular, foto y texto.
- **2000's Collage**: mural compartido de fotos, recortes tipo sticker (el fondo se quita en el propio teléfono) y texto; mover, girar, escalar y fijar con candado.
- **Los Ángeles de Victoria**: cámara dentro de la app, ráfaga de paparazzi y polaroids con efectos de revelado.
- **Los vinilos de Big**: canciones dedicadas, búsqueda en Spotify y un tocadiscos 3D (three.js) cuya aguja es play/pausa.
- **Cartelera**: videoclub de pendientes, viendo y vistas, búsqueda en TMDB, críticas y «Ruletazo».
- **Cartas mágicas**: chat en tiempo real con estética de lechucería y el «Tin» (un aviso urgente).
- **Suscripción**: perfil, notificaciones y silenciar secciones.

Todo lo nuevo llega como notificación push, con contador en el ícono. Está pensada para iPhone con la app instalada en la pantalla de inicio. La interfaz está en español.

## Stack

- React 19 + Vite 6 + TypeScript, `react-router` 7, `three` (solo el tocadiscos), `@imgly/background-removal` (recortes).
- PWA con `vite-plugin-pwa` (modo `injectManifest`) y service worker propio: precache, push, badge y deep links.
- Supabase: Auth, Postgres con RLS, Storage privado, Realtime, Edge Functions y `pg_net` + Vault.
- Netlify para el hosting.

## Verla sin configurar nada (modo demo)

Con Node 20:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/?demo`. Es un backend falso en memoria con datos de ejemplo:

- `?demo`: lectora.
- `?demo=el`: columnista; también ve la Redacción.
- `?demo=fuera`: pantalla de login.
- Agrega `&lento` para simular que cada consulta tarda 2 segundos.

El modo demo solo existe en `npm run dev` y no entra al build.

## Montarla con tu propio backend

### 1. Supabase

1. Crea un proyecto en Supabase y vincúlalo:
   ```bash
   npx supabase login
   npx supabase link --project-ref <tu-ref>
   npx supabase db push --linked
   ```
   Esto aplica las migraciones de `supabase/migrations/`: tablas, RLS, buckets y triggers.
2. En Auth, crea a mano las dos cuentas (correo y contraseña) y **deshabilita los registros**.
3. Agrega las dos cuentas a la pareja (SQL):
   ```sql
   insert into public.couple_members (user_id)
   select id from auth.users where email in ('ella@ejemplo.com', 'el@ejemplo.com');
   ```

### 2. Notificaciones push

1. Genera llaves VAPID:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Carga los secretos y despliega la función:
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tu@correo NOTIFY_SECRET=<aleatorio>
   npx supabase functions deploy notify --no-verify-jwt
   ```
3. Guarda en Vault la URL de la función y el mismo secreto (SQL):
   ```sql
   select vault.create_secret('https://<tu-ref>.supabase.co/functions/v1/notify', 'notify_url');
   select vault.create_secret('<el mismo NOTIFY_SECRET>', 'notify_secret');
   ```

Sin esto la app funciona igual, solo que sin notificaciones.

### 3. Búsquedas (opcional)

- **Spotify**: crea una app en Spotify for Developers.
  ```bash
  npx supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
  npx supabase functions deploy spotify-search
  ```
- **TMDB** (Cartelera):
  ```bash
  npx supabase secrets set TMDB_API_KEY=...
  npx supabase functions deploy movie-search
  ```

Ambas funciones exigen sesión y que el usuario sea de la pareja.

### 4. Variables del cliente

Copia `.env.example` a `.env.local` y llénalo:

| Variable | Qué es |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto |
| `VITE_SUPABASE_ANON_KEY` | Llave anon (pública) |
| `VITE_VAPID_PUBLIC_KEY` | Llave pública VAPID |
| `VITE_EMAIL_HER` / `VITE_EMAIL_HIM` | Correos de las dos cuentas (las tarjetas del login) |

Los nombres que se ven en el login están en `src/paper/readers.ts`.

### 5. Netlify

`netlify.toml` ya trae el build, la reescritura SPA y los encabezados de caché:

1. Conecta el repo a un sitio de Netlify.
2. Carga ahí las mismas variables `VITE_*`.
3. En Supabase → Auth → URL Configuration, pon la URL del sitio como `site_url`.

## Comandos

```bash
npm run dev       # desarrollo en http://localhost:5173
npm run build     # tsc -b && vite build → dist/ (incluye sw.js)
npm run preview   # sirve dist/ para probar el service worker
npm run lint      # tsc --noEmit
```

## Estructura

```
src/
  paper/          llegada, login, portada, columna, transiciones
  sections/       una carpeta por sección (registro en registry.ts)
  lib/ hooks/     cliente de Supabase, push, caché, datos
  styles/         tokens por sección
  sw.ts           service worker
supabase/
  migrations/     esquema, RLS y triggers
  functions/      notify, spotify-search, movie-search
docs/             specs, modelo de datos, wireframes
```

Más detalle en [docs/modules.md](docs/modules.md), [docs/data-model.md](docs/data-model.md) y [DESIGN.md](DESIGN.md).

## Notas

- Web Push en iPhone requiere iOS 16.4+ y la app instalada en la pantalla de inicio.
- Quitar el fondo de los recortes descarga un modelo de unos 40 MB la primera vez.
- `@imgly/background-removal` es AGPL-3.0.

## Licencia

El código está bajo licencia [MIT](LICENSE). Las fotos de portada, las imágenes de referencia, la fuente Kabisat (versión demo) y el audio de paparazzi son de terceros y conservan sus propios términos.

---

SMG Development®
