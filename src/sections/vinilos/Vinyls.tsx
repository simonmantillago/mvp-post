import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive } from '../../hooks/useData'
import { supabase } from '../../lib/supabase'
import type { Song } from '../../lib/types'
import { formatShort } from '../../paper/dates'
import { Icon } from '../../ui/Icon'
import { leatherTexture, walnutTexture } from '../../ui/leopard'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import { Deck } from './Deck'
import { detectPlatform, lookup, searchSpotify, type FoundTrack } from './music'
import './Vinyls.css'

type Filter = 'all' | 'mine' | 'theirs'

/** Los vinilos de Big: el tocadiscos arriba y la pila de fundas dedicadas abajo. */
export default function Vinyls() {
  const { session, isMe, nameOf, partner } = useCouple()
  const { load } = useLive<Song[]>('songs', () =>
    supabase.from('songs').select('id, author_id, url, platform, title, artist, dedication, cover_url, created_at').order('created_at', { ascending: false }),
  )
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)
  const [wood, setWood] = useState<{ walnut: string; leather: string }>()
  useEffect(() => {
    setWood({ walnut: walnutTexture(), leather: leatherTexture() })
  }, [])

  const songs = load.state === 'ready' ? load.data : []
  const current = songs.find((s) => s.id === currentId) ?? songs[0]
  const shown = songs.filter((s) => (filter === 'all' ? true : filter === 'mine' ? isMe(s.author_id) : !isMe(s.author_id)))

  return (
    <Section id="vinilos">
      <div className="section-body vinyls" style={wood ? ({ '--walnut': `url(${wood.walnut})`, '--leather-tex': `url(${wood.leather})` } as CSSProperties) : undefined}>
        {current ? (
          <Deck song={current} by={nameOf(current.author_id)} />
        ) : (
          load.state === 'ready' && <PressNote title="El tocadiscos espera" body={`Dedícale la primera canción a ${partner?.display_name ?? 'tu lector'}.`} />
        )}

        {load.state === 'loading' && <PressNote title="Sacando los discos…" />}
        {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}

        {adding ? (
          <AddSong
            userId={session.user.id}
            onDone={(id) => {
              setAdding(false)
              if (id) {
                setCurrentId(id)
                document.querySelector('.deck')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
              }
            }}
          />
        ) : (
          <div className="vinyls-add">
            <button type="button" className="vinyls-add-button" onClick={() => setAdding(true)}>
              <Icon name="plus" size={18} /> Añadir
            </button>
          </div>
        )}

        {songs.length > 0 && (
          <section className="pile" aria-labelledby="pila">
            <div className="pile-head">
              <h2 id="pila" className="pile-title">
                Colección
              </h2>
              <p className="pile-count">
                {songs.length} {songs.length === 1 ? 'disco' : 'discos'}
              </p>
            </div>
            <div className="pile-filters" role="group" aria-label="Filtrar">
                {(
                  [
                    ['all', 'Todas'],
                    ['mine', 'Mías'],
                    ['theirs', `De ${partner?.display_name.split(' ')[0] ?? 'ti'}`],
                  ] as [Filter, string][]
                ).map(([v, label]) => (
                  <button key={v} type="button" className="pile-chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>
                    {label}
                  </button>
                ))}
            </div>

            <ol className="sleeves">
              {shown.map((s) => (
                <li key={s.id}>
                  <button type="button" className="record-row" aria-current={s.id === current?.id} onClick={() => setCurrentId(s.id)}>
                    {/* funda con el disco detrás: el de la que suena sale de la funda */}
                    <span className="record-row-art" aria-hidden="true">
                      <span className="record-row-disc" />
                      <span className="record-row-sleeve">{s.cover_url ? <img src={s.cover_url} alt="" loading="lazy" decoding="async" /> : <Icon name="play" />}</span>
                    </span>
                    <span className="record-row-text">
                      <span className="record-row-title">{s.title || 'Sin título'}</span>
                      {s.artist && <span className="record-row-artist">{s.artist}</span>}
                      <span className="record-row-meta">
                        {formatShort(s.created_at)} · de {nameOf(s.author_id).split(' ')[0]}
                      </span>
                    </span>
                    {s.id === current?.id && <span className="record-row-now">sonando</span>}
                  </button>
                </li>
              ))}
            </ol>
            {shown.length === 0 && <p className="pile-empty">Nada en esta pila todavía.</p>}
          </section>
        )}
      </div>
    </Section>
  )
}

type Search = { state: 'idle' } | { state: 'loading' } | { state: 'ready'; tracks: FoundTrack[] } | { state: 'error' } | { state: 'offline' }

/** Buscador de Spotify con espera de 300 ms entre teclas; descarta respuestas viejas. */
function useSpotifySearch(q: string) {
  const [search, setSearch] = useState<Search>({ state: 'idle' })
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    addEventListener('online', on)
    addEventListener('offline', off)
    return () => {
      removeEventListener('online', on)
      removeEventListener('offline', off)
    }
  }, [])
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return setSearch({ state: 'idle' })
    if (!online) return setSearch({ state: 'offline' })
    let alive = true
    setSearch({ state: 'loading' })
    const t = setTimeout(() => {
      searchSpotify(term)
        .then((tracks) => alive && setSearch({ state: 'ready', tracks }))
        .catch(() => alive && setSearch({ state: navigator.onLine ? 'error' : 'offline' }))
    }, 300)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q, online])
  return search
}

