import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getSaldo, getPacotes, getConfig } from '@/lib/agente-creditos'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const { data: gestor } = await adminClient.from('gestores')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!gestor) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const tenantId = gestor.tenant_id ?? null
  const [saldo, pacotes, config] = await Promise.all([
    getSaldo(gestor.id, adminClient),
    getPacotes(tenantId, adminClient),
    getConfig(tenantId, adminClient),
  ])

  return NextResponse.json({
    saldo,
    pacotes,
    agenteAtivo: config?.ativo ?? true,
    nomeAssistente: config?.nome_assistente ?? 'Assistente',
    instanciaWhatsapp: config?.instancia_whatsapp ?? null,
  })
}
