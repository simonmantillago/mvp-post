# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript, instalada como PWA (`vite-plugin-pwa`). Backend: Supabase (Auth, Postgres con RLS, Storage, Realtime). Deploy gratuito en Netlify. Ionic descartado a propósito: toda la UI es un "sistema operativo" propio y sus componentes no aportan. Capacitor queda como opción futura si se necesitan funciones nativas que la PWA no da.

## Users

Exactamente dos personas: MVP y su novio (autor del regalo, firma como SMG Development). La usan sobre todo desde el celular, con la PWA instalada en la pantalla de inicio; ella usa **iPhone**. Contexto: ratos sueltos del día, en la cama, en la fila, viendo series juntos o a distancia. Estado de ánimo: cariñoso, juguetón, nostálgico.

## Product Purpose

Un regalo: un espacio digital privado de la pareja con forma de sistema operativo Y2K ("MVP OS") donde cada módulo es una "aplicación" del escritorio. Sirve para compartir fotos, escribirse, dedicarse canciones y organizar qué series y películas ver (y de quién es el turno de elegir). Éxito: que ella lo abra seguido por gusto, que sienta que fue hecho para ella, y que resuelva cosas reales de la pareja (como la pelea de qué ver).

## Positioning

No es una app de pareja genérica: es *su* computador de los 2000 — lleva su nombre como sistema operativo, sus gustos (glamour Y2K, Sex and the City, Victoria's Secret, leopardo con lirios) como temas de escritorio, y rituales que solo ellos tienen (zumbidos, turnos para elegir serie, dedicatorias).

## Operating Context

- Uso principal: celular en vertical, PWA instalada (standalone). Secundario: navegador de escritorio, donde se comporta como un XP con ventanas flotantes.
- Interacción en tiempo real entre los dos (chat, zumbido, playlist).
- Fotos tomadas en el momento con la cámara del celular o subidas desde la galería.

## Capabilities and Constraints

- Solo dos cuentas; registro deshabilitado. Login con email + contraseña desde una pantalla de bienvenida estilo XP.
- v1: Boot + Login, Escritorio/Shell, Paparazzi (fotos + flash), MVP Messenger (chat + zumbido), CD Player (playlist con links de Spotify/YouTube + dedicatoria), Blockbuster (watchlist con turnos), Panel de control (temas, perfil, sonidos, notificaciones).
- iOS: Web Push solo funciona con la PWA instalada (iOS 16.4+); no existe Vibration API → el zumbido es visual + sonido en iPhone.
- Sin archivos de audio subidos (solo links/embeds).
- Plazo: 2–3 semanas desde el 2026-10-23.
- Idioma de la interfaz: español.

## Brand Commitments

- Nombre del sistema: **MVP OS** (por MVP), escrito en cursiva fina y delicada al estilo de la marca Victoria's Secret — nunca "XP".
- Pie de la pantalla de bienvenida: **"SMG Development®"**.
- Animaciones de arranque y bienvenida al estilo Windows.
- Tres temas de escritorio intercambiables: **Bliss Rosa**, **Manhattan 2003** (Sex and the City) y **Leopardo & Lirios** (su gusto personal).
- Referencias explícitas del usuario: Windows XP/98 Y2K, Sex and the City, Kardashians, Pamela Anderson, Victoria's Secret. Imágenes en `docs/inspiration/`.
- No usar logos ni marcas reales (Microsoft, Hello Kitty, Victoria's Secret, etc.): todo propio e "inspirado en".

## Evidence on Hand

- Referencias visuales: `docs/inspiration/xp-y2k/`, `docs/inspiration/manhattan/`, `docs/inspiration/leopardo-lirios/`.
- Pendiente del usuario: nombre/nick de su usuario, fotos de perfil de ambos, fotos reales para contenido inicial. No inventar fotos de ellos; usar placeholders marcados hasta tenerlas.

## Product Principles

1. Hecho para ella: cada detalle debe sentirse personal, no plantilla.
2. Jugar es la función: la nostalgia del escritorio Y2K es la experiencia, no decoración.
3. Útil de verdad: los módulos resuelven cosas reales de la pareja (qué ver, compartir momentos, hablar).
4. Celular primero, y que en iPhone instalado se sienta como una app.
5. Privado: solo ellos dos ven el contenido.
