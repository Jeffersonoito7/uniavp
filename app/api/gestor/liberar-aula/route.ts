import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, nome').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { progresso_id, espera_horas } = await req.json()
  if (!progresso_id) return NextResponse.json({ error: 'progresso_id obrigatório' }, { status: 400 })

  const horas = espera_horas ?? 0
  const liberada_em = new Date(Date.now() + horas * 3600000).toISOString()

  const { data, error } = await (adminClient.from('progresso') as any)
    .update({ pendente_liberacao: false, proxima_aula_liberada_em: liberada_em })
    .eq('id', progresso_id)
    .select('aluno_id, aula_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, liberada_em })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Busca consultores do gestor com liberações pendentes
  const { data: alunos } = await (adminClient.from('alunos') as any)
    .select('id').eq('gestor_id', gestor.id).eq('status', 'ativo')

  if (!alunos || alunos.length === 0) return NextResponse.json({ pendentes: [] })

  const alunoIds = alunos.map((a: { id: string }) => a.id)

  const { data: pendentes } = await (adminClient.from('progresso') as any)
    .select('id, aluno_id, aula_id, percentual, created_at, aluno:alunos(nome, whatsapp), aula:aulas(titulo, quiz_aprovacao_minima)')
    .eq('pendente_liberacao', true)
    .eq('aprovado', true)
    .in('aluno_id', alunoIds)
    .order('created_at', { ascending: false })

  return NextResponse.json({ pendentes: pendentes ?? [] })
}
