import { supabase } from '../lib/supabase'
import type { Edition } from '../lib/types'
import { useLive } from '../hooks/useData'

const cols = 'id, number, author_id, headline, body, cover_path, cover_caption, continues_to, published_at, created_at'

/** Ediciones publicadas, la más reciente primero. */
export function usePublishedEditions() {
  return useLive<Edition[]>('editions', () =>
    supabase.from('editions').select(cols).not('published_at', 'is', null).order('number', { ascending: false }),
  )
}

export function useEdition(number: number) {
  return useLive<Edition | null>(
    'editions',
    () => supabase.from('editions').select(cols).eq('number', number).maybeSingle(),
    [number],
  )
}

/** Borradores propios (solo los ve su autor por RLS). */
export function useDrafts() {
  return useLive<Edition[]>('editions', () =>
    supabase.from('editions').select(cols).is('published_at', null).order('created_at', { ascending: false }),
  )
}

/** Párrafos separados por línea en blanco; una línea que empieza con "> " es cita destacada. */
export function blocks(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('> ') ? { quote: true, text: p.slice(2).trim() } : { quote: false, text: p }))
}
