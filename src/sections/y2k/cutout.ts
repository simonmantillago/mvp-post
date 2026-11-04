// Recorte tipo sticker de WhatsApp: quita el fondo en el teléfono, recorta a la silueta y le pone el borde blanco.
// El modelo (@imgly/background-removal, ~40 MB) se descarga la primera vez y queda en la caché del navegador.

export type CutoutProgress = (label: string, pct?: number) => void

const MAX_SIDE = 1024

async function toCanvas(file: Blob, max = MAX_SIDE) {
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s)
  c.height = Math.round(bmp.height * s)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return c
}

/** Si la imagen ya viene sin fondo (p. ej. «Copiar sujeto» del iPhone), no hace falta pasarla por el modelo. */
function alreadyCut(c: HTMLCanvasElement) {
  const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
  let clear = 0
  for (let i = 3; i < data.length; i += 16) if (data[i] < 16) clear++
  return clear / (data.length / 16) > 0.08
}

async function removeBg(c: HTMLCanvasElement, progress: CutoutProgress) {
  const { removeBackground } = await import('@imgly/background-removal')
  const blob = await new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error('canvas'))), 'image/png'))
  progress('Despertando las tijeras…')
  let cutting = false
  const out = await removeBackground(blob, {
    model: 'isnet_quint8',
    output: { format: 'image/png' },
    progress: (key, current, total) => {
      if (key.startsWith('compute')) cutting = true
      if (cutting) progress('Recortando la silueta…')
      else if (key.startsWith('fetch') && total > 0) progress('Afilando las tijeras (solo la primera vez)…', Math.round((current / total) * 100))
    },
  })
  return toCanvas(out)
}

/** Recorta al contorno del sujeto, limpia el halo semitransparente y agrega el borde blanco grueso. */
function sticker(src: HTMLCanvasElement) {
  const ctx = src.getContext('2d')!
  const img = ctx.getImageData(0, 0, src.width, src.height)
  const d = img.data
  let x0 = src.width, y0 = src.height, x1 = -1, y1 = -1
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++) {
      const i = (y * src.width + x) * 4 + 3
      // el modelo deja bordes con alfa bajo: se aprietan para que el contorno quede nítido
      d[i] = d[i] < 40 ? 0 : d[i] > 200 ? 255 : Math.round(((d[i] - 40) / 160) * 255)
      if (d[i] > 0) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  if (x1 < 0) throw new Error('vacío')
  ctx.putImageData(img, 0, 0)

  const w = x1 - x0 + 1
  const h = y1 - y0 + 1
  const r = Math.max(6, Math.round(Math.max(w, h) * 0.028))
  const pad = r + 2
  const out = document.createElement('canvas')
  out.width = w + pad * 2
  out.height = h + pad * 2
  const o = out.getContext('2d')!

  // silueta en blanco
  const sil = document.createElement('canvas')
  sil.width = w
  sil.height = h
  const s = sil.getContext('2d')!
  s.drawImage(src, x0, y0, w, h, 0, 0, w, h)
  s.globalCompositeOperation = 'source-in'
  s.fillStyle = '#fff'
  s.fillRect(0, 0, w, h)

  // dilatar: la silueta repetida en anillos alrededor del centro
  for (const rr of [r, r * 0.66, r * 0.33])
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2
      o.drawImage(sil, pad + Math.cos(a) * rr, pad + Math.sin(a) * rr)
    }
  o.drawImage(src, x0, y0, w, h, pad, pad, w, h)
  return out
}

export async function makeCutout(file: Blob, progress: CutoutProgress): Promise<Blob> {
  let c = await toCanvas(file)
  if (!alreadyCut(c)) c = await removeBg(c, progress)
  progress('Pegando el sticker…')
  const out = sticker(c)
  return new Promise((ok, ko) => out.toBlob((b) => (b ? ok(b) : ko(new Error('canvas'))), 'image/webp', 0.86))
}
