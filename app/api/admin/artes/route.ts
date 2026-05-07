import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

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

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  if (!await verificarAdmin(user, adminClient)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body: { id: string; arte_url: string; foto_x: number; foto_y: number; foto_largura: number; foto_altura: number; foto_redondo: boolean; ativo: boolean }[] = await req.json()

  for (const t of body) {
    await (adminClient.from('artes_templates') as any)
      .update({ arte_url: t.arte_url, foto_x: t.foto_x, foto_y: t.foto_y, foto_largura: t.foto_largura, foto_altura: t.foto_altura, foto_redondo: t.foto_redondo, ativo: t.ativo })
      .eq('id', t.id)
  }


  return NextResponse.json({ ok: true })
}
