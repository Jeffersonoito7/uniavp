import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { gestor_id, indicador_whatsapp } = await req.json()

  if (!gestor_id) return NextResponse.json({ error: 'gestor_id obrigatório' }, { status: 400 })

  const { data: gestor } = await adminClient.from('gestores')
    .select('id, user_id, whatsapp, tenant_id, indicado_por_gestor_id')
    .eq('id', gestor_id)
    .maybeSingle()

  if (!gestor || gestor.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (gestor.indicado_por_gestor_id) {
    return NextResponse.json({ error: 'Indicador já registrado e não pode ser alterado.' }, { status: 400 })
  }

  const wpp = String(indicador_whatsapp).replace(/\D/g, '')

  if (wpp === gestor.whatsapp.replace(/\D/g, '')) {
    return NextResponse.json({ error: 'Você não pode se indicar.' }, { status: 400 })
  }

  let query = adminClient.from('gestores').select('id, nome').eq('whatsapp', wpp).eq('ativo', true)
  if (gestor.tenant_id) query = query.eq('tenant_id', gestor.tenant_id)
  const { data: indicador } = await query.maybeSingle()

  if (!indicador) {
    return NextResponse.json({ error: 'Não encontramos nenhum PRO cadastrado com esse WhatsApp.' }, { status: 404 })
  }

  const { error } = await adminClient.from('gestores')
    .update({ indicado_por_gestor_id: indicador.id })
    .eq('id', gestor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, indicador: { nome: indicador.nome, whatsapp: wpp } })
}
