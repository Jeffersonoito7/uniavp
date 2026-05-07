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

  const { id, ativo } = await request.json()
  if (!id || ativo === undefined) {
    return NextResponse.json({ error: 'Campos obrigatórios: id, ativo' }, { status: 400 })
  }

  const { data: gestor, error } = await (adminClient.from('gestores') as any)
    .update({ ativo })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ gestor })
}
