import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { enviarEmailCNCPV } from '@/lib/email'
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

async function enviarPDFWhatsApp(numero: string, pdfBytes: Uint8Array, nomeArquivo: string): Promise<boolean> {
  const EVO_URL = process.env.EVOLUTION_API_URL
  const EVO_KEY = process.env.EVOLUTION_API_KEY
  const EVO_INSTANCE = process.env.EVOLUTION_API_INSTANCE
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE) return false
  const limpo = numero.replace(/\D/g, '')
  const numDDI = limpo.startsWith('55') ? limpo : `55${limpo}`
  try {
    const res = await fetch(`${EVO_URL}/message/sendMedia/${EVO_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({
        number: numDDI,
        mediatype: 'document',
        mimetype: 'application/pdf',
        media: Buffer.from(pdfBytes).toString('base64'),
        fileName: nomeArquivo,
        caption: '📄 Seu contrato CNCPV assinado digitalmente.',
      }),
    })
    return res.ok
  } catch { return false }
}

async function salvarPDF(adminClient: ReturnType<typeof createServiceRoleClient>, pdfBytes: Uint8Array, numero_registro: string): Promise<string | null> {
  try {
    const path = `cncpv/${numero_registro}.pdf`
    await adminClient.storage.from('documentos').upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true })
    const { data } = adminClient.storage.from('documentos').getPublicUrl(path)
    return data?.publicUrl ?? null
  } catch { return null }
}

async function gerarEEnviar(dados: {
  nome: string; cpf: string | null; whatsapp: string; email: string
  numero_registro: string; hash_contrato: string; ip: string; assinado_em: string
  appUrl: string; siteNome: string; logoUrl?: string
  testemunhaNome?: string; testemunhaCargo?: string; testemunhaEmpresa?: string
}, adminClient: ReturnType<typeof createServiceRoleClient>) {
  try {
    const pdfBytes = await gerarPDFContratoCNCPV(dados)
    const pdfUrl = await salvarPDF(adminClient, pdfBytes, dados.numero_registro)
    if (pdfUrl) {
      await (adminClient.from('cncpv_assinaturas') as any)
        .update({ pdf_url: pdfUrl, pdf_status: 'gerado' })
        .eq('numero_registro', dados.numero_registro)
    }
    // Via do consultor: WhatsApp + Email (em paralelo)
    const nomeArquivo = `Contrato_CNCPV_${dados.numero_registro}.pdf`
    await Promise.allSettled([
      enviarPDFWhatsApp(dados.whatsapp, pdfBytes, nomeArquivo),
      dados.email ? enviarEmailCNCPV({
        para: dados.email,
        nome: dados.nome,
        numero_registro: dados.numero_registro,
        hash_contrato: dados.hash_contrato,
        assinado_em: dados.assinado_em,
        pdfBytes,
      }) : Promise.resolve(false),
    ])
  } catch (e) {
    console.error('Erro ao gerar/enviar PDF CNCPV:', e)
    await (adminClient.from('cncpv_assinaturas') as any)
      .update({ pdf_status: 'erro' })
      .eq('numero_registro', dados.numero_registro)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome, cpf, whatsapp, email, aluno_id, termos_aceitos } = body

  if (!nome || !whatsapp || !email)
    return NextResponse.json({ error: 'Nome, WhatsApp e e-mail são obrigatórios.' }, { status: 400 })

  if (!Array.isArray(termos_aceitos) || termos_aceitos.length < TERMOS.length)
    return NextResponse.json({ error: 'Todos os termos devem ser aceitos.' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const wppLimpo = whatsapp.replace(/\D/g, '')

  // Já assinou?
  const { data: existente } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('numero_registro, hash_contrato, pdf_url, pdf_status')
    .eq('whatsapp', wppLimpo)
    .maybeSingle()

  if (existente) {
    return NextResponse.json({
      ok: true, numero_registro: existente.numero_registro,
      hash_contrato: existente.hash_contrato, pdf_url: existente.pdf_url, jaExistia: true,
    })
  }

  // Número sequencial
  const { count } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('id', { count: 'exact', head: true })
  const numero_registro = `CNCPV-${String(((count ?? 0) + 1)).padStart(6, '0')}`

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'desconhecido'
  const assinado_em = new Date().toISOString()

  // Hash SHA-256
  const hash_contrato = crypto.createHash('sha256').update(JSON.stringify({
    nome: nome.trim(), cpf: cpf?.replace(/\D/g, '') || null, whatsapp: wppLimpo,
    email: email.trim().toLowerCase(), numero_registro, assinado_em, ip, termos: TERMOS,
  }), 'utf8').digest('hex')

  // ── SALVA NO BANCO IMEDIATAMENTE ────────────────────────────────────
  const { error } = await (adminClient.from('cncpv_assinaturas') as any).insert({
    aluno_id: aluno_id ?? null,
    nome: nome.trim(),
    cpf: cpf?.replace(/\D/g, '') || null,
    whatsapp: wppLimpo,
    email: email.trim().toLowerCase(),
    ip, numero_registro, termos_aceitos, hash_contrato,
    status: 'ativa', pdf_status: 'pendente',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Retorna sucesso imediatamente para o usuário
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uni.avpoficial.com.br'
  const siteConfig = await getSiteConfig(req.headers.get('host') ?? '')

  // Busca config de testemunha e logo do admin
  const { data: cfgs } = await (adminClient.from('configuracoes') as any)
    .select('chave, valor')
    .in('chave', [
      'cncpv_testemunha_nome', 'cncpv_testemunha_cargo', 'cncpv_testemunha_empresa',
      'cncpv_logo_pdf_url', 'cncpv_logo_esquerda', 'cncpv_logo_direita',
      'cncpv_cor_primaria', 'cncpv_cor_secundaria',
      'cncpv_nome_associacao', 'cncpv_assinatura_url',
    ])

  const cfgMap: Record<string, string> = {}
  for (const c of cfgs ?? []) cfgMap[c.chave] = c.valor

  const dadosGeracao = {
    nome: nome.trim(),
    cpf: cpf?.replace(/\D/g, '') || null,
    whatsapp: wppLimpo,
    email: email.trim().toLowerCase(),
    numero_registro, hash_contrato, ip, assinado_em, appUrl,
    siteNome: siteConfig.nome,
    nomeAssociacao: cfgMap['cncpv_nome_associacao'] || undefined,
    testemunhaNome: cfgMap['cncpv_testemunha_nome'] || undefined,
    testemunhaCargo: cfgMap['cncpv_testemunha_cargo'] || undefined,
    testemunhaEmpresa: cfgMap['cncpv_testemunha_empresa'] || undefined,
    logoUrl: cfgMap['cncpv_logo_pdf_url'] || siteConfig.logoUrl || undefined,
    logoEsquerda: cfgMap['cncpv_logo_esquerda'] || undefined,
    logoDireita: cfgMap['cncpv_logo_direita'] || undefined,
    assinaturaUrl: cfgMap['cncpv_assinatura_url'] || undefined,
    corPrimaria: cfgMap['cncpv_cor_primaria'] || undefined,
    corSecundaria: cfgMap['cncpv_cor_secundaria'] || undefined,
  }

  // Envia mensagem de texto imediatamente
  const msgWpp = [
    `🪪 *CNCPV — Contrato assinado!*`,
    ``,
    `Olá, *${nome.trim().split(' ')[0]}*! Seu contrato foi assinado digitalmente.`,
    ``,
    `📋 *Registro:* ${numero_registro}`,
    `📅 *Emissão:* ${new Date(assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    ``,
    `📄 *O PDF do contrato será enviado em instantes nesta conversa.*`,
    ``,
    `✅ *Verificar autenticidade:*`,
    `https://cncpv.com.br/verificar/${numero_registro}`,
    ``,
    `🔐 Hash: ${hash_contrato.slice(0, 16)}...`,
    ``,
    `_Validade jurídica: MP 2.200-2/2001 e Art. 107 do Código Civil._`,
  ].join('\n')
  await enviarWhatsApp(wppLimpo, msgWpp)

  // Gera PDF e envia em background (fire-and-forget)
  gerarEEnviar(dadosGeracao, adminClient).catch(console.error)

  return NextResponse.json({ ok: true, numero_registro, hash_contrato })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const registro = searchParams.get('registro')
  const whatsapp = searchParams.get('whatsapp')
  const adminClient = createServiceRoleClient()

  if (registro) {
    const { data } = await (adminClient.from('cncpv_assinaturas') as any)
      .select('nome, numero_registro, assinado_em, cpf, hash_contrato, pdf_url, status, revogado_em, revogado_motivo')
      .eq('numero_registro', registro)
      .maybeSingle()
    return NextResponse.json(data ?? null)
  }

  if (whatsapp) {
    const { data } = await (adminClient.from('cncpv_assinaturas') as any)
      .select('nome, numero_registro, assinado_em, hash_contrato, pdf_url, status')
      .eq('whatsapp', whatsapp.replace(/\D/g, ''))
      .maybeSingle()
    return NextResponse.json(data ?? null)
  }

  return NextResponse.json(null)
}
