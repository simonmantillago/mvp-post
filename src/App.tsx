import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { useSession } from './hooks/useSession'
import { CoupleProvider } from './hooks/useCouple'
import { isSupabaseConfigured } from './lib/supabase'
import { Arrival } from './paper/Arrival'
import { Login } from './paper/Login'
import { FrontPage } from './paper/FrontPage'
import { Column } from './paper/Column'
import { PressNote } from './ui/PressNote'
import { loaders } from './sections/prefetch'

const Newsroom = lazy(() => import('./paper/Newsroom'))
const Y2K = lazy(loaders.y2k)
const RedCarpet = lazy(loaders.alfombra)
const Vinyls = lazy(loaders.vinilos)
const Cartelera = lazy(loaders.cartelera)
const Letters = lazy(loaders.cartas)
const Subscription = lazy(loaders.suscripcion)

/** La llegada se ve una vez por apertura de la app (y mientras se resuelve la sesión). */
function useArrival() {
  const seen = sessionStorage.getItem('arrived') === '1'
  const [done, setDone] = useState(seen)
  useEffect(() => {
    if (seen) return
    const t = window.setTimeout(() => finish(), 1700)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function finish() {
    sessionStorage.setItem('arrived', '1')
    setDone(true)
  }
  return { done, finish }
}

/** Cada página se abre desde arriba, como al pasar la hoja. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const session = useSession()
  const arrival = useArrival()

  if (!isSupabaseConfigured) {
    return <PressNote title="Fe de erratas" body="Falta configurar Supabase en .env.local." />
  }
  if (session === undefined || !arrival.done) return <Arrival onSkip={arrival.finish} />
  if (!session) return <Login />

  return (
    <CoupleProvider session={session}>
      <ScrollToTop />
      <Suspense fallback={<PressNote title="En prensa…" />}>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/columna/:number" element={<Column />} />
          <Route path="/redaccion" element={<Newsroom />} />
          <Route path="/redaccion/:id" element={<Newsroom />} />
          <Route path="/y2k" element={<Y2K />} />
          <Route path="/alfombra-roja" element={<RedCarpet />} />
          <Route path="/vinilos" element={<Vinyls />} />
          <Route path="/cartelera" element={<Cartelera />} />
          <Route path="/cartas" element={<Letters />} />
          <Route path="/suscripcion" element={<Subscription />} />
          <Route path="*" element={<FrontPage />} />
        </Routes>
      </Suspense>
    </CoupleProvider>
  )
}
