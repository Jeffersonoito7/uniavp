import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  const { data: superRecord } = await (adminClient.from('super_admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord && !superRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const host = req.headers.get('host') ?? ''
  const tenantId = adminRecord?.tenant_id ?? await getTenantId(host)

  const body: { chave: string; valor: string }[] = await req.json()
  if (!Array.isArray(body)) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  for (const { chave, valor } of body) {
    if (!chave) continue
    if (tenantId) {
      await (adminClient.from('configuracoes') as any)
        .upsert({ chave, valor, tenant_id: tenantId }, { onConflict: 'chave,tenant_id' })
    } else {
      await (adminClient.from('configuracoes') as any)
        .upsert({ chave, valor }, { onConflict: 'chave' })
    }
  }

  return NextResponse.json({ ok: true })
}
