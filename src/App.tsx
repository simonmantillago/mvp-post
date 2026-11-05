import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { useSession } from './hooks/useSession'
import { CoupleProvider } from './hooks/useCouple'
import { isSupabaseConfigured } from './lib/supabase'
import { Arrival } from './paper/Arrival'
import { Login } from './paper/Login'
import { FrontPage } from './paper/FrontPage'
import { Column } from './paper/Column'
import { useHistoryTrail } from './paper/nav'
import { PressNote } from './ui/PressNote'
import { ErrorBoundary } from './ui/ErrorBoundary'
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

/**
 * Scroll de cada página. Las secciones se abren desde arriba, como al pasar la hoja;
 * la portada vuelve al punto donde se dejó (con la flecha o deslizando hacia atrás).
 * El scroll lo maneja la app, no el navegador, para que no salte al volver.
 */
function ScrollMemory({ atFront }: { atFront: boolean }) {
  const { pathname } = useLocation()
  const frontY = useRef(0)
  const frontShown = useRef(false)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    // Solo cuenta el scroll de la portada mientras está a la vista (la URL cambia antes que la página)
    const onScroll = () => {
      if (frontShown.current && window.location.pathname === '/') frontY.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    if (atFront) {
      window.scrollTo(0, frontY.current)
      frontShown.current = true
    } else {
      frontShown.current = false
      window.scrollTo(0, 0)
    }
  }, [atFront, pathname])
  return null
}

export default function App() {
  const location = useLocation()
  const session = useSession()
  const arrival = useArrival()
  useHistoryTrail()
  const atFront = location.pathname === '/'

  if (!isSupabaseConfigured) {
    return <PressNote title="Fe de erratas" body="Falta configurar Supabase en .env.local." />
  }
  if (session === undefined || !arrival.done) return <Arrival onSkip={arrival.finish} />
  if (!session) return <Login />

  return (
    <CoupleProvider session={session}>
      <ScrollMemory atFront={atFront} />
      {/* La portada no se desmonta al entrar a una sección: al volver sigue igual, sin recargar las fotos */}
      <div style={{ display: atFront ? 'contents' : 'none' }}>
        <ErrorBoundary>
          <FrontPage active={atFront} />
        </ErrorBoundary>
      </div>
      {!atFront && (
        // Una por ruta: si una sección falla, al volver a la portada se reinicia
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PressNote title="En prensa…" />}>
            <Routes>
              <Route path="/columna/:number" element={<Column />} />
              <Route path="/redaccion" element={<Newsroom />} />
              <Route path="/redaccion/:id" element={<Newsroom />} />
              <Route path="/y2k" element={<Y2K />} />
              <Route path="/alfombra-roja" element={<RedCarpet />} />
              <Route path="/vinilos" element={<Vinyls />} />
              <Route path="/cartelera" element={<Cartelera />} />
              <Route path="/cartas" element={<Letters />} />
              <Route path="/suscripcion" element={<Subscription />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      )}
    </CoupleProvider>
  )
}
