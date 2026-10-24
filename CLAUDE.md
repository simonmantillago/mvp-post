# The MVP Post

PWA privada de pareja, regalo para **MVP**. Es un **periódico neoyorquino de 2003**: la portada es la columna que Simón le escribe (guiño a la columnista de Manhattan de la TV de esos años) y cada sección del periódico es un mundo con su propia estética. Solo dos usuarios. **Ambos usan iPhone**, con la app instalada en la pantalla de inicio.

- Producto, usuarios y compromisos de marca: [PRODUCT.md](PRODUCT.md)
- Spec de cada sección + notificaciones: [docs/modules.md](docs/modules.md)
- Base de datos, RLS, push y setup de Supabase: [docs/data-model.md](docs/data-model.md)
- **Wireframe aprobado (2026-10-24):** [docs/wireframes/periodico.html](docs/wireframes/periodico.html) — abrir con `npm run dev` en `localhost:5173/docs/wireframes/periodico.html`
- Referencias visuales: [docs/inspiration/periodico/](docs/inspiration/periodico/) · prompts Nano Banana (opcionales): [docs/prompts/nano-banana-periodico.md](docs/prompts/nano-banana-periodico.md)
- Sistema de diseño: `DESIGN.md` (se escribe al terminar la dirección visual con Impeccable; aún no existe)
- La dirección anterior (**MVP OS**, estilo Windows XP) se descartó el 2026-10-24 y está en [docs/archivo-mvp-os/](docs/archivo-mvp-os/). No es referencia.

