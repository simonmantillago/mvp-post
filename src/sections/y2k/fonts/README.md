# kabisat-2000s.ttf

Procedencia: **Kabisat Demo Italic Tall**, entregada por Simón (2026-11-04) para usar en toda la sección 2000's Collage. Es la versión demo de la fuente (uso personal; este es un regalo privado).

La demo viene incompleta y se completó así:
- **á é í ó ú Á É Í Ó Ú ñ Ñ ´**: compuestas con el acento de su propia «Ẃ» y su «˜», puestos justo sobre la altura de mayúsculas.
- **0–9**: la demo los trae vacíos; se usan los de **Orbitron Black** (SIL OFL 1.1, @fontsource/orbitron), escalados a la altura de Kabisat e inclinados 20°.

Scripts (fontTools): `acentos.py` y `digitos.py` están en `scripts/fonts/` (`python acentos.py original.ttf k1.ttf` y luego `python digitos.py k1.ttf orbitron-latin-900-normal.woff kabisat-2000s.ttf`; pide `pip install fonttools brotli`). El .ttf original lo tiene Simón.
