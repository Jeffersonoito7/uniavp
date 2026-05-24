import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { titulo, descricao, cidade, data_hora, notificar, imagem_url } = body

  const { data: evento, error } = await adminClient.from('eventos')
    .insert({ titulo, descricao: descricao || '', cidade: cidade || '', data_hora, imagem_url: imagem_url || '' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (notificar) {
    let q = adminClient.from('alunos').select('whatsapp, nome').eq('status', 'ativo')
    if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
    const { data: alunos } = await q

    const dataFormatada = new Date(data_hora).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza'
    })

    let configQ = adminClient.from('configuracoes').select('valor').eq('chave', 'site_nome')
    if (ctx.tenantId) configQ = configQ.eq('tenant_id', ctx.tenantId)
    const { data: configNome } = await configQ.maybeSingle()
    const nomeEvento = configNome?.valor ? JSON.parse(String(configNome.valor)) : 'Novo Evento'
    const msg = `🗓️ *${nomeEvento} — Novo Evento!*\n\n*${titulo}*\n📍 ${cidade || 'A definir'}\n📅 ${dataFormatada}${descricao ? `\n\n${descricao}` : ''}`

    const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)
    for (const aluno of alunos ?? []) {
      if (aluno.whatsapp) await enviarWhatsApp(aluno.whatsapp, msg, instancia)
    }
  }

  return NextResponse.json(evento)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await adminClient.from('eventos').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
