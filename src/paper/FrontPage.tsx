import { Link } from 'react-router'
import { useCouple } from '../hooks/useCouple'
import { useMarkSeen, useUnseen } from '../hooks/useData'
import { sections, type SectionEntry } from '../sections/registry'
import { Halftone } from '../ui/Halftone'
import { Icon } from '../ui/Icon'
import { formatFull, formatShort } from './dates'
import { blocks, usePublishedEditions } from './editions'
import { SectionName } from './nav'
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

  return (
    <main className="front newsprint">
      <p className="front-dateline">
        <span>{formatFull(new Date())}</span>
        <span>{lead ? `Edición n.º ${lead.number}` : 'Edición n.º 0'}</span>
        <span>$0.00</span>
      </p>
      <h1 className="front-mast">The MVP Post</h1>
      <div className="front-rules" aria-hidden="true" />
      <p className="front-flag">Carrie's Column</p>

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

      <section className="front-sections" aria-labelledby="en-esta-edicion">
        <h2 id="en-esta-edicion" className="front-sections-title">
          En esta edición
        </h2>
        {plana(sections).map((block) =>
          block.length === 2 ? (
            <div key={block[0].id} className="story-pair">
              {block.map((s, i) => (
                <Story key={s.id} s={s} unseen={unseen[s.id] ?? 0} photoLast={i === 1} />
              ))}
            </div>
          ) : (
            <Story key={block[0].id} s={block[0]} unseen={unseen[block[0].id] ?? 0} />
          ),
        )}
      </section>

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

/** Agrupa en una fila de dos columnas las secciones seguidas que se componen en pareja. */
function plana(list: SectionEntry[]) {
  const blocks: SectionEntry[][] = []
  for (const s of list) {
    const last = blocks[blocks.length - 1]
    if (s.layout === 'pair' && last?.length === 1 && last[0].layout === 'pair') last.push(s)
    else blocks.push([s])
  }
  return blocks
}

/** Un artículo de la plana por sección: foto a color, título en la voz de su mundo, bajada y la entrada a la sección. */
function Story({ s, unseen, photoLast = false }: { s: SectionEntry; unseen: number; photoLast?: boolean }) {
  const photo = (
    <figure className="story-photo">
      <Link to={s.path} viewTransition className="story-photo-link" tabIndex={-1} aria-hidden="true">
        <img src={s.cover} alt="" loading="lazy" decoding="async" style={{ objectFit: s.coverFit ?? 'cover', objectPosition: s.coverPosition, aspectRatio: s.coverAspect }} />
      </Link>
      <figcaption className="story-caption">{s.caption}</figcaption>
    </figure>
  )
  const name = (
    <h3 className="story-name">
      <span className="story-name-text"><SectionName name={s.name} lines={s.nameLines} /></span>
      {unseen > 0 && (
        <span className="story-new">
          Nuevo<span className="visually-hidden">: {unseen} sin ver</span>
        </span>
      )}
    </h3>
  )
  const page = <p className="story-page">Pág. {s.page}</p>
  const go = (
    <Link to={s.path} viewTransition className="story-go">
      {s.layout === 'pair' ? 'Ver' : 'Ver sección'} <Icon name="arrow-right" size={18} />
      {s.layout === 'pair' && <span className="visually-hidden"> {s.name}</span>}
    </Link>
  )
  const dek = <p className="story-dek">{s.dek}</p>

  return (
    <article className={`story story--${s.layout}`} data-section={s.id}>
      {s.layout === 'lead-left' && (
        <>
          {name}
          {photo}
          {dek}
          {page}
          {go}
        </>
      )}
      {s.layout === 'float-right' && (
        <>
          {photo}
          {name}
          {dek}
          {page}
          {go}
        </>
      )}
      {s.layout === 'banner' && (
        <>
          {photo}
          <div className="story-head">
            {name}
            {page}
          </div>
          {dek}
          {go}
        </>
      )}
      {s.layout === 'pair' &&
        (photoLast ? (
          <>
            {name}
            {dek}
            {photo}
            {page}
            {go}
          </>
        ) : (
          <>
            {photo}
            {name}
            {dek}
            {page}
            {go}
          </>
        ))}
    </article>
  )
}
