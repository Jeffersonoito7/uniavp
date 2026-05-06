import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const aulaId = req.nextUrl.searchParams.get('aula_id')
  if (!aulaId) return NextResponse.json({ error: 'aula_id obrigatório' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const { data: comentarios } = await (adminClient.from('comentarios') as any)
    .select('id, texto, parent_id, created_at, aluno:alunos(nome)')
    .eq('aula_id', aulaId)
    .order('created_at')

  return NextResponse.json({ comentarios: comentarios ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any).select('id').eq('user_id', user.id).maybeSingle()
  if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })

  const { aula_id, texto, parent_id } = await req.json()
  if (!aula_id || !texto?.trim()) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { data: comentario } = await (adminClient.from('comentarios') as any)
    .insert({ aula_id, aluno_id: aluno.id, texto: texto.trim(), parent_id: parent_id ?? null })
    .select('id, texto, parent_id, created_at, aluno:alunos(nome)')
    .single()

  return NextResponse.json({ comentario })
}
