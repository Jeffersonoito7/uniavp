import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

const CHAVE = 'contratantes_perfis'

type Perfil = {
  id: string
  nome: string
  cnpj: string
  endereco: string
  representante: string
  cargo: string
}

async function lerPerfis(adminClient: ReturnType<typeof createServiceRoleClient>, tenantId: string | null): Promise<Perfil[]> {
  let q = adminClient.from('configuracoes').select('valor').eq('chave', CHAVE)
  if (tenantId) q = q.eq('tenant_id', tenantId)
  const { data } = await q.maybeSingle()
  if (!data?.valor) return []
  try {
    const v = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
    return Array.isArray(v) ? v : []
  } catch { return [] }
}

async function salvarPerfis(adminClient: ReturnType<typeof createServiceRoleClient>, tenantId: string | null, perfis: Perfil[]) {
  const valorJson = JSON.stringify(perfis)
  if (tenantId) {
    const { data: updated } = await adminClient.from('configuracoes')
      .update({ valor: valorJson }).eq('chave', CHAVE).eq('tenant_id', tenantId).select('chave')
    if (!updated || updated.length === 0) {
      await adminClient.from('configuracoes').insert({ chave: CHAVE, valor: valorJson, tenant_id: tenantId })
    }
  } else {
    const { data: existe } = await adminClient.from('configuracoes')
      .select('chave').eq('chave', CHAVE).is('tenant_id', null).maybeSingle()
    if (existe) {
      await adminClient.from('configuracoes').update({ valor: valorJson }).eq('chave', CHAVE).is('tenant_id', null)
    } else {
      await adminClient.from('configuracoes').insert({ chave: CHAVE, valor: valorJson })
    }
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const perfis = await lerPerfis(adminClient, ctx.tenantId)
  return NextResponse.json({ perfis })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { nome, cnpj, endereco, representante, cargo } = await req.json()
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })

  const perfis = await lerPerfis(adminClient, ctx.tenantId)
  const novo: Perfil = {
    id: crypto.randomUUID(),
    nome: nome.trim(),
    cnpj: cnpj?.trim() ?? '',
    endereco: endereco?.trim() ?? '',
    representante: representante?.trim() ?? '',
    cargo: cargo?.trim() ?? '',
  }
  perfis.push(novo)
  await salvarPerfis(adminClient, ctx.tenantId, perfis)
  return NextResponse.json({ ok: true, perfil: novo })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, nome, cnpj, endereco, representante, cargo } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  const perfis = await lerPerfis(adminClient, ctx.tenantId)
  const idx = perfis.findIndex(p => p.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

  perfis[idx] = { ...perfis[idx], nome: nome?.trim() ?? perfis[idx].nome, cnpj: cnpj?.trim() ?? perfis[idx].cnpj, endereco: endereco?.trim() ?? perfis[idx].endereco, representante: representante?.trim() ?? perfis[idx].representante, cargo: cargo?.trim() ?? perfis[idx].cargo }
  await salvarPerfis(adminClient, ctx.tenantId, perfis)
  return NextResponse.json({ ok: true, perfil: perfis[idx] })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

  const perfis = await lerPerfis(adminClient, ctx.tenantId)
  const novos = perfis.filter(p => p.id !== id)
  await salvarPerfis(adminClient, ctx.tenantId, novos)
  return NextResponse.json({ ok: true })
}
