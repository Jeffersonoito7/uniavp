import { createServiceRoleClient } from '@/lib/supabase-server'

export type AdminContext = {
  adminId: string
  tenantId: string | null
  isSuperAdmin: boolean
}

// Retorna contexto do admin autenticado com tenant_id.
// Reconhece tanto admins (com tenant) quanto super_admins (sem tenant, acesso global),
// alinhando a autorização das rotas de API com a das páginas do painel admin,
// que também autorizam ambos os papéis.
export async function getAdminContext(
  userId: string,
  adminClient: ReturnType<typeof createServiceRoleClient>
): Promise<AdminContext | null> {
  const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
    adminClient.from('admins')
      .select('id, tenant_id')
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle(),
    adminClient.from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle(),
  ])

  if (adminRecord) {
    return { adminId: adminRecord.id, tenantId: adminRecord.tenant_id ?? null, isSuperAdmin: !!superRecord }
  }
  // Super admin sem registro em `admins`: acesso global, sem filtro de tenant.
  if (superRecord) {
    return { adminId: superRecord.id, tenantId: null, isSuperAdmin: true }
  }
  return null
}

// Aplica filtro de tenant numa query se tenantId existir
export function withTenant<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  tenantId: string | null
): T {
  if (tenantId) return query.eq('tenant_id', tenantId)
  return query
}
