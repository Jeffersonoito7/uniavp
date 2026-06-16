import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { audit, getIp } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { chave, texto } = await req.json()
  if (!chave || !texto) return NextResponse.json({ error: 'chave e texto obrigatórios' }, { status: 400 })

  const { error } = await adminClient.from('mensagens_template')
    .upsert(
      { chave, texto, tenant_id: ctx.tenantId ?? null, updated_at: new Date().toISOString() },
      { onConflict: ctx.tenantId ? 'chave,tenant_id' : 'chave' }
    )

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })

  await audit({
    acao: 'admin.configuracao_alterada',
    entidade: 'mensagens_template',
    entidade_id: chave,
    tenant_id: ctx.tenantId,
    usuario_id: user.id,
    usuario_tipo: 'admin',
    dados_novos: { chave, texto },
    ip: getIp(req),
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { chave } = await req.json()
  if (!chave) return NextResponse.json({ error: 'chave obrigatória' }, { status: 400 })

  let q = adminClient.from('mensagens_template').delete().eq('chave', chave)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  else q = q.is('tenant_id', null)

  const { error } = await q
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })

  return NextResponse.json({ ok: true })
}
