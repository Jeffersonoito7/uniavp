import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { contarPROsAtivosIndicados, getLimitePROGratuito } from '@/lib/pros-indicados'
import { alertarDiscord } from '@/lib/discord'
import { getMensagem } from '@/lib/mensagem'
import { vencimentoMeses } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Roda diariamente — gerencia planos PRO: aviso de vencimento + suspensão + alerta de rede
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
  const admin = createServiceRoleClient()
  const agora = new Date()
  const appUrl = await getAppUrl()
  let avisos = 0
  let suspensos = 0
  let alertasRede = 0
  const nomesSuspensos: string[] = []

  // Cache de instância e limite por tenant para evitar N queries
  const instanciaCache = new Map<string, string | null>()
  const limiteCache = new Map<string, number>()
  async function instanciaDo(tenantId: string | null) {
    const key = tenantId ?? ''
    if (!instanciaCache.has(key)) instanciaCache.set(key, await getInstanciaTenant(tenantId, admin))
    return instanciaCache.get(key) ?? null
  }
  async function limiteDo(tenantId: string | null) {
    const key = tenantId ?? ''
    if (!limiteCache.has(key)) limiteCache.set(key, await getLimitePROGratuito(admin, tenantId))
    return limiteCache.get(key)!
  }

  // ── 1. Busca PROs ativos com plano ativo (não trial) ─────────────
  const { data: gestores } = await admin.from('gestores')
    .select('id, nome, whatsapp, plano_vencimento, status_assinatura, indicado_por_gestor_id, tenant_id')
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .not('plano_vencimento', 'is', null)

  for (const g of gestores ?? []) {
    const vencimento = new Date(g.plano_vencimento)
    const diasParaVencer = Math.ceil((vencimento.getTime() - agora.getTime()) / 86400000)
    const instancia = await instanciaDo(g.tenant_id)
    const LIMITE = await limiteDo(g.tenant_id)

    const varsGestor = { gestorNome: g.nome, vencimento: vencimento.toLocaleDateString('pt-BR'), appUrl }

    // ── Aviso 3 dias antes ────────────────────────────────────────
    if (diasParaVencer === 3) {
      await enviarWhatsApp(g.whatsapp,
        await getMensagem('pro_vencimento_3dias', varsGestor, admin, g.tenant_id), instancia)
      avisos++
    }

    // ── Aviso no dia do vencimento ────────────────────────────────
    if (diasParaVencer === 0) {
      await enviarWhatsApp(g.whatsapp,
        await getMensagem('pro_vencimento_hoje', varsGestor, admin, g.tenant_id), instancia)
      avisos++
    }

    // ── Baixa para FREE após 2 dias de atraso ─────────────────────
    if (diasParaVencer < -2) {
      await admin.from('gestores')
        .update({ status_assinatura: 'free', plano_vencimento: null })
        .eq('id', g.id)

      await enviarWhatsApp(g.whatsapp,
        await getMensagem('pro_suspenso', varsGestor, admin, g.tenant_id), instancia)
      suspensos++
      nomesSuspensos.push(g.nome)

      // ── Notifica o PRO da rede (indicado_por_gestor_id) ──────────
      if (g.indicado_por_gestor_id) {
        const { data: gestorOrigem } = await admin.from('gestores')
          .select('id, nome, whatsapp, tenant_id')
          .eq('id', g.indicado_por_gestor_id)
          .eq('ativo', true)
          .maybeSingle()

        if (gestorOrigem?.whatsapp) {
          const totalAgora = await contarPROsAtivosIndicados(gestorOrigem.id, gestorOrigem.whatsapp, admin)
          const limiteOrigem = await limiteDo(gestorOrigem.tenant_id)
          const faltam = limiteOrigem - totalAgora
          const perdeuBeneficio = totalAgora === limiteOrigem - 1

          const chaveRede = perdeuBeneficio ? 'pro_rede_perdeu_beneficio' : 'pro_rede_membro_saiu'
          const instanciaOrigem = await instanciaDo(gestorOrigem.tenant_id)
          await enviarWhatsApp(gestorOrigem.whatsapp,
            await getMensagem(chaveRede, {
              membroNome: g.nome, totalAtivos: String(totalAgora), limite: String(limiteOrigem), faltam: String(faltam), appUrl,
            }, admin, gestorOrigem.tenant_id),
            instanciaOrigem)
          alertasRede++
        }
      }
    }
  }

  // ── 2. Reativa gestores FREE/suspenso que tenham pagamento confirmado ──
  // Cobre o caso: gestor caiu para free mas já tem pagamento pago no banco
  const { data: gestoresComPagamentoPendente } = await admin.from('gestores')
    .select('id, nome, whatsapp, tenant_id')
    .eq('ativo', true)
    .in('status_assinatura', ['free', 'suspenso'])

  let reativadosPorPagamento = 0
  for (const g of gestoresComPagamentoPendente ?? []) {
    const { data: pagamento } = await admin.from('gestor_pagamentos')
      .select('id, plano_meses, created_at')
      .eq('gestor_id', g.id)
      .eq('status', 'pago')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!pagamento) continue

    const meses = (pagamento.plano_meses as number) ?? 1
    const novoVencimento = vencimentoMeses(meses)
    await admin.from('gestores')
      .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: novoVencimento })
      .eq('id', g.id)

    const instancia = await instanciaDo(g.tenant_id)
    const appUrl2 = await getAppUrl(g.tenant_id)
    await enviarWhatsApp(g.whatsapp,
      await getMensagem('pro_reativado_gratuito', { gestorNome: g.nome, totalAtivos: '1', limite: '1', appUrl: appUrl2 }, admin, g.tenant_id),
      instancia).catch(() => {})
    reativadosPorPagamento++
  }

  // ── 3. Verifica PROs no plano FREE que voltaram a ter rede completa ──
  // (caso alguém da rede renove → reativa PRO gratuito)
  const { data: gestoresSuspensos } = await admin.from('gestores')
    .select('id, nome, whatsapp, status_assinatura, tenant_id')
    .eq('ativo', true)
    .in('status_assinatura', ['free', 'suspenso'])

  for (const g of gestoresSuspensos ?? []) {
    const LIMITE = await limiteDo(g.tenant_id)
    const total = await contarPROsAtivosIndicados(g.id, g.whatsapp, admin)
    if (total >= LIMITE) {
      // Reativa gratuitamente
      const vencimento = vencimentoMeses(1)
      await admin.from('gestores')
        .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento })
        .eq('id', g.id)

      const instancia = await instanciaDo(g.tenant_id)
      await enviarWhatsApp(g.whatsapp,
        await getMensagem('pro_reativado_gratuito', { gestorNome: g.nome, totalAtivos: String(total), appUrl }, admin, g.tenant_id),
        instancia)
      avisos++
    }
  }

  if (suspensos > 0) {
    await alertarDiscord('info', `${suspensos} PRO(s) suspenso(s) hoje`, nomesSuspensos.join(', '), [
      { nome: 'Suspensos', valor: String(suspensos) },
      { nome: 'Avisos enviados', valor: String(avisos) },
    ])
  }

  return NextResponse.json({ ok: true, avisos, suspensos, alertasRede, reativadosPorPagamento })
  } catch (e: any) {
    await alertarDiscord('critico', 'Cron gestores-expirados falhou', e?.message ?? String(e))
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
