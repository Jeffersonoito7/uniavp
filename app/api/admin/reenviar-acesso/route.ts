import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { email, aluno_id } = await req.json()
  if (!email || !aluno_id) return NextResponse.json({ error: 'email e aluno_id obrigatórios' }, { status: 400 })

  const host = req.headers.get('host') || ''
  const origin = `https://${host}`

  // Tenta encontrar usuário Auth pelo email
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  let authUser = users.find(u => u.email === email)

  // Se não existe, cria o usuário Auth
  if (!authUser) {
    const { data: criado, error: errCriacao } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      password: Math.random().toString(36).slice(-10) + 'A1!', // senha temporária
    })
    if (errCriacao || !criado.user) {
      return NextResponse.json({ error: errCriacao?.message ?? 'Erro ao criar conta' }, { status: 400 })
    }
    authUser = criado.user
  }

  // Vincula o user_id ao aluno
  await adminClient.from('alunos')
    .update({ user_id: authUser.id })
    .eq('id', aluno_id)

  // Envia link de redefinição de senha
  const { data: linkData } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${origin}/redefinir-senha` },
  })

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  })

  return NextResponse.json({ ok: true, link: linkData?.properties?.action_link ?? null })
}
