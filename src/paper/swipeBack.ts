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
 * Mientras dura, la portada (`.front-layer.is-under`) y la sección (`.page-layer.is-swiping`)
 * se apilan justo en la parte de la página que se está viendo, y cada una corre su contenido
 * (`.layer-inner`, `top` negativo) al punto donde estaba. El scroll de la ventana no se toca:
 * en el iPhone, mover el scroll y la página a la vez no cae en el mismo cuadro y parpadeaba
 * cuando la sección estaba bajada. No son `position: fixed` a propósito:
 * en la app instalada (barra de estado translúcida) iOS recorta lo fijo antes del borde de abajo
 * y quedaba una franja negra. Lo que sí es fijo dentro de la sección (p. ej. el «+» del Collage)
 * se ubica respecto a la capa, que mide lo mismo que la ventana, así que no se mueve.
 * Como varias secciones pintan su fondo en <html>, la capa se lleva una copia de ese fondo, y un
 * `::before` lo alarga hasta el borde de la pantalla (`--swipe-extra`).
 * Lo que va pegado con `position: sticky` (el recuadro de escribir de Cartas) se marca con
 * `data-swipe-freeze`: mientras dura el gesto queda clavado en el punto de la pantalla donde estaba,
 * porque iOS lo recoloca a destiempo dentro de una capa que se mueve y se veía saltar.
 */
const EDGE = 30 // px desde el borde donde empieza el gesto
const SLOP = 8 // px antes de decidir si es horizontal
const COMMIT = 0.33 // fracción del ancho para volver al soltar
const FLICK = 0.45 // px/ms: un tirón rápido vuelve aunque sea corto

const BG = ['backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundColor'] as const

/** Cuánto le falta a la ventana para llegar al borde de la pantalla (en la app instalada), con margen. */
function extraBelow() {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return Math.max(0, (standalone ? screen.height : 0) - window.innerHeight) + 120
}

/** `at`: dónde está la ventana (la capa se pone ahí); `y`: el scroll que tenía su contenido. */
function lift(layer: HTMLElement, cls: string, at: number, y: number) {
  layer.style.top = `${at}px`
  layer.style.height = `${window.innerHeight}px`
  layer.classList.add(cls)
  const inner = layer.firstElementChild as HTMLElement | null
  if (inner) inner.style.top = `${-y}px`
}

function drop(layer: HTMLElement, cls: string) {
  layer.classList.remove(cls)
  layer.style.top = ''
  layer.style.height = ''
  const inner = layer.firstElementChild as HTMLElement | null
  if (inner) inner.style.top = ''
}

/** Deja la portada como estaba (la llama también App al mostrar la portada tras volver). */
export function clearSwipe(front: HTMLElement | null) {
  const root = document.documentElement
  root.classList.remove('is-swiping-back')
  root.style.removeProperty('--swipe-extra')
  if (front) drop(front, 'is-under')
}

const FREEZE = ['position', 'top', 'bottom', 'left', 'width', 'margin'] as const

/** Clava lo pegajoso en su sitio de la pantalla (se mide antes de mover las capas). */
function measureFrozen(page: HTMLElement) {
  return [...page.querySelectorAll<HTMLElement>('[data-swipe-freeze]')].map((el) => ({ el, r: el.getBoundingClientRect() }))
}

function freeze(items: { el: HTMLElement; r: DOMRect }[]) {
  for (const { el, r } of items) {
    // fixed dentro de una capa con transform = relativo a la capa, que arranca en el borde de arriba de la pantalla
    el.style.position = 'fixed'
    el.style.top = `${r.top}px`
    el.style.bottom = 'auto'
    el.style.left = `${r.left}px`
    el.style.width = `${r.width}px`
    el.style.margin = '0'
  }
}

function unfreeze(page: HTMLElement) {
  for (const el of page.querySelectorAll<HTMLElement>('[data-swipe-freeze]')) for (const k of FREEZE) el.style[k] = ''
}

function clearPage(page: HTMLElement) {
  unfreeze(page)
  drop(page, 'is-swiping')
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
      const frozen = measureFrozen(p)
      const root = document.documentElement
      // La sección se lleva su fondo, que vive en <html>
      const bg = getComputedStyle(root)
      for (const k of BG) p.style[k] = bg[k]
      p.style.transition = 'none'
      root.style.setProperty('--swipe-extra', `${extraBelow()}px`)
      root.classList.add('is-swiping-back')
      place(0)
      lift(f, 'is-under', pageY, frontY.current) // la portada espera debajo en el punto donde se dejó
      lift(p, 'is-swiping', pageY, pageY) // y la sección sigue donde estaba, sin mover el scroll
      freeze(frozen)
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
          if (window.scrollY !== pageY) window.scrollTo(0, pageY)
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
