import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'

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

export type DadosContrato = {
  nome: string
  cpf: string | null
  whatsapp: string
  email: string
  numero_registro: string
  hash_contrato: string
  ip: string
  assinado_em: string
  appUrl: string
  siteNome: string
  nomeAssociacao?: string   // nome exibido no contrato (fallback: siteNome)
  // Testemunha
  testemunhaNome?: string
  testemunhaCargo?: string
  testemunhaEmpresa?: string
  // Logos (URLs públicas)
  logoUrl?: string          // header
  logoEsquerda?: string     // rodapé esquerda
  logoDireita?: string      // rodapé direita
  assinaturaUrl?: string    // imagem da assinatura
  // Cores (hex)
  corPrimaria?: string      // verde padrão: #02A153
  corSecundaria?: string    // dourado padrão: #c8a535
}

function hexToRgb(hex: string): ReturnType<typeof rgb> {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b)
}

async function carregarImagem(pdfDoc: PDFDocument, url: string) {
  try {
    const resp = await fetch(url)
    const bytes = await resp.arrayBuffer()
    const ct = resp.headers.get('content-type') || ''
    return ct.includes('png')
      ? await pdfDoc.embedPng(new Uint8Array(bytes))
      : await pdfDoc.embedJpg(new Uint8Array(bytes))
  } catch { return null }
}

