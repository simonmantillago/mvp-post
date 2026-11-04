# La demo de Kabisat trae los dígitos vacíos: se toman los de Orbitron Black (OFL), inclinados 20° y llevados a la altura de Kabisat.
import sys, math
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen

kab_path, orb_path, out = sys.argv[1:4]
k = TTFont(kab_path)
o = TTFont(orb_path)
ogs = o.getGlyphSet(); ocm = o.getBestCmap()
kglyf = k['glyf']; khmtx = k['hmtx']; kcm = k.getBestCmap()

CAP = 2491                      # altura de mayúsculas de Kabisat
SLANT = math.tan(math.radians(20))

def bounds(name):
    bp = BoundsPen(ogs); ogs[name].draw(bp); return bp.bounds

zb = bounds(ocm[ord('0')])
sy = CAP / (zb[3] - zb[1])
sx = 1800 / (zb[2] - zb[0])     # el «0» queda tan ancho como la «O» de Kabisat sin inclinar
for d in '0123456789':
    src = ocm[ord(d)]
    b = bounds(src)
    dx = -b[0] * sx + 128
    dy = -b[1] * sy
    pen = TTGlyphPen(None)
    # escala, luego inclina: x' = sx*x + SLANT*(sy*y)
    t = TransformPen(Cu2QuPen(pen, 1.0, reverse_direction=False), (sx, 0, SLANT * sy, sy, dx + SLANT * dy, dy))
    ogs[src].draw(t)
    g = pen.glyph(); g.recalcBounds(kglyf)
    name = kcm[ord(d)]
    kglyf[name] = g
    khmtx[name] = (int((b[2] - b[0]) * sx + 128 + 200), g.xMin)
k.save(out)
print('ok')
