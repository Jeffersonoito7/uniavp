import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

async function enviarEmailRelatorio(para: string, nomeGestor: string, stats: {
  total: number; ativos: number; concluidos: number; parados: string[]
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const parados = stats.parados
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Inter,system-ui,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#333687,#02A153);padding:32px;text-align:center">
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0 0 6px">Relatório Semanal</p>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">Sua equipe esta semana</h1>
    </div>

    <!-- Saudação -->
    <div style="padding:28px 32px 0">
      <p style="font-size:15px;color:#444;margin:0">Olá, <strong>${nomeGestor}</strong>! 👋</p>
      <p style="font-size:14px;color:#777;margin:8px 0 0">Aqui está o resumo da sua equipe na semana passada.</p>
    </div>

    <!-- Cards de stats -->
    <div style="padding:24px 32px;display:flex;gap:12px;flex-wrap:wrap">
      ${[
        { label: 'Total', value: stats.total, color: '#333687' },
        { label: 'Ativos', value: stats.ativos, color: '#02A153' },
        { label: 'Formados', value: stats.concluidos, color: '#22c55e' },
        { label: 'Parados', value: parados.length, color: parados.length > 0 ? '#e63946' : '#8a8fa3' },
      ].map(s => `
        <div style="flex:1;min-width:100px;background:#f8f8fc;border-radius:12px;padding:16px;text-align:center">
          <p style="font-size:28px;font-weight:800;color:${s.color};margin:0">${s.value}</p>
          <p style="font-size:12px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.5px">${s.label}</p>
        </div>
      `).join('')}
    </div>

    ${parados.length > 0 ? `
    <!-- Parados -->
    <div style="margin:0 32px 24px;background:#fff3f4;border:1px solid #fecdd3;border-radius:12px;padding:20px">
      <p style="font-weight:700;color:#e63946;font-size:14px;margin:0 0 12px">⚠️ Consultores parados há +7 dias</p>
      ${parados.map(n => `<p style="font-size:13px;color:#666;margin:4px 0">• ${n}</p>`).join('')}
      <p style="font-size:12px;color:#999;margin:12px 0 0">Entre em contato e incentive-os a continuar!</p>
    </div>
    ` : `
    <div style="margin:0 32px 24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center">
      <p style="font-weight:700;color:#16a34a;font-size:14px;margin:0">🏆 Ótima semana! Nenhum consultor parado.</p>
    </div>
    `}

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center">
      <a href="${await getAppUrl()}/gestor"
        style="display:inline-block;background:linear-gradient(135deg,#333687,#02A153);color:#fff;text-decoration:none;border-radius:10px;padding:14px 32px;font-weight:700;font-size:15px">
        Ver painel completo →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#f8f8fc;padding:16px 32px;text-align:center">
      <p style="font-size:12px;color:#aaa;margin:0">Universidade AVP · Relatório automático toda segunda-feira</p>
    </div>
  </div>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Universidade AVP <noreply@oito7digital.com.br>',
      to: [para],
      subject: `📊 Relatório semanal — ${nomeGestor}`,
      html,
    }),
  }).catch(() => {})
}

// Roda toda segunda-feira às 8h — relatório semanal para gestores e admin
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createServiceRoleClient()
  let relatorios = 0

  // ── Relatório por gestor ──────────────────────────────────────
  const { data: gestores } = await (admin.from('gestores') as any)
    .select('id, nome, email, whatsapp').eq('ativo', true)

  for (const g of gestores ?? []) {
    const { data: consultores } = await (admin.from('alunos') as any)
      .select('id, nome, status').eq('gestor_whatsapp', g.whatsapp)

    if (!consultores?.length) continue

    const ativos = consultores.filter((c: any) => c.status === 'ativo')
    const concluidos = consultores.filter((c: any) => c.status === 'concluido')

    // Consultores parados: ativos sem progresso nos últimos 7 dias
    const parados: string[] = []
    const alunoIds = ativos.map((c: any) => c.id)
    if (alunoIds.length > 0) {
      const { data: recentes } = await (admin.from('progresso') as any)
        .select('aluno_id')
        .in('aluno_id', alunoIds)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      const comAtividade = new Set((recentes ?? []).map((r: any) => r.aluno_id))
      for (const c of ativos) {
        if (!comAtividade.has(c.id)) parados.push(c.nome)
      }
    }

    const stats = { total: consultores.length, ativos: ativos.length, concluidos: concluidos.length, parados }

    // WhatsApp
    const instancia = await getInstanciaGestorPorNome(g.nome, admin)
    const msg = `📊 *Relatório Semanal — ${g.nome}*\n\n` +
      `👥 Total: *${stats.total}* consultores\n` +
      `✅ Ativos: *${stats.ativos}*\n` +
      `🏆 Formados: *${stats.concluidos}*\n` +
      `😴 Parados (+7 dias): *${parados.length}*\n` +
      (parados.length > 0 ? `\n⚠️ Entre em contato:\n${parados.map(n => `• ${n}`).join('\n')}\n` : '') +
      `\n👉 Ver detalhes: ${await getAppUrl()}/gestor`
    await enviarWhatsApp(g.whatsapp, msg, instancia)

    // E-mail
    if (g.email) await enviarEmailRelatorio(g.email, g.nome, stats)

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

    const { data: configWpp } = await (admin.from('configuracoes') as any)
      .select('valor').eq('chave', 'whatsapp_admin').maybeSingle()
    if (configWpp?.valor) {
      const wppAdmin = JSON.parse(configWpp.valor)
      await enviarWhatsApp(wppAdmin,
        `📈 *Relatório Semanal — Plataforma AVP*\n\n` +
        `🆕 Novos esta semana: *${novosEstaSemana ?? 0}*\n` +
        `👥 Consultores ativos: *${totalAtivos ?? 0}*\n` +
        `🏆 Formados: *${totalConcluidos ?? 0}*\n` +
        `\n👉 ${await getAppUrl()}/admin`)
    }
  }

  return NextResponse.json({ ok: true, relatorios })
}
