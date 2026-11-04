// Edge Function `notify`: recibe una fila de `activity` (desde el trigger dispatch_push)
// y manda un Web Push a la otra persona de la pareja.
//
// Secretos (npx supabase secrets set ...):
//   NOTIFY_SECRET       el mismo valor guardado en Vault como `notify_secret`
//   VAPID_PUBLIC_KEY    también va al cliente como VITE_VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT       mailto:...
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// Desplegar con: npx supabase functions deploy notify --no-verify-jwt

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

type Activity = {
  id: number
  actor_id: string
  kind: string
  section: string
  ref_id: string | null
  preview: string | null
}

const routes: Record<string, string> = {
  portada: '/',
  y2k: '/y2k',
  alfombra: '/alfombra-roja',
  vinilos: '/vinilos',
  cartelera: '/cartelera',
  cartas: '/cartas',
}

function compose(a: Activity, who: string): { title: string; body: string } {
  const p = a.preview?.trim()
  switch (a.kind) {
    case 'edition_published':
      return { title: 'The MVP Post · nueva edición', body: p ? `“${p}” — por ${who}` : `${who} publicó una columna nueva` }
    case 'collage_added':
      return { title: 'Estilo · Y2K', body: `${who} pegó algo nuevo en el collage` }
    case 'photo_taken':
      return { title: 'Los Ángeles de Victoria', body: p ? `${who}: “${p}”` : `${who} tomó una foto nueva` }
    case 'photo_liked':
      return { title: 'Los Ángeles de Victoria', body: `A ${who} le encantó tu foto ♥` }
    case 'song_dedicated':
      return { title: 'Los vinilos de Big', body: p ? `${who} te dedicó “${p}”` : `${who} te dedicó una canción` }
    case 'letter':
      return { title: `Carta mágica de ${who}`, body: p || '…' }
    case 'extra':
      return { title: '¡TIN! ¡TIN!', body: `${who} quiere tin` }
    case 'movie_added':
      return { title: 'Cartelera', body: `${who} agregó “${p}” a la estantería` }
    case 'movie_picked':
      return { title: 'Cartelera', body: `${who} eligió “${p}” para ver` }
    case 'movie_rated':
      return { title: 'Cartelera', body: `${who} calificó “${p}”` }
    default:
      return { title: 'The MVP Post', body: `${who} hizo algo nuevo` }
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-notify-secret') !== Deno.env.get('NOTIFY_SECRET')) {
    return new Response('forbidden', { status: 403 })
  }

  const activity = (await req.json()) as Activity
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: members } = await db.from('couple_members').select('user_id')
  const recipient = members?.find((m) => m.user_id !== activity.actor_id)?.user_id
  if (!recipient) return new Response('no recipient', { status: 200 })

  const { data: profiles } = await db
    .from('profiles')
    .select('id, display_name, muted_sections')
    .in('id', [activity.actor_id, recipient])
  const actor = profiles?.find((p) => p.id === activity.actor_id)
  const target = profiles?.find((p) => p.id === recipient)
  if (target?.muted_sections?.includes(activity.section)) return new Response('muted', { status: 200 })

  const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', recipient)
  if (!subs?.length) return new Response('no subscriptions', { status: 200 })

  const { data: badge } = await db.rpc('unseen_count', { p_user: recipient })
  const { title, body } = compose(activity, actor?.display_name || 'Alguien')
  const payload = JSON.stringify({
    title,
    body,
    url: routes[activity.section] ?? '/',
    tag: `${activity.section}-${activity.kind}`,
    badge: badge ?? 0,
  })

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
          urgency: activity.kind === 'extra' || activity.kind === 'letter' ? 'high' : 'normal',
        })
      } catch (err) {
        // 404/410: el iPhone revocó la suscripción (app borrada, permiso quitado).
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('id', s.id)
        else console.error('push failed', status, err)
      }
    }),
  )

  return new Response('ok', { status: 200 })
})
