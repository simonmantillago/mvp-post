import { useEffect, type RefObject } from 'react'

/**
 * Deslizar desde el borde izquierdo para volver a la portada, hecho por la app.
 *
 * El gesto de iOS enseña una captura de la página anterior, y en la app instalada esa captura
 * suele faltar (se ve blanco). Por eso la app no deja entradas en el historial (todo navega con
 * `replace`) y el gesto es propio: la portada, que sigue montada, entra desde la izquierda bajo
 * el dedo, en el punto donde se dejó. Al soltar pasado un tercio (o con un tirón), se vuelve.
 */
const EDGE = 30 // px desde el borde donde empieza el gesto
const SLOP = 8 // px antes de decidir si es horizontal
const COMMIT = 0.33 // fracción del ancho para volver al soltar
const FLICK = 0.45 // px/ms: un tirón rápido vuelve aunque sea corto

/** Deja la capa de la portada como estaba (la llama también App al mostrar la portada). */
export function clearSwipe(layer: HTMLElement | null) {
  if (!layer) return
  layer.classList.remove('is-swiping')
  layer.style.transform = ''
  layer.style.transition = ''
}

export function useSwipeBack({
  enabled,
  layer,
  frontY,
  onBack,
}: {
  enabled: boolean
  layer: RefObject<HTMLElement | null>
  frontY: RefObject<number>
  onBack: () => void
}) {
  useEffect(() => {
    if (!enabled) return
    let start: { x: number; y: number } | null = null
    let dragging = false
    let settling = false
    let dx = 0
    let lastX = 0
    let lastT = 0
    let speed = 0

    const place = (x: number) => {
      if (layer.current) layer.current.style.transform = `translate3d(${x - innerWidth}px, 0, 0)`
    }

    function begin() {
      const l = layer.current
      if (!l) return false
      l.style.transition = 'none'
      l.classList.add('is-swiping')
      l.scrollTop = frontY.current // la portada aparece en el punto donde se dejó
      place(0)
      return true
    }

    function settle(back: boolean) {
      const l = layer.current
      if (!l) return
      settling = true
      l.style.transition = 'transform 220ms var(--ease-out)'
      place(back ? innerWidth : 0)
      let done = false
      const end = () => {
        if (done) return
        done = true
        l.removeEventListener('transitionend', end)
        settling = false
        if (back) onBack() // App quita la capa en el mismo cuadro en que muestra la portada
        else clearSwipe(l)
      }
      l.addEventListener('transitionend', end)
      window.setTimeout(end, 320)
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
  }, [enabled, layer, frontY, onBack])
}
