import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

// GET — lista perguntas do tenant
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  let q = (adminClient.from('funil_perguntas' as any) as any)
    .select('id, ordem, texto, alternativas, ativa')
    .order('ordem')
  q = ctx.tenantId ? q.eq('tenant_id', ctx.tenantId) : q.is('tenant_id', null)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ perguntas: data ?? [] })
}

// POST — cria pergunta
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { texto, alternativas, ordem } = await req.json()
  if (!texto || !Array.isArray(alternativas) || alternativas.length < 2)
    return NextResponse.json({ error: 'texto e pelo menos 2 alternativas são obrigatórios' }, { status: 400 })

  const correta = alternativas.filter((a: { correta: boolean }) => a.correta)
  if (correta.length !== 1)
    return NextResponse.json({ error: 'Exatamente uma alternativa deve ser marcada como correta' }, { status: 400 })

  const { data, error } = await (adminClient.from('funil_perguntas' as any) as any)
    .insert({ texto, alternativas, ordem: ordem ?? 0, ativa: true, ...(ctx.tenantId ? { tenant_id: ctx.tenantId } : {}) })
    .select('id, ordem, texto, alternativas, ativa')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pergunta: data })
}

// PUT — atualiza pergunta
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, texto, alternativas, ordem, ativa } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (texto !== undefined) updates.texto = texto
  if (alternativas !== undefined) updates.alternativas = alternativas
  if (ordem !== undefined) updates.ordem = ordem
  if (ativa !== undefined) updates.ativa = ativa

  let q = (adminClient.from('funil_perguntas' as any) as any).update(updates).eq('id', id)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)

  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — remove pergunta
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  let q = (adminClient.from('funil_perguntas' as any) as any).delete().eq('id', id)
  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)

  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
