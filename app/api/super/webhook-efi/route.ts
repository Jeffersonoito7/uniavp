import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

const BASE = process.env.EFI_SANDBOX === 'true'
  ? 'https://pix-h.api.efipay.com.br'
  : 'https://pix.api.efipay.com.br'

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://universidade.oito7digital.com.br'
  const webhookUrl = `${appUrl}/api/webhooks/pix`
  const chave = process.env.EFI_PIX_KEY!

  // Obtém token
  const credentials = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64')
  const tokenRes = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  const { access_token } = await tokenRes.json()

  // Registra webhook na Efí
  const res = await fetch(`${BASE}/v2/webhook/${chave}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookUrl }),
  })

  if (res.ok || res.status === 204) {
    return NextResponse.json({ ok: true, webhookUrl })
  }

  const err = await res.json().catch(() => ({}))
  return NextResponse.json({ error: JSON.stringify(err) }, { status: 500 })
}
