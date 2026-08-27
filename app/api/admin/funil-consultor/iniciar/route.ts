import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { getInstanciaTenant } from '@/lib/whatsapp'
import { iniciarFunil } from '@/lib/funil-consultor'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { aluno_id } = await req.json()
  if (!aluno_id) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  const instancia = await getInstanciaTenant(ctx.tenantId, adminClient)

  const result = await iniciarFunil(aluno_id, instancia, adminClient)

  if (!result.ok) return NextResponse.json({ error: result.erro }, { status: 400 })
  return NextResponse.json({ ok: true })
}
