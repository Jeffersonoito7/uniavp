import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

async function verificarAdmin(adminClient: ReturnType<typeof createServiceRoleClient>, userId: string) {
  const { data } = await (adminClient.from('admins') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle()
  return !!data
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

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

  const { data: gestor, error: gestorError } = await (adminClient.from('gestores') as any)
    .insert({ user_id: authUser.user.id, nome, email, whatsapp: whatsapp.replace(/\D/g, ''), ativo: true })
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
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await request.json()
  const { id, ativo, nome, email, whatsapp } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (ativo !== undefined) updates.ativo = ativo
  if (nome !== undefined) updates.nome = nome
  if (email !== undefined) updates.email = email
  if (whatsapp !== undefined) updates.whatsapp = whatsapp.replace?.(/\D/g, '') ?? whatsapp

  const { data: gestor, error } = await (adminClient.from('gestores') as any)
    .update(updates).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Atualiza email no auth se mudou
  if (email && gestor.user_id) {
    await adminClient.auth.admin.updateUserById(gestor.user_id, { email }).catch(() => {})
  }

  return NextResponse.json({ gestor })
}


export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('user_id').eq('id', id).maybeSingle()

  const { error } = await (adminClient.from('gestores') as any).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (gestor?.user_id) {
    await adminClient.auth.admin.deleteUser(gestor.user_id).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
