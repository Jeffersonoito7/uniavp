import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome } from '@/lib/whatsapp'
import { getSiteConfig } from '@/lib/site-config'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  nome: z.string().min(2),
  whatsapp: z.string().min(10),
  email: z.string().email(),
  senha: z.string().min(6),
  gestor_nome: z.string().min(2),
  gestor_whatsapp: z.string().regex(/^\d{10,13}$/),
  indicador_whatsapp: z.string().optional(),
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

  const { nome, whatsapp, email, senha, gestor_nome, gestor_whatsapp, indicador_whatsapp } = parsed.data

  const whatsappLimpo = whatsapp.replace(/\D/g, '')

  // Conta PRO (gestor) não tem limite de consultores
  const emailLimpo = email.toLowerCase().trim()

  const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: emailLimpo,
    password: senha,
    email_confirm: true,
  })

  if (authErr || !authUser?.user) {
    const msg = authErr?.message ?? ''
    const erro = msg.includes('already registered') || msg.includes('already been registered') || msg.includes('email address')
      ? 'Este e-mail já possui uma conta. Faça login ou use outro e-mail.'
      : 'Não foi possível criar sua conta. Tente novamente.'
    return NextResponse.json({ erro }, { status: 400 })
  }

  // Resolve indicador: consultor free que indicou via link /captacao?ref=whatsapp
  let indicadorId: string | null = null
  if (indicador_whatsapp) {
    const refWpp = indicador_whatsapp.replace(/\D/g, '')
    const { data: alunoRef } = await (adminClient.from('alunos') as any)
      .select('id, nome, email')
      .eq('whatsapp', refWpp)
      .maybeSingle()
    if (alunoRef) {
      // Busca ou cria entrada na tabela indicadores para este consultor
      const { data: indExistente } = await (adminClient.from('indicadores') as any)
        .select('id')
        .eq('whatsapp', refWpp)
        .eq('tipo', 'consultor')
        .maybeSingle()
      const indId = indExistente?.id ?? null
      let resolvedId = indId
      if (!resolvedId) {
        const { data: indNovo } = await (adminClient.from('indicadores') as any)
          .insert({ nome: alunoRef.nome, tipo: 'consultor', whatsapp: refWpp, email: alunoRef.email ?? null })
          .select('id')
          .single()
        resolvedId = indNovo?.id ?? null
      }
      if (resolvedId) {
        // Limite de 50 indicações para consultor free
        const { count: jaIndicou } = await (adminClient.from('alunos') as any)
          .select('id', { count: 'exact', head: true })
          .eq('indicador_id', resolvedId)
        indicadorId = (jaIndicou ?? 0) < 20 ? resolvedId : null
      }
    }
  }

  const { data: aluno, error: alunoErr } = await (adminClient.from('alunos') as any)
    .insert({
      user_id: authUser.user.id,
      nome: nome.trim(),
      whatsapp: whatsappLimpo,
      email: emailLimpo,
      indicador_id: indicadorId,
      gestor_nome: gestor_nome.trim(),
      gestor_whatsapp: gestor_whatsapp.replace(/\D/g, ''),
    })
    .select('*')
    .single()

  if (alunoErr) {
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    const msg = alunoErr.message ?? ''
    let erro = 'Erro ao finalizar cadastro. Tente novamente.'
    if (msg.includes('alunos_whatsapp_key') || msg.includes('whatsapp'))
      erro = 'Este WhatsApp já está cadastrado. Faça login ou use outro número.'
    else if (msg.includes('alunos_email_key') || msg.includes('email'))
      erro = 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.'
    return NextResponse.json({ erro }, { status: 400 })
  }

  const siteConfig = await getSiteConfig()
  const nomePlataforma = siteConfig.nome || 'Universidade'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uniavp.autovaleprevencoes.org.br'

  // Notifica o gestor usando a instância WhatsApp dele (se tiver) ou a global
  const instanciaGestor = await getInstanciaGestorPorNome(gestor_nome, adminClient)
  await enviarWhatsApp(
    gestor_whatsapp,
    `🆓 *Novo UNIAVP FREE!*\n\nOlá ${gestor_nome}! *${nome}* acabou de se cadastrar em *${nomePlataforma}* e iniciou sua jornada. 🚀\n\nVocê receberá atualizações do progresso dele por aqui.`,
    instanciaGestor
  )

  // Notifica o próprio consultor com boas-vindas e link de acesso
  await enviarWhatsApp(
    whatsappLimpo,
    `🎓 *Bem-vindo ao UNIAVP FREE, ${nome}!* 🚀\n\n` +
    `Seu cadastro foi confirmado! Acesse agora:\n👉 ${appUrl}/free/${whatsappLimpo}\n\n` +
    `📚 Você tem acesso às primeiras *20 aulas* gratuitamente.\n` +
    `✨ Quer acesso completo? Faça upgrade para o *UNIAVP PRO* dentro da plataforma.\n\n` +
    `_Bons estudos!_`
  )

  return NextResponse.json({ aluno })
}
