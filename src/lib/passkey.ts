// Face ID = passkey (WebAuthn) de Supabase Auth, en beta (supabase-js ≥ 2.105 con
// `auth.experimental.passkey`). La llave vive en el Llavero de iCloud; el dominio es el de Netlify.

export const passkeysSupported = () => typeof window !== 'undefined' && 'PublicKeyCredential' in window

export type PasskeyProblem = 'cancel' | 'missing' | 'exists' | 'disabled' | 'offline' | 'other'

/** Traduce los errores de Supabase/WebAuthn a lo que la app necesita decir. */
export function passkeyProblem(error: unknown): PasskeyProblem {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline'
  const e = error as { code?: string; name?: string; message?: string; cause?: { name?: string } } | null
  const code = e?.code ?? ''
  const name = e?.cause?.name ?? e?.name ?? ''
  if (code === 'ERROR_CEREMONY_ABORTED' || name === 'NotAllowedError' || name === 'AbortError') return 'cancel'
  if (code === 'webauthn_credential_not_found') return 'missing'
  if (code === 'webauthn_credential_exists' || code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' || name === 'InvalidStateError') return 'exists'
  if (code === 'passkey_disabled') return 'disabled'
  return 'other'
}
