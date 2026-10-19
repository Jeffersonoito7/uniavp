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

  // Fase 2: gestor_pagamentos.status='pago' cujo período ainda vigora mas gestor não está PRO.
  // Critério de "vigência": pago_em + plano_meses meses > agora (pagamento ainda dentro do período pago).
  // Isso evita reativar gestores cujos planos antigos já expiraram naturalmente.
  const limiteVigencia = new Date()
  limiteVigencia.setFullYear(limiteVigencia.getFullYear() - 1) // pagamentos dos últimos 12 meses
  const { data: pagamentosPagos } = await admin
    .from('gestor_pagamentos')
    .select('id, gestor_id, valor, plano_meses, txid, pago_em')
    .eq('status', 'pago')
    .not('pago_em', 'is', null)
    .gte('pago_em', limiteVigencia.toISOString())
    .order('pago_em', { ascending: false })
    .limit(200)

  if (pagamentosPagos?.length) {
    const agora = new Date()
    // Filtra apenas pagamentos cujo período ainda não expirou
    const pagamentosVigentes = pagamentosPagos.filter((p: any) => {
      const pagoEm = new Date(p.pago_em)
      const vencPag = new Date(pagoEm)
      vencPag.setMonth(vencPag.getMonth() + (p.plano_meses ?? 1))
      return vencPag > agora
    })

    if (pagamentosVigentes.length) {
      const gestorIds = [...new Set(pagamentosVigentes.map((p: any) => p.gestor_id))]
      const { data: gestoresNaoPro } = await admin
        .from('gestores')
        .select('id, nome, whatsapp, tenant_id, plano_vencimento, status_assinatura, ativo')
        .in('id', gestorIds)
        .or('ativo.eq.false,status_assinatura.neq.ativo')

      // Usa o pagamento vigente mais recente por gestor
      const pagamentoPorGestor = new Map<string, any>()
      for (const pag of pagamentosVigentes) {
        if (!pagamentoPorGestor.has(pag.gestor_id)) {
          pagamentoPorGestor.set(pag.gestor_id, pag)
        }
      }

      for (const gestor of (gestoresNaoPro ?? [])) {
        try {
          const pag = pagamentoPorGestor.get(gestor.id)
          if (!pag) continue
          // Vencimento: a partir do pago_em original (não de agora), para não "dar brinde" de dias extras
          const pagoEm = new Date(pag.pago_em)
          const venc = new Date(pagoEm)
          venc.setMonth(venc.getMonth() + (pag.plano_meses ?? 1))
          const { error: updErr } = await admin.from('gestores')
            .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: venc.toISOString(), pix_txid: null })
            .eq('id', gestor.id)
          if (updErr) {
            await alertarDiscord('aviso', 'Fase 2: falha ao ativar gestor', updErr.message, [
              { nome: 'Gestor', valor: gestor.nome },
              { nome: 'ID', valor: gestor.id },
            ])
            continue
          }
          await reconciliarEquipeGestor(gestor.whatsapp, gestor.nome, admin).catch(() => {})
          ativados++
        } catch (eGestor: any) {
          await alertarDiscord('aviso', 'Fase 2: exceção ao ativar gestor', eGestor?.message ?? String(eGestor), [
            { nome: 'Gestor', valor: gestor.nome },
          ]).catch(() => {})
        }
      }
    }
  }

  return NextResponse.json({ ok: true, ativados, verificados: txids.length })
}
