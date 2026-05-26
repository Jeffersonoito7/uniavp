import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()

  const { data: gestor } = await adminClient.from('gestores')
    .select('id, whatsapp')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const alunoId = request.nextUrl.searchParams.get('alunoId')
  if (!alunoId) return NextResponse.json({ error: 'alunoId obrigatório' }, { status: 400 })

  const { data: aluno } = await adminClient.from('alunos')
    .select('id, gestor_whatsapp')
    .eq('id', alunoId)
    .maybeSingle()
  if (!aluno || aluno.gestor_whatsapp !== gestor.whatsapp) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: modulos } = await adminClient.from('modulos')
    .select('id, titulo, ordem')
    .eq('publicado', true)
    .order('ordem')

  const { data: progresso } = await adminClient.from('progresso')
    .select('aula_id')
    .eq('aluno_id', alunoId)
    .eq('aprovado', true)

  const aulasConcluidas = new Set((progresso ?? []).map((p: any) => p.aula_id))

  const moduloIds = (modulos ?? []).map((m: any) => m.id)
  const { data: todasAulas } = moduloIds.length > 0
    ? await adminClient.from('aulas').select('id, modulo_id').in('modulo_id', moduloIds).eq('publicado', true)
    : { data: [] as { id: string; modulo_id: string }[] }

  const aulasPorModulo = new Map<string, string[]>()
  for (const a of (todasAulas ?? [])) {
    const lista = aulasPorModulo.get(a.modulo_id) ?? []
    lista.push(a.id)
    aulasPorModulo.set(a.modulo_id, lista)
  }

  const result = (modulos ?? []).map((modulo: any) => {
    const ids = aulasPorModulo.get(modulo.id) ?? []
    const aulasConcluidasModulo = ids.filter(id => aulasConcluidas.has(id)).length
    const percentual = ids.length > 0 ? Math.round((aulasConcluidasModulo / ids.length) * 100) : 0
    return { titulo: modulo.titulo, ordem: modulo.ordem, aulas_total: ids.length, aulas_concluidas: aulasConcluidasModulo, percentual }
  })

  return NextResponse.json({ modulos: result })
}
