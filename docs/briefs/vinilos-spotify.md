# Brief · Los vinilos de Big: buscar en Spotify, aguja que pausa y tocadiscos 3D

Para una sesión nueva. Leer antes `CLAUDE.md`, `docs/ESTADO.md`, `DESIGN.md` y la sección actual en `src/sections/vinilos/` (`Vinyls.tsx`, `Vinyls.css`, `music.ts`). Todo el trabajo de UI va con `/impeccable` y respeta el mundo «penthouse classy» (nogal, cuero, ámbar, Gloock, sin brillo).

## Qué quiere Simón
1. **Buscar la canción ahí mismo**, sin pegar links. Spotify primero: los dos tienen Spotify.
2. Cambiar «Dedicar un vinilo» por **«Dedicar canción»**.
3. **La carátula en el centro del disco** mientras gira. Esto ya existe: `.record-label` usa `cover_url`. Solo verificar que se vea con canciones buscadas.
4. **Aguja = play/pausa**: al levantar el brazo, la canción se pausa; al bajarlo, sigue.
5. **Tocadiscos más realista, en 3D**, en lugar del dibujo plano actual.

Mockup de referencia (widget `vinilos_spotify_tocadiscos_mockup`, conversación del 2026-10-24):
- tocadiscos en perspectiva sobre plinto de nogal;
- disco con la carátula en la etiqueta;
- brazo que se toca para bajar o subir la aguja;
- tarjeta «Sonando» con la carátula, el título y quién la dedicó;
- buscador con resultados (carátula, título, artista), dedicatoria a mano y botón ámbar «Dedicar canción».

## Cómo funciona hoy
- Al dedicar se pega un link (Spotify, YouTube u otro). `music.ts` detecta la plataforma y pide título y carátula por oEmbed (`lookup`). La canción suena en un `<iframe>` embebido (`embedUrl`).
- Tabla `songs` (migración 0001): `url`, `platform`, `title`, `artist`, `dedication`, `cover_url`, `author_id`. El trigger `songs_activity` notifica con push.

## Investigación (octubre de 2026)

### Búsqueda — Spotify Web API `GET /v1/search?type=track`
- Requiere token. Para buscar no hace falta que ellos inicien sesión: alcanza el flujo **Client Credentials**. Pero usa el *client secret*, así que va **en el servidor**: una Edge Function de Supabase (`spotify-search`), igual que `notify`. Nunca en el cliente.
- Cambios de Development Mode de **febrero de 2026**:
  - la persona dueña de la app necesita **Spotify Premium** (si vence, la app deja de funcionar);
  - máximo 5 usuarios por app (no aplica a Client Credentials, que no tiene usuarios);
  - el `limit` de búsqueda baja de 50 a **10** (por defecto 5): para más resultados hay que paginar con `offset`;
  - se quitan `popularity`, `available_markets` y `linked_from` del track.
- La guía no aclara si Client Credentials + search cambió. **Verificar en el primer paso** con una llamada real.
- Se guarda lo mismo que hoy: `url` = `https://open.spotify.com/track/{id}`, `title`, `artist`, `cover_url` (`album.images[0]`). Con eso el resto de la sección no cambia. Opcional: columna `spotify_uri` (migración nueva).

### Reproducción y aguja — Spotify iFrame API (embed)
- `EmbedController` tiene `loadUri`/`loadEntity`, `play`, `pause`, `resume`, `togglePlay` y el evento `playback_update` (`isPaused`, `position`, `duration`). Sirve para atar la aguja: bajar = `resume()`, subir = `pause()`, y sincronizar el giro con `isPaused`.
- **Límite importante en el iPhone:** Spotify dice que la reproducción completa en embeds solo está en **web de escritorio con sesión iniciada**; en móvil, lo esperado es la **vista previa de 30 s**. Hay reportes de que en Safari también queda en vista previa, y de que `play()` llamado por API arranca la vista previa. La canción entera en el iPhone se abre en la app de Spotify (botón «Abrir en Spotify», que ya existe).
- **Web Playback SDK** (reproductor propio): exige Premium y en iOS la reproducción no arranca de forma confiable. **Descartado** para el iPhone.
- Safari bloquea el autoplay sin gesto: tocar el brazo cuenta como gesto, pero el iframe es de otro origen. **Probar en el iPhone instalado que `resume()` responde al toque de la aguja** antes de construir encima.

### Tocadiscos 3D — opciones
- **A. 2.5D con capas raster (recomendada para empezar).**
  - Un render del tocadiscos en perspectiva de tres cuartos (plinto de nogal, plato, brazo) como imagen.
  - El disco es una capa aparte que gira con `transform` en perspectiva; el brazo, otra capa que pivota.
  - Es liviano, encaja con la regla del proyecto («texturas e ilustraciones son raster») y se ve realista si el render es bueno.
  - Los assets se generan (generador de imágenes de Impeccable, con costo en la llave de OpenAI) o los entrega Simón.
- **B. 3D real con three.js** y un modelo GLTF con licencia libre (CC0 o CC-BY, por ejemplo Poly Pizza o Sketchfab).
  - Inclinación con el dedo, brazo con raycast, luz real.
  - Suma unos 150 KB comprimidos y más trabajo; hay que cuidar la batería y los fps en el iPhone, y respetar `prefers-reduced-motion`.
  - No es una librería de UI, así que no choca con la regla «sin librerías de UI», pero es la dependencia más pesada de la app.
