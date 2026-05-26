import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'

export const dynamic = 'force-dynamic'

// GET — retorna config + argumentos + pacotes do tenant
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenantId = ctx.tenantId ?? null

  const [configRes, argumentosRes, pacotesRes] = await Promise.all([
    (() => {
      let q = adminClient.from('agente_config').select('*')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      else q = q.is('tenant_id', null)
      return q.maybeSingle()
    })(),
    (() => {
      let q = adminClient.from('agente_argumentos').select('id, categoria, argumento, ordem, ativo').order('ordem')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      else q = q.is('tenant_id', null)
      return q
    })(),
    (() => {
      let q = adminClient.from('agente_pacotes').select('id, nome, creditos, valor, ordem, ativo').order('ordem')
      if (tenantId) q = q.eq('tenant_id', tenantId)
      else q = q.is('tenant_id', null)
      return q
    })(),
  ])

  return NextResponse.json({
    config: configRes.data,
    argumentos: argumentosRes.data ?? [],
    pacotes: pacotesRes.data ?? [],
  })
}

// PUT — salva configuração principal
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenantId = ctx.tenantId ?? null
  const body = await req.json()

  const { error } = await adminClient.from('agente_config')
    .upsert({
      tenant_id: tenantId,
      nome_assistente: String(body.nome_assistente ?? 'Assistente'),
      instancia_whatsapp: (body.instancia_whatsapp as string | null) ?? null,
      prompt_extra: (body.prompt_extra as string | null) ?? null,
      modelo: String(body.modelo ?? 'haiku'),
      creditos_boas_vindas: Number(body.creditos_boas_vindas ?? 50),
      ativo: Boolean(body.ativo ?? true),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
