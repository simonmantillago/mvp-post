import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
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
 * Flecha para volver a la portada, arriba a la derecha bajo la isla dinámica.
 * Va en <body> con `position: absolute`: se queda arriba de la página y se va con el scroll.
 */
export function BackButton({ to = '/' }: { to?: string }) {
  const turn = useTurn()
  return createPortal(
    <button type="button" className="back-button" aria-label="Volver a la portada" onClick={() => turn(to, true)}>
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
