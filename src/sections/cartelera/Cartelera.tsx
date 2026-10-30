import { useState, type CSSProperties, type ReactNode } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive } from '../../hooks/useData'
import { supabase } from '../../lib/supabase'
import type { WatchItem, WatchRating, WatchSpin } from '../../lib/types'
import { Icon } from '../../ui/Icon'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import { AddTape } from './AddTape'
import { MovieDialog } from './MovieDialog'
import { Ruletazo } from './Ruletazo'
import { prepareRuleta } from './ruletaSound'
import { hueOf, tabs, type Tab, type Turn } from './shelf'
import './Cartelera.css'

/**
 * Quién elige esta noche: gana lo más reciente entre el último ruletazo (elige quien salió)
 * y la última película empezada (elige quien NO la eligió). Sin nada, empieza ella.
 */
function whoseTurn(items: WatchItem[], spins: WatchSpin[], other: (id: string) => string | undefined, first: string | undefined): Turn {
  const lastPick = items.filter((i) => i.started_at).sort((a, b) => (a.started_at! < b.started_at! ? 1 : -1))[0]
  const lastSpin = [...spins].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
  if (lastSpin && (!lastPick || lastSpin.created_at > lastPick.started_at!)) return { id: lastSpin.chooser, via: 'ruleta' }
  if (lastPick?.picked_by) return { id: other(lastPick.picked_by), via: 'turno' }
  return { id: first, via: 'turno' }
}

/** Cartelera: estantería de VHS con portadas, turno para elegir, ruletazo y críticas de los dos. */
export default function Cartelera() {
  const { session, me, isMe, nameOf, partner, herId } = useCouple()
  const uid = session.user.id
  const { load, refresh } = useLive<WatchItem[]>('watch_items', () =>
    supabase.from('watch_items').select('*').order('created_at', { ascending: false }),
  )
  const { load: ratingsLoad, refresh: refreshRatings } = useLive<WatchRating[]>('watch_ratings', () =>
    supabase.from('watch_ratings').select('item_id, user_id, rating, comment'),
  )
  const { load: spinsLoad, refresh: refreshSpins } = useLive<WatchSpin[]>('watch_spins', () =>
    supabase.from('watch_spins').select('id, chooser, spun_by, created_at').order('created_at', { ascending: false }).limit(5),
  )
  const [tab, setTab] = useState<Tab>('want')
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [spinning, setSpinning] = useState(false)

  const items = load.state === 'ready' ? load.data : []
  const ratings = ratingsLoad.state === 'ready' ? ratingsLoad.data : []
  const spins = spinsLoad.state === 'ready' ? spinsLoad.data : []

  const other = (id: string) => (isMe(id) ? partner?.id : uid)
  const turn = whoseTurn(items, spins, other, herId ?? uid)
  const myTurn = isMe(turn.id)

  const shown = items.filter((i) => i.status === tab)
  const selected = items.find((i) => i.id === open)

  function badge(i: WatchItem): ReactNode {
    if (i.status === 'watching' && i.kind === 'series') return `T${i.season ?? 1} · C${i.episode ?? 1}`
    if (i.status === 'watched') {
      const stars = ratings.filter((r) => r.item_id === i.id)
      if (stars.length) {
        const avg = stars.reduce((s, r) => s + r.rating, 0) / stars.length
        return (
          <>
            <Icon name="star" filled size={11} /> {avg.toLocaleString('es', { maximumFractionDigits: 1 })}
          </>
        )
      }
    }
    return i.kind === 'series' ? 'Serie' : 'Película'
  }

  return (
    <Section id="cartelera">
      <div className="section-body cartelera">
        <div className="ticket-row">
          <p className="ticket">
            <span className="ticket-label">
              Esta noche elige
              {turn.via === 'ruleta' && <span className="ticket-via">por ruletazo</span>}
            </span>
            <span className="ticket-name">{turn.id ? (myTurn ? 'Tú' : nameOf(turn.id)) : '—'}</span>
          </p>
          <button type="button" className="ruletazo-button" onClick={() => {
              if (me?.sounds_enabled ?? true) prepareRuleta()
              setSpinning(true)
            }}
            disabled={!partner}>
            <Icon name="wheel" size={20} /> Ruletazo
          </button>
        </div>

        <div className="cartelera-tabs" role="tablist" aria-label="Estante">
          {tabs.map(([v, label]) => (
            <button key={v} type="button" role="tab" aria-selected={tab === v} className="cartelera-tab" onClick={() => setTab(v)}>
              {label}
              <span className="cartelera-count">{items.filter((i) => i.status === v).length}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" className="cartelera-panel">
          {load.state === 'loading' && <PressNote title="Rebobinando…" />}
          {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
          {load.state === 'ready' && load.stale && <p className="section-error">{load.stale}</p>}
          {load.state === 'ready' && shown.length === 0 && (
            <PressNote
              title={tab === 'want' ? 'Estante vacío' : tab === 'watching' ? 'Nada en el reproductor' : 'Aún sin críticas'}
              body={
                tab === 'want'
                  ? 'Busca la primera película o serie que se deben.'
                  : tab === 'watching'
                    ? 'Elijan algo de «Pendientes» cuando sea su turno.'
                    : 'Lo que terminen de ver aparecerá aquí con sus estrellas.'
              }
            />
          )}

          {shown.length > 0 && (
            <ul className="shelf" aria-label="Estante de VHS">
              {shown.map((i) => (
                <li key={i.id}>
                  <Cassette item={i} badge={badge(i)} onOpen={() => setOpen(i.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {adding ? (
          <AddTape
            userId={uid}
            onShelf={new Set(items.map((i) => i.tmdb_id).filter((n): n is number => n != null))}
            onAdded={() => {
              setAdding(false)
              setTab('want')
              refresh()
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button type="button" className="section-button cartelera-add" onClick={() => setAdding(true)}>
            <Icon name="search" size={18} /> Buscar película o serie
          </button>
        )}
      </div>

      {selected && (
        <MovieDialog
          key={selected.id}
          item={selected}
          ratings={ratings.filter((r) => r.item_id === selected.id)}
          turn={turn}
          onChanged={() => {
            refresh()
            refreshRatings()
          }}
          onClose={() => setOpen(null)}
        />
      )}

      {spinning && partner && herId && (
        <Ruletazo
          herId={herId}
          himId={isMe(herId) ? partner.id : uid}
          onSpun={refreshSpins}
          onClose={() => setSpinning(false)}
        />
      )}
    </Section>
  )
}

function Cassette({ item, badge, onOpen }: { item: WatchItem; badge: ReactNode; onOpen: () => void }) {
  const [broken, setBroken] = useState(false)
  const poster = item.poster_url && !broken ? item.poster_url : null
  return (
    <button
      type="button"
      className={`vhs${poster ? ' vhs--poster' : ''}`}
      style={{ '--spine': hueOf(item.id) } as CSSProperties}
      aria-haspopup="dialog"
      aria-label={[item.title, item.year].filter(Boolean).join(', ')}
      onClick={onOpen}
    >
      <span className="vhs-window">
        {poster ? <img src={poster} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} /> : <span className="vhs-title">{item.title}</span>}
      </span>
      <span className="vhs-label">
        {poster && <span className="vhs-name">{item.title}</span>}
        <span className="vhs-kind">{badge}</span>
      </span>
    </button>
  )
}
