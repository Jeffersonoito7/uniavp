/**
 * Contrato digital obrigatorio para todos os alunos.
 * Chave de config: contrato_digital_obrigatorio_id (UUID do template)
 * Quando configurada, qualquer aluno sem contrato assinado e redirecionado para assinar.
 * Funcao idempotente: gera o contrato apenas uma vez por aluno.
 */

import { createServiceRoleClient } from '@/lib/supabase-server'
import { renderizarTemplate, gerarNumeroContrato, gerarTokenAssinante } from '@/lib/contrato-digital'

type AlunoBasico = {
  id: string
  nome: string
  whatsapp: string
  email?: string | null
  cpf?: string | null
  tenant_id?: string | null
}

/**
 * Verifica se o aluno precisa assinar o contrato obrigatorio.
 * Retorna o token de assinatura se precisar, ou null se ja assinou ou nao ha contrato configurado.
 */
export async function verificarContratoObrigatorio(
  aluno: AlunoBasico
): Promise<string | null> {
  const adminClient = createServiceRoleClient()
  const tenantId = aluno.tenant_id ?? null

  // 1. Busca config do contrato obrigatorio
  const cfgQuery = adminClient
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'contrato_digital_obrigatorio_id')
  const { data: cfgRow } = await (tenantId ? cfgQuery.eq('tenant_id', tenantId) : cfgQuery).maybeSingle()
  if (!cfgRow?.valor) return null

  const templateId = typeof cfgRow.valor === 'string'
    ? cfgRow.valor.replace(/"/g, '').trim()
    : String(cfgRow.valor).trim()
  if (!templateId) return null

  // 2. Verifica se ja existe contrato deste template para este aluno
  const { data: assinanteExistente } = await adminClient
    .from('contrato_assinantes')
    .select('token_acesso, status, contratos_digitais!inner(template_id, tenant_id)')
    .eq('email', aluno.email ?? '')
    .neq('status', 'cancelado')
    .filter('contratos_digitais.template_id', 'eq', templateId)
    .filter('contratos_digitais.tenant_id', tenantId ? 'eq' : 'is', tenantId ?? null)
    .maybeSingle()

  if (assinanteExistente) {
    // Ja assinou ou tem contrato pendente — se ja assinou, retorna null (libera acesso)
    if (assinanteExistente.status === 'assinado') return null
    // Pendente: retorna o token existente para o aluno assinar
    return assinanteExistente.token_acesso
  }

  // 3. Nao tem contrato — gera um novo a partir do template
  const { data: template } = await adminClient
    .from('contrato_templates')
    .select('corpo_html, nome')
    .eq('id', templateId)
    .maybeSingle()
  if (!template) return null

  // Busca assinatura do contratante (logo/rubrica configurada no admin)
  const { data: cfgSig } = await adminClient
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'contrato_assinatura_contratante_url')
    .maybeSingle()
  const assinaturaAvp = cfgSig?.valor
    ? (typeof cfgSig.valor === 'string' ? cfgSig.valor : JSON.stringify(cfgSig.valor).replace(/"/g, ''))
    : null

  // Busca dados da contratante configurados no admin
  const cfgChaves = ['contratante_razao_social', 'contratante_cnpj', 'contratante_endereco', 'contratante_representante']
  const cfgContratanteQ = adminClient.from('configuracoes').select('chave, valor').in('chave', cfgChaves)
  const { data: cfgContratanteRows } = await (tenantId ? cfgContratanteQ.eq('tenant_id', tenantId) : cfgContratanteQ)
  const cc: Record<string, string> = {}
  for (const r of cfgContratanteRows ?? []) {
    try { cc[r.chave] = JSON.parse(r.valor as string) } catch { cc[r.chave] = String(r.valor ?? '') }
  }

  const variaveis: Record<string, string> = {
    nome: aluno.nome,
    whatsapp: aluno.whatsapp,
    email: aluno.email ?? '',
    cpf: aluno.cpf ?? '',
    data: new Date().toLocaleDateString('pt-BR'),
    contratante_razao_social: cc['contratante_razao_social'] ?? '',
    contratante_cnpj: cc['contratante_cnpj'] ?? '',
    contratante_endereco: cc['contratante_endereco'] ?? '',
    contratante_representante: cc['contratante_representante'] ?? '',
  }

  const corpoRenderizado = renderizarTemplate(template.corpo_html, variaveis)
  const numero = await gerarNumeroContrato(adminClient, tenantId)
  const { token, expira } = gerarTokenAssinante()

  // Insere contrato
  const { data: contrato, error: errContrato } = await adminClient
    .from('contratos_digitais')
    .insert({
      tenant_id: tenantId,
      template_id: templateId,
      tipo: 'principal' as const,
      titulo: template.nome || 'Contrato de Prestacao de Servico',
      numero_registro: numero,
      corpo_renderizado: corpoRenderizado,
      variaveis_usadas: variaveis,
      status: 'enviado' as const,
      assinatura_avp_url: assinaturaAvp,
    })
    .select('id')
    .single()

  if (errContrato || !contrato) return null

  // Insere assinante (o proprio aluno)
  const { error: errAssinante } = await adminClient
    .from('contrato_assinantes')
    .insert({
      contrato_id: contrato.id,
      papel: 'contratado',
      nome: aluno.nome,
      email: aluno.email ?? null,
      cpf: aluno.cpf ?? null,
      token_acesso: token,
      token_expira_em: expira.toISOString(),
      status: 'pendente' as const,
    })

  if (errAssinante) return null

  return token
}
