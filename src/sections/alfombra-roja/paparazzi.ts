// Sonido de la prensa: el audio de paparazzi elegido por Simón (public/sections/alfombra/paparazzi.mp3).
// iOS solo deja sonar audio tras un toque: el contexto se crea y se desbloquea al encender la cámara (prepareShutter),
// y el buffer queda decodificado para que la ráfaga suene sin retraso. Si el audio no cargó, suena un clic sintetizado.
let ctx: AudioContext | null = null
let buffer: AudioBuffer | null = null
let loading: Promise<void> | null = null

function audio() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx ??= new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Llamar dentro de un toque: desbloquea el audio en iOS y precarga el sonido de la prensa. */
export function prepareShutter() {
  const a = audio()
  if (!a || buffer || loading) return
  loading = fetch('/sections/alfombra/paparazzi.mp3')
    .then((r) => r.arrayBuffer())
    .then((data) => a.decodeAudioData(data))
    .then((b) => {
      buffer = b
    })
    .catch(() => {
      loading = null
    })
}

function click(a: AudioContext, at: number, pitch: number) {
  // Ruido filtrado: el "chak" del obturador
  const len = Math.floor(a.sampleRate * 0.05)
  const noiseBuffer = a.createBuffer(1, len, a.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const noise = a.createBufferSource()
  noise.buffer = noiseBuffer
  const band = a.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 2400 * pitch
  band.Q.value = 0.9
  const gain = a.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.7, at + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05)
  noise.connect(band).connect(gain).connect(a.destination)
  noise.start(at)
}

/** Suena la prensa. Con el audio cargado, suena entero (sus clics coinciden con BURST); si no, un clic por momento. */
export function shutterBurst(momentsMs: number[]) {
  const a = audio()
  if (!a) return
  if (buffer) {
    const src = a.createBufferSource()
    src.buffer = buffer
    src.connect(a.destination)
    src.start()
    return
  }
  const now = a.currentTime + 0.01
  momentsMs.forEach((ms) => click(a, now + ms / 1000, 0.85 + Math.random() * 0.35))
}

/** Ritmo de la ráfaga, medido sobre los golpes de paparazzi.mp3: cinco flashes y, en el último clic, la foto. */
export const BURST = [35, 155, 265, 470, 570, 720]
