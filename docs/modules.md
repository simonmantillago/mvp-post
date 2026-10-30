# Secciones de The MVP Post

Wireframe de referencia: [wireframes/periodico.html](wireframes/periodico.html) (abrir con `npm run dev` → `localhost:5173/docs/wireframes/periodico.html` para que carguen las imágenes). Referencias visuales: [inspiration/periodico/](inspiration/periodico/).

La app es un periódico neoyorquino de 2003. La **portada** es lo único constante (papel, tinta negra, un acento rosa). Cada sección es una puerta: al tocar su titular se pasa la página (View Transition con doblez de papel) y la sección ocupa toda la pantalla con su propia estética. Una **esquina doblada** arriba a la derecha vuelve siempre a la portada. Cada sección tiene ruta propia para que las notificaciones abran directo ahí.

Todas cubren: **vacío** (texto tierno que invita a crear), **cargando**, **error** y **sin conexión** (la app abre desde caché; los datos avisan que no hay red). Animaciones respetan `prefers-reduced-motion`.

| Ruta | Sección | Antes (MVP OS) | Tablas |
|---|---|---|---|
| `/` | Portada + La columna | Boot / Escritorio | `editions`, `activity` |
| `/y2k` | Estilo · Y2K | Paparazzi (álbum) | `collage_items` |
| `/alfombra-roja` | Sociedad · Alfombra roja | Paparazzi (cámara) | `photos`, `photo_likes` |
| `/vinilos` | Los vinilos de Big | CD Player | `songs` |
| `/cartelera` | Cartelera | Blockbuster | `watch_items`, `watch_ratings` |
| `/cartas` | Cartas al editor | MVP Messenger | `messages` |
| `/suscripcion` | Suscripción (ajustes) | Panel de control | `profiles`, `push_subscriptions` |

---

## 0. Llegada + login
- **Llegada:** el periódico atado con cinta rosa cae en la puerta; la barra de carga es una tira de papel saliendo de la rotativa; abajo "SMG Development®". Saltable con un toque tras la primera vez.
- **¿Quién lee hoy?:** dos credenciales de prensa con foto ("María Victoria — Lectora de honor", "Simón — El columnista"). Tocar una la voltea y pide contraseña. Nombres y fotos de las credenciales son assets estáticos (antes del login no se puede leer `profiles`).
- `supabase.auth.signInWithPassword`.

## 1. Portada + La columna
- Fecha real, "Edición n.º" = `editions.number` de la última publicada, cabecera gótica "The MVP Post".
- Historia principal: la columna (titular-pregunta, foto, primeras líneas, "Leer la columna →").
- "En esta edición": un teaser por sección con su propia estética y un sello **"Nuevo"** si hay actividad sin ver (`unseen_by_section()`).
- Más abajo: Cartas, ediciones anteriores, pie SMG Development®.
- **La columna** (lectura): el titular se teclea letra a letra, letra capital, cita destacada, foto con pie, y al final "Sigue en pág. N → <sección>" (`continues_to`).
- **Escribir una edición:** solo quien escribe (él) ve el editor; guarda borrador (`published_at` null) y publica. Publicar = notificación a ella.

## 2. Estilo · Y2K (collage editable)
- **Para fotos de la galería.** Lienzo libre que crece hacia abajo; ambos ven y editan el mismo collage (Realtime).
- **Agregar:** `+ Foto` (galería; se le quita el fondo en el teléfono, con opción de dejarlo), `★ Sticker` (catálogo estático en `public/stickers/`), `✂ Recorte` (pegar imagen copiada o subir PNG), `Aa` texto pop.
- **Editar:** arrastrar mueve; dos dedos escalan y giran; agarraderas en la pieza seleccionada.
- **Burbuja tipo iOS** al tocar una pieza (como la de Copiar/Pegar): `Al frente · Fijar · Duplicar · Eliminar · ▸` (página 2: `Atrás · Quitar fondo`). Flecha apuntando a la pieza; sale abajo o arriba según el espacio. Es un componente propio: el menú nativo de iOS no admite acciones personalizadas en la web, así que en el lienzo se desactiva el nativo (`-webkit-touch-callout: none; user-select: none`).
- **Fijar:** la pieza queda con un candado pequeño y no se mueve ni se borra (lo garantiza también la BD). Tocar el candado → burbuja con `Desfijar`.
- Posiciones relativas al ancho del lienzo (`x`, `width` en 0–1; `y` en anchos) para que se vea igual en ambos teléfonos. Guardar al soltar (no en cada frame).
- Fondo: leopardo + brillo, letreros de brillo gigantes, cuadros pop. Referencias: `y2k-swag-collage.webp`, `stickers.webp`.

