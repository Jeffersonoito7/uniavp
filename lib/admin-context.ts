import { createServiceRoleClient } from '@/lib/supabase-server'

export type AdminContext = {
  adminId: string
  tenantId: string | null
}

// Retorna contexto do admin autenticado com tenant_id
export async function getAdminContext(
  userId: string,
  adminClient: ReturnType<typeof createServiceRoleClient>
): Promise<AdminContext | null> {
  const { data } = await adminClient.from('admins')
    .select('id, tenant_id')
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle()
  if (!data) return null
  return { adminId: data.id, tenantId: data.tenant_id ?? null }
}

// Aplica filtro de tenant numa query se tenantId existir
export function withTenant<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  tenantId: string | null
): T {
  if (tenantId) return query.eq('tenant_id', tenantId)
  return query
}
