import { useEffect, useRef, useState } from 'react'
import type { SectionId } from '../lib/types'
import { SectionName } from '../paper/nav'
import { sectionById } from './registry'
import './Curtain.css'

type Id = Exclude<SectionId, 'portada'>

/** La línea de cada mundo mientras se arma (las mismas que decía su aviso de carga). */
const LINES: Record<Id, string> = {
  y2k: 'Buscando las tijeras…',
  alfombra: 'Revelando…',
  vinilos: 'Sacando los discos…',
  cartelera: 'Rebobinando…',
  cartas: 'Abriendo el correo…',
}

const MAX_WAIT_IMAGES = 3500
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Fotos y piezas que ya se ven en pantalla y todavía no terminan de llegar. */
function stillPainting(root: HTMLElement) {
  if (root.querySelector('[data-pending]')) return true
  for (const img of root.querySelectorAll('img')) {
    if (img.complete) continue
    const r = img.getBoundingClientRect()
    if (r.bottom > 0 && r.top < innerHeight && r.width > 0) return true
  }
  return false
}

/**
 * Telón de la sección: solo aparece cuando no había nada guardado (primera vez o tras cerrar sesión).
 * Se va cuando llegan los datos y se pintan las fotos que caben en la pantalla, o a los 3,5 s.
 */
export function Curtain({ id, ready }: { id: Id; ready: boolean }) {
  const [phase, setPhase] = useState<'off' | 'on' | 'leaving'>(() => (ready ? 'off' : 'on'))
  const self = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'on' || !ready) return
    const section = self.current?.closest('main') as HTMLElement | null
    const started = Date.now()
    let timer = 0
    const check = () => {
      if (section && stillPainting(section) && Date.now() - started < MAX_WAIT_IMAGES) timer = window.setTimeout(check, 120)
      else setPhase('leaving')
    }
    timer = window.setTimeout(check, 60)
    return () => window.clearTimeout(timer)
  }, [phase, ready])

  // Se desmonta al terminar el fundido (380 ms en Curtain.css); con un temporizador y no con animationend,
  // que no llega si la animación no corre (pestaña en segundo plano, movimiento reducido)
  useEffect(() => {
    if (phase !== 'leaving') return
    const t = window.setTimeout(() => setPhase('off'), calm() ? 0 : 400)
    return () => window.clearTimeout(t)
  }, [phase])

  if (phase === 'off') return null
  const entry = sectionById(id)!
  return (
    <div
      ref={self}
      className={`curtain curtain--${id}${phase === 'leaving' ? ' is-leaving' : ''}`}
      role="status"
    >
      <div className="curtain-plate">
        <p className="curtain-name" aria-hidden="true">
          <SectionName name={entry.name} lines={entry.nameLines} />
        </p>
        <Motif id={id} />
        <p className="curtain-line">{LINES[id]}</p>
      </div>
    </div>
  )
}

/** Un objeto de cada mundo, no un spinner. */
function Motif({ id }: { id: Id }) {
  if (id === 'vinilos') return <span className="curtain-record" aria-hidden="true" />
  if (id === 'cartelera')
    return (
      <span className="curtain-bulbs" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </span>
    )
  // En el Collage el motivo es el cursor de SMS al final de la línea (CSS)
  if (id === 'y2k') return null
  return <span className="curtain-rule" aria-hidden="true" />
}
