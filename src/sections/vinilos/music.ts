import type { Song } from '../../lib/types'
import { supabase } from '../../lib/supabase'

export function detectPlatform(url: string): Song['platform'] {
  if (/open\.spotify\.com|spotify\.link/.test(url)) return 'spotify'
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  return 'other'
}

export function embedUrl(song: Pick<Song, 'url' | 'platform'>) {
  try {
    const u = new URL(song.url)
    if (song.platform === 'spotify') {
      const m = u.pathname.match(/\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/)
      return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null
    }
    if (song.platform === 'youtube') {
      const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.split('/').pop()
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

/** Título y portada vía oEmbed; si falla, se escriben a mano. */
export async function lookup(url: string): Promise<{ title?: string; artist?: string; cover?: string }> {
  const platform = detectPlatform(url)
  const endpoint =
    platform === 'spotify'
      ? `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
      : platform === 'youtube'
        ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
        : null
  if (!endpoint) return {}
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return {}
    const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string }
    return { title: data.title, artist: platform === 'youtube' ? data.author_name : undefined, cover: data.thumbnail_url }
  } catch {
    return {}
  }
}

export type FoundTrack = {
  id: string
  uri: string
  url: string
  title: string
  artist: string
  album: string
  cover: string | null
  thumb: string | null
  duration_ms: number
}

/** Busca en Spotify por la Edge Function `spotify-search` (máx. 10 resultados). */
export async function searchSpotify(q: string): Promise<FoundTrack[]> {
  const { data, error } = await supabase.functions.invoke<{ tracks: FoundTrack[] }>('spotify-search', { body: { q } })
  if (error || !data) throw error ?? new Error('sin respuesta')
  return data.tracks
}

/** `spotify:track:…` a partir del enlace guardado, para el EmbedController. */
export function spotifyUri(url: string) {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/)
  return m ? `spotify:${m[1]}:${m[2]}` : null
}
