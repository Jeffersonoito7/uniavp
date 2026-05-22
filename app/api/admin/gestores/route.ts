import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { nome, email, whatsapp, senha } = await request.json()
  if (!nome || !email || !whatsapp || !senha) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, email, whatsapp, senha' }, { status: 400 })
  }

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? 'Erro ao criar usuário' }, { status: 400 })
  }

  const trialExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: gestor, error: gestorError } = await (adminClient.from('gestores') as any)
    .insert({
      user_id: authUser.user.id, nome, email,
      whatsapp: whatsapp.replace(/\D/g, ''), ativo: true,
      status_assinatura: 'trial',
      trial_expira_em: trialExpira,
      ...(ctx.tenantId ? { tenant_id: ctx.tenantId } : {}),
    })
    .select()
    .single()

  if (gestorError) {
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: gestorError.message }, { status: 400 })
  }

  return NextResponse.json({ gestor }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await request.json()
  const { id, ativo, nome, email, whatsapp, nova_senha } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (ativo !== undefined) updates.ativo = ativo
  if (nome !== undefined) updates.nome = nome
  if (email !== undefined) updates.email = email
  if (whatsapp !== undefined) updates.whatsapp = whatsapp.replace?.(/\D/g, '') ?? whatsapp

  let updateQuery = (adminClient.from('gestores') as any).update(updates).eq('id', id)
  if (ctx.tenantId) updateQuery = updateQuery.eq('tenant_id', ctx.tenantId)
  const { data: gestor, error } = await updateQuery.select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (gestor.user_id) {
    const authUpdates: Record<string, unknown> = {}
    if (email) authUpdates.email = email
    if (nova_senha && nova_senha.length >= 6) authUpdates.password = nova_senha
    if (Object.keys(authUpdates).length > 0) {
      await adminClient.auth.admin.updateUserById(gestor.user_id, authUpdates).catch(() => {})
    }
  }

  return NextResponse.json({ gestor })
}


export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id, senha } = await request.json()
  if (!id || !senha) return NextResponse.json({ error: 'id e senha obrigatórios' }, { status: 400 })
  if (senha.length < 6) return NextResponse.json({ error: 'Senha mínimo 6 caracteres' }, { status: 400 })

  let patchSelectQuery = (adminClient.from('gestores') as any).select('user_id').eq('id', id)
  if (ctx.tenantId) patchSelectQuery = patchSelectQuery.eq('tenant_id', ctx.tenantId)
  const { data: gestor } = await patchSelectQuery.maybeSingle()
  if (!gestor?.user_id) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

  const { error } = await adminClient.auth.admin.updateUserById(gestor.user_id, { password: senha })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  let deleteSelectQuery = (adminClient.from('gestores') as any).select('user_id').eq('id', id)
  if (ctx.tenantId) deleteSelectQuery = deleteSelectQuery.eq('tenant_id', ctx.tenantId)
  const { data: gestor } = await deleteSelectQuery.maybeSingle()

  let deleteQuery = (adminClient.from('gestores') as any).delete().eq('id', id)
  if (ctx.tenantId) deleteQuery = deleteQuery.eq('tenant_id', ctx.tenantId)
  const { error } = await deleteQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (gestor?.user_id) {
    await adminClient.auth.admin.deleteUser(gestor.user_id).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