## Decisiones tomadas (no reabrir sin que el usuario lo pida)
- **Nombre:** **The MVP Post** (cabecera gótica). Pie: **"SMG Development®"**.
- **Navegación:** portada → tocar titular → pasar la página → sección a pantalla completa con estética propia. Esquina doblada arriba a la derecha = volver a portada. Una ruta por sección (deep links desde notificaciones).
- **Secciones v1:** Llegada + login ("¿Quién lee hoy?", credenciales de prensa) · Portada + La columna (ediciones) · **Estilo · Y2K** (collage editable de fotos de la galería sin fondo + stickers + recortes; mover, girar, escalar, **fijar con candado**; burbuja de acciones tipo iOS) · **Sociedad · Alfombra roja** (cámara en la app → polaroids con texto) · **Los vinilos de Big** (tocadiscos + lista de fundas apiladas con sello de quién la dedicó) · **Cartelera** (videoclub, turnos, ratings) · **Cartas al editor** (chat + ¡Extra!) · Suscripción (ajustes).
- **Estética:** portada de papel (blanco hueso, tinta negra, un acento rosa); cada sección rompe: Y2K = collage de recortes, brillo, leopardo, stickers; Alfombra roja = dark leopard, dorado, pedrería, alas de ángel, flash; Vinilos = penthouse classy (nogal, cuero, ámbar, sin brillo); Cartelera = videoclub de noche; Cartas = papel y máquina de escribir.
- **Notificaciones push de todo lo nuevo** (edición, collage, foto, ♥, canción, carta, ¡Extra!, películas) + badge numérico en el ícono. Flujo: triggers → `activity` → pg_net → Edge Function `notify` → Web Push. Ver data-model.md.
- **iOS:** Web Push solo con la PWA instalada (iOS 16.4+), permiso pedido desde un toque. No hay Vibration API → el ¡Extra! es visual + sonido. Audio solo tras gesto. El menú nativo de copiar/pegar no admite acciones propias → la burbuja del collage es un componente propio con ese look.
- Texturas e ilustraciones (leopardo, stickers, alas, papel, VHS, vinilos) son **assets raster**, no dibujos en CSS.
- No usar logos ni marcas reales (Sex and the City, Victoria's Secret, Chanel, Blockbuster, MSN…): todo propio, "inspirado en". "Big" solo como guiño en el nombre de la sección.
- UI en **español**.

## Stack
- **React 19 + Vite 6 + TypeScript.** Node local es 20.13 → mantener Vite 6 (Vite 7 pide Node ≥ 20.19).
- **PWA:** `vite-plugin-pwa` en modo `injectManifest` con service worker propio [src/sw.ts](src/sw.ts) (precache + push + badge + abrir sección al tocar). Suscripción en [src/lib/push.ts](src/lib/push.ts).
- **Supabase:** Auth (email+contraseña, sign-ups off), Postgres + RLS, Storage (buckets privados + signed URLs), Realtime, Edge Function [`notify`](supabase/functions/notify/index.ts), `pg_net` + Vault.
- **Netlify** gratis: sitio `mvp-post` → https://mvp-post.netlify.app (vinculado en `.netlify/`, variables `VITE_*` cargadas). Repo: https://github.com/simonmantillago/mvp-post (privado, rama `main`).
- Para instalar al construir la UI (aún no instaladas):
  - `react-router` 7 — rutas por sección.
  - `zustand` (ya instalado) — estado de cliente (selección del collage, reproductor).
  - `@use-gesture/react` — arrastrar, pellizcar y girar piezas del collage.
  - `@imgly/background-removal` — quitar fondo en el teléfono (WASM; baja el modelo la primera vez, luego queda en caché). Licencia AGPL: sirve para este uso privado. Si va lento en iPhone, plan B: MediaPipe Image Segmenter (solo personas, más liviano).
  - `@fontsource/*` — fuentes propias empaquetadas (gótica de cabecera, serif editorial, máquina de escribir, manuscrita).
  - View Transitions API (Safari 18+) para pasar la página, con fallback CSS.
- Sin librerías de UI de terceros.

## Comandos
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build → dist/ (incluye dist/sw.js)
npm run preview    # sirve dist/ (para probar el service worker)
npm run lint       # tsc --noEmit
```
Supabase CLI (dev dependency, proyecto ya vinculado; el login es por máquina):
```bash
npx supabase migration new <nombre>     # nueva migración en supabase/migrations/
npx supabase db push --linked           # aplica migraciones pendientes a la nube
npx supabase db query --linked "select …"  # consulta rápida (-f archivo.sql para scripts largos)
npx supabase functions deploy notify --no-verify-jwt
npx supabase secrets set NOMBRE=valor
npx supabase config diff                # revisar antes de cualquier config push
```
GitHub y Netlify (CLIs ya autenticados en la terminal del usuario; `gh` está en `%LOCALAPPDATA%\Programs\gh\bin`, Netlify CLI es dev dependency). Desde el sandbox de Claude no se ven las sesiones: correr `gh`/`netlify` sin sandbox o en la terminal.
```bash
git push                                 # sube a GitHub
npx netlify deploy --prod                # build + deploy a producción desde esta carpeta
npx netlify env:set VITE_X valor         # variable nueva en Netlify (luego redeploy)
```
`supabase/config.toml` está alineado con la nube (`site_url` = Netlify, localhost en redirects); nunca hacer `config push` sin revisar `config diff`.

Variables en `.env.local` (ver `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, opcional `VITE_TMDB_API_KEY`.

## Estructura
```
src/
  main.tsx, App.tsx       # App decide: llegada → login → periódico según sesión
  sw.ts                   # service worker (tsconfig.sw.json aparte)
  paper/                  # el "periódico": llegada, login, portada, columna, transición de página, esquina doblada
  sections/<seccion>/     # y2k, alfombra-roja, vinilos, cartelera, cartas, suscripcion
  lib/                    # supabase.ts (cliente único), push.ts
  hooks/                  # useSession, useRealtime, useUnseen…
  styles/                 # tokens.css (portada + uno por sección), base.css
public/                   # íconos PWA, stickers, texturas, sonidos
supabase/migrations/      # SQL versionado; nunca editar una migración aplicada
supabase/functions/       # Edge Functions (Deno)
docs/                     # specs, wireframe, inspiración
```

## Convenciones
- Un registro de secciones (`src/sections/registry.ts`) con `id`, ruta, nombre, página y componente: portada, teasers y notificaciones leen de ahí. Ids: `portada · y2k · alfombra · vinilos · cartelera · cartas` (iguales a `activity.section`).
- Colores, tipografías, radios y sombras **solo** desde tokens CSS; cada sección tiene su bloque de tokens (`[data-section="y2k"]` …). Ningún color suelto en componentes.
- Datos con hooks sobre supabase-js. Al entrar a una sección: upsert en `section_reads`.
- Cada sección cubre vacío, cargando, error y sin conexión.
- Imágenes subidas: comprimir en cliente (máx. ~1600 px) — el Storage gratis es 1 GB. Fotos sin fondo como WebP/PNG con transparencia en bucket `collage`.
- Buckets privados + signed URLs. Nunca exponer service role key ni la llave VAPID privada en el cliente.
- Respetar `prefers-reduced-motion` en llegada, pasar página, flash y ¡Extra!.

## Flujo de trabajo
- **Todo trabajo de UI usa la skill Impeccable** (`/impeccable`). Siguiente paso: dirección visual del periódico (tokens, tipografías, assets) a partir del wireframe aprobado, sin rehacer la estructura. Tras construir: `/impeccable polish` y `/impeccable audit`; al final el documenter escribe `DESIGN.md`.
- Probar en el navegador integrado a 390 px (móvil) y 1440 px; push y cámara solo se prueban de verdad en iPhone instalado.
- Al cerrar cada sesión: actualizar el **Roadmap** de abajo (marcar `[x]`, anotar bloqueos).

## Roadmap (inicio 2026-10-23, entrega en 2–3 semanas)
### Fase 1 — Fundaciones
- [x] Producto, stack, scaffold Vite + React + TS + PWA, netlify.toml
- [x] Supabase `mvp_db` (ref `hckpqydapjlmafhurswt`): 0001 aplicada, 2 usuarios en `couple_members`, sign-ups off, `.env.local`
- [x] Cambio de dirección a The MVP Post: wireframe aprobado, docs reescritos, MVP OS archivado (2026-10-24)
- [x] Migración `0002_mvp_post.sql` escrita y probada en transacción revertida (ediciones, collage con candado, actividad, push, bucket `collage`)
- [x] Service worker propio con push + badge; `src/lib/push.ts`; Edge Function `notify` escrita
- [ ] Aplicar 0002 a la nube (`db push`) — esperando OK del usuario
- [ ] Push: llaves VAPID, secretos, deploy de `notify`, secretos en Vault
- [x] GitHub CLI + repo privado `mvp-post`; Netlify CLI + sitio `mvp-post`, variables y primer deploy; `site_url` de Supabase apuntando a Netlify (2026-10-24)
- [ ] Deploy automático en cada push: vincular el repo en Netlify (UI) — mientras tanto `npx netlify deploy --prod`
- [ ] Cargar `VITE_VAPID_PUBLIC_KEY` en Netlify al configurar push

### Fase 2 — Dirección visual (Impeccable)
- [ ] Tokens de portada y de cada sección, tipografías
- [ ] Assets: papel, leopardo, stickers, alas, vinilos, VHS, íconos PWA, sonidos

### Fase 3 — El periódico
- [ ] Llegada + login (credenciales de prensa)
- [ ] Portada, La columna, editor de ediciones, transición de página, esquina doblada, "Nuevo"
- [ ] Suscripción (perfil, notificaciones, silenciar secciones, guía de instalación en iPhone)

### Fase 4 — Secciones
- [ ] Cartas al editor (Realtime + ¡Extra!)
- [ ] Estilo · Y2K (collage, quitar fondo, gestos, burbuja iOS, fijar)
- [ ] Alfombra roja (cámara, flash, polaroids, ♥)
- [ ] Los vinilos de Big (oEmbed, tocadiscos, pila de fundas)
- [ ] Cartelera (turnos, ratings, TMDB opcional)

### Fase 5 — Cierre
- [ ] Pruebas en ambos iPhone instalados (cámara, audio, push, badge)
- [ ] `/impeccable polish` + `audit`, finish review, DESIGN.md
- [ ] Contenido real: fotos de perfil, primera edición, primeras fotos

## Pendientes del usuario
- OK para aplicar la migración 0002 y configurar push en Supabase.
- Fotos de perfil de ambos.
- Fotos reales para el contenido inicial (opcional).
