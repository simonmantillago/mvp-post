import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCouple } from '../hooks/useCouple'
import { sectionById } from '../sections/registry'
import { Halftone } from '../ui/Halftone'
import { Icon } from '../ui/Icon'
import { PressNote } from '../ui/PressNote'
import { formatFull } from './dates'
import { blocks, useEdition } from './editions'
import { DogEar } from './nav'
import './Column.css'

/** El titular se teclea letra a letra, como en la laptop de la columnista. */
function useTyped(text: string) {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [n, setN] = useState(reduce ? text.length : 0)
  useEffect(() => {
    if (reduce) return setN(text.length)
    setN(0)
    let i = 0
    const t = window.setInterval(() => {
      i += 1
      setN(i)
      if (i >= text.length) window.clearInterval(t)
    }, 42)
    return () => window.clearInterval(t)
  }, [text, reduce])
  return { shown: text.slice(0, n), done: n >= text.length }
}

export function Column() {
  const number = Number(useParams().number)
  const { load } = useEdition(number)
  const { nameOf } = useCouple()
  const edition = load.state === 'ready' ? load.data : null
  const typed = useTyped(edition?.headline ?? '')
  const next = sectionById(edition?.continues_to)

  return (
    <main className="column newsprint">
      <DogEar />
      <p className="column-folio">
        <span className="column-folio-mast">The MVP Post</span>
        <span>Carrie's Column · N.º {number}</span>
      </p>

      {load.state === 'loading' && <PressNote title="En prensa…" />}
      {load.state === 'error' && <PressNote tone="error" title="Fe de erratas" body={load.message} />}
      {load.state === 'ready' && !edition && (
        <PressNote title="Esta edición no existe" body="Quizá todavía está en la redacción." action={<Link to="/" viewTransition>Volver a la portada</Link>} />
      )}

      {edition && (
        <article className="column-article">
          <h1 className="column-hed" aria-label={edition.headline}>
            <span aria-hidden="true">{typed.shown}</span>
            <span className={`column-caret${typed.done ? ' is-done' : ''}`} aria-hidden="true" />
          </h1>
          <p className="column-byline">
            Por {nameOf(edition.author_id)}
            {edition.published_at && <> · {formatFull(new Date(edition.published_at))}</>}
          </p>

          <Halftone path={edition.cover_path} alt={edition.cover_caption || 'Foto de la columna'} caption={edition.cover_caption || undefined} className="column-cover" />

          <div className="column-body">
            {blocks(edition.body).map((b, i) =>
              b.quote ? (
                <blockquote key={i} className="column-quote">
                  {b.text}
                </blockquote>
              ) : (
                <p key={i} className={i === 0 ? 'column-first' : undefined}>
                  {b.text}
                </p>
              ),
            )}
          </div>

          <p className="column-end" aria-hidden="true">
            ■
          </p>

          {next && (
            <Link to={next.path} viewTransition className="column-next">
              <span>Sigue en la pág. {next.page}</span>
              <strong>{next.name}</strong>
              <Icon name="arrow-right" />
            </Link>
          )}
        </article>
      )}
    </main>
  )
}
