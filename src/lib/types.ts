export type SectionId = 'portada' | 'y2k' | 'alfombra' | 'vinilos' | 'cartelera' | 'cartas'

export type Profile = {
  id: string
  display_name: string
  nick: string
  avatar_path: string | null
  sounds_enabled: boolean
  muted_sections: string[]
}

export type Edition = {
  id: string
  number: number
  author_id: string
  headline: string
  body: string
  cover_path: string | null
  cover_caption: string
  continues_to: Exclude<SectionId, 'portada'> | null
  published_at: string | null
  created_at: string
}

export type CollageItem = {
  id: string
  author_id: string
  kind: 'photo' | 'cutout' | 'sticker' | 'text'
  storage_path: string | null
  sticker_id: string | null
  body: string | null
  style: Record<string, string>
  bg_removed: boolean
  x: number
  y: number
  width: number
  rotation: number
  z: number
  locked: boolean
  locked_by: string | null
  created_at: string
}

export type PhotoEffect = 'original' | 'grano' | 'vintage' | 'flash' | 'noir' | 'digicam'

export type Photo = {
  id: string
  author_id: string
  storage_path: string
  caption: string
  effect: PhotoEffect
  created_at: string
}

export type Song = {
  id: string
  author_id: string
  url: string
  platform: 'spotify' | 'youtube' | 'other'
  title: string
  artist: string
  dedication: string
  cover_url: string | null
  created_at: string
}

export type WatchItem = {
  id: string
  title: string
  kind: 'movie' | 'series'
  status: 'want' | 'watching' | 'watched'
  season: number | null
  episode: number | null
  poster_url: string | null
  tmdb_id: number | null
  year: number | null
  overview: string
  note: string
  added_by: string
  picked_by: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export type WatchRating = {
  item_id: string
  user_id: string
  rating: number
  comment: string
}

export type WatchSpin = {
  id: string
  chooser: string
  spun_by: string
  created_at: string
}

export type Message = {
  id: number
  author_id: string
  kind: 'text' | 'nudge'
  body: string
  created_at: string
  read_at: string | null
}
