import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive, useSignedUrl } from '../../hooks/useData'
import { live as queries } from '../queries'
import { compressImage, seedLocalUrl, uploadImage } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import type { CollageItem } from '../../lib/types'
import { Icon } from '../../ui/Icon'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import { makeCutout } from './cutout'
import './Y2K.css'

type Geo = Pick<CollageItem, 'x' | 'y' | 'width' | 'rotation'>
type Pt = { x: number; y: number }
type Gesture = { id: string; start: Geo; pts: Pt[]; center?: Pt; handle: boolean; moved: boolean }
type Ink = 'pink' | 'white' | 'black'

// Con el dedo, una pieza sin seleccionar deja hacer scroll; mantenerla quieta HOLD_MS la agarra.
// Moverse más de SLOP_PX antes de eso es scroll.
const HOLD_MS = 350
const SLOP_PX = 10

// Tintas del texto pegado: se guardan por nombre y el CSS las pinta con los tokens de la sección
const inks: { name: string; value: Ink }[] = [
  { name: 'Rosa', value: 'pink' },
  { name: 'Blanco', value: 'white' },
  { name: 'Negro', value: 'black' },
]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** 2000's Collage: collage compartido. Un dedo mueve, dos dedos escalan y giran, el sello lo deja quieto. */
export default function Y2K() {
  const { session } = useCouple()
  const { load, refresh, mutate } = useLive<CollageItem[]>(queries.collage.table, queries.collage.query, [], queries.collage)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(360)
  const [local, setLocal] = useState<Record<string, Geo>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [menuPage, setMenuPage] = useState(0)
  const [panel, setPanel] = useState<'none' | 'text' | 'cutout'>('none')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuAt, setMenuAt] = useState<{ x: number; y: number; above: boolean } | null>(null)
  const [menuW, setMenuW] = useState(260)
  const itemEls = useRef(new Map<string, HTMLDivElement>())
  const menuRef = useRef<HTMLDivElement>(null)
  const focusMenu = useRef(false)

  useLayoutEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => {
    if (!menuRef.current) return
    setMenuW(menuRef.current.offsetWidth)
    if (focusMenu.current) {
      menuRef.current.querySelector('button')?.focus()
      focusMenu.current = false
    }
  }, [menuAt, menuPage, selected])

  // Las piezas viejas de la hoja de stickers ya no se pintan
  const items = (load.state === 'ready' ? load.data : []).filter((it) => it.kind !== 'sticker').map((it) => ({ ...it, ...local[it.id] }))
  const sel = items.find((i) => i.id === selected) ?? null
  const maxZ = items.reduce((m, i) => Math.max(m, i.z), 0)
  const height = Math.max(W * 1.5, ...items.map((i) => (i.y + i.width * 1.4) * W + 120))

  // ---- gestos: todo el estado vivo en refs; React solo pinta ----------------
  const pointers = useRef(new Map<number, Pt>())
  const gesture = useRef<Gesture | null>(null)
  const live = useRef<Geo | null>(null)
  // Dedo sobre una pieza no seleccionada: aún no se sabe si es scroll, toque o mantener para agarrar
  const pending = useRef<{ id: string; pointerId: number; x: number; y: number; timer: number; locked: boolean } | null>(null)

  // Mientras se arrastra una pieza, el dedo no mueve la página. Tiene que ser touchmove no pasivo:
  // touch-action ya no lo puede impedir porque la pieza deja pasar el scroll (pan-y).
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const stop = (e: TouchEvent) => {
      if (gesture.current) e.preventDefault()
    }
    el.addEventListener('touchmove', stop, { passive: false })
    return () => el.removeEventListener('touchmove', stop)
  }, [])

  function cancelPending() {
    if (pending.current) window.clearTimeout(pending.current.timer)
    pending.current = null
  }

  /** Empieza a mover la pieza (inmediato con mouse o si ya estaba seleccionada; tras mantener con el dedo). */
  function grab(el: HTMLElement, id: string, pointerId: number, at: Pt, handle: boolean) {
    setSelected(id)
    setMenuPage(0)
    setMenuAt(null)
    try {
      el.setPointerCapture(pointerId)
    } catch {
      /* el dedo ya se levantó */
    }
    pointers.current.clear()
    pointers.current.set(pointerId, at)
    live.current = null
    snapshot(id, handle)
  }

  function geoOf(id: string): Geo {
    const it = items.find((i) => i.id === id)!
    return { x: it.x, y: it.y, width: it.width, rotation: it.rotation }
  }

  function snapshot(id: string, handle: boolean, moved = false) {
    const r = itemEls.current.get(id)?.getBoundingClientRect()
    gesture.current = {
      id,
      start: live.current ?? geoOf(id),
      pts: [...pointers.current.values()],
      center: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined,
      handle,
      moved,
    }
  }

  function onCanvasDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.closest('.ios-menu')) return
    const pieceEl = target.closest<HTMLElement>('[data-piece]')
    const handle = !!target.closest('.piece-handle')
    const id = pieceEl?.dataset.piece

    // Segundo dedo durante un gesto (aunque caiga fuera de la pieza): se vuelve pellizco
    if (gesture.current && !gesture.current.handle && (!id || id === gesture.current.id)) {
      e.currentTarget.setPointerCapture(e.pointerId)
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      return snapshot(gesture.current.id, false, true)
    }
    if (!id) {
      setSelected(null)
      setMenuAt(null)
      return
    }
    const item = items.find((i) => i.id === id)!
    const at = { x: e.clientX, y: e.clientY }
    // Mouse, manija o pieza ya seleccionada: se mueve de una vez, como antes
    if (!item.locked && (e.pointerType !== 'touch' || handle || id === selected)) return grab(e.currentTarget, id, e.pointerId, at, handle)
    // Con el dedo sobre otra pieza (o una fijada) puede ser scroll: se decide al levantar, mover o esperar
    cancelPending()
    const canvas = e.currentTarget
    const pointerId = e.pointerId
    pending.current = {
      id,
      pointerId,
      ...at,
      locked: item.locked,
      // Mantener quieto ~0,35 s agarra la pieza (las fijadas no se agarran)
      timer: item.locked
        ? 0
        : window.setTimeout(() => {
            const p = pending.current
            pending.current = null
            if (p) grab(canvas, p.id, p.pointerId, { x: p.x, y: p.y }, false)
          }, HOLD_MS),
    }
  }

  function onCanvasMove(e: React.PointerEvent) {
    const p = pending.current
    if (p && p.pointerId === e.pointerId) {
      // Se movió antes de tiempo: es scroll, la página sigue al dedo
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > SLOP_PX) cancelPending()
      else {
        p.x = e.clientX
        p.y = e.clientY
      }
      return
    }
    const g = gesture.current
    if (!g || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const now = [...pointers.current.values()]
    const s = g.start
    let next: Geo
    if (g.handle && g.center) {
      const a0 = Math.atan2(g.pts[0].y - g.center.y, g.pts[0].x - g.center.x)
      const a1 = Math.atan2(now[0].y - g.center.y, now[0].x - g.center.x)
      const d0 = Math.hypot(g.pts[0].x - g.center.x, g.pts[0].y - g.center.y) || 1
      const d1 = Math.hypot(now[0].x - g.center.x, now[0].y - g.center.y)
      const width = clamp(s.width * (d1 / d0), 0.08, 1.2)
      next = { ...s, width, x: s.x + (s.width - width) / 2, rotation: s.rotation + ((a1 - a0) * 180) / Math.PI }
    } else if (now.length >= 2 && g.pts.length >= 2) {
      const [p0, p1] = g.pts
      const [n0, n1] = now
      const ratio = Math.hypot(n1.x - n0.x, n1.y - n0.y) / (Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1)
      const angle = Math.atan2(n1.y - n0.y, n1.x - n0.x) - Math.atan2(p1.y - p0.y, p1.x - p0.x)
      const width = clamp(s.width * ratio, 0.08, 1.2)
      const mid = { x: (n0.x + n1.x - p0.x - p1.x) / 2 / W, y: (n0.y + n1.y - p0.y - p1.y) / 2 / W }
      next = { width, rotation: s.rotation + (angle * 180) / Math.PI, x: s.x + (s.width - width) / 2 + mid.x, y: Math.max(0, s.y + mid.y) }
    } else {
      next = { ...s, x: s.x + (now[0].x - g.pts[0].x) / W, y: Math.max(0, s.y + (now[0].y - g.pts[0].y) / W) }
    }
    g.moved = true
    live.current = next
    setLocal((l) => ({ ...l, [g.id]: next }))
  }

  async function onCanvasUp(e: React.PointerEvent) {
    const p = pending.current
    if (p && p.pointerId === e.pointerId) {
      // Toque corto: selecciona (la fijada muestra el candadito; la libre abre la burbuja)
      cancelPending()
      setSelected(p.id)
      setMenuPage(0)
      setMenuAt(null)
      if (!p.locked) placeMenu(p.id)
      return
    }
    if (!pointers.current.delete(e.pointerId)) return
    const g = gesture.current
    if (!g) return
    if (pointers.current.size > 0) return snapshot(g.id, false, g.moved)
    gesture.current = null
    const geo = live.current
    live.current = null
    placeMenu(g.id)
    if (g.moved && geo) await persist(g.id, geo)
  }

  async function persist(id: string, geo: Geo) {
    const { error } = await supabase.from('collage_items').update(geo).eq('id', id)
    if (error) setError('Esa pieza está fijada o no se pudo mover.')
    await refresh()
    setLocal(({ [id]: _, ...rest }) => rest)
  }

  // Teclado: flechas mueven, + / − escalan, [ ] giran (alternativa a los gestos)
  const keyTimer = useRef(0)
  function onPieceKey(e: React.KeyboardEvent, it: CollageItem) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelected(it.id)
      if (it.locked) return
      focusMenu.current = true
      return placeMenu(it.id)
    }
    if (e.key === 'Escape') {
      setSelected(null)
      return setMenuAt(null)
    }
    if (it.locked) return
    const step = e.shiftKey ? 0.05 : 0.01
    const g = local[it.id] ?? geoOf(it.id)
    const map: Record<string, Geo> = {
      ArrowLeft: { ...g, x: g.x - step },
      ArrowRight: { ...g, x: g.x + step },
      ArrowUp: { ...g, y: Math.max(0, g.y - step) },
      ArrowDown: { ...g, y: g.y + step },
      '+': { ...g, width: clamp(g.width * 1.08, 0.08, 1.2) },
      '-': { ...g, width: clamp(g.width / 1.08, 0.08, 1.2) },
      ']': { ...g, rotation: g.rotation + 5 },
      '[': { ...g, rotation: g.rotation - 5 },
    }
    const next = map[e.key]
    if (!next) return
    e.preventDefault()
    setSelected(it.id)
    setLocal((l) => ({ ...l, [it.id]: next }))
    window.clearTimeout(keyTimer.current)
    keyTimer.current = window.setTimeout(() => persist(it.id, next), 400)
  }

  function placeMenu(id: string) {
    requestAnimationFrame(() => {
      const el = itemEls.current.get(id)
      const c = canvasRef.current
      if (!el || !c) return
      const r = el.getBoundingClientRect()
      const cr = c.getBoundingClientRect()
      const below = r.bottom + 70 < window.innerHeight
      setMenuAt({ x: r.left + r.width / 2 - cr.left, y: (below ? r.bottom : r.top) - cr.top, above: !below })
    })
  }

  function closeMenu() {
    const id = selected
    setMenuAt(null)
    if (id) itemEls.current.get(id)?.focus()
  }

  // ---- agregar ------------------------------------------------------------
  function spawnY() {
    const c = canvasRef.current
    if (!c) return 0.1
    return Math.max(0, (-c.getBoundingClientRect().top + 120) / W)
  }

  async function add(row: Partial<CollageItem>) {
    setError(null)
    const { data, error } = await supabase
      .from('collage_items')
      .insert({ author_id: session.user.id, x: 0.25, y: spawnY(), width: 0.45, rotation: Math.round(Math.random() * 12 - 6), z: maxZ + 1, ...row })
      .select('*')
      .single<CollageItem>()
    if (error || !data) return setError('No se pudo pegar. Revisa la conexión.')
    // se pinta ya con la fila que devolvió el insert; el tiempo real trae el resto
    mutate((list) => (list.some((i) => i.id === data.id) ? list : [...list, data]))
    setSelected(data.id)
    placeMenu(data.id)
  }

  async function addImage(file: Blob | undefined, kind: 'photo' | 'cutout') {
    if (!file) return
    setPanel('none')
    setError(null)
    setBusy(kind === 'photo' ? 'Pegando la foto…' : 'Buscando la silueta…')
    let blob: Blob
    let bare: Blob | null = null
    try {
      // Sticker = como uno de WhatsApp: sin fondo, ceñido a la silueta y con borde blanco (más una copia sin borde)
      if (kind === 'cutout') {
        const made = await makeCutout(file, (label, pct) => setBusy(pct == null ? label : `${label} ${pct}%`))
        blob = made.framed
        bare = made.bare
      } else blob = await compressImage(file, { max: 1200, keepAlpha: file.type === 'image/png' || file.type === 'image/webp' })
    } catch {
      setBusy(null)
      return setError(kind === 'cutout' ? 'No encontré a nadie en esa foto. Prueba con una donde se vea bien la persona.' : 'No se pudo leer esa imagen. Intenta con otra.')
    }
    try {
      const [path, barePath] = await Promise.all([
        uploadImage('collage', blob, session.user.id),
        bare ? uploadImage('collage', bare, session.user.id) : Promise.resolve(null),
      ])
      seedLocalUrl('collage', path, blob)
      if (bare && barePath) seedLocalUrl('collage', barePath, bare)
      await add({ kind, storage_path: path, bg_removed: kind === 'cutout', width: kind === 'photo' ? 0.5 : 0.45, style: barePath ? { bare: barePath } : {} })
    } catch {
      setError('No se pudo subir la imagen. Revisa la conexión.')
    }
    setBusy(null)
  }

  async function pasteCutout() {
    try {
      for (const entry of await navigator.clipboard.read()) {
        const type = entry.types.find((t) => t.startsWith('image/'))
        if (type) return addImage(await entry.getType(type), 'cutout')
      }
      setError('No hay ninguna imagen copiada. Copia una o elígela de tus fotos.')
    } catch {
      setError('Este teléfono no dejó leer lo copiado. Elige la foto de tu galería.')
    }
  }

  // ---- acciones de la burbuja -----------------------------------------------
  async function act(action: 'front' | 'back' | 'lock' | 'unlock' | 'duplicate' | 'delete' | 'straighten' | 'bigger' | 'smaller' | 'frame') {
    if (!sel) return
    setError(null)
    if (action === 'delete') {
      const { error } = await supabase.from('collage_items').delete().eq('id', sel.id)
      if (error) return setError('No se pudo quitar esa pieza.')
      // «Duplicar» reutiliza el mismo archivo: solo se borra cuando ya no lo usa ninguna otra pieza
      if (sel.storage_path) {
        const { data: others, error: lookErr } = await supabase.from('collage_items').select('id').eq('storage_path', sel.storage_path).limit(1)
        if (!lookErr && !others?.length) await supabase.storage.from('collage').remove([sel.storage_path, ...(sel.style?.bare ? [sel.style.bare] : [])])
      }
      setSelected(null)
      setMenuAt(null)
      return refresh()
    }
    if (action === 'duplicate') {
      const { id: _id, created_at: _c, locked: _l, locked_by: _lb, author_id: _a, ...copy } = sel
      return add({ ...copy, x: sel.x + 0.04, y: sel.y + 0.04, z: maxZ + 1, locked: false })
    }
    const patch: Partial<CollageItem> = {
      front: { z: maxZ + 1 },
      back: { z: Math.min(...items.map((i) => i.z)) - 1 },
      lock: { locked: true },
      unlock: { locked: false },
      straighten: { rotation: 0 },
      bigger: { width: clamp(sel.width * 1.15, 0.08, 1.2) },
      smaller: { width: clamp(sel.width / 1.15, 0.08, 1.2) },
      // el borde blanco se quita o se pone: en fotos lo pinta el CSS; en stickers se cambia a la copia sin borde
      frame: { style: { ...sel.style, frame: sel.style?.frame === 'none' ? 'white' : 'none' } },
    }[action]
    const { error } = await supabase.from('collage_items').update(patch).eq('id', sel.id)
    if (error) setError('No se pudo aplicar el cambio.')
    await refresh()
    if (action === 'lock') return setMenuAt(null)
    placeMenu(sel.id)
  }

  // ‹ › entre las páginas de la burbuja, como el menú de copiar del iPhone
  const pageButton = (to: number) =>
    to > menuPage ? (
      <button type="button" aria-label="Más opciones" onClick={() => setMenuPage(to)}>
        <Icon name="chevron" size={16} />
      </button>
    ) : (
      <button type="button" aria-label="Volver" onClick={() => setMenuPage(to)}>
        <Icon name="chevron-left" size={16} />
      </button>
    )
  const menuButton = (label: string, action: Parameters<typeof act>[0], extra = '') => (
    <button type="button" className={extra} onClick={() => act(action)}>
      {label}
    </button>
  )
  // Botón + abajo a la izquierda: abre el menú; con un panel abierto, lo cierra
  function onFab() {
    if (panel !== 'none') return setPanel('none')
    setAdding((v) => !v)
  }
  function choose(p: 'text' | 'cutout') {
    setAdding(false)
    setPanel(p)
  }

  return (
    <Section id="y2k" className="y2k" ready={load.state !== 'loading'}>
      {adding && <div className="y2k-scrim" aria-hidden="true" onPointerDown={() => setAdding(false)} />}
      <div
        className="y2k-dock"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setAdding(false)
            setPanel('none')
          }
        }}
      >
        {busy && (
          <p className="y2k-status is-busy" role="status">
            {busy}
          </p>
        )}
        {error && (
          <p className="y2k-status is-error" role="alert">
            {error}
          </p>
        )}

        {panel === 'cutout' && (
          <div className="y2k-panel y2k-cutout" role="group" aria-label="Hacer un sticker">
            <p className="y2k-panel-note">Elige una foto y la convierto en sticker.</p>
            <label className="y2k-pill y2k-pill--main">
              <Icon name="image" size={17} /> Galería
              <input type="file" accept="image/*" className="visually-hidden" onChange={(e) => addImage(e.target.files?.[0], 'cutout')} />
            </label>
            <button type="button" className="y2k-pill" onClick={pasteCutout}>
              <Icon name="copy" size={17} /> Pegar
            </button>
          </div>
        )}
        {panel === 'text' && (
          <TextComposer
            onAdd={(body, ink) => {
              setPanel('none')
              add({ kind: 'text', body, style: { color: ink }, width: 0.6 })
            }}
          />
        )}

        {adding && (
          <div className="y2k-add-menu" id="y2k-add-menu" role="menu" aria-label="Agregar al collage">
            <button type="button" role="menuitem" className="y2k-add-item" onClick={() => choose('text')}>
              <span className="y2k-add-icon"><Icon name="type" size={18} /></span>
              <span className="y2k-add-label">Texto</span>
            </button>
            <button type="button" role="menuitem" className="y2k-add-item" onClick={() => choose('cutout')}>
              <span className="y2k-add-icon"><Icon name="scissors" size={18} /></span>
              <span className="y2k-add-label">Sticker</span>
            </button>
            <label role="menuitem" className="y2k-add-item">
              <span className="y2k-add-icon"><Icon name="image" size={18} /></span>
              <span className="y2k-add-label">Foto</span>
              <input
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={(e) => {
                  setAdding(false)
                  addImage(e.target.files?.[0], 'photo')
                }}
              />
            </label>
          </div>
        )}

        <button
          type="button"
          className={`y2k-fab${adding || panel !== 'none' ? ' is-open' : ''}`}
          aria-label={panel !== 'none' ? 'Cerrar' : adding ? 'Cerrar menú' : 'Agregar al collage'}
          aria-expanded={adding}
          aria-controls="y2k-add-menu"
          onClick={onFab}
        >
          <Icon name="plus" size={26} />
        </button>
      </div>

      <div
        ref={canvasRef}
        className="y2k-canvas"
        style={{ height }}
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        onPointerCancel={(e) => {
          // El navegador tomó el dedo para hacer scroll: no es un toque
          if (pending.current?.pointerId === e.pointerId) return cancelPending()
          onCanvasUp(e)
        }}
      >
        {load.state === 'loading' && <PressNote title="Buscando las tijeras…" />}
        {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
        {load.state === 'ready' && items.length === 0 && (
          <PressNote title="Página en blanco" body="Pega la primera foto o haz un sticker. Muévelo con un dedo, gíralo con dos y fíjalo cuando quede perfecto." />
        )}

        {items.map((it) => (
          <div
            key={it.id}
            data-piece={it.id}
            ref={(el) => {
              if (el) itemEls.current.set(it.id, el)
              else itemEls.current.delete(it.id)
            }}
            className={`piece piece--${it.kind}${it.style?.frame === 'none' ? ' is-bare' : ''}${it.id === selected ? ' is-selected' : ''}${it.locked ? ' is-locked' : ''}`}
            style={{ left: it.x * W, top: it.y * W, width: it.width * W, zIndex: it.z, rotate: `${it.rotation}deg`, '--w': `${it.width * W}px` } as CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={pieceLabel(it)}
            aria-pressed={it.id === selected}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight + - [ ]"
            onKeyDown={(e) => onPieceKey(e, it)}
          >
            <PieceContent item={it} />
            {it.locked && it.id === selected && (
              <button type="button" className="piece-lock" aria-label="Desfijar" onClick={() => act('unlock')}>
                <Icon name="lock" size={13} />
              </button>
            )}
            {it.id === selected && !it.locked && (
              <span className="piece-handle" aria-hidden="true">
                <Icon name="flip" size={14} />
              </span>
            )}
          </div>
        ))}

        {sel && menuAt && !sel.locked && (() => {
          // La burbuja se centra sobre la pieza sin salirse del lienzo; la flecha sigue apuntando a la pieza.
          const half = menuW / 2 + 8
          const left = clamp(menuAt.x, half, W - half)
          return (
            <div
              ref={menuRef}
              className={`ios-menu${menuAt.above ? ' is-above' : ''}`}
              style={{ left, top: menuAt.y, '--arrow': `${clamp(menuAt.x - left, -menuW / 2 + 16, menuW / 2 - 16)}px` } as CSSProperties}
              role="toolbar"
              aria-label="Acciones de la pieza"
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeMenu()
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  const buttons = [...e.currentTarget.querySelectorAll('button')]
                  const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
                  buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length]?.focus()
                }
              }}
            >
              {menuPage === 0 && (
                <>
                  {menuButton('Al frente', 'front')}
                  {menuButton('Fijar', 'lock')}
                  {menuButton('Duplicar', 'duplicate')}
                  {menuButton('Eliminar', 'delete', 'is-destructive')}
                  {pageButton(1)}
                </>
              )}
              {menuPage === 1 && (
                <>
                  {pageButton(0)}
                  {hasFrameToggle(sel) && menuButton(sel.style?.frame === 'none' ? 'Poner borde' : 'Quitar borde', 'frame')}
                  {menuButton('Enderezar', 'straighten')}
                  {menuButton('Al fondo', 'back')}
                  {pageButton(2)}
                </>
              )}
              {/* el tamaño se cambia con dos dedos; esto queda al final por si acaso */}
              {menuPage === 2 && (
                <>
                  {pageButton(1)}
                  {menuButton('Más grande', 'bigger')}
                  {menuButton('Más pequeña', 'smaller')}
                </>
              )}
            </div>
          )
        })()}
      </div>
    </Section>
  )
}

