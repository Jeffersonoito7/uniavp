import { traduzirErro } from '@/lib/erros'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const perPage = 50
  const acao = searchParams.get('acao') ?? ''
  const entidade = searchParams.get('entidade') ?? ''
  const busca = searchParams.get('busca') ?? ''

  let q = adminClient.from('audit_log')
    .select('id, acao, entidade, entidade_id, usuario_tipo, ip, created_at, dados_anteriores, dados_novos', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (ctx.tenantId) q = q.eq('tenant_id', ctx.tenantId)
  if (acao) q = q.eq('acao', acao)
  if (entidade) q = q.eq('entidade', entidade)
  if (busca) q = q.ilike('entidade_id', `%${busca}%`)

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: traduzirErro(error) }, { status: 500 })

  return NextResponse.json({ logs: data ?? [], total: count ?? 0, page, perPage })
}
