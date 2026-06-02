import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { gerarPDFContrato } from '@/lib/contrato-pdf'
import { getSiteConfig } from '@/lib/site-config'
import { audit, getIp } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const wpp = searchParams.get('wpp')
  if (!wpp) return NextResponse.json(null)
  const adminClient = createServiceRoleClient()
  const { data } = await adminClient.from('contratos')
    .select('numero_registro, nome, whatsapp, clausulas_aceitas')
    .eq('whatsapp', wpp.replace(/\D/g, '')).maybeSingle()
  return NextResponse.json(data ?? null)
}

export async function PUT(req: NextRequest) {
  const ip = getIp(req) ?? 'desconhecido'
  const body = await req.json()
  const { whatsapp, cnpj, endereco, nf_emite_proprio, nf_dados, assinatura_base64 } = body

  if (!whatsapp) return NextResponse.json({ error: 'WhatsApp obrigatorio.' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const wppLimpo = whatsapp.replace(/\D/g, '')

  const { data: contrato } = await adminClient.from('contratos')
    .select('id, numero_registro, nome, cpf, email, clausulas_aceitas, hash_contrato')
    .eq('whatsapp', wppLimpo).maybeSingle()

  if (!contrato) return NextResponse.json({ error: 'Contrato nao encontrado.' }, { status: 404 })

  const aditivo_assinado_em = new Date().toISOString()

  const clausulasAtual = (contrato.clausulas_aceitas as Record<string, unknown>) ?? {}
  const novasClausulas = {
    ...clausulasAtual,
    sem_cnpj: false,
    aditivo_assinado_em,
    aditivo_nf_emite_proprio: nf_emite_proprio,
    ...(nf_dados ? { nf: nf_dados } : {}),
  }

  const { error } = await adminClient.from('contratos').update({
    cnpj_mei: cnpj?.replace(/\D/g, '') || null,
    sede_mei: endereco || null,
    clausulas_aceitas: novasClausulas,
    pdf_status: 'pendente',
  }).eq('id', contrato.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Salva assinatura do aditivo no storage
  if (assinatura_base64) {
    try {
      const base64Data = assinatura_base64.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      const sigPath = `assinaturas/${contrato.numero_registro}_aditivo.png`
      await adminClient.storage.from('documentos').upload(sigPath, imageBuffer, { contentType: 'image/png', upsert: true })
    } catch { /* segue */ }
  }

  // Regenera PDF em background
  const host = req.headers.get('host') ?? ''
  const siteConfig = await getSiteConfig(host)
  const [{ data: cfgs }] = await Promise.all([
    adminClient.from('configuracoes').select('chave, valor')
      .in('chave', ['contrato_contratante_nome','contrato_contratante_cnpj','contrato_contratante_endereco','contrato_representante_nome','contrato_representante_cargo','contrato_foro','contrato_logo_url','contrato_corpo','contrato_assinatura_contratante_url']),
  ])
  const cfgMap: Record<string, string> = {}
  for (const c of cfgs ?? []) cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor ?? '').replace(/"/g, '')

  const regraBonificacao = (clausulasAtual.regra_bonificacao as string | null) ?? null

  gerarPDFContrato({
    nome: contrato.nome, cpf: contrato.cpf ?? null,
    cnpjMei: cnpj?.replace(/\D/g, '') || '',
    sedeMei: endereco || '',
    whatsapp: wppLimpo, email: contrato.email ?? '',
    contratanteNome: cfgMap['contrato_contratante_nome'] || siteConfig.nome,
    contratanteCnpj: cfgMap['contrato_contratante_cnpj'] || '',
    contratanteEndereco: cfgMap['contrato_contratante_endereco'] || '',
    representanteNome: cfgMap['contrato_representante_nome'] || undefined,
    representanteCargo: cfgMap['contrato_representante_cargo'] || undefined,
    foro: cfgMap['contrato_foro'] || undefined,
    contratoLogoUrl: cfgMap['contrato_logo_url'] || null,
    clausulasPersonalizadas: cfgMap['contrato_corpo'] || undefined,
    assinaturaContratanteUrl: cfgMap['contrato_assinatura_contratante_url'] || undefined,
    nfDados: nf_dados ?? undefined,
    assinaturaBase64: assinatura_base64 ?? undefined,
    regraBonificacao,
    hash_contrato: contrato.hash_contrato ?? '',
    ip, assinado_em: aditivo_assinado_em,
    numero_registro: contrato.numero_registro ?? '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
  }).then(async (pdfBytes) => {
    const path = `contratos/${contrato.numero_registro}_aditivo.pdf`
    await adminClient.storage.from('documentos').upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })
    const { data } = adminClient.storage.from('documentos').getPublicUrl(path)
    if (data?.publicUrl) {
      await adminClient.from('contratos').update({ pdf_url: data.publicUrl, pdf_status: 'gerado' }).eq('id', contrato.id)
    }
  }).catch(() => adminClient.from('contratos').update({ pdf_status: 'erro' }).eq('id', contrato.id))

  await audit({
    acao: 'contrato.aditivo.assinado',
    entidade: 'contratos',
    entidade_id: contrato.numero_registro ?? '',
    usuario_tipo: 'sistema',
    dados_novos: { cnpj: cnpj || null, nf_emite_proprio, aditivo_assinado_em },
    ip,
  })

  return NextResponse.json({ ok: true, numero_registro: contrato.numero_registro })
}