- **Prototipo de B ya hecho** (widget `vinilos_tocadiscos_3d_threejs`, misma conversación): modelo **procedural en three.js r128**, sin archivos externos.
  - Plinto de nogal (textura en canvas), plato de aluminio y vinilo con surcos, pistas y la carátula en la etiqueta (`MeshPhysicalMaterial` con clearcoat).
  - Brazo con contrapeso, cápsula y aguja en dos grupos (giro y elevación). Tocar el brazo baja o levanta la aguja; el disco acelera y frena con inercia.
  - Piloto ámbar, sombras suaves, reflejos con un entorno PMREM y arrastre para girar el tocadiscos. Con `prefers-reduced-motion` el disco no gira.
  - Es el punto de partida: pasarlo a un módulo `src/sections/vinilos/turntable3d.ts`, con la carátula de `cover_url` como textura de la etiqueta y la aguja conectada al `EmbedController`.
- **Versión aprobada por Simón**: código completo en **[tocadiscos-3d.html](tocadiscos-3d.html)**. Se abre con `npm run dev` en `localhost:5173/docs/briefs/tocadiscos-3d.html`.
  - **Vista desde arriba y al frente** (la del primer diseño), con cámara fija. Entra completo en 360 px de ancho, tapa incluida.
  - **Nogal oscuro** (base `#2a170c` con vetas), plinto con filete oscuro y patas.
  - Botón de arranque, selector y **piloto ámbar** que se enciende al sonar.
  - **Tapa acrílica abierta** con bisagras atrás, como en su foto de referencia: paneles transparentes (`MeshPhysicalMaterial`, opacidad 0.1, clearcoat, reflejos del entorno) y cantos con `EdgesGeometry` para que brillen.
  - **Sin girar el tocadiscos con el dedo** (Simón no lo necesita). La única interacción es **tocar el brazo para bajar o levantar la aguja**, más un botón accesible con el mismo efecto.
  - Se descartó una versión con parlante de tela y perilla al frente: Simón prefirió esta vista.
- **Modelar con un MCP** (Simón lo pidió si es posible): en el registro de conectores hay **Trimble SketchUp** (crea modelos; falta confirmar que exporte glTF/GLB para la web) y un visor demo de three.js (solo muestra). No hay conector de Blender en el registro: existe un servidor MCP comunitario para Blender, que corre en local y necesita Blender instalado. Para esta sección, el modelo procedural ya da el relieve, y un modelo externo solo valdría la pena para más detalle (tapa acrílica, perillas torneadas).
- **Decidido:** B procedural, con la versión de tapa acrílica. Se lazy-loadea three.js solo al entrar a Los vinilos de Big, con respaldo 2D si WebGL no está disponible.

## Plan sugerido
1. **Prueba técnica**:
   - crear la app en Spotify for Developers (Simón, con su cuenta Premium);
   - guardar `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` con `npx supabase secrets set`;
   - Edge Function `spotify-search` (requiere sesión de la pareja: validar el JWT y `is_member`, para no dejar un proxy abierto);
   - en el iPhone instalado, probar que el embed con `EmbedController` hace pausa y reanuda desde un toque de la página.
2. **Buscador** en el formulario de dedicar:
   - campo con espera de unos 300 ms entre teclas, 5–10 resultados con carátula, estados de cargando, vacío, error y sin conexión;
   - elegir un resultado llena título, artista y carátula; se mantiene «pegar link» como respaldo (YouTube u otros);
   - textos: «Dedicar canción» en el botón, el formulario y los estados.
3. **Aguja**: el brazo arrastrable o tocable controla el `EmbedController`; el giro del disco y la posición del brazo siguen `playback_update`.
4. **Tocadiscos** según A o B. La carátula queda en la etiqueta y el iframe del embed queda visible pero discreto, porque Spotify exige mostrar su reproductor.
5. Ajustar `notify` si cambia el texto del push («te dedicó una canción»). Actualizar DESIGN.md, ESTADO.md y el Roadmap.

## Verificación
- `?demo` (con resultados de búsqueda falsos en `src/lib/demo.ts`) a 390 y 1440 px: buscar, elegir, dedicar, aguja arriba/abajo, `prefers-reduced-motion`.
- En el iPhone instalado: búsqueda real, vista previa suena y pausa con la aguja, «Abrir en Spotify» abre la app.
- `npm run lint`, `npm run build`, `impeccable detect`.

## Fuentes
- [Guía de migración de Development Mode (feb. 2026)](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Spotify: actualización sobre acceso de desarrolladores (feb. 2026)](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security)
- [TechCrunch: Premium obligatorio y 5 usuarios en Development Mode](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)
- [Changelog de julio de 2026 (25 Client IDs por desarrollador)](https://developer.spotify.com/documentation/web-api/references/changes/july-2026)
- [Referencia de la iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api)
- [Comunidad: vista previa de 30 s en embeds móviles](https://community.spotify.com/t5/Spotify-for-Developers/Only-30s-preview-on-Android-WebView-embeds/td-p/5386262) · [en Safari](https://community.spotify.com/t5/Spotify-for-Developers/iFrame-shows-only-Preview-on-Safari/td-p/6166360) · [`play()` arranca la vista previa](https://community.spotify.com/t5/Spotify-for-Developers/Spotify-iframe-API-play-resume-starts-preview-playback-while/td-p/7430703)
- [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
