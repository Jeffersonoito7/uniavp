import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaTenant } from '@/lib/whatsapp'
import { gerarPDFContrato, DadosContratoAVP } from '@/lib/contrato-pdf'
import { getSiteConfig } from '@/lib/site-config'
import { getTenantId } from '@/lib/tenant'
import { rateLimit, LIMITS } from '@/lib/rate-limit'
import { audit, getIp } from '@/lib/audit'
import { captureException } from '@/lib/monitor'
import { getMensagem } from '@/lib/mensagem'
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
    captureException(e, { endpoint: 'contrato/gerarEEnviar', extra: { registro } })
    await adminClient.from('contratos').update({ pdf_status: 'erro' }).eq('numero_registro', registro)
  }
}

export async function POST(req: NextRequest) {
  const ip = getIp(req) ?? 'desconhecido'

  // Rate limit: 3 contratos/min por IP
  const rl = await rateLimit(`contrato:${ip}`, LIMITS.contrato)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
    )
  }

  const body = await req.json()
  const { nome, cpf, cnpj_mei, sede_mei, sem_cnpj, whatsapp, email, aluno_id, clausulas_aceitas, nf_dados, assinatura_base64, data_nascimento, estado_civil, nacionalidade, regra_bonificacao } = body

  if (!nome || !whatsapp || (!sem_cnpj && (!cnpj_mei || !sede_mei)))
    return NextResponse.json({ error: 'Nome, WhatsApp e CNPJ MEI são obrigatórios.' }, { status: 400 })

  const adminClient = createServiceRoleClient()
  const host = req.headers.get('host')?.replace(/:\d+$/, '') ?? ''
  const tenantId = await getTenantId(host)
  const wppLimpo = whatsapp.replace(/\D/g,'')

  // Já assinou?
  const { data: existente } = await adminClient.from('contratos')
    .select('numero_registro, hash_contrato, pdf_url')
    .eq('whatsapp', wppLimpo).maybeSingle()
  if (existente) return NextResponse.json({ ok: true, ...existente, jaExistia: true })

  // Número sequencial
  const { count } = await adminClient.from('contratos').select('id', { count: 'exact', head: true })
  const numero_registro = `CONT-${String(((count ?? 0) + 1)).padStart(6, '0')}`

  const assinado_em = new Date().toISOString()

  // Hash SHA-256
  const hash_contrato = crypto.createHash('sha256').update(JSON.stringify({
    nome: nome.trim(), cpf: cpf?.replace(/\D/g,'') || null,
    cnpj_mei: sem_cnpj ? null : cnpj_mei?.replace(/\D/g,'') || null,
    sede_mei: sem_cnpj ? null : sede_mei,
    whatsapp: wppLimpo, email: email?.trim().toLowerCase(),
    numero_registro, assinado_em, ip,
  }), 'utf8').digest('hex')

  const dadosPessoais = { data_nascimento: data_nascimento || null, estado_civil: estado_civil || null, nacionalidade: nacionalidade || null }

  const clausulasBase = {
    clausulas: Array.isArray(clausulas_aceitas) ? clausulas_aceitas : [],
    dados_pessoais: dadosPessoais,
    regra_bonificacao: regra_bonificacao || null,
    sem_cnpj: !!sem_cnpj,
  }
  const clausulasPayload = nf_dados ? { ...clausulasBase, nf: nf_dados } : clausulasBase

  const { error } = await adminClient.from('contratos').insert({
    aluno_id: aluno_id ?? null, nome: nome.trim(),
    cpf: cpf?.replace(/\D/g,'') || null,
    cnpj_mei: sem_cnpj ? null : cnpj_mei?.replace(/\D/g,'') || null,
    sede_mei: sem_cnpj ? null : sede_mei || null,
    whatsapp: wppLimpo, email: email?.trim().toLowerCase() || null,
    ip, numero_registro, clausulas_aceitas: clausulasPayload, hash_contrato,
    pdf_status: 'pendente',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Busca configs da contratante
  const [siteConfig, { data: cfgs }] = await Promise.all([
    getSiteConfig(req.headers.get('host') ?? ''),
    adminClient.from('configuracoes').select('chave, valor')
      .in('chave', ['contrato_contratante_nome','contrato_contratante_cnpj','contrato_contratante_endereco','contrato_representante_nome','contrato_representante_cargo','contrato_foro','contrato_logo_url','contrato_corpo','contrato_assinatura_contratante_url']),
  ])
  const cfgMap: Record<string,string> = {}
  for (const c of cfgs ?? []) cfgMap[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor ?? '').replace(/"/g,'')

  // Salva imagem da assinatura no storage
  let assinaturaUrl: string | null = null
  if (assinatura_base64) {
    try {
      const base64Data = assinatura_base64.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      const sigPath = `assinaturas/${numero_registro}.png`
      await adminClient.storage.from('documentos').upload(sigPath, imageBuffer, { contentType: 'image/png', upsert: true })
      const { data: urlData } = adminClient.storage.from('documentos').getPublicUrl(sigPath)
      assinaturaUrl = urlData?.publicUrl ?? null
    } catch { /* segue sem a imagem */ }
  }

  const dadosGeracao: DadosContratoAVP = {
    nome: nome.trim(), cpf: cpf?.replace(/\D/g,'') || null,
    cnpjMei: sem_cnpj ? '' : cnpj_mei?.replace(/\D/g,'') || '',
    sedeMei: sem_cnpj ? 'Pendente — CNPJ sera informado apos abertura' : sede_mei || '',
    whatsapp: wppLimpo, email: email?.trim().toLowerCase() || '',
    dataNascimento: data_nascimento || null,
    estadoCivil: estado_civil || null,
    nacionalidade: nacionalidade || null,
    contratanteNome: cfgMap['contrato_contratante_nome'] || siteConfig.nome,
    contratanteCnpj: cfgMap['contrato_contratante_cnpj'] || '',
    contratanteEndereco: cfgMap['contrato_contratante_endereco'] || '',
    representanteNome: cfgMap['contrato_representante_nome'] || undefined,
    representanteCargo: cfgMap['contrato_representante_cargo'] || undefined,
    foro: cfgMap['contrato_foro'] || undefined,
    logoUrl: undefined,
    contratoLogoUrl: cfgMap['contrato_logo_url'] || null,
    clausulasPersonalizadas: cfgMap['contrato_corpo'] || undefined,
    nfDados: nf_dados ?? undefined,
    assinaturaBase64: assinatura_base64 ?? undefined,
    assinaturaContratanteUrl: cfgMap['contrato_assinatura_contratante_url'] || undefined,
    regraBonificacao: regra_bonificacao || null,
    hash_contrato, ip, assinado_em, numero_registro,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
  }

  const instancia = await getInstanciaTenant(tenantId, adminClient)
  const msg = await getMensagem('contrato_assinado', {
    primeiroNome: nome.trim().split(' ')[0],
    numeroRegistro: numero_registro,
    assinadoEm: new Date(assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    hashParcial: hash_contrato.slice(0, 16),
  }, adminClient, tenantId)
  await enviarWhatsApp(wppLimpo, msg, instancia)

  // Salva job na fila — processado pelo cron /api/cron/processar-pdfs a cada 2 min
  const { data: contratoCriado } = await adminClient.from('contratos')
    .select('id').eq('numero_registro', numero_registro).maybeSingle()
  if (contratoCriado?.id) {
    await adminClient.from('pdf_jobs').insert({
      contrato_id: contratoCriado.id,
      tenant_id: tenantId ?? null,
      status: 'pendente',
    }).then(null, (e: unknown) => captureException(e, { endpoint: 'contrato/POST:pdf_jobs', tenantId: tenantId ?? undefined }))
  } else {
    // Fallback: se nao conseguiu buscar o id, ainda tenta gerar direto (melhor que nada)
    gerarEEnviar(dadosGeracao, numero_registro, adminClient).catch(e =>
      captureException(e, { endpoint: 'contrato/POST:gerarEEnviar', tenantId: tenantId ?? undefined })
    )
  }

  await audit({
    acao: 'contrato.assinado',
    entidade: 'contratos',
    entidade_id: numero_registro,
    tenant_id: tenantId,
    usuario_tipo: 'sistema',
    dados_novos: { nome: nome.trim(), whatsapp: wppLimpo, numero_registro, hash_contrato: hash_contrato.slice(0, 16) },
    ip,
  })

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