function AddSong({ userId, onDone }: { userId: string; onDone: (id?: string) => void }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<FoundTrack | null>(null)
  const [manual, setManual] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [cover, setCover] = useState<string | undefined>()
  const [dedication, setDedication] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const search = useSpotifySearch(picked ? '' : q)

  function pick(t: FoundTrack) {
    setPicked(t)
    setUrl(t.url)
    setTitle(t.title)
    setArtist(t.artist)
    setCover(t.cover ?? undefined)
    setManual(false)
    setError(null)
  }

  function unpick() {
    setPicked(null)
    setUrl('')
    setTitle('')
    setArtist('')
    setCover(undefined)
  }

  async function onUrlBlur() {
    if (!url.trim()) return
    const info = await lookup(url.trim())
    if (info.title && !title) setTitle(info.title)
    if (info.artist && !artist) setArtist(info.artist)
    if (info.cover) setCover(info.cover)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!url.trim() || !title.trim()) {
      setError('Elige una canción de la búsqueda o pega su enlace.')
      if (!picked) setManual(true)
      return
    }
    setBusy(true)
    setError(null)
    const { data, error } = await supabase
      .from('songs')
      .insert({
        author_id: userId,
        url: url.trim(),
        platform: detectPlatform(url),
        title: title.trim(),
        artist: artist.trim(),
        dedication: dedication.trim(),
        cover_url: cover ?? null,
      })
      .select('id')
      .single()
    setBusy(false)
    if (error) return setError('No se pudo guardar la canción. Revisa la conexión e inténtalo otra vez.')
    onDone((data as { id: string } | null)?.id)
  }

  return (
    <form className="add-song" onSubmit={submit} aria-labelledby="dedicar">
      <h2 id="dedicar" className="add-song-title">
        Dedicar canción
      </h2>

      {picked ? (
        <div className="picked">
          <span className="sleeve-art picked-art">{picked.thumb ? <img src={picked.thumb} alt="" /> : <Icon name="play" />}</span>
          <span className="sleeve-text">
            <span className="sleeve-title">{picked.title}</span>
            <span className="sleeve-meta">{picked.artist}</span>
          </span>
          <button type="button" className="picked-change" onClick={unpick}>
            Cambiar
          </button>
        </div>
      ) : (
        <div className="finder">
          <label>
            <span className="section-label">Buscar en Spotify</span>
            <input
              className="section-field"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Canción o artista"
              aria-controls="resultados"
            />
          </label>
          <div id="resultados" className="finder-results" aria-live="polite" aria-busy={search.state === 'loading'}>
            {search.state === 'loading' && <p className="finder-note">Buscando en la discoteca…</p>}
            {search.state === 'offline' && <p className="finder-note">Sin conexión. La búsqueda vuelve cuando vuelva la señal.</p>}
            {search.state === 'error' && <p className="finder-note finder-note--error">Spotify no respondió. Inténtalo de nuevo o pega el enlace.</p>}
            {search.state === 'ready' && search.tracks.length === 0 && <p className="finder-note">Nada con ese nombre. Prueba con el artista.</p>}
            {search.state === 'ready' && search.tracks.length > 0 && (
              <ul className="finder-list">
                {search.tracks.map((t) => (
                  <li key={t.id}>
                    <button type="button" className="finder-item" onClick={() => pick(t)}>
                      <span className="sleeve-art">{t.thumb ? <img src={t.thumb} alt="" loading="lazy" decoding="async" /> : <Icon name="play" />}</span>
                      <span className="sleeve-text">
                        <span className="sleeve-title">{t.title}</span>
                        <span className="sleeve-meta">
                          {t.artist}
                          {t.album ? ` · ${t.album}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!picked && (
        <div className="manual">
          <button type="button" className="manual-toggle" aria-expanded={manual} onClick={() => setManual((m) => !m)}>
            {manual ? 'Mejor la busco' : '¿No está? Pega el enlace de Spotify o YouTube'}
          </button>
          {manual && (
            <div className="manual-fields">
              <label>
                <span className="section-label">Enlace</span>
                <input className="section-field" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} onBlur={onUrlBlur} placeholder="https://open.spotify.com/track/…" />
              </label>
              <label>
                <span className="section-label">Canción</span>
                <input className="section-field" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                <span className="section-label">Artista</span>
                <input className="section-field" value={artist} onChange={(e) => setArtist(e.target.value)} />
              </label>
            </div>
          )}
        </div>
      )}

      <label>
        <span className="section-label">Dedicatoria</span>
        <textarea className="section-field add-song-dedication" rows={3} value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder="Esta me recuerda a ti…" />
      </label>
      {error && (
        <p className="section-error" role="alert">
          {error}
        </p>
      )}
      <div className="add-song-actions">
        <button type="button" className="section-button section-button--ghost" onClick={() => onDone()}>
          Cancelar
        </button>
        <button type="submit" className="section-button" disabled={busy}>
          {busy ? 'Guardando…' : 'Dedicar canción'}
        </button>
      </div>
    </form>
  )
}
