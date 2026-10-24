import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive, useSignedUrl } from '../../hooks/useData'
import { compressImage, uploadImage } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import type { CollageItem } from '../../lib/types'
import { Icon } from '../../ui/Icon'
import { leopardTexture, pinkLeopard } from '../../ui/leopard'
import { RubberStamp } from '../../ui/Marks'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import { stickers } from './stickers'
import './Y2K.css'

type Geo = Pick<CollageItem, 'x' | 'y' | 'width' | 'rotation'>
type Pt = { x: number; y: number }
type Gesture = { id: string; start: Geo; pts: Pt[]; center?: Pt; handle: boolean; moved: boolean }

const textColors = [
  { name: 'Rosa chicle', value: '#ff3ea5' },
  { name: 'Menta', value: '#3ddc97' },
  { name: 'Negro', value: '#1a1a1a' },
  { name: 'Blanco', value: '#ffffff' },
]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Estilo · Y2K: collage compartido. Un dedo mueve, dos dedos escalan y giran, el sello lo deja quieto. */
export default function Y2K() {
  const { session } = useCouple()
  const { load, refresh } = useLive<CollageItem[]>('collage_items', () => supabase.from('collage_items').select('*').order('z', { ascending: true }))
  const canvasRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(360)
  const [local, setLocal] = useState<Record<string, Geo>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [menuPage, setMenuPage] = useState(0)
  const [panel, setPanel] = useState<'none' | 'stickers' | 'text' | 'cutout'>('none')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [texture, setTexture] = useState<string>()
  const [menuAt, setMenuAt] = useState<{ x: number; y: number; above: boolean } | null>(null)
  const [menuW, setMenuW] = useState(260)
  const itemEls = useRef(new Map<string, HTMLDivElement>())
  const menuRef = useRef<HTMLDivElement>(null)
  const focusMenu = useRef(false)

  useEffect(() => {
    setTexture(leopardTexture(pinkLeopard, 360, 11))
  }, [])
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

  const items = (load.state === 'ready' ? load.data : []).map((it) => ({ ...it, ...local[it.id] }))
  const sel = items.find((i) => i.id === selected) ?? null
  const maxZ = items.reduce((m, i) => Math.max(m, i.z), 0)
  const height = Math.max(W * 1.5, ...items.map((i) => (i.y + i.width * 1.4) * W + 120))

  // ---- gestos: todo el estado vivo en refs; React solo pinta ----------------
  const pointers = useRef(new Map<number, Pt>())
  const gesture = useRef<Gesture | null>(null)
  const live = useRef<Geo | null>(null)

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
    setSelected(id)
    setMenuPage(0)
    setMenuAt(null)
    if (item.locked) return placeMenu(id)
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.clear()
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    live.current = null
    snapshot(id, handle)
  }

  function onCanvasMove(e: React.PointerEvent) {
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
      .select('id')
      .single()
    if (error || !data) return setError('No se pudo pegar. Revisa la conexión.')
    await refresh()
    setSelected(data.id)
    placeMenu(data.id)
  }

  async function addImage(file: Blob | undefined, kind: 'photo' | 'cutout') {
    if (!file) return
    setPanel('none')
    setBusy(kind === 'photo' ? 'Pegando la foto…' : 'Pegando el recorte…')
    try {
      const keepAlpha = kind === 'cutout' || file.type === 'image/png' || file.type === 'image/webp'
      const path = await uploadImage('collage', await compressImage(file, { max: 1400, keepAlpha }), session.user.id)
      await add({ kind, storage_path: path, width: kind === 'photo' ? 0.5 : 0.4 })
    } catch {
      setError('No se pudo subir la imagen. Intenta con otra.')
    }
    setBusy(null)
  }

  async function pasteCutout() {
    try {
      for (const entry of await navigator.clipboard.read()) {
        const type = entry.types.find((t) => t.startsWith('image/'))
        if (type) return addImage(await entry.getType(type), 'cutout')
      }
      setError('No hay ninguna imagen copiada. Copia una imagen o elige un PNG.')
    } catch {
      setError('Este teléfono no dejó leer lo copiado. Elige el PNG desde tus fotos.')
    }
  }

  // ---- acciones de la burbuja -----------------------------------------------
  async function act(action: 'front' | 'back' | 'lock' | 'unlock' | 'duplicate' | 'delete' | 'straighten' | 'bigger' | 'smaller') {
    if (!sel) return
    setError(null)
    if (action === 'delete') {
      const { error } = await supabase.from('collage_items').delete().eq('id', sel.id)
      if (error) return setError('No se pudo quitar esa pieza.')
      if (sel.storage_path) await supabase.storage.from('collage').remove([sel.storage_path])
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
    }[action]
    const { error } = await supabase.from('collage_items').update(patch).eq('id', sel.id)
    if (error) setError('No se pudo aplicar el cambio.')
    await refresh()
    placeMenu(sel.id)
  }

  const menuButton = (label: string, action: Parameters<typeof act>[0], extra = '') => (
    <button type="button" className={extra} onClick={() => act(action)}>
      {label}
    </button>
  )

  return (
    <Section id="y2k" className="y2k">
      <div className="y2k-tools" role="toolbar" aria-label="Agregar al collage">
        <label className="y2k-tool">
          <Icon name="image" size={18} /> Foto
          <input type="file" accept="image/*" className="visually-hidden" onChange={(e) => addImage(e.target.files?.[0], 'photo')} />
        </label>
        <button type="button" className="y2k-tool" aria-expanded={panel === 'stickers'} onClick={() => setPanel(panel === 'stickers' ? 'none' : 'stickers')}>
          <Icon name="star" size={18} /> Sticker
        </button>
        <button type="button" className="y2k-tool" aria-expanded={panel === 'cutout'} onClick={() => setPanel(panel === 'cutout' ? 'none' : 'cutout')}>
          <Icon name="scissors" size={18} /> Recorte
        </button>
        <button type="button" className="y2k-tool" aria-expanded={panel === 'text'} onClick={() => setPanel(panel === 'text' ? 'none' : 'text')}>
          <Icon name="type" size={18} /> Texto
        </button>
      </div>

      {panel === 'stickers' && (
        <div className="y2k-sheet" role="group" aria-label="Hoja de stickers">
          {Object.entries(stickers).map(([id, s]) => (
            <button
              key={id}
              type="button"
              className="y2k-sticker-pick"
              aria-label={s.label}
              onClick={() => {
                setPanel('none')
                add({ kind: 'sticker', sticker_id: id, width: id === 'xoxo-tag' ? 0.4 : 0.28 })
              }}
            >
              {s.svg}
            </button>
          ))}
        </div>
      )}
      {panel === 'cutout' && (
        <div className="y2k-cutout" role="group" aria-label="Agregar un recorte">
          <button type="button" className="section-button" onClick={pasteCutout}>
            Pegar imagen copiada
          </button>
          <label className="section-button section-button--ghost">
            Elegir PNG
            <input type="file" accept="image/png,image/webp" className="visually-hidden" onChange={(e) => addImage(e.target.files?.[0], 'cutout')} />
          </label>
        </div>
      )}
      {panel === 'text' && (
        <TextComposer
          onAdd={(body, color) => {
            setPanel('none')
            add({ kind: 'text', body, style: { color }, width: 0.6 })
          }}
        />
      )}

      {busy && (
        <p className="y2k-status" role="status">
          {busy}
        </p>
      )}
      {error && (
        <p className="section-error y2k-status" role="alert">
          {error}
        </p>
      )}

      <div
        ref={canvasRef}
        className="y2k-canvas"
        style={{ height, ...(texture ? { '--leopard': `url(${texture})` } : {}) } as CSSProperties}
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        onPointerCancel={onCanvasUp}
      >
        {load.state === 'loading' && <PressNote title="Buscando las tijeras…" />}
        {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
        {load.state === 'ready' && items.length === 0 && (
          <PressNote title="Página en blanco" body="Pega la primera foto o un sticker. Muévelo con un dedo, gíralo con dos y fíjalo cuando quede perfecto." />
        )}

        {items.map((it) => (
          <div
            key={it.id}
            data-piece={it.id}
            ref={(el) => {
              if (el) itemEls.current.set(it.id, el)
              else itemEls.current.delete(it.id)
            }}
            className={`piece piece--${it.kind}${it.id === selected ? ' is-selected' : ''}${it.locked ? ' is-locked' : ''}`}
            style={{ left: it.x * W, top: it.y * W, width: it.width * W, zIndex: it.z, rotate: `${it.rotation}deg`, '--w': `${it.width * W}px` } as CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={pieceLabel(it)}
            aria-pressed={it.id === selected}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight + - [ ]"
            onKeyDown={(e) => onPieceKey(e, it)}
          >
            <PieceContent item={it} />
            {it.locked && (
              <span className="piece-stamp" aria-hidden="true">
                <RubberStamp>Fijado</RubberStamp>
              </span>
            )}
            {it.id === selected && !it.locked && (
              <span className="piece-handle" aria-hidden="true">
                <Icon name="flip" size={14} />
              </span>
            )}
          </div>
        ))}

        {sel && menuAt && (() => {
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
              {sel.locked ? (
                menuButton('Desfijar', 'unlock')
              ) : menuPage === 0 ? (
                <>
                  {menuButton('Al frente', 'front')}
                  {menuButton('Fijar', 'lock')}
                  {menuButton('Duplicar', 'duplicate')}
                  {menuButton('Eliminar', 'delete', 'is-destructive')}
                  <button type="button" aria-label="Más opciones" onClick={() => setMenuPage(1)}>
                    <Icon name="chevron" size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button type="button" aria-label="Volver" onClick={() => setMenuPage(0)}>
                    <Icon name="chevron-left" size={16} />
                  </button>
                  {menuButton('Más grande', 'bigger')}
                  {menuButton('Más pequeña', 'smaller')}
                  {menuButton('Enderezar', 'straighten')}
                  {menuButton('Al fondo', 'back')}
                </>
              )}
            </div>
          )
        })()}
      </div>
    </Section>
  )
}

