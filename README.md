# The MVP Post

A private PWA for two people, shaped like a **2003 New York newspaper**. The front page is a column one person writes to the other, and each section of the paper is its own world with its own look:

- **Carrie's Column**: weekly editions with a headline, a photo, and the column itself.
- **2000's Collage**: a shared board of photos, sticker-style cutouts (the background is removed on the phone itself), and text. Pieces can be moved, rotated, scaled, and locked.
- **Los Ángeles de Victoria**: an in-app camera with a paparazzi burst, turning shots into polaroids with developing effects.
- **Los vinilos de Big**: dedicated songs, Spotify search, and a 3D turntable (three.js) whose tonearm is play/pause.
- **Cartelera**: a video-store watchlist (to watch, watching, watched) with TMDB search, reviews, and a "Ruletazo" wheel that picks what to watch.
- **Cartas mágicas**: real-time chat styled as an owl post office, plus the "Tin", an urgent nudge.
- **Suscripción**: profile, notifications, and per-section muting.

Everything new arrives as a push notification, with a badge count on the app icon. It's built for iPhone with the app installed on the home screen. **The UI is in Spanish.**

## Stack

- React 19 + Vite 6 + TypeScript, `react-router` 7, `three` (turntable only), `@imgly/background-removal` (cutouts).
- PWA via `vite-plugin-pwa` (`injectManifest` mode) with a custom service worker: precache, push, badge, and deep links.
- Supabase: Auth, Postgres with RLS, private Storage, Realtime, Edge Functions, and `pg_net` + Vault.
- Netlify for hosting.

## Try it without any setup (demo mode)

With Node 20:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/?demo`. It runs on a fake in-memory backend with sample data:

- `?demo`: as the reader.
- `?demo=el`: as the columnist, who also sees the newsroom (Redacción).
- `?demo=fuera`: the login screen.
- Add `&lento` to make every query take 2 seconds.

Demo mode only exists under `npm run dev` and is excluded from the build.

## Run it with your own backend

### 1. Supabase

1. Create a Supabase project and link it:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-ref>
   npx supabase db push --linked
   ```
   This applies the migrations in `supabase/migrations/`: tables, RLS, buckets, and triggers.
2. In Auth, create the two accounts by hand (email and password) and **disable sign-ups**.
3. Add both accounts to the couple (SQL):
   ```sql
   insert into public.couple_members (user_id)
   select id from auth.users where email in ('her@example.com', 'him@example.com');
   ```

### 2. Push notifications

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Set the secrets and deploy the function:
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com NOTIFY_SECRET=<random>
   npx supabase functions deploy notify --no-verify-jwt
   ```
3. Store the function URL and the same secret in Vault (SQL):
   ```sql
   select vault.create_secret('https://<your-ref>.supabase.co/functions/v1/notify', 'notify_url');
   select vault.create_secret('<the same NOTIFY_SECRET>', 'notify_secret');
   ```

Without this the app still works, just without notifications.

### 3. Search (optional)

- **Spotify**: create an app in Spotify for Developers.
  ```bash
  npx supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
  npx supabase functions deploy spotify-search
  ```
- **TMDB** (Cartelera):
  ```bash
  npx supabase secrets set TMDB_API_KEY=...
  npx supabase functions deploy movie-search
  ```

Both functions require a signed-in session from one of the two members.

### 4. Client variables

Copy `.env.example` to `.env.local` and fill it in:

| Variable | What it is |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key (public) |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key |
| `VITE_EMAIL_HER` / `VITE_EMAIL_HIM` | Emails of the two accounts (used by the login cards) |

The names shown on the login screen live in `src/paper/readers.ts`.

### 5. Netlify

`netlify.toml` already sets the build, the SPA rewrite, and the cache headers:

1. Connect the repo to a Netlify site.
2. Add the same `VITE_*` variables there.
3. In Supabase → Auth → URL Configuration, set the site URL as `site_url`.

## Commands

```bash
npm run dev       # development at http://localhost:5173
npm run build     # tsc -b && vite build → dist/ (includes sw.js)
npm run preview   # serves dist/ to test the service worker
npm run lint      # tsc --noEmit
```

## Structure

```
src/
  paper/          arrival, login, front page, column, page transitions
  sections/       one folder per section (registered in registry.ts)
  lib/ hooks/     Supabase client, push, cache, data
  styles/         per-section tokens
  sw.ts           service worker
supabase/
  migrations/     schema, RLS, and triggers
  functions/      notify, spotify-search, movie-search
docs/             specs, data model, wireframes (in Spanish)
```

More detail in [docs/modules.md](docs/modules.md), [docs/data-model.md](docs/data-model.md), and [DESIGN.md](DESIGN.md).

## Notes

- Web Push on iPhone requires iOS 16.4+ and the app installed on the home screen.
- Removing the background from cutouts downloads a ~40 MB model the first time.
- `@imgly/background-removal` is licensed AGPL-3.0.

## License

The source code is licensed under [MIT](LICENSE).

Third-party material in this repository keeps its own terms and is not covered by the MIT license: the cover photos in `public/portada/`, the reference images in `docs/inspiration/` and `docs/archivo-mvp-os/`, the Kabisat demo font in `src/sections/y2k/fonts/`, and the audio in `public/sections/alfombra/paparazzi.mp3`.

---

SMG Development®
