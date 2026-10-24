// Sonido de obturador sintetizado con Web Audio (sin archivos): un clic metálico corto + el golpe del espejo.
// Solo suena tras un toque (iOS no deja reproducir audio sin gesto), así que el contexto se crea al disparar.
let ctx: AudioContext | null = null

function audio() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx ??= new AC()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function click(a: AudioContext, at: number, pitch: number) {
  // Ruido filtrado: el "chak" del obturador
  const len = Math.floor(a.sampleRate * 0.05)
  const buffer = a.createBuffer(1, len, a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const noise = a.createBufferSource()
  noise.buffer = buffer
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

  // Golpe grave del espejo
  const thump = a.createOscillator()
  thump.type = 'triangle'
  thump.frequency.setValueAtTime(190 * pitch, at)
  thump.frequency.exponentialRampToValueAtTime(70, at + 0.04)
  const tg = a.createGain()
  tg.gain.setValueAtTime(0.0001, at)
  tg.gain.exponentialRampToValueAtTime(0.35, at + 0.004)
  tg.gain.exponentialRampToValueAtTime(0.0001, at + 0.045)
  thump.connect(tg).connect(a.destination)
  thump.start(at)
  thump.stop(at + 0.06)
}

/** Clic-clic-clic: una cámara por cada momento (en ms), cada una con un tono un poco distinto. */
export function shutterBurst(momentsMs: number[]) {
  const a = audio()
  if (!a) return
  const now = a.currentTime + 0.01
  momentsMs.forEach((ms) => click(a, now + ms / 1000, 0.85 + Math.random() * 0.35))
}

/** Ritmo de la ráfaga: ta-ta-ta-ta … ¡ta! (la última es la foto de verdad). */
export const BURST = [0, 95, 190, 285, 560]
