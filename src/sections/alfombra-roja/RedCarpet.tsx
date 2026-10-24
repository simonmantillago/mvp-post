import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive, useSignedUrl } from '../../hooks/useData'
import { compressImage, uploadImage } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import type { Photo } from '../../lib/types'
import { formatShort } from '../../paper/dates'
import { Icon } from '../../ui/Icon'
import { darkLeopard, gemRing, leopardTexture, rhinestoneFrame } from '../../ui/leopard'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import { BURST, shutterBurst } from './paparazzi'
import './RedCarpet.css'

type Like = { photo_id: string; user_id: string }

/** Alfombra roja: fotos tomadas en el momento, con flash, que caen como polaroids. */
export default function RedCarpet() {
  const { session, me, isMe, nameOf } = useCouple()
  const { load } = useLive<Photo[]>('photos', () => supabase.from('photos').select('id, author_id, storage_path, caption, created_at').order('created_at', { ascending: false }))
  const { load: likesLoad } = useLive<Like[]>('photo_likes', () => supabase.from('photo_likes').select('photo_id, user_id'))
  const [texture, setTexture] = useState<string>()
  const [developing, setDeveloping] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Photo | null>(null)

  useEffect(() => {
    setTexture(leopardTexture(darkLeopard))
  }, [])

  const photos = load.state === 'ready' ? load.data : []
  const likes = likesLoad.state === 'ready' ? likesLoad.data : []

  // Me encanta: optimista, un toque a la vez por foto
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [likeError, setLikeError] = useState<string | null>(null)
  async function toggleLike(p: Photo) {
    if (p.id in pending) return
    const liked = likes.some((l) => l.photo_id === p.id && isMe(l.user_id))
    setPending((s) => ({ ...s, [p.id]: !liked }))
    setLikeError(null)
    const { error } = liked
      ? await supabase.from('photo_likes').delete().match({ photo_id: p.id, user_id: session.user.id })
      : await supabase.from('photo_likes').insert({ photo_id: p.id, user_id: session.user.id })
    if (error) setLikeError('No se guardó el corazón. Intenta otra vez.')
    setPending(({ [p.id]: _, ...rest }) => rest)
  }

  return (
    <Section id="alfombra" className="red-carpet">
      <div className="carpet-ground" style={texture ? ({ '--leopard': `url(${texture})` } as CSSProperties) : undefined} aria-hidden="true" />
      <div className="section-body">
        <Camera
          userId={session.user.id}
          sounds={me?.sounds_enabled ?? true}
          onShot={(id) => {
            setDeveloping(id)
            window.setTimeout(() => setDeveloping(null), 4000)
          }}
        />

        <section className="memories" aria-labelledby="recuerdos">
          <h2 id="recuerdos" className="memories-title">
            Recuerdos
          </h2>
          {load.state === 'loading' && <PressNote title="Revelando…" />}
          {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
          {load.state === 'ready' && photos.length === 0 && <PressNote title="La alfombra está vacía" body="Tómense la primera foto: aparecerá aquí como polaroid." />}
          <ul className="polaroids">
            {photos.map((p, i) => {
              const savedLiked = likes.some((l) => l.photo_id === p.id && isMe(l.user_id))
              const liked = p.id in pending ? pending[p.id] : savedLiked
              const count = likes.filter((l) => l.photo_id === p.id).length + (liked === savedLiked ? 0 : liked ? 1 : -1)
              return (
                <li key={p.id} style={{ '--tilt': `${((i * 37) % 7) - 3}deg` } as CSSProperties}>
                  <Polaroid photo={p} developing={developing === p.id} by={nameOf(p.author_id)} onOpen={() => setViewing(p)} />
                  <button type="button" className="like" aria-pressed={liked} aria-label={liked ? 'Quitar me encanta' : 'Me encanta'} onClick={() => toggleLike(p)}>
                    <Icon name="heart" filled={liked} size={18} />
                    {count > 0 && <span>{count}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
          {likeError && (
            <p className="section-error" role="alert">
              {likeError}
            </p>
          )}
        </section>
      </div>

      {viewing && <PhotoDialog photo={viewing} mine={isMe(viewing.author_id)} by={nameOf(viewing.author_id)} onClose={() => setViewing(null)} />}
    </Section>
  )
}

function Polaroid({ photo, developing, by, onOpen }: { photo: Photo; developing: boolean; by: string; onOpen: () => void }) {
  const url = useSignedUrl('photos', photo.storage_path)
  return (
    <button type="button" className={`polaroid${developing ? ' is-developing' : ''}`} onClick={onOpen}>
      <span className="polaroid-frame">{url ? <img src={url} alt={photo.caption || `Foto de ${by}`} loading="lazy" decoding="async" /> : null}</span>
      <span className="polaroid-caption">{photo.caption || (developing ? 'revelando…' : 'escribe algo')}</span>
      <span className="polaroid-meta">
        {by} · {formatShort(photo.created_at)}
      </span>
    </button>
  )
}

/** Visor con alas, disparo con flash de corte duro. Si la cámara no abre, se usa la del sistema. */
function Camera({ userId, sounds, onShot }: { userId: string; sounds: boolean; onShot: (photoId: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'off' | 'starting' | 'live' | 'denied' | 'saving'>('off')
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [flash, setFlash] = useState(false)
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([])
  const shooting = useRef(false)
  const [error, setError] = useState<string | null>(null)

  const [wingsMissing, setWingsMissing] = useState(false)
  const frame = rhinestoneFrame()
  const ring = gemRing()

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }
  useEffect(() => {
    // En la app instalada, iOS corta la cámara al salir: se apaga y se vuelve a encender a mano.
    const onHide = () => {
      if (document.visibilityState === 'hidden' && streamRef.current) {
        stop()
        setState('off')
      }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      stop()
    }
  }, [])

  async function start(mode = facing) {
    setState('starting')
    stop()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1600 } }, audio: false })
      streamRef.current = stream
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        streamRef.current = null
        setState('off')
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setState('live')
    } catch {
      setState('denied')
    }
  }

  async function save(blob: Blob) {
    setState('saving')
    setError(null)
    try {
      const path = await uploadImage('photos', await compressImage(blob), userId)
      const { data, error } = await supabase.from('photos').insert({ author_id: userId, storage_path: path, taken_with_flash: true }).select('id').single()
      if (error || !data) throw error
      onShot(data.id)
    } catch {
      setError('La foto no se guardó. Revisa la conexión e intenta de nuevo.')
    }
    setState(streamRef.current ? 'live' : 'off')
  }

  /**
   * Ráfaga de paparazzi: varios flashes desde distintos puntos de la "prensa" (ta-ta-ta-ta),
   * y el último, a pantalla completa, es la foto. Con movimiento reducido: un solo flash.
   */
  function shoot() {
    const video = videoRef.current
    if (!video || state !== 'live' || !video.videoWidth || shooting.current) return
    shooting.current = true
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
    const moments = calm ? [0] : BURST
    if (sounds) shutterBurst(moments)
    moments.slice(0, -1).forEach((ms, i) =>
      window.setTimeout(() => {
        const id = Date.now() + i
        setBursts((b) => [...b, { id, x: 10 + Math.random() * 80, y: 15 + Math.random() * 60 }])
        window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 140)
      }, ms),
    )
    window.setTimeout(() => {
      setFlash(true)
      window.setTimeout(() => setFlash(false), 380)
      capture(video)
      shooting.current = false
    }, moments[moments.length - 1])
  }

  function capture(video: HTMLVideoElement) {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const g = canvas.getContext('2d')!
    if (facing === 'user') {
      g.translate(canvas.width, 0)
      g.scale(-1, 1)
    }
    g.drawImage(video, 0, 0)
    canvas.toBlob((b) => b && save(b), 'image/jpeg', 0.9)
  }

  return (
    <section className="camera" aria-label="Cámara">
      <div className="viewfinder-stage">
        {/* Alas de ángel de pedrería (imagen elegida por Simón): enmarcan el visor desde atrás */}
        <img className="wings" src="/sections/alfombra/alas.webp" alt="" aria-hidden="true" hidden={wingsMissing} onError={() => setWingsMissing(true)} />
      <div className="viewfinder" style={{ '--frame': `url(${frame})` } as CSSProperties}>
        <video ref={videoRef} className={facing === 'user' ? 'is-mirrored' : ''} playsInline muted aria-hidden={state !== 'live'} />
        {state !== 'live' && state !== 'saving' && (
          <div className="viewfinder-off">
            {state === 'denied' ? (
              <>
                <p>No pudimos abrir la cámara.</p>
                <label className="section-button">
                  <Icon name="camera" size={18} /> Usar la cámara del teléfono
                  <input type="file" accept="image/*" capture="user" className="visually-hidden" onChange={(e) => e.target.files?.[0] && save(e.target.files[0])} />
                </label>
              </>
            ) : (
              <button type="button" className="section-button" onClick={() => start()} disabled={state === 'starting'}>
                <Icon name="camera" size={18} /> {state === 'starting' ? 'Encendiendo…' : 'Encender la cámara'}
              </button>
            )}
          </div>
        )}
      </div>

      </div>
      {wingsMissing && <p className="wings-pending">Aquí van las alas de ángel: imagen pendiente.</p>}

      <div className="camera-controls">
        <button
          type="button"
          className="camera-flip"
          aria-label="Cambiar de cámara"
          disabled={state !== 'live'}
          onClick={() => {
            const next = facing === 'user' ? 'environment' : 'user'
            setFacing(next)
            start(next)
          }}
        >
          <Icon name="flip" />
        </button>
        <button type="button" className="shutter" onClick={shoot} disabled={state !== 'live'} style={{ '--ring': `url(${ring})` } as CSSProperties}>
          <span>Flash</span>
        </button>
        <span className="camera-spacer" />
      </div>
      {state === 'saving' && <p className="camera-status">Revelando…</p>}
      {error && (
        <p className="section-error" role="alert">
          {error}
        </p>
      )}
      {bursts.map((b) => (
        <div key={b.id} className="flashbulb" style={{ '--x': `${b.x}%`, '--y': `${b.y}%` } as CSSProperties} aria-hidden="true" />
      ))}
      {flash && <div className="flash" aria-hidden="true" />}
    </section>
  )
}

function PhotoDialog({ photo, mine, by, onClose }: { photo: Photo; mine: boolean; by: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const url = useSignedUrl('photos', photo.storage_path)
  const [caption, setCaption] = useState(photo.caption)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  async function saveCaption() {
    if (caption !== photo.caption) await supabase.from('photos').update({ caption: caption.trim() }).eq('id', photo.id)
  }

  return (
    <dialog ref={ref} className="photo-dialog" onClose={onClose} aria-label={`Foto de ${by}`}>
      <div className="photo-dialog-polaroid">
        {url && <img src={url} alt={photo.caption || `Foto de ${by}`} />}
        {mine ? (
          <input
            className="photo-dialog-caption"
            value={caption}
            maxLength={120}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={saveCaption}
            placeholder="Escribe algo…"
            aria-label="Texto de la polaroid"
          />
        ) : (
          <p className="photo-dialog-caption">{photo.caption || ' '}</p>
        )}
        <p className="polaroid-meta">
          {by} · {formatShort(photo.created_at)}
        </p>
      </div>
      <button
        type="button"
        className="photo-dialog-close"
        onClick={async () => {
          await saveCaption()
          ref.current?.close()
        }}
        aria-label="Cerrar"
      >
        <Icon name="close" />
      </button>
    </dialog>
  )
}
