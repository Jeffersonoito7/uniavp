import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, nome, whatsapp').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: consultores } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, status, created_at, streak_atual, maior_streak, ultimo_estudo_em')
    .eq('gestor_whatsapp', gestor.whatsapp)
    .order('nome')

  const { count: totalAulas } = await (adminClient.from('aulas') as any)
    .select('*', { count: 'exact', head: true }).eq('publicado', true)

  const { data: progresso } = await (adminClient.from('progresso') as any)
    .select('aluno_id, aula_id')
    .in('aluno_id', (consultores ?? []).map((c: any) => c.id))
    .eq('aprovado', true)

  const { data: pontos } = await (adminClient.from('aluno_pontos') as any)
    .select('aluno_id, quantidade')
    .in('aluno_id', (consultores ?? []).map((c: any) => c.id))

  // Mapas de progresso e pontos
  const progMap: Record<string, Set<string>> = {}
  for (const p of progresso ?? []) {
    if (!progMap[p.aluno_id]) progMap[p.aluno_id] = new Set()
    progMap[p.aluno_id].add(p.aula_id)
  }
  const pontosMap: Record<string, number> = {}
  for (const p of pontos ?? []) {
    pontosMap[p.aluno_id] = (pontosMap[p.aluno_id] || 0) + p.quantidade
  }

  const statusLabel: Record<string, string> = {
    ativo: 'Ativo',
    concluido: 'Formado',
    pausado: 'Pausado',
    desligado: 'Desligado',
  }

  const rows = (consultores ?? []).map((c: any) => {
    const aulasFeitas = progMap[c.id]?.size ?? 0
    const pct = totalAulas ? Math.round((aulasFeitas / totalAulas) * 100) : 0
    return {
      'Nome': c.nome,
      'WhatsApp': c.whatsapp,
      'E-mail': c.email || '',
      'Status': statusLabel[c.status] || c.status,
      'Aulas concluídas': aulasFeitas,
      'Total de aulas': totalAulas ?? 0,
      'Progresso (%)': pct,
      'Pontos': pontosMap[c.id] ?? 0,
      'Streak atual (dias)': c.streak_atual ?? 0,
      'Maior streak (dias)': c.maior_streak ?? 0,
      'Último estudo': c.ultimo_estudo_em || '',
      'Cadastro': new Date(c.created_at).toLocaleDateString('pt-BR'),
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Largura das colunas
  ws['!cols'] = [
    { wch: 30 }, { wch: 16 }, { wch: 28 }, { wch: 12 },
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Consultores')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const agora = new Date().toISOString().split('T')[0]
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="equipe-${agora}.xlsx"`,
    },
  })
}
