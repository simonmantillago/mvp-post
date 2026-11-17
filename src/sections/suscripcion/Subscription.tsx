import { useEffect, useState, type FormEvent } from 'react'
import { useCouple } from '../../hooks/useCouple'
import { useSession } from '../../hooks/useSession'
import { useMarkSeen } from '../../hooks/useData'
import { disablePush, enablePush, getPushState, isInstalled, type PushState } from '../../lib/push'
import { passkeyProblem, passkeysSupported } from '../../lib/passkey'
import { supabase } from '../../lib/supabase'
import { BackButton } from '../../paper/nav'
import { Icon } from '../../ui/Icon'
import { sections } from '../registry'
import './Subscription.css'

/** Suscripción: formulario recortado del periódico (nombre, notificaciones, cerrar sesión). */
export default function Subscription() {
  const { me } = useCouple()
  useMarkSeen('portada')
  const [name, setName] = useState('')
  const [muted, setMuted] = useState<string[]>([])
  const [push, setPush] = useState<PushState | 'checking'>('checking')
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (me) {
      setName(me.display_name)
      setMuted(me.muted_sections ?? [])
    }
  }, [me])
  useEffect(() => {
    getPushState().then(setPush).catch(() => setPush('unsupported'))
  }, [])

  async function saveProfile(patch: { display_name?: string; muted_sections?: string[] }) {
    if (!me) return
    const { error } = await supabase.from('profiles').update(patch).eq('id', me.id)
    setNote(error ? 'No se pudo guardar. Revisa la conexión.' : 'Guardado.')
  }

  async function togglePush() {
    setNote(null)
    try {
      if (push === 'on') {
        await disablePush()
        setPush('off')
      } else setPush(await enablePush())
    } catch {
      setNote('No se pudieron activar las notificaciones. Intenta de nuevo.')
    }
  }

  return (
    <main className="subscription newsprint">
      <BackButton />
      <div className="coupon">
        <p className="coupon-cut" aria-hidden="true">
          Recorte por la línea punteada
        </p>
        <h1 className="coupon-title">Suscripción</h1>
        <p className="coupon-stamp">De por vida</p>

        <label className="coupon-field">
          <span>Nombre en la credencial</span>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== me?.display_name && saveProfile({ display_name: name.trim() })} />
        </label>

        <section className="coupon-block" aria-labelledby="avisos">
          <h2 id="avisos">Avisos al teléfono</h2>
          {push === 'needs-install' && (
            <p className="coupon-help">
              Para recibir avisos en el iPhone, primero agrega el periódico a tu pantalla de inicio: toca <strong>Compartir</strong> y luego <strong>Agregar a inicio</strong>. Ábrelo desde ese ícono y vuelve aquí.
            </p>
          )}
          {push === 'unsupported' && <p className="coupon-help">Este navegador no recibe avisos. Abre el periódico desde el ícono de tu pantalla de inicio.</p>}
          {push === 'denied' && <p className="coupon-help">Los avisos están bloqueados. Actívalos en Ajustes › Notificaciones › MVP Post.</p>}
          {(push === 'on' || push === 'off') && (
            <label className="coupon-check">
              <input type="checkbox" checked={push === 'on'} onChange={togglePush} />
              <span>Avisarme cuando haya algo nuevo</span>
            </label>
          )}
          {push === 'checking' && <p className="coupon-help">Revisando…</p>}
          {!isInstalled() && push !== 'needs-install' && <p className="coupon-help">Consejo: ábrelo desde la pantalla de inicio para que se sienta como app.</p>}

          {push === 'on' && (
            <fieldset className="coupon-sections">
              <legend>Avisar de estas secciones</legend>
              {[{ id: 'portada', name: 'Ediciones nuevas' }, ...sections].map((s) => (
                <label key={s.id} className="coupon-check">
                  <input
                    type="checkbox"
                    checked={!muted.includes(s.id)}
                    onChange={(e) => {
                      const next = e.target.checked ? muted.filter((m) => m !== s.id) : [...muted, s.id]
                      setMuted(next)
                      saveProfile({ muted_sections: next })
                    }}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </fieldset>
          )}
        </section>

        {note && (
          <p className="coupon-note" role="status">
            {note}
          </p>
        )}

        <FaceIdBlock />

        <PasswordBlock />

        <button type="button" className="coupon-signout" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>
      <p className="subscription-sign">SMG Development®</p>
    </main>
  )
}

/** Activar o quitar la passkey de esta cuenta (Face ID en el iPhone). */
function FaceIdBlock() {
  const [keys, setKeys] = useState<{ id: string; created_at: string }[] | 'loading' | 'error'>('loading')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const supported = passkeysSupported()

  async function load() {
    try {
      const { data, error } = await supabase.auth.passkey.list()
      setKeys(error || !data ? 'error' : data)
    } catch {
      setKeys('error')
    }
  }
  useEffect(() => {
    if (supported) load()
  }, [supported])

  if (!supported) return null

  async function activate() {
    setBusy(true)
    setMsg(null)
    let problem = null
    try {
      const { error } = await supabase.auth.registerPasskey()
      if (error) problem = passkeyProblem(error)
    } catch (err) {
      problem = passkeyProblem(err)
    }
    setBusy(false)
    if (!problem || problem === 'exists') {
      await load()
      setMsg({ kind: 'ok', text: problem ? 'Este iPhone ya tenía Face ID para el periódico.' : 'Listo, Face ID activado.' })
      return
    }
    if (problem === 'cancel') return
    setMsg({
      kind: 'error',
      text:
        problem === 'offline'
          ? 'Sin conexión. Inténtalo cuando vuelva la señal.'
          : problem === 'disabled'
            ? 'Face ID todavía no está listo en el periódico.'
            : 'No se pudo activar. Intenta otra vez.',
    })
  }

  async function remove() {
    if (!Array.isArray(keys)) return
    if (!confirm) return setConfirm(true)
    setBusy(true)
    setMsg(null)
    const results = await Promise.all(keys.map((k) => supabase.auth.passkey.delete({ passkeyId: k.id }).catch((error) => ({ error }))))
    setBusy(false)
    setConfirm(false)
    await load()
    setMsg(
      results.some((r) => r.error)
        ? { kind: 'error', text: 'No se pudo quitar. Revisa la conexión e intenta de nuevo.' }
        : { kind: 'ok', text: 'Quitado. Entra con tu contraseña; la llave guardada en el iPhone ya no abre el periódico.' },
    )
  }

  const on = Array.isArray(keys) && keys.length > 0
  const since = on ? new Date(keys[0].created_at).toLocaleDateString('es', { day: 'numeric', month: 'long' }) : ''

  return (
    <section className="coupon-block" aria-labelledby="faceid">
      <h2 id="faceid">Face ID</h2>
      {keys === 'loading' && <p className="coupon-help">Revisando…</p>}
      {keys === 'error' && <p className="coupon-help">No se pudo revisar Face ID. Abre de nuevo esta página con conexión.</p>}
      {Array.isArray(keys) && (
        <p className="coupon-help">
          {on ? `Activado desde el ${since}. En «¿Quién lee hoy?» toca «Entrar con Face ID».` : 'Entra mirando el teléfono, sin escribir la contraseña. La llave se guarda en tu Llavero de iCloud.'}
        </p>
      )}
      {msg && (
        <p className={msg.kind === 'ok' ? 'coupon-note coupon-note-ok' : 'coupon-note'} role={msg.kind === 'ok' ? 'status' : 'alert'}>
          {msg.text}
        </p>
      )}
      {Array.isArray(keys) &&
        (on ? (
          <button type="button" className={confirm ? 'coupon-signout coupon-danger' : 'coupon-signout'} onClick={remove} onBlur={() => setConfirm(false)} disabled={busy}>
            {busy ? 'Quitando…' : confirm ? '¿Quitar Face ID?' : 'Quitar Face ID'}
          </button>
        ) : (
          <button type="button" className="coupon-action coupon-faceid" onClick={activate} disabled={busy}>
            <Icon name="face-id" size={20} />
            {busy ? 'Activando…' : 'Activar Face ID'}
          </button>
        ))}
    </section>
  )
}

const MIN_PASSWORD = 10

/** Cambiar la contraseña desde el teléfono. El correo va en un campo oculto para que el
 *  Llavero de iCloud asocie la contraseña nueva a la cuenta y la ofrezca con Face ID. */
function PasswordBlock() {
  const session = useSession()
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (next.length < MIN_PASSWORD) return setMsg({ kind: 'error', text: `Usa al menos ${MIN_PASSWORD} caracteres.` })
    if (next !== again) return setMsg({ kind: 'error', text: 'Las dos no coinciden. Escríbela otra vez.' })
    if (!navigator.onLine) return setMsg({ kind: 'error', text: 'Sin conexión. Inténtalo cuando vuelva la señal.' })
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ password: next })
    setBusy(false)
    if (error) {
      const same = /different|same/i.test(error.message)
      const weak = /weak|short|least/i.test(error.message)
      setMsg({
        kind: 'error',
        text: same ? 'Es la misma que ya tienes. Elige otra.' : weak ? 'Es muy débil. Prueba una más larga.' : 'No se pudo cambiar. Revisa la conexión e intenta de nuevo.',
      })
      return
    }
    setNext('')
    setAgain('')
    setMsg({ kind: 'ok', text: 'Listo. La próxima vez entra con la nueva.' })
  }

  return (
    <form className="coupon-block" aria-labelledby="clave" onSubmit={submit} noValidate>
      <h2 id="clave">Contraseña</h2>
      <input type="email" name="username" autoComplete="username" value={session?.user.email ?? ''} readOnly hidden />
      <label className="coupon-field">
        <span>Nueva</span>
        <input type="password" name="new-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </label>
      <label className="coupon-field">
        <span>Repítela</span>
        <input type="password" name="confirm-password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
      </label>
      <p className="coupon-help">Mínimo {MIN_PASSWORD} caracteres. Tu iPhone te ofrecerá guardarla.</p>
      {msg && (
        <p className={msg.kind === 'ok' ? 'coupon-note coupon-note-ok' : 'coupon-note'} role={msg.kind === 'ok' ? 'status' : 'alert'}>
          {msg.text}
        </p>
      )}
      <button type="submit" className="coupon-action" disabled={busy || !next || !again}>
        {busy ? 'Cambiando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
