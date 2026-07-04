/**
 * Repara gestores presos — dois cenários:
 * 1. gestor_pagamentos.status='pago' mas gestores.ativo=false (crash entre as duas updates)
 * 2. gestor_pagamentos.status='pendente' com txid → consulta EFI e ativa se CONCLUIDA
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { processarPixTxid, reconciliarEquipeGestor } from '@/lib/pix-processor'
import { vencimentoMeses } from '@/lib/date-utils'
import { getAppUrl } from '@/lib/get-app-url'
import { enviarWhatsAppComFila, getInstanciaTenant } from '@/lib/whatsapp'
import { getMensagem } from '@/lib/mensagem'
import { audit } from '@/lib/audit'
import { createLogger } from '@/lib/logger'

const log = createLogger('reparar-gestores')

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cronHeader = req.headers.get('authorization')
  const isCron = cronHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const adminClient = createServiceRoleClient()
    const ctx = await getAdminContext(user.id, adminClient)
    if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const adminClient = createServiceRoleClient()
  const detalhes: string[] = []
  let reparados = 0

  // ── Fase 1: pagamento marcado como pago mas gestor ainda inativo ──────────
  const { data: pagamentos } = await adminClient
    .from('gestor_pagamentos')
    .select('id, gestor_id, valor, plano_meses, pago_em, txid')
    .eq('status', 'pago')
    .order('pago_em', { ascending: false })
    .limit(50)

  if (pagamentos?.length) {
    const gestorIds = pagamentos.map(p => p.gestor_id)
    const { data: gestoresInativos } = await adminClient
      .from('gestores')
      .select('id, nome, whatsapp, ativo, status_assinatura, tenant_id, plano_vencimento')
      .in('id', gestorIds)
      .eq('ativo', false)

    for (const pag of pagamentos) {
      const gestor = gestoresInativos?.find(g => g.id === pag.gestor_id)
      if (!gestor) continue

      const vencimento = vencimentoMeses(pag.plano_meses ?? 1)
      const { error: updateErr } = await adminClient.from('gestores')
        .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
        .eq('id', gestor.id)

      if (updateErr) {
        log.error('falha ao reparar gestor (fase1)', { gestor_id: gestor.id, err: updateErr.message })
        detalhes.push(`ERRO ${gestor.nome}: ${updateErr.message}`)
        continue
      }

      await audit({
        acao: 'pagamento.confirmado',
        entidade: 'gestor_pagamentos',
        entidade_id: String(pag.id),
        usuario_tipo: 'sistema',
        dados_novos: { gestor_id: gestor.id, txid: pag.txid, vencimento, origem: 'reparar-gestores-fase1' },
      })

      try {
        const appUrl = await getAppUrl(gestor.tenant_id)
        const valor = Number(pag.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        const instancia = await getInstanciaTenant(gestor.tenant_id, adminClient)
        const msg = await getMensagem('pagamento_gestor_upgrade', { gestorNome: gestor.nome, valor, appUrl }, adminClient, gestor.tenant_id)
        await enviarWhatsAppComFila(gestor.whatsapp, msg, instancia, adminClient, gestor.tenant_id)
      } catch (e) {
        log.error('falha ao notificar gestor reparado', { gestor_id: gestor.id, err: String(e) })
      }

      // Reconcilia toda a equipe: DDI + indicador_id → gestor_whatsapp
      try {
        const rec = await reconciliarEquipeGestor(gestor.whatsapp, gestor.nome, adminClient)
        const total = rec.ddi + rec.indicador
        if (total > 0) detalhes.push(`OK ${gestor.nome}: ${total} aluno(s) reconciliados (ddi:${rec.ddi} indicador:${rec.indicador})`)
      } catch (e) {
        log.error('falha ao reconciliar equipe no reparo', { gestor_id: gestor.id, err: String(e) })
      }

      reparados++
      detalhes.push(`OK ${gestor.nome} (${gestor.whatsapp})`)
    }
  }

  // ── Fase 2: pendente com txid → consulta EFI e ativa se confirmado ────────
  const { data: pendentes } = await adminClient
    .from('gestor_pagamentos')
    .select('txid, gestor_id')
    .eq('status', 'pendente')
    .not('txid', 'is', null)
    .limit(20)

  const txidsPendentes = (pendentes ?? []).map(p => p.txid as string).filter(Boolean)

  for (const txid of txidsPendentes) {
    try {
      const resultado = await processarPixTxid(txid, adminClient)
      if (resultado.processado && resultado.motivo !== 'ja_processado') {
        reparados++
        detalhes.push(`OK pagamento pendente ativado (txid: ${txid.substring(0, 8)}...)`)
        log.info('pagamento pendente ativado via reparar-gestores', { txid })
      }
    } catch (e: any) {
      // pagamento_nao_confirmado = EFI ainda não confirmou; não é erro crítico
      if (e?.message !== 'pagamento_nao_confirmado') {
        log.error('erro ao processar txid pendente', { txid, err: e?.message })
        detalhes.push(`ERRO txid ${txid.substring(0, 8)}...: ${e?.message}`)
      }
    }
  }

  // ── Fase 3: reconcilia equipe de todos os gestores PRO ativos ─────────────
  // Corrige alunos captados quando o gestor ainda era FREE (indicador_id orfao).
  // Roda sempre pois e idempotente e barata — so atualiza quem tem gestor_whatsapp vazio.
  const { data: todosAtivos } = await adminClient
    .from('gestores')
    .select('id, nome, whatsapp')
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .limit(200)

  let totalReconciliados = 0
  for (const g of todosAtivos ?? []) {
    try {
      const rec = await reconciliarEquipeGestor(g.whatsapp, g.nome, adminClient)
      const total = rec.ddi + rec.indicador
      if (total > 0) {
        detalhes.push(`EQUIPE ${g.nome}: ${total} aluno(s) reconciliados (ddi:${rec.ddi} indicador:${rec.indicador})`)
        totalReconciliados += total
      }
    } catch (e) {
      log.error('falha na fase3 reconciliacao', { gestor_id: g.id, err: String(e) })
    }
  }

  const mensagem = reparados === 0 && totalReconciliados === 0
    ? `Nenhum caso pendente encontrado. ${txidsPendentes.length} txid(s) pendente(s) verificado(s) na EFI. ${todosAtivos?.length ?? 0} gestor(es) verificados, equipes OK.`
    : undefined

  return NextResponse.json({ ok: true, reparados, totalReconciliados, detalhes, mensagem })
}
