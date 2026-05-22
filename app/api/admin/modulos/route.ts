import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { titulo, descricao, capa_url } = body
  if (!titulo) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  let q = (adminClient.from('modulos') as any).select('ordem').order('ordem', { ascending: false }).limit(1)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  const { data: ultimo } = await q.maybeSingle()
  const ordem = (ultimo?.ordem ?? 0) + 1

  const { data: modulo, error } = await (adminClient.from('modulos') as any)
    .insert({ titulo, descricao: descricao ?? null, capa_url: capa_url ?? null, ordem, publicado: false, perfis_permitidos: body.perfis_permitidos ?? ['consultor', 'gestor'], ...(ctx.tenantId ? { tenant_id: ctx.tenantId } : {}) })
    .select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ modulo })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const camposPermitidos = [
    'titulo', 'descricao', 'capa_url', 'publicado', 'ordem', 'perfis_permitidos',
    'cert_ativo', 'cert_template_url', 'cert_nome_y', 'cert_nome_tamanho', 'cert_nome_cor', 'cert_nome_estilo',
    'cert_logo_esq_url', 'cert_logo_dir_url', 'cert_logo_y', 'cert_logo_tam',
    'cert_assinatura_url', 'cert_assinatura_nome', 'cert_assinatura_cargo', 'cert_assinatura_y',
  ]
  const atualizacoes: Record<string, unknown> = {}
  for (const campo of camposPermitidos) {
    if (campo in updates) atualizacoes[campo] = updates[campo]
  }

  let q = (adminClient.from('modulos') as any).update(atualizacoes).eq('id', id)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  const { data: modulo, error } = await q.select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ modulo })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  let q = (adminClient.from('modulos') as any).delete().eq('id', id)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
