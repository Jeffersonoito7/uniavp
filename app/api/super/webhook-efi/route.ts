import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { registrarWebhook } from '@/lib/efi'

async function isSuperAdmin(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('super_admins') as any).select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const appUrl = 'https://universidade.oito7digital.com.br'
  const webhookUrl = `${appUrl}/api/webhooks/pix`

  try {
    await registrarWebhook(webhookUrl)
    return NextResponse.json({ ok: true, webhookUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
