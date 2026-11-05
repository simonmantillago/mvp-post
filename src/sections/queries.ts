import { supabase } from '../lib/supabase'
import type { LiveQuery } from '../lib/liveCache'

/**
 * Consultas de entrada de cada sección. Las usan la sección (`useLive` con `cache`) y la precarga
 * de la portada: así se piden una sola vez y quedan guardadas con la misma llave.
 */
export const live = {
  collage: { table: 'collage_items', cache: 'collage', query: () => supabase.from('collage_items').select('*').order('z', { ascending: true }) },
  photos: {
    table: 'photos',
    cache: 'photos',
    query: () => supabase.from('photos').select('id, author_id, storage_path, caption, effect, created_at').order('created_at', { ascending: false }),
  },
  photoLikes: { table: 'photo_likes', cache: 'photo_likes', query: () => supabase.from('photo_likes').select('photo_id, user_id') },
  songs: {
    table: 'songs',
    cache: 'songs',
    query: () =>
      supabase.from('songs').select('id, author_id, url, platform, title, artist, dedication, cover_url, created_at').order('created_at', { ascending: false }),
  },
  watchItems: { table: 'watch_items', cache: 'watch_items', query: () => supabase.from('watch_items').select('*').order('created_at', { ascending: false }) },
  watchRatings: { table: 'watch_ratings', cache: 'watch_ratings', query: () => supabase.from('watch_ratings').select('item_id, user_id, rating, comment') },
  watchSpins: {
    table: 'watch_spins',
    cache: 'watch_spins',
    query: () => supabase.from('watch_spins').select('id, chooser, spun_by, created_at').order('created_at', { ascending: false }).limit(5),
  },
  messages: {
    table: 'messages',
    cache: 'messages',
    query: () => supabase.from('messages').select('id, author_id, kind, body, created_at, read_at').order('created_at', { ascending: false }).limit(50),
  },
} satisfies Record<string, { table: string; cache: string; query: LiveQuery }>

export type LiveSpec = (typeof live)[keyof typeof live]
