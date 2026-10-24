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

const cache = new Map<string, { url: string; expires: number }>()

/** Signed URL de ~1 h, cacheada en memoria. */
export async function signedUrl(bucket: string, path: string) {
  const key = `${bucket}/${path}`
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now() + 60_000) return hit.url
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  if (error || !data) throw error ?? new Error('Sin URL')
  cache.set(key, { url: data.signedUrl, expires: Date.now() + 3600_000 })
  return data.signedUrl
}
