/**
 * Repara gestores presos: pagamento marcado como 'pago' mas gestor ainda inativo.
 * Cenário: crash entre o update de gestor_pagamentos e o update de gestores.
 * Pode ser chamada pelo admin ou pelo cron sem parâmetros.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { vencimentoMeses } from '@/lib/date-utils'
import { getAppUrl } from '@/lib/get-app-url'
import { enviarWhatsAppComFila, getInstanciaTenant } from '@/lib/whatsapp'
import { getMensagem } from '@/lib/mensagem'
import { audit } from '@/lib/audit'
import { createLogger } from '@/lib/logger'

const log = createLogger('reparar-gestores')

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Autenticação: admin de tenant ou CRON_SECRET
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

  // Busca pagamentos marcados como 'pago' cujo gestor ainda está inativo
  const { data: pagamentos } = await adminClient
    .from('gestor_pagamentos')
    .select('id, gestor_id, valor, plano_meses, pago_em, txid')
    .eq('status', 'pago')
    .order('pago_em', { ascending: false })
    .limit(50)

  if (!pagamentos?.length) {
    return NextResponse.json({ ok: true, reparados: 0, mensagem: 'Nenhum pagamento para verificar.' })
  }

  const gestorIds = pagamentos.map(p => p.gestor_id)
  const { data: gestoresInativos } = await adminClient
    .from('gestores')
    .select('id, nome, whatsapp, ativo, status_assinatura, tenant_id, plano_vencimento')
    .in('id', gestorIds)
    .eq('ativo', false)

  if (!gestoresInativos?.length) {
    return NextResponse.json({ ok: true, reparados: 0, mensagem: 'Todos os gestores com pagamento confirmado já estão ativos.' })
  }

  const gestoresMap = new Map(gestoresInativos.map(g => [g.id, g]))
  let reparados = 0
  const detalhes: string[] = []

  for (const pag of pagamentos) {
    const gestor = gestoresMap.get(pag.gestor_id)
    if (!gestor) continue

    const vencimento = vencimentoMeses(pag.plano_meses ?? 1)

    const { error: updateErr } = await adminClient.from('gestores')
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
      .eq('id', gestor.id)

    if (updateErr) {
      log.error('falha ao reparar gestor', { gestor_id: gestor.id, err: updateErr.message })
      detalhes.push(`ERRO ${gestor.nome}: ${updateErr.message}`)
      continue
    }

    await audit({
      acao: 'pagamento.reparado',
      entidade: 'gestor_pagamentos',
      entidade_id: String(pag.id),
      usuario_tipo: 'sistema',
      dados_novos: { gestor_id: gestor.id, txid: pag.txid, vencimento, origem: 'reparar-gestores' },
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

    reparados++
    detalhes.push(`OK ${gestor.nome} (${gestor.whatsapp})`)
    log.info('gestor reparado', { gestor_id: gestor.id, nome: gestor.nome })
  }

  return NextResponse.json({ ok: true, reparados, detalhes })
}
