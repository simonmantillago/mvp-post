import { useSession } from './hooks/useSession'
import { isSupabaseConfigured } from './lib/supabase'

// Placeholder de Fase 1. Boot, Login y Escritorio se construyen en la Fase 3,
// después de la dirección visual con Impeccable (ver CLAUDE.md → Roadmap).
export default function App() {
  const session = useSession()

  return (
    <main className="placeholder">
      <h1>MVP OS</h1>
      <p>
        {!isSupabaseConfigured
          ? 'Falta configurar Supabase en .env.local'
          : session === undefined
            ? 'Iniciando…'
            : session
              ? 'Sesión iniciada'
              : 'Sin sesión'}
      </p>
      <small>SMG Development®</small>
    </main>
  )
}
