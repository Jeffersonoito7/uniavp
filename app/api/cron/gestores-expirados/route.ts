import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { contarPROsAtivosIndicados, LIMITE_PRO_GRATUITO } from '@/lib/pros-indicados'

export const dynamic = 'force-dynamic'

// Roda diariamente — gerencia planos PRO: aviso de vencimento + suspensão + alerta de rede
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()
  const agora = new Date()
  const appUrl = await getAppUrl()
  let avisos = 0
  let suspensos = 0
  let alertasRede = 0

  // ── 1. Busca PROs ativos com plano ativo (não trial) ─────────────
  const { data: gestores } = await (admin.from('gestores') as any)
    .select('id, nome, whatsapp, plano_vencimento, status_assinatura, indicado_por_gestor_id')
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .not('plano_vencimento', 'is', null)

  for (const g of gestores ?? []) {
    const vencimento = new Date(g.plano_vencimento)
    const diasParaVencer = Math.ceil((vencimento.getTime() - agora.getTime()) / 86400000)

    // ── Aviso 3 dias antes ────────────────────────────────────────
    if (diasParaVencer === 3) {
      await enviarWhatsApp(
        g.whatsapp,
        `⏰ *Seu plano UNIAVP PRO vence em 3 dias!*\n\nOlá, ${g.nome}! Seu acesso expira em ${vencimento.toLocaleDateString('pt-BR')}.\n\nRenove agora para não perder acesso à sua equipe:\n👉 ${appUrl}/pro/assinar`
      )
      avisos++
    }

    // ── Aviso no dia do vencimento ────────────────────────────────
    if (diasParaVencer === 0) {
      await enviarWhatsApp(
        g.whatsapp,
        `🔔 *Seu plano UNIAVP PRO vence hoje!*\n\nRenove agora para continuar gerenciando sua equipe FREE:\n👉 ${appUrl}/pro/assinar`
      )
      avisos++
    }

    // ── Suspende após 2 dias de atraso ────────────────────────────
    if (diasParaVencer < -2) {
      await (admin.from('gestores') as any)
        .update({ ativo: false, status_assinatura: 'suspenso' })
        .eq('id', g.id)

      await enviarWhatsApp(
        g.whatsapp,
        `⚠️ *Acesso UNIAVP PRO suspenso*\n\nOlá, ${g.nome}. Seu plano venceu e o acesso foi suspenso.\n\nRegularize para reativar imediatamente:\n👉 ${appUrl}/pro/assinar`
      )
      suspensos++

      // ── Notifica o PRO da rede (indicado_por_gestor_id) ──────────
      if (g.indicado_por_gestor_id) {
        const { data: gestorOrigem } = await (admin.from('gestores') as any)
          .select('id, nome, whatsapp')
          .eq('id', g.indicado_por_gestor_id)
          .eq('ativo', true)
          .maybeSingle()

        if (gestorOrigem?.whatsapp) {
          const totalAgora = await contarPROsAtivosIndicados(gestorOrigem.id, admin)
          const faltam = LIMITE_PRO_GRATUITO - totalAgora
          const perdeuBeneficio = totalAgora === LIMITE_PRO_GRATUITO - 1 // era 20, caiu para 19

          const msg = perdeuBeneficio
            ? `⚠️ *Você perdeu o PRO gratuito!*\n\n${g.nome} cancelou o plano PRO e sua rede caiu para *${totalAgora}/${LIMITE_PRO_GRATUITO}*.\n\nIndique mais *1 PRO* para recuperar o benefício!\n\n🔗 Link PRO direto:\n${appUrl}/captacao?direto=1&plano=pro`
            : `📉 *${g.nome}* cancelou o plano PRO.\n\nSua rede agora tem *${totalAgora}/${LIMITE_PRO_GRATUITO}* PROs ativos. Faltam ${faltam} para ter o PRO gratuito.\n\n🔗 Indique mais PROs:\n${appUrl}/captacao?direto=1&plano=pro`

          await enviarWhatsApp(gestorOrigem.whatsapp, msg)
          alertasRede++
        }
      }
    }
  }

  // ── 2. Verifica PROs suspensos que voltaram a ter rede completa ──
  // (caso alguém da rede de um PRO suspenso renove → reativa gratuito)
  const { data: gestoresSuspensos } = await (admin.from('gestores') as any)
    .select('id, nome, whatsapp, status_assinatura')
    .eq('ativo', false)
    .eq('status_assinatura', 'suspenso')

  for (const g of gestoresSuspensos ?? []) {
    const total = await contarPROsAtivosIndicados(g.id, admin)
    if (total >= LIMITE_PRO_GRATUITO) {
      // Reativa gratuitamente
      const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await (admin.from('gestores') as any)
        .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento })
        .eq('id', g.id)

      await enviarWhatsApp(
        g.whatsapp,
        `🎉 *Seu PRO foi reativado gratuitamente!*\n\nOlá, ${g.nome}! Sua rede voltou a ter *${total} PROs ativos*.\n\nSeu plano PRO está ativo por mais 30 dias sem custo.\n\n👉 Acesse: ${appUrl}/pro`
      )
      avisos++
    }
  }

  return NextResponse.json({ ok: true, avisos, suspensos, alertasRede })
}
