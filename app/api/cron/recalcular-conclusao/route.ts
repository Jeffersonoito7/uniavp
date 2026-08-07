import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Roda a cada 6 horas — recalcula conclusao de alunos que completaram a trilha
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  // Busca todas as aulas obrigatorias (modulos com perfil consultor, publicados) — sem filtro de tenant
  const { data: todasAulasRaw } = await (admin.from('aulas') as any)
    .select('id, tenant_id, modulo:modulos!inner(perfis_permitidos, publicado)')
    .eq('publicado', true)
    .eq('modulos.publicado', true)

  const todasAulas = (todasAulasRaw ?? []).filter((a: any) => {
    const perfis: string[] | null = a.modulo?.perfis_permitidos ?? null
    return Array.isArray(perfis) && perfis.includes('consultor')
  })

  if (todasAulas.length === 0) {
    return NextResponse.json({ ok: true, atualizados: 0, total: 0 })
  }

  const todosIds = todasAulas.map((a: any) => a.id)

  // Busca todos os alunos nao concluidos (todos os tenants)
  const { data: alunos } = await admin
    .from('alunos')
    .select('id, tenant_id, numero_registro, status')
    .neq('status', 'concluido')

  let atualizados = 0
  for (const al of alunos ?? []) {
    const { data: aprovRows } = await admin.from('progresso')
      .select('aula_id')
      .eq('aluno_id', al.id)
      .eq('aprovado', true)
      .in('aula_id', todosIds)
    const aprovados = new Set((aprovRows ?? []).map((p: any) => p.aula_id)).size
    if (aprovados < todosIds.length) continue

    let proximoNumero = al.numero_registro
    if (!proximoNumero) {
      const { data: seq } = await admin.rpc('gerar_numero_registro_aluno' as any)
      proximoNumero = seq as number
    }
    await admin.from('alunos')
      .update({ status: 'concluido', data_formacao: new Date().toISOString().split('T')[0], numero_registro: proximoNumero })
      .eq('id', al.id)
      .neq('status', 'concluido')
    atualizados++
  }

  return NextResponse.json({ ok: true, atualizados, total: alunos?.length ?? 0 })
}
