import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { DOMINIO_MASTER } from '@/lib/constants'

export const dynamic = 'force-dynamic'

async function checkSuper() {
  const host = headers().get('host')?.replace(/:\d+$/, '') ?? ''
  if (host !== DOMINIO_MASTER && host !== 'localhost') return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createServiceRoleClient()
  const { data: sa } = await admin.from('super_admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) return null

  return admin
}

// GET — config global + stats por tenant
export async function GET() {
  const admin = await checkSuper()
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const [
    { data: configGlobal },
    { data: clientes },
    { data: configs },
    { data: creditos },
    { data: transacoes },
    { data: recargas },
  ] = await Promise.all([
    admin.from('agente_config_global').select('*').limit(1).maybeSingle(),
    admin.from('clientes').select('id, nome, dominio').order('nome'),
    admin.from('agente_config').select('tenant_id, nome_assistente, instancia_whatsapp, modelo, ativo'),
    admin.from('agente_creditos').select('gestor_id, tenant_id, saldo'),
    admin.from('agente_transacoes').select('tenant_id, tipo, creditos, valor_pago, created_at'),
    admin.from('agente_recargas').select('tenant_id, creditos, valor, status, created_at'),
  ])

  // Consolida stats por tenant
  const statsMap: Record<string, {
    creditos_total: number
    creditos_consumidos: number
    receita_total: number
    gestores_com_saldo: number
  }> = {}

  function ensureTenant(tid: string | null) {
    const key = tid ?? '__global__'
    if (!statsMap[key]) statsMap[key] = { creditos_total: 0, creditos_consumidos: 0, receita_total: 0, gestores_com_saldo: 0 }
    return key
  }

  for (const t of (transacoes ?? [])) {
    const key = ensureTenant(t.tenant_id)
    if (t.tipo === 'compra' || t.tipo === 'bonus') {
      statsMap[key].creditos_total += t.creditos ?? 0
    } else if (t.tipo === 'uso') {
      statsMap[key].creditos_consumidos += Math.abs(t.creditos ?? 0)
    }
    if (t.valor_pago) statsMap[key].receita_total += Number(t.valor_pago)
  }

  for (const r of (recargas ?? [])) {
    if (r.status === 'pago') {
      const key = ensureTenant(r.tenant_id)
      statsMap[key].receita_total += Number(r.valor ?? 0)
    }
  }

  // Conta gestores com saldo > 0 por tenant
  const saldosPorTenant: Record<string, number> = {}
  for (const c of (creditos ?? [])) {
    const key = c.tenant_id ?? '__global__'
    if ((c.saldo ?? 0) > 0) saldosPorTenant[key] = (saldosPorTenant[key] ?? 0) + 1
  }
  for (const key of Object.keys(saldosPorTenant)) {
    ensureTenant(key === '__global__' ? null : key)
    statsMap[key].gestores_com_saldo = saldosPorTenant[key]
  }

  // Monta lista de tenants
  type ConfigRow = { tenant_id: string | null; nome_assistente: string; instancia_whatsapp: string | null; modelo: string; ativo: boolean }
  const configMap: Record<string, ConfigRow> = {}
  for (const c of (configs ?? [])) {
    if (c.tenant_id) configMap[c.tenant_id] = c
  }

  const tenants = (clientes ?? []).map(c => ({
    id: c.id,
    nome: c.nome,
    dominio: c.dominio,
    config: configMap[c.id] ?? null,
    stats: statsMap[c.id] ?? { creditos_total: 0, creditos_consumidos: 0, receita_total: 0, gestores_com_saldo: 0 },
  }))

  return NextResponse.json({ configGlobal, tenants })
}

// PUT — salvar config global
export async function PUT(req: NextRequest) {
  const admin = await checkSuper()
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()

  const { data: existing } = await admin.from('agente_config_global').select('id').limit(1).maybeSingle()

  if (existing?.id) {
    const { error } = await admin.from('agente_config_global').update({
      nome_assistente: String(body.nome_assistente ?? 'Assistente'),
      prompt_base: (body.prompt_base as string | null) ?? null,
      modelo_padrao: String(body.modelo_padrao ?? 'haiku'),
      creditos_boas_vindas_padrao: Number(body.creditos_boas_vindas_padrao ?? 50),
      ativo: Boolean(body.ativo ?? true),
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from('agente_config_global').insert({
      nome_assistente: String(body.nome_assistente ?? 'Assistente'),
      prompt_base: (body.prompt_base as string | null) ?? null,
      modelo_padrao: String(body.modelo_padrao ?? 'haiku'),
      creditos_boas_vindas_padrao: Number(body.creditos_boas_vindas_padrao ?? 50),
      ativo: Boolean(body.ativo ?? true),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
