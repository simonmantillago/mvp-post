// Texturas raster generadas en canvas una vez por sesión (no son dibujos en CSS):
// piel de leopardo con rosetas de verdad y pedrería dorada.
// (El nogal y el cuero de Los vinilos de Big son archivos fijos en public/sections/vinilos/.)
const cache = new Map<string, string>()

function rng(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function memo(key: string, make: () => string) {
  const hit = cache.get(key)
  if (hit) return hit
  const url = make()
  cache.set(key, url)
  return url
}

type Palette = { base: string; mid: string; spot: string; core: string; fur: string }

/** Leopardo: pelo direccional + rosetas (anillo roto de 3–5 trazos con centro teñido) + motas sueltas. Encaja en mosaico. */
export function leopardTexture(p: Palette, size = 360, seed = 7) {
  return memo(`leo${JSON.stringify(p)}${size}${seed}`, () => {
    const rand = rng(seed)
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    g.fillStyle = p.base
    g.fillRect(0, 0, size, size)

    const wrap = (draw: (ox: number, oy: number) => void) => {
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) draw(ox, oy)
    }

    // Manchas de tono del pelaje
    for (let i = 0; i < 60; i++) {
      const x = rand() * size, y = rand() * size, r = 20 + rand() * 40
      wrap((ox, oy) => {
        const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
        grd.addColorStop(0, p.mid)
        grd.addColorStop(1, 'transparent')
        g.globalAlpha = 0.35
        g.fillStyle = grd
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
      })
    }
    g.globalAlpha = 1

    // Rosetas
    const rosettes = 30
    for (let i = 0; i < rosettes; i++) {
      const x = rand() * size, y = rand() * size
      const r = 11 + rand() * 7
      const squash = 0.75 + rand() * 0.3
      const tilt = rand() * Math.PI
      const segs = 3 + Math.floor(rand() * 3)
      const starts = Array.from({ length: segs }, (_, k) => (k / segs) * Math.PI * 2 + rand() * 0.5)
      const width = r * (0.32 + rand() * 0.12)
      wrap((ox, oy) => {
        g.save()
        g.translate(x + ox, y + oy)
        g.rotate(tilt)
        g.scale(1, squash)
        // centro teñido
        g.fillStyle = p.core
        g.beginPath()
        g.ellipse(0, 0, r * 0.8, r * 0.75, 0, 0, Math.PI * 2)
        g.fill()
        // anillo roto
        g.strokeStyle = p.spot
        g.lineCap = 'round'
        for (const a of starts) {
          g.lineWidth = width * (0.8 + rand() * 0.4)
          g.beginPath()
          g.arc(0, 0, r, a, a + (Math.PI * 2) / segs - 0.45 - rand() * 0.3)
          g.stroke()
        }
        g.restore()
      })
    }

    // Motas sueltas
    g.fillStyle = p.spot
    for (let i = 0; i < 70; i++) {
      const x = rand() * size, y = rand() * size, r = 2 + rand() * 4
      wrap((ox, oy) => {
        g.beginPath()
        g.ellipse(x + ox, y + oy, r, r * (0.6 + rand() * 0.4), rand() * Math.PI, 0, Math.PI * 2)
        g.fill()
      })
    }

    // Pelo: trazos cortos y finos en una dirección
    g.strokeStyle = p.fur
    g.lineWidth = 0.5
    for (let i = 0; i < 4200; i++) {
      const x = rand() * size, y = rand() * size, l = 1.5 + rand() * 2.5
      const a = 1.2 + (rand() - 0.5) * 0.6 // pelo que cae casi vertical, con variación
      g.globalAlpha = 0.08 + rand() * 0.12
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
      g.stroke()
    }
    g.globalAlpha = 1
    return c.toDataURL('image/png')
  })
}

export const darkLeopard: Palette = { base: '#3a2614', mid: '#6b4520', spot: '#0a0705', core: '#4f3015', fur: '#c89a5a' }
export const pinkLeopard: Palette = { base: '#f6c3d8', mid: '#ffe6f0', spot: '#1a1a1a', core: '#e79bbb', fur: '#ffffff' }

