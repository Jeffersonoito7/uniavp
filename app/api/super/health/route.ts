import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function isSuperAdmin(userId: string, admin: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await admin.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  if (!await isSuperAdmin(user.id, admin)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const agora = new Date()
  const ha30dias = new Date(agora.getTime() - 30 * 86400000).toISOString()
  const ha60dias = new Date(agora.getTime() - 60 * 86400000).toISOString()
  const ha4dias  = new Date(agora.getTime() -  4 * 86400000).toISOString()

  const [
    { count: totalAlunos },
    { count: alunosUltimos30 },
    { count: alunosPeriodoAnterior },
    { count: totalGestoresAtivos },
    { count: gestoresSuspensos },
    { count: totalAdmins },
    { count: totalTenantsAtivos },
    { data: adminsInstancia },
    { data: pagsPendentesAntigos },
    { data: cobrancasPendentes },
    { data: gestoresExpirando },
    { count: alunosNovosHoje },
  ] = await Promise.all([
    admin.from('alunos').select('id', { count: 'exact', head: true }),
    admin.from('alunos').select('id', { count: 'exact', head: true }).gte('created_at', ha30dias),
    admin.from('alunos').select('id', { count: 'exact', head: true }).gte('created_at', ha60dias).lt('created_at', ha30dias),
    admin.from('gestores').select('id', { count: 'exact', head: true }).eq('ativo', true).eq('status_assinatura', 'ativo'),
    admin.from('gestores').select('id', { count: 'exact', head: true }).eq('status_assinatura', 'suspenso'),
    admin.from('admins').select('id', { count: 'exact', head: true }).eq('ativo', true),
    admin.from('clientes').select('id', { count: 'exact', head: true }).eq('ativo', true),
    // Admins por tenant para detectar quais não têm instância WhatsApp
    admin.from('admins').select('tenant_id, whatsapp_instancia').eq('ativo', true),
    // PIX de gestores pendentes há mais de 4 dias (webhook provavelmente quebrado)
    admin.from('gestor_pagamentos').select('id, gestor_id, valor, created_at').eq('status', 'pendente').lt('created_at', ha4dias).limit(50),
    // Cobranças SaaS pendentes
    admin.from('cobrancas').select('id, cliente_id, vencimento').eq('status', 'pendente').limit(50),
    // Gestores que vencem nos próximos 7 dias (aviso antecipado de churn)
    admin.from('gestores').select('id, nome, tenant_id, plano_vencimento').eq('ativo', true).eq('status_assinatura', 'ativo')
      .lte('plano_vencimento', new Date(agora.getTime() + 7 * 86400000).toISOString())
      .gte('plano_vencimento', agora.toISOString()).limit(100),
    admin.from('alunos').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(agora.toDateString()).toISOString()),
  ])

  // ── Tenants sem instância WhatsApp ───────────────────────────────
  const porTenant = new Map<string, { comInstancia: number; total: number }>()
  for (const a of (adminsInstancia ?? [])) {
    const tid = a.tenant_id ?? '__global__'
    if (!porTenant.has(tid)) porTenant.set(tid, { comInstancia: 0, total: 0 })
    const entry = porTenant.get(tid)!
    entry.total++
    if (a.whatsapp_instancia) entry.comInstancia++
  }
  const tenantsSemInstancia = [...porTenant.values()].filter(e => e.comInstancia === 0).length

  // ── Estimativa de tempo dos crons ────────────────────────────────
  // Cada aluno = ~50ms de query + processamento no cron de inatividade
  const MS_POR_ALUNO = 50
  const LIMITE_VERCEL_MS = 60000
  const cronInativMs = (totalAlunos ?? 0) * MS_POR_ALUNO
  const cronInativPerc = Math.min(100, Math.round(cronInativMs / LIMITE_VERCEL_MS * 100))
  const cronRisco: 'ok' | 'aviso' | 'critico' =
    cronInativPerc >= 85 ? 'critico' : cronInativPerc >= 60 ? 'aviso' : 'ok'

  // ── Previsão de crescimento ──────────────────────────────────────
  const crescimento30 = (alunosPeriodoAnterior ?? 0) === 0 ? null
    : Math.round(((alunosUltimos30 ?? 0) - (alunosPeriodoAnterior ?? 0)) / (alunosPeriodoAnterior ?? 1) * 100)
  const crescDiario = (alunosUltimos30 ?? 0) / 30
  const alunosParaRisco = Math.floor(LIMITE_VERCEL_MS * 0.85 / MS_POR_ALUNO) // 85% do limite
  const diasAteRisco = crescDiario > 0
    ? Math.max(0, Math.round((alunosParaRisco - (totalAlunos ?? 0)) / crescDiario))
    : null

  // ── Gestores expirando por tenant ────────────────────────────────
  const expirandoPorTenant = new Map<string, number>()
  for (const g of (gestoresExpirando ?? [])) {
    const tid = g.tenant_id ?? '__global__'
    expirandoPorTenant.set(tid, (expirandoPorTenant.get(tid) ?? 0) + 1)
  }

  // ── Alertas ──────────────────────────────────────────────────────
  type NivelAlerta = 'critico' | 'aviso' | 'info'
  const alertas: { nivel: NivelAlerta; titulo: string; descricao: string; acao: string }[] = []

  if (cronRisco === 'critico') {
    alertas.push({
      nivel: 'critico',
      titulo: 'Crons vão estourar — ação imediata',
      descricao: `Cron de inatividade estimado em ${Math.round(cronInativMs / 1000)}s de ${Math.round(LIMITE_VERCEL_MS / 1000)}s permitidos (${cronInativPerc}%). Notificações vão parar de funcionar.`,
      acao: 'Refatorar crons para processar em batch (agrupar queries antes do loop)',
    })
  } else if (cronRisco === 'aviso') {
    alertas.push({
      nivel: 'aviso',
      titulo: 'Crons próximos do limite Vercel',
      descricao: `${cronInativPerc}% do limite utilizado. ${diasAteRisco != null ? `No ritmo atual, risco crítico em ~${diasAteRisco} dias.` : ''}`,
      acao: 'Planejar otimização dos crons em batch nas próximas semanas',
    })
  } else if (diasAteRisco != null && diasAteRisco < 90) {
    alertas.push({
      nivel: 'info',
      titulo: `Crons atingirão o limite em ~${diasAteRisco} dias`,
      descricao: `Com o crescimento atual de ${crescDiario.toFixed(1)} alunos/dia, os crons vão precisar de refatoração em ~${diasAteRisco} dias.`,
      acao: 'Agendar refatoração antes desse prazo',
    })
  }

  if (tenantsSemInstancia > 0) {
    alertas.push({
      nivel: 'aviso',
      titulo: `${tenantsSemInstancia} cliente(s) sem WhatsApp configurado`,
      descricao: 'Notificações desses clientes saem pelo número da Oito7 em vez do número deles.',
      acao: 'Criar instância no Evolution API e executar Onboarding novamente',
    })
  }

  if ((pagsPendentesAntigos ?? []).length > 0) {
    const total = Number((pagsPendentesAntigos ?? []).reduce((s: number, p: any) => s + Number(p.valor ?? 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    alertas.push({
      nivel: 'aviso',
      titulo: `${pagsPendentesAntigos!.length} PIX de gestores parado há +4 dias`,
      descricao: `Total represado: ${total}. O webhook do EFI pode estar quebrado ou os PIX foram abandonados.`,
      acao: 'Consultar cada TXID manualmente no EFI Bank e registrar o webhook novamente na aba Cobranças',
    })
  }

  if ((gestoresExpirando ?? []).length > 0) {
    alertas.push({
      nivel: 'info',
      titulo: `${gestoresExpirando!.length} painel(is) PRO vencem em 7 dias`,
      descricao: 'Esses gestores ainda não renovaram. Risco de churn se o PIX não for gerado.',
      acao: 'Verificar se cada um acessou a área de renovação. Contato proativo reduz cancelamento.',
    })
  }

  if (crescimento30 != null && crescimento30 > 40) {
    alertas.push({
      nivel: 'info',
      titulo: `Crescimento acelerado: +${crescimento30}% em 30 dias`,
      descricao: `${alunosUltimos30} novos alunos no último mês. Verifique os limites do plano Vercel e Supabase.`,
      acao: 'Confirmar limites de bandwidth, execuções de cron e conexões do banco de dados',
    })
  }

  return NextResponse.json({
    metricas: {
      totalAlunos: totalAlunos ?? 0,
      alunosUltimos30: alunosUltimos30 ?? 0,
      alunosNovosHoje: alunosNovosHoje ?? 0,
      crescimento30,
      crescDiario: Math.round(crescDiario * 10) / 10,
      totalGestoresAtivos: totalGestoresAtivos ?? 0,
      gestoresSuspensos: gestoresSuspensos ?? 0,
      totalAdmins: totalAdmins ?? 0,
      totalTenantsAtivos: totalTenantsAtivos ?? 0,
      tenantsSemInstancia,
      pagsPendentesAntigos: (pagsPendentesAntigos ?? []).length,
      cobrancasPendentes: (cobrancasPendentes ?? []).length,
      gestoresExpirando7dias: (gestoresExpirando ?? []).length,
    },
    previsao: {
      cronInativMs,
      cronInativPerc,
      cronRisco,
      diasAteRisco,
      alunosParaRisco,
    },
    alertas,
  })
}
