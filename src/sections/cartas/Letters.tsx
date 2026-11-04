import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive } from '../../hooks/useData'
import { supabase } from '../../lib/supabase'
import type { Message } from '../../lib/types'
import { formatShort, formatTime } from '../../paper/dates'
import { Icon } from '../../ui/Icon'
import { parchmentTexture } from '../../ui/leopard'
import { WaxSeal } from '../../ui/Marks'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import './Letters.css'

const TIN_COOLDOWN = 10_000

/** Estampilla de lechucería: rosa con lechuza para ella, dorada con pluma para él, con su matasellos. */
function Stamp({ her }: { her: boolean }) {
  return (
    <span className="letter-stamp" aria-hidden="true">
      <span className={`stamp ${her ? 'stamp--her' : 'stamp--him'}`}>
        <span className="stamp-in">
          {her ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8c0-3 3-5 6-5s6 2 6 5M6 8 5 4l3 2M18 8l1-4-3 2M6 8c-1 5 0 10 3 12 1 1 2 1 3 1s2 0 3-1c3-2 4-7 3-12" />
              <circle cx="9.5" cy="10" r="1.8" />
              <circle cx="14.5" cy="10" r="1.8" />
              <path d="m11 13 1 1.5 1-1.5" />
            </svg>
          ) : (
            <Icon name="quill" size={26} />
          )}
          <small>{her ? 'MVP' : 'SMG'}</small>
        </span>
      </span>
      <svg className="postmark" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="22" cy="32" r="17" />
        <circle cx="22" cy="32" r="13" />
        <path d="M42 24c4-3 8 3 12 0s8 3 10 0M42 32c4-3 8 3 12 0s8 3 10 0M42 40c4-3 8 3 12 0s8 3 10 0" />
      </svg>
    </span>
  )
}

/** Lechuza en tinta para el buzón vacío. */
function Owl() {
  return (
    <svg className="letters-owl" viewBox="0 0 120 130" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M30 34c0-16 12-24 30-24s30 8 30 24" />
      <path d="M30 34 24 18l14 8M90 34l6-16-14 8" />
      <path d="M30 34c-6 20-4 48 6 66 6 10 14 16 24 16s18-6 24-16c10-18 12-46 6-66" />
      <circle cx="47" cy="44" r="10" />
      <circle cx="73" cy="44" r="10" />
      <circle cx="47" cy="44" r="3" fill="currentColor" />
      <circle cx="73" cy="44" r="3" fill="currentColor" />
      <path d="m56 54 4 7 4-7" />
      <path d="M44 74c5 3 11 3 16 0M60 74c5 3 11 3 16 0M48 86c4 3 8 3 12 0M60 86c4 3 8 3 12 0" />
      <path d="M46 116v8M54 116v8M66 116v8M74 116v8M10 124h100" />
    </svg>
  )
}

