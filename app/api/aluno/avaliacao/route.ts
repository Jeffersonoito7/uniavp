import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const { aula_id, estrelas, sugestao } = await req.json()
  if (!aula_id || !estrelas) return NextResponse.json({ error: 'aula_id e estrelas são obrigatórios' }, { status: 400 })

  const { data, error } = await (adminClient.from('aula_avaliacoes') as any)
    .upsert({ aluno_id: aluno.id, aula_id, estrelas, sugestao: sugestao || null }, { onConflict: 'aluno_id,aula_id' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, avaliacao: data })
}

export async function GET(req: NextRequest) {
  const aula_id = req.nextUrl.searchParams.get('aula_id')
  if (!aula_id) return NextResponse.json({ estrelas: null, sugestao: null })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ estrelas: null, sugestao: null })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ estrelas: null, sugestao: null })

  const { data } = await (adminClient.from('aula_avaliacoes') as any)
    .select('estrelas, sugestao').eq('aluno_id', aluno.id).eq('aula_id', aula_id).maybeSingle()

  return NextResponse.json({ estrelas: data?.estrelas ?? null, sugestao: data?.sugestao ?? null })
}
