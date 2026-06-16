import { traduzirErro } from '@/lib/erros'
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

  const { categoria, argumento, ordem } = await req.json()
  if (!categoria || !argumento) return NextResponse.json({ error: 'categoria e argumento obrigatórios' }, { status: 400 })

  const tenantId = ctx.tenantId ?? null
  const { data, error } = await adminClient.from('agente_argumentos')
    .insert({ tenant_id: tenantId, categoria, argumento, ordem: ordem ?? 0 })
    .select('id, categoria, argumento, ordem, ativo')
    .single()

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json({ ok: true, argumento: data })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, categoria, argumento, ordem, ativo } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  type ArgUpdate = { categoria?: string; argumento?: string; ordem?: number; ativo?: boolean }
  const updates: ArgUpdate = {}
  if (categoria !== undefined) updates.categoria = categoria
  if (argumento !== undefined) updates.argumento = argumento
  if (ordem !== undefined) updates.ordem = ordem
  if (ativo !== undefined) updates.ativo = ativo

  const { error } = await adminClient.from('agente_argumentos').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
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

  const { error } = await adminClient.from('agente_argumentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })
  return NextResponse.json({ ok: true })
}
