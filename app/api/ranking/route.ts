import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()

  // Descobre o tenant do usuario logado (aluno ou gestor)
  const [{ data: alunoRow }, { data: gestorRow }] = await Promise.all([
    admin.from('alunos').select('tenant_id').eq('user_id', user.id).maybeSingle(),
    admin.from('gestores').select('tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  const tenantId = (alunoRow as any)?.tenant_id ?? (gestorRow as any)?.tenant_id ?? null

  // Busca IDs dos alunos do mesmo tenant para filtrar pontos
  let alunoIdsQuery = admin.from('alunos').select('id')
  if (tenantId) alunoIdsQuery = (alunoIdsQuery as any).eq('tenant_id', tenantId)
  const { data: alunoIds } = await alunoIdsQuery
  const idSet = new Set((alunoIds ?? []).map((a: any) => a.id as string))

  if (!idSet.size) return NextResponse.json({ top: [] })

  // Busca pontos apenas dos alunos do tenant
  const { data: pontos } = await admin.from('aluno_pontos')
    .select('aluno_id, quantidade')
    .in('aluno_id', [...idSet])
    .order('quantidade', { ascending: false })

  if (!pontos?.length) return NextResponse.json({ top: [] })

  // Agrupa por aluno
  const mapa: Record<string, number> = {}
  for (const p of pontos) {
    mapa[p.aluno_id] = (mapa[p.aluno_id] ?? 0) + p.quantidade
  }

  const top10ids = Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  if (!top10ids.length) return NextResponse.json({ top: [] })

  const { data: alunos } = await admin.from('alunos')
    .select('id, nome, status')
    .in('id', top10ids)
    .neq('status', 'desligado')

  if (!alunos?.length) return NextResponse.json({ top: [] })

  const top = alunos
    .map((a: any) => ({ id: a.id, nome: a.nome, pontos: mapa[a.id] ?? 0 }))
    .sort((a: any, b: any) => b.pontos - a.pontos)
    .slice(0, 10)

  return NextResponse.json({ top })
}
