# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript, instalada como PWA (`vite-plugin-pwa`, service worker propio para Web Push). Backend: Supabase (Auth, Postgres con RLS, Storage, Realtime, Edge Functions). Deploy gratuito en Netlify. Sin librerías de UI: toda la interfaz es propia. Capacitor queda como opción futura si se necesita algo nativo que la PWA no da.

## Users

Exactamente dos personas: MVP y su novio Simón (autor del regalo, firma como SMG Development). **Los dos usan iPhone**, con la PWA instalada en la pantalla de inicio. Contexto: ratos sueltos del día, en la cama, en la fila, viendo series juntos o a distancia. Estado de ánimo: cariñoso, juguetón, nostálgico, glamoroso.

## Product Purpose

Un regalo: **The MVP Post**, un periódico neoyorquino de 2003 hecho solo para ella. La portada es la columna que él le escribe (al estilo de la columnista de Manhattan de la TV de esos años) y cada sección del periódico es un mundo con su propia estética donde comparten cosas: un collage Y2K de sus fotos, una alfombra roja de fotos tomadas en el momento, los vinilos que se dedican, la cartelera de qué ver (con turnos) y cartas entre los dos. Éxito: que ella lo abra seguido por gusto, que sienta que fue hecho para ella, que las notificaciones la traigan de vuelta y que resuelva cosas reales de la pareja.

## Positioning

No es una app de pareja genérica: es *su* periódico. Lleva su nombre en la cabecera, sus gustos (Sex and the City, Y2K, dark leopard, glamour de pasarela, vinilos de Big) como secciones, y rituales que solo ellos tienen (la columna, el ¡Extra!, los turnos para elegir película, las dedicatorias).

## Operating Context

- Celular en vertical, PWA instalada (standalone) en iPhone. Escritorio es secundario: el periódico se centra como una página.
- Tiempo real entre los dos (cartas, collage, actividad) + notificaciones push de todo lo nuevo.
- Fotos de la galería (collage, con fondo quitado) y fotos tomadas en el momento con la cámara (alfombra roja).

## Capabilities and Constraints

- Solo dos cuentas; registro deshabilitado. Login con email + contraseña desde "¿Quién lee hoy?" (credenciales de prensa).
- v1: Llegada + login, Portada + La columna, Estilo · Y2K, Sociedad · Alfombra roja, Los vinilos de Big, Cartelera, Cartas al editor, Suscripción (ajustes). Spec en `docs/modules.md`.
- iOS: Web Push solo con la PWA instalada (iOS 16.4+); sin Vibration API (el ¡Extra! es visual + sonido); el audio solo suena tras un gesto.
- Sin archivos de audio subidos (solo links/embeds de Spotify y YouTube).
- Storage gratis de 1 GB: fotos comprimidas en el cliente.
- Plazo: 2–3 semanas desde el 2026-10-23. Idioma de la interfaz: español.

## Brand Commitments

- Nombre: **The MVP Post** (cabecera en letra gótica de periódico). Pie: **"SMG Development®"**.
- La portada es papel de periódico (gris claro frío, tinta negra, un solo acento rosa como segunda tinta); cada sección rompe con ella y tiene estética propia: Y2K (collage de recortes, brillo, leopardo, stickers), Alfombra roja (dark leopard, dorado, pedrería, alas de ángel, flash), Los vinilos de Big (penthouse classy: nogal, cuero, ámbar), Cartelera (videoclub de noche), Cartas (papel y máquina de escribir).
- Referencias del usuario: Sex and the City (la columna, Big y sus vinilos), Kardashians, Victoria's Secret, Y2K/2010 swag, dark leopard. Imágenes en `docs/inspiration/periodico/`.
- No usar logos ni marcas reales (Sex and the City, Victoria's Secret, Chanel, Blockbuster, Spotify como marca, etc.): todo propio e "inspirado en". "Big" se usa solo como guiño en el nombre de la sección.

## Evidence on Hand

- Wireframe aprobado por el usuario: `docs/wireframes/periodico.html`.
- Referencias visuales: `docs/inspiration/periodico/` (collage Y2K, collage dark leopard, hoja de stickers).
- La dirección anterior (MVP OS) está archivada en `docs/archivo-mvp-os/` y no es referencia.
- Pendiente del usuario: fotos de perfil de ambos, fotos reales para contenido inicial. No inventar fotos de ellos; usar placeholders marcados hasta tenerlas.

## Product Principles

1. Hecho para ella: cada detalle debe sentirse personal, no plantilla.
2. Leer es la experiencia: navegar el periódico (pasar páginas, la columna que lleva a las secciones) es parte del regalo, no un menú.
3. Cada sección es un mundo: cambiar de estética al entrar es la sorpresa.
4. Útil de verdad: qué ver, compartir momentos, hablar, dedicarse música.
5. Celular primero: en iPhone instalado debe sentirse como una app nativa (gestos, burbujas tipo iOS, notificaciones).
6. Privado: solo ellos dos ven el contenido.
