// Edge Function `movie-search`: busca películas y series en TMDB para la Cartelera.
// Devuelve título en español, año, sinopsis y portada. La llave vive solo aquí.
// Solo responde a la pareja: valida el JWT de la sesión y `is_member()`.
//
// Secretos (npx supabase secrets set ...):
//   TMDB_API_KEY   (la «API Key» v3 o el «API Read Access Token»; se distinguen solos)
// SUPABASE_URL y SUPABASE_ANON_KEY los pone Supabase solo.
// Desplegar con: npx supabase functions deploy movie-search

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

type TmdbResult = {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  release_date?: string
  first_air_date?: string
  overview?: string
  poster_path?: string | null
  popularity?: number
}

const IMG = 'https://image.tmdb.org/t/p'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const auth = req.headers.get('Authorization') ?? ''
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: member, error: memberError } = await db.rpc('is_member')
  if (memberError || member !== true) return json({ error: 'forbidden' }, 403)

  let q = ''
  try {
    q = String(((await req.json()) as { q?: unknown }).q ?? '').trim().slice(0, 100)
  } catch {
    return json({ error: 'bad request' }, 400)
  }
  if (q.length < 2) return json({ results: [] })

  const key = Deno.env.get('TMDB_API_KEY')
  if (!key) return json({ error: 'missing key' }, 503)

  // El token de lectura es un JWT (empieza por eyJ) y va en el encabezado; la llave v3, en la URL.
  const bearer = key.startsWith('eyJ')
  const params = new URLSearchParams({ query: q, language: 'es-MX', include_adult: 'false', page: '1' })
  if (!bearer) params.set('api_key', key)

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?${params}`, {
      headers: bearer ? { Authorization: `Bearer ${key}` } : {},
    })
    if (!res.ok) {
      console.error('tmdb', res.status, await res.text())
      return json({ error: 'upstream' }, 502)
    }
    const data = (await res.json()) as { results: TmdbResult[] }
    const results = data.results
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 12)
      .map((r) => {
        const date = r.release_date || r.first_air_date || ''
        return {
          tmdb_id: r.id,
          kind: r.media_type === 'tv' ? 'series' : 'movie',
          title: r.title || r.name || r.original_title || r.original_name || '',
          original_title: r.original_title || r.original_name || '',
          year: date ? Number(date.slice(0, 4)) : null,
          overview: r.overview ?? '',
          poster: r.poster_path ? `${IMG}/w342${r.poster_path}` : null,
          thumb: r.poster_path ? `${IMG}/w154${r.poster_path}` : null,
        }
      })
    return json({ results })
  } catch (e) {
    console.error(e)
    return json({ error: 'upstream' }, 502)
  }
})
