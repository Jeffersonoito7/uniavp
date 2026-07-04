import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix, criarLinkCartaoAnual } from '@/lib/efi'
import { randomUUID } from 'crypto'
import { contarPROsAtivosIndicados, getLimitePROGratuito } from '@/lib/pros-indicados'
import { reconciliarEquipeGestor } from '@/lib/pix-processor'
import { captureException } from '@/lib/monitor'
import { vencimentoMeses } from '@/lib/date-utils'
import { getCfgNum, getCfg } from '@/lib/cfg'

export const dynamic = 'force-dynamic'

async function getAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, cpf')
    .eq('user_id', user.id)
    .maybeSingle()
  return aluno ? { aluno, user, adminClient } : null
}

async function getValorPlano(adminClient: any, tenantId: string | null): Promise<number> {
  return getCfgNum('plano_pro_valor', tenantId, adminClient, 97)
}

async function getValorAnual(adminClient: any, tenantId: string | null, valorMensal: number): Promise<number> {
  const anual = await getCfgNum('plano_pro_valor_anual', tenantId, adminClient, 0)
  return anual > 0 ? anual : Math.round(valorMensal * 12 * 0.824)
}

async function getModoCobranca(adminClient: any, tenantId: string | null): Promise<string> {
  if (!tenantId) return 'individual'
  const val = await getCfg('pro_cobranca_modo', tenantId, adminClient)
  return val || 'individual'
}

export async function GET() {
  const ctx = await getAluno()
  if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { aluno, user, adminClient } = ctx

  // Resolve tenant do aluno para contexto de cobrança
  const { data: alunoCtxGet } = await adminClient.from('alunos')
    .select('tenant_id').eq('user_id', user.id).maybeSingle()
  const tenantIdGet: string | null = alunoCtxGet?.tenant_id ?? null

  const valorPlano = await getValorPlano(adminClient, tenantIdGet)
  const valorAnual = await getValorAnual(adminClient, tenantIdGet, valorPlano)

  // Verifica se já tem gestor ativo (já é PRO)
  const { data: gestorAtivo } = await adminClient.from('gestores')
    .select('id, whatsapp, status_assinatura, plano_vencimento')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (gestorAtivo) {
    const [prosIndicados, limiteGratuito] = await Promise.all([
      contarPROsAtivosIndicados(gestorAtivo.id, gestorAtivo.whatsapp, adminClient),
      getLimitePROGratuito(adminClient, tenantIdGet),
    ])
    const modoCobranca = await getModoCobranca(adminClient, tenantIdGet)
    return NextResponse.json({ jaEhPro: true, valorPlano, valorAnual, prosIndicados, limiteGratuito, modoCobranca })
  }

  // Verifica pagamento pendente
  const { data: gestorPendente } = await adminClient.from('gestores')
    .select('id').eq('user_id', user.id).eq('ativo', false).maybeSingle()

  let ultimoPag = null
  if (gestorPendente) {
    const { data: pag } = await adminClient.from('gestor_pagamentos')
      .select('pix_copia_cola, qrcode_base64, vencimento, status, tipo, payment_url')
      .eq('gestor_id', gestorPendente.id)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    ultimoPag = pag
  }

  const { data: siteNomeCfg } = await adminClient.from('configuracoes')
    .select('valor').eq('chave', 'site_nome').maybeSingle()
  let nomeSite = 'Universidade'
  try { nomeSite = JSON.parse(String(siteNomeCfg?.valor ?? '')) || nomeSite } catch { /* */ }

  return NextResponse.json({ jaEhPro: false, valorPlano, valorAnual, ultimoPagamento: ultimoPag, whatsapp: aluno.whatsapp, nomeSite })
}