function gem(g: CanvasRenderingContext2D, x: number, y: number, r: number, rand: () => number) {
  // Brillante visto de frente: cuerpo claro, facetas en abanico con algo de dispersión de color,
  // tabla luminosa y un destello en la esquina superior izquierda (nunca centrado).
  const pt = (k: number, rr: number) => [x + Math.cos((k / 8) * Math.PI * 2 + Math.PI / 8) * rr, y + Math.sin((k / 8) * Math.PI * 2 + Math.PI / 8) * rr] as const
  const tones = ['#ffffff', '#cfd9e6', '#f4f8fd', '#b8c6d8', '#ffffff', '#f6dfe9', '#e9f2ff', '#c3cfdd']
  for (let k = 0; k < 8; k++) {
    const [ax, ay] = pt(k, r)
    const [bx, by] = pt(k + 1, r)
    g.fillStyle = tones[(k + Math.floor(rand() * 2)) % 8]
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(ax, ay)
    g.lineTo(bx, by)
    g.closePath()
    g.fill()
  }
  // tabla octogonal luminosa con aristas finas
  g.fillStyle = 'rgba(255,255,255,0.75)'
  g.strokeStyle = 'rgba(120,135,155,0.55)'
  g.lineWidth = 0.6
  g.beginPath()
  for (let k = 0; k < 8; k++) {
    const [tx, ty] = pt(k, r * 0.48)
    if (k === 0) g.moveTo(tx, ty)
    else g.lineTo(tx, ty)
  }
  g.closePath()
  g.fill()
  g.stroke()
  // destello de estrella en la esquina superior izquierda
  const gx = x - r * 0.42, gy = y - r * 0.42, len = r * (0.75 + rand() * 0.35)
  g.fillStyle = 'rgba(255,255,255,1)'
  g.beginPath()
  g.moveTo(gx - len, gy)
  g.lineTo(gx, gy - r * 0.09)
  g.lineTo(gx + len, gy)
  g.lineTo(gx, gy + r * 0.09)
  g.closePath()
  g.moveTo(gx, gy - len)
  g.lineTo(gx + r * 0.09, gy)
  g.lineTo(gx, gy + len)
  g.lineTo(gx - r * 0.09, gy)
  g.closePath()
  g.fill()
  // engaste dorado
  g.strokeStyle = '#8a6a24'
  g.lineWidth = 1.3
  g.beginPath()
  g.arc(x, y, r + 0.6, 0, Math.PI * 2)
  g.stroke()
}

function goldBand(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical: boolean) {
  const grd = vertical ? g.createLinearGradient(x, 0, x + w, 0) : g.createLinearGradient(0, y, 0, y + h)
  grd.addColorStop(0, '#6e5520')
  grd.addColorStop(0.2, '#f4dc94')
  grd.addColorStop(0.45, '#c9a24a')
  grd.addColorStop(0.7, '#fff1c2')
  grd.addColorStop(1, '#7a5c1e')
  g.fillStyle = grd
  g.fillRect(x, y, w, h)
}

/** Marco de pedrería para el visor: banda dorada con piedras engastadas. Se usa como border-image (9 porciones de 48px). */
export function rhinestoneFrame() {
  return memo('frame', () => {
    const rand = rng(3)
    const S = 240, B = 48
    const c = document.createElement('canvas')
    c.width = c.height = S
    const g = c.getContext('2d')!
    goldBand(g, 0, 0, S, B, false)
    goldBand(g, 0, S - B, S, B, false)
    goldBand(g, 0, 0, B, S, true)
    goldBand(g, S - B, 0, B, S, true)
    g.clearRect(B, B, S - 2 * B, S - 2 * B)
    // filete interior oscuro
    g.strokeStyle = '#3a2a0c'
    g.lineWidth = 2
    g.strokeRect(B - 1, B - 1, S - 2 * B + 2, S - 2 * B + 2)
    // Esquinas: una piedra mayor centrada en cada cuadro de 48px, para que el 9-slice encaje limpio.
    for (const [cx, cy] of [[B / 2, B / 2], [S - B / 2, B / 2], [B / 2, S - B / 2], [S - B / 2, S - B / 2]]) gem(g, cx, cy, 13, rand)
    // Lados: 6 piedras por tramo de 144px; el border-image "round" repite el tramo entero.
    const r = 9
    const step = (S - 2 * B) / 6
    for (let t = B + step / 2; t < S - B; t += step) {
      gem(g, t, B / 2, r, rand)
      gem(g, t, S - B / 2, r, rand)
      gem(g, B / 2, t, r, rand)
      gem(g, S - B / 2, t, r, rand)
    }
    return c.toDataURL('image/png')
  })
}

/** Anillo de pedrería para el disparador del flash. */
export function gemRing(size = 160) {
  return memo(`ring2${size}`, () => {
    const rand = rng(5)
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    const cx = size / 2, R = size / 2 - 8
    const n = 14
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2
      gem(g, cx + Math.cos(a) * R, cx + Math.sin(a) * R, 8.5, rand)
    }
    return c.toDataURL('image/png')
  })
}

