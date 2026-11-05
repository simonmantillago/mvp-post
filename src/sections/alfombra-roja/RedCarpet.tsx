import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive, useSignedUrl } from '../../hooks/useData'
import { live } from '../queries'
import { compressImage, uploadImage } from '../../lib/images'
import { supabase } from '../../lib/supabase'
import type { Photo, PhotoEffect } from '../../lib/types'
import { formatShort } from '../../paper/dates'
import { Icon } from '../../ui/Icon'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import { digicamStamp, EFFECTS } from './effects'
import { BURST, prepareShutter, shutterBurst } from './paparazzi'
import './RedCarpet.css'

// Texturas fijas en public/ (antes se dibujaban en canvas al entrar y trababan la entrada en el iPhone)
const TEX = {
  grain: '/sections/alfombra/grano.webp',
  frame: '/sections/alfombra/marco-pedreria.webp',
  ring: '/sections/alfombra/aro-pedreria.webp',
  glint: '/sections/alfombra/destello.webp',
}

type Like = { photo_id: string; user_id: string }

/** Los Ángeles de Victoria (antes Alfombra roja): fotos tomadas en el momento, con flash, que caen como polaroids. */
export default function RedCarpet() {
  const { session, me, isMe, nameOf } = useCouple()
  const { load, refresh } = useLive<Photo[]>(live.photos.table, live.photos.query, [], live.photos)
  const { load: likesLoad } = useLive<Like[]>(live.photoLikes.table, live.photoLikes.query, [], live.photoLikes)
  const [developing, setDeveloping] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Photo | null>(null)

  // Efecto elegido en el carrete: se ve al instante en la polaroid y en el carrete, hasta que llega la fila guardada
  const [chosen, setChosen] = useState<Record<string, PhotoEffect>>({})
  const photos = (load.state === 'ready' ? load.data : []).map((p) => (p.id in chosen ? { ...p, effect: chosen[p.id] } : p))
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
    <Section id="alfombra" className="red-carpet" ready={load.state !== 'loading'}>
      <div className="carpet-ground" aria-hidden="true" />
      <div className="section-body" style={{ '--grain': `url(${TEX.grain})` } as CSSProperties}>
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

      {viewing && (
        <PhotoDialog
          photo={photos.find((p) => p.id === viewing.id) ?? viewing}
          mine={isMe(viewing.author_id)}
          by={nameOf(viewing.author_id)}
          onEffect={(effect) => setChosen((c) => ({ ...c, [viewing.id]: effect }))}
          onEffectFailed={(previous) => setChosen((c) => ({ ...c, [viewing.id]: previous }))}
          onDeleted={() => {
            setViewing(null)
            refresh()
          }}
          onClose={() => setViewing(null)}
        />
      )}
    </Section>
  )
}

function Polaroid({ photo, developing, by, onOpen }: { photo: Photo; developing: boolean; by: string; onOpen: () => void }) {
  const url = useSignedUrl('photos', photo.storage_path)
  return (
    <button type="button" className={`polaroid${developing ? ' is-developing' : ''}`} onClick={onOpen}>
      <PhotoFrame url={url} alt={photo.caption || `Foto de ${by}`} effect={photo.effect} date={photo.created_at} lazy />
      <span className="polaroid-caption">{photo.caption || (developing ? 'revelando…' : 'escribe algo')}</span>
      <span className="polaroid-meta">
        {by} · {formatShort(photo.created_at)}
      </span>
    </button>
  )
}

/** La foto con su efecto de revelado (filtro + capa .fx-<id>); Digicam lleva la fecha estampada. */
function PhotoFrame({ url, alt, effect, date, lazy }: { url: string | null; alt: string; effect: PhotoEffect; date: string; lazy?: boolean }) {
  return (
    <span className={`polaroid-frame fx-${effect}`}>
      {url ? <img src={url} alt={alt} loading={lazy ? 'lazy' : undefined} decoding="async" /> : null}
      {effect === 'digicam' && (
        <span className="fx-stamp" aria-hidden="true">
          {digicamStamp(date)}
        </span>
      )}
    </span>
  )
}

