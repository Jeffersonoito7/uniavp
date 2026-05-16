import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { criarCobrancaPix } from '@/lib/efi'
import { randomUUID } from 'crypto'
import { verificarPROGratuito, contarPROsAtivosIndicados, LIMITE_PRO_GRATUITO } from '@/lib/pros-indicados'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, nome, whatsapp, status_assinatura, plano_vencimento')
    .eq('user_id', user.id).eq('ativo', true).maybeSingle()

  if (!gestor) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

  // Verifica se já tem pagamento pendente
  const { data: pagPendente } = await (adminClient.from('gestor_pagamentos') as any)
    .select('id, pix_copia_cola, qrcode_base64, vencimento')
    .eq('gestor_id', gestor.id)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pagPendente) {
    return NextResponse.json({ ok: true, pagamento: pagPendente, jaExiste: true })
  }

  // ── Verifica se o PRO tem 20+ PROs ativos na rede → renovação gratuita ──
  const ehGratuito = await verificarPROGratuito(gestor.id, adminClient)
  if (ehGratuito) {
    const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await (adminClient.from('gestores') as any)
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento })
      .eq('id', gestor.id)
    return NextResponse.json({ ok: true, gratuito: true, vencimento })
  }

  // Lê valor configurado no painel admin (padrão 97)
  const { data: valorCfg } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'plano_pro_valor').maybeSingle()
  const valorStr = valorCfg?.valor ? String(valorCfg.valor).replace(/"/g, '') : '147'
  const valorPlano = Math.max(1, parseFloat(valorStr) || 97)

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
      descricao: 'Mensalidade UNIAVP PRO',
    })

    const { data: pagamento } = await (adminClient.from('gestor_pagamentos') as any)
      .insert({
        gestor_id: gestor.id,
        txid,
        valor: valorPlano,
        status: 'pendente',
        pix_copia_cola: pixCopiaECola,
        qrcode_base64: qrcodeBase64,
        vencimento,
      })
      .select().single()

    await (adminClient.from('gestores') as any)
      .update({ pix_txid: txid })
      .eq('id', gestor.id)

    return NextResponse.json({ ok: true, pagamento })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, status_assinatura, trial_expira_em, plano_vencimento')
    .eq('user_id', user.id).maybeSingle()

  if (!gestor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const agora = new Date()
  const trialAtivo = gestor.status_assinatura === 'trial' && gestor.trial_expira_em && new Date(gestor.trial_expira_em) > agora
  const diasTrial = trialAtivo ? Math.ceil((new Date(gestor.trial_expira_em).getTime() - agora.getTime()) / 86400000) : 0

  const { data: ultimoPag } = await (adminClient.from('gestor_pagamentos') as any)
    .select('*')
    .eq('gestor_id', gestor.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: valorCfgGet } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'plano_pro_valor').maybeSingle()
  const valorPlanoGet = Math.max(1, parseFloat(String(valorCfgGet?.valor ?? '').replace(/"/g, '')) || 97)

  const prosIndicados = await contarPROsAtivosIndicados(gestor.id, adminClient)
  const ehGratuito = prosIndicados >= LIMITE_PRO_GRATUITO

  return NextResponse.json({
    status: gestor.status_assinatura,
    trialAtivo,
    diasTrial,
    planoVencimento: gestor.plano_vencimento,
    ultimoPagamento: ultimoPag,
    valorPlano: valorPlanoGet,
    prosIndicados,
    limiteGratuito: LIMITE_PRO_GRATUITO,
    ehGratuito,
  })
}