export async function POST(req: Request) {
  const ctx = await getAluno()
  if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { aluno, user, adminClient } = ctx

  let tipo: 'pix' | 'cartao' = 'pix'
  try { const b = await req.json(); tipo = b?.tipo === 'cartao' ? 'cartao' : 'pix' } catch { /* */ }

  // Busca tenant do aluno para contexto de cobrança
  const { data: alunoCtx } = await adminClient.from('alunos')
    .select('gestor_whatsapp, tenant_id').eq('user_id', user.id).maybeSingle()
  const tenantIdCtx: string | null = alunoCtx?.tenant_id ?? null

  const valorPlano = await getValorPlano(adminClient, tenantIdCtx)
  const valorAnual = await getValorAnual(adminClient, tenantIdCtx, valorPlano)

  // Verifica se já é PRO
  const { data: gestorAtivo } = await adminClient.from('gestores')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (gestorAtivo) return NextResponse.json({ error: 'Já possui conta PRO' }, { status: 400 })

  const tenantId = tenantIdCtx

  // Cria ou reutiliza gestor pendente
  let gestorId: string
  const { data: gestorPendente } = await adminClient.from('gestores')
    .select('id').eq('user_id', user.id).eq('ativo', false).maybeSingle()

  if (gestorPendente) {
    gestorId = gestorPendente.id
    // Cancela pagamento pendente anterior e aproveita para sincronizar CPF do aluno
    await Promise.all([
      adminClient.from('gestor_pagamentos')
        .update({ status: 'cancelado' })
        .eq('gestor_id', gestorId)
        .eq('status', 'pendente'),
      (aluno as any).cpf
        ? (adminClient.from('gestores') as any)
            .update({ cpf: (aluno as any).cpf })
            .eq('id', gestorId)
        : Promise.resolve(),
    ])
  } else {
    let indicadoPorGestorId: string | null = null
    if (alunoCtx?.gestor_whatsapp) {
      const { data: gestorOrigem } = await adminClient.from('gestores')
        .select('id').eq('whatsapp', alunoCtx.gestor_whatsapp).eq('ativo', true).maybeSingle()
      indicadoPorGestorId = gestorOrigem?.id ?? null
    }

    const { data: novoGestor } = await (adminClient.from('gestores') as any)
      .insert({
        user_id: user.id,
        nome: aluno.nome,
        email: aluno.email,
        whatsapp: aluno.whatsapp,
        cpf: (aluno as any).cpf ?? null,
        ativo: false,
        status_assinatura: 'pendente_upgrade',
        indicado_por_gestor_id: indicadoPorGestorId,
        ...(tenantId ? { tenant_id: tenantId } : {}),
      })
      .select('id')
      .single()
    if (!novoGestor) return NextResponse.json({ error: 'Erro ao criar conta PRO' }, { status: 500 })
    gestorId = novoGestor.id
  }

  // ── Modo incluso / ganho ──────────────────────────────────────────
  const modoCobranca = await getModoCobranca(adminClient, tenantId)
  if (modoCobranca === 'incluso') {
    const vencimento = vencimentoMeses(1)
    await adminClient.from('gestores')
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
      .eq('id', gestorId)
    // Reconcilia equipe: migra alunos captados via link FREE para gestor_whatsapp
    reconciliarEquipeGestor(aluno.whatsapp, aluno.nome, adminClient).catch(() => {})
    return NextResponse.json({ ok: true, gratuito: true, incluso: true, vencimento })
  }

  if (modoCobranca === 'ganho') {
    const [totalIndicados, limiteGratuito] = await Promise.all([
      contarPROsAtivosIndicados(gestorId, aluno.whatsapp, adminClient),
      getLimitePROGratuito(adminClient, tenantId),
    ])
    if (totalIndicados >= limiteGratuito) {
      const vencimento = vencimentoMeses(1)
      await adminClient.from('gestores')
        .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
        .eq('id', gestorId)
      // Reconcilia equipe: migra alunos captados via link FREE para gestor_whatsapp
      reconciliarEquipeGestor(aluno.whatsapp, aluno.nome, adminClient).catch(() => {})
      return NextResponse.json({ ok: true, gratuito: true, vencimento })
    }
    const faltam = limiteGratuito - totalIndicados
    return NextResponse.json({
      error: `Indique mais ${faltam} PRO${faltam > 1 ? 's' : ''} para liberar seu acesso gratuitamente.`,
      ganho: true,
      totalIndicados,
      limiteGratuito,
      faltam,
    }, { status: 403 })
  }

  try {
    // ── CARTÃO ANUAL ─────────────────────────────────────────────────
    if (tipo === 'cartao') {
      const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/efi/cartao?token=${process.env.EFI_WEBHOOK_TOKEN}`
      const { paymentUrl, chargeId } = await criarLinkCartaoAnual({
        valor: valorAnual,
        descricao: 'Assinatura Anual PRO',
        notificationUrl: notifyUrl,
      })

      const { data: pagamento } = await adminClient.from('gestor_pagamentos')
        .insert({
          gestor_id: gestorId,
          valor: valorAnual,
          status: 'pendente',
          tipo: 'cartao',
          payment_url: paymentUrl,
          charge_id: chargeId,
          plano_meses: 12,
          vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ...(tenantId ? { tenant_id: tenantId } : {}),
        })
        .select()
        .single()

      return NextResponse.json({ ok: true, tipo: 'cartao', pagamento, paymentUrl })
    }

    // ── PIX MENSAL ───────────────────────────────────────────────────
    const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const txid = randomUUID().replace(/-/g, '').substring(0, 35)

    const { pixCopiaECola, qrcodeBase64 } = await criarCobrancaPix({
      txid,
      valor: valorPlano,
      vencimento,
      nomeDevedor: aluno.nome,
      descricao: 'Assinatura Plataforma PRO',
    })

    const { data: pagamento } = await adminClient.from('gestor_pagamentos')
      .insert({
        gestor_id: gestorId,
        txid,
        valor: valorPlano,
        status: 'pendente',
        tipo: 'pix',
        pix_copia_cola: pixCopiaECola,
        qrcode_base64: qrcodeBase64,
        vencimento,
        plano_meses: 1,
        ...(tenantId ? { tenant_id: tenantId } : {}),
      })
      .select()
      .single()

    await adminClient.from('gestores')
      .update({ pix_txid: txid })
      .eq('id', gestorId)

    return NextResponse.json({ ok: true, tipo: 'pix', pagamento })
  } catch (e: any) {
    const raw: string = e.message ?? ''
    captureException(e, { endpoint: 'consultor/assinar-pro', extra: { tipo: e.constructor?.name ?? 'Error' } })
    const msgUsuario = raw.includes('invalid_client') || raw.includes('credentials') || raw.includes('Auth') || raw.includes('token') || raw.includes('Efi')
      ? 'Serviço de pagamento temporariamente indisponível. Tente novamente em alguns minutos ou entre em contato com o suporte.'
      : 'Erro ao gerar cobrança. Tente novamente.'
    return NextResponse.json({ error: msgUsuario }, { status: 500 })
  }
}
