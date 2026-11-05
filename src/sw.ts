/// <reference lib="webworker" />
// Service worker propio (vite-plugin-pwa en modo injectManifest): caché de la app + Web Push.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// Fotos guardadas en el teléfono: las de Supabase (buckets privados) y las portadas de Spotify, YouTube y TMDB.
// Las rutas de Storage son únicas (uuid) y no cambian, así que la llave es la ruta sin el token del enlace firmado:
// aunque el enlace sea nuevo, la foto sale de aquí sin volver a bajarla.
const IMAGES = 'imagenes-v1'
const MAX_IMAGES = 400
const IMAGE_HOSTS = /(^|\.)(scdn\.co|spotifycdn\.com|ytimg\.com|tmdb\.org)$/

function imageKey(url: URL): string | null {
  if (url.pathname.startsWith('/storage/v1/object/sign/')) return url.origin + url.pathname
  if (IMAGE_HOSTS.test(url.hostname)) return url.href
  return null
}

registerRoute(
  ({ request, url }) => request.method === 'GET' && request.destination === 'image' && imageKey(url) !== null,
  async ({ request, url }) => {
    const key = imageKey(url)!
    const cache = await caches.open(IMAGES)
    const hit = await cache.match(key)
    if (hit) return hit
    try {
      // Se pide con CORS para poder guardarla con su tamaño real (una respuesta opaca no se sabe si salió bien)
      const res = await fetch(url.href, { mode: 'cors', credentials: 'omit' })
      if (res.ok) {
        await cache.put(key, res.clone())
        trim(cache)
      }
      return res
    } catch {
      return fetch(request)
    }
  },
)

async function trim(cache: Cache) {
  const keys = await cache.keys()
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) await cache.delete(k)
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

type PushPayload = { title?: string; body?: string; url?: string; tag?: string; badge?: number }

// iOS exige mostrar una notificación por cada push (userVisibleOnly); si no, revoca el permiso.
self.addEventListener('push', (event) => {
  const data: PushPayload = event.data?.json() ?? {}
  const tasks: Promise<unknown>[] = [
    self.registration.showNotification(data.title ?? 'The MVP Post', {
      body: data.body,
      icon: '/icons/icon-192.png',
      tag: data.tag,
      data: { url: data.url ?? '/' },
    }),
  ]
  if (typeof data.badge === 'number' && 'setAppBadge' in self.navigator) {
    tasks.push(data.badge > 0 ? self.navigator.setAppBadge(data.badge) : self.navigator.clearAppBadge())
  }
  event.waitUntil(Promise.all(tasks))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data?.url as string) ?? '/', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows[0]
      if (open) {
        await open.focus()
        return open.navigate(url)
      }
      return self.clients.openWindow(url)
    })(),
  )
})
