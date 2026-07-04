import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome, getInstanciaTenant } from '@/lib/whatsapp'
import { getSiteConfig } from '@/lib/site-config'
import { getTenantId } from '@/lib/tenant'
import { rateLimit, LIMITS } from '@/lib/rate-limit'
import { audit, getIp } from '@/lib/audit'
import { captureException } from '@/lib/monitor'
import { getMensagem } from '@/lib/mensagem'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

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
  especialista: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const ip = getIp(req) ?? 'unknown'

  // Rate limit: 5 cadastros por minuto por IP (exceto chamadas internas do admin)
  if (req.headers.get('x-admin-request') !== 'true') {
    const rl = await rateLimit(`cadastro:${ip}`, LIMITS.cadastro)
    if (!rl.allowed) {
      return NextResponse.json(
        { erro: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      )
    }
  }

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

  const { nome, whatsapp, email, cpf, senha, indicador_whatsapp, especialista } = parsed.data
  let { gestor_nome, gestor_whatsapp } = parsed.data

  const whatsappLimpo = whatsapp.replace(/\D/g, '')
  const emailLimpo = email.toLowerCase().trim()

  // Valida que gestor_whatsapp pertence a um PRO ativo antes de gravar.
  // Se o link /g/[wpp] foi compartilhado por um aluno FREE, descarta o gestor_whatsapp
  // para nao vincular incorretamente o novo aluno a esse FREE.
  if (gestor_whatsapp) {
    const wppLimpoGestor = gestor_whatsapp.replace(/\D/g, '')
    const wppAlt = wppLimpoGestor.startsWith('55') ? wppLimpoGestor.slice(2) : `55${wppLimpoGestor}`
    const { data: gestorValido } = await adminClient.from('gestores')
      .select('nome').eq('ativo', true)
      .in('whatsapp', [wppLimpoGestor, wppAlt])
      .maybeSingle()
    if (gestorValido) {
      gestor_whatsapp = wppLimpoGestor
      if (!gestor_nome) gestor_nome = gestorValido.nome
    } else {
      // Nao e PRO ativo: descarta vinculo de gestor
      gestor_whatsapp = ''
      gestor_nome = ''
    }
  }

  // Resolve tenant antes de criar o aluno
  const host = req.headers.get('host') || ''
  const tenantId = await getTenantId(host)

  // Idempotência: verifica existência antes de criar auth user (evita órfãos por duplo envio)
  const [{ data: alunoWpp }, { data: alunoEmail }] = await Promise.all([
    adminClient.from('alunos').select('id').eq('whatsapp', whatsappLimpo).maybeSingle(),
    adminClient.from('alunos').select('id').eq('email', emailLimpo).maybeSingle(),
  ])
  if (alunoWpp) return NextResponse.json({ erro: 'Este WhatsApp já está cadastrado. Faça login ou use outro número.' }, { status: 400 })
  if (alunoEmail) return NextResponse.json({ erro: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' }, { status: 400 })

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
    const MAX_PAGES = 20
    while (!authExistente && page <= MAX_PAGES) {
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
    await audit({ acao: 'auth.orfao_deletado', entidade: 'auth.users', entidade_id: authExistente.id, usuario_tipo: 'sistema', dados_anteriores: { email: emailLimpo }, ip })
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
        // Limite de 20 indicações para consultor FREE
        const { count: jaIndicou } = await adminClient.from('alunos')
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
      cpf: cpf?.replace(/\D/g, '') || null,
      indicador_id: indicadorId,
      gestor_nome: gestor_nome.trim(),
      gestor_whatsapp: gestor_whatsapp.replace(/\D/g, ''),
      tenant_id: tenantId,
      especialista: especialista ?? false,
    })
    .select('*')
    .single()

  if (alunoErr) {
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    captureException(alunoErr, { endpoint: 'POST /api/cadastro', tenantId: tenantId ?? undefined, extra: { email: emailLimpo } })
    const msg = alunoErr.message ?? ''
    let erro = 'Erro ao finalizar cadastro. Tente novamente.'
    if (msg.includes('alunos_whatsapp_key') || msg.includes('whatsapp'))
      erro = 'Este WhatsApp já está cadastrado. Faça login ou use outro número.'
    else if (msg.includes('alunos_email_key') || msg.includes('email'))
      erro = 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.'
    return NextResponse.json({ erro }, { status: 400 })
  }

  // Re-verifica o limite de indicações após o insert para cobrir requisições concorrentes.
  // Se duas requisições passaram pelo check simultâneamente, a que ultrapassou o limite
  // perde o vínculo com o indicador mas o cadastro do aluno é mantido normalmente.
  if (indicadorId) {
    const { count: totalAposInsert } = await adminClient.from('alunos')
      .select('id', { count: 'exact', head: true })
      .eq('indicador_id', indicadorId)
    if ((totalAposInsert ?? 0) > 20) {
      await adminClient.from('alunos').update({ indicador_id: null }).eq('id', aluno.id)
      aluno.indicador_id = null
    }
  }

  const gestorWppLimpo = gestor_whatsapp.replace(/\D/g, '')

  // Busca config do site, dados do gestor e instâncias em paralelo
  const [siteConfig, gestorDataRes, instanciaTenant, instanciaGestor] = await Promise.all([
    getSiteConfig(host),
    gestorWppLimpo
      ? adminClient.from('gestores').select('id, link_externo').eq('whatsapp', gestorWppLimpo).eq('ativo', true).maybeSingle()
      : Promise.resolve({ data: null }),
    getInstanciaTenant(tenantId, adminClient),
    getInstanciaGestorPorNome(gestor_nome, adminClient, tenantId),
  ])

  const gestorData = gestorDataRes.data
  const linkExterno: string | null = gestorData?.link_externo ?? null
  const nomePlataforma = siteConfig.nome || 'Universidade'
  const proto = 'https'
  const hostLimpo = host.startsWith('adm.') ? host.replace(/^adm\./, 'free.') : host
  const appUrl = siteConfig.dominioCustomizado
    ? `${proto}://${siteConfig.dominioCustomizado}`
    : `${proto}://${hostLimpo}`
  const ddi = whatsappLimpo.startsWith('55') ? whatsappLimpo : `55${whatsappLimpo}`
  const wppLink = `https://wa.me/${ddi}`
  const vars = { gestorNome: gestor_nome, alunoNome: nome.trim(), nomePlataforma, wppLink, appUrl }

  // Monta todas as tarefas de notificação para rodar em paralelo
  const tarefasWpp: Promise<unknown>[] = []

  if (gestorWppLimpo) {
    tarefasWpp.push(
      getMensagem('cadastro_gestor_novo_free', vars, adminClient, tenantId)
        .then(msg => enviarWhatsApp(gestor_whatsapp, msg, instanciaGestor))
    )
  }

  if (indicador_whatsapp) {
    const indicadorWpp = indicador_whatsapp.replace(/\D/g, '')
    if (indicadorWpp && indicadorWpp !== gestorWppLimpo) {
      tarefasWpp.push(
        buscarInstanciaAdmin(adminClient, tenantId).then(async instanciaIndicador => {
          if (!instanciaIndicador) return
          const msg = await getMensagem('cadastro_indicador_novo_free', vars, adminClient, tenantId)
          await enviarWhatsApp(indicadorWpp, msg, instanciaIndicador)
        })
      )
    }
  }

  if (!isAdminRoute) {
    const chaveBoasVindas = linkExterno ? 'cadastro_boas_vindas_link_externo' : 'cadastro_boas_vindas'
    tarefasWpp.push(
      getMensagem(chaveBoasVindas, { ...vars, linkExterno: linkExterno ?? '' }, adminClient, tenantId)
        .then(msg => enviarWhatsApp(whatsappLimpo, msg, instanciaTenant))
    )
  }

  // Notificações WhatsApp + audit em paralelo — falha individual não bloqueia resposta
  await Promise.allSettled([
    ...tarefasWpp,
    audit({
      acao: 'aluno.criado',
      entidade: 'alunos',
      entidade_id: aluno.id,
      tenant_id: tenantId,
      usuario_tipo: 'sistema',
      dados_novos: { nome: aluno.nome, whatsapp: aluno.whatsapp, email: aluno.email },
      ip,
    }),
  ])

  return NextResponse.json({ aluno })
}
