// Tocadiscos 3D de Los vinilos de Big: modelo procedural en three.js, sin archivos externos.
// Viene del prototipo aprobado (docs/briefs/tocadiscos-3d.html): vista fija desde arriba y al frente,
// nogal oscuro, tapa acrílica abierta y piloto ámbar. Única interacción: tocar el brazo.
// Se carga en diferido solo al entrar a la sección (ver Deck.tsx); si no hay WebGL, queda el plato 2D.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export type Turntable = {
  /** Carátula de la canción en la etiqueta del disco; sin carátula, etiqueta ámbar con el título. */
  setCover(url: string | null, title: string, subtitle: string): void
  /** Brazo: abajo (sobre el disco) o arriba (en su apoyo). */
  setNeedle(down: boolean): void
  /** El disco gira solo si la aguja está apoyada y el reproductor está sonando. */
  setSpinning(on: boolean): void
  dispose(): void
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

// Mismo encuadre que el prototipo (360 × 380): la tapa abierta entra completa.
export const ASPECT = 360 / 380

const PLAY = -0.565 // giro del brazo sobre el disco
const UP = -0.09 // elevación con la aguja levantada
const RPM = 3.49 // 33⅓ rpm en rad/s

// Vista de frente y algo elevada, elegida por Simón con una captura (2026-10-25)
const CAMERA: { position: [number, number, number]; target: [number, number, number] } = { position: [-0.6, 6.62, 8.72], target: [0.44, 1.25, 0.08] }
// Lente más cerrada = tocadiscos más cerca, sin cambiar el ángulo de la vista
const FOV = 36

