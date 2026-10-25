---
name: The MVP Post
description: Un periódico neoyorquino del domingo hecho para una sola lectora; la portada a dos tintas y cada sección, un mundo propio.
colors:
  paper: "#e2e4e5"
  paper-shade: "#d3d6d8"
  ink: "#141414"
  ink-soft: "#4a4945"
  spot: "#c2255c"
  spot-text: "#b01f53"
  on-spot: "#ffffff"
  halftone: "rgba(20, 20, 20, 0.07)"
  y2k-ground: "#f4c9dc"
  y2k-surface: "#ffffff"
  y2k-text: "#1a1a1a"
  y2k-text-soft: "#3a2a33"
  y2k-accent: "#ff3ea5"
  y2k-accent-text: "#b0126a"
  y2k-mint: "#3ddc97"
  y2k-chrome: "#d9dde3"
  alfombra-ground: "#0b0a09"
  alfombra-surface: "#17140f"
  alfombra-text: "#f3eee4"
  alfombra-text-soft: "#c9bfae"
  alfombra-gold: "#c9a24a"
  alfombra-gold-text: "#d9b65c"
  alfombra-wine: "#6b1424"
  alfombra-polaroid: "#f6f3ec"
  vinilos-ground: "#1f1610"
  vinilos-surface: "#2a1d15"
  vinilos-leather: "#4a2f22"
  vinilos-text: "#efe4d2"
  vinilos-text-soft: "#c7b49a"
  vinilos-amber: "#e8a64b"
  vinilos-rule: "#5a4030"
  vinilos-seal-him: "#b8963e"
  cartelera-ground: "#0f1630"
  cartelera-surface: "#18214a"
  cartelera-text: "#f4efe6"
  cartelera-text-soft: "#b9bdd6"
  cartelera-marquee: "#ffd23f"
  cartelera-neon: "#ff4f8b"
  cartelera-rule: "#2c3768"
  cartas-ground: "#dcd6ca"
  cartas-surface: "#f2ede2"
  cartas-text: "#1d1d1f"
  cartas-text-soft: "#4b4740"
  cartas-seal-him: "#8a6d2c"
typography:
  masthead:
    fontFamily: "UnifrakturCook, serif"
    fontSize: "clamp(2.9rem, 13.5vw, 4.6rem)"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "Antonio, sans-serif"
    fontSize: "clamp(2.5rem, 11.8vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Antonio, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1
  subtitle:
    fontFamily: "Antonio, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  body:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"onum\""
  column-body:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Antonio, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
  dedication:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "1.2rem"
    fontWeight: 400
    fontStyle: italic
    lineHeight: 1.5
  section-title:
    fontFamily: "var(--face-display)"
    fontSize: "clamp(2.4rem, 11vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 0.95
  display-y2k:
    fontFamily: "Bagel Fat One, sans-serif"
    fontWeight: 400
  display-alfombra:
    fontFamily: "Bodoni Moda, serif"
    fontWeight: 400
  display-vinilos:
    fontFamily: "Gloock, serif"
    fontWeight: 400
  display-cartelera:
    fontFamily: "Monoton, sans-serif"
    fontWeight: 400
  display-cartas:
    fontFamily: "Special Elite, Courier New, monospace"
    fontWeight: 400
rounded:
  hairline: "2px"
  pill: "999px"
  round: "50%"
