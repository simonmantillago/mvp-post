import { useSession } from './hooks/useSession'
import { isSupabaseConfigured } from './lib/supabase'

// Placeholder. Llegada, login y portada se construyen después de la dirección visual
// del periódico con Impeccable (ver CLAUDE.md → Roadmap).
export default function App() {
  const session = useSession()

  return (
    <main className="placeholder">
      <h1>The MVP Post</h1>
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
