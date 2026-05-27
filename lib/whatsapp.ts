import type { createServiceRoleClient } from '@/lib/supabase-server'

type AdminClient = ReturnType<typeof createServiceRoleClient>

const EVO_URL = process.env.EVOLUTION_API_URL
const EVO_KEY = process.env.EVOLUTION_API_KEY
const EVO_INSTANCE_GLOBAL = process.env.EVOLUTION_API_INSTANCE

function formatarNumero(numero: string): string {
  const limpo = numero.replace(/\D/g, '')
  return limpo.startsWith('55') ? limpo : `55${limpo}`
}

export async function enviarWhatsApp(numero: string, mensagem: string, instancia?: string | null): Promise<boolean> {
  if (!EVO_URL || !EVO_KEY) return false

  const instance = instancia || EVO_INSTANCE_GLOBAL
  if (!instance) return false

  try {
    const resp = await fetch(`${EVO_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: formatarNumero(numero), text: mensagem }),
    })
    return resp.ok
  } catch {
    return false
  }
}

export async function getInstanciaTenant(tenantId: string | null | undefined, adminClient: AdminClient): Promise<string | null> {
  if (!tenantId) return null
  const { data } = await adminClient.from('admins')
    .select('whatsapp_instancia')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .not('whatsapp_instancia', 'is', null)
    .limit(1)
    .maybeSingle()
  return data?.whatsapp_instancia ?? null
}

export async function getInstanciaGestorPorNome(gestorNome: string, adminClient: AdminClient, tenantId?: string | null): Promise<string | null> {
  let q = adminClient.from('gestores')
    .select('whatsapp_instancia')
    .eq('nome', gestorNome)
  if (tenantId) q = q.eq('tenant_id', tenantId)
  const { data } = await q.maybeSingle()
  return data?.whatsapp_instancia || null
}
