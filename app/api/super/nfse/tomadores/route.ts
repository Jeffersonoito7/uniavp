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

  const { data } = await (sb as any).from('nfse_tomadores').select('*').order('razao_social')
  return NextResponse.json({ tomadores: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const sb = createServiceRoleClient()
  if (!await getSuperAdmin(user.id, sb)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const t = await req.json()
  const doc = String(t.documento ?? '').replace(/\D/g, '')
  if (!doc || !t.razao_social) return NextResponse.json({ error: 'Informe documento e razão social.' }, { status: 400 })

  const registro = {
    documento: doc,
    tipo: t.tipo || (doc.length > 11 ? 'cnpj' : 'cpf'),
    razao_social: t.razao_social,
    email: t.email ?? '',
    logradouro: t.logradouro ?? '',
    numero_end: t.numero_end ?? '',
    complemento: t.complemento ?? '',
    bairro: t.bairro ?? '',
    municipio: t.municipio ?? '',
    codigo_ibge: t.codigo_ibge ?? '',
    uf: t.uf ?? '',
    cep: String(t.cep ?? '').replace(/\D/g, ''),
  }

  const { data, error } = await (sb as any).from('nfse_tomadores')
    .upsert(registro, { onConflict: 'documento' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, tomador: data })
}
