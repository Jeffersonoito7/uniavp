import type { createServiceRoleClient } from '@/lib/supabase-server'

type AdminClient = ReturnType<typeof createServiceRoleClient>

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

export async function jaEnviouHoje(
  destinatario: string,
  chave: string,
  adminClient: AdminClient
): Promise<boolean> {
  const { data } = await adminClient
    .from('mensagens_log')
    .select('id')
    .eq('destinatario', destinatario)
    .eq('chave', chave)
    .eq('enviado_em', hoje())
    .maybeSingle()
  return !!data
}

export async function registrarEnvio(
  destinatario: string,
  chave: string,
  tenantId: string | null,
  adminClient: AdminClient
): Promise<void> {
  await adminClient
    .from('mensagens_log')
    .upsert(
      { destinatario, chave, tenant_id: tenantId, enviado_em: hoje() },
      { onConflict: 'destinatario,chave,enviado_em', ignoreDuplicates: true }
    )
}
