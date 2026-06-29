import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data, error } = await (adminClient.from('contrato_templates' as any) as any)
    .select('*').eq('id', params.id).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
  return NextResponse.json({ template: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.nome !== undefined) updates.nome = body.nome
  if (body.descricao !== undefined) updates.descricao = body.descricao
  if (body.corpo_html !== undefined) updates.corpo_html = body.corpo_html
  if (body.variaveis !== undefined) updates.variaveis = body.variaveis
  if (body.ativo !== undefined) updates.ativo = body.ativo
  if (body.arquivado !== undefined) updates.arquivado = body.arquivado

  const { data, error } = await (adminClient.from('contrato_templates' as any) as any)
    .update(updates).eq('id', params.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, template: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Soft delete via arquivado=true
  const { error } = await (adminClient.from('contrato_templates' as any) as any)
    .update({ arquivado: true }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
