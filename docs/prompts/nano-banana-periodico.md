# Prompts para Nano Banana — "The MVP Post" (dirección periódico)

Reemplaza la dirección MVP OS / Windows XP. Wireframe de referencia: [docs/wireframes/periodico.html](../wireframes/periodico.html). Referencias visuales: [docs/inspiration/periodico/](../inspiration/periodico/) (Nano Banana puede quitar los logos que salen en ellas; si copia alguno, pide `remove all brand names and logos`).

## Cómo usarlos
1. En Nano Banana (Gemini), pega primero el **bloque base** y, en el mismo mensaje, el prompt de **una** pantalla. Una imagen por mensaje.
2. Si tienes, adjunta como referencia: una captura del wireframe de esa pantalla, y fotos de ustedes (para la portada, el collage y el glam).
3. Formato vertical **9:16**. Si sale horizontal: `vertical 9:16 portrait phone screen, edge to edge`.
4. Orden sugerido: primero **2 · Portada** (define el lenguaje); cuando te guste, adjúntala como referencia en todas las demás para que se sienta el mismo periódico.
5. Guarda las que te gusten en `docs/mockups/periodico/` (`00-llegada.png`, `01-login.png`, `02-portada.png`…).

Prompts en inglés porque el modelo los sigue mejor; los textos de la interfaz van en español, entre comillas. Ningún prompt nombra marcas reales (Sex and the City, Victoria's Secret, Kardashian, Blockbuster): se describe la estética, no la marca, para que no salgan logos.

### Si algo sale mal
- Texto ilegible o inventado: `keep only the quoted text, everything else as grey blurred body copy`.
- Parece un sitio web moderno: `make it feel like a printed 2003 New York newspaper photographed flat, real paper grain, real halftone photos`.
- Demasiado rosa en la portada: `pink only as one small accent, the page is black ink on off-white newsprint`.

---

## Bloque base (pegar siempre primero)

```
Design a screen of "The MVP Post", a private mobile web app made by a boyfriend for his girlfriend María Victoria. The whole app is a fictional New York newspaper from 2003: she reads it like the weekly relationship column of a glamorous Manhattan writer from early-2000s TV, typed on a laptop, with a big question as the headline. The front page is classic newspaper: off-white newsprint with subtle grain, black ink, a gothic blackletter masthead "The MVP Post", thin and double column rules, an elegant high-contrast serif for headlines, small caps kickers, halftone photos, and one single soft pink accent. Each section of the newspaper is a doorway: when opened, the screen becomes a full-bleed world with its own completely different aesthetic, but it keeps a small newspaper header strip (section name and page number) and a folded page corner in the top right that returns to the front page.

Format: a single vertical 9:16 iPhone screen, edge to edge, crisp readable text, no phone frame, no hands, no desk, no browser chrome. Mobile-first layout with generous touch targets. No real brand logos or real publication names. All interface text is in Spanish exactly as written in quotes; any other copy is blurred grey body text.
```

---

## 0. Llegada (pantalla de carga)

```
Screen: the loading screen. A dark New York brownstone doorstep at dawn, seen from above. A rolled newspaper wrapped in a thin pink satin ribbon has just landed on the doormat, with a small paper band that reads "Edición especial". Above it, a slim progress bar drawn as a strip of paper coming out of a printing press, half printed. At the very bottom, small and centered, in white: "SMG Development®". Calm, cinematic, slightly grainy film photo look.
```

## 1. ¿Quién lee hoy? (login)

```
Screen: the sign-in screen, styled as the newspaper's subscriber desk. Top: the blackletter masthead "The MVP Post" with a double rule under it, and the small caps line "Solo para suscriptores". Center: two vintage press credentials stacked vertically, each a laminated card with a clip at the top, a square photo, the name and a role: "María Victoria" — "Lectora de honor", and "Simón" — "El columnista". The first card is selected and slightly lifted with a soft shadow; under it a single underlined input "Contraseña" and a small black button "Entrar". Off-white newsprint background, black ink, one tiny pink detail on her card (a heart-shaped hole punch).
```

## 2. Portada (pantalla principal)

```
Screen: the front page, the heart of the app. Top dateline in small caps: "Sábado 24 de octubre de 2026 · Edición n.º 1". Blackletter masthead "The MVP Post", double rule. Below, the lead story is the column: kicker "LA COLUMNA", a large serif headline in quotes "¿Y si el amor fuera una suscripción de por vida?", a tall halftone portrait photo of a young woman (use the attached photo if any) beside the first lines of the column, and a small black button "Leer la columna →". Then a section titled "En esta edición" with a 2×2 grid of section teasers, each a small photo with a section name and page number, and each photo already hinting at its own world: "Estilo · Y2K — pág. 2" (a glittery cut-out photo collage on leopard), "Alfombra roja — pág. 3" (a dark leopard and gold collage with angel wings and a camera flash), "Los vinilos de Big — pág. 4" (a vinyl record on a turntable in warm amber light), "Cartelera — pág. 5" (a shelf of VHS tapes under neon). Elegant, editorial, newsprint grain, black ink with one soft pink accent.
```

## 3. La columna (lectura)

```
Screen: reading the column, a long-form newspaper article. Small header strip: "La columna · por Simón" and a folded page corner top right. A serif headline in quotes "¿Y si el amor fuera una suscripción de por vida?" with a blinking typewriter cursor at the end, as if it was just typed on a laptop. A large drop cap starts the text, single column of elegant body copy (blurred), one pull quote in large italic serif between thin rules, and a halftone photo of a couple with a small caption. At the bottom, a continuation line in small caps: "Sigue en la pág. 4 → Los vinilos de Big". Off-white newsprint, black ink, pink only on the cursor.
```

## 4. Estilo · Y2K (collage editable)
Adjunta: `docs/inspiration/periodico/y2k-swag-collage.webp` y `stickers.webp` (+ fotos de ustedes).

```
Screen: the "Estilo · Y2K" section, page 2, an interactive photo collage editor. Small newspaper header strip "pág. 2 · Estilo" and the folded corner; below it the world changes completely into a loud, playful late-2000s girly collage, like the attached reference: a sparkly leopard print canvas with glitter specks, a giant glittery mint-green and hot-pink word "XOXO" across the top, and many photos of a young couple with their backgrounds removed (cut out around their silhouettes) pasted overlapping at different sizes and angles, mixed with stickers from the attached sticker sheet (leopard star, red kiss, disco ball, chrome letter, 8-ball, martini, license plate) and small pop-art text blocks "YOLO YOLO". Some pieces have a tiny gold padlock badge in their corner, meaning they are locked in place. One freshly added photo is selected: a thin pink outline with square corner handles and a round rotate handle on top, and a small floating black pill toolbar under it with icons for rotate, resize, bring to front, lock and delete. Bottom bar with four glossy buttons: "+ Foto", "★ Sticker", "✂ Recorte", "Aa". Chaotic and fun, but the editing controls are clean and readable. No real brand logos.
```

## 5. Sociedad · Alfombra roja (cámara + polaroids)
Adjunta: `docs/inspiration/periodico/glam-dark-leopard.webp` y `stickers.webp`.

```
Screen: the "Sociedad · Alfombra roja" section, page 3, an in-app camera. Small header strip "pág. 3 · Sociedad" and the folded corner in gold on black. Top half: a dark, luxurious leopard collage background, like the attached reference, with cut-out gold jewelry, a crystal chandelier, rhinestone heels, pearls spilling from a martini glass, glossy lips, a leopard 8-ball, diamond sparkles. The title "Alfombra roja" spelled in rhinestones and diamonds. Huge white feathered angel wings like a lingerie runway show frame a live camera viewfinder in the center (a brunette woman in a black dress), with a small flip-camera icon. Under it a round gold shutter button labeled "Flash". Bottom half, titled "Recuerdos": a row of real instant-film polaroid photos slightly crooked on the leopard, each with a handwritten caption on the white bottom strip ("nuestra 1.ª cena", "ese vestido…") and a tiny line with who took it and the date ("ella · 12 oct", "él · 18 oct ♥"); the newest polaroid is still developing (pale, half revealed) with the placeholder "+ escribe algo". Dark feminine, glamorous, gold, black and leopard, high gloss. No real brand names or logos.
```

## 6. Los vinilos de Big (música)

```
Screen: the music section "Los vinilos de Big", page 4. Small header strip "pág. 4 · Cultura" and the folded corner. The world is classy and quiet: an elegant Manhattan penthouse at night, dark walnut wood, cognac leather, warm amber lamp light, a crystal whisky glass, city lights through a tall window, soft film grain. Title in an elegant italic serif: "Los vinilos de Big". Top: a high-end turntable seen from above with the currently playing record spinning, its center label showing the song's cover art, the tonearm resting on it; under it the song title and artist, and a handwritten dedication in fountain pen "Esta me recuerda a ti…" — "dedicada por Simón", and a slim discreet player bar. Below, titled "La pila de discos", with three small filter chips "Todas", "De ella", "De él": a vertical LIST of vinyl record sleeves stacked one on top of the other like a pile of record boxes, each sleeve showing only its top edge band with a small cover art square, song title, artist, and a wax seal on the right marking who dedicated it (a rose-pink wax seal for her, a gold wax seal for him). The sleeve that is playing sticks out slightly to the right with a gold edge. Bottom: a thin understated button "+ Dedicar un vinilo". Sophisticated, intimate, no glitter, no neon.
```

## 7. Cartelera (videoclub)

```
Screen: the "Cartelera" section, page 5. Small header strip "pág. 5 · Cartelera" and the folded corner. The world is a cozy early-2000s video rental store at night: deep navy and warm yellow, a neon sign glow, a wooden shelf with VHS tape spines of movies (fictional titles), a small ticket stub that reads "Esta noche elige: María Victoria". Three tab chips: "Por ver", "Viendo", "Vistas". Below, a newspaper-style movie review card: poster placeholder, movie title, two star ratings "Ella ★★★★☆" and "Él ★★★☆☆", two lines of blurred review. Bottom button styled as a rental counter bell: "+ Agregar a la estantería". No real store logos.
```

## 8. Cartas al editor (chat)

```
Screen: the "Cartas al editor" section, page 6, a private chat between the two. Small header strip "pág. 6 · Correo" and the folded corner. Messages are short letters on cream stationery cards, hers aligned left with a tiny pink wax seal, his aligned right with a typewriter font. In the middle of the conversation, a bold black banner slams across the screen like a special edition headline: "¡EXTRA! ¡EXTRA! Simón te extraña" with motion lines, as the "buzz" notification. At the bottom, an input shaped like a letter "Escribe tu carta…" and a black button "¡Extra!". Romantic, inky, paper textures.
```

## 9. Suscripción (ajustes)

```
Screen: the "Suscripción" settings page, styled as a vintage newspaper subscription form clipped from the paper with a dotted cut line. Fields drawn as underlined form lines: "Nombre", "Foto de perfil", toggles drawn as checkboxes "Sonidos", "Notificaciones", and a "Cerrar sesión" button. A small stamp in the corner: "Suscripción de por vida". Off-white newsprint, black ink, one pink accent.
```
