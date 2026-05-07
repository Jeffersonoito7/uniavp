import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

async function verificarAdmin(adminClient: ReturnType<typeof createServiceRoleClient>, userId: string) {
  const { data } = await (adminClient.from('admins') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle()
  return !!data
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const camposPermitidos = ['titulo', 'descricao', 'youtube_video_id', 'duracao_minutos', 'quiz_qtd_questoes',
    'quiz_aprovacao_minima', 'espera_horas', 'publicado', 'ao_vivo_link', 'ao_vivo_data',
    'ao_vivo_plataforma', 'validade_meses', 'ordem']

  const atualizacoes: Record<string, unknown> = {}
  for (const campo of camposPermitidos) {
    if (campo in updates) atualizacoes[campo] = updates[campo]
  }

  const { data: aula, error } = await (adminClient.from('aulas') as any)
    .update(atualizacoes)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ aula })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const isAdmin = await verificarAdmin(adminClient, user.id)
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await (adminClient.from('aulas') as any).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
