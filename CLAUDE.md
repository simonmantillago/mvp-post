# MVP OS

PWA privada de pareja, regalo para **MVP**. Simula un sistema operativo Y2K estilo Windows XP llamado **MVP OS**: cada módulo es una "aplicación" del escritorio. Solo dos usuarios. Se usa sobre todo instalada en el celular (ella tiene **iPhone**).

- Producto, usuarios y compromisos de marca: [PRODUCT.md](PRODUCT.md)
- Spec de cada módulo: [docs/modules.md](docs/modules.md)
- Base de datos, RLS y setup de Supabase: [docs/data-model.md](docs/data-model.md)
- Referencias visuales: [docs/inspiration/](docs/inspiration/) (`xp-y2k/`, `manhattan/`, `leopardo-lirios/`)
- Sistema de diseño: `DESIGN.md` (se escribe al terminar la dirección visual con Impeccable; aún no existe)

## Decisiones tomadas (no reabrir sin que el usuario lo pida)
- **Stack:** React 19 + Vite 6 + TypeScript + `vite-plugin-pwa` · Supabase (Auth, Postgres + RLS, Storage, Realtime) · Netlify gratis. **Sin Ionic** (toda la UI es propia). Capacitor solo si en el futuro hace falta algo nativo.
- Node local es 20.13 → mantener Vite 6 (Vite 7 pide Node ≥ 20.19).
- **Mobile-first** en vertical; en escritorio se comporta como XP con ventanas flotantes.
- **Login:** pantalla de bienvenida estilo XP con las dos fotos; tocar usuario → contraseña. Logo **"MVP OS"** en script fino/delicado tipo Victoria's Secret (nunca "XP"). Pie: **"SMG Development®"**. Animaciones de arranque/bienvenida estilo Windows. Supabase email+contraseña, sign-ups deshabilitados, 2 cuentas creadas a mano.
- **Estructura visual fija** (ventanas, barra de inicio, íconos, bandeja) + **3 temas** intercambiables en Panel de control vía `data-theme` en `<html>`:
  1. `bliss` — **Bliss Rosa**: chrome rosa/plata cromado, colina tipo Bliss en atardecer rosa, stickers, brillos, flashes.
  2. `manhattan` — **Manhattan 2003** (Sex and the City): skyline NY de noche, negro + rosa + dorado, editorial.
  3. `leopardo` — **Leopardo & Lirios** (su gusto personal): leopardo con lirios y flores vino/ciruela/rosa viejo, cerezas brillantes, rosas rojas, dorado barroco, bola disco, vinilo-corazón, lacre, beso de labial; chrome vino profundo con bordes dorados.
  - Default provisional: `leopardo`. El definitivo se decide en la ronda de dirección de Impeccable.
