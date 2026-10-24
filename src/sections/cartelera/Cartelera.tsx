import { useState, type FormEvent } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive } from '../../hooks/useData'
import { supabase } from '../../lib/supabase'
import type { WatchItem, WatchRating } from '../../lib/types'
import { Icon } from '../../ui/Icon'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import './Cartelera.css'

type Tab = 'want' | 'watching' | 'watched'
const tabs: [Tab, string][] = [
  ['want', 'Por ver'],
  ['watching', 'Viendo'],
  ['watched', 'Vistas'],
]
const spineHues = ['#c2255c', '#2f6fd6', '#e8a64b', '#3ddc97', '#8b5cf6', '#ff4f8b', '#22a3a3']

/** Cartelera: estantería de VHS, turno para elegir y críticas de los dos. */
export default function Cartelera() {
  const { session, isMe, nameOf, me, partner, herId } = useCouple()
  const { load } = useLive<WatchItem[]>('watch_items', () =>
    supabase.from('watch_items').select('*').order('created_at', { ascending: false }),
  )
  const { load: ratingsLoad } = useLive<WatchRating[]>('watch_ratings', () => supabase.from('watch_ratings').select('item_id, user_id, rating, comment'))
  const [tab, setTab] = useState<Tab>('want')
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = load.state === 'ready' ? load.data : []
  const ratings = ratingsLoad.state === 'ready' ? ratingsLoad.data : []

  // Turno: elige quien NO eligió la última película empezada; si no hay ninguna, empieza ella.
  const lastPicked = [...items].filter((i) => i.started_at).sort((a, b) => (a.started_at! < b.started_at! ? 1 : -1))[0]
  const turnId = lastPicked?.picked_by ? (isMe(lastPicked.picked_by) ? partner?.id : me?.id) : herId ?? me?.id
  const myTurn = isMe(turnId)

  const shown = items.filter((i) => i.status === tab)
  const selected = items.find((i) => i.id === open)

  async function update(id: string, patch: Partial<WatchItem>) {
    setError(null)
    const { error } = await supabase.from('watch_items').update(patch).eq('id', id)
    if (error) setError('No se pudo actualizar. Revisa la conexión.')
  }

  async function rate(item: WatchItem, rating: number) {
    const { error } = await supabase.from('watch_ratings').upsert({ item_id: item.id, user_id: session.user.id, rating }, { onConflict: 'item_id,user_id' })
    if (error) setError('No se pudo guardar tu calificación.')
  }

  return (
    <Section id="cartelera">
      <div className="section-body cartelera">
        <p className="ticket">
          <span className="ticket-label">Esta noche elige</span>
          <span className="ticket-name">{turnId ? (myTurn ? 'Tú' : nameOf(turnId)) : '—'}</span>
        </p>

        <div className="cartelera-tabs" role="tablist" aria-label="Estado">
          {tabs.map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={tab === v}
              className="cartelera-tab"
              onClick={() => {
                setTab(v)
                setOpen(null)
              }}
            >
              {label}
              <span className="cartelera-count">{items.filter((i) => i.status === v).length}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" className="cartelera-panel">
          {load.state === 'loading' && <PressNote title="Rebobinando…" />}
          {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
          {load.state === 'ready' && shown.length === 0 && (
            <PressNote
              title={tab === 'want' ? 'Estante vacío' : tab === 'watching' ? 'Nada en el reproductor' : 'Aún sin críticas'}
              body={tab === 'want' ? 'Agrega la primera película o serie que quieren ver.' : tab === 'watching' ? 'Elijan algo del estante cuando sea su turno.' : 'Lo que terminen de ver aparecerá aquí con sus estrellas.'}
            />
          )}

          {tab === 'want' && shown.length > 0 && (
            <ul className="shelf" aria-label="Estante de VHS">
              {shown.map((i, n) => (
                <li key={i.id}>
                  <button
                    type="button"
                    className="vhs"
                    style={{ '--spine': spineHues[n % spineHues.length] } as React.CSSProperties}
                    aria-expanded={open === i.id}
                    onClick={() => setOpen(open === i.id ? null : i.id)}
                  >
                    <span className="vhs-title">{i.title}</span>
                    <span className="vhs-kind">{i.kind === 'series' ? 'Serie' : 'Película'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === 'want' && selected && (
            <div className="vhs-detail">
              <p className="vhs-detail-title">{selected.title}</p>
              <p className="vhs-detail-meta">Agregada por {nameOf(selected.added_by)}</p>
              {myTurn ? (
                <button type="button" className="section-button" onClick={() => update(selected.id, { status: 'watching', picked_by: session.user.id, started_at: new Date().toISOString() })}>
                  <Icon name="play" size={18} /> Elegir esta
                </button>
              ) : (
                <p className="vhs-detail-wait">Esta noche elige {nameOf(turnId)}.</p>
              )}
            </div>
          )}

          {tab === 'watching' && (
            <ul className="playing">
              {shown.map((i) => (
                <li key={i.id} className="playing-item">
                  <p className="playing-title">{i.title}</p>
                  <p className="playing-meta">La eligió {nameOf(i.picked_by)}</p>
                  {i.kind === 'series' && (
                    <div className="episode" aria-label="Capítulo">
                      <Stepper label="Temporada" value={i.season ?? 1} onChange={(v) => update(i.id, { season: v })} />
                      <Stepper label="Capítulo" value={i.episode ?? 1} onChange={(v) => update(i.id, { episode: v })} />
                    </div>
                  )}
                  <button type="button" className="section-button section-button--ghost" onClick={() => update(i.id, { status: 'watched', finished_at: new Date().toISOString() })}>
                    <Icon name="check" size={18} /> La terminamos
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tab === 'watched' && (
            <ul className="reviews">
              {shown.map((i) => {
                const mine = ratings.find((r) => r.item_id === i.id && isMe(r.user_id))
                const theirs = ratings.find((r) => r.item_id === i.id && !isMe(r.user_id))
                return (
                  <li key={i.id} className="review">
                    <p className="review-title">{i.title}</p>
                    <Stars label="Tu calificación" value={mine?.rating ?? 0} onChange={(v) => rate(i, v)} />
                    <p className="review-theirs">
                      {nameOf(partner?.id)}: {theirs ? `${theirs.rating} de 5` : 'sin calificar'}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && (
          <p className="section-error" role="alert">
            {error}
          </p>
        )}

        {adding ? (
          <AddTape userId={session.user.id} onDone={() => setAdding(false)} />
        ) : (
          <button type="button" className="section-button cartelera-add" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} /> Agregar al estante
          </button>
        )}
      </div>
    </Section>
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
          <Icon name="star" filled={n <= value} size={26} />
        </button>
      ))}
    </div>
  )
}

function AddTape({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<'movie' | 'series'>('movie')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('watch_items').insert({ title: title.trim(), kind, added_by: userId })
    setBusy(false)
    if (error) return setError('No se pudo agregar. Revisa la conexión.')
    onDone()
  }

  return (
    <form className="add-tape" onSubmit={submit}>
      <label>
        <span className="section-label">Título</span>
        <input className="section-field" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <fieldset className="add-tape-kind">
        <legend className="section-label">Es una</legend>
        <label>
          <input type="radio" name="kind" checked={kind === 'movie'} onChange={() => setKind('movie')} /> Película
        </label>
        <label>
          <input type="radio" name="kind" checked={kind === 'series'} onChange={() => setKind('series')} /> Serie
        </label>
      </fieldset>
      {error && <p className="section-error">{error}</p>}
      <div className="add-tape-actions">
        <button type="button" className="section-button section-button--ghost" onClick={onDone}>
          Cancelar
        </button>
        <button type="submit" className="section-button" disabled={busy || !title.trim()}>
          {busy ? 'Guardando…' : 'Al estante'}
        </button>
      </div>
    </form>
  )
}
