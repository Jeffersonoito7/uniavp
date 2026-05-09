import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(2),
  whatsapp: z.string().min(10),
  email: z.string().email(),
  senha: z.string().min(6),
  gestor_nome: z.string().min(2),
  gestor_whatsapp: z.string().regex(/^\d{10,13}$/),
})

export async function POST(req: NextRequest) {
  const adminClient = createServiceRoleClient()

  const isAdminRoute = req.headers.get('x-admin-request') === 'true'

  if (isAdminRoute) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const { data: adminRecord } = await (adminClient.from('admins') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .maybeSingle()
    if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const { nome, whatsapp, email, senha, gestor_nome, gestor_whatsapp } = parsed.data

  const whatsappLimpo = whatsapp.replace(/\D/g, '')

  // Verifica limite de consultores por gestor (50) — concluídos não contam
  if (!isAdminRoute) {
    const { count } = await (adminClient.from('alunos') as any)
      .select('id', { count: 'exact', head: true })
      .eq('gestor_whatsapp', gestor_whatsapp.replace(/\D/g, ''))
      .neq('status', 'concluido')
    if ((count ?? 0) >= 50) {
      return NextResponse.json({ erro: 'Este gestor atingiu o limite de 50 consultores ativos.' }, { status: 400 })
    }
  }
  const emailLimpo = email.toLowerCase().trim()

  const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: emailLimpo,
    password: senha,
    email_confirm: true,
  })

  if (authErr || !authUser?.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Erro ao criar usuário' }, { status: 400 })
  }

  const { data: aluno, error: alunoErr } = await (adminClient.from('alunos') as any)
    .insert({
      user_id: authUser.user.id,
      nome: nome.trim(),
      whatsapp: whatsappLimpo,
      email: emailLimpo,
      indicador_id: null,
      gestor_nome: gestor_nome.trim(),
      gestor_whatsapp: gestor_whatsapp.replace(/\D/g, ''),
    })
    .select('*')
    .single()

  if (alunoErr) {
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: alunoErr.message ?? 'Erro ao cadastrar consultor' }, { status: 400 })
  }

  await enviarWhatsApp(
    gestor_whatsapp,
    `🎓 Olá ${gestor_nome}! ${nome} acabou de se cadastrar na Universidade AVP e iniciou sua jornada de formação. Você receberá atualizações do progresso dele aqui.`
  )

  return NextResponse.json({ aluno })
}
