import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { nome, descricao, custo_pontos, quantidade_disponivel } = body
  if (!nome || !custo_pontos) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { data: premio } = await (adminClient.from('premios') as any)
    .insert({ nome, descricao: descricao ?? null, custo_pontos, quantidade_disponivel: quantidade_disponivel ?? null })
    .select('*')
    .single()

  return NextResponse.json({ premio })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  await (adminClient.from('resgates') as any).update({ status }).eq('id', id)

  return NextResponse.json({ ok: true })
}
