import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: me } = await (adminClient.from('admins') as any)
    .select('id, role').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!me) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { nome, email, senha } = await req.json()
  if (!nome || !email || !senha || senha.length < 6)
    return NextResponse.json({ error: 'Nome, e-mail e senha (mín. 6 caracteres) são obrigatórios' }, { status: 400 })

  // Criar usuário no auth
  const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email, password: senha, email_confirm: true,
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  // Inserir na tabela admins
  const { data: novo, error: dbErr } = await (adminClient.from('admins') as any)
    .insert({ user_id: authUser.user!.id, nome, email, ativo: true, role: 'admin' })
    .select('id, nome, email, role, ativo, created_at').single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  return NextResponse.json({ admin: novo })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: me } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!me) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Não deixar excluir a si mesmo
  const { data: target } = await (adminClient.from('admins') as any)
    .select('user_id').eq('id', id).maybeSingle()
  if (target?.user_id === user.id)
    return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })

  await (adminClient.from('admins') as any).delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: me } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!me) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, ativo, nova_senha } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  if (nova_senha) {
    const { data: target } = await (adminClient.from('admins') as any)
      .select('user_id').eq('id', id).maybeSingle()
    if (target?.user_id) {
      await adminClient.auth.admin.updateUserById(target.user_id, { password: nova_senha })
    }
  }

  if (ativo !== undefined) {
    await (adminClient.from('admins') as any).update({ ativo }).eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
