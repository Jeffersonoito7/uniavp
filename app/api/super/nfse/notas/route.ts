import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getSuperAdmin(userId: string, sb: ReturnType<typeof createServiceRoleClient>) {
  const { data } = await sb.from('super_admins').select('id').eq('user_id', userId).eq('ativo', true).maybeSingle()
  return !!data
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data } = await (sb as any)
    .from('nfse_notas')
    .select('id, numero, codigo_verificacao, valor, descricao, tomador_doc, tomador_nome, item, aliquota, status, rps, data')
    .order('data', { ascending: false })
    .limit(200)

  return NextResponse.json({ notas: data ?? [] })
}
