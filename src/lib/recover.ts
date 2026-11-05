/**
 * Que la app se recupere sola tras una publicación nueva.
 *
 * El iPhone deja la PWA viva en segundo plano. Si entre tanto se publica una versión, la página vieja
 * pide trozos de código que ya no existen: aquí se recarga una vez (sin bucles) y el service worker
 * busca versión nueva cada vez que se vuelve a la app.
 */

const KEY = 'recovered-at'

/** ¿El error es de un trozo de código que no llegó (versión vieja o sin red)? */
export function isChunkError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|Unable to preload|MIME type/i.test(msg)
}

/** Recarga una sola vez cada 30 s: si vuelve a fallar enseguida, se muestra la fe de erratas. */
export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < 30_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    // sin almacenamiento: se recarga igual
  }
  location.reload()
  return true
}

export function setupRecovery() {
  // Vite avisa así cuando falla la precarga de un trozo (CSS o dependencia de una sección)
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadOnce()
  })

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const hadController = !!navigator.serviceWorker.controller
  let pendingReload = false

  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => {
      // iOS no navega dentro de la app: se pregunta por versión nueva cada vez que vuelve a primer plano
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      })
    })
    .catch(() => {})

  // Llegó una versión nueva y ya manda: se recarga cuando ella no está mirando (al salir de la app)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return // primera instalación: nada que actualizar
    if (document.visibilityState === 'hidden') location.reload()
    else pendingReload = true
  })
  document.addEventListener('visibilitychange', () => {
    if (pendingReload && document.visibilityState === 'hidden') location.reload()
  })
}
