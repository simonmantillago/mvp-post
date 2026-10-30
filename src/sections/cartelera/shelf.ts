import type { WatchItem } from '../../lib/types'

export type Tab = WatchItem['status']
export const tabs: [Tab, string][] = [
  ['want', 'Debiendo'],
  ['watching', 'Viendo'],
  ['watched', 'Vistas'],
]

const spineHues = ['#c2255c', '#2f6fd6', '#e8a64b', '#3ddc97', '#8b5cf6', '#ff4f8b', '#22a3a3']

/** El color del lomo sale del id: la cinta conserva su color al cambiar de estante. */
export function hueOf(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return spineHues[h % spineHues.length]
}

export type Turn = { id: string | undefined; via: 'turno' | 'ruleta' }
