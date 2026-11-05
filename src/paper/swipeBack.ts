import { useEffect, type RefObject } from 'react'

/**
 * Deslizar desde el borde izquierdo para volver a la portada, hecho por la app.
 *
 * El gesto de iOS enseña una captura de la página anterior, y en la app instalada esa captura
 * suele faltar (se ve blanco). Por eso la app no deja entradas en el historial (todo navega con
 * `replace`) y el gesto es propio, como el de iOS: la sección se va hacia la derecha bajo el dedo
 * y la portada, que sigue montada, ya está debajo en el punto donde se dejó.
 * Al soltar pasado un tercio (o con un tirón), se vuelve; si no, la sección regresa a su sitio.
 *
 * Mientras dura, las dos capas flotan fijas en la pantalla (`.front-layer.is-under` debajo,
 * `.page-layer.is-swiping` encima) y cada una guarda su scroll en `scrollTop`. Como varias
 * secciones pintan su fondo en <html>, la capa de la sección se lleva una copia de ese fondo.
 */
const EDGE = 30 // px desde el borde donde empieza el gesto
const SLOP = 8 // px antes de decidir si es horizontal
const COMMIT = 0.33 // fracción del ancho para volver al soltar
const FLICK = 0.45 // px/ms: un tirón rápido vuelve aunque sea corto

const BG = ['backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundColor'] as const

/** Deja la portada como estaba (la llama también App al mostrar la portada tras volver). */
export function clearSwipe(front: HTMLElement | null) {
  document.documentElement.classList.remove('is-swiping-back')
  front?.classList.remove('is-under')
}

function clearPage(page: HTMLElement) {
  page.classList.remove('is-swiping')
  page.style.transform = ''
  page.style.transition = ''
  for (const k of BG) page.style[k] = ''
}

export function useSwipeBack({
  enabled,
  front,
  page,
  frontY,
  onBack,
}: {
  enabled: boolean
  front: RefObject<HTMLElement | null>
  page: RefObject<HTMLElement | null>
  frontY: RefObject<number>
  onBack: () => void
}) {
  useEffect(() => {
    if (!enabled) return
    let start: { x: number; y: number } | null = null
    let dragging = false
    let settling = false
    let pageY = 0
    let dx = 0
    let lastX = 0
    let lastT = 0
    let speed = 0

    const place = (x: number) => {
      if (page.current) page.current.style.transform = `translate3d(${x}px, 0, 0)`
    }

    function begin() {
      const f = front.current
      const p = page.current
      if (!f || !p) return false
      pageY = window.scrollY
      // La sección se lleva su fondo, que vive en <html>
      const bg = getComputedStyle(document.documentElement)
      for (const k of BG) p.style[k] = bg[k]
      p.style.transition = 'none'
      document.documentElement.classList.add('is-swiping-back')
      f.classList.add('is-under')
      p.classList.add('is-swiping')
      f.scrollTop = frontY.current // la portada espera debajo en el punto donde se dejó
      p.scrollTop = pageY // y la sección sigue donde estaba
      place(0)
      return true
    }

    function settle(back: boolean) {
      const p = page.current
      if (!p) return
      settling = true
      p.style.transition = 'transform 240ms var(--ease-out)'
      place(back ? innerWidth : 0)
      let done = false
      const end = () => {
        if (done) return
        done = true
        p.removeEventListener('transitionend', end)
        settling = false
        if (back) {
          onBack() // App muestra la portada y quita las capas en el mismo cuadro
        } else {
          clearPage(p)
          clearSwipe(front.current)
          window.scrollTo(0, pageY)
        }
      }
      p.addEventListener('transitionend', end)
      window.setTimeout(end, 340)
    }

    function onStart(e: TouchEvent) {
      if (settling || e.touches.length !== 1) return
      const t = e.touches[0]
      start = t.clientX <= EDGE ? { x: t.clientX, y: t.clientY } : null
      dragging = false
    }

    function onMove(e: TouchEvent) {
      if (!start) return
      const t = e.touches[0]
      const mx = t.clientX - start.x
      const my = t.clientY - start.y
      if (!dragging) {
        if (Math.abs(my) > SLOP && Math.abs(my) > mx) {
          start = null // era scroll vertical
          return
        }
        if (mx < SLOP) return
        if (!begin()) {
          start = null
          return
        }
        dragging = true
        lastX = t.clientX
        lastT = e.timeStamp
      }
      e.preventDefault()
      dx = Math.max(0, mx)
      const dt = e.timeStamp - lastT
      if (dt > 0) speed = (t.clientX - lastX) / dt
      lastX = t.clientX
      lastT = e.timeStamp
      place(dx)
    }

    function onEnd() {
      start = null
      if (!dragging) return
      dragging = false
      settle(dx > innerWidth * COMMIT || speed > FLICK)
    }

    function onCancel() {
      start = null
      if (!dragging) return
      dragging = false
      settle(false)
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onCancel)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onCancel)
    }
  }, [enabled, front, page, frontY, onBack])
}
