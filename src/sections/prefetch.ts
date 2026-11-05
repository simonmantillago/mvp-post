import { fetchLive, readLive } from '../lib/liveCache'
import { signedUrl } from '../lib/images'
import type { CollageItem, Photo, SectionId, Song, WatchItem } from '../lib/types'
import { live, type LiveSpec } from './queries'

type Id = Exclude<SectionId, 'portada'> | 'suscripcion'

/** Código de cada sección (las mismas promesas que usa `lazy` en App.tsx). */
export const loaders = {
  y2k: () => import('./y2k/Y2K'),
  alfombra: () => import('./alfombra-roja/RedCarpet'),
  vinilos: () => import('./vinilos/Vinyls'),
  cartelera: () => import('./cartelera/Cartelera'),
  cartas: () => import('./cartas/Letters'),
  suscripcion: () => import('./suscripcion/Subscription'),
} satisfies Record<Id, () => Promise<unknown>>

const data: Partial<Record<Id, LiveSpec[]>> = {
  y2k: [live.collage],
  alfombra: [live.photos, live.photoLikes],
  vinilos: [live.songs],
  cartelera: [live.watchItems, live.watchRatings, live.watchSpins],
  cartas: [live.messages],
}

/** Pide la imagen para que el service worker la deje guardada; no se pinta en ningún lado. */
function warm(url: string | null | undefined) {
  if (!url) return
  const img = new Image()
  img.decoding = 'async'
  img.src = url
}

const images: Partial<Record<Id, () => void>> = {
  y2k: () => {
    for (const it of readLive<CollageItem[]>(live.collage.cache) ?? []) {
      if (it.kind !== 'photo' && it.kind !== 'cutout') continue
      const path = (it.kind === 'cutout' && it.style?.frame === 'none' && it.style?.bare) || it.storage_path
      if (path) signedUrl('collage', path).then(warm, () => {})
    }
  },
  alfombra: () => {
    for (const p of (readLive<Photo[]>(live.photos.cache) ?? []).slice(0, 6)) signedUrl('photos', p.storage_path).then(warm, () => {})
  },
  vinilos: () => {
    import('./vinilos/turntable3d').catch(() => {})
    for (const s of (readLive<Song[]>(live.songs.cache) ?? []).slice(0, 12)) warm(s.cover_url)
  },
  cartelera: () => {
    for (const w of (readLive<WatchItem[]>(live.watchItems.cache) ?? []).slice(0, 18)) warm(w.poster_url)
  },
}

const last = new Map<string, number>()

/**
 * Adelanta la entrada a una sección: su código, sus datos y (con `withImages`) las fotos que va a pintar.
 * Se llama al tocar el titular, mientras pasa la página. Como mucho una vez cada 20 s por sección.
 */
export function prefetchSection(id: Id, { withImages = true } = {}) {
  const tag = `${id}:${withImages}`
  const now = Date.now()
  if (now - (last.get(tag) ?? 0) < 20_000) return
  last.set(tag, now)
  loaders[id]().catch(() => {})
  const specs = data[id] ?? []
  const done = Promise.all(specs.map((s) => fetchLive(s.cache, s.query)))
  if (withImages) {
    images[id]?.() // con lo que ya estaba guardado, sin esperar
    done.then(() => images[id]?.(), () => {})
  }
}

/** Con la portada ya quieta: deja listos el código y los datos de todas las secciones (sin bajar fotos). */
export function prefetchAllQuietly() {
  const run = () => (Object.keys(loaders) as Id[]).forEach((id) => prefetchSection(id, { withImages: false }))
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 })
  else window.setTimeout(run, 1500)
}
