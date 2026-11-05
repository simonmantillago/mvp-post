import { supabase } from './supabase'

/** Reduce una imagen a máx. `max` px de lado. JPEG para fotos; WebP si conserva transparencia. */
export async function compressImage(file: Blob, { max = 1600, keepAlpha = false } = {}): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const type = keepAlpha ? 'image/webp' : 'image/jpeg'
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), type, 0.82),
  )
}

/** Sube a <bucket>/<uid>/<uuid>.<ext> y devuelve la ruta. */
export async function uploadImage(bucket: 'photos' | 'collage' | 'avatars', blob: Blob, userId: string) {
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: false })
  if (error) throw error
  return path
}

type Signed = { url: string; expires: number }
const TTL = 3600
const STORE = 'signed:v1'
const cache = new Map<string, Signed>()

// Los enlaces sobreviven a cerrar la app (duran ~1 h): al volver, las fotos se piden igual y el
// service worker las sirve desde el teléfono sin esperar a Supabase.
try {
  const saved = JSON.parse(localStorage.getItem(STORE) ?? '{}') as Record<string, Signed>
  for (const [k, v] of Object.entries(saved)) if (v.expires > Date.now() + 60_000) cache.set(k, v)
} catch {
  // sin almacenamiento: solo memoria
}
let saveTimer = 0
function persist() {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      const out: Record<string, Signed> = {}
      for (const [k, v] of cache) if (!v.url.startsWith('blob:') && v.expires > Date.now()) out[k] = v
      localStorage.setItem(STORE, JSON.stringify(out))
    } catch {
      // lleno o bloqueado
    }
  }, 300)
}

/** El enlace ya conocido, sin esperar (para pintar la foto en el primer render). */
export function cachedSignedUrl(bucket: string, path: string) {
  const hit = cache.get(`${bucket}/${path}`)
  return hit && hit.expires > Date.now() + 60_000 ? hit.url : null
}

// Todas las fotos que se piden en el mismo instante van en una sola llamada (createSignedUrls).
type Waiter = { resolve: (u: string) => void; reject: (e: unknown) => void }
const pending = new Map<string, Map<string, Waiter[]>>()

function flush(bucket: string) {
  const batch = pending.get(bucket)
  pending.delete(bucket)
  if (!batch) return
  const paths = [...batch.keys()]
  supabase.storage
    .from(bucket)
    .createSignedUrls(paths, TTL)
    .then(({ data, error }) => {
      const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]))
      for (const [path, waiters] of batch) {
        const url = byPath.get(path)
        if (url) {
          cache.set(`${bucket}/${path}`, { url, expires: Date.now() + TTL * 1000 })
          waiters.forEach((w) => w.resolve(url))
        } else waiters.forEach((w) => w.reject(error ?? new Error('Sin URL')))
      }
      persist()
    }, (e) => batch.forEach((ws) => ws.forEach((w) => w.reject(e))))
}

/** Signed URL de ~1 h, cacheada en memoria y en el teléfono. */
export function signedUrl(bucket: string, path: string): Promise<string> {
  const hit = cachedSignedUrl(bucket, path)
  if (hit) return Promise.resolve(hit)
  return new Promise((resolve, reject) => {
    let batch = pending.get(bucket)
    if (!batch) {
      batch = new Map()
      pending.set(bucket, batch)
      queueMicrotask(() => window.setTimeout(() => flush(bucket), 0))
    }
    const list = batch.get(path) ?? []
    list.push({ resolve, reject })
    batch.set(path, list)
  })
}

/** Lo que uno mismo acaba de subir ya está en el teléfono: se muestra esa copia en vez de pedir enlace y bajarla otra vez. */
export function seedLocalUrl(bucket: string, path: string, blob: Blob) {
  cache.set(`${bucket}/${path}`, { url: URL.createObjectURL(blob), expires: Number.MAX_SAFE_INTEGER })
}
