import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Song } from '../../lib/types'
import { Icon } from '../../ui/Icon'
import { embedUrl, spotifyUri } from './music'
import { useSpotifyEmbed, youtubeCommand } from './player'
import { SpotifyMark, YouTubeMark } from './BrandMarks'
import type { Turntable } from './turntable3d'

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * El tocadiscos y la canción que suena. La aguja es el play/pausa:
 * bajarla reanuda el reproductor embebido y levantarla lo pausa.
 */
export function Deck({ song, by }: { song: Song; by: string }) {
  const [needle, setNeedle] = useState(false)
  const [mode, setMode] = useState<'loading' | '3d' | '2d'>('loading')
  const canvas = useRef<HTMLCanvasElement>(null)
  const tt = useRef<Turntable | null>(null)
  const spotifyHost = useRef<HTMLDivElement>(null)
  const ytFrame = useRef<HTMLIFrameElement>(null)

  const uri = song.platform === 'spotify' ? spotifyUri(song.url) : null
  const spotify = useSpotifyEmbed(spotifyHost, uri, setNeedle)
  const yt = song.platform === 'youtube' ? embedUrl(song) : null
  // Sin estado de vuelta (YouTube u otro enlace), el disco gira con la aguja
  const spinning = uri ? spotify.playing === true : needle

  // Se llama desde el toque (gesto del usuario) para que Safari deje sonar el embed
  const toggle = () => {
    const next = !needle
    setNeedle(next)
    if (uri) (next ? spotify.play : spotify.pause)()
    else if (yt) youtubeCommand(ytFrame.current, next ? 'playVideo' : 'pauseVideo')
  }
  const toggleRef = useRef(toggle)
  toggleRef.current = toggle

  // Canción nueva: la aguja vuelve a su apoyo
  useEffect(() => setNeedle(false), [song.id])

  // three.js solo se descarga aquí; sin WebGL (o si falla), el plato 2D
  useEffect(() => {
    let alive = true
    import('./turntable3d')
      .then((m) => {
        if (!alive || !canvas.current) return
        if (!m.webglAvailable()) return setMode('2d')
        tt.current = m.createTurntable(canvas.current, { onArmTap: () => toggleRef.current(), reducedMotion: calm() })
        setMode('3d')
      })
      .catch(() => alive && setMode('2d'))
    return () => {
      alive = false
      tt.current?.dispose()
      tt.current = null
    }
  }, [])

  useEffect(() => {
    tt.current?.setCover(song.cover_url, song.title || 'Sin título', `dedicada por ${by}`)
  }, [mode, song.cover_url, song.title, by])
  useEffect(() => tt.current?.setNeedle(needle), [mode, needle])
  useEffect(() => tt.current?.setSpinning(spinning), [mode, spinning])

  const status = spinning ? 'Sonando' : needle ? 'Poniendo la aguja' : 'En pausa'
  const platform = song.platform === 'spotify' ? 'Spotify' : song.platform === 'youtube' ? 'YouTube' : null

  return (
    <section className="deck" aria-label="Tocadiscos">
      <div className={`turntable is-${mode}`} data-pending={mode === 'loading' || undefined}>
        {mode !== '2d' && <canvas ref={canvas} className="turntable-canvas" role="img" aria-label={`Tocadiscos con «${song.title}» en el plato`} />}
        {mode === '2d' && (
          <div className="platter">
            <div className={`record${spinning ? ' is-spinning' : ''}`} key={song.id}>
              <div className="record-label" style={song.cover_url ? ({ '--cover': `url("${song.cover_url}")` } as CSSProperties) : undefined} />
            </div>
            <svg className={`tonearm${needle ? ' is-down' : ''}`} viewBox="0 0 60 220" aria-hidden="true" onClick={toggle}>
              {/* pivote, contrapeso, brazo y cápsula */}
              <circle cx="30" cy="22" r="18" fill="#2a2420" stroke="#8e877b" strokeWidth="3" />
              <circle cx="30" cy="22" r="7" fill="#c9c3b8" />
              <rect x="22" y="0" width="16" height="10" rx="3" fill="#8e877b" />
              <path d="M30 30 L30 170 L42 196" fill="none" stroke="#d8d2c6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="34" y="190" width="18" height="26" rx="3" fill="#1d1a17" stroke="#c9c3b8" strokeWidth="2" transform="rotate(-24 43 203)" />
            </svg>
          </div>
        )}
      </div>

      <div className="needle">
        <button type="button" className={`needle-button${needle ? '' : ' is-play'}`} aria-pressed={needle} aria-label={needle ? 'Pausar' : 'Reproducir'} onClick={toggle}>
          <Icon name={needle ? 'pause' : 'play'} size={22} filled />
        </button>
        <span className="visually-hidden" aria-live="polite">
          {status}
        </span>
      </div>

      <div className="now">
        <div className="now-head">
          <div>
            <p className="now-title">{song.title || 'Sin título'}</p>
            {song.artist && <p className="now-artist">{song.artist}</p>}
          </div>
          {platform && (
            <a className={`now-brand now-brand--${song.platform}`} href={song.url} target="_blank" rel="noreferrer" aria-label={`Abrir en ${platform}`}>
              {song.platform === 'spotify' ? <SpotifyMark /> : <YouTubeMark />}
            </a>
          )}
        </div>
        {song.dedication && <p className="now-dedication">{song.dedication}</p>}
        <p className="now-by">dedicada por {by}</p>

        {/* Los embeds suenan pero no se ven: el tocadiscos es el reproductor */}
        {uri && <div ref={spotifyHost} className="now-player-hidden" aria-hidden="true" />}
        {yt && (
          <div className="now-player-hidden" aria-hidden="true">
            <iframe
              ref={ytFrame}
              key={song.id}
              src={`${yt}?enablejsapi=1&playsinline=1`}
              title={`Reproducir ${song.title}`}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              tabIndex={-1}
            />
          </div>
        )}
        {platform && <p className="now-note">Para escucharla completa, ábrela en {platform}.</p>}

        {!platform && (
          <a className="now-link" href={song.url} target="_blank" rel="noreferrer">
            Abrir la canción
            <Icon name="arrow-right" size={16} />
          </a>
        )}
      </div>
    </section>
  )
}
