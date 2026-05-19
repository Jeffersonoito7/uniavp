import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { gerarPDFContratoCNCPV } from '@/lib/cncpv-pdf'
import { getSiteConfig } from '@/lib/site-config'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const TERMOS = [
  'Não prometerei coberturas ou benefícios que a associação não oferece, sob pena de rescisão e reembolso de bônus.',
  'Manterei exclusividade com a CONTRATANTE e não atuarei em associações concorrentes de proteção veicular enquanto o contrato vigorar.',
  'Não usarei o nome, logotipo ou marca da associação em publicações sem autorização expressa (multa de R$2.000 por publicação indevida).',
  'Não registrarei filiações em nome de cônjuge, parente ou terceiros para obter vantagem — esta conduta é considerada fraude.',
  'Estou ciente de que se o associado não pagar o 1º boleto, 1 placa será descontada da minha meta no mês seguinte.',
  'Se receber o bônus de plotagem de veículo, manterei a plotagem por no mínimo 6 meses — caso contrário, devolverei todos os valores recebidos.',
  'Inatividade superior a 10 dias corridos sem intermediar negócios constitui motivo de rescisão automática do contrato.',
  'Caso não preste suporte, treinamento e engajamento adequados à minha equipe, a associação poderá redistribuir os consultores sem minha anuência.',
  'Mantenho sigilo de 5 anos sobre processos, estratégias, valores e base de clientes da associação, mesmo após o encerramento do contrato.',
  'Não captarei associados de outras associações nem levarei minha base de clientes para concorrentes — multa de 40 salários mínimos.',
]

