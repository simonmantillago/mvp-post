import type { PhotoEffect } from '../../lib/types'

/** Efectos de revelado de las polaroids, en el orden del carrete. Se aplican con CSS (.fx-<id>): la foto guardada no cambia. */
export const EFFECTS: { id: PhotoEffect; name: string }[] = [
  { id: 'original', name: 'Original' },
  { id: 'grano', name: 'Grano' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'flash', name: 'Flash' },
  { id: 'noir', name: 'Noir' },
  { id: 'digicam', name: 'Digicam 2003' },
]

/** Sello de fecha de cámara digital: MM DD 'AA. */
export function digicamStamp(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)} ${p(d.getDate())} '${p(d.getFullYear() % 100)}`
}
