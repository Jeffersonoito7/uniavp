import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest) {
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

  const body: { chave: string; valor: string }[] = await req.json()
  if (!Array.isArray(body)) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  for (const { chave, valor } of body) {
    if (!chave) continue
    await (adminClient.from('configuracoes') as any)
      .upsert({ chave, valor }, { onConflict: 'chave' })
  }

  return NextResponse.json({ ok: true })
}
