# Compone á é í ó ú ñ (y mayúsculas) en Kabisat Demo, que no las trae, usando el acento de «Ẃ» y la «˜».
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

src, out = sys.argv[1], sys.argv[2]
f = TTFont(src)
gs = f.getGlyphSet(); glyf = f['glyf']; hmtx = f['hmtx']

def contours(name):
    rp = RecordingPen(); gs[name].draw(rp)
    cs, cur = [], []
    for op in rp.value:
        cur.append(op)
        if op[0] in ('closePath', 'endPath'): cs.append(cur); cur = []
    return cs

def bounds(ops):
    bp = BoundsPen(None)
    for op, args in ops: getattr(bp, op)(*args)
    return bp.bounds

def replay(ops, pen):
    for op, args in ops: getattr(pen, op)(*args)

wa = contours('Wacute')
acute = max(wa, key=lambda c: bounds(c)[1])           # el contorno más alto es el acento
wb = glyf['W']; wcx = (wb.xMin + wb.xMax) / 2
ab = bounds(acute); acx = (ab[0] + ab[2]) / 2
rel = acx - wcx                                       # cuánto se corre a la derecha por la itálica
tilde = contours('tilde')
tb = bounds([op for c in tilde for op in c]); tcx = (tb[0] + tb[2]) / 2

def compose(newname, base, mark, mb, mcx, dy):
    b = glyf[base]; target = (b.xMin + b.xMax) / 2 + rel
    pen = TTGlyphPen(None)
    for c in contours(base): replay(c, pen)
    tp = TransformPen(pen, (1, 0, 0, 1, target - mcx, dy))
    for c in mark: replay(c, tp)
    g = pen.glyph(); g.recalcBounds(glyf); glyf[newname] = g
    hmtx[newname] = (hmtx[base][0], glyf[newname].xMin)

order = f.getGlyphOrder()
pairs = {}
for low, up, cp_l, cp_u in [('a','A',0xE1,0xC1),('e','E',0xE9,0xC9),('i','I',0xED,0xCD),('o','O',0xF3,0xD3),('u','U',0xFA,0xDA)]:
    for base, cp in ((low, cp_l), (up, cp_u)):
        n = base + 'acute'; compose(n, base, [acute], ab, acx, 2491 + 140 - ab[1]); pairs[cp] = n
dy_t = 2491 + 140 - tb[1]
for base, cp in (('n', 0xF1), ('N', 0xD1)):
    n = base + 'tilde'; compose(n, base, tilde, tb, tcx, dy_t); pairs[cp] = n
# acento suelto
pen = TTGlyphPen(None)
replay(acute, TransformPen(pen, (1,0,0,1, -ab[0] + 100, 0)))
g = pen.glyph(); g.recalcBounds(glyf); glyf['acute'] = g; hmtx['acute'] = (int(ab[2]-ab[0]+200), 100); pairs[0xB4] = 'acute'

order = list(glyf.glyphOrder); f.setGlyphOrder(order)
for t in f['cmap'].tables:
    if t.isUnicode(): t.cmap.update(pairs)
f['maxp'].numGlyphs = len(order)
f.save(out)
print('ok', len(pairs))
