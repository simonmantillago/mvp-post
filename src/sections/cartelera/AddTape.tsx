import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { offline } from '../../hooks/useData'
import { Icon } from '../../ui/Icon'
import { searchMovies, type FoundMovie } from './tmdb'

type Search = { state: 'idle' } | { state: 'loading' } | { state: 'error' } | { state: 'ready'; results: FoundMovie[] }

/** Buscar en TMDB y poner la cinta en «Debiendo». Si no aparece o la búsqueda falla, se agrega a mano. */
export function AddTape({ userId, onShelf, onAdded, onCancel }: { userId: string; onShelf: Set<number>; onAdded: () => void; onCancel: () => void }) {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState<Search>({ state: 'idle' })
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
    input.current?.closest('.add-tape')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return setSearch({ state: 'idle' })
    const mine = ++seq.current
    setSearch({ state: 'loading' })
    const t = window.setTimeout(async () => {
      try {
        const results = await searchMovies(term)
        if (mine === seq.current) setSearch({ state: 'ready', results })
      } catch {
        if (mine === seq.current) setSearch({ state: 'error' })
      }
    }, 350)
    return () => window.clearTimeout(t)
  }, [q])

  async function add(row: Partial<{ title: string; kind: 'movie' | 'series'; tmdb_id: number; year: number | null; overview: string; poster_url: string | null }>, key: string) {
    setSaving(key)
    setError(null)
    const { error } = await supabase.from('watch_items').insert({ ...row, status: 'want', added_by: userId })
    setSaving(null)
    if (error) return setError('No se pudo agregar. Revisa la conexión.')
    onAdded()
  }

  const term = q.trim()
  return (
    <div className="add-tape" role="search">
      <label className="add-tape-search">
        <span className="section-label">Buscar en el archivo</span>
        <span className="add-tape-field">
          <Icon name="search" size={18} />
          <input
            ref={input}
            className="section-field"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Título de la película o serie"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </span>
      </label>

      <div aria-live="polite">
        {search.state === 'loading' && <p className="add-tape-note">Buscando en el archivo…</p>}
        {search.state === 'error' && (
          <p className="add-tape-note">{offline() ? 'Sin conexión: la búsqueda vuelve cuando haya red.' : 'La búsqueda no respondió.'} Puedes agregarla a mano.</p>
        )}
        {search.state === 'ready' && search.results.length === 0 && <p className="add-tape-note">Nada con «{term}» en el archivo.</p>}
      </div>

      {search.state === 'ready' && search.results.length > 0 && (
        <ul className="found" aria-label="Resultados">
          {search.results.map((m) => {
            const key = `${m.kind}-${m.tmdb_id}`
            const there = onShelf.has(m.tmdb_id)
            return (
              <li key={key}>
                <button
                  type="button"
                  className="found-item"
                  disabled={there || saving !== null}
                  onClick={() => add({ title: m.title, kind: m.kind, tmdb_id: m.tmdb_id, year: m.year, overview: m.overview, poster_url: m.poster }, key)}
                >
                  <span className="found-thumb">{m.thumb ? <img src={m.thumb} alt="" loading="lazy" /> : <Icon name="film" size={20} />}</span>
                  <span className="found-text">
                    <span className="found-title">{m.title}</span>
                    <span className="found-meta">
                      {[m.kind === 'series' ? 'Serie' : 'Película', m.year, m.original_title !== m.title && m.original_title].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="found-action">{there ? 'Ya está' : saving === key ? '…' : <Icon name="plus" size={20} label="Agregar" />}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {term.length >= 2 && search.state !== 'loading' && (
        <div className="add-tape-manual">
          <span className="add-tape-note">¿No aparece? Agrégala sin portada:</span>
          <div className="add-tape-actions">
            <button type="button" className="section-button section-button--ghost" disabled={saving !== null} onClick={() => add({ title: term, kind: 'movie' }, 'manual')}>
              Como película
            </button>
            <button type="button" className="section-button section-button--ghost" disabled={saving !== null} onClick={() => add({ title: term, kind: 'series' }, 'manual')}>
              Como serie
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="section-error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="add-tape-cancel" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  )
}
