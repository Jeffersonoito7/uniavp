import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function verificarAdmin(user: { id: string }, adminClient: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data } = await (adminClient.from('artes_templates') as any)
    .select('*').order('created_at')

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  // Suporte a criação em lote (array) ou individual (objeto)
  const itens = Array.isArray(body) ? body : [body]
  const criados = []

  for (const item of itens) {
    const { data, error } = await (adminClient.from('artes_templates') as any)
      .insert({
        tipo: item.tipo || 'custom',
        titulo: item.titulo || 'Novo Template',
        arte_url: item.arte_url || '',
        foto_x: item.foto_x ?? 10,
        foto_y: item.foto_y ?? 10,
        foto_largura: item.foto_largura ?? 30,
        foto_altura: item.foto_altura ?? 30,
        foto_redondo: item.foto_redondo ?? false,
        ativo: item.ativo ?? true,
        formato: item.formato || 'feed',
      })
      .select()
      .single()
    if (!error && data) criados.push(data)
  }

  return NextResponse.json(criados.length === 1 ? criados[0] : criados)
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body: { id: string; titulo: string; tipo: string; arte_url: string; foto_x: number; foto_y: number; foto_largura: number; foto_altura: number; foto_redondo: boolean; ativo: boolean }[] = await req.json()

  for (const t of body) {
    if (!t.id) continue
    await (adminClient.from('artes_templates') as any)
      .update({ titulo: t.titulo, tipo: t.tipo, arte_url: t.arte_url, foto_x: t.foto_x, foto_y: t.foto_y, foto_largura: t.foto_largura, foto_altura: t.foto_altura, foto_redondo: t.foto_redondo, ativo: t.ativo })
      .eq('id', t.id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  await (adminClient.from('artes_templates') as any).delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
