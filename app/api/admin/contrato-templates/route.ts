import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  let q = (adminClient.from('contrato_templates' as any) as any)
    .select('id, nome, descricao, variaveis, ativo, arquivado, created_at')
    .eq('arquivado', false)
    .order('created_at', { ascending: false })
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { nome, descricao, corpo_html, variaveis } = await req.json()
  if (!nome || !corpo_html) return NextResponse.json({ error: 'nome e corpo_html obrigatórios' }, { status: 400 })

  const { data, error } = await (adminClient.from('contrato_templates' as any) as any).insert({
    nome,
    descricao: descricao || null,
    corpo_html,
    variaveis: variaveis ?? [],
    tenant_id: ctx.tenantId,
    criado_por: user.id,
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, template: data })
}
