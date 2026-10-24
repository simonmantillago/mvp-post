import { createClient } from '@supabase/supabase-js'
import { createDemoClient } from './demo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// `?demo` en desarrollo: cliente falso en memoria para revisar pantallas sin cuentas reales.
// La condición empieza con import.meta.env.DEV para que el build de producción la elimine entera.
const isDemo = () => import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

export const isSupabaseConfigured = (import.meta.env.DEV && isDemo()) || Boolean(url && anonKey)

// Sin .env.local la app arranca igual (para trabajar el diseño); las llamadas fallarán.
const client = createClient(url ?? 'http://localhost:54321', anonKey ?? 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const supabase: typeof client = import.meta.env.DEV && isDemo() ? createDemoClient() : client
