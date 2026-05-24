import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { contarPROsAtivosIndicados, getLimitePROGratuito } from '@/lib/pros-indicados'
import { alertarDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'

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

    // ── Aviso 3 dias antes ────────────────────────────────────────
    if (diasParaVencer === 3) {
      await enviarWhatsApp(
        g.whatsapp,
        `⏰ *Seu plano UNIAVP PRO vence em 3 dias!*\n\nOlá, ${g.nome}! Seu acesso expira em ${vencimento.toLocaleDateString('pt-BR')}.\n\nRenove agora para não perder acesso à sua equipe:\n👉 ${appUrl}/pro/assinar`,
        instancia
      )
      avisos++
    }

    // ── Aviso no dia do vencimento ────────────────────────────────
    if (diasParaVencer === 0) {
      await enviarWhatsApp(
        g.whatsapp,
        `🔔 *Seu plano UNIAVP PRO vence hoje!*\n\nRenove agora para continuar gerenciando sua equipe FREE:\n👉 ${appUrl}/pro/assinar`,
        instancia
      )
      avisos++
    }

    // ── Suspende após 2 dias de atraso ────────────────────────────
    if (diasParaVencer < -2) {
      await admin.from('gestores')
        .update({ ativo: false, status_assinatura: 'suspenso' })
        .eq('id', g.id)

      await enviarWhatsApp(
        g.whatsapp,
        `⚠️ *Acesso UNIAVP PRO suspenso*\n\nOlá, ${g.nome}. Seu plano venceu e o acesso foi suspenso.\n\nRegularize para reativar imediatamente:\n👉 ${appUrl}/pro/assinar`,
        instancia
      )
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
          const totalAgora = await contarPROsAtivosIndicados(gestorOrigem.id, admin)
          const limiteOrigem = await limiteDo(gestorOrigem.tenant_id)
          const faltam = limiteOrigem - totalAgora
          const perdeuBeneficio = totalAgora === limiteOrigem - 1

          const msg = perdeuBeneficio
            ? `⚠️ *Você perdeu o PRO gratuito!*\n\n${g.nome} cancelou o plano PRO e sua rede caiu para *${totalAgora}/${limiteOrigem}*.\n\nIndique mais *1 PRO* para recuperar o benefício!\n\n🔗 Link PRO direto:\n${appUrl}/captacao?direto=1&plano=pro`
            : `📉 *${g.nome}* cancelou o plano PRO.\n\nSua rede agora tem *${totalAgora}/${limiteOrigem}* PROs ativos. Faltam ${faltam} para ter o PRO gratuito.\n\n🔗 Indique mais PROs:\n${appUrl}/captacao?direto=1&plano=pro`

          const instanciaOrigem = await instanciaDo(gestorOrigem.tenant_id)
          await enviarWhatsApp(gestorOrigem.whatsapp, msg, instanciaOrigem)
          alertasRede++
        }
      }
    }
  }

  // ── 2. Verifica PROs suspensos que voltaram a ter rede completa ──
  // (caso alguém da rede de um PRO suspenso renove → reativa gratuito)
  const { data: gestoresSuspensos } = await admin.from('gestores')
    .select('id, nome, whatsapp, status_assinatura, tenant_id')
    .eq('ativo', false)
    .eq('status_assinatura', 'suspenso')

  for (const g of gestoresSuspensos ?? []) {
    const LIMITE = await limiteDo(g.tenant_id)
    const total = await contarPROsAtivosIndicados(g.id, admin)
    if (total >= LIMITE) {
      // Reativa gratuitamente
      const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await admin.from('gestores')
        .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento })
        .eq('id', g.id)

      const instancia = await instanciaDo(g.tenant_id)
      await enviarWhatsApp(
        g.whatsapp,
        `🎉 *Seu PRO foi reativado gratuitamente!*\n\nOlá, ${g.nome}! Sua rede voltou a ter *${total} PROs ativos*.\n\nSeu plano PRO está ativo por mais 30 dias sem custo.\n\n👉 Acesse: ${appUrl}/pro`,
        instancia
      )
      avisos++
    }
  }

  if (suspensos > 0) {
    await alertarDiscord('info', `${suspensos} PRO(s) suspenso(s) hoje`, nomesSuspensos.join(', '), [
      { nome: 'Suspensos', valor: String(suspensos) },
      { nome: 'Avisos enviados', valor: String(avisos) },
    ])
  }

  return NextResponse.json({ ok: true, avisos, suspensos, alertasRede })
  } catch (e: any) {
    await alertarDiscord('critico', 'Cron gestores-expirados falhou', e?.message ?? String(e))
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
