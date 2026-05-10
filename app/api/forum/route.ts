import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get('tipo')
  const adminClient = createServiceRoleClient()

  if (tipo === 'topicos') {
    const { data } = await (adminClient.from('forum_topicos') as any)
      .select('*, aluno:alunos(nome), respostas:forum_respostas(count)')
      .order('fixado', { ascending: false })
      .order('created_at', { ascending: false })
    return NextResponse.json({ topicos: data ?? [] })
  }

  if (tipo === 'respostas') {
    const topicoId = req.nextUrl.searchParams.get('topico_id')
    if (!topicoId) return NextResponse.json({ error: 'topico_id obrigatório' }, { status: 400 })
    const { data } = await (adminClient.from('forum_respostas') as any)
      .select('*, aluno:alunos(nome)')
      .eq('topico_id', topicoId)
      .order('created_at')
    return NextResponse.json({ respostas: data ?? [] })
  }

  return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const body = await req.json()

  if (body.tipo === 'topico') {
    const { titulo, descricao } = body
    if (!titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
    const { data: topico } = await (adminClient.from('forum_topicos') as any)
      .insert({ titulo: titulo.trim(), descricao: descricao?.trim() ?? null, aluno_id: aluno.id })
      .select('*')
      .single()
    return NextResponse.json({ topico })
  }

  if (body.tipo === 'resposta') {
    const { topico_id, texto } = body
    if (!topico_id || !texto?.trim()) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    const { data: resposta } = await (adminClient.from('forum_respostas') as any)
      .insert({ topico_id, aluno_id: aluno.id, texto: texto.trim() })
      .select('*, aluno:alunos(nome)')
      .single()
    return NextResponse.json({ resposta })
  }

  return NextResponse.json({ error: 'tipo inválido' }, { status: 400 })
}
