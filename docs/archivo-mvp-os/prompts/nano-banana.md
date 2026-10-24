# Prompts para Nano Banana — bocetos de MVP OS

## Cómo usarlos
1. Abre Nano Banana (Gemini) y **adjunta** estas imágenes como referencia:
   - `docs/inspiration/xp-y2k/03-bliss-desktop-icons.webp` (la más importante: el XP fiel)
   - `docs/inspiration/xp-y2k/05-pink-paint-desktop.webp`
   - `docs/inspiration/xp-y2k/06-win98-photo-windows.webp`
   - `docs/inspiration/xp-y2k/02-just-wanna-go-back.webp`
   - `docs/inspiration/xp-y2k/01-dollhouse-y2k-web.webp` (solo para detalles rosados sutiles)
   - Tu foto de fondo, en la pantalla del escritorio.
2. Pega primero el **bloque base** y, en el mismo mensaje, el prompt de **una** pantalla. Una imagen por pantalla funciona mejor que todas juntas.
3. Pide formato vertical **9:16** (celular). Si sale horizontal, repite con "vertical 9:16 portrait phone screen".
4. Si alguna sale demasiado rosada, responde: `less pink, keep the original Windows XP blue, pink only as a tiny accent`.
5. Guarda las que te gusten en `docs/mockups/` con el número de pantalla (`01-carga.png`, `02-bienvenida.png`…) y me las pasas.

Los prompts van en inglés porque el modelo los sigue mejor. Los textos de la interfaz van en español, entre comillas.

---

## Bloque base (pegar siempre primero)

```
Use the attached images as the style reference: they show the real Windows XP and Windows 98 desktop look of 2001-2005 — Luna blue title bars with rounded tops, red X close buttons, minimize and maximize buttons, the green Start button, the taskbar with system tray and clock, pixel-sharp desktop icons with text labels, Tahoma font, the Bliss rolling-hill wallpaper. Reproduce that look as faithfully as possible, like a real screenshot of Windows XP, not a modern reinterpretation.

The product is "MVP OS", a private app styled as a Windows XP computer, made by a boyfriend for his girlfriend María Victoria. It keeps the original Windows XP Luna colors (blue title bars, green Start button, blue taskbar). The girly Y2K touch is SUBTLE: a soft pink accent only in a few details (a pink highlight on the selected item, a pink heart in the system tray, pink on a few icons), plus a very small number of tiny rhinestones and one or two small phone charms (heart, cherry) as discreet easter eggs. At first glance it must read as a real Windows XP; the pink is only noticed on a second look. Never recolor the whole interface pink.

Format: a single vertical 9:16 iPhone screen, edge to edge, crisp readable text, no phone frame, no hands, no desk, no browser window. Do not use the real Microsoft or Windows logo anywhere; use the custom MVP OS logo described below. All interface text is in Spanish exactly as written in quotes.
```

---

## 1. Pantalla de carga

```
Screen: the boot / loading screen, exactly like the Windows XP startup screen.
Solid black background. In the center: a custom logo shaped like a waving four-pane flag, like the Windows XP flag silhouette but the panes are in soft pearl, silver and blue tones with only one pane in soft rose, NOT the Microsoft logo. Next to or under it, the words "MVP OS" in a thin, delicate, flowing script typeface, white, like a Victoria's Secret logo. Below that, the classic XP loading bar: a rounded dark track with the classic three small blue blocks moving through it. At the very bottom of the screen, small and centered: "SMG Development®".
Nothing else on screen.
```

## 2. Bienvenida (elegir usuario)

```
Screen: the Windows XP Welcome / login screen ("To begin, click your user name"), faithfully reproduced in its original blue colors.
Layout like the real XP welcome: a darker band across the top and the bottom, the classic lighter blue field in the middle, a thin white glowing divider line. Because the screen is vertical, the welcome text sits in the upper part and the user list below it.
Upper part: the text "Para empezar, toca tu nombre" in white Tahoma. No logo here.
User list: two XP-style user entries, each with a square profile photo in a rounded white frame and the name beside it: "María Victoria" and "Simón". The first one is selected: highlighted, with a password field under the name labeled "Escribe tu contraseña" and the round green XP arrow button next to it. A tiny heart charm hangs from her photo frame.
Bottom band: on the left the round orange-red XP power button with the label "Apagar"; on the right a small note "Después de iniciar sesión, puedes agregar o cambiar cuentas."
```

