import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useLive } from '../../hooks/useData'
import { supabase } from '../../lib/supabase'
import type { Message } from '../../lib/types'
import { formatShort, formatTime } from '../../paper/dates'
import { Icon } from '../../ui/Icon'
import { WaxSeal } from '../../ui/Marks'
import { PressNote } from '../../ui/PressNote'
import { Section } from '../Section'
import './Letters.css'

const EXTRA_COOLDOWN = 10_000

/** Cartas mágicas (antes Cartas al editor): correspondencia en papel; el botón «Tin» (antes ¡Extra!) es un titular a todo el ancho: nuestra palabra clave. */
export default function Letters() {
  const { session, isMe, isHer, nameOf, partner } = useCouple()
  const { load } = useLive<Message[]>('messages', () =>
    supabase.from('messages').select('id, author_id, kind, body, created_at, read_at').order('created_at', { ascending: false }).limit(50),
  )
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastExtra, setLastExtra] = useState(0)
  const [shake, setShake] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const seenNudge = useRef<number | null>(null)

  const letters = load.state === 'ready' ? [...load.data].reverse() : []
  const lastMine = [...letters].reverse().find((m) => isMe(m.author_id) && m.kind === 'text')

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
    // Marcar como leídas las cartas del otro
    const unread = letters.filter((m) => !isMe(m.author_id) && !m.read_at).map((m) => m.id)
    if (unread.length) supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread).then()
    // Un «Tin» nuevo del otro sacude la página
    const nudge = [...letters].reverse().find((m) => m.kind === 'nudge' && !isMe(m.author_id))
    if (nudge && seenNudge.current !== null && nudge.id !== seenNudge.current) {
      setShake(true)
      window.setTimeout(() => setShake(false), 700)
    }
    if (nudge) seenNudge.current = nudge.id
    else if (seenNudge.current === null) seenNudge.current = -1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  async function send(kind: Message['kind'], e?: FormEvent) {
    e?.preventDefault()
    if (kind === 'text' && !text.trim()) return
    if (kind === 'nudge' && Date.now() - lastExtra < EXTRA_COOLDOWN) {
      setError('Ya pediste tin. Espera unos segundos para el siguiente.')
      return
    }
    setSending(true)
    setError(null)
    const { error } = await supabase.from('messages').insert({ author_id: session.user.id, kind, body: kind === 'text' ? text.trim() : '' })
    setSending(false)
    if (error) return setError(navigator.onLine ? 'La carta no salió. Intenta otra vez.' : 'Sin conexión: la carta se queda contigo hasta que vuelva la red.')
    if (kind === 'text') setText('')
    else setLastExtra(Date.now())
  }

  return (
    <Section id="cartas" className={shake ? 'is-extra' : ''}>
      <div className="letters section-body">
        {load.state === 'loading' && <PressNote title="Abriendo el correo…" />}
        {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
        {load.state === 'ready' && letters.length === 0 && (
          <PressNote title="Buzón vacío" body={`Escríbele la primera carta a ${partner?.display_name ?? 'tu lector'}. Llega al instante y con notificación.`} />
        )}

        <ol className="letters-list" aria-live="polite" aria-relevant="additions">
          {letters.map((m) =>
            m.kind === 'nudge' ? (
              <li key={m.id} className="extra">
                <p className="extra-hed">¡Tin! ¡Tin!</p>
                <p className="extra-sub">
                  {isMe(m.author_id) ? 'Pediste tin' : `${nameOf(m.author_id)} quiere tin`} · {formatTime(m.created_at)}
                </p>
              </li>
            ) : (
              <li key={m.id} className={`letter ${isMe(m.author_id) ? 'letter--mine' : 'letter--theirs'} ${isHer(m.author_id) ? 'letter--her' : 'letter--him'}`}>
                <p className="letter-body">{m.body}</p>
                <p className="letter-sign">
                  — {nameOf(m.author_id)} · {formatShort(m.created_at)}, {formatTime(m.created_at)}
                </p>
                <span className="letter-seal">
                  <WaxSeal initial={nameOf(m.author_id).charAt(0)} her={isHer(m.author_id)} />
                </span>
              </li>
            ),
          )}
        </ol>
        {lastMine?.read_at && <p className="letters-seen">Visto</p>}
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
            <Icon name="send" />
          </button>
        </div>
        <button type="button" className="letters-extra" onClick={() => send('nudge')} disabled={sending}>
          Tin
        </button>
      </form>
    </Section>
  )
}
