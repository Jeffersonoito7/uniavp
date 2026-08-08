import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const tid = ctx.tenantId
  const tq = (q: any) => (tid ? q.eq('tenant_id', tid) : q)

  // 1. Busca todos os alunos
  const { data: alunos } = await tq(
    adminClient.from('alunos').select('id, nome, whatsapp, email, status, created_at, data_formacao, numero_registro')
  )
  if (!alunos?.length) {
    return new NextResponse('Sem dados para exportar.', { status: 204 })
  }

  const ids = alunos.map((a: any) => a.id as string)

  // 2. Aulas obrigatorias publicadas
  let aulasQ = (adminClient.from('aulas') as any)
    .select('id, titulo, modulo:modulos!inner(titulo, perfis_permitidos, publicado)')
    .eq('publicado', true)
    .eq('modulos.publicado', true)
  if (tid) aulasQ = aulasQ.eq('tenant_id', tid)
  const { data: todasAulasRaw } = await aulasQ
  const aulasObrig = (todasAulasRaw ?? []).filter((a: any) => {
    const perfis = a.modulo?.perfis_permitidos ?? []
    return Array.isArray(perfis) && perfis.includes('consultor')
  })
  const totalAulas = aulasObrig.length
  const idsAulas = aulasObrig.map((a: any) => a.id as string)

  // 3. Progresso por aluno em batches de 100
  const progressoPorAluno: Record<string, number> = {}
  const CHUNK = 100
  if (ids.length > 0 && idsAulas.length > 0) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { data: prog } = await adminClient.from('progresso')
        .select('aluno_id')
        .eq('aprovado', true)
        .in('aluno_id', ids.slice(i, i + CHUNK))
        .in('aula_id', idsAulas)
      for (const p of prog ?? []) {
        progressoPorAluno[p.aluno_id] = (progressoPorAluno[p.aluno_id] ?? 0) + 1
      }
    }
  }

  // 4. Pontos por aluno
  const pontosPorAluno: Record<string, number> = {}
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data: pts } = await (adminClient.from('aluno_pontos') as any)
      .select('aluno_id, quantidade')
      .in('aluno_id', ids.slice(i, i + CHUNK))
    for (const p of pts ?? []) {
      pontosPorAluno[p.aluno_id] = (pontosPorAluno[p.aluno_id] ?? 0) + (p.quantidade ?? 0)
    }
  }

  // 5. PRO: alunos que sao gestores ativos
  const gestoресIds = new Set<string>()
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK)
    const emailsChunk = alunos.slice(i, i + CHUNK).map((a: any) => a.email).filter(Boolean)
    if (emailsChunk.length === 0) continue
    let gq = adminClient.from('gestores').select('email').eq('ativo', true).in('email', emailsChunk)
    if (tid) gq = gq.eq('tenant_id', tid)
    const { data: gestores } = await gq
    const emailsGestor = new Set((gestores ?? []).map((g: any) => g.email))
    for (const a of alunos.slice(i, i + CHUNK)) {
      if (a.email && emailsGestor.has(a.email)) gestoресIds.add(a.id)
    }
  }

  // 6. Monta CSV
  const SEPARADOR = ';'
  const cabecalho = [
    'Nome', 'WhatsApp', 'Email', 'Status', 'Plano',
    'Aulas Concluidas', 'Total Aulas', 'Progresso (%)',
    'Pontos', 'Certificado', 'Data Cadastro', 'Data Formacao',
  ].join(SEPARADOR)

  const linhas = alunos.map((a: any) => {
    const concluidas = progressoPorAluno[a.id] ?? 0
    const pct = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0
    const plano = gestoресIds.has(a.id) ? 'PRO' : 'Free'
    const certificado = a.numero_registro ? 'Sim' : 'Nao'
    const cadastro = a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : ''
    const formacao = a.data_formacao ? new Date(a.data_formacao).toLocaleDateString('pt-BR') : ''
    const statusLabel: Record<string, string> = { ativo: 'Ativo', inativo: 'Inativo', concluido: 'Concluido', bloqueado: 'Bloqueado' }

    return [
      csv(a.nome ?? ''),
      csv(a.whatsapp ?? ''),
      csv(a.email ?? ''),
      csv(statusLabel[a.status] ?? a.status ?? ''),
      plano,
      concluidas,
      totalAulas,
      `${pct}%`,
      pontosPorAluno[a.id] ?? 0,
      certificado,
      cadastro,
      formacao,
    ].join(SEPARADOR)
  })

  const csvContent = '﻿' + [cabecalho, ...linhas].join('\n') // BOM para Excel abrir com acentos

  const agora = new Date().toISOString().slice(0, 10)
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="relatorio-alunos-${agora}.csv"`,
    },
  })
}

function csv(valor: string): string {
  if (valor.includes(';') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}
