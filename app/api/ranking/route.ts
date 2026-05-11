import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
// Revalida a cada 10 minutos para não sobrecarregar o banco
export const revalidate = 600

export async function GET() {
  const admin = createServiceRoleClient()

  // Busca os top 10 por pontos totais entre consultores ativos
  const { data: pontos } = await (admin.from('aluno_pontos') as any)
    .select('aluno_id, quantidade')
    .order('quantidade', { ascending: false })

  if (!pontos?.length) return NextResponse.json({ top: [] })

  // Agrupa por aluno
  const mapa: Record<string, number> = {}
  for (const p of pontos) {
    mapa[p.aluno_id] = (mapa[p.aluno_id] ?? 0) + p.quantidade
  }

  // Pega os top 10 IDs com mais pontos
  const top10ids = Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  if (!top10ids.length) return NextResponse.json({ top: [] })

  // Busca dados dos alunos
  const { data: alunos } = await (admin.from('alunos') as any)
    .select('id, nome, status')
    .in('id', top10ids)
    .neq('status', 'desligado')

  if (!alunos?.length) return NextResponse.json({ top: [] })

  // Monta o ranking com pontos
  const top = alunos
    .map((a: any) => ({ id: a.id, nome: a.nome, pontos: mapa[a.id] ?? 0 }))
    .sort((a: any, b: any) => b.pontos - a.pontos)
    .slice(0, 10)

  return NextResponse.json({ top })
}
