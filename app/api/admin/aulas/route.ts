import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const camposPermitidos = ['titulo', 'descricao', 'capa_url', 'youtube_video_id', 'video_url', 'duracao_minutos',
    'quiz_qtd_questoes', 'quiz_aprovacao_minima', 'quiz_tipo', 'espera_horas', 'publicado',
    'ao_vivo_link', 'ao_vivo_data', 'ao_vivo_plataforma', 'validade_meses', 'ordem',
    'bloquear_avancar', 'mostrar_link_externo', 'link_externo_titulo', 'bloquear_link_externo',
    'mostrar_links_app', 'bloquear_links_app']

  const atualizacoes = Object.fromEntries(
    camposPermitidos.filter(c => c in updates).map(c => [c, updates[c]])
  ) as Database['public']['Tables']['aulas']['Update']

  let updateQuery = adminClient.from('aulas')
    .update(atualizacoes)
    .eq('id', id)
  if (ctx.tenantId) updateQuery = updateQuery.eq('tenant_id', ctx.tenantId)
  const { data: aula, error } = await updateQuery.select('*').single()

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

  return NextResponse.json({ aula })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, quiz_tipo, quiz_sim_nao_pergunta, quiz_sim_nao_nao_mensagem, quiz_sim_nao_perguntas } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  let patchQuery = adminClient.from('aulas')
    .update({
      quiz_tipo,
      quiz_sim_nao_pergunta: quiz_sim_nao_pergunta ?? null,
      quiz_sim_nao_nao_mensagem: quiz_sim_nao_nao_mensagem ?? null,
      quiz_sim_nao_perguntas: quiz_sim_nao_perguntas ?? [],
    })
    .eq('id', id)
  if (ctx.tenantId) patchQuery = patchQuery.eq('tenant_id', ctx.tenantId)
  const { data: aula, error } = await patchQuery
    .select('quiz_tipo, quiz_sim_nao_pergunta, quiz_sim_nao_nao_mensagem, quiz_sim_nao_perguntas')
    .single()

  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })
  return NextResponse.json({ ok: true, aula })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  let deleteQuery = adminClient.from('aulas').delete().eq('id', id)
  if (ctx.tenantId) deleteQuery = deleteQuery.eq('tenant_id', ctx.tenantId)
  const { error } = await deleteQuery
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 400 })

  return NextResponse.json({ ok: true })
}
