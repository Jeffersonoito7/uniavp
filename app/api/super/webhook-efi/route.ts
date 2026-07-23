import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { registrarWebhook, consultarWebhook } from '@/lib/efi'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

async function isSuperAdmin(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await adminClient.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const status = await consultarWebhook()
    return NextResponse.json(status)
  } catch (e: any) {
    return NextResponse.json({ registrado: false, erro: e.message })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const appUrl = await getAppUrl()
  const token = process.env.EFI_WEBHOOK_TOKEN
  if (!token) return NextResponse.json({ error: 'EFI_WEBHOOK_TOKEN não configurado no ambiente' }, { status: 500 })

  const webhookUrl = `${appUrl}/api/webhooks/pix?token=${token}`

  try {
    await registrarWebhook(webhookUrl)
    return NextResponse.json({ ok: true, webhookUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
