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

type DadosContrato = {
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

export async function gerarPDFContratoCNCPV(dados: DadosContrato): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // Cores
  const verde = rgb(0.008, 0.631, 0.325)
  const verdeEscuro = rgb(0.004, 0.435, 0.22)
  const dourado = rgb(0.78, 0.647, 0.204)
  const preto = rgb(0.08, 0.08, 0.08)
  const cinzaEscuro = rgb(0.3, 0.3, 0.3)
  const cinzaClaro = rgb(0.92, 0.92, 0.92)
  const cinzaMedio = rgb(0.75, 0.75, 0.75)
  const branco = rgb(1, 1, 1)
  const vermelho = rgb(0.8, 0.15, 0.15)

  const verUrl = `${dados.appUrl}/cncpv/verificar/${dados.numero_registro}`

  // Gera QR code como PNG base64
  const qrDataUrl = await QRCode.toDataURL(verUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 200,
    color: { dark: '#141414', light: '#ffffff' },
  })
  const qrBase64 = qrDataUrl.replace('data:image/png;base64,', '')
  const qrImageBytes = Buffer.from(qrBase64, 'base64')
  const qrImage = await pdfDoc.embedPng(qrImageBytes)

  // ── PÁGINA 1: CAPA + DADOS DO CONSULTOR ────────────────────────────
  let page = pdfDoc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  const M = 48 // margem lateral

  // Faixa verde no topo
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: verde })

  // Título no topo
  page.drawText('CNCPV', { x: M, y: height - 34, size: 28, font: fontBold, color: branco })
  page.drawText('Carteira Nacional do Consultor de Proteção Veicular', { x: M, y: height - 54, size: 10, font: fontRegular, color: rgb(0.85, 1, 0.9) })

  // Número de registro no topo direito
  const regText = dados.numero_registro
  const regW = fontBold.widthOfTextAtSize(regText, 20)
  page.drawText(regText, { x: width - M - regW, y: height - 38, size: 20, font: fontBold, color: branco })
  const subReg = 'Nº de Registro'
  const subRegW = fontRegular.widthOfTextAtSize(subReg, 9)
  page.drawText(subReg, { x: width - M - subRegW, y: height - 54, size: 9, font: fontRegular, color: rgb(0.8, 0.95, 0.85) })

  // Linha dourada abaixo do header
  page.drawRectangle({ x: 0, y: height - 84, width, height: 4, color: dourado })

  let y = height - 110

  // Título do documento
  page.drawText('CONTRATO DE ADESÃO E CÓDIGO DE CONDUTA PROFISSIONAL', {
    x: M, y, size: 13, font: fontBold, color: preto,
  })
  y -= 18
  page.drawText('Documento eletrônico com validade jurídica — MP 2.200-2/2001 e Art. 107 do Código Civil Brasileiro', {
    x: M, y, size: 8.5, font: fontOblique, color: cinzaEscuro,
  })
  y -= 24

  // Linha separadora
  page.drawRectangle({ x: M, y, width: width - M * 2, height: 1, color: cinzaMedio })
  y -= 20

  // Box DADOS DO CONSULTOR
  const boxH = 160
  page.drawRectangle({ x: M, y: y - boxH, width: width - M * 2, height: boxH, color: rgb(0.97, 0.99, 0.98), borderColor: rgb(0.008, 0.631, 0.325), borderWidth: 1 })

  // Título do box
  page.drawRectangle({ x: M, y: y - 28, width: width - M * 2, height: 28, color: verde })
  page.drawText('IDENTIFICAÇÃO DO CONSULTOR', { x: M + 12, y: y - 18, size: 10, font: fontBold, color: branco })

  y -= 42
  const col2 = M + (width - M * 2) / 2

  // Campos
  const campos = [
    ['Nome Completo', dados.nome.toUpperCase()],
    ['CPF', formatCPF(dados.cpf)],
  ]
  const campos2 = [
    ['WhatsApp', formatWpp(dados.whatsapp)],
    ['E-mail', dados.email],
  ]
  for (let i = 0; i < campos.length; i++) {
    page.drawText(campos[i][0], { x: M + 12, y, size: 8, font: fontBold, color: cinzaEscuro })
    page.drawText(campos[i][1], { x: M + 12, y: y - 14, size: 11, font: fontBold, color: preto })
    page.drawText(campos2[i][0], { x: col2 + 12, y, size: 8, font: fontBold, color: cinzaEscuro })
    page.drawText(campos2[i][1], { x: col2 + 12, y: y - 14, size: 11, font: fontBold, color: preto })
    y -= 36
  }

  y -= 8

  // Linha separadora
  page.drawRectangle({ x: M, y, width: width - M * 2, height: 1, color: cinzaMedio })
  y -= 20

  // Texto introdutório
  const intro = `Eu, ${dados.nome}, identificado(a) acima, declaro ter lido, compreendido e aceito integralmente os termos e condições estabelecidos neste Contrato de Adesão e Código de Conduta Profissional, comprometendo-me a cumprir todas as obrigações nele descritas como condição para exercer a função de Consultor(a) de Proteção Veicular credenciado(a).`
  const introLines = wrapText(intro, width - M * 2, fontRegular, 10)
  for (const line of introLines) {
    page.drawText(line, { x: M, y, size: 10, font: fontRegular, color: preto })
    y -= 14
  }
  y -= 10

  // Linha separadora
  page.drawRectangle({ x: M, y, width: width - M * 2, height: 1, color: cinzaMedio })
  y -= 20

  // Título dos termos
  page.drawText('CLÁUSULAS E CONDIÇÕES', { x: M, y, size: 12, font: fontBold, color: verde })
  y -= 20

  // Termos
  for (let i = 0; i < TERMOS.length; i++) {
    if (y < 100) {
      // Nova página
      page = pdfDoc.addPage([595.28, 841.89])
      adicionarCabecalhoSecundario(page, fontBold, fontRegular, width, height, verde, dourado, branco, dados.numero_registro)
      y = height - 100
    }

    // Número da cláusula
    page.drawRectangle({ x: M, y: y - 2, width: 22, height: 22, color: verde })
    page.drawText(`${i + 1}`, { x: M + (i < 9 ? 8 : 4), y: y + 2, size: 11, font: fontBold, color: branco })

    // Texto da cláusula
    const clausulaLines = wrapText(`Cláusula ${i + 1}ª — ${TERMOS[i]}`, width - M * 2 - 32, fontRegular, 9.5)
    const clausulaH = clausulaLines.length * 13 + 12
    page.drawRectangle({ x: M + 28, y: y - clausulaH + 18, width: width - M * 2 - 28, height: clausulaH, color: i % 2 === 0 ? rgb(0.97, 0.99, 0.98) : branco, borderColor: cinzaClaro, borderWidth: 0.5 })

    let cy = y + 4
    page.drawText(`Cláusula ${i + 1}ª`, { x: M + 36, y: cy, size: 8, font: fontBold, color: verde })
    cy -= 13
    for (const line of clausulaLines.slice(1)) {
      page.drawText(line, { x: M + 36, y: cy, size: 9.5, font: fontRegular, color: preto })
      cy -= 13
    }
    y -= (clausulaH + 8)
  }

  // ── PÁGINA FINAL: ASSINATURA E AUTENTICAÇÃO ─────────────────────────
  page = pdfDoc.addPage([595.28, 841.89])
  adicionarCabecalhoSecundario(page, fontBold, fontRegular, width, height, verde, dourado, branco, dados.numero_registro)
  y = height - 110

  // Título
  page.drawText('ASSINATURA ELETRÔNICA E AUTENTICAÇÃO', { x: M, y, size: 13, font: fontBold, color: preto })
  y -= 8
  page.drawRectangle({ x: M, y, width: width - M * 2, height: 2, color: dourado })
  y -= 24

  // Box de dados de assinatura
  const assinH = 180
  page.drawRectangle({ x: M, y: y - assinH, width: width - M * 2, height: assinH, color: rgb(0.96, 0.98, 0.97), borderColor: verde, borderWidth: 1.5 })
  page.drawRectangle({ x: M, y: y - 30, width: width - M * 2, height: 30, color: verdeEscuro })
  page.drawText('✔  DOCUMENTO ASSINADO ELETRONICAMENTE', { x: M + 12, y: y - 20, size: 11, font: fontBold, color: branco })

  y -= 44
  const dadosAssinatura = [
    ['Signatário', dados.nome.toUpperCase()],
    ['CPF', formatCPF(dados.cpf)],
    ['WhatsApp', formatWpp(dados.whatsapp)],
    ['E-mail', dados.email],
    ['Data e hora da assinatura', new Date(dados.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (horário de Brasília)'],
    ['Endereço IP', dados.ip],
    ['Nº de Registro', dados.numero_registro],
  ]
  for (const [label, valor] of dadosAssinatura) {
    page.drawText(label + ':', { x: M + 16, y, size: 8.5, font: fontBold, color: cinzaEscuro })
    page.drawText(valor, { x: M + 16, y: y - 13, size: 10, font: fontBold, color: preto })
    y -= 24
  }

  y -= 16

  // Box hash SHA-256
  page.drawRectangle({ x: M, y: y - 58, width: width - M * 2, height: 58, color: rgb(0.05, 0.05, 0.08), borderColor: dourado, borderWidth: 1 })
  page.drawText('🔐  CÓDIGO DE AUTENTICIDADE — SHA-256', { x: M + 12, y: y - 16, size: 9, font: fontBold, color: dourado })
  page.drawText(dados.hash_contrato.slice(0, 44), { x: M + 12, y: y - 30, size: 8, font: fontBold, color: rgb(0.85, 0.85, 0.85) })
  page.drawText(dados.hash_contrato.slice(44), { x: M + 12, y: y - 43, size: 8, font: fontBold, color: rgb(0.85, 0.85, 0.85) })
  y -= 74

  // QR Code + dados
  const qrSize = 110
  page.drawImage(qrImage, { x: M, y: y - qrSize, width: qrSize, height: qrSize })
  page.drawText('Escaneie para verificar', { x: M + 2, y: y - qrSize - 14, size: 8, font: fontBold, color: cinzaEscuro })
  page.drawText('a autenticidade deste documento', { x: M + 2, y: y - qrSize - 25, size: 7.5, font: fontRegular, color: cinzaEscuro })

  const qrTextX = M + qrSize + 16
  page.drawText('URL DE VERIFICAÇÃO:', { x: qrTextX, y: y - 14, size: 8, font: fontBold, color: cinzaEscuro })
  const urlLines = wrapText(verUrl, width - M - qrTextX, fontRegular, 9)
  let uy = y - 28
  for (const line of urlLines) {
    page.drawText(line, { x: qrTextX, y: uy, size: 9, font: fontBold, color: verde })
    uy -= 13
  }
  page.drawText('Este documento pode ser verificado por qualquer pessoa,', { x: qrTextX, y: uy - 10, size: 8, font: fontRegular, color: cinzaEscuro })
  page.drawText('em qualquer momento, pelo QR code ou pela URL acima.', { x: qrTextX, y: uy - 21, size: 8, font: fontRegular, color: cinzaEscuro })

  y -= qrSize + 40

  // Linha de validade jurídica
  page.drawRectangle({ x: M, y: y - 36, width: width - M * 2, height: 36, color: rgb(0.97, 0.97, 0.97), borderColor: cinzaMedio, borderWidth: 0.5 })
  page.drawText('VALIDADE JURÍDICA', { x: M + 10, y: y - 12, size: 8, font: fontBold, color: preto })
  page.drawText('Este documento eletrônico tem plena validade jurídica nos termos da Medida Provisória 2.200-2/2001,', { x: M + 10, y: y - 24, size: 7.5, font: fontRegular, color: cinzaEscuro })
  page.drawText('do Art. 107 do Código Civil Brasileiro e da Lei 14.063/2020, que regulam as assinaturas eletrônicas no Brasil.', { x: M + 10, y: y - 34, size: 7.5, font: fontRegular, color: cinzaEscuro })
  y -= 52

  // Rodapé
  adicionarRodape(page, fontRegular, fontBold, width, verde, dourado, dados, dados.siteNome)

  // Metadados do PDF
  pdfDoc.setTitle(`Contrato CNCPV — ${dados.nome} — ${dados.numero_registro}`)
  pdfDoc.setAuthor(dados.siteNome)
  pdfDoc.setSubject('Carteira Nacional do Consultor de Proteção Veicular')
  pdfDoc.setKeywords(['CNCPV', 'contrato', 'proteção veicular', dados.numero_registro])
  pdfDoc.setCreationDate(new Date(dados.assinado_em))
  pdfDoc.setModificationDate(new Date(dados.assinado_em))

  return pdfDoc.save()
}

function adicionarCabecalhoSecundario(
  page: PDFPage, fontBold: PDFFont, fontRegular: PDFFont,
  width: number, height: number,
  verde: ReturnType<typeof rgb>, dourado: ReturnType<typeof rgb>, branco: ReturnType<typeof rgb>,
  registro: string
) {
  page.drawRectangle({ x: 0, y: height - 44, width, height: 44, color: verde })
  page.drawText('CNCPV', { x: 48, y: height - 28, size: 14, font: fontBold, color: branco })
  page.drawText('Carteira Nacional do Consultor de Proteção Veicular', { x: 48, y: height - 40, size: 8, font: fontRegular, color: rgb(0.85, 1, 0.9) })
  const rW = fontBold.widthOfTextAtSize(registro, 10)
  page.drawText(registro, { x: width - 48 - rW, y: height - 24, size: 10, font: fontBold, color: branco })
  page.drawRectangle({ x: 0, y: height - 48, width, height: 4, color: dourado })
}

function adicionarRodape(
  page: PDFPage, fontRegular: PDFFont, fontBold: PDFFont,
  width: number,
  verde: ReturnType<typeof rgb>, dourado: ReturnType<typeof rgb>,
  dados: DadosContrato, siteNome: string
) {
  page.drawRectangle({ x: 0, y: 0, width, height: 40, color: verde })
  page.drawRectangle({ x: 0, y: 40, width, height: 2, color: dourado })
  const rodapeTexto = `${siteNome} · ${dados.numero_registro} · Emitido em ${new Date(dados.assinado_em).toLocaleDateString('pt-BR')} · ${dados.appUrl}/cncpv/verificar/${dados.numero_registro}`
  const rW = fontRegular.widthOfTextAtSize(rodapeTexto, 7)
  page.drawText(rodapeTexto, { x: (width - rW) / 2, y: 15, size: 7, font: fontRegular, color: rgb(0.9, 1, 0.95) })
}
