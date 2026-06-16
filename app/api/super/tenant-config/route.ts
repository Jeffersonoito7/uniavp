import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getSuperAdmin(userId: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await adminClient.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

// Super admin grava qualquer chave de configuração em qualquer tenant
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { tenant_id, chave, valor } = await req.json()
  if (!tenant_id || !chave) return NextResponse.json({ error: 'tenant_id e chave obrigatórios' }, { status: 400 })

  const valorJson = JSON.stringify(valor)

  const { error } = await adminClient.from('configuracoes')
    .upsert({ tenant_id, chave, valor: valorJson }, { onConflict: 'tenant_id,chave' })

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