/** Fotos siempre; stickers solo si se guardaron con su copia sin borde (los primeros no la tienen). */
function hasFrameToggle(it: CollageItem) {
  return it.kind === 'photo' || (it.kind === 'cutout' && !!it.style?.bare)
}

function PieceContent({ item }: { item: CollageItem }) {
  const bare = item.kind === 'cutout' && item.style?.frame === 'none' && item.style?.bare
  const url = useSignedUrl('collage', bare || item.storage_path)
  if (item.kind === 'text') {
    const len = Math.max(1, ...(item.body ?? '').split(/\s+/).map((w) => w.length))
    return (
      <span data-ink={inkOf(item.style?.color)} style={{ '--len': len } as CSSProperties}>
        {item.body}
      </span>
    )
  }
  return url ? <img src={url} alt="" draggable={false} decoding="async" /> : <span className="piece-pending" data-pending />
}

function TextComposer({ onAdd }: { onAdd: (body: string, ink: Ink) => void }) {
  const [body, setBody] = useState('')
  const [ink, setInk] = useState<Ink>('pink')
  return (
    <form
      className="y2k-panel y2k-text"
      onSubmit={(e) => {
        e.preventDefault()
        if (body.trim()) onAdd(body.trim(), ink)
      }}
    >
      <input className="y2k-field" value={body} maxLength={40} onChange={(e) => setBody(e.target.value)} placeholder="XOXO, te amo, 4ever…" aria-label="Texto" autoFocus />
      <div className="y2k-inks" role="radiogroup" aria-label="Color">
        {inks.map((c) => (
          <button key={c.value} type="button" role="radio" aria-checked={c.value === ink} aria-label={c.name} data-ink={c.value} onClick={() => setInk(c.value)} />
        ))}
      </div>
      <button type="submit" className="y2k-pill y2k-pill--main">
        Agregar
      </button>
    </form>
  )
}

/** Los textos de antes guardaron el color en hex; los nuevos, el nombre de la tinta. */
function inkOf(color?: string): Ink {
  if (color === 'white' || color?.toLowerCase() === '#ffffff') return 'white'
  if (color === 'black' || color === '#1a1a1a') return 'black'
  return 'pink'
}

function pieceLabel(it: CollageItem) {
  const what = it.kind === 'photo' ? 'Foto' : it.kind === 'cutout' ? 'Sticker' : `Texto: ${it.body}`
  return it.locked ? `${what}, fijada` : what
}
