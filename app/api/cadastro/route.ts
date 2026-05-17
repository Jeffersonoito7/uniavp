import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome } from '@/lib/whatsapp'
import { getSiteConfig } from '@/lib/site-config'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  gestor_nome: z.string().optional().default(''),
  gestor_whatsapp: z.string().optional().default(''),
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

  const { nome, whatsapp, email, senha, indicador_whatsapp } = parsed.data
  let { gestor_nome, gestor_whatsapp } = parsed.data

  const whatsappLimpo = whatsapp.replace(/\D/g, '')
  const emailLimpo = email.toLowerCase().trim()

  // Se informou WhatsApp do indicador mas não o nome, busca o nome automaticamente
  if (gestor_whatsapp && !gestor_nome) {
    const wppIndicador = gestor_whatsapp.replace(/\D/g, '')
    const { data: gestorEncontrado } = await (adminClient.from('gestores') as any)
      .select('nome').eq('whatsapp', wppIndicador).eq('ativo', true).maybeSingle()
    if (gestorEncontrado) gestor_nome = gestorEncontrado.nome
  }

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
        // Limite de 20 indicações para consultor free
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

  const host = req.headers.get('host') || ''
  const proto = 'https'
  // Nunca usar domínio admin (adm.) como URL da plataforma do aluno
  const hostLimpo = host.startsWith('adm.') ? host.replace(/^adm\./, 'uniavp.') : host
  const appUrl = siteConfig.dominioCustomizado
    ? `${proto}://${siteConfig.dominioCustomizado}`
    : `${proto}://${hostLimpo}`

  // Busca o gestor (PRO) para pegar o link externo configurado
  const gestorWppLimpo = gestor_whatsapp.replace(/\D/g, '')
  const { data: gestorData } = await (adminClient.from('gestores') as any)
    .select('id, link_externo').eq('whatsapp', gestorWppLimpo).eq('ativo', true).maybeSingle()
  const linkExterno: string | null = gestorData?.link_externo ?? null

  // Notifica o gestor usando a instância WhatsApp dele (se tiver) ou a global
  const instanciaGestor = await getInstanciaGestorPorNome(gestor_nome, adminClient)
  await enviarWhatsApp(
    gestor_whatsapp,
    `🆓 *Novo FREE cadastrado!*\n\nOlá ${gestor_nome}! *${nome}* acabou de se cadastrar em *${nomePlataforma}* pelo seu link. 🚀\n\n📱 WhatsApp: ${whatsappLimpo}\n\nVocê receberá atualizações do progresso dele por aqui.`,
    instanciaGestor
  )

  // Boas-vindas para o candidato + link da plataforma parceira (se configurado)
  let msgCandidato = `🎓 *Bem-vindo ao ${nomePlataforma}, ${nome}!* 🚀\n\n` +
    `Seu cadastro foi confirmado! Acesse a plataforma:\n👉 ${appUrl}/entrar\n\n`

  if (linkExterno) {
    msgCandidato += `📲 *Próximo passo obrigatório:*\nCadastre-se também na plataforma parceira pelo link abaixo para poder iniciar o treinamento:\n👉 ${linkExterno}\n\n` +
      `Após se cadastrar lá, volte aqui e assista as aulas. A primeira aula já te ensina a usar a plataforma! 🎯\n\n`
  }

  msgCandidato += `_Bons estudos!_`

  await enviarWhatsApp(whatsappLimpo, msgCandidato)

  return NextResponse.json({ aluno })
}
