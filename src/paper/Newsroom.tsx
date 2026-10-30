import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useCouple } from '../hooks/useCouple'
import { compressImage, uploadImage } from '../lib/images'
import { supabase } from '../lib/supabase'
import type { Edition } from '../lib/types'
import { sections } from '../sections/registry'
import { Halftone } from '../ui/Halftone'
import { Icon } from '../ui/Icon'
import { PressNote } from '../ui/PressNote'
import { formatShort } from './dates'
import { useDrafts } from './editions'
import { BackButton } from './nav'
import './Newsroom.css'

type Draft = Pick<Edition, 'headline' | 'body' | 'cover_path' | 'cover_caption' | 'continues_to'>
const empty: Draft = { headline: '', body: '', cover_path: null, cover_caption: '', continues_to: null }

/** La redacción: el columnista escribe, guarda borradores y publica la edición. */
export default function Newsroom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, reader } = useCouple()
  const { load: drafts } = useDrafts()
  const [draft, setDraft] = useState<Draft>(empty)
  const [status, setStatus] = useState<'idle' | 'saving' | 'publishing' | 'uploading'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return setDraft(empty)
    supabase
      .from('editions')
      .select('headline, body, cover_path, cover_caption, continues_to')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => data && setDraft(data as Draft))
  }, [id])

  if (!reader?.columnist) {
    return (
      <main className="newsroom newsprint">
        <BackButton />
        <PressNote title="Solo para la redacción" body="Las columnas las escribe el columnista. Tú solo tienes que leerlas." />
      </main>
    )
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  async function onCover(file: File | undefined) {
    if (!file) return
    setStatus('uploading')
    try {
      const path = await uploadImage('photos', await compressImage(file), session.user.id)
      set('cover_path', path)
    } catch {
      setMessage('No pudimos subir la foto. Intenta con otra o revisa la conexión.')
    }
    setStatus('idle')
  }

  async function save(publish: boolean, e?: FormEvent) {
    e?.preventDefault()
    if (!draft.headline.trim()) {
      setMessage('La columna necesita un titular.')
      return
    }
    setStatus(publish ? 'publishing' : 'saving')
    setMessage(null)
    const row = { ...draft, headline: draft.headline.trim(), ...(publish ? { published_at: new Date().toISOString() } : {}) }
    const query = id ? supabase.from('editions').update(row).eq('id', id).select('id, number').single() : supabase.from('editions').insert(row).select('id, number').single()
    const { data, error } = await query
    setStatus('idle')
    if (error || !data) {
      setMessage('No se pudo guardar. Revisa la conexión e intenta otra vez.')
      return
    }
    if (publish) navigate(`/columna/${data.number}`, { viewTransition: true })
    else {
      setMessage('Borrador guardado.')
      if (!id) navigate(`/redaccion/${data.id}`, { replace: true })
    }
  }

  return (
    <main className="newsroom newsprint">
      <BackButton />
      <header className="newsroom-head">
        <p className="newsroom-mast">The MVP Post</p>
        <h1 className="newsroom-title">Redacción</h1>
      </header>

      <form className="newsroom-form" onSubmit={(e) => save(true, e)}>
        <label className="newsroom-field">
          <span>Titular (la pregunta de la semana)</span>
          <textarea
            className="newsroom-hed"
            rows={2}
            maxLength={200}
            value={draft.headline}
            onChange={(e) => set('headline', e.target.value)}
            placeholder="¿Y si…?"
          />
        </label>

        <div className="newsroom-field">
          <span>Foto</span>
          <Halftone path={draft.cover_path} alt="Foto de la edición" caption={draft.cover_path ? undefined : 'Sin foto todavía.'} className="newsroom-cover" />
          <label className="newsroom-upload">
            <Icon name="image" size={18} /> {status === 'uploading' ? 'Subiendo…' : draft.cover_path ? 'Cambiar foto' : 'Elegir foto'}
            <input type="file" accept="image/*" className="visually-hidden" onChange={(e) => onCover(e.target.files?.[0])} />
          </label>
          <input className="newsroom-line" value={draft.cover_caption} onChange={(e) => set('cover_caption', e.target.value)} placeholder="Pie de foto" aria-label="Pie de foto" />
        </div>

        <label className="newsroom-field">
          <span>Carrie's Column</span>
          <textarea
            className="newsroom-body"
            rows={14}
            value={draft.body}
            onChange={(e) => set('body', e.target.value)}
            placeholder={'Escribe aquí.\n\nDeja una línea en blanco entre párrafos.\n\n> Empieza una línea con «> » para una cita destacada.'}
          />
        </label>

        <label className="newsroom-field">
          <span>Al final, seguir en…</span>
          <select className="newsroom-line" value={draft.continues_to ?? ''} onChange={(e) => set('continues_to', (e.target.value || null) as Draft['continues_to'])}>
            <option value="">Ninguna sección</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                Pág. {s.page} · {s.name}
              </option>
            ))}
          </select>
        </label>

        {message && (
          <p className="newsroom-message" role="status">
            {message}
          </p>
        )}

        <div className="newsroom-actions">
          <button type="button" className="newsroom-save" onClick={() => save(false)} disabled={status !== 'idle'}>
            {status === 'saving' ? 'Guardando…' : 'Guardar borrador'}
          </button>
          <button type="submit" className="newsroom-publish" disabled={status !== 'idle'}>
            {status === 'publishing' ? 'Imprimiendo…' : 'Publicar edición'}
          </button>
        </div>
      </form>

      {drafts.state === 'ready' && drafts.data.length > 0 && (
        <section className="newsroom-drafts">
          <h2>Borradores</h2>
          <ul>
            {drafts.data.map((d) => (
              <li key={d.id}>
                <Link to={`/redaccion/${d.id}`}>
                  {d.headline || 'Sin titular'} <span>{formatShort(d.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
