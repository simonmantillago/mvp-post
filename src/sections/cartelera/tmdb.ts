import { supabase } from '../../lib/supabase'

export type FoundMovie = {
  tmdb_id: number
  kind: 'movie' | 'series'
  title: string
  original_title: string
  year: number | null
  overview: string
  poster: string | null
  thumb: string | null
}

/** Busca películas y series en TMDB por la Edge Function `movie-search`. */
export async function searchMovies(q: string): Promise<FoundMovie[]> {
  const { data, error } = await supabase.functions.invoke<{ results: FoundMovie[] }>('movie-search', { body: { q } })
  if (error || !data) throw error ?? new Error('sin respuesta')
  return data.results
}
