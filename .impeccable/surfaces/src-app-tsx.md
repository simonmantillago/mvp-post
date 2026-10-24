---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# The MVP Post — superficie principal (app completa)

**Modo:** Experience (ella está dentro del regalo; el periódico es la obra). Las pantallas de tarea (collage, cámara, cartas, cartelera) heredan este mundo y se comportan como Operate dentro de él.

**Audiencia y tarea:** María Victoria en su iPhone, PWA instalada, ratos sueltos. Lee la columna, entra a cada sección, comparte. Simón escribe ediciones.

**Restricciones:** wireframe aprobado `docs/wireframes/periodico.html` (estructura y navegación fijas); paleta de portada fijada por el usuario (papel, tinta negra, un acento rosa); cada sección con su propio mundo; sin marcas reales; español; 390 px primero.

**Sin generación de imágenes** (llave OpenAI 401): build code-led; texturas procedurales o assets propios; fotos de ellos = placeholders marcados hasta que el usuario las entregue.

## Direction contract

THESIS: La columna vive donde vivía de verdad: abriendo la sección de Estilos del domingo de un diario neoyorquino. Rechaza la app de pareja con tarjetas y pestañas y también la primera plana genérica de periódico crema: esto es la sección de sociedad, impresa a dos tintas.

OWN-WORLD: Papel prensa gris claro frío (no crema) con trama de medio tono; tinta negra; rosa como segunda plancha de imprenta (solo donde hay trabajo: lo nuevo, la sección, la capitular), con leve fuera de registro. Cabecera gótica, titulares en gótica condensada de diario en mayúsculas, cuerpo en serif de periódico a dos columnas, pies de foto en itálica. Fotos en medio tono. Una retícula de 6 columnas para portada y franjas de sección. Estados como marcas impresas: nuevo = sello rosa, visto = negro, fijado = sello de goma.

STORY: Ella abre su periódico del domingo, lee la pregunta de la semana escrita para ella, y cada pliego que asoma abajo la invita a entrar a un mundo distinto; vuelve por la esquina doblada.

FIRST VIEWPORT: Franja de fecha y n.º de edición; cabecera «The MVP Post» gótica a todo el ancho; doble filete; banda rosa «ESTILOS · DOMINGO / LA COLUMNA»; titular-pregunta en gótica condensada de ~46 px sobre la foto a sangre en medio tono; firma; arranque del texto a dos columnas con capitular rosa; abajo, los pliegos negros de las secciones con sello «Nuevo». Acción principal: tocar el titular (leer la columna) o un pliego.

FORM: Estilos del domingo, posición 3 de mi lista ordenada (1 diario de gran formato, 2 portada de tabloide, 3 Estilos del domingo, 4 revista femenina satinada, 5 quiosco nocturno, 6 recortes en la nevera, 7 laptop de la columnista). seed:63a45cdf9d963fc6. Firma: pasar la página como un solo gesto de arrastre del doblez (View Transitions con fallback), cada sección con su mundo detrás del pliego. Subidas: una retícula para todo (muro suizo), lo nuevo cambia en su sitio (tablero de paletas), un gesto continuo (capa de cordón), marcas de estado impresas (escritorio 1 bit), firma de rastro quién/cuándo/edición (estante de horno).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Pendiente
- Fotos reales de ambos y contenido de la primera edición (usuario).
- Assets raster por sección (leopardo, alas, stickers) sin generador de imágenes: procedurales o del usuario.
