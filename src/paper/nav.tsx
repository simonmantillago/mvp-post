import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { formatDay } from './dates'
import './nav.css'

/** Navegar pasando la página. `back` la pasa hacia atrás (de vuelta a la portada). */
export function useTurn() {
  const navigate = useNavigate()
  return (to: string, back = false) => {
    const root = document.documentElement
    if (back) {
      root.classList.add('turn-back')
      window.setTimeout(() => root.classList.remove('turn-back'), 700)
    }
    navigate(to, { viewTransition: true })
  }
}

/**
 * Esquina doblada: vuelve a la portada. Se toca, o se arrastra hacia abajo a la
 * izquierda para despegar la página con el dedo (un solo gesto continuo).
 */
export function DogEar({ to = '/' }: { to?: string }) {
  const turn = useTurn()
  const [peel, setPeel] = useState(0)
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, moved: false }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    const d = (drag.current.x - e.clientX + (e.clientY - drag.current.y)) / 260
    if (Math.abs(d) > 0.03) drag.current.moved = true
    setPeel(Math.max(0, Math.min(1, d)))
  }
  function onPointerUp() {
    const moved = drag.current?.moved
    drag.current = null
    if (!moved || peel > 0.4) turn(to, true)
    else setPeel(0)
  }

  return (
    <button
      type="button"
      className="dogear"
      style={{ '--peel': peel } as CSSProperties}
      aria-label="Volver a la portada"
      onClick={(e) => {
        // Activación sin puntero (lector de pantalla, teclado en escritorio)
        if (e.detail === 0) turn(to, true)
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null
        setPeel(0)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          turn(to, true)
        }
      }}
    >
      <span className="dogear-behind" />
      <span className="dogear-flap" />
    </button>
  )
}

/** Cabezal de cada sección: folio del periódico + nombre de la sección en su propia voz. */
export function Folio({ page, title, children }: { page: number; title: string; children?: ReactNode }) {
  return (
    <header className="folio">
      <p className="folio-line">
        <span className="folio-mast">The MVP Post</span>
        <span>{formatDay(new Date())}</span>
        <span>Pág. {page}</span>
      </p>
      <h1 className="folio-title">{title}</h1>
      {children}
    </header>
  )
}
