import { type ReactNode, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router'
import { formatDay } from './dates'
import { Icon } from '../ui/Icon'
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
 * Deslizar hacia atrás en el iPhone (o el botón atrás del navegador) ya trae su propia animación:
 * ahí la página no se pasa (`html.no-turn`). Solo la flecha ← pasa la página hacia atrás.
 */
let backFromButton = false
window.addEventListener('popstate', () => {
  const root = document.documentElement
  if (!backFromButton) {
    root.classList.add('no-turn')
    window.setTimeout(() => root.classList.remove('no-turn'), 700)
  }
  backFromButton = false
})

/** Qué ruta hay en cada entrada del historial de esta apertura (por el `idx` que guarda react-router). */
const trail = new Map<number, string>()
const historyIdx = () => (window.history.state as { idx?: number } | null)?.idx

/** Se llama una vez en App: va anotando el historial para que «volver» sepa si puede ir hacia atrás. */
export function useHistoryTrail() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    const idx = historyIdx()
    if (typeof idx === 'number') trail.set(idx, pathname)
  }, [pathname])
}

/**
 * Flecha para volver a la portada, arriba a la derecha bajo la isla dinámica.
 * Va en <body> con `position: absolute`: se queda arriba de la página y se va con el scroll.
 */
export function BackButton({ to = '/' }: { to?: string }) {
  const turn = useTurn()
  const navigate = useNavigate()
  function back() {
    // Si se llegó desde ahí, se vuelve atrás en el historial (como deslizar): la portada queda donde se dejó
    // y deslizar hacia atrás después no regresa a la sección
    const idx = historyIdx()
    if (typeof idx === 'number' && idx > 0 && trail.get(idx - 1) === to) {
      backFromButton = true
      const root = document.documentElement
      root.classList.add('turn-back')
      window.setTimeout(() => root.classList.remove('turn-back'), 700)
      navigate(-1)
    } else turn(to, true)
  }
  return createPortal(
    <button type="button" className="back-button" aria-label="Volver a la portada" onClick={back}>
      <Icon name="arrow-left" size={22} />
    </button>,
    document.body,
  )
}

/** Cabezal de cada sección: folio del periódico + nombre de la sección en su propia voz. */
/** Nombre de la sección; con `lines`, cada línea va entera en su renglón (p. ej. «Los Ángeles / de Victoria»). */
export function SectionName({ name, lines }: { name: string; lines?: string[] }) {
  if (!lines) return <>{name}</>
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className="name-line">
          {l}{i < lines.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

export function Folio({ page, title, children }: { page: number; title: ReactNode; children?: ReactNode }) {
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
