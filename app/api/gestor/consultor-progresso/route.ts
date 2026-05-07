import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, whatsapp')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const alunoId = request.nextUrl.searchParams.get('alunoId')
  if (!alunoId) return NextResponse.json({ error: 'alunoId obrigatório' }, { status: 400 })

  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, gestor_whatsapp')
    .eq('id', alunoId)
    .maybeSingle()
  if (!aluno || aluno.gestor_whatsapp !== gestor.whatsapp) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: modulos } = await (adminClient.from('modulos') as any)
    .select('id, titulo, ordem')
    .eq('publicado', true)
    .order('ordem')

  const { data: progresso } = await (adminClient.from('progresso') as any)
    .select('aula_id')
    .eq('aluno_id', alunoId)
    .eq('aprovado', true)

  const aulasConcluidas = new Set((progresso ?? []).map((p: any) => p.aula_id))

  const result = []
  for (const modulo of (modulos ?? [])) {
    const { data: aulas } = await (adminClient.from('aulas') as any)
      .select('id')
      .eq('modulo_id', modulo.id)
      .eq('publicado', true)

    const aulasTotal = (aulas ?? []).length
    const aulasConcluidasModulo = (aulas ?? []).filter((a: any) => aulasConcluidas.has(a.id)).length
    const percentual = aulasTotal > 0 ? Math.round((aulasConcluidasModulo / aulasTotal) * 100) : 0

    result.push({
      titulo: modulo.titulo,
      ordem: modulo.ordem,
      aulas_total: aulasTotal,
      aulas_concluidas: aulasConcluidasModulo,
      percentual,
    })
  }

  return NextResponse.json({ modulos: result })
}
