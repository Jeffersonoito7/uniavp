import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

async function verificarAdmin(user: { id: string }, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { titulo, descricao, cidade, data_hora, notificar } = body

  const { data: evento, error } = await (adminClient.from('eventos') as any)
    .insert({ titulo, descricao: descricao || '', cidade: cidade || '', data_hora })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (notificar) {
    const { data: alunos } = await (adminClient.from('alunos') as any)
      .select('whatsapp, nome').eq('status', 'ativo')

    const dataFormatada = new Date(data_hora).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Fortaleza'
    })

    const msg = `🗓️ *Novo Evento Uni AVP!*\n\n*${titulo}*\n📍 ${cidade || 'A definir'}\n📅 ${dataFormatada}${descricao ? `\n\n${descricao}` : ''}`

    for (const aluno of alunos ?? []) {
      if (aluno.whatsapp) await enviarWhatsApp(aluno.whatsapp, msg)
    }
  }

  return NextResponse.json(evento)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await (adminClient.from('eventos') as any).delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
