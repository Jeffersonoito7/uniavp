import { createServiceRoleClient } from '@/lib/supabase-server'

const cache = new Map<string, { id: string; ts: number }>()
const TTL = 60_000 // 1 minuto

export async function getTenantId(host: string): Promise<string | null> {
  const domain = host.replace(/:\d+$/, '') // remove porta em dev
  if (!domain || domain === 'localhost') return null

  const cached = cache.get(domain)
  if (cached && Date.now() - cached.ts < TTL) return cached.id

  try {
    const client = createServiceRoleClient()
    const { data } = await (client.from('tenant_domains') as any)
      .select('tenant_id')
      .eq('domain', domain)
      .maybeSingle()

    if (data?.tenant_id) {
      cache.set(domain, { id: data.tenant_id, ts: Date.now() })
      return data.tenant_id
    }
  } catch { /* retorna null */ }

  return null
}

// Versão que lança erro se não encontrar — para rotas que exigem tenant
export async function requireTenantId(host: string): Promise<string> {
  const id = await getTenantId(host)
  if (!id) throw new Error(`Tenant não encontrado para domínio: ${host}`)
  return id
}

// Registra domínios de um novo cliente (chamado no onboarding)
export async function registrarDominiosTenant(tenantId: string, dominios: string[]) {
  const client = createServiceRoleClient()
  const rows = dominios.filter(Boolean).map(d => ({ domain: d.replace(/:\d+$/, ''), tenant_id: tenantId }))
  if (rows.length === 0) return
  await (client.from('tenant_domains') as any)
    .upsert(rows, { onConflict: 'domain' })
}
