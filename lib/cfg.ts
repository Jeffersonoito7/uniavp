import type { SupabaseClient } from '@supabase/supabase-js'

export type CfgChave =
  | 'site_nome'
  | 'site_logo_url'
  | 'site_cor_primaria'
  | 'site_cor_secundaria'
  | 'logo_favicon_url'
  | 'whatsapp_admin'
  | 'plano_pro_valor'
  | 'plano_pro_valor_anual'
  | 'pro_cobranca_modo'
  | 'pros_gratuito_limite'
  | 'boleto_mensagem'
  | 'boleto_instrucoes'
  | 'boleto_multa'
  | 'boleto_juros'
  | 'contrato_contratante_nome'
  | 'contrato_contratante_cnpj'
  | 'contrato_contratante_endereco'
  | 'contrato_representante_nome'
  | 'contrato_representante_cargo'
  | 'contrato_foro'
  | 'contrato_logo_url'
  | 'contrato_corpo'
  | 'contrato_assinatura_contratante_url'
  | 'carteira_assinatura_nome'
  | 'carteira_assinatura_cargo'
  | 'carteira_assinatura_empresa'
  | 'carteira_url_verificacao'
  | 'carteira_tagline'
  | 'carteira_logo_esquerda'
  | 'carteira_logo_direita'
  | 'carteira_assinatura_url'

function parseValor(raw: unknown): string {
  const s = String(raw ?? '')
  try { return JSON.parse(s) } catch { return s }
}

/** Lê uma única chave de configuração. Retorna string vazia se não encontrada. */
export async function getCfg(
  chave: CfgChave,
  tenantId: string | null,
  client: SupabaseClient,
): Promise<string> {
  let q = client.from('configuracoes').select('valor').eq('chave', chave)
  if (tenantId) q = q.eq('tenant_id', tenantId)
  else q = q.is('tenant_id', null)
  const { data } = await q.maybeSingle()
  return parseValor(data?.valor)
}

/** Lê várias chaves de uma vez. Retorna Record<chave, string>. */
export async function getCfgMany(
  chaves: CfgChave[],
  tenantId: string | null,
  client: SupabaseClient,
): Promise<Record<string, string>> {
  let q = client.from('configuracoes').select('chave, valor').in('chave', chaves)
  if (tenantId) q = q.eq('tenant_id', tenantId)
  else q = q.is('tenant_id', null)
  const { data } = await q
  const result: Record<string, string> = {}
  for (const row of data ?? []) result[row.chave] = parseValor(row.valor)
  return result
}

/** Lê valor numérico. Retorna `fallback` se não encontrado ou inválido. */
export async function getCfgNum(
  chave: CfgChave,
  tenantId: string | null,
  client: SupabaseClient,
  fallback: number,
): Promise<number> {
  const val = await getCfg(chave, tenantId, client)
  const n = parseFloat(val)
  return isNaN(n) || n <= 0 ? fallback : n
}
