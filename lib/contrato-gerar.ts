/**
 * Funcao compartilhada de geracao de PDF de contrato.
 * Usada pelo cron processar-pdfs e pelo endpoint regenerar-pdf do admin.
 */

import { createServiceRoleClient } from '@/lib/supabase-server'
import { gerarPDFContrato, DadosContratoAVP } from '@/lib/contrato-pdf'
import { getSiteConfig } from '@/lib/site-config'
import { captureException } from '@/lib/monitor'

export async function gerarPDFParaContrato(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  contrato: Record<string, any>,
  host = ''
): Promise<{ ok: boolean; pdfUrl?: string; erro?: string }> {
  const numero_registro: string = contrato.numero_registro

  const [siteConfig, { data: cfgs }] = await Promise.all([
    getSiteConfig(host),
    adminClient.from('configuracoes').select('chave, valor')
      .in('chave', [
        'contrato_contratante_nome', 'contrato_contratante_cnpj', 'contrato_contratante_endereco',
        'contrato_representante_nome', 'contrato_representante_cargo', 'contrato_foro',
        'contrato_logo_url', 'contrato_corpo', 'contrato_assinatura_contratante_url',
      ]),
  ])

  const cfgMap: Record<string, string> = {}
  for (const c of cfgs ?? []) cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor ?? '').replace(/"/g, '')

  // Recupera assinatura do storage
  let assinaturaBase64: string | undefined
  try {
    const sigPath = `assinaturas/${numero_registro}.png`
    const { data: sigData } = await adminClient.storage.from('documentos').download(sigPath)
    if (sigData) {
      const buf = await sigData.arrayBuffer()
      assinaturaBase64 = `data:image/png;base64,${Buffer.from(buf).toString('base64')}`
    }
  } catch { /* sem assinatura */ }

  const clausulasAceitas = contrato.clausulas_aceitas as Record<string, unknown> | null
  const regraBonificacao = (clausulasAceitas?.regra_bonificacao as string | null) ?? null
  const dadosPessoais = clausulasAceitas?.dados_pessoais as Record<string, string | null> | null

  const dados: DadosContratoAVP = {
    nome: contrato.nome,
    cpf: contrato.cpf ?? null,
    cnpjMei: contrato.cnpj_mei ?? '',
    sedeMei: contrato.sede_mei ?? '',
    whatsapp: contrato.whatsapp,
    email: contrato.email ?? '',
    dataNascimento: dadosPessoais?.data_nascimento ?? null,
    estadoCivil: dadosPessoais?.estado_civil ?? null,
    nacionalidade: dadosPessoais?.nacionalidade ?? null,
    contratanteNome: cfgMap['contrato_contratante_nome'] || siteConfig.nome,
    contratanteCnpj: cfgMap['contrato_contratante_cnpj'] || '',
    contratanteEndereco: cfgMap['contrato_contratante_endereco'] || '',
    representanteNome: cfgMap['contrato_representante_nome'] || undefined,
    representanteCargo: cfgMap['contrato_representante_cargo'] || undefined,
    foro: cfgMap['contrato_foro'] || undefined,
    logoUrl: undefined,
    contratoLogoUrl: cfgMap['contrato_logo_url'] || null,
    clausulasPersonalizadas: cfgMap['contrato_corpo'] || undefined,
    nfDados: (clausulasAceitas?.nf as DadosContratoAVP['nfDados']) ?? undefined,
    assinaturaBase64,
    assinaturaContratanteUrl: cfgMap['contrato_assinatura_contratante_url'] || undefined,
    regraBonificacao,
    hash_contrato: contrato.hash_contrato ?? 'regenerado',
    ip: contrato.ip ?? 'regenerado',
    assinado_em: contrato.assinado_em ?? new Date().toISOString(),
    numero_registro,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
  }

  try {
    const pdfBytes = await gerarPDFContrato(dados)
    const path = `contratos/${numero_registro}.pdf`
    await adminClient.storage.from('documentos').upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })
    const { data: urlData } = adminClient.storage.from('documentos').getPublicUrl(path)
    const pdfUrl = urlData?.publicUrl ?? null
    if (pdfUrl) {
      await adminClient.from('contratos').update({ pdf_url: pdfUrl, pdf_status: 'gerado' }).eq('numero_registro', numero_registro)
    }
    return { ok: true, pdfUrl: pdfUrl ?? undefined }
  } catch (e: any) {
    captureException(e, { endpoint: 'gerarPDFParaContrato', extra: { numero_registro } })
    await adminClient.from('contratos').update({ pdf_status: 'erro' }).eq('numero_registro', numero_registro)
    return { ok: false, erro: e?.message ?? 'Erro ao gerar PDF' }
  }
}
