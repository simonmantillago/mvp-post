import { useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { supabase } from '../lib/supabase'
import { Icon } from '../ui/Icon'
import { initials, readers, type Reader } from './readers'
import './Login.css'

/** ¿Quién lee hoy? Dos credenciales de prensa; tocar una la voltea y pide la contraseña. */
export function Login() {
  const [chosen, setChosen] = useState<Reader['key'] | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const fronts = useRef(new Map<string, HTMLButtonElement>())

  async function submit(e: FormEvent, reader: Reader) {
    e.preventDefault()
    if (!reader.email) {
      setError('Falta configurar el correo de esta credencial.')
      return
    }
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: reader.email, password })
    setBusy(false)
    if (error) {
      setError(
        navigator.onLine
          ? 'Esa contraseña no abre este periódico. Revísala e intenta otra vez.'
          : 'No hay conexión. Conéctate a internet para entrar.',
      )
    }
  }

  return (
    <main className="login newsprint">
      <header className="login-head">
        <p className="login-mast">The MVP Post</p>
        <h1 className="login-title">¿Quién lee hoy?</h1>
      </header>

      <ul className="login-readers">
        {readers.map((r) => {
          const open = chosen === r.key
          return (
            <li key={r.key} className={`credential${open ? ' is-open' : ''}${chosen && !open ? ' is-dim' : ''}`}>
              <div className="credential-card">
                <button
                  type="button"
                  className="credential-front"
                  ref={(el) => {
                    if (el) fronts.current.set(r.key, el)
                  }}
                  onClick={() => {
                    // Se aplica ya (quita el inert de la cara de atrás) y se enfoca dentro del mismo toque,
                    // para que iOS abra el teclado de una vez.
                    flushSync(() => {
                      setChosen(r.key)
                      setPassword('')
                      setError(null)
                    })
                    inputs.current.get(r.key)?.focus()
                  }}
                  aria-expanded={open}
                  inert={open}
                >
                  <span className="credential-clip" aria-hidden="true" />
                  <span className="credential-press">PRENSA</span>
                  <ReaderPhoto reader={r} />
                  <span className="credential-name">{r.name}</span>
                  <span className="credential-role">{r.role}</span>
                </button>

                <form className="credential-back" onSubmit={(e) => submit(e, r)} inert={!open}>
                  <span className="credential-clip" aria-hidden="true" />
                  <span className="credential-name">{r.name}</span>
                  <label className="credential-label" htmlFor={`pw-${r.key}`}>
                    Contraseña
                  </label>
                  <input
                    id={`pw-${r.key}`}
                    ref={(el) => {
                      if (el) inputs.current.set(r.key, el)
                    }}
                    className="credential-input"
                    type="password"
                    autoComplete="current-password"
                    value={open ? password : ''}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {error && open && (
                    <p className="credential-error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="credential-actions">
                    <button
                      type="button"
                      className="credential-cancel"
                      onClick={() => {
                        setChosen(null)
                        requestAnimationFrame(() => fronts.current.get(r.key)?.focus())
                      }}
                    >
                      Volver
                    </button>
                    <button type="submit" className="credential-enter" disabled={busy || !password}>
                      {busy ? 'Entrando…' : 'Entrar'}
                      <Icon name="arrow-right" size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="login-sign">SMG Development®</p>
    </main>
  )
}

function ReaderPhoto({ reader }: { reader: Reader }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="credential-photo">
      {failed ? (
        <span className="credential-initials" aria-hidden="true">
          {initials(reader.name)}
        </span>
      ) : (
        <img src={reader.photo} alt="" onError={() => setFailed(true)} />
      )}
    </span>
  )
}
