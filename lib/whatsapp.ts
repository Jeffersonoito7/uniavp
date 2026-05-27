import type { createServiceRoleClient } from '@/lib/supabase-server'
import { createLogger } from '@/lib/logger'

type AdminClient = ReturnType<typeof createServiceRoleClient>

const EVO_URL = process.env.EVOLUTION_API_URL
const EVO_KEY = process.env.EVOLUTION_API_KEY
const EVO_INSTANCE_GLOBAL = process.env.EVOLUTION_API_INSTANCE

const log = createLogger('whatsapp')

function formatarNumero(numero: string): string {
  const limpo = numero.replace(/\D/g, '')
  return limpo.startsWith('55') ? limpo : `55${limpo}`
}

// Tenta enviar até 3 vezes com backoff de 1s entre tentativas.
// Erros 4xx (cliente) não fazem retry pois não vão melhorar.
export async function enviarWhatsApp(numero: string, mensagem: string, instancia?: string | null): Promise<boolean> {
  if (!EVO_URL || !EVO_KEY) return false

  const instance = instancia || EVO_INSTANCE_GLOBAL
  if (!instance) return false

  const numFormatado = formatarNumero(numero)
  const MAX_TENTATIVAS = 3

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      if (tentativa > 1) await new Promise(r => setTimeout(r, (tentativa - 1) * 1000))

      const resp = await fetch(`${EVO_URL}/message/sendText/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
        body: JSON.stringify({ number: numFormatado, text: mensagem }),
      })

      if (resp.ok) return true

      // Erros de cliente (4xx) não melhoram com retry
      if (resp.status >= 400 && resp.status < 500) {
        log.warn('falha ao enviar WhatsApp (cliente)', { numero, instancia: instance, status: resp.status })
        return false
      }

      log.warn('falha ao enviar WhatsApp (servidor)', { numero, instancia: instance, status: resp.status, tentativa })
    } catch (e) {
      log.warn('erro de rede ao enviar WhatsApp', { numero, instancia: instance, tentativa, err: String(e) })
    }
  }

  log.error('todas as tentativas de envio WhatsApp falharam', { numero, instancia: instance })
  return false
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