/** Cartas mágicas: lechucería de pergamino. Cada carta lleva su estampilla; el Tin es un vociferador. */
export default function Letters() {
  const { session, isMe, isHer, nameOf, partner } = useCouple()
  const { load } = useLive<Message[]>('messages', () =>
    supabase.from('messages').select('id, author_id, kind, body, created_at, read_at').order('created_at', { ascending: false }).limit(50),
  )
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTin, setLastTin] = useState(0)
  const [shake, setShake] = useState(false)
  const [arriving, setArriving] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const seenNudge = useRef<number | null>(null)

  // El pergamino va en <html>, para que cubra toda la pantalla y no solo la columna
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--parchment', `url(${parchmentTexture()})`)
    root.style.setProperty('--sheet', `url(${parchmentTexture('#efe3c6', 320, 31, 500, 10)})`)
    return () => {
      root.style.removeProperty('--parchment')
      root.style.removeProperty('--sheet')
    }
  }, [])

  const letters = load.state === 'ready' ? [...load.data].reverse() : []
  const lastMine = [...letters].reverse().find((m) => isMe(m.author_id) && m.kind === 'text')

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
    // Marcar como leídas las cartas del otro
    const unread = letters.filter((m) => !isMe(m.author_id) && !m.read_at).map((m) => m.id)
    if (unread.length) supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread).then()
    // Un Tin nuevo del otro: el vociferador se abre y la página se sacude
    const nudge = [...letters].reverse().find((m) => m.kind === 'nudge' && !isMe(m.author_id))
    if (nudge && seenNudge.current !== null && nudge.id !== seenNudge.current) {
      setShake(true)
      setArriving(nudge.id)
      window.setTimeout(() => setShake(false), 700)
      window.setTimeout(() => setArriving(null), 1100)
    }
    if (nudge) seenNudge.current = nudge.id
    else if (seenNudge.current === null) seenNudge.current = -1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  async function send(kind: Message['kind'], e?: FormEvent) {
    e?.preventDefault()
    if (kind === 'text' && !text.trim()) return
    if (kind === 'nudge' && Date.now() - lastTin < TIN_COOLDOWN) {
      setError('Ya pediste tin. Espera unos segundos para el siguiente.')
      return
    }
    setSending(true)
    setError(null)
    const { error } = await supabase.from('messages').insert({ author_id: session.user.id, kind, body: kind === 'text' ? text.trim() : '' })
    setSending(false)
    if (error) return setError(navigator.onLine ? 'La lechuza no salió. Intenta otra vez.' : 'Sin conexión: la carta se queda contigo hasta que vuelva la red.')
    if (kind === 'text') setText('')
    else setLastTin(Date.now())
  }

  return (
    <Section id="cartas" className={shake ? 'is-extra' : ''} header={<p className="letters-dek">Correo por lechuza · entrega inmediata</p>}>
      <div className="letters section-body">
        {load.state === 'loading' && <PressNote title="Abriendo el correo…" />}
        {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
        {load.state === 'ready' && letters.length === 0 && (
          <div className="letters-empty">
            <Owl />
            <h2>La lechucería está en silencio</h2>
            <p>Escríbele la primera carta a {partner?.display_name ?? 'tu lector'}. Llega al instante y con notificación.</p>
          </div>
        )}

        <ol className="letters-list" aria-live="polite" aria-relevant="additions">
          {letters.map((m) =>
            m.kind === 'nudge' ? (
              <li key={m.id} className={`howler ${arriving === m.id ? 'is-arriving' : ''}`}>
                <div className="howler-env">
                  <span className="howler-flap" aria-hidden="true" />
                  <span className="howler-seal">
                    <WaxSeal initial="" her={false} wine size={38} />
                  </span>
                  <p className="howler-hed">¡Tin! ¡Tin!</p>
                  <p className="howler-sub">
                    {isMe(m.author_id) ? 'Pediste tin' : `${nameOf(m.author_id)} quiere tin`} · {formatTime(m.created_at)}
                  </p>
                </div>
              </li>
            ) : (
              <li key={m.id} className={`letter ${isMe(m.author_id) ? 'letter--mine' : 'letter--theirs'} ${isHer(m.author_id) ? 'letter--her' : 'letter--him'}`}>
                <p className="letter-body">{m.body}</p>
                <p className="letter-sign">
                  — {nameOf(m.author_id)} · {formatShort(m.created_at)}, {formatTime(m.created_at)}
                </p>
                <Stamp her={isHer(m.author_id)} />
              </li>
            ),
          )}
        </ol>
        {lastMine?.read_at && <p className="letters-seen">Leída</p>}
        <div ref={endRef} />
      </div>

      <form className="letters-compose" onSubmit={(e) => send('text', e)}>
        {error && (
          <p className="section-error" role="alert">
            {error}
          </p>
        )}
        <div className="letters-compose-row">
          <label className="visually-hidden" htmlFor="carta">
            Escribe tu carta
          </label>
          <textarea
            id="carta"
            className="letters-input"
            rows={2}
            value={text}
            maxLength={4000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu carta…"
          />
          <button type="submit" className="letters-send" disabled={sending || !text.trim()} aria-label="Enviar carta">
            <Icon name="quill" />
          </button>
        </div>
        <button type="button" className="letters-tin" onClick={() => send('nudge')} disabled={sending}>
          <WaxSeal initial="" her={false} wine size={26} />
          Tin
        </button>
      </form>
    </Section>
  )
}
