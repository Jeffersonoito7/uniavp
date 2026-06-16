import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { consultarNotificacaoCartao } from '@/lib/efi'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { getMensagem } from '@/lib/mensagem'
import { audit } from '@/lib/audit'
import { captureException } from '@/lib/monitor'
import { vencimentoMeses } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== process.env.EFI_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { notification?: string }
  try { body = await req.json() } catch { return NextResponse.json({ ok: true }) }

  const notificationToken = body?.notification
  if (!notificationToken) return NextResponse.json({ ok: true })

  try {
    const { chargeId, pago } = await consultarNotificacaoCartao(notificationToken)
    if (!pago || !chargeId) return NextResponse.json({ ok: true })

    const adminClient = createServiceRoleClient()

    // Busca pagamento pelo charge_id (colunas adicionadas via migration SQL)
    const { data: pag } = await (adminClient.from('gestor_pagamentos') as any)
      .select('id, gestor_id, valor, plano_meses, status')
      .eq('charge_id', chargeId)
      .maybeSingle() as { data: { id: string; gestor_id: string; valor: number; plano_meses: number; status: string } | null }

    if (!pag || pag.status !== 'pendente') return NextResponse.json({ ok: true, motivo: 'ja_processado' })

    // Marca pagamento como pago
    const { data: atualizado } = await adminClient.from('gestor_pagamentos')
      .update({ status: 'pago', pago_em: new Date().toISOString() })
      .eq('id', pag.id)
      .eq('status', 'pendente')
      .select('id')
    if (!atualizado?.length) return NextResponse.json({ ok: true, motivo: 'race_condition' })

    // Calcula vencimento conforme plano (padrão 1 mês, anual = 12 meses)
    const meses = pag.plano_meses ?? 1
    const vencimento = vencimentoMeses(meses)

    const { data: gestor } = await adminClient.from('gestores')
      .select('id, nome, whatsapp, ativo, status_assinatura, tenant_id')
      .eq('id', pag.gestor_id)
      .maybeSingle()

    if (!gestor) return NextResponse.json({ ok: true })

    const eraUpgrade = !gestor.ativo || gestor.status_assinatura === 'pendente_upgrade'
    await adminClient.from('gestores')
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento })
      .eq('id', gestor.id)

    await audit({
      acao: 'pagamento.confirmado',
      entidade: 'gestor_pagamentos',
      entidade_id: String(pag.id),
      usuario_tipo: 'sistema',
      dados_novos: { chargeId, valor: pag.valor, gestor_id: pag.gestor_id, tipo: 'cartao', plano_meses: meses },
    })

    if (gestor.whatsapp) {
      try {
        const instancia = await getInstanciaTenant(gestor.tenant_id, adminClient)
        const appUrl = await getAppUrl(gestor.tenant_id)
        const valor = Number(pag.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        const chave = eraUpgrade ? 'pagamento_gestor_upgrade' : 'pagamento_gestor_renovacao'
        const msg = await getMensagem(chave, { gestorNome: gestor.nome, valor, appUrl }, adminClient, gestor.tenant_id)
        await enviarWhatsApp(gestor.whatsapp, msg, instancia)
      } catch { /* notificação não crítica */ }
    }

    if (eraUpgrade) {
      try {
        const { concederCreditosBoasVindas } = await import('@/lib/pro-agente')
        await concederCreditosBoasVindas(gestor.id, gestor.tenant_id ?? null, adminClient)
      } catch { /* não crítico */ }
    }
  } catch (e: any) {
    captureException(e, { endpoint: 'webhook/efi/cartao' })
  }

  return NextResponse.json({ ok: true })
}
