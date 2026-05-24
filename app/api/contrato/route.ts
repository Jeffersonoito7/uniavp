import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { gerarPDFContrato, DadosContratoAVP } from '@/lib/contrato-pdf'
import { getSiteConfig } from '@/lib/site-config'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

async function salvarPDF(adminClient: ReturnType<typeof createServiceRoleClient>, pdfBytes: Uint8Array, registro: string): Promise<string | null> {
  try {
    const path = `contratos/${registro}.pdf`
    await adminClient.storage.from('documentos').upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })
    const { data } = adminClient.storage.from('documentos').getPublicUrl(path)
    return data?.publicUrl ?? null
  } catch { return null }
}

async function enviarPDFWhatsApp(numero: string, pdfBytes: Uint8Array, nomeArquivo: string): Promise<boolean> {
  const EVO_URL = process.env.EVOLUTION_API_URL
  const EVO_KEY = process.env.EVOLUTION_API_KEY
  const EVO_INSTANCE = process.env.EVOLUTION_API_INSTANCE
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE) return false
  const limpo = numero.replace(/\D/g,'')
  const num = limpo.startsWith('55') ? limpo : `55${limpo}`
  try {
    const res = await fetch(`${EVO_URL}/message/sendMedia/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: num, mediatype: 'document', mimetype: 'application/pdf', media: Buffer.from(pdfBytes).toString('base64'), fileName: nomeArquivo, caption: '📄 Seu contrato assinado digitalmente.' }),
    })
    return res.ok
  } catch { return false }
}

async function gerarEEnviar(dados: DadosContratoAVP, registro: string, adminClient: ReturnType<typeof createServiceRoleClient>) {
  try {
    const pdfBytes = await gerarPDFContrato(dados)
    const pdfUrl = await salvarPDF(adminClient, pdfBytes, registro)
    if (pdfUrl) {
      await adminClient.from('contratos').update({ pdf_url: pdfUrl, pdf_status: 'gerado' }).eq('numero_registro', registro)
    }
    const nome = `Contrato_${registro}.pdf`
    await Promise.allSettled([
      enviarPDFWhatsApp(dados.whatsapp, pdfBytes, nome),
    ])
  } catch (e) {
    console.error('Erro ao gerar contrato PDF:', e)
    await adminClient.from('contratos').update({ pdf_status: 'erro' }).eq('numero_registro', registro)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome, cpf, cnpj_mei, sede_mei, whatsapp, email, aluno_id, clausulas_aceitas, nf_dados } = body

  if (!nome || !whatsapp || !cnpj_mei || !sede_mei)
    return NextResponse.json({ error: 'Nome, WhatsApp, CNPJ MEI e sede são obrigatórios.' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const wppLimpo = whatsapp.replace(/\D/g,'')

  // Já assinou?
  const { data: existente } = await adminClient.from('contratos')
    .select('numero_registro, hash_contrato, pdf_url')
    .eq('whatsapp', wppLimpo).maybeSingle()
  if (existente) return NextResponse.json({ ok: true, ...existente, jaExistia: true })

  // Número sequencial
  const { count } = await adminClient.from('contratos').select('id', { count: 'exact', head: true })
  const numero_registro = `CONT-${String(((count ?? 0) + 1)).padStart(6, '0')}`

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'
  const assinado_em = new Date().toISOString()

  // Hash SHA-256
  const hash_contrato = crypto.createHash('sha256').update(JSON.stringify({
    nome: nome.trim(), cpf: cpf?.replace(/\D/g,'') || null,
    cnpj_mei: cnpj_mei.replace(/\D/g,''), sede_mei,
    whatsapp: wppLimpo, email: email?.trim().toLowerCase(),
    numero_registro, assinado_em, ip,
  }), 'utf8').digest('hex')

  const clausulasPayload = nf_dados
    ? { clausulas: Array.isArray(clausulas_aceitas) ? clausulas_aceitas : [], nf: nf_dados }
    : clausulas_aceitas

  const { error } = await adminClient.from('contratos').insert({
    aluno_id: aluno_id ?? null, nome: nome.trim(),
    cpf: cpf?.replace(/\D/g,'') || null,
    cnpj_mei: cnpj_mei.replace(/\D/g,''), sede_mei,
    whatsapp: wppLimpo, email: email?.trim().toLowerCase() || null,
    ip, numero_registro, clausulas_aceitas: clausulasPayload, hash_contrato,
    pdf_status: 'pendente',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Busca configs da contratante
  const [siteConfig, { data: cfgs }] = await Promise.all([
    getSiteConfig(req.headers.get('host') ?? ''),
    adminClient.from('configuracoes').select('chave, valor')
      .in('chave', ['contrato_contratante_nome','contrato_contratante_cnpj','contrato_contratante_endereco','contrato_representante_nome','contrato_representante_cargo','contrato_foro','site_logo_url','contrato_corpo']),
  ])
  const cfgMap: Record<string,string> = {}
  for (const c of cfgs ?? []) cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor ?? '').replace(/"/g,'')

  const dadosGeracao: DadosContratoAVP = {
    nome: nome.trim(), cpf: cpf?.replace(/\D/g,'') || null,
    cnpjMei: cnpj_mei.replace(/\D/g,''), sedeMei: sede_mei,
    whatsapp: wppLimpo, email: email?.trim().toLowerCase() || '',
    contratanteNome: cfgMap['contrato_contratante_nome'] || siteConfig.nome,
    contratanteCnpj: cfgMap['contrato_contratante_cnpj'] || '',
    contratanteEndereco: cfgMap['contrato_contratante_endereco'] || '',
    representanteNome: cfgMap['contrato_representante_nome'] || undefined,
    representanteCargo: cfgMap['contrato_representante_cargo'] || undefined,
    foro: cfgMap['contrato_foro'] || undefined,
    logoUrl: cfgMap['site_logo_url'] || siteConfig.logoUrl || undefined,
    clausulasPersonalizadas: cfgMap['contrato_corpo'] || undefined,
    nfDados: nf_dados ?? undefined,
    hash_contrato, ip, assinado_em, numero_registro,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
  }

  // Envia confirmação de texto imediata
  const msg = [
    `📄 *Contrato assinado digitalmente!*`,
    ``,
    `Olá, *${nome.trim().split(' ')[0]}*! Seu contrato foi registrado.`,
    ``,
    `🔖 *Registro:* ${numero_registro}`,
    `📅 *Emissão:* ${new Date(assinado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}`,
    ``,
    `📄 *O PDF será enviado em instantes nesta conversa.*`,
    ``,
    `🔐 Hash: ${hash_contrato.slice(0,16)}...`,
  ].join('\n')
  await enviarWhatsApp(wppLimpo, msg)

  // Gera PDF em background
  gerarEEnviar(dadosGeracao, numero_registro, adminClient).catch(console.error)

  return NextResponse.json({ ok: true, numero_registro, hash_contrato })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const whatsapp = searchParams.get('whatsapp')
  if (!whatsapp) return NextResponse.json(null)
  const adminClient = createServiceRoleClient()
  const { data } = await adminClient.from('contratos')
    .select('numero_registro, hash_contrato, pdf_url, assinado_em')
    .eq('whatsapp', whatsapp.replace(/\D/g,'')).maybeSingle()
  return NextResponse.json(data ?? null)
}
