import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function verificarAdmin(adminClient: ReturnType<typeof createServiceRoleClient>, userId: string) {
  const { data } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(adminClient, user.id)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, nome, email, whatsapp, status, gestor_nome, gestor_whatsapp } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (email !== undefined) updates.email = email
  if (whatsapp !== undefined) updates.whatsapp = whatsapp
  if (status !== undefined) updates.status = status
  if (gestor_nome !== undefined) updates.gestor_nome = gestor_nome
  if (gestor_whatsapp !== undefined) updates.gestor_whatsapp = gestor_whatsapp

  const { data: aluno, error } = await (adminClient.from('alunos') as any)
    .update(updates).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Atualiza email no auth se mudou
  if (email && aluno.user_id) {
    await adminClient.auth.admin.updateUserById(aluno.user_id, { email }).catch(() => {})
  }

  return NextResponse.json({ aluno })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(adminClient, user.id)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Busca o user_id do aluno
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('user_id').eq('id', id).maybeSingle()

  // Remove do banco
  const { error } = await (adminClient.from('alunos') as any).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Remove da autenticação
  if (aluno?.user_id) {
    await adminClient.auth.admin.deleteUser(aluno.user_id).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