- Texturas e ilustraciones (leopardo, flores, wallpapers, stickers, íconos) son **assets raster propios**, no dibujos en CSS.
- **Módulos v1:** Boot+Login, Escritorio/Shell, Paparazzi (fotos+flash), MVP Messenger (chat+zumbido), CD Player (links Spotify/YouTube + dedicatoria), Blockbuster (series/pelis con turnos), Panel de control. Backlog en docs/modules.md.
- **iOS:** Web Push solo con la PWA instalada (iOS 16.4+). No hay Vibration API → el zumbido es visual + sonido. El audio solo suena tras un gesto del usuario.
- No usar logos ni marcas reales (Microsoft, Hello Kitty, Victoria's Secret, MSN, Blockbuster…): todo propio, "inspirado en". "Blockbuster" y "MSN" son nombres internos de la metáfora; en la UI usar nombres propios si se ve como marca.
- UI en **español**.

## Comandos
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build → dist/
npm run preview    # sirve dist/ (para probar el service worker)
npm run lint       # tsc --noEmit
```
Variables en `.env.local` (ver `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, opcional `VITE_TMDB_API_KEY`.

## Estructura
```
src/
  main.tsx, App.tsx       # App decide: boot → login → desktop según sesión
  os/                     # el "sistema operativo"
    boot/  login/  desktop/  taskbar/  windows/  themes/
  apps/<app>/             # paparazzi, messenger, cdplayer, blockbuster, control-panel
  lib/supabase.ts         # cliente único
  hooks/                  # useSession, useRealtime…
  styles/                 # tokens.css (por tema), base.css
public/                   # íconos PWA, wallpapers, sonidos
supabase/migrations/      # SQL versionado; nunca editar una migración aplicada
docs/                     # specs e inspiración
```

## Convenciones
- Un registro de apps (`src/apps/registry.ts`) con `id`, nombre, ícono y componente: escritorio, menú Inicio y barra de tareas leen de ahí.
- Estado de ventanas en Zustand (`src/os/windows/store.ts`); datos con hooks sobre supabase-js. Sin librerías de UI de terceros.
- Colores, tipografías, radios y sombras **solo** desde tokens CSS por tema; ningún color suelto en componentes.
- Cada módulo cubre vacío, cargando, error y sin conexión (ver docs/modules.md).
- Imágenes subidas: comprimir en cliente (máx. ~1600 px) — el Storage gratis es 1 GB.
- Buckets privados + signed URLs. Nunca exponer service role key en el cliente.
- Respetar `prefers-reduced-motion` en animaciones de boot, zumbido y flash.

## Flujo de trabajo
- **Todo trabajo de UI usa la skill Impeccable** (`/impeccable`). La dirección visual (mundo, temas, comps) se hace con su flujo new-work antes de construir el shell. Tras construir: `/impeccable polish` y `/impeccable audit`; al final el documenter escribe `DESIGN.md`.
- Probar en el navegador integrado a 390 px (móvil) y 1440 px.
- Al cerrar cada sesión: actualizar el **Roadmap** de abajo (marcar `[x]`, anotar bloqueos).

## Roadmap (inicio 2026-10-23, entrega en 2–3 semanas)
### Fase 1 — Fundaciones
- [x] Definir producto, módulos, stack y temas
- [x] CLAUDE.md, PRODUCT.md, docs/, inspiración
- [x] Scaffold Vite + React + TS + PWA, netlify.toml
- [x] Migración `0001_init.sql`
- [ ] Usuario: crear proyecto Supabase, correr migración, crear 2 usuarios, `couple_members`, deshabilitar sign-ups
- [ ] Usuario: conectar repo a Netlify con variables de entorno; primer deploy

### Fase 2 — Dirección visual (Impeccable)
- [ ] Ronda de dirección (concept-seed + decision page) con comps de los 3 temas; elegir default
- [ ] Tokens de los 3 temas, tipografías (script para logo; sans tipo Tahoma para chrome)
- [ ] Assets: wallpapers, íconos de apps, logo MVP OS, stickers, sonidos, íconos PWA

### Fase 3 — Shell
- [ ] Boot + Login (con animaciones y SMG Development®)
- [ ] Escritorio, barra de tareas, menú Inicio, bandeja, window manager
- [ ] Panel de control (tema, perfil, sonidos)

### Fase 4 — Apps
- [ ] MVP Messenger (chat Realtime + zumbido)
- [ ] Paparazzi (cámara, flash, álbum, likes)
- [ ] Blockbuster (listas, turnos, ratings, TMDB opcional)
- [ ] CD Player (oEmbed, embeds, dedicatorias)

### Fase 5 — Cierre
- [ ] Web Push (Edge Function + VAPID) — si da el tiempo
- [ ] Pruebas en iPhone instalado (cámara, audio, push)
- [ ] `/impeccable polish` + `audit`, finish review, DESIGN.md
- [ ] Contenido real: fotos de perfil, nombres, primeras fotos

## Pendientes del usuario
- Nombre/nick de su usuario para el login, y fotos de perfil de ambos.
- Proyecto Supabase (URL + anon key) y cuenta Netlify.
- Fotos reales para el contenido inicial (opcional).