function PieceContent({ item }: { item: CollageItem }) {
  const url = useSignedUrl('collage', item.storage_path)
  if (item.kind === 'sticker') return stickers[item.sticker_id ?? '']?.svg ?? null
  if (item.kind === 'text') return <span style={{ color: item.style?.color }}>{item.body}</span>
  return url ? <img src={url} alt="" draggable={false} decoding="async" /> : <span className="piece-pending" />
}

function TextComposer({ onAdd }: { onAdd: (body: string, color: string) => void }) {
  const [body, setBody] = useState('')
  const [color, setColor] = useState(textColors[0].value)
  return (
    <form
      className="y2k-text"
      onSubmit={(e) => {
        e.preventDefault()
        if (body.trim()) onAdd(body.trim(), color)
      }}
    >
      <input className="section-field" value={body} maxLength={40} onChange={(e) => setBody(e.target.value)} placeholder="YOLO, XOXO, te amo…" aria-label="Texto" autoFocus />
      <div className="y2k-colors" role="radiogroup" aria-label="Color">
        {textColors.map((c) => (
          <button key={c.value} type="button" role="radio" aria-checked={c.value === color} aria-label={c.name} style={{ background: c.value }} onClick={() => setColor(c.value)} />
        ))}
      </div>
      <button type="submit" className="section-button">
        Pegar
      </button>
    </form>
  )
}

function pieceLabel(it: CollageItem) {
  const what = it.kind === 'photo' ? 'Foto' : it.kind === 'cutout' ? 'Recorte' : it.kind === 'sticker' ? stickers[it.sticker_id ?? '']?.label ?? 'Sticker' : `Texto: ${it.body}`
  return it.locked ? `${what}, fijada` : what
}
