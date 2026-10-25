// Modo demo SOLO de desarrollo (`?demo` en localhost): un cliente falso en memoria con datos de
// ejemplo para revisar las pantallas sin iniciar sesión con cuentas reales. Las fotos de ejemplo
// son las referencias de docs/inspiration (servidas por Vite en dev); nada de esto llega a producción.
/* eslint-disable @typescript-eslint/no-explicit-any */

export function createDemoClient(): any {
  const HER = 'demo-her'
  const HIM = 'demo-him'
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
  const ref = (n: string) => `/docs/inspiration/periodico/${n}`

  const db: Record<string, any[]> = {
    profiles: [
      { id: HER, display_name: 'María Victoria', nick: '', avatar_path: null, sounds_enabled: true, muted_sections: [] },
      { id: HIM, display_name: 'Simón', nick: '', avatar_path: null, sounds_enabled: true, muted_sections: [] },
    ],
    editions: [
      {
        id: 'e1', number: 1, author_id: HIM, cover_path: 'glam-dark-leopard.webp', cover_caption: 'Ejemplo de desarrollo: foto de referencia.',
        headline: '¿Y si el amor fuera una suscripción de por vida?', continues_to: 'vinilos', published_at: ago(600), created_at: ago(700),
        body: 'Esta semana me descubrí revisando el buzón a las siete de la mañana, como quien espera el periódico del domingo. Y entonces no pude evitar preguntarme si el amor no es eso: una suscripción que uno renueva sin pensarlo.\n\nHay lectores que leen por costumbre y lectores que leen por hambre. Tú lees como quien abre una carta.\n\n> Hay suscripciones que nunca se cancelan.\n\nAsí que aquí está la primera edición. No promete noticias: promete que mañana habrá otra.',
      },
    ],
    messages: [
      { id: 1, author_id: HER, kind: 'text', body: 'Querido columnista: tu última edición me hizo sonreír en el metro.', created_at: ago(90), read_at: ago(80) },
      { id: 2, author_id: HIM, kind: 'text', body: 'La redacción agradece a su lectora más fiel.', created_at: ago(70), read_at: ago(60) },
      { id: 3, author_id: HER, kind: 'nudge', body: '', created_at: ago(40), read_at: ago(30) },
      { id: 4, author_id: HER, kind: 'text', body: '¿Vemos algo esta noche?', created_at: ago(20), read_at: null },
    ],
    // s1 apunta a un track público real para probar el embed y la aguja en dev.
    songs: [
      { id: 's1', author_id: HIM, url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', platform: 'spotify', title: 'Canción de ejemplo', artist: 'Artista de prueba', dedication: 'Esta me recuerda a ti, al domingo y al café.', cover_url: '/portada/big.webp', created_at: ago(300) },
      { id: 's2', author_id: HER, url: 'https://youtu.be/x', platform: 'youtube', title: 'Otra canción', artist: 'Otra artista', dedication: 'Para el camino.', cover_url: null, created_at: ago(900) },
      { id: 's3', author_id: HIM, url: 'https://open.spotify.com/track/1', platform: 'spotify', title: 'La del penthouse', artist: 'Trío de jazz', dedication: '', cover_url: null, created_at: ago(2000) },
    ],
    watch_items: [
      { id: 'w1', title: 'Película de ejemplo', kind: 'movie', status: 'want', season: null, episode: null, poster_url: null, note: '', added_by: HER, picked_by: null, started_at: null, finished_at: null, created_at: ago(500) },
      { id: 'w2', title: 'Serie larga', kind: 'series', status: 'want', season: null, episode: null, poster_url: null, note: '', added_by: HIM, picked_by: null, started_at: null, finished_at: null, created_at: ago(400) },
      { id: 'w3', title: 'Comedia romántica', kind: 'movie', status: 'want', season: null, episode: null, poster_url: null, note: '', added_by: HER, picked_by: null, started_at: null, finished_at: null, created_at: ago(300) },
      { id: 'w4', title: 'La de los sábados', kind: 'series', status: 'watching', season: 2, episode: 5, poster_url: null, note: '', added_by: HIM, picked_by: HIM, started_at: ago(200), finished_at: null, created_at: ago(1000) },
      { id: 'w5', title: 'Clásico de los 2000', kind: 'movie', status: 'watched', season: null, episode: null, poster_url: null, note: '', added_by: HER, picked_by: HER, started_at: ago(3000), finished_at: ago(2900), created_at: ago(4000) },
    ],
    watch_ratings: [{ item_id: 'w5', user_id: HIM, rating: 4, comment: '' }],
    photos: [
      { id: 'p1', author_id: HER, storage_path: 'glam-dark-leopard.webp', caption: 'nuestra primera cena', effect: 'vintage', created_at: ago(100) },
      { id: 'p2', author_id: HIM, storage_path: 'y2k-swag-collage.webp', caption: 'ese vestido…', effect: 'flash', created_at: ago(1500) },
      { id: 'p3', author_id: HER, storage_path: 'stickers.webp', caption: '', effect: 'original', created_at: ago(3000) },
    ],
    photo_likes: [{ photo_id: 'p1', user_id: HIM }],
    collage_items: [
      { id: 'c1', author_id: HER, kind: 'photo', storage_path: 'y2k-swag-collage.webp', sticker_id: null, body: null, style: {}, bg_removed: false, x: 0.05, y: 0.08, width: 0.5, rotation: -5, z: 1, locked: true, locked_by: HER, created_at: ago(100) },
      { id: 'c2', author_id: HIM, kind: 'sticker', storage_path: null, sticker_id: 'star-chrome', body: null, style: {}, bg_removed: false, x: 0.6, y: 0.05, width: 0.3, rotation: 12, z: 2, locked: false, locked_by: null, created_at: ago(90) },
      { id: 'c3', author_id: HER, kind: 'text', storage_path: null, sticker_id: null, body: 'XOXO', style: { color: '#3ddc97' }, bg_removed: false, x: 0.42, y: 0.55, width: 0.55, rotation: -8, z: 3, locked: false, locked_by: null, created_at: ago(80) },
      { id: 'c4', author_id: HIM, kind: 'photo', storage_path: 'glam-dark-leopard.webp', sticker_id: null, body: null, style: {}, bg_removed: false, x: 0.1, y: 0.85, width: 0.45, rotation: 6, z: 4, locked: false, locked_by: null, created_at: ago(70) },
      { id: 'c5', author_id: HER, kind: 'sticker', storage_path: null, sticker_id: 'cherries', body: null, style: {}, bg_removed: false, x: 0.62, y: 0.95, width: 0.26, rotation: -10, z: 5, locked: false, locked_by: null, created_at: ago(60) },
    ],
    activity: [],
    section_reads: [],
    push_subscriptions: [],
  }

  const listeners = new Set<() => void>()
  const notify = () => setTimeout(() => listeners.forEach((l) => l()), 0)

  function query(table: string) {
    const filters: ((r: any) => boolean)[] = []
    let op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
    let payload: any = null
    let orderBy: { col: string; asc: boolean } | null = null
    let limit = Infinity
    let single: 'one' | 'maybe' | null = null
    let returning = false

    const run = () => {
      const rows = (db[table] ??= [])
      let result: any[] = []
      if (op === 'insert' || op === 'upsert') {
        const list = (Array.isArray(payload) ? payload : [payload]).map((p: any) => ({
          id: table === 'messages' ? Date.now() : crypto.randomUUID(),
          created_at: new Date().toISOString(),
          author_id: demoSession.user.id,
          ...(table === 'editions' ? { number: rows.length + 1, cover_caption: '', body: '', continues_to: null, published_at: null } : {}),
          ...(table === 'photos' ? { effect: 'original' } : {}),
          ...(table === 'collage_items' ? { style: {}, locked: false, locked_by: null, bg_removed: false } : {}),
          ...p,
        }))
        rows.push(...list)
        result = list
      } else {
        result = rows.filter((r) => filters.every((f) => f(r)))
        if (op === 'update') result.forEach((r) => Object.assign(r, payload))
        if (op === 'delete') db[table] = rows.filter((r) => !result.includes(r))
      }
      if (op !== 'select') notify()
      if (orderBy) result = [...result].sort((a, b) => (a[orderBy!.col] < b[orderBy!.col] ? -1 : 1) * (orderBy!.asc ? 1 : -1))
      result = result.slice(0, limit)
      if (op !== 'select' && !returning) return { data: null, error: null }
      if (single) return { data: result[0] ?? null, error: single === 'one' && !result[0] ? { message: 'no rows' } : null }
      return { data: result, error: null }
    }

    const b: any = {
      select: () => ((op === 'select' ? null : (returning = true)), b),
      insert: (p: any) => ((op = 'insert'), (payload = p), b),
      upsert: (p: any) => ((op = 'upsert'), (payload = p), b),
      update: (p: any) => ((op = 'update'), (payload = p), b),
      delete: () => ((op = 'delete'), b),
      eq: (c: string, v: any) => (filters.push((r) => r[c] === v), b),
      in: (c: string, v: any[]) => (filters.push((r) => v.includes(r[c])), b),
      is: (c: string, v: any) => (filters.push((r) => (r[c] ?? null) === v), b),
      not: (c: string, _o: string, v: any) => (filters.push((r) => (r[c] ?? null) !== v), b),
      match: (m: any) => (filters.push((r) => Object.entries(m).every(([k, v]) => r[k] === v)), b),
      order: (col: string, o?: { ascending?: boolean }) => ((orderBy = { col, asc: o?.ascending ?? true }), b),
      limit: (n: number) => ((limit = n), b),
      single: () => ((single = 'one'), b),
      maybeSingle: () => ((single = 'maybe'), b),
      then: (res: any, rej: any) => Promise.resolve(run()).then(res, rej),
    }
    return b
  }

  const asHim = new URLSearchParams(location.search).get('demo') === 'el'
  const demoSession = asHim
    ? { user: { id: HIM, email: import.meta.env.VITE_EMAIL_HIM ?? 'el@demo' }, access_token: 'demo' }
    : { user: { id: HER, email: import.meta.env.VITE_EMAIL_HER ?? 'ella@demo' }, access_token: 'demo' }

  // Resultados falsos de `spotify-search`: «error» simula la caída y «zzz» la búsqueda vacía.
  const tracks = [
    ['Luz de domingo', 'Orquesta del Penthouse', 'Noches de nogal', '/portada/big.webp'],
    ['Luz de domingo (en vivo)', 'Orquesta del Penthouse', 'En vivo en la terraza', '/portada/cartelera.webp'],
    ['Domingo en Manhattan', 'Trío de jazz', 'Columnas', '/portada/swag.webp'],
    ['Carta a una lectora', 'La Redacción', 'Primera edición', '/portada/cartas.webp'],
    ['Ángel de medianoche', 'Las Polaroids', 'Flash', '/portada/angeles.webp'],
  ].map(([title, artist, album, cover], i) => ({
    id: `demo${i}`, uri: `spotify:track:demo${i}`, url: `https://open.spotify.com/track/demo${i}`,
    title, artist, album, cover, thumb: cover, duration_ms: 200_000,
  }))
  const functions = {
    invoke: async (_name: string, { body }: { body: { q: string } }) => {
      await new Promise((r) => setTimeout(r, 450))
      const q = body.q.toLowerCase()
      if (q.includes('error')) return { data: null, error: { message: 'demo' } }
      if (q.includes('zzz')) return { data: { tracks: [] }, error: null }
      return { data: { tracks }, error: null }
    },
  }

  return {
    from: query,
    functions,
    rpc: async (fn: string) => (fn === 'unseen_by_section' ? { data: [{ section: 'y2k', unseen: 2 }, { section: 'cartas', unseen: 1 }], error: null } : { data: 0, error: null }),
    channel: () => {
      const ch: any = { cb: () => {}, on: (_e: any, _f: any, cb: () => void) => ((ch.cb = cb), ch), subscribe: () => (listeners.add(() => ch.cb()), ch) }
      return ch
    },
    removeChannel: () => {},
    storage: {
      from: () => ({
        createSignedUrl: async (path: string) => ({ data: { signedUrl: ref(path) }, error: null }),
        upload: async (path: string) => ({ data: { path }, error: null }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: new URLSearchParams(location.search).get('demo') === 'fuera' ? null : demoSession } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
    },
  }
}