/** Carrete de efectos: la misma foto revelada de cada forma; se desliza y se toca. */
function Reel({ url, date, value, onChange }: { url: string | null; date: string; value: PhotoEffect; onChange: (effect: PhotoEffect) => void }) {
  return (
    <div className="reel" role="group" aria-label="Efecto de la foto">
      {EFFECTS.map((fx) => (
        <button key={fx.id} type="button" className="reel-frame" aria-pressed={value === fx.id} onClick={() => onChange(fx.id)}>
          <PhotoFrame url={url} alt="" effect={fx.id} date={date} />
          <span className="reel-name">{fx.name}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Destellos de diamante que se abren y se cierran en su sitio, como la pedrería al moverse bajo la luz.
 * Alas: [x %, y %, retraso s, tamaño px] sobre alas.webp, solo donde las alas asoman fuera del marco.
 * Marco: [lado, posición % a lo largo del lado, retraso s, tamaño px], centrados en la banda de pedrería.
 */
const WING_GLINTS: [number, number, number, number][] = [
  [9, 24, 0, 45],
  [5, 41, 1.9, 33],
  [12, 55, 0.8, 51],
  [8, 70, 2.9, 36],
  [15, 84, 1.4, 42],
  [30, 6, 2.3, 39],
  [91, 22, 1.1, 42],
  [95, 39, 3.2, 33],
  [88, 52, 0.4, 48],
  [92, 68, 2.0, 36],
  [85, 82, 2.6, 45],
  [70, 7, 0.9, 39],
]
const FRAME_GLINTS: ['top' | 'right' | 'bottom' | 'left', number, number, number][] = [
  ['top', 0, 1.6, 39],
  ['top', 62, 3.0, 30],
  ['right', 34, 0.6, 33],
  ['right', 100, 2.4, 39],
  ['bottom', 28, 1.2, 33],
  ['left', 55, 3.4, 30],
]

function frameGlintPosition(side: 'top' | 'right' | 'bottom' | 'left', at: number) {
  // La banda de pedrería mide 1.4rem: el destello se centra en su línea de piedras (0.7rem del borde)
  const along = `${at}%`
  if (side === 'top') return { '--x': along, '--y': '0.7rem' }
  if (side === 'bottom') return { '--x': along, '--y': 'calc(100% - 0.7rem)' }
  if (side === 'left') return { '--x': '0.7rem', '--y': along }
  return { '--x': 'calc(100% - 0.7rem)', '--y': along }
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
  // La foto recién tomada espera aquí, sin subir, hasta que se publique o se descarte
  const [draft, setDraft] = useState<{ blob: Blob; url: string; at: string } | null>(null)

  const [wingsMissing, setWingsMissing] = useState(false)
  const { frame, ring, glint } = TEX

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
    // El toque que enciende la cámara también desbloquea el audio en iOS y precarga el sonido de la prensa
    if (sounds) prepareShutter()
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

  function review(blob: Blob) {
    setError(null)
    setDraft({ blob, url: URL.createObjectURL(blob), at: new Date().toISOString() })
  }

  function discard() {
    if (draft) URL.revokeObjectURL(draft.url)
    setDraft(null)
  }

  /** Sube la foto revisada con su pie y su efecto. Devuelve un mensaje si falló. */
  async function publish(caption: string, effect: PhotoEffect): Promise<string | null> {
    if (!draft) return null
    setState('saving')
    try {
      const path = await uploadImage('photos', await compressImage(draft.blob), userId)
      const { data, error } = await supabase
        .from('photos')
        .insert({ author_id: userId, storage_path: path, taken_with_flash: true, caption: caption.trim(), effect })
        .select('id')
        .single()
      if (error || !data) throw error
      onShot(data.id)
      discard()
      return null
    } catch {
      return 'La foto no se publicó. Revisa la conexión e intenta de nuevo.'
    } finally {
      setState(streamRef.current ? 'live' : 'off')
    }
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
    canvas.toBlob((b) => b && review(b), 'image/jpeg', 0.9)
  }

  return (
    <section className="camera" aria-label="Cámara">
      <div className="viewfinder-stage">
        {/* Alas de ángel de pedrería (imagen elegida por Simón): enmarcan el visor desde atrás */}
        {/* Imagen con transparencia real (sin mix-blend-mode: en iOS el negro tapaba la página) */}
        <div className="wings" aria-hidden="true" hidden={wingsMissing} style={{ '--glint': `url(${glint})` } as CSSProperties}>
          <img src="/sections/alfombra/alas.webp" alt="" onError={() => setWingsMissing(true)} />
          {WING_GLINTS.map(([x, y, delay, size], i) => (
            <span key={i} className="glint" style={{ '--x': `${x}%`, '--y': `${y}%`, '--delay': `${delay}s`, '--size': `${size}px` } as CSSProperties} />
          ))}
        </div>
      <div className="viewfinder" style={{ '--frame': `url(${frame})` } as CSSProperties}>
        <video ref={videoRef} className={facing === 'user' ? 'is-mirrored' : ''} playsInline muted aria-hidden={state !== 'live'} />
        {state !== 'live' && state !== 'saving' && (
          <div className="viewfinder-off">
            {state === 'denied' ? (
              <>
                <p>No pudimos abrir la cámara.</p>
                <label className="section-button">
                  <Icon name="camera" size={18} /> Usar la cámara del teléfono
                  <input type="file" accept="image/*" capture="user" className="visually-hidden" onChange={(e) => e.target.files?.[0] && review(e.target.files[0])} />
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
        <div className="frame-glints" aria-hidden="true" style={{ '--glint': `url(${glint})` } as CSSProperties}>
          {FRAME_GLINTS.map(([side, at, delay, size], i) => (
            <span key={i} className="glint" style={{ ...frameGlintPosition(side, at), '--delay': `${delay}s`, '--size': `${size}px` } as CSSProperties} />
          ))}
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
        <button type="button" className="shutter" onClick={shoot} disabled={state !== 'live'} aria-label="Tomar la foto" style={{ '--ring': `url(${ring})` } as CSSProperties}>
          <Icon name="camera" size={30} />
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
      {draft && <DraftDialog url={draft.url} at={draft.at} saving={state === 'saving'} onPublish={publish} onDiscard={discard} />}
    </section>
  )
}

function PhotoDialog({
  photo,
  mine,
  by,
  onEffect,
  onEffectFailed,
  onDeleted,
  onClose,
}: {
  photo: Photo
  mine: boolean
  by: string
  onEffect: (effect: PhotoEffect) => void
  onEffectFailed: (previous: PhotoEffect) => void
  onDeleted: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const url = useSignedUrl('photos', photo.storage_path)
  const [caption, setCaption] = useState(photo.caption)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const [effectError, setEffectError] = useState<string | null>(null)
  async function chooseEffect(effect: PhotoEffect) {
    if (effect === photo.effect) return
    const previous = photo.effect
    onEffect(effect)
    setEffectError(null)
    const { error } = await supabase.from('photos').update({ effect }).eq('id', photo.id)
    if (error) {
      onEffectFailed(previous)
      setEffectError('No se guardó el efecto. Intenta otra vez.')
    }
  }

  // Borrar pide un segundo toque; el aviso se retira solo si no llega
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    if (!confirming) return
    const t = window.setTimeout(() => setConfirming(false), 4000)
    return () => window.clearTimeout(t)
  }, [confirming])
  async function remove() {
    if (!confirming) return setConfirming(true)
    setDeleting(true)
    setEffectError(null)
    const { error } = await supabase.from('photos').delete().eq('id', photo.id)
    if (error) {
      setDeleting(false)
      setConfirming(false)
      setEffectError('No se pudo borrar la foto. Intenta otra vez.')
      return
    }
    // El archivo se borra después de la fila: si falla, queda un archivo huérfano, nunca una polaroid rota
    await supabase.storage.from('photos').remove([photo.storage_path])
    ref.current?.close()
    onDeleted()
  }

  async function saveCaption() {
    if (caption !== photo.caption) await supabase.from('photos').update({ caption: caption.trim() }).eq('id', photo.id)
  }

  return (
    <dialog ref={ref} className="photo-dialog" onClose={onClose} aria-label={`Foto de ${by}`}>
      <div className="photo-dialog-polaroid">
        <PhotoFrame url={url} alt={photo.caption || `Foto de ${by}`} effect={photo.effect} date={photo.created_at} />
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
        {mine && (
          <button
            type="button"
            className={`photo-dialog-delete${confirming ? ' is-confirming' : ''}`}
            onClick={remove}
            disabled={deleting}
            aria-label={confirming ? 'Confirmar: borrar la foto' : 'Borrar la foto'}
          >
            <Icon name={confirming ? 'check' : 'trash'} size={18} />
            {confirming && <span>{deleting ? 'Borrando…' : '¿Borrar?'}</span>}
          </button>
        )}
      </div>
      {mine && <Reel url={url} date={photo.created_at} value={photo.effect} onChange={chooseEffect} />}
      {effectError && (
        <p className="section-error reel-error" role="alert">
          {effectError}
        </p>
      )}
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

/** La foto recién tomada, antes de subirla: se le escribe el pie, se elige el efecto y se publica o se descarta. */
function DraftDialog({
  url,
  at,
  saving,
  onPublish,
  onDiscard,
}: {
  url: string
  at: string
  saving: boolean
  onPublish: (caption: string, effect: PhotoEffect) => Promise<string | null>
  onDiscard: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [caption, setCaption] = useState('')
  const [effect, setEffect] = useState<PhotoEffect>('original')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="photo-dialog draft-dialog"
      aria-label="Tu foto, antes de publicarla"
      onCancel={(e) => {
        // Escape descarta, salvo mientras se sube
        e.preventDefault()
        if (!saving) onDiscard()
      }}
    >
      <div className="photo-dialog-polaroid">
        <PhotoFrame url={url} alt="Tu foto" effect={effect} date={at} />
        <input
          className="photo-dialog-caption"
          value={caption}
          maxLength={120}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escribe algo…"
          aria-label="Texto de la polaroid"
        />
        <p className="polaroid-meta">{formatShort(at)}</p>
      </div>
      <Reel url={url} date={at} value={effect} onChange={setEffect} />
      {error && (
        <p className="section-error reel-error" role="alert">
          {error}
        </p>
      )}
      <div className="draft-actions">
        <button type="button" className="section-button section-button--ghost" onClick={onDiscard} disabled={saving}>
          <Icon name="close" size={18} /> Descartar
        </button>
        <button
          type="button"
          className="section-button"
          disabled={saving}
          onClick={async () => {
            setError(null)
            setError(await onPublish(caption, effect))
          }}
        >
          <Icon name="check" size={18} /> {saving ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </dialog>
  )
}
