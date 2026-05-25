import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { gerarPDFContrato, DadosContratoAVP } from '@/lib/contrato-pdf'
import { getSiteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { numero_registro } = await req.json()
  if (!numero_registro) return NextResponse.json({ error: 'numero_registro obrigatório' }, { status: 400 })

  // Busca o contrato
  const { data: contrato } = await adminClient.from('contratos')
    .select('*')
    .eq('numero_registro', numero_registro)
    .maybeSingle()
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  // Busca configs
  const [siteConfig, { data: cfgs }] = await Promise.all([
    getSiteConfig(req.headers.get('host') ?? ''),
    adminClient.from('configuracoes').select('chave, valor')
      .in('chave', ['contrato_contratante_nome','contrato_contratante_cnpj','contrato_contratante_endereco','contrato_representante_nome','contrato_representante_cargo','contrato_foro','site_logo_url','contrato_corpo','contrato_assinatura_contratante_url']),
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
  } catch { /* sem assinatura salva */ }

  // Recupera regra de bonificacao personalizada do clausulas_aceitas
  const clausulasAceitas = contrato.clausulas_aceitas as Record<string, unknown> | null
  const regraBonificacao = (clausulasAceitas?.regra_bonificacao as string | null) ?? null

  // Recupera dados pessoais
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
    logoUrl: cfgMap['site_logo_url'] || siteConfig.logoUrl || undefined,
    clausulasPersonalizadas: cfgMap['contrato_corpo'] || undefined,
    nfDados: (clausulasAceitas?.nf as DadosContratoAVP['nfDados']) ?? undefined,
    assinaturaBase64,
    assinaturaContratanteUrl: cfgMap['contrato_assinatura_contratante_url'] || undefined,
    regraBonificacao,
    hash_contrato: contrato.hash_contrato ?? 'regenerado',
    ip: contrato.ip ?? 'regenerado',
    assinado_em: contrato.assinado_em ?? new Date().toISOString(),
    numero_registro: contrato.numero_registro ?? numero_registro,
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
    return NextResponse.json({ ok: true, pdf_url: pdfUrl })
  } catch (e: any) {
    await adminClient.from('contratos').update({ pdf_status: 'erro' }).eq('numero_registro', numero_registro)
    return NextResponse.json({ error: e?.message ?? 'Erro ao gerar PDF' }, { status: 500 })
  }
}
