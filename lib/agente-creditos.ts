import type { createServiceRoleClient } from '@/lib/supabase-server'

type AdminClient = ReturnType<typeof createServiceRoleClient>

export const CUSTO_ACAO: Record<string, number> = {
  mensagem:  1,
  resumo:    1,
  equipe:    1,
  lembrete:  1,
  script:    3,
  comparar:  5,
}

export async function getSaldo(gestorId: string, admin: AdminClient): Promise<number> {
  const { data } = await admin.from('agente_creditos')
    .select('saldo').eq('gestor_id', gestorId).maybeSingle()
  return data?.saldo ?? 0
}

export async function garantirRegistroCredito(
  gestorId: string,
  tenantId: string | null,
  admin: AdminClient
): Promise<void> {
  await admin.from('agente_creditos')
    .upsert({ gestor_id: gestorId, tenant_id: tenantId, saldo: 0 }, { onConflict: 'gestor_id', ignoreDuplicates: true })
}

export async function debitarCreditos(
  gestorId: string,
  quantidade: number,
  descricao: string,
  tenantId: string | null,
  admin: AdminClient
): Promise<{ ok: boolean; saldoAtual: number }> {
  // Lê saldo atual
  const { data: row } = await admin.from('agente_creditos')
    .select('saldo').eq('gestor_id', gestorId).maybeSingle()
  const saldoAtual = row?.saldo ?? 0

  if (saldoAtual < quantidade) return { ok: false, saldoAtual }

  const novoSaldo = saldoAtual - quantidade

  const { error } = await admin.from('agente_creditos')
    .update({ saldo: novoSaldo, updated_at: new Date().toISOString() })
    .eq('gestor_id', gestorId)
    .eq('saldo', saldoAtual) // otimistic lock — garante que não houve corrida

  if (error) {
    // Retry com otimistic lock — relê saldo atual e tenta novamente
    const { data: retry } = await admin.from('agente_creditos')
      .select('saldo').eq('gestor_id', gestorId).maybeSingle()
    const saldoRetry = retry?.saldo ?? 0
    if (saldoRetry < quantidade) return { ok: false, saldoAtual: saldoRetry }
    const { error: retryError } = await admin.from('agente_creditos')
      .update({ saldo: saldoRetry - quantidade, updated_at: new Date().toISOString() })
      .eq('gestor_id', gestorId)
      .eq('saldo', saldoRetry) // mantém otimistic lock no retry
    if (retryError) return { ok: false, saldoAtual: saldoRetry }
  }

  await admin.from('agente_transacoes').insert({
    gestor_id: gestorId,
    tenant_id: tenantId,
    tipo: 'uso',
    creditos: -quantidade,
    descricao,
  })

  return { ok: true, saldoAtual: novoSaldo }
}

export async function creditarCreditos(
  gestorId: string,
  quantidade: number,
  descricao: string,
  tenantId: string | null,
  admin: AdminClient,
  opts?: { tipo?: 'compra' | 'bonus' | 'estorno'; valorPago?: number; cobrancaId?: string }
): Promise<number> {
  const { data: row } = await admin.from('agente_creditos')
    .select('saldo').eq('gestor_id', gestorId).maybeSingle()
  const saldoAtual = row?.saldo ?? 0
  const novoSaldo = saldoAtual + quantidade

  await admin.from('agente_creditos')
    .upsert(
      { gestor_id: gestorId, tenant_id: tenantId, saldo: novoSaldo, updated_at: new Date().toISOString() },
      { onConflict: 'gestor_id' }
    )

  await admin.from('agente_transacoes').insert({
    gestor_id: gestorId,
    tenant_id: tenantId,
    tipo: opts?.tipo ?? 'bonus',
    creditos: quantidade,
    valor_pago: opts?.valorPago ?? null,
    cobranca_id: opts?.cobrancaId ?? null,
    descricao,
  })

  return novoSaldo
}

export async function getPacotes(tenantId: string | null, admin: AdminClient) {
  let q = admin.from('agente_pacotes')
    .select('id, nome, creditos, valor, ordem')
    .eq('ativo', true)
    .order('ordem')
  if (tenantId) q = q.eq('tenant_id', tenantId)
  else q = q.is('tenant_id', null)
  const { data } = await q
  return data ?? []
}

export async function getSessao(gestorId: string, admin: AdminClient) {
  const { data } = await admin.from('agente_sessoes')
    .select('estado, dados, expires_at').eq('gestor_id', gestorId).maybeSingle()
  if (!data) return null
  if (new Date(data.expires_at) < new Date()) {
    await admin.from('agente_sessoes').delete().eq('gestor_id', gestorId)
    return null
  }
  return data as { estado: string; dados: Record<string, unknown> }
}

export async function setSessao(
  gestorId: string,
  estado: string,
  dados: Record<string, unknown>,
  admin: AdminClient
): Promise<void> {
  const expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  await admin.from('agente_sessoes')
    .upsert({ gestor_id: gestorId, estado, dados: dados as unknown as import('@/lib/database.types').Json, expires_at }, { onConflict: 'gestor_id' })
}

export async function limparSessao(gestorId: string, admin: AdminClient): Promise<void> {
  await admin.from('agente_sessoes').delete().eq('gestor_id', gestorId)
}

export async function getConfig(tenantId: string | null, admin: AdminClient) {
  let q = admin.from('agente_config').select('nome_assistente, instancia_whatsapp, prompt_extra, modelo, ativo, creditos_boas_vindas')
  if (tenantId) q = q.eq('tenant_id', tenantId)
  else q = q.is('tenant_id', null)
  const { data } = await q.maybeSingle()
  if (data) return data

  // Fallback para config global da Oito7
  const { data: global } = await admin.from('agente_config_global').select('nome_assistente, modelo_padrao, creditos_boas_vindas_padrao, ativo').limit(1).maybeSingle()
  if (!global) return null
  return {
    nome_assistente: global.nome_assistente,
    instancia_whatsapp: null as string | null,
    prompt_extra: null as string | null,
    modelo: global.modelo_padrao,
    ativo: global.ativo,
    creditos_boas_vindas: global.creditos_boas_vindas_padrao,
  }
}

export async function getArgumentos(tenantId: string | null, admin: AdminClient): Promise<string[]> {
  let q = admin.from('agente_argumentos')
    .select('argumento').eq('ativo', true).order('ordem')
  if (tenantId) q = q.eq('tenant_id', tenantId)
  else q = q.is('tenant_id', null)
  const { data } = await q
  return (data ?? []).map(r => r.argumento)
}
