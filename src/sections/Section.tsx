import { useEffect, type ReactNode } from 'react'
import { useMarkSeen } from '../hooks/useData'
import type { SectionId } from '../lib/types'
import { BackButton, Folio } from '../paper/nav'
import { sectionById } from './registry'
import './Section.css'

/** Pliego de sección: activa los tokens de su mundo, marca la sección como vista y pone la esquina doblada. */
export function Section({ id, className = '', header, children }: { id: Exclude<SectionId, 'portada'>; className?: string; header?: ReactNode; children: ReactNode }) {
  const entry = sectionById(id)!
  useMarkSeen(id)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.section = id
    return () => {
      delete root.dataset.section
    }
  }, [id])

  return (
    <main className={`section section--${id} ${className}`} data-section={id}>
      <BackButton />
      <Folio page={entry.page} title={entry.name}>
        {header}
      </Folio>
      {children}
    </main>
  )
}