function wrapText(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

function formatCPF(cpf: string | null): string {
  if (!cpf) return 'Não informado'
  const d = cpf.replace(/\D/g, '')
  return d.length === 11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : cpf
}

function formatWpp(w: string): string {
  const d = w.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return w
}

function cabecalhoPagina(
  page: PDFPage, bold: PDFFont, regular: PDFFont,
  width: number, height: number,
  verde: ReturnType<typeof rgb>, dourado: ReturnType<typeof rgb>, branco: ReturnType<typeof rgb>,
  registro: string, siteNome: string, isPrimeira = false
) {
  const headerH = isPrimeira ? 72 : 48
  page.drawRectangle({ x: 0, y: height - headerH, width, height: headerH, color: verde })
  page.drawRectangle({ x: 0, y: height - headerH - 3, width, height: 3, color: dourado })

  if (isPrimeira) {
    page.drawText('CNCPV', { x: 48, y: height - 34, size: 26, font: bold, color: branco })
    page.drawText('Carteira Nacional do Consultor de Proteção Veicular', { x: 48, y: height - 52, size: 10, font: regular, color: rgb(0.85, 1, 0.9) })
    page.drawText(siteNome.toUpperCase(), { x: 48, y: height - 65, size: 8, font: regular, color: rgb(0.7, 0.95, 0.8) })
  } else {
    page.drawText('CNCPV', { x: 48, y: height - 22, size: 14, font: bold, color: branco })
    page.drawText('Carteira Nacional do Consultor de Proteção Veicular', { x: 48, y: height - 36, size: 8, font: regular, color: rgb(0.85, 1, 0.9) })
  }

  const rW = bold.widthOfTextAtSize(registro, 11)
  page.drawText(registro, { x: width - 48 - rW, y: height - (isPrimeira ? 30 : 22), size: 11, font: bold, color: branco })
  const pageLabel = `cncpv.com.br/verificar/${registro}`
  const pW = regular.widthOfTextAtSize(pageLabel, 7.5)
  page.drawText(pageLabel, { x: width - 48 - pW, y: height - (isPrimeira ? 48 : 38), size: 7.5, font: regular, color: rgb(0.8, 0.95, 0.85) })
}

function rodape(
  page: PDFPage, regular: PDFFont, bold: PDFFont,
  width: number, verde: ReturnType<typeof rgb>, dourado: ReturnType<typeof rgb>,
  registro: string, siteNome: string, assinado_em: string
) {
  page.drawRectangle({ x: 0, y: 0, width, height: 36, color: verde })
  page.drawRectangle({ x: 0, y: 36, width, height: 2, color: dourado })
  const linha1 = `${siteNome} · CNCPV ${registro} · Emitido em ${new Date(assinado_em).toLocaleDateString('pt-BR')}`
  const l1W = regular.widthOfTextAtSize(linha1, 7)
  page.drawText(linha1, { x: (width - l1W) / 2, y: 22, size: 7, font: regular, color: rgb(0.9, 1, 0.95) })
  const linha2 = `Validade jurídica: MP 2.200-2/2001 · Art. 107 do Código Civil · Lei 14.063/2020`
  const l2W = regular.widthOfTextAtSize(linha2, 6.5)
  page.drawText(linha2, { x: (width - l2W) / 2, y: 10, size: 6.5, font: regular, color: rgb(0.75, 0.95, 0.82) })
}

export async function gerarPDFContratoCNCPV(dados: DadosContrato): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const verde = dados.corPrimaria ? hexToRgb(dados.corPrimaria) : rgb(0.008, 0.631, 0.325)
  const dourado = dados.corSecundaria ? hexToRgb(dados.corSecundaria) : rgb(0.78, 0.647, 0.204)
  const preto = rgb(0.08, 0.08, 0.08)
  const cinzaE = rgb(0.35, 0.35, 0.35)
  const cinzaL = rgb(0.93, 0.93, 0.93)
  const branco = rgb(1, 1, 1)
  const verdeEscuro = dados.corPrimaria ? hexToRgb(dados.corPrimaria) : rgb(0.004, 0.435, 0.22)
  const nomeExibido = dados.nomeAssociacao || dados.siteNome

  const verUrl = `https://cncpv.com.br/verificar/${dados.numero_registro}`
  const width = 595.28
  const height = 841.89
  const M = 48

  // QR Code server-side
  const qrDataUrl = await QRCode.toDataURL(verUrl, {
    errorCorrectionLevel: 'H', margin: 1, width: 220,
    color: { dark: '#141414', light: '#ffffff' },
  })
  const qrBytes = Buffer.from(qrDataUrl.replace('data:image/png;base64,', ''), 'base64')
  const qrImage = await pdfDoc.embedPng(qrBytes)

  // Logos em paralelo
  const [logoImage, logoEsqImg, logoDirImg, assinaturaImg] = await Promise.all([
    dados.logoUrl ? carregarImagem(pdfDoc, dados.logoUrl) : Promise.resolve(null),
    dados.logoEsquerda ? carregarImagem(pdfDoc, dados.logoEsquerda) : Promise.resolve(null),
    dados.logoDireita ? carregarImagem(pdfDoc, dados.logoDireita) : Promise.resolve(null),
    dados.assinaturaUrl ? carregarImagem(pdfDoc, dados.assinaturaUrl) : Promise.resolve(null),
  ])

  // ── PÁGINA 1: IDENTIFICAÇÃO + CLÁUSULAS ─────────────────────────────
  let page = pdfDoc.addPage([width, height])
  cabecalhoPagina(page, bold, regular, width, height, verde, dourado, branco, dados.numero_registro, nomeExibido, true)

  // Logo do cliente no header
  if (logoImage) {
    const logoDims = logoImage.scaleToFit(90, 38)
    page.drawImage(logoImage, { x: width - M - logoDims.width, y: height - 20 - logoDims.height, ...logoDims, opacity: 0.92 })
  }

  let y = height - 90

  // Título do documento
  page.drawText('CONTRATO DE ADESÃO E CÓDIGO DE CONDUTA PROFISSIONAL', {
    x: M, y, size: 12.5, font: bold, color: preto,
  })
  y -= 16
  page.drawText('Documento assinado eletronicamente — autenticidade verificável em cncpv.com.br', {
    x: M, y, size: 8.5, font: oblique, color: cinzaE,
  })
  y -= 22
  page.drawRectangle({ x: M, y, width: width - M * 2, height: 1, color: dourado })
  y -= 20

  // Box dados do consultor
  const boxH = 148
  page.drawRectangle({ x: M, y: y - boxH, width: width - M * 2, height: boxH, color: rgb(0.97, 0.99, 0.98), borderColor: verde, borderWidth: 1 })
  page.drawRectangle({ x: M, y: y - 28, width: width - M * 2, height: 28, color: verde })
  page.drawText('PARTE CONTRATANTE — CONSULTOR(A)', { x: M + 12, y: y - 18, size: 9.5, font: bold, color: branco })
  y -= 42

  const col2 = M + (width - M * 2) / 2
  const pares = [
    [['Nome Completo', dados.nome.toUpperCase()], ['CPF', formatCPF(dados.cpf)]],
    [['WhatsApp', formatWpp(dados.whatsapp)], ['E-mail', dados.email]],
  ]
  for (const par of pares) {
    for (let c = 0; c < 2; c++) {
      const cx = c === 0 ? M + 12 : col2 + 12
      page.drawText(par[c][0], { x: cx, y, size: 8, font: bold, color: cinzaE })
      const val = par[c][1].length > 38 ? par[c][1].slice(0, 38) + '…' : par[c][1]
      page.drawText(val, { x: cx, y: y - 14, size: 10.5, font: bold, color: preto })
    }
    y -= 34
  }
  y -= 12

  page.drawRectangle({ x: M, y, width: width - M * 2, height: 1, color: cinzaL })
  y -= 18

  // Introdução
  const intro = `Eu, ${dados.nome}, qualificado(a) acima, declaro ter lido, compreendido e aceito integralmente os termos deste Contrato de Adesão e Código de Conduta Profissional, comprometendo-me a cumprir todas as obrigações nele descritas como condição para exercer a atividade de Consultor(a) de Proteção Veicular.`
  for (const line of wrapText(intro, width - M * 2, regular, 9.5)) {
    page.drawText(line, { x: M, y, size: 9.5, font: regular, color: preto })
    y -= 13
  }
  y -= 12

  page.drawRectangle({ x: M, y, width: width - M * 2, height: 1, color: cinzaL })
  y -= 20

  page.drawText('CLÁUSULAS E CONDIÇÕES', { x: M, y, size: 11.5, font: bold, color: verde })
  y -= 18

  // Cláusulas
  for (let i = 0; i < TERMOS.length; i++) {
    if (y < 90) {
      rodape(page, regular, bold, width, verde, dourado, dados.numero_registro, nomeExibido, dados.assinado_em)
      page = pdfDoc.addPage([width, height])
      cabecalhoPagina(page, bold, regular, width, height, verde, dourado, branco, dados.numero_registro, nomeExibido)
      y = height - 72
    }

    page.drawRectangle({ x: M, y: y - 2, width: 22, height: 22, color: verde })
    page.drawText(`${i + 1}`, { x: M + (i < 9 ? 8 : 4), y: y + 2, size: 11, font: bold, color: branco })

    const lines = wrapText(`Cláusula ${i + 1}ª — ${TERMOS[i]}`, width - M * 2 - 32, regular, 9.5)
    const bH = lines.length * 13 + 14
    page.drawRectangle({ x: M + 28, y: y - bH + 20, width: width - M * 2 - 28, height: bH, color: i % 2 === 0 ? rgb(0.97, 0.99, 0.98) : branco, borderColor: cinzaL, borderWidth: 0.5 })

    let cy = y + 4
    page.drawText(`Cláusula ${i + 1}ª`, { x: M + 36, y: cy, size: 8, font: bold, color: verde })
    cy -= 13
    for (const l of wrapText(TERMOS[i], width - M * 2 - 44, regular, 9.5)) {
      page.drawText(l, { x: M + 36, y: cy, size: 9.5, font: regular, color: preto })
      cy -= 13
    }
    y -= bH + 6
  }

  rodape(page, regular, bold, width, verde, dourado, dados.numero_registro, nomeExibido, dados.assinado_em)

  // ── PÁGINA FINAL: ASSINATURA ─────────────────────────────────────────
  page = pdfDoc.addPage([width, height])
  cabecalhoPagina(page, bold, regular, width, height, verde, dourado, branco, dados.numero_registro, nomeExibido)
  y = height - 82

  page.drawText('REGISTRO DE ASSINATURA ELETRÔNICA', { x: M, y, size: 13, font: bold, color: preto })
  y -= 8
  page.drawRectangle({ x: M, y, width: width - M * 2, height: 3, color: dourado })
  y -= 20
  page.drawText('Este documento foi assinado eletronicamente e seu conteúdo está protegido por hash criptográfico SHA-256.', { x: M, y, size: 8.5, font: oblique, color: cinzaE })
  page.drawText('Qualquer alteração invalida automaticamente a assinatura.', { x: M, y: y - 12, size: 8.5, font: oblique, color: cinzaE })
  y -= 32

  // Logos laterais na página de assinatura
  if (logoEsqImg || logoDirImg) {
    const logoH = 36
    const logoY = y + 30
    if (logoEsqImg) {
      const d = logoEsqImg.scaleToFit(110, logoH)
      page.drawImage(logoEsqImg, { x: M, y: logoY - d.height / 2, ...d, opacity: 0.88 })
    }
    if (logoDirImg) {
      const d = logoDirImg.scaleToFit(110, logoH)
      page.drawImage(logoDirImg, { x: width - M - d.width, y: logoY - d.height / 2, ...d, opacity: 0.88 })
    }
  }

  // Imagem de assinatura eletrônica do responsável
  if (assinaturaImg) {
    const d = assinaturaImg.scaleToFit(160, 50)
    page.drawImage(assinaturaImg, { x: M + 12, y: y - 8 - d.height, ...d, opacity: 0.9 })
  }

  // Bloco signatário
  const bSigH = 130
  page.drawRectangle({ x: M, y: y - bSigH, width: (width - M * 2) / 2 - 8, height: bSigH, color: rgb(0.97, 0.99, 0.98), borderColor: verde, borderWidth: 1 })
  page.drawRectangle({ x: M, y: y - 28, width: (width - M * 2) / 2 - 8, height: 28, color: verdeEscuro })
  page.drawText('SIGNATÁRIO', { x: M + 12, y: y - 18, size: 9.5, font: bold, color: branco })

  let sy = y - 44
  for (const [lbl, val] of [
    ['Nome', dados.nome.toUpperCase()],
    ['CPF', formatCPF(dados.cpf)],
    ['WhatsApp', formatWpp(dados.whatsapp)],
    ['Assinou em', new Date(dados.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })],
  ]) {
    page.drawText(lbl, { x: M + 12, y: sy, size: 7.5, font: bold, color: cinzaE })
    page.drawText(val.length > 32 ? val.slice(0, 32) + '…' : val, { x: M + 12, y: sy - 12, size: 9.5, font: bold, color: preto })
    sy -= 26
  }

  // Bloco testemunha
  const txOff = (width - M * 2) / 2 + M + 8
  const tesNome = dados.testemunhaNome || 'Testemunha Eletrônica'
  const tesCargo = dados.testemunhaCargo || 'Diretor(a)'
  const tesEmpresa = dados.testemunhaEmpresa || dados.siteNome

  page.drawRectangle({ x: txOff, y: y - bSigH, width: (width - M * 2) / 2 - 8, height: bSigH, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.3, 0.3, 0.8), borderWidth: 1 })
  page.drawRectangle({ x: txOff, y: y - 28, width: (width - M * 2) / 2 - 8, height: 28, color: rgb(0.2, 0.2, 0.6) })
  page.drawText('TESTEMUNHA ELETRÔNICA', { x: txOff + 12, y: y - 18, size: 9.5, font: bold, color: branco })

  let ty = y - 44
  for (const [lbl, val] of [
    ['Nome', tesNome.toUpperCase()],
    ['Cargo', tesCargo.toUpperCase()],
    ['Empresa', tesEmpresa.toUpperCase()],
    ['Registrado em', new Date(dados.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })],
  ]) {
    page.drawText(lbl, { x: txOff + 12, y: ty, size: 7.5, font: bold, color: cinzaE })
    page.drawText(val.length > 28 ? val.slice(0, 28) + '…' : val, { x: txOff + 12, y: ty - 12, size: 9.5, font: bold, color: preto })
    ty -= 26
  }

  y -= bSigH + 24

  // Metadados técnicos
  page.drawRectangle({ x: M, y: y - 68, width: width - M * 2, height: 68, color: rgb(0.97, 0.97, 0.97), borderColor: cinzaL, borderWidth: 0.5 })
  page.drawText('DADOS TÉCNICOS DA ASSINATURA', { x: M + 12, y: y - 14, size: 8.5, font: bold, color: preto })

  const metaDados = [
    ['Nº de Registro', dados.numero_registro],
    ['Endereço IP', dados.ip],
    ['Data/Hora (UTC)', dados.assinado_em],
  ]
  let mx = M + 12; let mxStep = (width - M * 2 - 24) / 3
  for (const [l, v] of metaDados) {
    page.drawText(l + ':', { x: mx, y: y - 30, size: 7.5, font: bold, color: cinzaE })
    page.drawText(v.length > 28 ? v.slice(0, 28) : v, { x: mx, y: y - 43, size: 9, font: bold, color: preto })
    mx += mxStep
  }
  y -= 84

  // Hash SHA-256
  page.drawRectangle({ x: M, y: y - 52, width: width - M * 2, height: 52, color: rgb(0.05, 0.06, 0.09), borderColor: dourado, borderWidth: 1 })
  page.drawText('HASH SHA-256 — IMPRESSÃO DIGITAL DO CONTRATO', { x: M + 12, y: y - 14, size: 8, font: bold, color: dourado })
  page.drawText(dados.hash_contrato.slice(0, 45), { x: M + 12, y: y - 28, size: 8.5, font: bold, color: rgb(0.8, 0.82, 0.85) })
  page.drawText(dados.hash_contrato.slice(45), { x: M + 12, y: y - 42, size: 8.5, font: bold, color: rgb(0.8, 0.82, 0.85) })
  y -= 68

  // QR + verificação
  const qrSize = 112
  page.drawRectangle({ x: M - 4, y: y - qrSize - 6, width: qrSize + 8, height: qrSize + 8, color: branco, borderColor: dourado, borderWidth: 1.5 })
  page.drawImage(qrImage, { x: M, y: y - qrSize, width: qrSize, height: qrSize })
  page.drawText('ESCANEAR PARA VERIFICAR', { x: M, y: y - qrSize - 18, size: 7, font: bold, color: cinzaE })

  const qrRX = M + qrSize + 20
  page.drawText('URL DE VERIFICAÇÃO OFICIAL:', { x: qrRX, y: y - 12, size: 8, font: bold, color: cinzaE })
  page.drawText(verUrl, { x: qrRX, y: y - 26, size: 10, font: bold, color: verde })
  page.drawText('Este QR code e esta URL permitem a qualquer pessoa verificar', { x: qrRX, y: y - 44, size: 8, font: regular, color: cinzaE })
  page.drawText('a autenticidade deste documento em tempo real.', { x: qrRX, y: y - 55, size: 8, font: regular, color: cinzaE })
  page.drawText('O hash acima é a impressão digital criptográfica do contrato.', { x: qrRX, y: y - 66, size: 8, font: regular, color: cinzaE })
  page.drawText('Qualquer alteração no conteúdo invalida a assinatura.', { x: qrRX, y: y - 77, size: 8, font: regular, color: cinzaE })

  // Validade jurídica
  y -= qrSize + 28
  page.drawRectangle({ x: M, y: y - 42, width: width - M * 2, height: 42, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.7, 0.7, 0.9), borderWidth: 0.5 })
  page.drawText('VALIDADE JURÍDICA', { x: M + 12, y: y - 12, size: 8.5, font: bold, color: preto })
  page.drawText('Assinado eletronicamente conforme a Medida Provisória 2.200-2/2001, o Art. 107 do Código Civil Brasileiro', { x: M + 12, y: y - 25, size: 7.5, font: regular, color: cinzaE })
  page.drawText('e a Lei 14.063/2020. Este documento possui presunção de autoria e integridade nos termos da legislação vigente.', { x: M + 12, y: y - 36, size: 7.5, font: regular, color: cinzaE })

  rodape(page, regular, bold, width, verde, dourado, dados.numero_registro, nomeExibido, dados.assinado_em)

  // Metadados do PDF
  pdfDoc.setTitle(`Contrato CNCPV — ${dados.numero_registro} — ${dados.nome}`)
  pdfDoc.setAuthor(dados.siteNome)
  pdfDoc.setSubject('Carteira Nacional do Consultor de Proteção Veicular')
  pdfDoc.setKeywords(['CNCPV', 'contrato', 'proteção veicular', dados.numero_registro, 'assinatura eletrônica'])
  pdfDoc.setCreationDate(new Date(dados.assinado_em))
  pdfDoc.setModificationDate(new Date(dados.assinado_em))
  pdfDoc.setCreator('cncpv.com.br')
  pdfDoc.setProducer('CNCPV Digital — cncpv.com.br')

  return pdfDoc.save()
}
