import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { useCouple } from '../hooks/useCouple'
import { useMarkSeen, useUnseen } from '../hooks/useData'
import { sections } from '../sections/registry'
import { Halftone } from '../ui/Halftone'
import { Icon } from '../ui/Icon'
import { WaxSeal } from '../ui/Marks'
import { leopardTexture, pinkLeopard } from '../ui/leopard'
import { formatFull, formatShort } from './dates'
import { blocks, usePublishedEditions } from './editions'
import './FrontPage.css'

/** El arranque de la columna en la portada: unas líneas, cortadas en palabra. */
function excerpt(text: string | undefined, max = 210) {
  if (!text || text.length <= max) return text
  return text.slice(0, text.lastIndexOf(' ', max)) + '…'
}

export function FrontPage() {
  const { reader, nameOf } = useCouple()
  const { load } = usePublishedEditions()
  const unseen = useUnseen()
  useMarkSeen('portada')

  const editions = load.state === 'ready' ? load.data : []
  const lead = editions[0]
  const lede = excerpt(lead ? blocks(lead.body).find((b) => !b.quote)?.text : undefined)

  // Miniaturas de los pliegos: cada una enseña el material de su mundo
  const [thumbs, setThumbs] = useState<CSSProperties>()
  useEffect(() => {
    setThumbs({ '--thumb-y2k': `url(${leopardTexture(pinkLeopard, 360, 11)})`, '--thumb-alfombra': 'url(/sections/alfombra/fondo.webp)' } as CSSProperties)
  }, [])

  return (
    <main className="front newsprint">
      <p className="front-dateline">
        <span>{formatFull(new Date())}</span>
        <span>{lead ? `Edición n.º ${lead.number}` : 'Edición n.º 0'}</span>
        <span>$0.00</span>
      </p>
      <h1 className="front-mast">The MVP Post</h1>
      <div className="front-rules" aria-hidden="true" />
      <p className="front-flag">
        <span>Estilos · Domingo</span>
        <span className="front-flag-day">La columna</span>
      </p>

      {load.state === 'loading' && <div className="front-lead front-lead--pending" aria-busy="true" />}

      {load.state === 'error' && (
        <section className="front-lead front-lead--empty">
          <h2 className="front-hed">Fe de erratas</h2>
          <p className="front-standfirst">{load.message}</p>
        </section>
      )}

      {load.state === 'ready' && lead && (
        <article className="front-lead">
          <Link to={`/columna/${lead.number}`} viewTransition className="front-lead-link">
            <Halftone path={lead.cover_path} alt={lead.cover_caption || 'Foto de la columna'} className="front-cover" />
            <h2 className="front-hed">{lead.headline}</h2>
          </Link>
          <p className="front-byline">
            Por {nameOf(lead.author_id)}, nuestro columnista · {formatShort(lead.published_at!)}
          </p>
          {lead.cover_caption && <p className="front-caption">{lead.cover_caption}</p>}
          {lede && <p className="front-lede">{lede}</p>}
          <Link to={`/columna/${lead.number}`} viewTransition className="front-more">
            Seguir leyendo la columna <Icon name="arrow-right" size={18} />
          </Link>
        </article>
      )}

      {load.state === 'ready' && !lead && (
        <section className="front-lead front-lead--empty">
          <Halftone path={null} alt="" caption="Aquí irá la foto de la primera columna." className="front-cover" />
          <h2 className="front-hed">La primera edición está en prensa</h2>
          {reader?.columnist ? (
            <>
              <p className="front-standfirst">Escribe la primera columna. Cuando la publiques, a ella le llegará la noticia.</p>
              <Link to="/redaccion" viewTransition className="front-cta">
                <Icon name="pen" size={18} /> Escribir la primera columna
              </Link>
            </>
          ) : (
            <p className="front-standfirst">Tu columnista la está escribiendo. Te llegará una notificación el día que salga.</p>
          )}
        </section>
      )}

      <nav className="front-sections" aria-label="Secciones de esta edición" style={thumbs}>
        <h2 className="front-sections-title">En esta edición</h2>
        <ul>
          {sections.map((s) => {
            const fresh = (unseen[s.id] ?? 0) > 0
            return (
              <li key={s.id}>
                <Link to={s.path} viewTransition className={`pliego pliego--${s.id}`} data-section={s.id}>
                  <span className="pliego-thumb" aria-hidden="true">
                    {s.id === 'cartas' && <WaxSeal initial="M" her size={30} />}
                  </span>
                  <span className="pliego-name">{s.name}</span>
                  <span className="pliego-teaser">
                    {s.teaser} <span className="pliego-page">· pág. {s.page}</span>
                  </span>
                  {fresh && (
                    <span className="pliego-new">
                      Nuevo<span className="visually-hidden">: {unseen[s.id]} sin ver</span>
                    </span>
                  )}
                  <Icon name="arrow-right" size={20} />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <footer className="front-foot">
        {editions.length > 1 && (
          <section className="front-archive">
            <h2 className="front-foot-title">Ediciones anteriores</h2>
            <ul>
              {editions.slice(1).map((e) => (
                <li key={e.id}>
                  <Link to={`/columna/${e.number}`} viewTransition>
                    <span>N.º {e.number}</span> {e.headline}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="front-foot-links">
          {reader?.columnist && (
            <Link to="/redaccion" viewTransition>
              Redacción
            </Link>
          )}
          <Link to="/suscripcion" viewTransition>
            Suscripción
          </Link>
        </p>
        <p className="front-sign">SMG Development®</p>
      </footer>
    </main>
  )
}
