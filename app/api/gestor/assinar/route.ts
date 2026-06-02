import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix } from '@/lib/efi'
import { randomUUID } from 'crypto'
import { verificarPROGratuito, contarPROsAtivosIndicados, getLimitePROGratuito } from '@/lib/pros-indicados'
import { captureException } from '@/lib/monitor'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await adminClient.from('gestores')
    .select('id, nome, whatsapp, status_assinatura, plano_vencimento, tenant_id')
    .eq('user_id', user.id).eq('ativo', true).maybeSingle()

  if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

  // Verifica se já tem pagamento pendente
  const { data: pagPendente } = await adminClient.from('gestor_pagamentos')
    .select('id, pix_copia_cola, qrcode_base64, vencimento')
    .eq('gestor_id', gestor.id)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pagPendente) {
    return NextResponse.json({ ok: true, pagamento: pagPendente, jaExiste: true })
  }

  // ── Modo de cobrança do tenant ────────────────────────────────────
  const modoCfg = gestor.tenant_id
    ? await adminClient.from('configuracoes').select('valor').eq('chave', 'pro_cobranca_modo').eq('tenant_id', gestor.tenant_id).maybeSingle()
    : { data: null }
  const modo = modoCfg.data?.valor ? String(modoCfg.data.valor).replace(/"/g, '') : 'individual'

  if (modo === 'incluso') {
    const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await adminClient.from('gestores')
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
      .eq('id', gestor.id)
    return NextResponse.json({ ok: true, gratuito: true, incluso: true, vencimento })
  }

  // ── Verifica se o PRO atingiu o limite de indicações → gratuito ──
  const [ehGratuito, totalIndicados, limiteGratuito] = await Promise.all([
    verificarPROGratuito(gestor.id, adminClient, gestor.tenant_id),
    contarPROsAtivosIndicados(gestor.id, adminClient),
    getLimitePROGratuito(adminClient, gestor.tenant_id),
  ])

  if (ehGratuito) {
    const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await adminClient.from('gestores')
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento })
      .eq('id', gestor.id)
    return NextResponse.json({ ok: true, gratuito: true, vencimento })
  }

  // No modo ganho, PRO só acessa via indicações — não gera PIX
  if (modo === 'ganho') {
    const faltam = limiteGratuito - totalIndicados
    return NextResponse.json({
      error: `Indique mais ${faltam} PRO${faltam > 1 ? 's' : ''} para liberar seu acesso gratuitamente.`,
      ganho: true,
      totalIndicados,
      limiteGratuito,
      faltam,
    }, { status: 403 })
  }

  // Lê valor configurado para o tenant (padrão 97)
  const { data: valorCfg } = gestor.tenant_id
    ? await adminClient.from('configuracoes').select('valor').eq('chave', 'plano_pro_valor').eq('tenant_id', gestor.tenant_id).maybeSingle()
    : { data: null }
  const valorStr = valorCfg?.valor ? String(valorCfg.valor).replace(/"/g, '') : ''
  const valorParsed = parseFloat(valorStr)
  const valorPlano = isNaN(valorParsed) ? 97 : Math.max(1, valorParsed)

  // Gera vencimento: 3 dias a partir de hoje
  const venc = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const vencimento = venc.toISOString().split('T')[0]
  const txid = randomUUID().replace(/-/g, '').substring(0, 35)

  try {
    const { pixCopiaECola, qrcodeBase64 } = await criarCobrancaPix({
      txid,
      valor: valorPlano,
      vencimento,
      nomeDevedor: gestor.nome,
      descricao: 'Mensalidade Plataforma PRO',
    })

    const { data: pagamento } = await adminClient.from('gestor_pagamentos')
      .insert({
        gestor_id: gestor.id,
        txid,
        valor: valorPlano,
        status: 'pendente',
        pix_copia_cola: pixCopiaECola,
        qrcode_base64: qrcodeBase64,
        vencimento,
        ...(gestor.tenant_id ? { tenant_id: gestor.tenant_id } : {}),
      })
      .select().single()

    await adminClient.from('gestores')
      .update({ pix_txid: txid })
      .eq('id', gestor.id)

    return NextResponse.json({ ok: true, pagamento })
  } catch (e: any) {
    const raw: string = e.message ?? ''
    // Loga apenas o tipo do erro — evita expor tokens ou respostas brutas da API
    captureException(e, { endpoint: 'gestor/assinar', extra: { tipo: e.constructor?.name ?? 'Error' } })
    const msgUsuario = raw.includes('invalid_client') || raw.includes('credentials')
      ? 'Erro na integração de pagamento. Entre em contato com o suporte.'
      : raw.includes('Auth') || raw.includes('token')
      ? 'Serviço de pagamento temporariamente indisponível. Tente novamente em alguns minutos.'
      : 'Erro ao gerar cobrança. Tente novamente.'
    return NextResponse.json({ error: msgUsuario }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await adminClient.from('gestores')
    .select('id, status_assinatura, trial_expira_em, plano_vencimento, tenant_id')
    .eq('user_id', user.id).maybeSingle()

  if (!gestor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const agora = new Date()
  const trialAtivo = gestor.status_assinatura === 'trial' && gestor.trial_expira_em && new Date(gestor.trial_expira_em) > agora
  const diasTrial = trialAtivo ? Math.ceil((new Date(gestor.trial_expira_em!).getTime() - agora.getTime()) / 86400000) : 0

  const { data: ultimoPag } = await adminClient.from('gestor_pagamentos')
    .select('*')
    .eq('gestor_id', gestor.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: valorCfgGet } = gestor.tenant_id
    ? await adminClient.from('configuracoes').select('valor').eq('chave', 'plano_pro_valor').eq('tenant_id', gestor.tenant_id).maybeSingle()
    : { data: null }
  const valorParsedGet = parseFloat(String(valorCfgGet?.valor ?? '').replace(/"/g, ''))
  const valorPlanoGet = isNaN(valorParsedGet) ? 97 : Math.max(1, valorParsedGet)

  const { data: modoCfgGet } = gestor.tenant_id
    ? await adminClient.from('configuracoes').select('valor').eq('chave', 'pro_cobranca_modo').eq('tenant_id', gestor.tenant_id).maybeSingle()
    : { data: null }
  const modoCobranca = modoCfgGet?.valor ? String(modoCfgGet.valor).replace(/"/g, '') : 'individual'

  const [prosIndicados, limiteGratuito] = await Promise.all([
    contarPROsAtivosIndicados(gestor.id, adminClient),
    getLimitePROGratuito(adminClient, gestor.tenant_id),
  ])
  const ehGratuito = prosIndicados >= limiteGratuito

  return NextResponse.json({
    status: gestor.status_assinatura,
    trialAtivo,
    diasTrial,
    planoVencimento: gestor.plano_vencimento,
    ultimoPagamento: ultimoPag,
    valorPlano: valorPlanoGet,
    prosIndicados,
    limiteGratuito,
    ehGratuito,
    modoCobranca,
  })
}
