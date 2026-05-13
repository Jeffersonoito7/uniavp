import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id').eq('user_id', user.id).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { nome, bio } = await req.json()

  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (bio !== undefined) updates.bio = bio

  const { error } = await (adminClient.from('gestores') as any).update(updates).eq('id', gestor.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