async function enviarPDFWhatsApp(numero: string, pdfBytes: Uint8Array, nomeArquivo: string, instancia?: string | null): Promise<boolean> {
  const EVO_URL = process.env.EVOLUTION_API_URL
  const EVO_KEY = process.env.EVOLUTION_API_KEY
  const EVO_INSTANCE = instancia || process.env.EVOLUTION_API_INSTANCE
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE) return false

  const limpo = numero.replace(/\D/g, '')
  const numDDI = limpo.startsWith('55') ? limpo : `55${limpo}`

  try {
    const base64 = Buffer.from(pdfBytes).toString('base64')
    const res = await fetch(`${EVO_URL}/message/sendMedia/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({
        number: numDDI,
        mediatype: 'document',
        mimetype: 'application/pdf',
        media: base64,
        fileName: nomeArquivo,
        caption: '📄 Seu contrato CNCPV assinado digitalmente está anexo.',
      }),
    })
    return res.ok
  } catch { return false }
}

async function salvarPDFStorage(adminClient: ReturnType<typeof createServiceRoleClient>, pdfBytes: Uint8Array, numero_registro: string): Promise<string | null> {
  try {
    const path = `cncpv/${numero_registro}.pdf`
    const { error } = await adminClient.storage
      .from('documentos')
      .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })
    if (error) return null
    const { data } = adminClient.storage.from('documentos').getPublicUrl(path)
    return data?.publicUrl ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome, cpf, whatsapp, email, aluno_id, termos_aceitos } = body

  if (!nome || !whatsapp || !email) {
    return NextResponse.json({ error: 'Nome, WhatsApp e e-mail são obrigatórios.' }, { status: 400 })
  }

  if (!Array.isArray(termos_aceitos) || termos_aceitos.length < TERMOS.length) {
    return NextResponse.json({ error: 'Todos os termos devem ser aceitos.' }, { status: 400 })
  }

  const adminClient = createServiceRoleClient()

  // Verifica se já assinou — retorna URL do PDF se existir
  const wppLimpo = whatsapp.replace(/\D/g, '')
  const { data: existente } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('numero_registro, assinado_em, hash_contrato, pdf_url')
    .eq('whatsapp', wppLimpo)
    .maybeSingle()

  if (existente) {
    return NextResponse.json({
      ok: true,
      numero_registro: existente.numero_registro,
      hash_contrato: existente.hash_contrato,
      pdf_url: existente.pdf_url,
      jaExistia: true,
    })
  }

  // Sequencial
  const { count } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('id', { count: 'exact', head: true })
  const seq = ((count ?? 0) + 1)
  const numero_registro = `CNCPV-${String(seq).padStart(6, '0')}`

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'desconhecido'

  const assinado_em = new Date().toISOString()

  // Hash SHA-256
  const conteudoHash = JSON.stringify({
    nome: nome.trim(),
    cpf: cpf?.replace(/\D/g, '') || null,
    whatsapp: wppLimpo,
    email: email.trim().toLowerCase(),
    numero_registro,
    assinado_em,
    ip,
    termos: TERMOS,
  })
  const hash_contrato = crypto.createHash('sha256').update(conteudoHash, 'utf8').digest('hex')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uni.avpoficial.com.br'
  const siteConfig = await getSiteConfig()

  // Gera PDF profissional
  let pdf_url: string | null = null
  try {
    const pdfBytes = await gerarPDFContratoCNCPV({
      nome: nome.trim(),
      cpf: cpf?.replace(/\D/g, '') || null,
      whatsapp: wppLimpo,
      email: email.trim().toLowerCase(),
      numero_registro,
      hash_contrato,
      ip,
      assinado_em,
      appUrl,
      siteNome: siteConfig.nome,
    })

    // Salva no Storage (via do sistema)
    pdf_url = await salvarPDFStorage(adminClient, pdfBytes, numero_registro)

    // Envia PDF via WhatsApp (via do consultor)
    const nomeArquivo = `Contrato_CNCPV_${numero_registro}.pdf`
    await enviarPDFWhatsApp(wppLimpo, pdfBytes, nomeArquivo)
  } catch (e) {
    console.error('Erro ao gerar/enviar PDF CNCPV:', e)
  }

  // Salva no banco
  const { error } = await (adminClient.from('cncpv_assinaturas') as any).insert({
    aluno_id: aluno_id ?? null,
    nome: nome.trim(),
    cpf: cpf?.replace(/\D/g, '') || null,
    whatsapp: wppLimpo,
    email: email.trim().toLowerCase(),
    ip,
    numero_registro,
    termos_aceitos,
    hash_contrato,
    pdf_url,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mensagem de texto complementar
  const msgWpp = [
    `🪪 *CNCPV — Contrato assinado com sucesso!*`,
    ``,
    `Olá, *${nome.trim().split(' ')[0]}*! Seu contrato e carteira profissional foram emitidos.`,
    ``,
    `📋 *Registro:* ${numero_registro}`,
    `📅 *Emissão:* ${new Date(assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    ``,
    `🔐 *Hash SHA-256:*`,
    `${hash_contrato.slice(0, 32)}`,
    `${hash_contrato.slice(32)}`,
    ``,
    `✅ *Verificar autenticidade:*`,
    `${appUrl}/cncpv/verificar/${numero_registro}`,
    ``,
    `_Validade jurídica: MP 2.200-2/2001 e Art. 107 do Código Civil Brasileiro._`,
  ].join('\n')

  await enviarWhatsApp(wppLimpo, msgWpp)

  return NextResponse.json({ ok: true, numero_registro, hash_contrato, pdf_url })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const registro = searchParams.get('registro')
  const whatsapp = searchParams.get('whatsapp')

  const adminClient = createServiceRoleClient()

  if (registro) {
    const { data } = await (adminClient.from('cncpv_assinaturas') as any)
      .select('nome, numero_registro, assinado_em, cpf, hash_contrato, pdf_url')
      .eq('numero_registro', registro)
      .maybeSingle()
    return NextResponse.json(data ?? null)
  }

  if (whatsapp) {
    const { data } = await (adminClient.from('cncpv_assinaturas') as any)
      .select('nome, numero_registro, assinado_em, hash_contrato, pdf_url')
      .eq('whatsapp', whatsapp.replace(/\D/g, ''))
      .maybeSingle()
    return NextResponse.json(data ?? null)
  }

  return NextResponse.json(null)
}
