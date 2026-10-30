// Sonido del Ruletazo, sintetizado en el momento (sin archivos): un clic de lengüeta por cada clavija
// que pasa bajo la flecha y, al caer, un golpe sordo seguido de una campanita de concurso.
// iOS solo deja sonar audio tras un toque: el contexto se crea y se desbloquea en el botón (prepareRuleta).
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null
let master: GainNode | null = null

function audio() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

/** Llamar dentro de un toque: desbloquea el audio en iOS y prepara el ruido de los clics. */
export function prepareRuleta() {
  const a = audio()
  if (!a || noise) return
  const len = Math.floor(a.sampleRate * 0.03)
  noise = a.createBuffer(1, len, a.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4
}

/** Un clic de la lengüeta contra una clavija. `speed` (0–1) lo hace un poco más agudo y fuerte cuando va rápido. */
export function rouletteTick(speed: number) {
  const a = audio()
  if (!a || !noise || !master) return
  const at = a.currentTime + 0.005
  const s = Math.min(1, Math.max(0, speed))

  // El "tic" del plástico: ruido corto por un filtro estrecho
  const src = a.createBufferSource()
  src.buffer = noise
  src.playbackRate.value = 0.9 + Math.random() * 0.2
  const band = a.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 2600 + s * 1400 + Math.random() * 300
  band.Q.value = 5
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(1 + s * 0.6, at + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03)
  src.connect(band).connect(g).connect(master)
  src.start(at)

  // Cuerpo de madera: un "toc" muy breve debajo del tic
  const body = a.createOscillator()
  body.type = 'triangle'
  body.frequency.setValueAtTime(1300 + s * 300, at)
  body.frequency.exponentialRampToValueAtTime(700, at + 0.02)
  const bg = a.createGain()
  bg.gain.setValueAtTime(0.0001, at)
  bg.gain.exponentialRampToValueAtTime(0.32, at + 0.002)
  bg.gain.exponentialRampToValueAtTime(0.0001, at + 0.025)
  body.connect(bg).connect(master)
  body.start(at)
  body.stop(at + 0.03)
}

function tone(a: AudioContext, out: AudioNode, freq: number, at: number, dur: number, peak: number, type: OscillatorType) {
  const o = a.createOscillator()
  o.type = type
  o.frequency.value = freq
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(peak, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(out)
  o.start(at)
  o.stop(at + dur + 0.02)
}

/** La ruleta cae: un golpe sordo de la flecha y una campanita de concurso que sube. */
export function rouletteLand() {
  const a = audio()
  if (!a || !master) return
  const at = a.currentTime + 0.01

  // Golpe sordo
  const thud = a.createOscillator()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(170, at)
  thud.frequency.exponentialRampToValueAtTime(55, at + 0.18)
  const tg = a.createGain()
  tg.gain.setValueAtTime(0.0001, at)
  tg.gain.exponentialRampToValueAtTime(0.8, at + 0.005)
  tg.gain.exponentialRampToValueAtTime(0.0001, at + 0.25)
  thud.connect(tg).connect(master)
  thud.start(at)
  thud.stop(at + 0.3)

  // Campanita: arpegio en Sol mayor y una nota que queda sonando, con un leve eco
  const echo = a.createDelay()
  echo.delayTime.value = 0.16
  const feedback = a.createGain()
  feedback.gain.value = 0.28
  const wet = a.createGain()
  wet.gain.value = 0.35
  echo.connect(feedback).connect(echo)
  echo.connect(wet).connect(master)
  const bell = a.createGain()
  bell.connect(master)
  bell.connect(echo)

  const notes = [784, 988, 1175, 1568]
  notes.forEach((f, i) => tone(a, bell, f, at + 0.12 + i * 0.085, 0.55, 0.22, 'triangle'))
  const last = at + 0.12 + notes.length * 0.085
  tone(a, bell, 1568, last, 1.4, 0.2, 'sine')
  tone(a, bell, 3136, last, 0.9, 0.05, 'sine')
}