/** Grano de película para los efectos de polaroid: ruido gris neutro, en mosaico, para mezclar en "overlay". */
export function grainTexture(size = 160) {
  return memo(`grain${size}`, () => {
    const rand = rng(17)
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    const img = g.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      // Suma de dos uniformes: grano más denso en los medios tonos, como la plata de la película
      const v = 128 + (rand() + rand() - 1) * 150
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    g.putImageData(img, 0, 0)
    return c.toDataURL('image/png')
  })
}

/**
 * Destello de diamante: dos rayos largos y finísimos en cruz que se afinan hasta desaparecer, dos diagonales más
 * cortas y tenues, y un núcleo blanco diminuto. Es el reflejo de una piedra bajo la luz, no una estrella dibujada.
 */
export function glintTexture(size = 96) {
  return memo(`glint${size}`, () => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    const m = size / 2
    // Rayo: huso muy fino (ancho w en el centro, 0 en las puntas) con brillo que cae hacia las puntas
    const ray = (angle: number, length: number, w: number, alpha: number) => {
      g.save()
      g.translate(m, m)
      g.rotate(angle)
      const fade = g.createLinearGradient(-length, 0, length, 0)
      fade.addColorStop(0, 'rgba(255, 255, 255, 0)')
      fade.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`)
      fade.addColorStop(1, 'rgba(255, 255, 255, 0)')
      g.fillStyle = fade
      g.beginPath()
      g.moveTo(-length, 0)
      g.quadraticCurveTo(0, -w, length, 0)
      g.quadraticCurveTo(0, w, -length, 0)
      g.fill()
      g.restore()
    }
    const halo = g.createRadialGradient(m, m, 0, m, m, size * 0.09)
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    halo.addColorStop(0.5, 'rgba(255, 244, 220, 0.35)')
    halo.addColorStop(1, 'rgba(255, 244, 220, 0)')
    g.fillStyle = halo
    g.fillRect(0, 0, size, size)
    ray(0, m, 2.6, 1)
    ray(Math.PI / 2, m, 2.6, 1)
    ray(Math.PI / 4, m * 0.42, 1.6, 0.55)
    ray(-Math.PI / 4, m * 0.42, 1.6, 0.55)
    return c.toDataURL('image/png')
  })
}

/**
 * Pergamino para Cartas mágicas: grano por píxel, fibras cortas y manchas de humedad.
 * Fibras y manchas se dibujan también desplazadas un lienzo para que el mosaico no tenga costuras.
 */
export function parchmentTexture(base = '#e2d1ad', size = 420, seed = 7, fibers = 900, stains = 26) {
  return memo(`parchment${base}${size}${seed}`, () => {
    const rand = rng(seed)
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    g.fillStyle = base
    g.fillRect(0, 0, size, size)
    const wrap = (draw: (ox: number, oy: number) => void) => {
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) draw(ox, oy)
    }
    for (let i = 0; i < stains; i++) {
      const x = rand() * size, y = rand() * size, r = 40 + rand() * 140, a = 0.05 + rand() * 0.08
      wrap((ox, oy) => {
        const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
        grd.addColorStop(0, `rgba(140, 95, 40, ${a})`)
        grd.addColorStop(1, 'rgba(140, 95, 40, 0)')
        g.fillStyle = grd
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
      })
    }
    const img = g.getImageData(0, 0, size, size)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * 18
      d[i] += n
      d[i + 1] += n
      d[i + 2] += n * 0.8
    }
    g.putImageData(img, 0, 0)
    g.lineCap = 'round'
    for (let i = 0; i < fibers; i++) {
      const x = rand() * size, y = rand() * size, a = rand() * Math.PI, l = 6 + rand() * 26
      const bend = rand() * 4
      g.strokeStyle = `rgba(${rand() < 0.5 ? '90, 60, 25' : '255, 248, 230'}, ${0.08 + rand() * 0.12})`
      g.lineWidth = 0.6 + rand() * 0.6
      wrap((ox, oy) => {
        g.beginPath()
        g.moveTo(x + ox, y + oy)
        g.quadraticCurveTo(x + ox + Math.cos(a) * l * 0.5 + bend, y + oy + Math.sin(a) * l * 0.5, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l)
        g.stroke()
      })
    }
    return c.toDataURL('image/png')
  })
}
