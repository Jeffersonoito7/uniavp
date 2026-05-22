import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createServiceRoleClient()
  await (admin.from('alunos') as any)
    .update({ setup_concluido: true })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
