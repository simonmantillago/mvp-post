// Edge Function `spotify-search`: busca canciones en Spotify para «Dedicar canción».
// Usa el flujo Client Credentials (sin que ellos inicien sesión en Spotify); el client secret
// vive solo aquí. Solo responde a la pareja: valida el JWT de la sesión y `is_member()`.
//
// Secretos (npx supabase secrets set ...):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
// SUPABASE_URL y SUPABASE_ANON_KEY los pone Supabase solo.
// Desplegar con: npx supabase functions deploy spotify-search
//
// Development Mode desde feb. 2026: `limit` máximo 10 y sin `popularity` en los tracks.

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// El token de Spotify dura una hora; se reutiliza mientras la instancia siga viva.
let token: { value: string; expires: number } | null = null

async function spotifyToken() {
  if (token && token.expires > Date.now() + 60_000) return token.value
  const id = Deno.env.get('SPOTIFY_CLIENT_ID')
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  if (!id || !secret) throw new Error('faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 }
  return token.value
}

type SpotifyTrack = {
  id: string
  name: string
  uri: string
  duration_ms: number
  explicit: boolean
  external_urls: { spotify: string }
  artists: { name: string }[]
  album: { name: string; images: { url: string; width: number }[] }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // El gateway ya verificó la firma del JWT; aquí se confirma que es uno de los dos.
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
  if (q.length < 2) return json({ tracks: [] })

  try {
    const url = `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(q)}`
    let res = await fetch(url, { headers: { Authorization: `Bearer ${await spotifyToken()}` } })
    if (res.status === 401) {
      token = null
      res = await fetch(url, { headers: { Authorization: `Bearer ${await spotifyToken()}` } })
    }
    if (!res.ok) {
      console.error('spotify search', res.status, await res.text())
      return json({ error: 'spotify', status: res.status }, 502)
    }
    const data = (await res.json()) as { tracks?: { items: SpotifyTrack[] } }
    const tracks = (data.tracks?.items ?? []).map((t) => {
      const images = [...t.album.images].sort((a, b) => b.width - a.width)
      return {
        id: t.id,
        uri: t.uri,
        url: t.external_urls.spotify ?? `https://open.spotify.com/track/${t.id}`,
        title: t.name,
        artist: t.artists.map((a) => a.name).join(', '),
        album: t.album.name,
        cover: images[0]?.url ?? null,
        thumb: images.find((i) => i.width <= 300)?.url ?? images[0]?.url ?? null,
        duration_ms: t.duration_ms,
        explicit: t.explicit,
      }
    })
    return json({ tracks })
  } catch (e) {
    console.error('spotify-search', e)
    return json({ error: 'spotify' }, 502)
  }
})
