import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

async function getAdmin(user: { id: string }, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])
  const adminClient = createServiceRoleClient()
  const { data } = await (adminClient.from('noticias') as any).select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await getAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await (adminClient.from('noticias') as any)
    .insert({ titulo: body.titulo, conteudo: body.conteudo || '', imagem_url: body.imagem_url || '', publicado: true })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await getAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, publicado } = await req.json()
  await (adminClient.from('noticias') as any).update({ publicado }).eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  if (!await getAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await (adminClient.from('noticias') as any).delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
