import type { createServiceRoleClient } from '@/lib/supabase-server'

type AdminClient = ReturnType<typeof createServiceRoleClient>

export const LIMITE_PRO_GRATUITO = 20 // fallback padrão

export async function getLimitePROGratuito(admin: AdminClient, tenantId?: string | null): Promise<number> {
  try {
    let q = admin.from('configuracoes').select('valor').eq('chave', 'pros_gratuito_limite')
    if (tenantId) q = q.eq('tenant_id', tenantId)
    else q = q.is('tenant_id', null)
    const { data } = await q.maybeSingle()
    const v = parseInt(String(data?.valor ?? ''))
    return isNaN(v) || v < 1 ? LIMITE_PRO_GRATUITO : v
  } catch { return LIMITE_PRO_GRATUITO }
}

export async function contarPROsAtivosIndicados(gestorId: string, admin: AdminClient): Promise<number> {
  const agora = new Date().toISOString()
  const { count } = await admin.from('gestores')
    .select('id', { count: 'exact', head: true })
    .eq('indicado_por_gestor_id', gestorId)
    .eq('ativo', true)
    .eq('status_assinatura', 'ativo')
    .gt('plano_vencimento', agora)
  return count ?? 0
}

export async function verificarPROGratuito(gestorId: string, admin: AdminClient, tenantId?: string | null): Promise<boolean> {
  const [total, limite] = await Promise.all([
    contarPROsAtivosIndicados(gestorId, admin),
    getLimitePROGratuito(admin, tenantId),
  ])
  return total >= limite
}
