import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getGestor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, whatsapp').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  return gestor ? { gestor, adminClient } : null
}

export async function GET() {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json([], { status: 401 })
  const { gestor, adminClient } = ctx

  const { data } = await (adminClient.from('artes_templates') as any)
    .select('*')
    .order('created_at')

  const filtrado = (data ?? []).filter((t: any) => !t.gestor_id || t.gestor_id === gestor.id)
  return NextResponse.json(filtrado)
}

export async function POST(req: NextRequest) {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { gestor, adminClient } = ctx

  const body = await req.json()
  const { data, error } = await (adminClient.from('artes_templates') as any)
    .insert({
      gestor_id: gestor.id,
      tipo: body.tipo || 'custom',
      titulo: body.titulo || 'Novo Template',
      arte_url: body.arte_url || '',
      foto_x: body.foto_x ?? 10,
      foto_y: body.foto_y ?? 10,
      foto_largura: body.foto_largura ?? 30,
      foto_altura: body.foto_altura ?? 30,
      foto_redondo: body.foto_redondo ?? false,
      ativo: true,
      formato: body.formato || 'feed',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { gestor, adminClient } = ctx

  const body: { id: string; arte_url: string; foto_x: number; foto_y: number; foto_largura: number; foto_altura: number; foto_redondo: boolean; ativo: boolean; titulo: string; tipo: string }[] = await req.json()

  for (const t of body) {
    if (t.gestor_id === gestor.id) {
      await (adminClient.from('artes_templates') as any)
        .update({
          titulo: t.titulo,
          tipo: t.tipo,
          arte_url: t.arte_url,
          foto_x: t.foto_x,
          foto_y: t.foto_y,
          foto_largura: t.foto_largura,
          foto_altura: t.foto_altura,
          foto_redondo: t.foto_redondo,
          ativo: t.ativo,
        })
        .eq('id', t.id)
        .eq('gestor_id', gestor.id)
    } else {
      // template do admin — gestor só pode atualizar a arte
      await (adminClient.from('artes_templates') as any)
        .update({ arte_url: t.arte_url })
        .eq('id', t.id)
        .is('gestor_id', null)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getGestor()
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { gestor, adminClient } = ctx

  const { id } = await req.json()
  await (adminClient.from('artes_templates') as any)
    .delete()
    .eq('id', id)
    .eq('gestor_id', gestor.id)

  return NextResponse.json({ ok: true })
}
