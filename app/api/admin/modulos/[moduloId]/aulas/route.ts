import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { moduloId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  const { data: ultima } = await (adminClient.from('aulas') as any)
    .select('ordem')
    .eq('modulo_id', params.moduloId)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordem = (ultima?.ordem ?? 0) + 1

  const { data: aula, error } = await (adminClient.from('aulas') as any)
    .insert({
      modulo_id: params.moduloId,
      ordem,
      titulo: body.titulo,
      youtube_video_id: body.youtube_video_id,
      duracao_minutos: body.duracao_minutos ?? null,
      quiz_qtd_questoes: body.quiz_qtd_questoes ?? 5,
      quiz_aprovacao_minima: body.quiz_aprovacao_minima ?? 80,
      espera_horas: body.espera_horas ?? 24,
      ao_vivo_link: body.ao_vivo_link ?? null,
      ao_vivo_data: body.ao_vivo_data ?? null,
      ao_vivo_plataforma: body.ao_vivo_plataforma ?? null,
      validade_meses: body.validade_meses ?? null,
      capa_url: body.capa_url ?? null,
      video_url: body.video_url ?? null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ aula })
}

export async function PUT(req: NextRequest, { params }: { params: { moduloId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const camposPermitidos = ['titulo', 'descricao', 'capa_url', 'youtube_video_id', 'video_url', 'duracao_minutos', 'quiz_qtd_questoes',
    'quiz_aprovacao_minima', 'espera_horas', 'publicado', 'ao_vivo_link', 'ao_vivo_data',
    'ao_vivo_plataforma', 'validade_meses', 'ordem', 'liberacao_modo']

  const atualizacoes: Record<string, unknown> = {}
  for (const campo of camposPermitidos) {
    if (campo in updates) atualizacoes[campo] = updates[campo]
  }

  const { data: aula, error } = await (adminClient.from('aulas') as any)
    .update(atualizacoes)
    .eq('id', id)
    .eq('modulo_id', params.moduloId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ aula })
}
