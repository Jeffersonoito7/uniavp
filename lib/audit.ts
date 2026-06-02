/**
 * Audit log — registra acoes criticas para rastreabilidade.
 * A tabela audit_log precisa existir no banco (ver migration em supabase/migrations/).
 */

import { createServiceRoleClient } from '@/lib/supabase-server'
import type { Json } from '@/lib/database.types'
import { createLogger } from '@/lib/logger'

const log = createLogger('audit')

export type AuditAcao =
  | 'aluno.criado'
  | 'aluno.deletado'
  | 'aluno.status_alterado'
  | 'aluno.senha_resetada'
  | 'contrato.assinado'
  | 'contrato.aditivo.assinado'
  | 'contrato.pdf_gerado'
  | 'pagamento.confirmado'
  | 'pagamento.expirado'
  | 'gestor.ativado'
  | 'gestor.suspenso'
  | 'gestor.deletado'
  | 'admin.configuracao_alterada'
  | 'auth.login'
  | 'auth.orfao_deletado'
  | 'agente.recarga_confirmada'

export type AuditEntry = {
  acao: AuditAcao
  entidade: string
  entidade_id?: string | null
  tenant_id?: string | null
  usuario_id?: string | null
  usuario_tipo?: 'aluno' | 'gestor' | 'admin' | 'super' | 'sistema'
  dados_anteriores?: Record<string, unknown> | null
  dados_novos?: Record<string, unknown> | null
  ip?: string | null
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const client = createServiceRoleClient()
    await client.from('audit_log').insert({
      acao: entry.acao,
      entidade: entry.entidade,
      entidade_id: entry.entidade_id ?? null,
      tenant_id: entry.tenant_id ?? null,
      usuario_id: entry.usuario_id ?? null,
      usuario_tipo: entry.usuario_tipo ?? 'sistema',
      dados_anteriores: (entry.dados_anteriores ?? null) as Json | null,
      dados_novos: (entry.dados_novos ?? null) as Json | null,
      ip: entry.ip ?? null,
    })
  } catch (e) {
    // Audit nunca pode derrubar o fluxo principal
    log.error('falha ao registrar', { acao: entry.acao, err: String(e) })
  }
}

export function getIp(req: { headers: { get(k: string): string | null } }): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  )
}
