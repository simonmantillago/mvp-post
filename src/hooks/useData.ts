import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { cachedSignedUrl, signedUrl } from '../lib/images'
import { fetchLive, readLive, writeLive, type LiveQuery } from '../lib/liveCache'
import type { SectionId } from '../lib/types'

export type Load<T> =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; data: T; stale?: string }

/**
 * Consulta + recarga cuando cambia la tabla (Realtime), al volver a la app y al recuperar la red.
 * Si falla y ya había datos, se conservan (`stale` explica por qué). Las respuestas viejas se descartan.
 * Con `cache`, arranca con lo último que se vio (guardado en el teléfono) y lo actualiza por detrás.
 */
export function useLive<T>(table: string, query: LiveQuery, deps: unknown[] = [], opts: { cache?: string } = {}) {
  const key = opts.cache
  const [load, setLoad] = useState<Load<T>>(() => {
    const hit = key ? readLive<T>(key) : undefined
    return hit === undefined ? { state: 'loading' } : { state: 'ready', data: hit }
  })
  const queryRef = useRef(query)
  queryRef.current = query
  const seq = useRef(0)

  const refresh = useCallback(async () => {
    const mine = ++seq.current
    let res: { data: unknown; error: { message: string } | null }
    if (key) res = await fetchLive(key, () => queryRef.current())
    else {
      try {
        res = await queryRef.current()
      } catch (e) {
        res = { data: null, error: { message: e instanceof Error ? e.message : 'Error de red' } }
      }
    }
    if (mine !== seq.current) return
    if (res.error) {
      const message = offline() ? 'Sin conexión: esto es lo último que se cargó.' : 'No se pudo actualizar. Intenta de nuevo en un momento.'
      setLoad((prev) => (prev.state === 'ready' ? { ...prev, stale: message } : { state: 'error', message }))
    } else setLoad({ state: 'ready', data: res.data as T })
  }, [key])

  useEffect(() => {
    refresh()
    let timer = 0
    const soon = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(refresh, 150)
    }
    const channel = supabase
      .channel(`live-${table}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, soon)
      .subscribe()
    const onVisible = () => document.visibilityState === 'visible' && soon()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', soon)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', soon)
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, refresh, ...deps])

  /** Cambio local inmediato (p. ej. la fila recién insertada) sin esperar a volver a consultar. */
  const mutate = useCallback((fn: (data: T) => T) => {
    seq.current++
    setLoad((prev) => {
      if (prev.state !== 'ready') return prev
      const data = fn(prev.data)
      if (key) writeLive(key, data)
      return { ...prev, data }
    })
  }, [key])

  return { load, refresh, mutate }
}

export function offline() {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

export function useSignedUrl(bucket: string, path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => (path ? cachedSignedUrl(bucket, path) : null))
  useEffect(() => {
    let alive = true
    const hit = path ? cachedSignedUrl(bucket, path) : null
    setUrl(hit)
    if (path && !hit) signedUrl(bucket, path).then((u) => alive && setUrl(u)).catch(() => alive && setUrl(null))
    return () => {
      alive = false
    }
  }, [bucket, path])
  return url
}

/** Pendientes por sección (para los sellos "Nuevo"). */
export function useUnseen() {
  const [unseen, setUnseen] = useState<Partial<Record<SectionId, number>>>({})
  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc('unseen_by_section')
    const next: Partial<Record<SectionId, number>> = {}
    for (const row of (data as { section: SectionId; unseen: number }[] | null) ?? []) next[row.section] = row.unseen
    setUnseen(next)
  }, [])
  useEffect(() => {
    refresh()
    const channel = supabase
      .channel('unseen')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity' }, () => refresh())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])
  return unseen
}

/** Marca una sección como vista y limpia el badge del ícono si ya no queda nada. */
export function useMarkSeen(section: SectionId) {
  useEffect(() => {
    supabase
      .from('section_reads')
      .upsert({ section, seen_at: new Date().toISOString() }, { onConflict: 'user_id,section' })
      .then(async () => {
        const { data } = await supabase.rpc('unseen_by_section')
        const total = ((data as { unseen: number }[] | null) ?? []).reduce((n, r) => n + r.unseen, 0)
        const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
        if (total === 0) nav.clearAppBadge?.().catch(() => {})
        else nav.setAppBadge?.(total).catch(() => {})
      })
  }, [section])
}
