import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, nome, email, whatsapp, status, gestor_nome, gestor_whatsapp, nova_senha, user_id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const updates: { nome?: string; email?: string; whatsapp?: string; status?: string; gestor_nome?: string | null; gestor_whatsapp?: string | null } = {}
  if (nome !== undefined) updates.nome = nome
  if (email !== undefined) updates.email = email
  if (whatsapp !== undefined) updates.whatsapp = whatsapp
  if (status !== undefined) updates.status = status
  if (gestor_nome !== undefined) updates.gestor_nome = gestor_nome
  if (gestor_whatsapp !== undefined) updates.gestor_whatsapp = gestor_whatsapp

  let putQuery = adminClient.from('alunos').update(updates).eq('id', id)
  if (ctx.tenantId) putQuery = putQuery.eq('tenant_id', ctx.tenantId)
  const { data: aluno, error } = await putQuery.select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const authUserId = aluno.user_id ?? user_id
  if (authUserId) {
    const authUpdates: Record<string, unknown> = {}
    if (email) authUpdates.email = email
    if (nova_senha && nova_senha.length >= 6) authUpdates.password = nova_senha
    if (Object.keys(authUpdates).length > 0) {
      await adminClient.auth.admin.updateUserById(authUserId, authUpdates).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, aluno })
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

  // Busca o user_id do aluno
  let deleteSelectQuery = adminClient.from('alunos').select('user_id').eq('id', id)
  if (ctx.tenantId) deleteSelectQuery = deleteSelectQuery.eq('tenant_id', ctx.tenantId)
  const { data: aluno } = await deleteSelectQuery.maybeSingle()

  // Remove do banco
  let deleteQuery = adminClient.from('alunos').delete().eq('id', id)
  if (ctx.tenantId) deleteQuery = deleteQuery.eq('tenant_id', ctx.tenantId)
  const { error } = await deleteQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Remove da autenticação
  if (aluno?.user_id) {
    await adminClient.auth.admin.deleteUser(aluno.user_id).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
