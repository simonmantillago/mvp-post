import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive } from '../../hooks/useData'
import { supabase } from '../../lib/supabase'
import type { Song } from '../../lib/types'
import { formatShort } from '../../paper/dates'
import { Icon } from '../../ui/Icon'
import { WaxSeal } from '../../ui/Marks'
import { leatherTexture, walnutTexture } from '../../ui/leopard'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import { detectPlatform, embedUrl, lookup } from './music'
import './Vinyls.css'

type Filter = 'all' | 'mine' | 'theirs'

/** Los vinilos de Big: el tocadiscos arriba y la pila de fundas dedicadas abajo. */
export default function Vinyls() {
  const { session, isMe, isHer, nameOf, partner } = useCouple()
  const { load } = useLive<Song[]>('songs', () =>
    supabase.from('songs').select('id, author_id, url, platform, title, artist, dedication, cover_url, created_at').order('created_at', { ascending: false }),
  )
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [wood, setWood] = useState<{ walnut: string; leather: string }>()
  useEffect(() => {
    setWood({ walnut: walnutTexture(), leather: leatherTexture() })
  }, [])

  const songs = load.state === 'ready' ? load.data : []
  const current = songs.find((s) => s.id === currentId) ?? songs[0]
  const shown = songs.filter((s) => (filter === 'all' ? true : filter === 'mine' ? isMe(s.author_id) : !isMe(s.author_id)))
  const embed = current ? embedUrl(current) : null

  return (
    <Section id="vinilos">
      <div className="section-body vinyls" style={wood ? ({ '--walnut': `url(${wood.walnut})`, '--leather-tex': `url(${wood.leather})` } as CSSProperties) : undefined}>
        <section className="deck" aria-label="Tocadiscos">
          <div className="platter">
            <div className={`record${current ? ' is-spinning' : ''}`} key={current?.id}>
              <div className="record-label" style={current?.cover_url ? ({ '--cover': `url("${current.cover_url}")` } as CSSProperties) : undefined} />
            </div>
            <svg className={`tonearm${current ? ' is-down' : ''}`} viewBox="0 0 60 220" aria-hidden="true">
              {/* pivote, contrapeso, brazo y cápsula */}
              <circle cx="30" cy="22" r="18" fill="#2a2420" stroke="#8e877b" strokeWidth="3" />
              <circle cx="30" cy="22" r="7" fill="#c9c3b8" />
              <rect x="22" y="0" width="16" height="10" rx="3" fill="#8e877b" />
              <path d="M30 30 L30 170 L42 196" fill="none" stroke="#d8d2c6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="34" y="190" width="18" height="26" rx="3" fill="#1d1a17" stroke="#c9c3b8" strokeWidth="2" transform="rotate(-24 43 203)" />
            </svg>
          </div>

          {current ? (
            <div className="now">
              <p className="now-title">{current.title || 'Sin título'}</p>
              {current.artist && <p className="now-artist">{current.artist}</p>}
              {current.dedication && <p className="now-dedication">{current.dedication}</p>}
              <p className="now-by">dedicada por {nameOf(current.author_id)}</p>
              {embed && (
                <div className={`now-player now-player--${current.platform}${playerReady ? ' is-ready' : ''}`}>
                  <p className="now-player-wait">{playerReady ? `${current.title}${current.artist ? ` · ${current.artist}` : ''}` : 'Poniendo la aguja…'}</p>
                  <iframe
                    key={current.id}
                    src={embed}
                    title={`Reproducir ${current.title}`}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    loading="lazy"
                    onLoad={() => setPlayerReady(true)}
                  />
                </div>
              )}
              <a className="now-link" href={current.url} target="_blank" rel="noreferrer">
                {current.platform === 'spotify' ? 'Abrir en Spotify' : current.platform === 'youtube' ? 'Abrir en YouTube' : 'Abrir la canción'}
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          ) : (
            load.state === 'ready' && <PressNote title="El tocadiscos espera" body={`Dedícale la primera canción a ${partner?.display_name ?? 'tu lector'}.`} />
          )}
        </section>

        {load.state === 'loading' && <PressNote title="Sacando los discos…" />}
        {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}

        {adding ? (
          <AddVinyl userId={session.user.id} onDone={() => setAdding(false)} />
        ) : (
          <button type="button" className="section-button vinyls-add" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} /> Dedicar un vinilo
          </button>
        )}

        {songs.length > 0 && (
          <section className="pile" aria-labelledby="pila">
            <div className="pile-head">
              <h2 id="pila" className="pile-title">
                La pila de discos
              </h2>
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
            </div>

            <ol className="sleeves">
              {shown.map((s) => (
                <li key={s.id}>
                  <button type="button" className="sleeve" aria-current={s.id === current?.id} onClick={() => {
                    setCurrentId(s.id)
                    setPlayerReady(false)
                  }}>
                    <span className="sleeve-art">{s.cover_url ? <img src={s.cover_url} alt="" loading="lazy" decoding="async" /> : <Icon name="play" />}</span>
                    <span className="sleeve-text">
                      <span className="sleeve-title">{s.title || 'Sin título'}</span>
                      <span className="sleeve-meta">
                        {s.artist ? `${s.artist} · ` : ''}
                        {formatShort(s.created_at)}
                      </span>
                    </span>
                    <WaxSeal initial={nameOf(s.author_id).charAt(0)} her={isHer(s.author_id)} size={38} label={`Dedicada por ${nameOf(s.author_id)}`} />
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

function AddVinyl({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [cover, setCover] = useState<string | undefined>()
  const [dedication, setDedication] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onUrlBlur() {
    if (!url.trim()) return
    const info = await lookup(url.trim())
    if (info.title && !title) setTitle(info.title)
    if (info.artist && !artist) setArtist(info.artist)
    if (info.cover) setCover(info.cover)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('songs').insert({
      author_id: userId,
      url: url.trim(),
      platform: detectPlatform(url),
      title: title.trim(),
      artist: artist.trim(),
      dedication: dedication.trim(),
      cover_url: cover ?? null,
    })
    setBusy(false)
    if (error) return setError('No se pudo guardar el vinilo. Revisa el enlace y la conexión.')
    onDone()
  }

  return (
    <form className="add-vinyl" onSubmit={submit}>
      <label>
        <span className="section-label">Enlace de Spotify o YouTube</span>
        <input className="section-field" type="url" inputMode="url" required value={url} onChange={(e) => setUrl(e.target.value)} onBlur={onUrlBlur} placeholder="https://open.spotify.com/track/…" />
      </label>
      <label>
        <span className="section-label">Canción</span>
        <input className="section-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        <span className="section-label">Artista</span>
        <input className="section-field" value={artist} onChange={(e) => setArtist(e.target.value)} />
      </label>
      <label>
        <span className="section-label">Dedicatoria</span>
        <textarea className="section-field add-vinyl-dedication" rows={3} value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder="Esta me recuerda a ti…" />
      </label>
      {error && (
        <p className="section-error" role="alert">
          {error}
        </p>
      )}
      <div className="add-vinyl-actions">
        <button type="button" className="section-button section-button--ghost" onClick={onDone}>
          Cancelar
        </button>
        <button type="submit" className="section-button" disabled={busy}>
          {busy ? 'Guardando…' : 'Poner en la pila'}
        </button>
      </div>
    </form>
  )
}
