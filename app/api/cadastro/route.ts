import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome, getInstanciaTenant } from '@/lib/whatsapp'
import { getSiteConfig } from '@/lib/site-config'
import { getTenantId } from '@/lib/tenant'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

async function buscarInstanciaAdmin(adminClient: ReturnType<typeof createServiceRoleClient>, tenantId: string | null) {
  let q = adminClient.from('admins')
    .select('whatsapp_instancia').eq('ativo', true).not('whatsapp_instancia', 'is', null).limit(1)
  if (tenantId) q = q.eq('tenant_id', tenantId)
  const { data } = await q.maybeSingle()
  return data?.whatsapp_instancia ?? null
}

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().nullable().optional(),
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
    const { data: adminRecord } = await adminClient.from('admins')
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

  const { nome, whatsapp, email, cpf, senha, indicador_whatsapp } = parsed.data
  let { gestor_nome, gestor_whatsapp } = parsed.data

  const whatsappLimpo = whatsapp.replace(/\D/g, '')
  const emailLimpo = email.toLowerCase().trim()

  // Se informou WhatsApp do indicador mas não o nome, busca o nome automaticamente
  if (gestor_whatsapp && !gestor_nome) {
    const wppIndicador = gestor_whatsapp.replace(/\D/g, '')
    const { data: gestorEncontrado } = await adminClient.from('gestores')
      .select('nome').eq('whatsapp', wppIndicador).eq('ativo', true).maybeSingle()
    if (gestorEncontrado) gestor_nome = gestorEncontrado.nome
  }

  // Resolve tenant antes de criar o aluno
  const host = req.headers.get('host') || ''
  const tenantId = await getTenantId(host)

  // Tenta criar o usuário no auth
  let { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: emailLimpo,
    password: senha,
    email_confirm: true,
  })

  // Se o e-mail já existe no auth, verifica se é órfão (aluno foi deletado)
  if (authErr && (authErr.message.includes('already registered') || authErr.message.includes('already been registered') || authErr.message.includes('email address'))) {
    // Busca o auth user pelo email via paginação completa
    let authExistente = null
    let page = 1
    while (!authExistente) {
      const { data: lista } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
      if (!lista?.users?.length) break
      authExistente = lista.users.find(u => u.email === emailLimpo) ?? null
      if (authExistente || lista.users.length < 1000) break
      page++
    }

    if (!authExistente) {
      return NextResponse.json({ erro: 'Não foi possível criar sua conta. Tente novamente.' }, { status: 400 })
    }

    // Verifica se ainda existe aluno vinculado
    const { data: alunoExistente } = await adminClient.from('alunos')
      .select('id').eq('user_id', authExistente.id).maybeSingle()

    if (alunoExistente) {
      return NextResponse.json({ erro: 'Este e-mail já possui uma conta. Faça login ou use outro e-mail.' }, { status: 400 })
    }

    // Órfão confirmado — deleta e recria
    await adminClient.auth.admin.deleteUser(authExistente.id)
    const retentativa = await adminClient.auth.admin.createUser({
      email: emailLimpo,
      password: senha,
      email_confirm: true,
    })
    authUser = retentativa.data
    authErr = retentativa.error
  }

  if (authErr || !authUser?.user) {
    return NextResponse.json({ erro: 'Não foi possível criar sua conta. Tente novamente.' }, { status: 400 })
  }

  // Resolve indicador: consultor free que indicou via link /captacao?ref=whatsapp
  let indicadorId: string | null = null
  if (indicador_whatsapp) {
    const refWpp = indicador_whatsapp.replace(/\D/g, '')
    const { data: alunoRef } = await adminClient.from('alunos')
      .select('id, nome, email')
      .eq('whatsapp', refWpp)
      .maybeSingle()
    if (alunoRef) {
      // Busca ou cria entrada na tabela indicadores para este consultor
      const { data: indExistente } = await adminClient.from('indicadores')
        .select('id')
        .eq('whatsapp', refWpp)
        .eq('tipo', 'consultor')
        .maybeSingle()
      const indId = indExistente?.id ?? null
      let resolvedId = indId
      if (!resolvedId) {
        const { data: indNovo } = await adminClient.from('indicadores')
          .insert({ nome: alunoRef.nome, tipo: 'consultor', whatsapp: refWpp, email: alunoRef.email ?? null })
          .select('id')
          .single()
        resolvedId = indNovo?.id ?? null
      }
      if (resolvedId) {
        // Limite de 20 indicações para consultor free
        const { count: jaIndicou } = await adminClient.from('alunos')
          .select('id', { count: 'exact', head: true })
          .eq('indicador_id', resolvedId)
        indicadorId = (jaIndicou ?? 0) < 20 ? resolvedId : null
      }
    }
  }

  const { data: aluno, error: alunoErr } = await adminClient.from('alunos')
    .insert({
      user_id: authUser.user.id,
      nome: nome.trim(),
      whatsapp: whatsappLimpo,
      email: emailLimpo,
      cpf: cpf?.replace(/\D/g, '') || null,
      indicador_id: indicadorId,
      gestor_nome: gestor_nome.trim(),
      gestor_whatsapp: gestor_whatsapp.replace(/\D/g, ''),
      tenant_id: tenantId,
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

  const siteConfig = await getSiteConfig(host)
  const nomePlataforma = siteConfig.nome || 'Universidade'

  const proto = 'https'
  // Nunca usar domínio admin (adm.) como URL da plataforma do aluno
  const hostLimpo = host.startsWith('adm.') ? host.replace(/^adm\./, 'free.') : host
  const appUrl = siteConfig.dominioCustomizado
    ? `${proto}://${siteConfig.dominioCustomizado}`
    : `${proto}://${hostLimpo}`

  // Busca o gestor (PRO) para pegar o link externo configurado
  const gestorWppLimpo = gestor_whatsapp.replace(/\D/g, '')
  const { data: gestorData } = await adminClient.from('gestores')
    .select('id, link_externo').eq('whatsapp', gestorWppLimpo).eq('ativo', true).maybeSingle()
  const linkExterno: string | null = gestorData?.link_externo ?? null

  // Link wa.me clicável para o novo aluno
  const ddi = whatsappLimpo.startsWith('55') ? whatsappLimpo : `55${whatsappLimpo}`
  const wppLink = `https://wa.me/${ddi}`

  // Instância WhatsApp do tenant (usada para mensagens sem remetente específico)
  const instanciaTenant = await getInstanciaTenant(tenantId, adminClient)

  // Notifica o gestor (PRO) com link clicável
  const instanciaGestor = await getInstanciaGestorPorNome(gestor_nome, adminClient, tenantId)
  if (gestor_whatsapp.replace(/\D/g, '')) {
    await enviarWhatsApp(
      gestor_whatsapp,
      `🆓 *Novo FREE cadastrado!*\n\nOlá *${gestor_nome}*! *${nome}* acabou de se cadastrar em *${nomePlataforma}* pelo seu link. 🚀\n\n💬 Clique para chamar no WhatsApp:\n👉 ${wppLink}\n\nVocê receberá atualizações do progresso dele por aqui.`,
      instanciaGestor
    )
  }

  // Notifica o indicador FREE (quem compartilhou o link /c/) se for diferente do gestor
  if (indicador_whatsapp) {
    const indicadorWpp = indicador_whatsapp.replace(/\D/g, '')
    const gestorWpp = gestor_whatsapp.replace(/\D/g, '')
    if (indicadorWpp && indicadorWpp !== gestorWpp) {
      const instanciaIndicador = await buscarInstanciaAdmin(adminClient, tenantId)
      if (instanciaIndicador) {
        await enviarWhatsApp(
          indicadorWpp,
          `🎉 *Sua indicação deu certo!*\n\n*${nome}* se cadastrou em *${nomePlataforma}* pelo seu link! 🚀\n\n💬 Clique para chamar no WhatsApp:\n👉 ${wppLink}\n\n_Aproveite para dar as boas-vindas e acompanhar o progresso dele!_`,
          instanciaIndicador
        )
      }
    }
  }

  // Boas-vindas para o candidato + link da plataforma parceira (se configurado)
  let msgCandidato = `🎓 *Bem-vindo ao ${nomePlataforma}, ${nome}!* 🚀\n\n` +
    `Seu cadastro foi confirmado! Acesse a plataforma:\n👉 ${appUrl}/entrar\n\n`

  if (linkExterno) {
    msgCandidato += `📲 *Próximo passo obrigatório:*\nCadastre-se também na plataforma parceira pelo link abaixo para poder iniciar o treinamento:\n👉 ${linkExterno}\n\n` +
      `Após se cadastrar lá, volte aqui e assista as aulas. A primeira aula já te ensina a usar a plataforma! 🎯\n\n`
  }

  msgCandidato += `_Bons estudos!_`

  await enviarWhatsApp(whatsappLimpo, msgCandidato, instanciaTenant)

  return NextResponse.json({ aluno })
}
