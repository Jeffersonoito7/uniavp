import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { user_id, nova_senha } = await req.json()
  if (!user_id || !nova_senha || nova_senha.length < 6)
    return NextResponse.json({ error: 'user_id e nova_senha (mín. 6 caracteres) são obrigatórios' }, { status: 400 })

  const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: nova_senha })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
