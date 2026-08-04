import { NextRequest, NextResponse } from 'next/server'
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
    .from('nfse_config')
    .select('url_servico, cnpj, inscricao_municipal, item_lista_servico, aliquota_iss, optante_simples, incentivador_cultural, codigo_municipio_ibge, serie_rps, descricao_servico, codigo_tributacao_municipio, cert_configurado, cert_valido_ate, cert_titular, ambiente, rps_seq, pix_key, pix_nome, pix_cidade, obs_nota')
    .eq('id', 'default')
    .maybeSingle()

  return NextResponse.json({ config: data ?? {} })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const campos: Record<string, unknown> = {}
  const permitidos = ['url_servico', 'cnpj', 'inscricao_municipal', 'item_lista_servico', 'aliquota_iss', 'optante_simples', 'incentivador_cultural', 'codigo_municipio_ibge', 'serie_rps', 'descricao_servico', 'codigo_tributacao_municipio', 'ambiente', 'pix_key', 'pix_nome', 'pix_cidade', 'obs_nota']
  for (const k of permitidos) {
    if (body[k] !== undefined) campos[k] = body[k]
  }
  campos.updated_at = new Date().toISOString()

  const { error } = await (sb as any).from('nfse_config').update(campos).eq('id', 'default')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
