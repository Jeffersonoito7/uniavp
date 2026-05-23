import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { registrarWebhook } from '@/lib/efi'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const appUrl = await getAppUrl()
  const webhookUrl = `${appUrl}/api/webhooks/pix`

  try {
    await registrarWebhook(webhookUrl)
    return NextResponse.json({ ok: true, webhookUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
