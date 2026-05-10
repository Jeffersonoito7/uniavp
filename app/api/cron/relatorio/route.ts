import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// Roda toda segunda-feira às 8h — relatório semanal para gestores e admin
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createServiceRoleClient()
  let relatorios = 0

  // ── Relatório por gestor ──────────────────────────────────────
  const { data: gestores } = await (admin.from('gestores') as any)
    .select('id, nome, whatsapp').eq('ativo', true)

  for (const g of gestores ?? []) {
    const { data: consultores } = await (admin.from('alunos') as any)
      .select('id, nome, status').eq('gestor_whatsapp', g.whatsapp)

    if (!consultores?.length) continue

    const ativos = consultores.filter((c: any) => c.status === 'ativo')
    const concluidos = consultores.filter((c: any) => c.status === 'concluido')

    // Verificar parados (sem progresso nos últimos 7 dias)
    const parados: string[] = []
    for (const c of ativos) {
      const { data: ult } = await (admin.from('progresso') as any)
        .select('created_at').eq('aluno_id', c.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!ult) { parados.push(c.nome); continue }
      const dias = Math.floor((Date.now() - new Date(ult.created_at).getTime()) / 86400000)
      if (dias >= 7) parados.push(c.nome)
    }

    const instancia = await getInstanciaGestorPorNome(g.nome, admin)
    const msg = `📊 *Relatório Semanal — ${g.nome}*\n\n` +
      `👥 Total: *${consultores.length}* consultores\n` +
      `✅ Ativos: *${ativos.length}*\n` +
      `🏆 Formados: *${concluidos.length}*\n` +
      `😴 Parados (+7 dias): *${parados.length}*\n` +
      (parados.length > 0 ? `\n⚠️ Entre em contato:\n${parados.map(n => `• ${n}`).join('\n')}\n` : '') +
      `\n👉 Ver detalhes: ${process.env.NEXT_PUBLIC_APP_URL}/gestor`

    await enviarWhatsApp(g.whatsapp, msg, instancia)
    relatorios++
  }

  // ── Relatório geral para admins ───────────────────────────────
  const { data: admins } = await (admin.from('admins') as any)
    .select('id, user_id').eq('ativo', true)

  if (admins?.length) {
    const { count: totalAtivos } = await (admin.from('alunos') as any).select('id', { count: 'exact', head: true }).eq('status', 'ativo')
    const { count: totalConcluidos } = await (admin.from('alunos') as any).select('id', { count: 'exact', head: true }).eq('status', 'concluido')
    const { count: novosEstaSemana } = await (admin.from('alunos') as any).select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

    // Buscar WhatsApp do admin via configurações
    const { data: configWpp } = await (admin.from('configuracoes') as any)
      .select('valor').eq('chave', 'whatsapp_admin').maybeSingle()

    if (configWpp?.valor) {
      const wppAdmin = JSON.parse(configWpp.valor)
      await enviarWhatsApp(wppAdmin,
        `📈 *Relatório Semanal — Plataforma AVP*\n\n` +
        `🆕 Novos esta semana: *${novosEstaSemana ?? 0}*\n` +
        `👥 Consultores ativos: *${totalAtivos ?? 0}*\n` +
        `🏆 Formados: *${totalConcluidos ?? 0}*\n` +
        `\n👉 ${process.env.NEXT_PUBLIC_APP_URL}/admin`)
    }
  }

  return NextResponse.json({ ok: true, relatorios })
}
