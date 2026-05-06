import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { titulo, descricao } = body
  if (!titulo) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  const { data: ultimo } = await (adminClient.from('modulos') as any)
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordem = (ultimo?.ordem ?? 0) + 1

  const { data: modulo, error } = await (adminClient.from('modulos') as any)
    .insert({ titulo, descricao: descricao ?? null, ordem, publicado: false })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ modulo })
}
