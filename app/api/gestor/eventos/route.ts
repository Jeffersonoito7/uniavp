import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

async function getGestor(user: { id: string }, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('gestores') as any)
    .select('id, nome, whatsapp').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return data
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })
  const adminClient = createServiceRoleClient()
  const gestor = await getGestor(user, adminClient)
  if (!gestor) return NextResponse.json([], { status: 403 })
  const { data } = await (adminClient.from('eventos') as any)
    .select('*').order('data_hora', { ascending: true })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  const gestor = await getGestor(user, adminClient)
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { titulo, descricao, cidade, data_hora, notificar } = await req.json()
  const { data: evento, error } = await (adminClient.from('eventos') as any)
    .insert({ titulo, descricao: descricao || '', cidade: cidade || '', data_hora })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (notificar) {
    const { data: consultores } = await (adminClient.from('alunos') as any)
      .select('whatsapp, nome').eq('gestor_nome', gestor.nome).eq('status', 'ativo')
    const dataFormatada = new Date(data_hora).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza'
    })
    const msg = `🗓️ *Novo Evento!*\n\n*${titulo}*\n📍 ${cidade || 'A definir'}\n📅 ${dataFormatada}${descricao ? `\n\n${descricao}` : ''}\n\n_Mensagem do seu gestor ${gestor.nome}_`
    for (const c of consultores ?? []) {
      if (c.whatsapp) await enviarWhatsApp(c.whatsapp, msg)
    }
  }

  return NextResponse.json(evento)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  const gestor = await getGestor(user, adminClient)
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { id } = await req.json()
  // TODO: A tabela 'eventos' não possui campo gestor_id ainda. Quando houver,
  // adicionar .eq('gestor_id', gestor.id) para garantir que apenas o dono possa excluir.
  await (adminClient.from('eventos') as any).delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
