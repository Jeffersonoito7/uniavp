import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const aulaId = req.nextUrl.searchParams.get('aulaId')
  const alunoId = req.nextUrl.searchParams.get('alunoId')
  if (!aulaId) return NextResponse.json({ total: 0, curtido: false })

  const adminClient = createServiceRoleClient()
  const { count } = await (adminClient.from('aula_curtidas') as any)
    .select('*', { count: 'exact', head: true }).eq('aula_id', aulaId)

  let curtido = false
  if (alunoId) {
    const { data } = await (adminClient.from('aula_curtidas') as any)
      .select('id').eq('aula_id', aulaId).eq('aluno_id', alunoId).maybeSingle()
    curtido = !!data
  }
  return NextResponse.json({ total: count ?? 0, curtido })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { aulaId, alunoId } = await req.json()
  const adminClient = createServiceRoleClient()

  const { data: existente } = await (adminClient.from('aula_curtidas') as any)
    .select('id').eq('aula_id', aulaId).eq('aluno_id', alunoId).maybeSingle()

  if (existente) {
    await (adminClient.from('aula_curtidas') as any).delete().eq('id', existente.id)
  } else {
    await (adminClient.from('aula_curtidas') as any).insert({ aula_id: aulaId, aluno_id: alunoId })
  }

  const { count } = await (adminClient.from('aula_curtidas') as any)
    .select('*', { count: 'exact', head: true }).eq('aula_id', aulaId)

  return NextResponse.json({ curtido: !existente, total: count ?? 0 })
}
