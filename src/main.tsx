import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import App from './App'
import { setupRecovery } from './lib/recover'
import { ErrorBoundary } from './ui/ErrorBoundary'
import './styles/base.css'

setupRecovery()

// Router de datos (no <BrowserRouter>): es el único modo en que react-router hace caso a `viewTransition`
// y anima el pasar la página. Para quitar la animación basta con volver a <BrowserRouter><App /></BrowserRouter>.
const router = createBrowserRouter([{ path: '*', element: <App /> }])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
