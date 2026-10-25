# Estado actual — The MVP Post (2026-10-24)

Punto de partida para la próxima sesión. Primer MVP **publicado**; de aquí en adelante se itera módulo por módulo.

## Qué está hecho y publicado
- **Producción:** https://mvp-post.netlify.app — cada push a `main` (repo privado `simonmantillago/mvp-post`) se publica solo. Último commit publicado: ver `git log -1`.
- **Dirección visual:** «Estilos del domingo» (ronda Impeccable). Contrato: `.impeccable/surfaces/src-app-tsx.md`. Sistema: `DESIGN.md` + `.impeccable/design.json`.
- **Pantallas:** llegada (periódico atado con cinta cae en la puerta), login con credenciales de prensa, portada (pliegos con miniatura del mundo de cada sección), columna, redacción (solo Simón), Y2K (collage con gestos, burbuja tipo iOS, sello «Fijado»), Alfombra roja (cámara, marco de pedrería, polaroids, ♥), Los vinilos de Big (tocadiscos, pila de fundas con sello de lacre), Cartelera (turnos, estrellas), Cartas (chat + ¡Extra!), Suscripción (notificaciones por sección).
- **Backend:** Supabase con migraciones 0001, 0002 y 0003 aplicadas; push configurado de punta a punta (triggers → `activity` → pg_net → Edge Function `notify`); variables `VITE_*` en `.env.local` y Netlify (incluye `VITE_EMAIL_HER` / `VITE_EMAIL_HIM` del login).
- **Calidad:** auditoría técnica + revisión final por agentes (4 rondas, todo resuelto). Detector Impeccable sin hallazgos bloqueantes; quedan avisos de colores sueltos (ver deuda de tokens).
- **Revisar sin contraseñas reales:** `npm run dev` y abrir `?demo` (ella), `?demo=el` (él), `?demo=fuera` (login). Datos falsos en `src/lib/demo.ts`, excluidos del build.

## Alfombra roja: alas + ráfaga de paparazzi (publicado 2026-10-24)
1. **Alas de ángel** (`public/sections/alfombra/alas.webp`, imagen del usuario): el visor ahora mide `min(76%, 22rem)` para dejar aire a los lados; `.wings` a 200 % del visor, `translate: -51.3% -58%`, `mix-blend-mode: screen`. Los hombros asoman sobre el marco y las plumas llegan al borde de la columna. `.camera` recorta en horizontal (`overflow-x: clip`) porque la imagen es más ancha que la pantalla y hacía que el iPhone alejara el zoom. Revisado a 390 y 1440 px.
2. **Ráfaga de paparazzi**: 4 flashes parciales + 5.º flash completo que toma la foto (`BURST = [0, 95, 190, 285, 560]`), clic-clic-clic con Web Audio en `paparazzi.ts`; con `prefers-reduced-motion`, un solo flash. Probada en el navegador con una cámara simulada: el ritmo y la polaroid nueva funcionan (en `?demo` la foto nueva sale vacía porque el upload falso no guarda bytes). **Falta oír el sonido y verla con la cámara real en el iPhone.**

## Alfombra roja · ronda 2 (publicado 2026-10-24)
- **Alas más abiertas:** `.wings` a `min(240%, (100vw − 0.5rem) × 1.53)`; la cámara va a sangre y recorta en el borde de la pantalla. En el teléfono las puntas llegan casi al borde.
- **Fondo:** leopardo oscuro con lirios vino (`public/sections/alfombra/fondo.webp`, imagen del usuario), fijo en pantalla con `position: sticky` en `.carpet-ground::before`. La miniatura del pliego en la portada usa la misma imagen.
- **Pie de polaroid** en Bodoni Moda itálica.
- **Efectos de revelado:** columna `photos.effect` (migración `0003_photo_effects.sql`, **aplicada**). Efectos: Original, Grano, Vintage, Flash, Noir y Digicam 2003, hechos con CSS (`.fx-<id>`, `src/sections/alfombra-roja/effects.ts`, grano de `grainTexture()`). Solo quien tomó la foto ve el carrete en la polaroid grande.
- **Audio de paparazzi:** `public/sections/alfombra/paparazzi.mp3` (1,5 s). Se precarga al tocar «Encender la cámara»; si no carga, suena el clic sintetizado. `BURST = [35, 155, 265, 470, 570, 720]` está medido sobre los clics del audio. **Falta oírlo en el iPhone.**

## Alfombra roja · ronda 3 (publicado 2026-10-24)
- **Bug del iPhone corregido:** en iOS, `mix-blend-mode: screen` no se aplicaba a las alas y su fondo negro tapaba el título, la cabecera, el fondo y los botones. Ahora `alas.webp` tiene transparencia real: el negro pasa a alfa según el brillo, y la imagen está recortada al par de alas (759 × 846). Se generó con Pillow desde la imagen original (commit 29a8095) y ya no usa ningún blend. No queda ningún `mix-blend-mode` fuera del grano de las polaroids, que está aislado en cada foto.
- **Destellos de diamante** (`glintTexture()` en `src/ui/leopard.ts`): cruces finísimas que se abren y se cierran en su sitio (3,6 s, con retrasos distintos). Hay 12 sobre las alas, donde asoman fuera del marco, y 6 sobre la banda de pedrería del marco (`WING_GLINTS` / `FRAME_GLINTS`). Con movimiento reducido no aparecen.
- **Vista previa antes de subir:** al tomar la foto, o al elegirla con la cámara del sistema, se abre la polaroid sin subir. Ahí se escribe el pie y se elige el efecto, y se **publica** o se **descarta**. Solo se sube al publicar.
- **Borrar polaroids propias:** botón en la esquina inferior de la polaroid grande; el primer toque pregunta «¿Borrar?» y el segundo borra la fila y el archivo.
- **Disparador con camarita** (ícono `camera`, `aria-label` «Tomar la foto») en lugar de la palabra «Flash». **Bajada** bajo el título: «Sección dedicada a tomarle fotos al ángel más hermoso que he conocido.» (`.carpet-dek`, Bodoni itálica).
- **Falta probar en el iPhone:** que se vean título, fondo y controles; el sonido; publicar y borrar con datos reales.

