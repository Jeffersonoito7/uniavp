import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tid = adminRecord.tenant_id as string | null

  // Busca todas as aulas obrigatorias (modulos com perfil consultor, publicados)
  let todasAulasQ = (adminClient.from('aulas') as any)
    .select('id, tenant_id, modulo:modulos!inner(perfis_permitidos, publicado)')
    .eq('publicado', true)
    .eq('modulos.publicado', true)
  if (tid) todasAulasQ = todasAulasQ.eq('tenant_id', tid)
  const { data: todasAulasRaw } = await todasAulasQ
  const todasAulas = (todasAulasRaw ?? []).filter((a: any) => {
    const perfis: string[] | null = a.modulo?.perfis_permitidos ?? null
    return Array.isArray(perfis) && perfis.includes('consultor')
  })

  if (todasAulas.length === 0) {
    return NextResponse.json({ ok: true, atualizados: 0, msg: 'Nenhuma aula obrigatória encontrada.' })
  }

  const todosIds = todasAulas.map((a: any) => a.id)

  // Busca alunos ativos (nao concluidos ainda)
  let alunosQ = adminClient.from('alunos').select('id, tenant_id, numero_registro, status').neq('status', 'concluido')
  if (tid) alunosQ = alunosQ.eq('tenant_id', tid)
  const { data: alunos } = await alunosQ

  let atualizados = 0
  for (const al of alunos ?? []) {
    const { data: aprovRows } = await adminClient.from('progresso')
      .select('aula_id')
      .eq('aluno_id', al.id)
      .eq('aprovado', true)
      .in('aula_id', todosIds)
    const aprovados = new Set((aprovRows ?? []).map((p: any) => p.aula_id)).size
    if (aprovados < todosIds.length) continue

    // Aluno completou toda a trilha mas nao tem status concluido
    let proximoNumero = al.numero_registro
    if (!proximoNumero) {
      const { data: seq } = await adminClient.rpc('gerar_numero_registro_aluno' as any)
      proximoNumero = seq as number
    }
    await adminClient.from('alunos')
      .update({ status: 'concluido', data_formacao: new Date().toISOString().split('T')[0], numero_registro: proximoNumero })
      .eq('id', al.id)
      .neq('status', 'concluido')
    atualizados++
  }

  return NextResponse.json({ ok: true, atualizados, total: alunos?.length ?? 0 })
}