## 3. Escritorio

```
Screen: the Windows XP desktop, faithfully reproduced, on a vertical phone screen.
Wallpaper: the attached photo, full screen. (If no photo is attached: the Bliss green hill under a blue sky with soft pink sunset clouds.)
Desktop icons in a left column, XP style, with white labels with dark text shadow: "Paparazzi" (a silver digital camera with a tiny pink heart), "MVP Messenger" (a buddy figure), "CD Player" (a glossy CD), "Blockbuster" (a VHS tape with popcorn), "Panel de control" (a control panel icon), "Papelera de reciclaje" (recycle bin).
Bottom: the original blue XP taskbar: on the left the rounded "Inicio" start button with the MVP OS gem flag logo, in the middle one open task "MVP Messenger", on the right the system tray with a volume icon, a small heart icon, and the clock "10:30 p. m.".
One small XP notification balloon above the tray: "Tienes (1) mensaje nuevo de Simón".
```

## 4. Ventana de Messenger (chat + zumbido)

```
Screen: the desktop from the previous image with one app window open and maximized to the phone screen: an MSN-Messenger-2005-style chat window, styled as a standard blue XP window with title bar "MVP Messenger" and minimize, maximize and red close buttons.
Inside: at the top the other person's display picture, name "Simón" and status line "pensando en ti 💭"; the conversation with a few messages in Spanish, for example "¿qué vemos hoy?" / "te toca elegir a ti 🙄" / "ok pero no otra de terror"; one line in the conversation reads "Simón te ha enviado un zumbido." in bold. At the bottom: the text input box, a row of small Y2K emoticon buttons, a "Zumbido" button with a shaking-bell icon, and an "Enviar" button.
Keep the XP taskbar visible at the bottom.
```

## 5. Ventana de Paparazzi (fotos + flash)

```
Screen: the desktop with one app window open and maximized: a photo album window like Windows XP "My Pictures" in thumbnail view, original XP colors, title bar "Paparazzi".
Toolbar: a big "Tomar foto" button with a camera icon and a "Subir" button. Content: a grid of photos displayed as polaroids with orange digital date stamps like a 2003 digital camera (for example "'25 10 23"), each with a small heart counter. One photo is open larger in front with a burst of white camera flash rays around it, like paparazzi flashes on a red carpet, and a caption field "Escribe un pie de foto".
Keep the XP taskbar visible at the bottom.
```

## 6. Ventana de Blockbuster (series y pelis)

```
Screen: the desktop with one app window open and maximized: styled like Windows Media Player 9 in its original silver and blue skin with a soft pink accent on the active tab, title bar "Blockbuster".
At the top a banner: "Le toca elegir a: María Victoria 🎬". Three tabs: "Queremos ver", "Viendo", "Ya vimos". The "Viendo" tab is active and shows a show card with a poster placeholder, the title "Sex and the City", "Temporada 3 · Episodio 7" with + and − buttons. Below, a list from "Queremos ver" shows rows that look like VHS rental tapes with titles, and in "Ya vimos" a watched item is marked with a punched ticket stub instead of a color.
Keep the XP taskbar visible at the bottom.
```

## 7. Ventana de CD Player (música)

```
Screen: the desktop with one app window open and maximized: a Windows-style CD Player / Winamp hybrid in classic silver and chrome with a small pink accent on the play button, title bar "CD Player".
At the top a spinning glossy CD and a display "Pista 02 · Vida digital — artista", play, pause, previous, next buttons and a volume slider. Below, a playlist numbered 01 to 06 with song titles, durations and a small avatar of who added each song; one song expanded shows its dedication in a speech bubble: "esta me recuerda a nuestro primer viaje 💗". A button "Agregar canción" at the bottom.
Keep the XP taskbar visible at the bottom.
```

---

## Variantes de tema (opcional)
Repite las pantallas 2 o 3 cambiando la frase de color del bloque base por una de estas:
- **Manhattan 2003:** "the XP chrome is black and pale pink with thin gold edges; wallpaper is the New York skyline at night with lit windows, Sex and the City mood."
- **Leopardo & Lirios:** "the XP chrome is deep wine red with antique gold bevels and gold rhinestones; wallpaper is a collage of leopard print with dark red and dusty-pink lilies, glossy cherries and red roses."
