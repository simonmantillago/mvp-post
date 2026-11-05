import { supabase } from './supabase'

/**
 * Lo último que se vio de cada sección, guardado en el teléfono: al entrar se pinta al instante
 * y `useLive` lo actualiza por detrás. Se borra al cerrar sesión.
 */
type Result = { data: unknown; error: { message: string } | null }
export type LiveQuery = () => PromiseLike<Result>

const PREFIX = `live:v1:${import.meta.env.DEV && new URLSearchParams(location.search).has('demo') ? 'demo:' : ''}`
const memory = new Map<string, unknown>()
const inflight = new Map<string, Promise<Result>>()

export function readLive<T>(key: string): T | undefined {
  if (memory.has(key)) return memory.get(key) as T
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return undefined
    const data = JSON.parse(raw) as T
    memory.set(key, data)
    return data
  } catch {
    return undefined
  }
}

export function writeLive(key: string, data: unknown) {
  memory.set(key, data)
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data))
  } catch {
    // sin espacio o almacenamiento bloqueado: queda solo en memoria
  }
}

/**
 * Corre la consulta una sola vez aunque la pidan la precarga y la sección a la vez.
 * Si sale bien, queda guardada.
 */
export function fetchLive(key: string, query: LiveQuery): Promise<Result> {
  const running = inflight.get(key)
  if (running) return running
  const p = Promise.resolve(query())
    .then((res) => {
      if (!res.error) writeLive(key, res.data)
      return res
    })
    .catch((e): Result => ({ data: null, error: { message: e instanceof Error ? e.message : 'Error de red' } }))
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

export function clearLive() {
  memory.clear()
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith('live:')) localStorage.removeItem(k)
    }
  } catch {
    // nada que borrar
  }
}

supabase.auth.onAuthStateChange((event) => {
  if (event !== 'SIGNED_OUT') return
  clearLive()
  // las fotos guardadas por el service worker (ver src/sw.ts)
  caches?.delete('imagenes-v1').catch(() => {})
})
