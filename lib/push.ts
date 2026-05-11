import webPush from 'web-push'
import { createServiceRoleClient } from './supabase-server'

type PushPayload = { title: string; body: string; url?: string }

function getClient() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return null
  webPush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT || 'noreply@oito7digital.com.br'}`,
    pub, priv
  )
  return webPush
}

export async function enviarPushParaUsuario(userId: string, payload: PushPayload) {
  const client = getClient()
  if (!client) return
  const admin = createServiceRoleClient()
  const { data: subs } = await (admin.from('push_subscriptions') as any)
    .select('*').eq('user_id', userId)
  if (!subs?.length) return

  const expiradas: string[] = []
  await Promise.allSettled(
    subs.map(async (s: any) => {
      try {
        await client.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          JSON.stringify(payload)
        )
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) expiradas.push(s.id)
      }
    })
  )
  if (expiradas.length > 0) {
    await (admin.from('push_subscriptions') as any).delete().in('id', expiradas)
  }
}

export async function enviarPushParaAluno(alunoId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return
  const admin = createServiceRoleClient()
  const { data: aluno } = await (admin.from('alunos') as any)
    .select('user_id').eq('id', alunoId).maybeSingle()
  if (aluno?.user_id) await enviarPushParaUsuario(aluno.user_id, payload)
}

export async function enviarPushParaGestorConsultores(gestorWhatsapp: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY) return
  const admin = createServiceRoleClient()
  const { data: alunos } = await (admin.from('alunos') as any)
    .select('user_id').eq('gestor_whatsapp', gestorWhatsapp).eq('status', 'ativo')
  if (!alunos?.length) return
  await Promise.allSettled(
    alunos.map((a: any) => a.user_id ? enviarPushParaUsuario(a.user_id, payload) : null)
  )
}
