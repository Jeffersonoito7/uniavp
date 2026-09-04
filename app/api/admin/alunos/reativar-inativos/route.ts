import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRecord && !superRecord) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })

  const tid = (adminRecord?.tenant_id ?? null) as string | null

  let q = adminClient.from('alunos').update({ status: 'ativo' } as any).eq('status', 'inativo')
  if (tid) q = (q as any).eq('tenant_id', tid)

  const { count, error } = await (q as any).select('id', { count: 'exact' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, reativados: count ?? 0 })
}
