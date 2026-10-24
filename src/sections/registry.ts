import type { SectionId } from '../lib/types'

export type SectionEntry = {
  id: Exclude<SectionId, 'portada'>
  path: string
  name: string
  page: number
  /** Línea del pliego en la portada */
  teaser: string
}

// Portada, notificaciones (`activity.section`) y la columna ("Sigue en pág. N") leen de aquí.
export const sections: SectionEntry[] = [
  { id: 'y2k', path: '/y2k', name: 'Estilo · Y2K', page: 2, teaser: 'Nuestro scrapbook, recortado y pegado' },
  { id: 'alfombra', path: '/alfombra-roja', name: 'Alfombra roja', page: 3, teaser: 'Recuerdos con flash' },
  { id: 'vinilos', path: '/vinilos', name: 'Los vinilos de Big', page: 4, teaser: 'Lo que suena en el penthouse' },
  { id: 'cartelera', path: '/cartelera', name: 'Cartelera', page: 5, teaser: 'Qué vemos esta noche' },
  { id: 'cartas', path: '/cartas', name: 'Cartas al editor', page: 6, teaser: 'Correspondencia privada' },
]

export function sectionById(id: SectionId | null | undefined) {
  return sections.find((s) => s.id === id)
}
