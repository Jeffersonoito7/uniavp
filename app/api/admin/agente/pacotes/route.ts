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

  const { nome, creditos, valor, ordem } = await req.json()
  if (!nome || !creditos || !valor) return NextResponse.json({ error: 'nome, creditos e valor obrigatórios' }, { status: 400 })

  const tenantId = ctx.tenantId ?? null
  const { data, error } = await adminClient.from('agente_pacotes')
    .insert({ tenant_id: tenantId, nome, creditos: Number(creditos), valor: Number(valor), ordem: ordem ?? 0 })
    .select('id, nome, creditos, valor, ordem, ativo')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, pacote: data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, nome, creditos, valor, ordem, ativo } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  type PacoteUpdate = { nome?: string; creditos?: number; valor?: number; ordem?: number; ativo?: boolean }
  const updates: PacoteUpdate = {}
  if (nome !== undefined) updates.nome = nome
  if (creditos !== undefined) updates.creditos = Number(creditos)
  if (valor !== undefined) updates.valor = Number(valor)
  if (ordem !== undefined) updates.ordem = ordem
  if (ativo !== undefined) updates.ativo = ativo

  const { error } = await adminClient.from('agente_pacotes').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
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

  const { error } = await adminClient.from('agente_pacotes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
