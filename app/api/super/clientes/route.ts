import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

async function getSuperAdmin(user: { id: string }, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('super_admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await getSuperAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await (adminClient.from('clientes') as any)
    .insert({ nome: body.nome, dominio: body.dominio || '', contato_nome: body.contato_nome || '', contato_whatsapp: body.contato_whatsapp || '', contato_email: body.contato_email || '', observacoes: body.observacoes || '', gestor_ativo: body.gestor_ativo || false, limite_consultores: body.limite_consultores || 30 })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await getSuperAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { id, ...fields } = body
  const { data, error } = await (adminClient.from('clientes') as any).update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
