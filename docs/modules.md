# Módulos de MVP OS

Cada módulo es una "aplicación" del escritorio: ícono en el escritorio, entrada en el menú Inicio y una ventana. En el celular la ventana ocupa la pantalla (con barra de título y botones minimizar/cerrar); en escritorio flota, se arrastra y se apila.

Todos los módulos deben cubrir: **vacío** (primer uso, con un texto tierno que invite a crear algo), **cargando**, **error** (en tono del sistema: diálogo tipo "Error" Y2K con salida clara) y **sin conexión** (el shell abre desde caché; los datos dicen que no hay red).

---

## 0. Boot + Login
- **Boot:** pantalla negra → logo **MVP OS** en script fino → barra de progreso de "bloques" animada (estilo arranque XP) → ~2–3 s, saltable con un toque tras la primera vez.
- **Bienvenida:** fondo del tema activo; a la izquierda/arriba el logo MVP OS y "Para empezar, haz clic en tu nombre"; las dos tarjetas de usuario con foto. Al tocar una se despliega el campo de contraseña. Al pie: "Apagar" (cierra/recarga) y **SMG Development®**.
- Sonido de inicio (opcional por usuario; iOS exige gesto antes de reproducir audio → se reproduce al tocar el usuario).
- Tras login: animación "Bienvenido/a" → escritorio.
- Datos: `supabase.auth.signInWithPassword`. Las tarjetas de usuario son públicas en la UI pero sin datos de la BD (antes del login no se puede leer `profiles`): nombres y fotos de las tarjetas viven en `src/os/login/users.ts` como assets estáticos.

## 1. Escritorio / Shell
- Wallpaper del tema, íconos con etiqueta (grilla en celular, columna izquierda en escritorio), barra de tareas inferior: botón **Inicio** (logo MVP), ventanas abiertas, bandeja (sonido, "now playing", notificación de mensajes, reloj).
- Menú Inicio: avatar + nombre, apps, Panel de control, Cerrar sesión ("Apagar").
- Notificaciones del sistema estilo globito de la bandeja ("Tienes (1) mensaje nuevo").
- Window manager (Zustand): `open(appId)`, `close`, `minimize`, `focus`, z-order; en móvil solo una ventana visible a la vez.

## 2. Paparazzi (Fotos + Flash)
- Vistas: **Álbum** (grilla de polaroids con fecha digital estilo cámara 2003 — `'03 10 23`) y **Detalle** (foto grande, pie, corazones de ambos, autor).
- **Tomar foto:** botón grande de cámara → `<input type="file" accept="image/*" capture="environment">` (funciona en iPhone). Al volver: destello blanco de flash + sonido de obturador + ráfaga de "flashes de paparazzi" alrededor; previsualización con marco; pie de foto opcional; subir.
- Subir desde galería: mismo input sin `capture`, permite varias.
- Compresión en cliente antes de subir (máx. ~1600 px, JPEG 0.82) para no gastar Storage gratis (1 GB).
- Datos: `photos`, `photo_likes`, bucket `photos/<uid>/`.

## 3. MVP Messenger
- Ventana estilo MSN: cabecera con avatar y nick/estado del otro, historial, caja de texto, botones de emoticones y **Zumbido**.
- **Zumbido:** inserta `messages(kind='nudge')`. El receptor (si tiene la app abierta) ve la ventana temblar + sonido; en Android además `navigator.vibrate`. Límite: un zumbido cada 10 s.
- Emoticones Y2K propios (no los de MSN): set pequeño de PNG/SVG en `src/apps/messenger/emotes/`.
- Leído: al abrir la conversación se marca `read_at` en los mensajes del otro; "Visto" bajo el último.
- Notas: el chat es Realtime (`postgres_changes` sobre `messages`). Paginación de 50 en 50 hacia atrás.

## 4. CD Player (Música)
- Ventana estilo CD Player / Winamp con skin del tema: disco girando, "Pista 01 · título — artista", controles.
- Lista de canciones con quién la agregó y su **dedicatoria**.
- **Agregar:** pegar link de Spotify o YouTube → se detecta plataforma → título/artista (oEmbed: `https://open.spotify.com/oembed?url=` y `https://www.youtube.com/oembed?url=`; si falla, se escriben a mano) → dedicatoria → guardar.
- Reproducir: embed oficial de Spotify/YouTube dentro de la ventana. "Now playing" en la bandeja.
- Datos: `songs`.

## 5. Blockbuster (Series y Películas)
- Ventana estilo videoclub/Windows Media Player con tres pestañas: **Queremos ver** · **Viendo** · **Ya vimos**.
- Banner de **turno**: "Le toca elegir a ___ 🎬". Botón "Elegir esta" en items de *Queremos ver* → pasa a *Viendo* con `picked_by` = quien elige y el turno pasa al otro.
- Series en *Viendo*: temporada/episodio con +/−.
- Al marcar *Ya vimos*: cada uno califica 1–5 (estrellas/corazones) y comentario corto.
- Pósters: búsqueda opcional en TMDB (`VITE_TMDB_API_KEY`); sin key, se agrega solo con título.
- Datos: `watch_items`, `watch_ratings`.

## 6. Panel de control
- Tema: **Bliss Rosa · Manhattan 2003 · Leopardo & Lirios** (vista previa en miniatura, como "Propiedades de pantalla").
- Mi perfil: nombre, nick/estado, foto (sube a `avatars/<uid>/`).
- Sonidos on/off. Notificaciones: activar Web Push (en iPhone solo si la PWA está instalada; si no, explicar cómo instalarla).
- Datos: `profiles`, `push_subscriptions`.

---

## Backlog v2+
- **Metas / bucket list** ("Things to do in NY" de pareja), con checks y fotos de cuando se cumple.
- Contador de días juntos y próximas fechas especiales.
- Post-its en el escritorio que el otro ve.
- **Paint** compartido para dibujarse cosas.
- **Carrie's Column**: diario/columna ("I couldn't help but wonder…").
- Frasco de citas al azar.
- Tamagotchi de pareja.
- Horóscopo del día.
- Empaquetar con Capacitor si se necesita algo nativo que la PWA no da.