spacing:
  s1: "0.25rem"
  s2: "0.5rem"
  s3: "0.75rem"
  s4: "1rem"
  s5: "1.5rem"
  s6: "2rem"
  s7: "3rem"
  gutter: "1rem"
  measure: "34rem"
  page: "40rem"
  touch: "2.75rem"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    height: "{spacing.touch}"
    padding: "0 1rem"
  button-spot:
    backgroundColor: "{colors.spot}"
    textColor: "{colors.on-spot}"
    height: "3rem"
    padding: "0 1rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "{spacing.touch}"
    padding: "0 1rem"
  section-button:
    backgroundColor: "var(--accent)"
    textColor: "var(--on-accent)"
    rounded: "{rounded.hairline}"
    height: "{spacing.touch}"
    padding: "0 1rem"
  section-button-ghost:
    backgroundColor: "transparent"
    textColor: "var(--text)"
    rounded: "{rounded.hairline}"
    height: "{spacing.touch}"
    padding: "0 1rem"
  field-underline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0.5rem 0"
  section-field:
    backgroundColor: "var(--surface)"
    textColor: "var(--text)"
    rounded: "{rounded.hairline}"
    height: "{spacing.touch}"
    padding: "0.5rem 0.75rem"
  stamp-new:
    backgroundColor: "{colors.spot}"
    textColor: "{colors.on-spot}"
    typography: "{typography.label}"
    padding: "0.1rem 0.5rem"
  chip:
    backgroundColor: "transparent"
    textColor: "var(--text-soft)"
    rounded: "{rounded.pill}"
    height: "2.25rem"
    padding: "0 0.75rem"
  chip-pressed:
    backgroundColor: "var(--accent)"
    textColor: "var(--on-accent)"
    rounded: "{rounded.pill}"
  section-flag:
    backgroundColor: "{colors.spot}"
    textColor: "{colors.on-spot}"
    padding: "0.25rem 0.75rem"
  pliego:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "1rem 0"
---

# Design System: The MVP Post

## Overview

**Creative North Star: "La sección de Estilos del domingo, impresa a dos tintas"**

The MVP Post es un periódico neoyorquino de 2003 hecho para una sola lectora. La portada, la columna, el login, la redacción y la suscripción son **papel prensa**: gris claro frío (no crema), trama de medio tono, tinta negra y una segunda plancha rosa que solo aparece donde hay trabajo (lo nuevo, la banda de sección, la capitular), con un leve fuera de registro. La tipografía es la de un diario: cabecera gótica, titulares en gótica condensada en mayúsculas, cuerpo en serif de periódico a dos columnas y pies de foto en itálica.

Cada sección rompe con el papel y es su propio mundo. Detrás del pliego viven cinco pieles (Y2K, Alfombra roja, Vinilos, Cartelera, Cartas) que redefinen **los mismos roles** (`--ground`, `--surface`, `--text`, `--text-soft`, `--accent`, `--accent-text`, `--on-accent`, `--rule`, `--focus`, `--face-display`) bajo `[data-section="…"]`. El cambio de mundo es la sorpresa; la estructura de lectura (folio, título de sección, esquina doblada para volver) es fija.

Los materiales son imprenta y objetos: medio tono, filetes dobles, sellos de goma, lacre, ticket perforado, polaroids, fundas de vinilo, lomos de VHS. Las texturas que no son tipografía son raster: leopardo rosa, marco de pedrería, anillo de gemas, nogal, cuero y grano de película se generan en canvas (`src/ui/leopard.ts`) y entran como variables CSS (`--leopard`, `--frame`, `--ring`, `--walnut`, `--leather-tex`, `--grain`); las alas de ángel y el fondo de Alfombra roja (leopardo oscuro con lirios vino) son imágenes del usuario en `public/sections/alfombra/`. Nunca se dibujan en CSS. Se rechaza explícitamente la app de pareja con tarjetas y pestañas y la primera plana genérica de periódico crema.

**Key Characteristics:**
- Papel prensa frío con trama de medio tono de 3 px; tinta negra; un solo acento rosa como segunda plancha.
- Una retícula de 6 columnas y una página de 40rem como máximo; 390 px primero.
- Estados como marcas impresas: nuevo = sello rosa, visto = negro, fijado = sello de goma, turno = ticket perforado.
- Cada sección redefine los roles de color y una cara display propia; los componentes solo leen roles.
- Pasar la página es un desdoblamiento desde el lomo (View Transitions), no un deslizamiento de app.

## Colors

Papel y tinta con una segunda plancha rosa en la portada; cada sección trae su propia paleta cerrada que reemplaza los roles, no los suma.

