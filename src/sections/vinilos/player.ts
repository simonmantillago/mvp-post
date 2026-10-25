// Reproductor embebido controlado por la aguja.
// Spotify: iFrame API (EmbedController) con play/resume/pause y `playback_update` para el giro.
// YouTube: el iframe con enablejsapi recibe playVideo/pauseVideo por postMessage (sin estado de vuelta).
// En el iPhone el embed de Spotify suele dar solo la muestra de 30 s; la canción entera se abre en Spotify.
import { useEffect, useRef, useState, type RefObject } from 'react'

type PlaybackUpdate = { data: { isPaused: boolean; isBuffering?: boolean; position: number; duration: number } }
type EmbedController = {
  loadUri(uri: string): void
  play(): void
  resume(): void
  pause(): void
  destroy(): void
  addListener(event: 'ready', cb: () => void): void
  addListener(event: 'playback_update', cb: (e: PlaybackUpdate) => void): void
}
type IFrameAPI = {
  createController(el: HTMLElement, options: { uri: string; width?: string | number; height?: string | number }, cb: (c: EmbedController) => void): void
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void
  }
}

let apiPromise: Promise<IFrameAPI> | null = null
function loadSpotifyApi() {
  apiPromise ??= new Promise<IFrameAPI>((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve
    const s = document.createElement('script')
    s.src = 'https://open.spotify.com/embed/iframe-api/v1'
    s.async = true
    s.onerror = () => {
      apiPromise = null
      reject(new Error('iframe api'))
    }
    document.head.appendChild(s)
  })
  return apiPromise
}

export type PlayerState = {
  /** El embed ya cargó. */
  ready: boolean
  /** Lo que reporta el reproductor (Spotify); null mientras no ha dicho nada. */
  playing: boolean | null
  /** Duración que reporta Spotify, en ms (≈ 30 000 cuando es la muestra). */
  duration: number
  failed: boolean
}

/**
 * Monta el embed de Spotify dentro de `host` y lo mantiene con `uri`.
 * `onChange(playing)` avisa cuando el reproductor empieza o se detiene por su cuenta
 * (botón del embed, fin de la muestra), para mover el brazo.
 */
export function useSpotifyEmbed(host: RefObject<HTMLDivElement | null>, uri: string | null, onChange: (playing: boolean) => void) {
  const [state, setState] = useState<PlayerState>({ ready: false, playing: null, duration: 0, failed: false })
  const ctrl = useRef<EmbedController | null>(null)
  const started = useRef(false)
  const loaded = useRef<string | null>(null)
  const last = useRef<boolean | null>(null)
  const changed = useRef(onChange)
  changed.current = onChange

  const mountedIn = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Sin canción de Spotify (o con el contenedor nuevo) el embed viejo se destruye
    if (ctrl.current && (!uri || mountedIn.current !== host.current)) {
      ctrl.current.destroy()
      ctrl.current = null
      loaded.current = null
      last.current = null
      setState({ ready: false, playing: null, duration: 0, failed: false })
    }
    if (!uri || !host.current) return
    if (ctrl.current) {
      if (loaded.current !== uri) {
        ctrl.current.loadUri(uri)
        loaded.current = uri
        started.current = false
        last.current = null
        setState((s) => ({ ...s, playing: null, duration: 0 }))
      }
      return
    }
    let alive = true
    const el = document.createElement('div')
    host.current.replaceChildren(el)
    mountedIn.current = host.current
    loadSpotifyApi()
      .then((api) => {
        if (!alive) return
        api.createController(el, { uri, width: '100%', height: 80 }, (c) => {
          if (!alive) return c.destroy()
          ctrl.current = c
          loaded.current = uri
          started.current = false
          c.addListener('ready', () => setState((s) => ({ ...s, ready: true })))
          c.addListener('playback_update', ({ data }) => {
            if (data.isBuffering) return
            const playing = !data.isPaused
            const before = last.current
            last.current = playing
            if (before !== playing && (playing || before === true)) changed.current(playing)
            if (playing) started.current = true
            setState((s) => ({ ...s, playing, duration: data.duration }))
          })
        })
      })
      .catch(() => alive && setState((s) => ({ ...s, failed: true })))
    return () => {
      alive = false
    }
  }, [uri, host])

  // Al salir de la sección se destruye el embed
  useEffect(
    () => () => {
      ctrl.current?.destroy()
      ctrl.current = null
    },
    [],
  )

  return {
    ...state,
    play() {
      const c = ctrl.current
      if (!c) return
      if (started.current) c.resume()
      else c.play()
    },
    pause() {
      ctrl.current?.pause()
    },
  }
}

/** YouTube: órdenes por postMessage al iframe (necesita `enablejsapi=1` en la URL). */
export function youtubeCommand(frame: HTMLIFrameElement | null, func: 'playVideo' | 'pauseVideo') {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*')
}