## 3. Sociedad · Alfombra roja (cámara)
- **Para fotos tomadas en el momento** dentro de la PWA.
- Visor en vivo con `getUserMedia` (frontal/trasera) enmarcado por alas de ángel sobre el collage dark leopard; si la cámara no abre, fallback a `<input type="file" accept="image/*" capture="environment">`.
- Disparo: flash blanco de corte duro con destellos de diamante + sonido de obturador (tras gesto) → la foto sale revelándose como **polaroid** y cae arriba de "Recuerdos".
- Cada polaroid: texto escrito a mano (`caption`), quién la tomó, fecha, ♥ (`photo_likes`). Tocar = verla en grande y editar el texto (solo el autor).
- Compresión en cliente (máx. ~1600 px, JPEG ~0.82). Referencia: `glam-dark-leopard.webp`.

## 4. Los vinilos de Big (música)
- Penthouse de noche, classy: nogal, cuero, ámbar, sin brillo.
- Arriba: tocadiscos con el disco sonando (portada de la canción en la etiqueta), título, artista, dedicatoria escrita a pluma y "dedicada por X", reproductor discreto (embed oficial de Spotify/YouTube).
- Abajo: **"La pila de discos"**, una lista de fundas de vinilo apiladas; cada una con portada, título, artista y un **sello de lacre** de quién la dedicó (rosa = ella, dorado = él). Filtros Todas / De ella / De él. Tocar una funda la saca y la pone en el tocadiscos.
- Tocadiscos 3D (three.js, vista fija, tapa acrílica abierta) con la carátula en la etiqueta. **La aguja es play/pausa**: tocar el brazo o el botón «Bajar/Levantar la aguja» llama a `resume`/`pause` del `EmbedController` (Spotify iFrame API); el giro sigue a `playback_update`. YouTube recibe `playVideo`/`pauseVideo` por postMessage.
- **Dedicar canción:** buscar en Spotify (Edge Function `spotify-search`, Client Credentials, máx. 10 resultados) → elegir → dedicatoria → guardar. Respaldo: pegar link → oEmbed (`open.spotify.com/oembed`, `youtube.com/oembed`) para título y `cover_url`.

## 5. Cartelera (videoclub)
- Estantes de VHS (filas con tabla de madera); cada cinta muestra la portada en su ventana. Pestañas **Pendientes · Viendo · Vistas**.
- **Buscar:** Edge Function `movie-search` (TMDB `search/multi`, es-MX) → título, año, sinopsis, portada. Respaldo: agregar a mano como película o serie.
- **Burbuja** al tocar una cinta: portada, ficha, mover entre estantes, «Elegir esta para esta noche» (solo a quien le toca), temporada/capítulo, crítica propia (estrellas + comentario) y la del otro, quitar del estante (doble toque).
- **Turno:** gana lo más reciente entre el último **Ruletazo** (`watch_spins`: elige quien salió) y la última cinta empezada (elige quien **no** la eligió). Sin nada, empieza ella.
- **Ruletazo:** ruleta de 6 tajadas (ella rosa neón, él amarillo) que gira sola en el centro; respeta reduced motion.

## 6. Cartas al editor (chat)
- Cartas en papel; las de ella con lacre rosa, las de él en máquina de escribir. Realtime, paginación de 50 hacia atrás, "Visto".
- **¡Extra!** (antes zumbido): `messages.kind = 'nudge'` → titular "¡EXTRA! ¡EXTRA!" que sacude la pantalla + sonido. En iPhone no hay vibración. Límite: uno cada 10 s.

## 7. Suscripción (ajustes)
- Formulario de suscripción recortado del periódico: nombre, foto, sonidos, **notificaciones** (activar; silenciar por sección → `profiles.muted_sections`), cerrar sesión.
- Si la app no está instalada en iPhone, explicar cómo agregarla a la pantalla de inicio (Compartir → "Agregar a inicio"), porque sin eso no hay notificaciones.

---

## Notificaciones push
Cada cosa nueva genera una fila en `activity` (triggers) → Edge Function `notify` → Web Push al otro. Detalle en [data-model.md](data-model.md#notificaciones-push).

| Evento | Notificación |
|---|---|
| Edición publicada | "The MVP Post · nueva edición" — titular |
| Pieza nueva en el collage | "Estilo · Y2K" — X pegó algo nuevo (máx. 1 cada 10 min) |
| Foto tomada | "Alfombra roja" — X tomó una foto nueva |
| ♥ a tu foto | "A X le encantó tu foto" (máx. 1 cada 10 min) |
| Canción dedicada | "Los vinilos de Big" — X te dedicó "título" (sin título: "te dedicó una canción") |
| Carta | "Carta de X" — texto |
| ¡Extra! | "¡EXTRA! ¡EXTRA!" — X te está buscando |
| Película agregada / elegida / calificada | "Cartelera" — … |

El ícono de la app muestra el número de cosas sin ver (Badging API). Tocar la notificación abre la sección.

## Backlog v2+
- Bucket list ("Cosas por hacer en NY") con fotos cuando se cumple.
- Contador de días juntos y fechas especiales.
- Horóscopo del día en clave de amor en la portada.
- Frasco de citas al azar.
- Capacitor si algún día hace falta algo nativo que la PWA no da.