### Primary
- **Rosa Segunda Plancha** (spot): la única tinta de color del papel. Banda de la columna («CARRIE'S COLUMN»), sello «Nuevo», capitular, cinta del ejemplar en la llegada, botón «Publicar», filete bajo «Secciones», comillas del destacado, cursor del titular. Blanco encima (`on-spot`).
- **Rosa Texto** (spot-text): la misma tinta oscurecida para texto pequeño sobre papel (≥ 4,5:1): errores, notas, tinta del sello de goma.

### Neutral
- **Papel Prensa Frío** (paper): fondo de toda superficie de periódico, siempre con la trama `.newsprint`.
- **Papel Sombreado** (paper-shade): placas de carga, fondo de foto ausente, superficie secundaria.
- **Tinta** (ink): texto, filetes, el cuadernillo negro de pliegos, botones de tinta.
- **Tinta Corrida** (ink-soft): folios, fechas, pies de foto, etiquetas.
- **Trama** (halftone): el punto de 0,6 px del medio tono del papel.

### Mundos de sección
Cada mundo asigna sus valores a los roles genéricos:
- **Y2K** (collage chillón sobre leopardo rosa): suelo Rosa Chicle (y2k-ground), superficie blanca, acento Rosa Fucsia Burbuja (y2k-accent) con **texto negro encima** (y2k-text como `on-accent`), Menta (y2k-mint) y Cromo (y2k-chrome) para las píldoras de herramientas. El foco es negro, no rosa.
- **Alfombra roja** (dark leopard con lirios vino, dorado, pedrería): fondo fotográfico fijo en pantalla sobre suelo Negro Laca (alfombra-ground), acento Dorado Viejo (alfombra-gold) también como filete, Dorado Claro (alfombra-gold-text) para texto, Vino (alfombra-wine) para el corazón de «me gusta», Blanco Polaroid (alfombra-polaroid).
- **Los vinilos de Big** (penthouse de noche): Nogal Oscuro (vinilos-ground), Cuero (vinilos-leather), acento Ámbar de Lámpara (vinilos-amber), filete Tabaco (vinilos-rule). Lacres: rosa (spot) para ella, Latón (vinilos-seal-him) para él.
- **Cartelera** (videoclub de noche): Azul Medianoche (cartelera-ground), acento Amarillo Marquesina (cartelera-marquee), Neón Rosa (cartelera-neon) solo para la pestaña activa y el halo superior.
- **Cartas al editor** (papel de carta y máquina): Papel de Carta (cartas-ground) rayado cada 32 px, hoja Marfil (cartas-surface), acento rosa texto (spot-text), lacre Oro Viejo (cartas-seal-him) para él.

### Named Rules
**The Segunda Plancha Rule.** En el papel, el rosa solo marca trabajo: lo nuevo, la sección, la capitular, la acción de publicar. Si el rosa aparece en algo que no cambió ni invita a entrar, sobra.

**The Roles, Not Colors Rule.** Un componente lee `--accent`, `--text`, `--rule`…, nunca un hex. Un mundo nuevo se crea redefiniendo el bloque completo de roles bajo `[data-section]`, no sobrescribiendo componentes.

**The Cold Paper Rule.** El papel es gris frío (paper), nunca crema ni hueso. El crema es la primera plana genérica que este sistema rechaza.

## Typography

**Masthead:** UnifrakturCook 700 (serif)
**Headline / Label:** Antonio 500/700 (sans-serif)
**Body:** Libre Caslon Text 400, 400 italic, 700 (Georgia)
**Dedicatoria:** EB Garamond 400 italic (`--face-dedication`, solo en Los vinilos de Big), entre comillas latinas ámbar colgadas; más clásica y fina que la itálica de Caslon del resto de la sección. Los pies de polaroid van en Bodoni Moda itálica, la voz de Alfombra roja.
**Display por sección:** Bagel Fat One (Y2K), Bodoni Moda 400 + italic (Alfombra), Gloock (Vinilos), Monoton (Cartelera), Special Elite (Cartas y las cartas de él)

**Character:** Gótica de cabecera + gótica condensada de titular + serif de periódico: la voz de un diario de gran tirada. Las caras display de sección son la voz de cada mundo y aparecen también en la portada, en el nombre de cada pliego, como los logos de sección de un diario.

Todas las caras se sirven auto-alojadas (@fontsource, subconjunto latino: cubre á, é, ñ, ¿, ¡). El cuerpo usa cifras de estilo antiguo; contadores, pasos y turnos usan `lining-nums tabular-nums`.

### Hierarchy
- **Masthead** (700, clamp 2.9–4.6rem, 1): «The MVP Post» a todo el ancho, sin cortar línea. En folios se reduce a 1–1.25rem.
- **Headline** (700, clamp 2.5–3.6rem, 1.1, -0.01em, mayúsculas, `text-wrap: balance`): titular-pregunta de la columna, títulos de login, redacción y cupón.
- **Section title** (400, clamp 2.4–3.4rem, 0.95, en `--face-display`): el título de cada sección bajo su folio.
- **Title** (700, 1.6rem, 1, mayúsculas): nombres en credenciales, fichas de cinta, «Sigue leyendo».
- **Subtitle** (700, 1.15rem, 0.1em, mayúsculas): encabezados de bloque («Secciones», «Ediciones anteriores») siempre sobre un filete.
- **Body** (400, 1rem, 1.5): texto corrido. La columna sube a 1.0625rem/1.6 con medida de 34rem; los párrafos siguientes llevan sangría de 1.25em.
- **Caption** (italic 400, 0.875rem, 1.35): pies de foto, firmas, notas, errores, teasers.
- **Label** (500, 0.75rem, 0.08–0.14em, mayúsculas): folios, fechas, etiquetas de campo, firma «SMG Development®».

### Named Rules
**The Capitular Rule.** La columna y el arranque de portada abren con capitular en Antonio 700 a tinta rosa (3.1rem en portada, 4.4rem en la columna). Una por texto.

**The Voice of the World Rule.** Dentro de una sección, los títulos usan `--face-display`; los botones, etiquetas y fichas siguen en Antonio. El mundo cambia la voz del titular, no la de la interfaz.

## Layout

Una sola página de periódico: columna centrada de máximo 40rem, margen lateral `gutter` (1rem), relleno superior e inferior que suma `safe-area-inset-*`. La portada declara una retícula de 6 columnas; el arranque de texto va a 2 columnas con filete de columna al 25 % de tinta. El ritmo vertical usa la escala de múltiplos de 4 (s1–s7). Toda superficie tocable mide al menos 2.75rem.

Las fotos a sangre rompen el gutter (`margin: 0 calc(var(--gutter) * -1)`); el ¡Extra! también. Bajo la columna, «En esta edición» es una plana de artículos, uno por sección, cada uno compuesto distinto (ver Navigation).

A partir de 48rem el periódico se convierte en una página sobre la mesa: fondo de mesa gris y la página levantada con sombra larga. La esquina doblada queda fija arriba a la derecha y los folios reservan 3.5rem para no quedar debajo.

### Named Rules
**The One Page Rule.** No hay pestañas ni barra inferior: se navega por pliegos, titular y esquina doblada. Cada sección es una página entera, no un panel.

## Elevation & Depth

El papel es plano; la profundidad viene de objetos físicos puestos encima: credenciales laminadas, polaroids, cartas, piezas del collage, fundas apiladas y el periódico doblado de la llegada. Sus sombras son difusas, con desplazamiento vertical y spread negativo, como luz cenital sobre una mesa. Aparte va el **fuera de registro**: un desplazamiento duro y semitransparente de la tinta rosa, que es el efecto de imprenta del mundo y no una sombra.

### Shadow Vocabulary
- **Levantado** (`box-shadow: 0 10px 24px -12px rgba(0,0,0,0.45)`, token `--shadow-lift`): credenciales de prensa.
- **Página sobre la mesa** (`0 30px 60px -30px rgba(0,0,0,0.45), 0 0 0 1px rgba(20,20,20,0.08)`): la portada en escritorio.
- **Objeto en la mesa** (`0 6px 14px -8px rgba(0,0,0,0.35)` en cartas; `0 10px 18px -10px rgba(0,0,0,0.9)` en polaroids sobre fondo oscuro): hojas y fotos sueltas.
- **Recorte** (`filter: drop-shadow(0 6px 6px rgba(0,0,0,0.28))`): piezas del collage Y2K, que siguen su silueta.
- **Fuera de registro** (`-3px 2px 0 rgba(194,37,92,0.28)` y `translate: 2px -1px`): banda de sección, cinta de llegada. El sello «Nuevo» usa `-2px 1px 0` en tinta.

### Named Rules
**The Objects Lift, Paper Doesn't Rule.** Solo los objetos llevan sombra. El papel, los filetes y los bloques de texto nunca.

**The Misregistration Rule.** El desplazamiento duro solo existe en la segunda plancha (rosa) y en los sellos impresos, nunca de 3 px o más en tinta negra ni como estilo de tarjeta.

## Shapes

Casi todo es ortogonal: rectángulos de papel, filetes y bloques sin redondeo. El único radio del sistema (`hairline`, 2 px) suaviza botones y campos de sección y el anillo de foco. Las formas redondas pertenecen a objetos: el pill de las píldoras Y2K, los chips de filtro y el corazón de «me gusta» (`pill`), y el disparador, el disco, la manija de escala y el botón de cambiar cámara (`round`). Los objetos se inclinan (credenciales ±1.5°, cartas ±0.6°, sellos −4° a −12°, polaroids con `--tilt`), el papel nunca.

Filetes de imprenta: el doble filete 3 px + 1 px bajo la cabecera, `3px double` en folios de columna, login y redacción, filete simple de 1 px para separar listas. Siluetas propias: ticket con muescas de 0.6rem (máscara radial), cupón con borde discontinuo, lacre de borde irregular, sello de goma con doble filete y tinta irregular (máscara).

## Components

### Buttons
Rectangulares, en Antonio 700 en mayúsculas con 0.06–0.08em de tracking, mínimo 2.75rem de alto.
- **Tinta** (button-ink): fondo tinta, texto papel. Acción principal del papel («Entrar», «Leer»).
- **Segunda plancha** (button-spot): fondo rosa, solo para publicar una edición.
- **Contorno** (button-outline): filete de 1 px en tinta, fondo transparente («Guardar borrador», «Cerrar sesión»).
- **De sección** (section-button / section-button-ghost): fondo `--accent` y texto `--on-accent`, radio hairline; el ghost es un filete interior de 1 px en `--text-soft`.
- **Focus:** contorno de 2 px en `--focus` separado 3 px; deshabilitado al 45–50 % de opacidad.
- **Flecha:** los enlaces de pliego desplazan su flecha 4 px a la derecha al hover/focus (300 ms, `--ease-out`).

### Chips
- **Style:** pill con filete de 1 px en `--rule`, texto `--text-soft`, Libre Caslon 0.875rem, 2.25rem de alto.
- **State:** presionado = fondo y filete `--accent`, texto `--on-accent`. Las píldoras Y2K son cromadas (degradado blanco a `--chrome`, borde negro de 2 px) y pasan a rosa al activarse.

### Cards / Containers
No hay tarjetas genéricas; cada contenedor es un objeto del mundo: credencial laminada con pinza (se voltea en 3D, 560 ms), cupón recortado, carta con lacre, polaroid, funda de vinilo (se superponen −0.35rem), lomo de VHS. Los paneles de formulario de sección usan `--surface` sin radio y relleno s4.

### Inputs / Fields
- **Del papel** (field-underline): sin caja, solo filete inferior de 1–2 px en tinta; al enfocar el filete pasa a rosa y no hay contorno.
- **De sección** (section-field): caja de 1 px en `--text-soft`, fondo `--surface`, radio hairline; foco con contorno de 2 px en `--focus`.
- **Etiquetas:** Antonio 500 0.75rem en mayúsculas en tinta corrida. Los errores son itálica en `--accent-text` / spot-text.

### Navigation
- **Artículos de sección:** el índice de secciones es una plana de periódico en papel. Cada sección es un artículo con:
  - foto a color en marco blanco con filete de tinta (el único objeto que se levanta) y pie en itálica;
  - título en la cara display de su mundo (el artículo lleva `data-section`), en tinta;
  - bajada en Libre Caslon, «Pág. N» y el sello «Nuevo»;
  - botón de tinta «Ver sección →».

  La composición varía por artículo (`layout` en `src/sections/registry.ts`): `lead-left` (título a todo el ancho y foto flotando a la izquierda), `float-right` (foto a la derecha), `banner` (foto apaisada a todo el ancho y bajada a dos columnas con capitular) y `pair` (dos artículos lado a lado con filete de columna, uno con la foto arriba y otro abajo). Las fotos mantienen un tamaño parecido.
- **Esquina doblada:** botón fijo arriba a la derecha (3.5rem en reposo) que se pela con el arrastre hasta 12.5rem y deja ver la portada en papel prensa debajo. Es la única vuelta atrás.
- **Folio:** línea de etiqueta con la cabecera en miniatura sobre un filete en `--rule`, y debajo el título de sección.
- **Pestañas (Cartelera):** tres columnas, filete inferior de 3 px que pasa a `--neon` en la activa.

### Sello «Nuevo» y sello de goma
El sello «Nuevo» es un rectángulo rosa en Antonio 700 de 0.75rem con 0.14em de tracking, girado −4°, y cambia en su sitio sin mover la fila. El sello de goma (`RubberStamp`) marca estados («Fijado», «Visto»): doble filete de 3 px en `--stamp-ink`, fondo blanco al 55 %, girado −9°, con máscara de tinta irregular.

### Polaroid y carrete de efectos
Las fotos de Alfombra roja son polaroids (Blanco Polaroid, pie en Bodoni itálica) que se revelan con un efecto elegido por quien la tomó: Original, Grano, Vintage, Flash, Noir o Digicam 2003 (este último con la fecha estampada en naranja LCD). El efecto es CSS sobre la foto (`.fx-<id>`: filtro + una capa con `--grain` o los roles `--fx-*`); el archivo guardado no cambia. En la polaroid grande, la autora o el autor desliza un carrete de miniaturas (la misma foto con cada efecto) y toca una; la elegida lleva filete `--accent`. Una foto recién tomada no se sube de inmediato: se abre como polaroid con pie, carrete y las acciones Descartar / Publicar. Las polaroids propias se borran desde un botón en su esquina inferior, que pide un segundo toque («¿Borrar?», en vino).

Las alas de ángel son un raster con transparencia real; nunca se usa `mix-blend-mode` en elementos grandes (en iOS deja el negro opaco). Sobre la pedrería de las alas y la banda del marco hay destellos de diamante: dos rayos finísimos en cruz más dos diagonales tenues (raster) que se abren y se cierran en su sitio, sin desplazarse, en un ciclo de 3,6 s con retrasos distintos para que nunca brillen a la vez.

### Tocadiscos 3D y aguja
El tocadiscos de Los vinilos de Big es un modelo procedural en three.js (`src/sections/vinilos/turntable3d.ts`, chunk diferido de ~141 kB gzip que solo se baja en esa sección): vista fija casi frontal (`CAMERA`; `?camara` activa un modo temporal para girarlo y leer el punto de vista), plinto de nogal oscuro (`#2a170c` con vetas en canvas) con filete y patas, plato de aluminio, vinilo con surcos y clearcoat, tapa acrílica abierta con cantos que brillan, piloto ámbar y luz de lámpara cálida. La etiqueta del disco es la carátula de la canción (`cover_url`) recortada en círculo; sin carátula, ámbar a vino con el título en Gloock. El canvas mide `min(100%, 27rem)` con proporción 360/380 y entra con un fundido de 600 ms; se renderiza solo mientras algo se mueve. Sin WebGL queda el plato 2D de CSS (`.platter`).

La aguja es el play/pausa: tocar el brazo (zona de toque ampliada) o el botón redondo centrado bajo el tocadiscos (3.5rem, cuero con filete tabaco, ▶/❚❚ relleno en ámbar, canto ámbar mientras suena, sin texto; `aria-label` «Reproducir»/«Pausar» y el estado solo para lectores de pantalla) mueve el brazo, y el disco gira con inercia solo cuando el reproductor dice que suena. Con movimiento reducido el brazo salta a su sitio y el disco no gira.

### Buscador de canciones
El formulario «Dedicar canción» es un panel `--surface` con título en Gloock. El campo «Buscar en Spotify» espera 300 ms entre teclas; los resultados son fundas de cuero como las de la pila (carátula 3rem, título en Gloock, artista · álbum en itálica) con canto ámbar al pasar o tocar. La elegida queda como funda con filete ámbar y el enlace «Cambiar». Los estados (buscando, vacío, error, sin conexión) son notas en itálica `--text-soft`. Debajo, el enlace subrayado «¿No está? Pega el enlace de Spotify o YouTube» abre los campos manuales.

### Lacre
Sello de cera SVG (`WaxSeal`) con la inicial hundida en Bodoni italic. Rosa para ella y dorado viejo para él: firma quién escribió o dedicó en cartas y vinilos.

### Medio tono
`Halftone` pasa toda foto del papel a escala de grises (contraste 1.25) y le imprime encima una trama de 4 px en multiplicar. El pie va en itálica. Las fotos de las secciones (polaroids, collage) mantienen su color.

### Movimiento
- **Pasar la página:** la página nueva se desdobla desde el lomo derecho (clip-path, 520 ms, `--ease-out`) sobre la vieja, que se oscurece al 70 %. Al volver, desde el izquierdo.
- **Llegada:** el periódico cae girando hasta la puerta (900 ms), la cabecera entra con la tinta del rodillo (máscara, 1100 ms) y la tira de rotativa se alimenta (1700 ms).
- **Flash:** ráfaga de paparazzi: cinco flashes parciales desde puntos al azar sobre los clics del audio de prensa y, en el último, el flash completo que toma la foto: corte duro a blanco con destellos (380 ms, `steps(1)`) y luego se desvanece. Con movimiento reducido, un solo flash.
- **¡Extra!:** sacudida de 600 ms de la página de cartas.
- `prefers-reduced-motion` anula transiciones de página y reduce toda animación a 0,01 ms.

## Do's and Don'ts

### Do:
- **Do** lee siempre los roles (`--ground`, `--surface`, `--text`, `--accent`, `--on-accent`, `--rule`, `--focus`, `--face-display`) y crea cada mundo nuevo redefiniendo el bloque entero bajo `[data-section]`.
- **Do** pon el papel sobre la trama `.newsprint` (punto de 0,6 px cada 3 px) y las fotos del papel en medio tono.
- **Do** marca los estados con objetos impresos: sello rosa para nuevo, sello de goma para fijado, ticket perforado para el turno, lacre para la autoría.
- **Do** separa bloques con filetes de imprenta (doble 3 + 1 px bajo cabeceras, 1 px entre filas) en lugar de cajas.
- **Do** usa `spot-text`, no `spot`, para texto rosa menor de 18 px sobre papel.
- **Do** genera las texturas (leopardo, pedrería, nogal, cuero) como raster y pásalas por variable CSS; las fotos de la pareja son placeholders marcados hasta tenerlas.
- **Do** mantén cada objetivo táctil de 2.75rem como mínimo y respeta `safe-area-inset` arriba y abajo.

### Don't:
- **Don't** uses papel crema o hueso: el papel es gris frío (paper).
- **Don't** pongas rosa en el papel fuera de lo nuevo, la sección, la capitular o publicar.
- **Don't** construyas la UI con tarjetas redondeadas, pestañas inferiores o barras de app: se navega por pliegos y esquina doblada.
- **Don't** uses el desplazamiento duro (fuera de registro) en tinta negra ni como sombra de tarjeta; es exclusivo de la segunda plancha y de los sellos.
- **Don't** escribas hex en componentes; si un mundo necesita un color nuevo, añádelo como rol en su bloque de tokens.
- **Don't** uses logos ni marcas reales; todo es propio e «inspirado en».
- **Don't** pongas sombra al papel, a los filetes ni a los bloques de texto; solo los objetos se levantan.