export function createTurntable(
  canvas: HTMLCanvasElement,
  opts: { onArmTap: () => void; reducedMotion: boolean },
): Turntable {
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  R.setPixelRatio(Math.min(devicePixelRatio, 2))
  R.shadowMap.enabled = true
  R.shadowMap.type = THREE.PCFSoftShadowMap
  R.toneMapping = THREE.ACESFilmicToneMapping
  R.toneMappingExposure = 1.1

  const S = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(FOV, ASPECT, 0.1, 100)
  cam.position.set(...CAMERA.position)
  cam.lookAt(...CAMERA.target)

  // Reflejos: un estudio simple con paneles de luz, horneado a PMREM
  const pm = new THREE.PMREMGenerator(R)
  const env = new THREE.Scene()
  env.background = new THREE.Color(0x120c08)
  const pan = (w: number, h: number, c: number, x: number, y: number, z: number, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }))
    m.position.set(x, y, z)
    m.rotation.set(rx, ry, 0)
    env.add(m)
  }
  pan(10, 4, 0xffffff, 0, 8, 0, 0, Math.PI / 2)
  pan(6, 3, 0xffc890, -7, 3, 0, Math.PI / 2)
  pan(5, 3, 0xbfd0ff, 6, 3, 4, -Math.PI / 3)
  const envMap = pm.fromScene(env, 0.03).texture
  S.environment = envMap

  const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    draw(c.getContext('2d')!, w, h)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  // Nogal oscuro con vetas
  const walnut = tex(1024, 512, (g, w, h) => {
    g.fillStyle = '#2a170c'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 300; i++) {
      const y = Math.random() * h, a = 3 + Math.random() * 9, f = 0.004 + Math.random() * 0.01, p = Math.random() * 6
      g.strokeStyle = Math.random() < 0.55 ? `rgba(8,4,2,${0.25 + Math.random() * 0.35})` : `rgba(110,64,32,${0.12 + Math.random() * 0.22})`
      g.lineWidth = 0.6 + Math.random() * 2.4
      g.beginPath()
      for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * f + p) * a)
      g.stroke()
    }
  })
  // Vinilo: surcos y separación entre pistas; la etiqueta va en una malla aparte (setCover)
  const vinyl = tex(1024, 1024, (g, w) => {
    const c = w / 2
    g.fillStyle = '#070707'
    g.fillRect(0, 0, w, w)
    for (let r = c * 0.36; r < c * 0.995; r += 1.15) {
      const gap = [0.52, 0.66, 0.8].some((k) => Math.abs(r / c - k) < 0.006)
      const n = () => (9 + Math.random() * 9) | 0
      g.strokeStyle = gap ? '#1b1b1b' : `rgb(${n()},${n()},${n() + 1})`
      g.lineWidth = gap ? 2.4 : 0.9
      g.beginPath()
      g.arc(c, c, r, 0, 7)
      g.stroke()
    }
  })

  const M = {
    walnut: new THREE.MeshStandardMaterial({ map: walnut, roughness: 0.5 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xd4d6da, metalness: 1, roughness: 0.25 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x161616, metalness: 0.4, roughness: 0.5 }),
    rub: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 }),
    vin: new THREE.MeshPhysicalMaterial({ map: vinyl, roughness: 0.42, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.18 }),
    edge: new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.3, clearcoat: 1 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.3 }),
    acr: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false }),
    label: new THREE.MeshPhysicalMaterial({ roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.35 }),
  }
  const root = new THREE.Group()
  root.rotation.y = -0.18
  S.add(root)
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, parent: THREE.Object3D = root) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }

  // Plinto de nogal con filete oscuro y patas; arriba, botón de arranque, selector y piloto ámbar
  // Cantos lijados: el plinto y el filete con aristas redondeadas, como un mueble de verdad
  mesh(new RoundedBoxGeometry(5.3, 0.55, 4.1, 4, 0.06), M.walnut, 0.45, -0.275, 0)
  mesh(new RoundedBoxGeometry(5.34, 0.04, 4.14, 2, 0.02), M.dark, 0.45, -0.56, 0)
  for (const [x, z] of [[-2, -1.75], [2.9, -1.75], [-2, 1.75], [2.9, 1.75]]) mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.18, 24), M.rub, x, -0.67, z)
  mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 32), M.alu, -1.75, 0.03, 1.65)
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32), M.dark, -1.25, 0.025, 1.7)
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xe8a64b, emissive: 0xe8a64b, emissiveIntensity: 0.2 })
  mesh(new THREE.SphereGeometry(0.05, 16, 12), ledMat, -0.9, 0.03, 1.72)

  // Plato, vinilo y etiqueta con la carátula
  mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.14, 96), M.alu, 0, 0.07, 0)
  // Bisel en el borde del plato: atrapa el reflejo en lugar de una arista cortada
  const bevel = mesh(new THREE.TorusGeometry(1.6, 0.025, 12, 128), M.alu, 0, 0.14, 0)
  bevel.rotation.x = Math.PI / 2
  const disc = new THREE.Group()
  disc.position.set(0, 0.155, 0)
  root.add(disc)
  mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.03, 128), [M.edge, M.vin, M.edge], 0, 0, 0, disc)
  const label = mesh(new THREE.CircleGeometry(0.5, 96), M.label, 0, 0.0165, 0, disc)
  label.rotation.x = -Math.PI / 2
  label.castShadow = false
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 16), M.alu, 0, 0.06, 0, disc)

  // Brazo: dos grupos anidados, giro (yaw) y elevación (lift), para que la aguja suba y baje sobre su propio eje
  const P = new THREE.Vector3(2.05, 0, -1.35)
  mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 48), M.alu, P.x, 0.04, P.z)
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 24), M.dark, P.x, 0.25, P.z)
  mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.34, 16), M.dark, 2.05, 0.17, 0.95)
  const yaw = new THREE.Group()
  yaw.position.set(P.x, 0.44, P.z)
  root.add(yaw)
  const lift = new THREE.Group()
  yaw.add(lift)
  const L = 2.25
  const arm = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0) => {
    const m = mesh(geo, mat, x, y, z, lift)
    m.rotation.x = rx
    return m
  }
  arm(new THREE.SphereGeometry(0.09, 24, 16), M.alu, 0, 0, 0)
  arm(new THREE.CylinderGeometry(0.03, 0.03, L, 20), M.alu, 0, 0, L / 2, Math.PI / 2)
  arm(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 32), M.dark, 0, 0, -0.36, Math.PI / 2)
  arm(new THREE.BoxGeometry(0.16, 0.07, 0.32), M.dark, 0, -0.06, L + 0.08)
  arm(new THREE.BoxGeometry(0.1, 0.12, 0.12), M.brass, 0, -0.15, L + 0.12)
  arm(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8), M.alu, 0, -0.24, L + 0.12)
  arm(new THREE.BoxGeometry(0.02, 0.02, 0.22), M.alu, 0.08, -0.04, L + 0.25)
  // Zona de toque invisible, más gruesa que el brazo, para que el dedo no tenga que apuntar fino
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  const hitArea = arm(new THREE.BoxGeometry(0.7, 0.6, L + 1.1), hitMat, 0, -0.1, L / 2)
  hitArea.castShadow = false

  // Tapa acrílica abierta: bisagras atrás, paneles transparentes con cantos que brillan
  const lid = new THREE.Group()
  lid.position.set(0.45, 0.02, -2.05)
  lid.rotation.x = -1.32
  root.add(lid)
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
  const panel = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    const m = new THREE.Mesh(g, M.acr)
    m.position.set(x, y, z)
    m.renderOrder = 2
    lid.add(m)
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat)
    e.position.copy(m.position)
    e.renderOrder = 3
    lid.add(e)
  }
  panel(5.3, 0.03, 4.1, 0, 0.85, 2.05)
  panel(0.03, 0.85, 4.1, -2.635, 0.425, 2.05)
  panel(0.03, 0.85, 4.1, 2.635, 0.425, 2.05)
  panel(5.3, 0.85, 0.03, 0, 0.425, 4.085)
  panel(5.3, 0.85, 0.03, 0, 0.425, 0.015) // pared trasera, junto a la bisagra
  for (const x of [-1.6, 1.6]) mesh(new RoundedBoxGeometry(0.4, 0.12, 0.12, 2, 0.02), M.dark, x + 0.45, 0.02, -2.06)

  // Sombra en el piso y luces (cenital + lámpara cálida). Valores del prototipo r128 × π:
  // desde r155 las luces son físicas y sin ese factor la escena queda apagada.
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.45 }))
  fl.rotation.x = -Math.PI / 2
  fl.position.y = -0.76
  fl.receiveShadow = true
  S.add(fl)
  S.add(new THREE.HemisphereLight(0xffe6c8, 0x1f1610, 0.4 * Math.PI))
  const key = new THREE.DirectionalLight(0xfff1dc, 1.6 * Math.PI)
  key.position.set(-4, 8, 6)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 })
  key.shadow.bias = -0.0004
  key.shadow.radius = 4
  S.add(key)
  const lamp = new THREE.PointLight(0xffb060, 0.9 * Math.PI, 18, 1)
  lamp.position.set(5, 3, -1)
  S.add(lamp)

  // Estado: el brazo sigue a `needle`; el disco gira si la aguja está apoyada y `spinning`
  let needle = false
  let spinning = false
  let spin = 0
  lift.rotation.x = UP
  const calm = opts.reducedMotion

  // Etiqueta: carátula recortada en círculo (o ámbar con el título si no hay o no carga)
  let labelTex: THREE.Texture | null = null
  let coverToken = 0
  const paintLabel = (img: HTMLImageElement | null, title: string, subtitle: string) => {
    const t = tex(512, 512, (g, w) => {
      const c = w / 2
      g.save()
      g.beginPath()
      g.arc(c, c, c, 0, 7)
      g.clip()
      if (img) {
        const s = Math.max(w / img.naturalWidth, w / img.naturalHeight)
        const iw = img.naturalWidth * s, ih = img.naturalHeight * s
        g.drawImage(img, (w - iw) / 2, (w - ih) / 2, iw, ih)
        // un velo leve en el borde, como la tinta de una etiqueta impresa
        const v = g.createRadialGradient(c, c, c * 0.7, c, c, c)
        v.addColorStop(0, 'rgba(0,0,0,0)')
        v.addColorStop(1, 'rgba(0,0,0,0.35)')
        g.fillStyle = v
        g.fillRect(0, 0, w, w)
      } else {
        const gr = g.createLinearGradient(0, 0, w, w)
        gr.addColorStop(0, '#e8a64b')
        gr.addColorStop(1, '#6b1424')
        g.fillStyle = gr
        g.fillRect(0, 0, w, w)
        g.fillStyle = 'rgba(255,240,215,.92)'
        g.textAlign = 'center'
        g.font = '400 40px Gloock, Georgia, serif'
        g.fillText(fit(g, title.toUpperCase(), w * 0.78), c, c - 70)
        g.font = 'italic 26px "Libre Caslon Text", Georgia, serif'
        g.fillText(fit(g, subtitle, w * 0.8), c, c + 92)
      }
      g.restore()
      g.fillStyle = '#0a0a0a'
      g.beginPath()
      g.arc(c, c, 10, 0, 7)
      g.fill()
    })
    labelTex?.dispose()
    labelTex = t
    M.label.map = t
    M.label.needsUpdate = true
    wake()
  }

  // Render a demanda: el bucle se apaga cuando el brazo se asentó y el disco no gira
  const clock = new THREE.Clock()
  let raf = 0
  let disposed = false
  const frame = () => {
    raf = 0
    if (disposed) return
    const dt = Math.min(clock.getDelta(), 0.05)
    const k = calm ? 1 : 1 - Math.exp(-dt * 5)
    if (needle) {
      yaw.rotation.y += (PLAY - yaw.rotation.y) * k
      const there = Math.abs(yaw.rotation.y - PLAY) < 0.02
      lift.rotation.x += ((there ? 0 : UP) - lift.rotation.x) * k
    } else {
      lift.rotation.x += (UP - lift.rotation.x) * k
      if (lift.rotation.x < UP + 0.015) yaw.rotation.y += (0 - yaw.rotation.y) * k
    }
    const landed = needle && Math.abs(lift.rotation.x) < 0.01
    const on = landed && spinning
    spin += ((on ? RPM : 0) - spin) * (1 - Math.exp(-dt * (on ? 2.2 : 1.2)))
    if (!calm) disc.rotation.y -= spin * dt
    ledMat.emissiveIntensity = on ? 2.2 : 0.2
    R.render(S, cam)
    const armSettled = needle ? landed && Math.abs(yaw.rotation.y - PLAY) < 0.002 : Math.abs(lift.rotation.x - UP) < 0.002 && Math.abs(yaw.rotation.y) < 0.002
    const discSettled = calm || (!on && spin < 0.005)
    if (!(armSettled && discSettled)) raf = requestAnimationFrame(frame)
  }
  function wake() {
    if (!raf && !disposed) {
      clock.getDelta()
      raf = requestAnimationFrame(frame)
    }
  }

  // Tamaño: el canvas lo mide el CSS; aquí solo se ajusta el buffer
  const resize = () => {
    const w = canvas.clientWidth
    if (!w) return
    R.setSize(w, Math.round(w / ASPECT), false)
    wake()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  // Toque en el brazo: un toque corto (no un desplazamiento de la página) sobre la zona del brazo
  const ray = new THREE.Raycaster()
  const v = new THREE.Vector2()
  const hit = (e: PointerEvent) => {
    const b = canvas.getBoundingClientRect()
    v.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
    ray.setFromCamera(v, cam)
    return ray.intersectObject(lift, true).length > 0
  }
  let down: { x: number; y: number } | null = null
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e: PointerEvent) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && hit(e)) opts.onArmTap()
    down = null
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') canvas.style.cursor = hit(e) ? 'pointer' : ''
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointermove', onMove)

  paintLabel(null, '', '')

  return {
    setCover(url, title, subtitle) {
      const token = ++coverToken
      if (!url) return paintLabel(null, title, subtitle)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.onload = () => token === coverToken && paintLabel(img, title, subtitle)
      img.onerror = () => token === coverToken && paintLabel(null, title, subtitle)
      img.src = url
    },
    setNeedle(d) {
      needle = d
      wake()
    },
    setSpinning(on) {
      spinning = on
      wake()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointermove', onMove)
      const textures = new Set<THREE.Texture>([walnut, vinyl, envMap])
      if (labelTex) textures.add(labelTex)
      for (const scene of [S, env]) {
        scene.traverse((o) => {
          const m = o as THREE.Mesh
          m.geometry?.dispose()
          const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
          mats.forEach((mat) => mat.dispose())
        })
      }
      textures.forEach((t) => t.dispose())
      pm.dispose()
      R.dispose()
    },
  }
}

function fit(g: CanvasRenderingContext2D, text: string, max: number) {
  if (g.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && g.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}
