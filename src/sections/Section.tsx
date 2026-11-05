import { useEffect, type ReactNode } from 'react'
import { useMarkSeen } from '../hooks/useData'
import type { SectionId } from '../lib/types'
import { BackButton, Folio, SectionName } from '../paper/nav'
import { sectionById } from './registry'
import { Curtain } from './Curtain'
import './Section.css'

/** Pliego de sección: activa los tokens de su mundo, marca la sección como vista y pone la esquina doblada. */
/** `ready`: si se pasa, la primera vez (sin nada guardado) el telón de la sección la cubre hasta que esté armada. */
export function Section({
  id,
  className = '',
  header,
  ready,
  children,
}: {
  id: Exclude<SectionId, 'portada'>
  className?: string
  header?: ReactNode
  ready?: boolean
  children: ReactNode
}) {
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
      {ready !== undefined && <Curtain id={id} ready={ready} />}
      <Folio page={entry.page} title={<SectionName name={entry.name} lines={entry.nameLines} />}>
        {header}
      </Folio>
      {children}
    </main>
  )
}
