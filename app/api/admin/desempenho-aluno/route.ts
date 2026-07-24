import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

// GET /api/admin/desempenho-aluno?aluno_id=xxx
// Retorna histórico de quizzes do aluno com notas por aula/módulo
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const aluno_id = req.nextUrl.searchParams.get('aluno_id')
  if (!aluno_id) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  // Verifica que o aluno pertence ao tenant do admin
  let alunoQ = adminClient.from('alunos').select('id, nome, status').eq('id', aluno_id)
  if (ctx.tenantId) alunoQ = alunoQ.eq('tenant_id', ctx.tenantId)
  const { data: aluno } = await alunoQ.maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  // Busca todos os registros de progresso com nota e informações da aula
  const { data: progressos } = await adminClient.from('progresso')
    .select('id, aula_id, aprovado, percentual, created_at, aula:aulas(titulo, quiz_aprovacao_minima, modulo:modulos(titulo, ordem))')
    .eq('aluno_id', aluno_id)
    .order('created_at', { ascending: true })

  const itens = (progressos ?? []).map((p: any) => ({
    aula_id: p.aula_id,
    aula_titulo: p.aula?.titulo ?? p.aula_id,
    modulo_titulo: p.aula?.modulo?.titulo ?? null,
    modulo_ordem: p.aula?.modulo?.ordem ?? 0,
    nota: p.percentual ?? 0,
    aprovacao_minima: p.aula?.quiz_aprovacao_minima ?? 70,
    aprovado: p.aprovado,
    data: p.created_at,
  }))

  // Apenas a melhor tentativa por aula (aprovado se houver, senão a mais recente)
  const melhorPorAula: Record<string, typeof itens[0]> = {}
  for (const item of itens) {
    const atual = melhorPorAula[item.aula_id]
    if (!atual || item.aprovado || item.nota > atual.nota) {
      melhorPorAula[item.aula_id] = item
    }
  }

  const aulasMelhor = Object.values(melhorPorAula)
  const totalAulas = aulasMelhor.length
  const aprovadas = aulasMelhor.filter(a => a.aprovado).length
  const mediaNota = totalAulas > 0
    ? Math.round(aulasMelhor.reduce((s, a) => s + a.nota, 0) / totalAulas)
    : 0

  // Agrupa por módulo
  const porModulo: Record<string, { modulo: string; ordem: number; aulas: typeof itens }> = {}
  for (const a of aulasMelhor) {
    const key = a.modulo_titulo ?? 'Sem módulo'
    if (!porModulo[key]) porModulo[key] = { modulo: key, ordem: a.modulo_ordem, aulas: [] }
    porModulo[key].aulas.push(a)
  }
  const modulos = Object.values(porModulo).sort((a, b) => a.ordem - b.ordem)

  return NextResponse.json({
    aluno: { id: aluno.id, nome: aluno.nome, status: aluno.status },
    resumo: { totalAulas, aprovadas, mediaNota, tentativas: itens.length },
    modulos,
  })
}
