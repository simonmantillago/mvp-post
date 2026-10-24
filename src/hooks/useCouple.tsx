import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'
import { readerByEmail, type Reader } from '../paper/readers'

type Couple = {
  session: Session
  me: Profile | null
  partner: Profile | null
  reader: Reader | undefined
  /** Nombre corto de cualquiera de los dos por id */
  nameOf: (id: string | null | undefined) => string
  isMe: (id: string | null | undefined) => boolean
  /** ¿Es María Victoria? Se deduce de la credencial de quien inició sesión. */
  isHer: (id: string | null | undefined) => boolean
  herId: string | undefined
}

const CoupleContext = createContext<Couple | null>(null)

export function CoupleProvider({ session, children }: { session: Session; children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    const load = () =>
      supabase
        .from('profiles')
        .select('id, display_name, nick, avatar_path, sounds_enabled, muted_sections')
        .then(({ data }) => data && setProfiles(data as Profile[]))
    load()
    const channel = supabase
      .channel('profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.user.id])

  const uid = session.user.id
  const me = profiles.find((p) => p.id === uid) ?? null
  const partner = profiles.find((p) => p.id !== uid) ?? null
  const reader = readerByEmail(session.user.email)
  const value: Couple = {
    session,
    me,
    partner,
    reader,
    nameOf: (id) => profiles.find((p) => p.id === id)?.display_name || '—',
    isMe: (id) => id === uid,
    isHer: (id) => !!id && (id === uid ? reader?.key === 'ella' : reader?.key !== 'ella'),
    herId: reader?.key === 'ella' ? uid : partner?.id,
  }
  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

export function useCouple() {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple fuera de CoupleProvider')
  return ctx
}
