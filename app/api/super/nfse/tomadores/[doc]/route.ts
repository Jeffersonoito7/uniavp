import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getSuperAdmin(userId: string, sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await sb.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ doc: string }> }
) {
  const { doc } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const docLimpo = doc.replace(/\D/g, '')
  await (sb as any).from('nfse_tomadores').delete().eq('documento', docLimpo)
  return NextResponse.json({ ok: true })
}
