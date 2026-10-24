---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface brief: MVP OS shell (boot, bienvenida, escritorio)

Mode: Experience. Mobile-first portrait (iPhone instalado como PWA); en escritorio, XP con ventanas flotantes.
Audience: María Victoria y su novio; ritual diario cariñoso y juguetón. La primera pantalla es un regalo: debe sentirse hecha para ella.
Content: logo "MVP OS" (script fino), "Para empezar, toca tu nombre", dos tarjetas de usuario con foto, contraseña, "Apagar", "SMG Development®".
Unresolved: nombre del usuario (provisional "Simón"), fotos de perfil reales, script exacto del logo (familias candidatas a medir en build), assets raster de wallpapers y charms.

## Direction contract

THESIS: Su XP, enchapado en pedrería como un Razr de 2003: el sistema operativo es un objeto personalizado a mano, con brillantes en bordes y botones y charms colgando de lo que se toca. Rechaza la app de pareja de tarjetas suaves y pestañas abajo.

OWN-WORLD: Estructura XP fija (ventanas con barra de título, barra de tareas, Inicio, bandeja). Por tema cambian wallpaper, metal de la pedrería y chrome: Bliss Rosa (default: colina tipo Bliss en atardecer rosa-lila, chrome rosa chicle/rubor con bisel plata, acentos morado gel-pen, texto casi negro), Manhattan 2003 (skyline nocturno, negro + rosa + dorado, cristal), Leopardo & Lirios (collage leopardo/lirios vino, chrome vino con bisel dorado, pedrería dorada). Script fino solo en el logo; sans de sistema tipo Tahoma en todo lo demás. Pedrería y charms solo en bordes, botones y tarjetas, nunca sobre texto. Estados como marcas, no colores (ticket perforado = visto, cinta doblada = dónde quedaron). Un set de tokens por tema reviste todo en bloque.

STORY: Ella abre la app, ve su nombre convertido en sistema operativo, toca su tarjeta y entra a un escritorio que es suyo; entiende al instante que cada ícono es algo para hacer juntos (fotos, mensajes, música, qué ver) y vuelve por gusto.

FIRST VIEWPORT (corregido por el usuario 2026-10-23; el boceto HTML de la ronda fue rechazado y NO es referencia): fidelidad máxima a Windows XP real, como las imágenes de docs/inspiration/xp-y2k/. Secuencia: (1) **Pantalla de carga**: fondo negro, al centro un símbolo propio estilo bandera de Windows (no el logo de Microsoft) con "MVP OS" en script fino, barra de progreso XP de bloques animados debajo, y abajo del todo "SMG Development®". (2) **Bienvenida XP**: banda superior e inferior azul/rosa con línea divisoria, a la izquierda el texto de bienvenida "Para empezar, toca tu nombre" (sin logo MVP OS aquí), a la derecha la lista de usuarios con foto; al elegir, campo de contraseña y flecha verde; abajo "Apagar". (3) **Escritorio XP**: wallpaper que el usuario va a entregar (foto real), íconos con etiqueta, barra de tareas con botón Inicio, reloj. La pedrería y los charms se suman sobre ese XP fiel, sin reemplazar su estructura. **El rosa es sutil**: se conservan los colores originales de XP Luna (azul, verde Inicio); el rosa solo como acento en pocos detalles (selección, corazón en la bandeja, algunos íconos) y la pedrería/charms como guiños discretos. A primera vista debe leerse como un XP real. Bocetos de referencia: los generará el usuario con Nano Banana (prompts en docs/prompts/nano-banana.md) y reemplazarán al boceto HTML.

FORM: Pedrería OS (bedazzled Razr/Sidekick 2003), candidato 6 de la lista propia ordenada; seed:a8959f599c850f18. Raises: estados como marcas (Mesa de corte); flash de Paparazzi como corte duro encendido/apagado (Cartel de cabaret); wallpaper según la hora real (Sección de luz); tokens por tema en bloque (Identidad generativa). Signature interaction: los charms cuelgan con física de péndulo y se mecen al tocar/arrastrar ventanas; zumbido sacude la ventana. Motion grammar: arranque en bloques estilo XP, transiciones cortas con rebote de plástico, cortes secos para el flash; todo respeta prefers-reduced-motion. Composición: el boceto de la ronda (.impeccable/mocks/decision/assigned.html) quedó rechazado. **La composición aprobada son los bocetos del usuario en docs/mockups/bliss/** (01-carga, 02-bienvenida, 03-escritorio, 04-messenger, 05-paparazzi, 06-blockbuster, 07-cdplayer); build code-led contra ellos. Los otros temas reutilizan la misma composición cambiando solo la piel (docs/mockups/manhattan/, docs/mockups/leopardo/ cuando existan). Al construir: la bienvenida lleva "MVP OS" en la banda superior (el usuario lo aceptó en su boceto); los logos de bandera de Windows en barras de título e Inicio se reemplazan por la bandera propia de MVP OS; textos inventados por la IA (títulos de VHS, horas del chat, canciones) son relleno, el contenido real sale de los datos.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
