import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { processarPixTxid, reconciliarEquipeGestor } from '@/lib/pix-processor'
import { vencimentoMeses } from '@/lib/date-utils'
import { captureException } from '@/lib/monitor'
import { alertarDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Roda a cada minuto — verifica TXIDs pendentes e ativa planos pagos
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  // Coleta todos os TXIDs pendentes de ambas as tabelas em paralelo
  const [{ data: pagamentos }, { data: cobrancas }] = await Promise.all([
    admin.from('gestor_pagamentos').select('txid').eq('status', 'pendente').not('txid', 'is', null),
    admin.from('cobrancas').select('txid').eq('status', 'pendente').not('txid', 'is', null),
  ])

  const txids = [
    ...(pagamentos ?? []).map(p => p.txid as string),
    ...(cobrancas ?? []).map(c => c.txid as string),
  ].filter(Boolean)

  if (txids.length === 0) {
    return NextResponse.json({ ok: true, ativados: 0, verificados: 0 })
  }

  let ativados = 0
  const BATCH = 5

  // Processa em lotes de 5 para não estourar limites de conexão simultânea
  for (let i = 0; i < txids.length; i += BATCH) {
    const lote = txids.slice(i, i + BATCH)
    const resultados = await Promise.allSettled(
      lote.map(txid => processarPixTxid(txid, admin))
    )

    for (let j = 0; j < resultados.length; j++) {
      const r = resultados[j]
      if (r.status === 'fulfilled' && r.value.processado && r.value.motivo !== 'ja_processado') {
        ativados++
      } else if (r.status === 'rejected') {
        const txid = lote[j]
        captureException(r.reason, { endpoint: 'cron/verificar-pagamentos', extra: { txid } })
        await alertarDiscord('aviso', 'Falha ao verificar TXID', r.reason?.message ?? String(r.reason), [
          { nome: 'TXID', valor: txid },
        ])
      }
    }
  }

  // Fase 2: gestor_pagamentos.status='pago' mas gestor não está PRO
  // Cobre dois cenários: gestor.ativo=false (crash) OU gestor.status_assinatura!='ativo' (downgrade indevido)
  const { data: pagamentosPagos } = await admin
    .from('gestor_pagamentos')
    .select('id, gestor_id, valor, plano_meses, txid, pago_em')
    .eq('status', 'pago')
    .not('pago_em', 'is', null)
    .order('pago_em', { ascending: false })
    .limit(50)

  if (pagamentosPagos?.length) {
    const gestorIds = [...new Set(pagamentosPagos.map((p: any) => p.gestor_id))]
    const { data: gestoresNaoPro } = await admin
      .from('gestores')
      .select('id, nome, whatsapp, tenant_id, plano_vencimento, status_assinatura, ativo')
      .in('id', gestorIds)
      .or('ativo.eq.false,status_assinatura.neq.ativo')

    // Para cada gestor fora do PRO, usa o pagamento mais recente para calcular o vencimento
    const pagamentoPorGestor = new Map<string, any>()
    for (const pag of pagamentosPagos) {
      if (!pagamentoPorGestor.has(pag.gestor_id)) {
        pagamentoPorGestor.set(pag.gestor_id, pag)
      }
    }

    for (const gestor of (gestoresNaoPro ?? [])) {
      const pag = pagamentoPorGestor.get(gestor.id)
      if (!pag) continue
      const venc = vencimentoMeses(pag.plano_meses ?? 1)
      await admin.from('gestores')
        .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: venc, pix_txid: null })
        .eq('id', gestor.id)
      await reconciliarEquipeGestor(gestor.whatsapp, gestor.nome, admin).catch(() => {})
      ativados++
    }
  }

  return NextResponse.json({ ok: true, ativados, verificados: txids.length })
}
