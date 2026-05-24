import { createServiceRoleClient } from '@/lib/supabase-server'

// Cache por tenant: 'master' ou tenantId → { url, ts }
const cache = new Map<string, { url: string; ts: number }>()
const TTL = 60_000

export async function getAppUrl(tenantId?: string | null): Promise<string> {
  const key = tenantId ?? 'master'
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < TTL) return hit.url

  const url = await resolve(tenantId)
  cache.set(key, { url, ts: Date.now() })
  return url
}

async function resolve(tenantId?: string | null): Promise<string> {
  // Sem tenant → domínio master
  if (!tenantId) return process.env.NEXT_PUBLIC_APP_URL || ''

  try {
    const client = createServiceRoleClient()

    // 1. dominio_customizado configurado pelo admin do tenant
    const { data: cfg } = await client.from('configuracoes')
      .select('valor')
      .eq('tenant_id', tenantId)
      .eq('chave', 'dominio_customizado')
      .maybeSingle()

    const custom = cfg?.valor
      ? String(JSON.parse(String(cfg.valor))).replace(/^https?:\/\//, '')
      : ''
    if (custom) return `https://${custom}`

    // 2. Domínio base do cliente → padrão free.dominio
    const { data: cliente } = await client.from('clientes')
      .select('dominio')
      .eq('id', tenantId)
      .maybeSingle()

    if (cliente?.dominio) return `https://free.${cliente.dominio}`
  } catch { /* fallback abaixo */ }

  return process.env.NEXT_PUBLIC_APP_URL || ''
}
