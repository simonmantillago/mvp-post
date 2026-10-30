import { useEffect, useRef, useState } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { supabase } from '../../lib/supabase'
import { rouletteLand, rouletteTick } from './ruletaSound'

const SLICES = 6
const SPIN_MS = 4200
const R = 100
/** Clavijas del borde (los bombillos): una cada 20°, cada una suena al pasar bajo la flecha. */
const PEG = 20

/** Punto del borde a `deg` grados desde arriba, en sentido horario. */
const at = (deg: number, r = R) => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)]

/**
 * El ruletazo: una ruleta de concurso en el centro de la pantalla que gira sola al abrirse
 * y cae en ella o en él. El resultado se guarda en `watch_spins` y pasa al ticket del turno.
 */
export function Ruletazo({ herId, himId, onSpun, onClose }: { herId: string; himId: string; onSpun: () => void; onClose: () => void }) {
  const { session, me, nameOf, isMe } = useCouple()
  const ref = useRef<HTMLDialogElement>(null)
  const wheel = useRef<SVGSVGElement>(null)
  const sounds = me?.sounds_enabled ?? true
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const owner = (i: number) => (i % 2 === 0 ? herId : himId)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    const chooser = Math.random() < 0.5 ? herId : himId
    // Una tajada al azar de quien salió y un punto dentro de ella, lejos de los bordes.
    const options = Array.from({ length: SLICES }, (_, i) => i).filter((i) => owner(i) === chooser)
    const slice = options[Math.floor(Math.random() * options.length)]
    const span = 360 / SLICES
    const target = slice * span + span * (0.2 + Math.random() * 0.6)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = requestAnimationFrame(() => setRotation(360 * 6 + (360 - target)))
    let frame = 0

    // Mientras gira, se lee el ángulo real cada cuadro: cada clavija que cruza la flecha hace clic.
    let peg = 0
    let last = 0
    const listen = () => {
      const angle = wheel.current ? parseFloat(getComputedStyle(wheel.current).rotate) || 0 : 0
      const now = Math.floor(angle / PEG)
      if (now !== peg) {
        rouletteTick((angle - last) / 40)
        peg = now
      }
      last = angle
      frame = requestAnimationFrame(listen)
    }
    if (sounds && !reduce) frame = requestAnimationFrame(listen)

    const done = window.setTimeout(
      async () => {
        cancelAnimationFrame(frame)
        if (sounds) rouletteLand()
        setWinner(chooser)
        const { error } = await supabase.from('watch_spins').insert({ chooser, spun_by: session.user.id })
        if (error) setError('No se guardó el resultado. Revisa la conexión y vuelve a girar.')
        else onSpun()
      },
      reduce ? 0 : SPIN_MS + 200,
    )
    return () => {
      cancelAnimationFrame(start)
      cancelAnimationFrame(frame)
      window.clearTimeout(done)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const span = 360 / SLICES
  return (
    <dialog ref={ref} className="ruleta-dialog" aria-labelledby="ruleta-title" onClose={onClose} onCancel={(e) => !winner && e.preventDefault()}>
      <h2 id="ruleta-title" className="ruleta-title">
        Ruletazo
      </h2>
      <div className={`ruleta${winner ? ' is-stopped' : ''}`}>
        <svg className="ruleta-pointer" viewBox="0 0 24 20" aria-hidden="true">
          <path d="M2 2h20L12 18z" />
        </svg>
        <div className="ruleta-disc">
        <svg ref={wheel} className="ruleta-wheel" viewBox="-112 -112 224 224" style={{ rotate: `${rotation}deg` }} aria-hidden="true">
          <circle r="111" className="ruleta-rim" />
          {Array.from({ length: SLICES }, (_, i) => {
            const [x1, y1] = at(i * span)
            const [x2, y2] = at((i + 1) * span)
            const mid = i * span + span / 2
            return (
              <g key={i} className={owner(i) === herId ? 'ruleta-slice--her' : 'ruleta-slice--him'}>
                <path d={`M0 0L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}Z`} />
                <text transform={`rotate(${mid}) rotate(-90) translate(24 0)`} dominantBaseline="middle">
                  {nameOf(owner(i))}
                </text>
              </g>
            )
          })}
          {Array.from({ length: 18 }, (_, i) => {
            const [x, y] = at(i * 20, 105.5)
            return <circle key={i} cx={x} cy={y} r="2.6" className="ruleta-bulb" style={{ animationDelay: `${(i % 2) * 0.35}s` }} />
          })}
          <circle r="15" className="ruleta-hub" />
        </svg>
        </div>
      </div>

      <p className="ruleta-result" aria-live="polite">
        {winner ? (
          <>
            <span className="ruleta-result-label">Esta noche elige</span>
            <span className="ruleta-result-name">{isMe(winner) ? 'Tú' : nameOf(winner)}</span>
          </>
        ) : (
          <span className="ruleta-result-label">Girando…</span>
        )}
      </p>
      {error && (
        <p className="section-error" role="alert">
          {error}
        </p>
      )}
      <button type="button" className="section-button ruleta-done" disabled={!winner} onClick={() => ref.current?.close()}>
        Listo
      </button>
    </dialog>
  )
}