## Portada como periódico (publicado 2026-10-24)
- La banda de la columna dice **Carrie's Column**; la foto, el titular y la entrada de la columna siguen igual.
- «En esta edición» ya no es el cuadernillo negro. Ahora es una plana en papel con un artículo por sección: foto a color, título en la letra de su mundo, bajada, «Pág. N» y botón «Ver sección».
- La composición varía según `layout` en `src/sections/registry.ts` (`lead-left`, `float-right`, `banner`, `pair`). El registro también guarda la bajada (`dek`), la foto (`cover`), el pie (`caption`) y el encuadre.
- Fotos de Simón en `public/portada/`: swag, angeles (cuadritos limpiados a blanco), big, cartelera, cartas.
- Nombres nuevos en toda la app: **Los Ángeles de Victoria** (ruta `/alfombra-roja` e id `alfombra` sin cambios) y **Cartas mágicas** (ruta `/cartas`). Los títulos de push en `notify` también cambiaron, incluida «Carta mágica de …».

## Los vinilos de Big: Spotify, aguja y tocadiscos 3D (2026-10-24)
Brief: `docs/briefs/vinilos-spotify.md`; prototipo aprobado: `docs/briefs/tocadiscos-3d.html`.
- **Edge Function `spotify-search`** desplegada (Client Credentials, `limit=10`). Valida el JWT y `is_member()`: sin sesión da 401 y con la llave anónima, 403. **Faltan los secretos `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`** (app de Simón en Spotify for Developers). Hasta entonces el buscador muestra «Spotify no respondió…» y queda pegar el enlace.
- **Dedicar canción:** buscador con espera de 300 ms, resultados como fundas de cuero, estados de buscando, vacío, error y sin conexión. Al elegir se llenan `url`, `title`, `artist` y `cover_url`. Pegar el enlace sigue como respaldo. Al guardar, la canción nueva pasa al tocadiscos. El push dice «te dedicó una canción» cuando no hay título (`notify` redesplegada).
- **Tocadiscos 3D** (`src/sections/vinilos/turntable3d.ts`, three.js 0.186 en chunk diferido de ~136 kB gzip): pasa el prototipo a módulo, con las luces ×π porque desde r155 son físicas. Tiene la carátula real en la etiqueta, render solo mientras algo se mueve y respaldo 2D sin WebGL. Con movimiento reducido el disco no gira.
- **Aguja = play/pausa** (`player.ts`, Spotify iFrame API): bajar llama `play()` la primera vez y `resume()` después; levantar llama `pause()`. Si se pausa desde el embed o termina la muestra, el brazo se levanta solo. Probado en el navegador integrado (escritorio, sin sesión de Spotify): toca la **muestra de 30 s**, pausa y reanuda con el brazo y con el botón. **Sin gesto real, `play()` no arranca** (autoplay): tras 4 s aparece «Si no arranca, toca play en el reproductor». Cuando la duración es de unos 30 s, se avisa «Aquí suena la muestra de 30 s. La canción entera, en Spotify.» junto a «Abrir en Spotify».
- **Falta en el iPhone instalado:** que el toque del brazo haga sonar el embed (el iframe es de otro origen), la búsqueda real y que «Abrir en Spotify» abra la app.
- En `?demo` la canción s1 apunta a un track público real para probar el embed; la búsqueda falsa responde a todo (con «error» simula la caída y con «zzz», la búsqueda vacía).

## Pendientes conocidos
- **Fotos de perfil** de ambos en `public/readers/maria-victoria.jpg` y `simon.jpg` (hoy se ven iniciales).
- **Quitar fondo** a las fotos del collage Y2K (plan: `@imgly/background-removal`; plan B MediaPipe). Hoy se pegan con fondo.
- **Probar en los dos iPhone instalados**: login real, cámara, push (activar en Suscripción), badge, Spotify/YouTube embebido.
- **Íconos PWA definitivos** (`public/icons/`) y sonidos (¡Extra!).
- **Primera edición real** (la escribe Simón en Redacción).
- **Deuda de tokens** (reportada por el documentador): varios colores escritos directo en CSS/TSX en vez de tokens (FrontPage, Arrival, Vinilos, Cartelera, polaroids, `Marks.tsx` usa hex en vez de `--seal-her/--seal-him`). No afecta el look.
- TMDB opcional para pósters en Cartelera.
- Re-correr `/impeccable audit` después de los cambios grandes.

## Cómo seguir iterando un módulo
1. `npm run dev` → abrir `localhost:5173/<ruta>?demo`.
2. Cambios de UI con `/impeccable` (respetar `DESIGN.md` y el contrato).
3. `npm run build` + detector (`impeccable detect --json src`).
4. Commit y `git push` → Netlify publica solo. Si el iPhone muestra la versión vieja, cerrar y abrir la app (service worker).
