import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { supabase } from '../../lib/supabase'
import type { WatchItem, WatchRating } from '../../lib/types'
import { Icon } from '../../ui/Icon'
import { hueOf, tabs, type Turn } from './shelf'

/** Burbuja de una cinta: portada, ficha, a qué estante va, el turno y la crítica de cada uno. */
export function MovieDialog({
  item,
  ratings,
  turn,
  onChanged,
  onClose,
}: {
  item: WatchItem
  ratings: WatchRating[]
  turn: Turn
  onChanged: () => void
  onClose: () => void
}) {
  const { session, isMe, nameOf, partner } = useCouple()
  const uid = session.user.id
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const mine = ratings.find((r) => isMe(r.user_id))
  const theirs = ratings.find((r) => !isMe(r.user_id))
  const [stars, setStars] = useState(mine?.rating ?? 0)
  const [comment, setComment] = useState(mine?.comment ?? '')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posterBroken, setPosterBroken] = useState(false)
  const dirty = stars !== (mine?.rating ?? 0) || comment.trim() !== (mine?.comment ?? '')

  async function update(patch: Partial<WatchItem>) {
    setError(null)
    const { error } = await supabase.from('watch_items').update(patch).eq('id', item.id)
    if (error) return setError('No se pudo mover la cinta. Revisa la conexión.')
    onChanged()
  }

  // Mover a «Viendo» o «Vistas» una cinta que nadie había empezado cuenta como la elección de esta noche.
  function move(status: WatchItem['status']) {
    if (status === item.status) return
    const now = new Date().toISOString()
    const pick = item.started_at ? {} : { started_at: now, picked_by: turn.id ?? uid }
    if (status === 'want') return update({ status, started_at: null, picked_by: null, finished_at: null })
    if (status === 'watching') return update({ status, finished_at: null, ...pick })
    return update({ status, finished_at: item.finished_at ?? now, ...pick })
  }

  async function saveReview() {
    if (!stars) return setError('Elige de una a cinco estrellas antes de guardar.')
    setBusy(true)
    setError(null)
    const { error } = await supabase
      .from('watch_ratings')
      .upsert({ item_id: item.id, user_id: uid, rating: stars, comment: comment.trim() }, { onConflict: 'item_id,user_id' })
    setBusy(false)
    if (error) return setError('No se guardó tu crítica. Intenta otra vez.')
    setSaved(true)
    onChanged()
  }

  // Quitar pide un segundo toque; el aviso se retira solo si no llega
  const [confirming, setConfirming] = useState(false)
  useEffect(() => {
    if (!confirming) return
    const t = window.setTimeout(() => setConfirming(false), 4000)
    return () => window.clearTimeout(t)
  }, [confirming])
  async function remove() {
    if (!confirming) return setConfirming(true)
    const { error } = await supabase.from('watch_items').delete().eq('id', item.id)
    if (error) {
      setConfirming(false)
      return setError('No se pudo quitar la cinta. Intenta otra vez.')
    }
    onChanged()
    ref.current?.close()
  }

  const myTurn = isMe(turn.id)
  const meta = [item.kind === 'series' ? 'Serie' : 'Película', item.year].filter(Boolean).join(' · ')

  return (
    <dialog
      ref={ref}
      className="tape-dialog"
      aria-labelledby="tape-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="tape-sheet" style={{ '--spine': hueOf(item.id) } as CSSProperties}>
        <button type="button" className="tape-close" aria-label="Cerrar" onClick={() => ref.current?.close()}>
          <Icon name="close" size={20} />
        </button>

        <header className="tape-head">
          <div className="tape-cover">
            {item.poster_url && !posterBroken ? (
              <img src={item.poster_url} alt={`Portada de ${item.title}`} onError={() => setPosterBroken(true)} />
            ) : (
              <span className="tape-cover-blank">{item.title}</span>
            )}
          </div>
          <div className="tape-facts">
            <h2 id="tape-dialog-title" className="tape-title">
              {item.title}
            </h2>
            <p className="tape-meta">{meta}</p>
            <p className="tape-meta">{isMe(item.added_by) ? 'La agregaste tú' : `La agregó ${nameOf(item.added_by)}`}</p>
            {item.picked_by && <p className="tape-meta">{isMe(item.picked_by) ? 'La elegiste tú' : `La eligió ${nameOf(item.picked_by)}`}</p>}
          </div>
        </header>

        {item.overview && <p className="tape-overview">{item.overview}</p>}

        <div className="tape-block">
          <span className="section-label" id="tape-move">
            En el estante
          </span>
          <div className="tape-move" role="radiogroup" aria-labelledby="tape-move">
            {tabs.map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={item.status === v} onClick={() => move(v)}>
                {label}
              </button>
            ))}
          </div>
          {item.status === 'want' &&
            (myTurn ? (
              <button type="button" className="section-button" onClick={() => move('watching')}>
                <Icon name="play" size={18} /> Elegir esta para esta noche
              </button>
            ) : (
              <p className="tape-meta">Esta noche elige {nameOf(turn.id)}.</p>
            ))}
          {item.status === 'watching' && item.kind === 'series' && (
            <div className="episode" aria-label="Capítulo">
              <Stepper label="Temporada" value={item.season ?? 1} onChange={(v) => update({ season: v })} />
              <Stepper label="Capítulo" value={item.episode ?? 1} onChange={(v) => update({ episode: v })} />
            </div>
          )}
        </div>

        <div className="tape-block">
          <span className="section-label">Tu crítica</span>
          <Stars
            label="Tu calificación"
            value={stars}
            onChange={(v) => {
              setStars(v)
              setSaved(false)
            }}
          />
          <textarea
            className="section-field tape-comment"
            rows={3}
            maxLength={500}
            placeholder="¿Qué te pareció?"
            aria-label="Tu comentario"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              setSaved(false)
            }}
          />
          <button type="button" className="section-button" disabled={busy || !dirty} onClick={saveReview}>
            {busy ? 'Guardando…' : saved && !dirty ? (
              <>
                <Icon name="check" size={18} /> Guardada
              </>
            ) : mine ? (
              'Guardar cambios'
            ) : (
              'Publicar crítica'
            )}
          </button>
        </div>

        <div className="tape-block tape-block--theirs">
          <span className="section-label">Crítica de {nameOf(partner?.id)}</span>
          {theirs ? (
            <>
              <span className="stars stars--read" role="img" aria-label={`${theirs.rating} de 5 estrellas`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon key={n} name="star" filled={n <= theirs.rating} size={20} />
                ))}
              </span>
              {theirs.comment && <p className="tape-quote">{theirs.comment}</p>}
            </>
          ) : (
            <p className="tape-meta">Todavía no la califica.</p>
          )}
        </div>

        {error && (
          <p className="section-error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className={`tape-remove${confirming ? ' is-confirming' : ''}`} onClick={remove}>
          <Icon name="trash" size={16} /> {confirming ? '¿Quitarla del estante?' : 'Quitar del estante'}
        </button>
      </div>
    </dialog>
  )
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <span className="section-label">{label}</span>
      <div className="stepper-row">
        <button type="button" aria-label={`${label} anterior`} onClick={() => onChange(Math.max(1, value - 1))}>
          <Icon name="minus" size={18} />
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`${label} siguiente`} onClick={() => onChange(value + 1)}>
          <Icon name="plus" size={18} />
        </button>
      </div>
    </div>
  )
}

function Stars({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} de 5`} onClick={() => onChange(n)}>
          <Icon name="star" filled={n <= value} size={28} />
        </button>
      ))}
    </div>
  )
}
