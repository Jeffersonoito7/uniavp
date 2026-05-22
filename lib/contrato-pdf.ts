import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'

export type DadosContratoAVP = {
  // Contratado (consultor)
  nome: string
  cpf: string | null
  cnpjMei: string
  sedeMei: string
  whatsapp: string
  email: string
  // Contratante (admin config)
  contratanteNome: string
  contratanteCnpj: string
  contratanteEndereco: string
  representanteNome?: string
  representanteCargo?: string
  foro?: string
  // Metadados
  hash_contrato: string
  ip: string
  assinado_em: string
  numero_registro: string
  logoUrl?: string
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return rgb(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255)
}

function wrapText(text: string, maxW: number, font: PDFFont, size: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(test, size) <= maxW) { cur = test }
    else { if (cur) lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}

function formatCPF(cpf: string | null) {
  if (!cpf) return 'Não informado'
  const d = cpf.replace(/\D/g,'')
  return d.length===11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : cpf
}

function formatCNPJ(cnpj: string) {
  const d = cnpj.replace(/\D/g,'')
  if (d.length===14) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
  return cnpj
}

class PageWriter {
  doc: PDFDocument
  page!: PDFPage
  y!: number
  bold: PDFFont
  regular: PDFFont
  oblique: PDFFont
  width: number
  height: number
  M: number
  verde: ReturnType<typeof rgb>
  preto: ReturnType<typeof rgb>
  cinzaE: ReturnType<typeof rgb>
  cinzaL: ReturnType<typeof rgb>
  branco: ReturnType<typeof rgb>
  dados: DadosContratoAVP
  pageNum: number

  constructor(doc: PDFDocument, bold: PDFFont, regular: PDFFont, oblique: PDFFont, dados: DadosContratoAVP) {
    this.doc = doc; this.bold = bold; this.regular = regular; this.oblique = oblique; this.dados = dados
    this.width = 595.28; this.height = 841.89; this.M = 48
    this.verde = rgb(0.008, 0.631, 0.325)
    this.preto = rgb(0.08, 0.08, 0.08)
    this.cinzaE = rgb(0.35, 0.35, 0.35)
    this.cinzaL = rgb(0.93, 0.93, 0.93)
    this.branco = rgb(1, 1, 1)
    this.pageNum = 0
    this.newPage()
  }

  newPage() {
    this.page = this.doc.addPage([this.width, this.height])
    this.pageNum++
    this.y = this.height - 72
    this.drawHeader()
    this.drawFooter()
  }

  drawHeader() {
    const { page, width, M, verde, branco, bold, regular, dados } = this
    page.drawRectangle({ x: 0, y: this.height - 52, width, height: 52, color: verde })
    page.drawText('CONTRATO DE LICENCIAMENTO DE REPRESENTAÇÃO E PRESTAÇÃO DE SERVIÇOS', {
      x: M, y: this.height - 22, size: 9, font: bold, color: branco,
    })
    page.drawText(`${dados.contratanteNome.toUpperCase()} × ${dados.nome.toUpperCase()}`, {
      x: M, y: this.height - 36, size: 7.5, font: regular, color: rgb(0.8,1,0.88),
    })
    page.drawText(`Página ${this.pageNum}  |  Registro: ${dados.numero_registro}`, {
      x: width - M - 150, y: this.height - 36, size: 7, font: regular, color: rgb(0.8,1,0.88),
    })
    // Linha dourada sob header
    page.drawRectangle({ x: 0, y: this.height - 54, width, height: 2, color: rgb(0.78, 0.647, 0.204) })
  }

  drawFooter() {
    const { page, width, M, regular, cinzaE, dados } = this
    const fy = 18
    page.drawRectangle({ x: 0, y: 0, width, height: fy + 10, color: rgb(0.97,0.97,0.97) })
    page.drawText(`${dados.contratanteNome} · CNPJ ${dados.contratanteCnpj} · ${dados.foro || 'Petrolina/PE'}`, {
      x: M, y: fy, size: 6.5, font: regular, color: cinzaE,
    })
    page.drawText(`Assinado eletronicamente em ${new Date(dados.assinado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · Registro ${dados.numero_registro}`, {
      x: M, y: 8, size: 6, font: regular, color: cinzaE,
    })
  }

  text(text: string, size: number, font: PDFFont, color: ReturnType<typeof rgb>, indent = 0, lineH = 0) {
    const { M, width } = this
    const lh = lineH || size * 1.55
    const lines = wrapText(text, width - M * 2 - indent, font, size)
    for (const line of lines) {
      this.ensureSpace(lh)
      this.page.drawText(line, { x: M + indent, y: this.y, size, font, color })
      this.y -= lh
    }
  }

  ensureSpace(need: number) {
    if (this.y - need < 38) this.newPage()
  }

  gap(px = 10) { this.y -= px }

  sectionTitle(num: number, title: string) {
    this.gap(8)
    this.ensureSpace(30)
    const { M, page, verde, bold, branco } = this
    page.drawRectangle({ x: M, y: this.y - 4, width: this.width - M * 2, height: 22, color: verde })
    page.drawText(`${num}. ${title}`, { x: M + 10, y: this.y + 4, size: 9.5, font: bold, color: branco })
    this.y -= 28
  }

  subClause(id: string, text: string) {
    this.gap(4)
    this.ensureSpace(18)
    const { M, page, verde, bold } = this
    page.drawText(id, { x: M, y: this.y, size: 8.5, font: bold, color: verde })
    this.text(text, 8.5, this.regular, this.preto, bold.widthOfTextAtSize(id + '  ', 8.5), 13)
    this.y += 13 // compensate last line gap
    this.gap(2)
  }

  hrLine(color = this.cinzaL) {
    this.gap(4)
    this.page.drawRectangle({ x: this.M, y: this.y, width: this.width - this.M * 2, height: 0.5, color })
    this.gap(8)
  }

  tableRow(cols: string[], widths: number[], bold = false) {
    this.ensureSpace(18)
    const { M, page, preto, cinzaL } = this
    let x = M
    for (let i = 0; i < cols.length; i++) {
      const w = widths[i]
      page.drawRectangle({ x, y: this.y - 14, width: w, height: 16, color: bold ? rgb(0.94,0.99,0.96) : rgb(1,1,1), borderColor: cinzaL, borderWidth: 0.4 })
      page.drawText(cols[i], { x: x + 6, y: this.y - 8, size: 7.5, font: bold ? this.bold : this.regular, color: preto })
      x += w
    }
    this.y -= 16
  }
}

export async function gerarPDFContrato(dados: DadosContratoAVP): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique)

  let logoImage = null
  if (dados.logoUrl) {
    try {
      const r = await fetch(dados.logoUrl)
      const b = await r.arrayBuffer()
      const ct = r.headers.get('content-type') || ''
      logoImage = ct.includes('png') ? await doc.embedPng(new Uint8Array(b)) : await doc.embedJpg(new Uint8Array(b))
    } catch { logoImage = null }
  }

  const pw = new PageWriter(doc, bold, regular, oblique, dados)
  const { preto, cinzaE, verde, branco } = pw

  // Logo no header da 1ª página
  if (logoImage) {
    const d = logoImage.scaleToFit(100, 40)
    pw.page.drawImage(logoImage, { x: pw.width - pw.M - d.width, y: pw.height - 48, ...d, opacity: 0.9 })
  }

  // ── TÍTULO ──────────────────────────────────────────────────────────────
  pw.gap(4)
  pw.text('CONTRATO DE LICENCIAMENTO DE REPRESENTAÇÃO', 13, bold, preto)
  pw.text('PRESTAÇÃO DE SERVIÇOS', 13, bold, preto)
  pw.gap(10)
  pw.page.drawRectangle({ x: pw.M, y: pw.y, width: pw.width - pw.M * 2, height: 1.5, color: verde })
  pw.gap(14)

  // ── QUALIFICAÇÃO DAS PARTES ──────────────────────────────────────────────
  const boxH1 = 72
  pw.page.drawRectangle({ x: pw.M, y: pw.y - boxH1, width: pw.width - pw.M * 2, height: boxH1, color: rgb(0.97,0.99,0.98), borderColor: verde, borderWidth: 0.7 })
  pw.page.drawRectangle({ x: pw.M, y: pw.y - 20, width: pw.width - pw.M * 2, height: 20, color: rgb(0.004, 0.435, 0.22) })
  pw.page.drawText('CONTRATANTE / TOMADORA DE SERVIÇOS', { x: pw.M + 10, y: pw.y - 14, size: 8.5, font: bold, color: branco })
  pw.y -= 28
  pw.text(`${dados.contratanteNome}, pessoa jurídica de direito privado, inscrita sob o CNPJ nº ${dados.contratanteCnpj} com sede em ${dados.contratanteEndereco}.`, 8.5, regular, preto, 8)
  pw.y += 4; pw.gap(boxH1 - 56)

  pw.gap(10)
  const boxH2 = 80
  pw.page.drawRectangle({ x: pw.M, y: pw.y - boxH2, width: pw.width - pw.M * 2, height: boxH2, color: rgb(0.97,0.98,1), borderColor: rgb(0.3,0.3,0.75), borderWidth: 0.7 })
  pw.page.drawRectangle({ x: pw.M, y: pw.y - 20, width: pw.width - pw.M * 2, height: 20, color: rgb(0.2,0.2,0.6) })
  pw.page.drawText('CONTRATADO / PRESTADOR DE SERVIÇOS', { x: pw.M + 10, y: pw.y - 14, size: 8.5, font: bold, color: branco })
  pw.y -= 28
  pw.text(`${dados.nome.toUpperCase()}, na condição de Microempreendedor Individual – MEI, inscrito sob o CNPJ nº ${formatCNPJ(dados.cnpjMei)}, com sede em ${dados.sedeMei}. CPF: ${formatCPF(dados.cpf)}.`, 8.5, regular, preto, 8)
  pw.y += 4; pw.gap(boxH2 - 64)

  pw.gap(10)
  pw.text('Considerando a livre capacidade civil das partes (acima qualificadas), além das disposições legais e demais termos constantes neste instrumento particular, firmam o presente Contrato de Licenciamento de Representação e Prestação de Serviços, conforme adiante discriminado.', 8.5, oblique, cinzaE)
  pw.hrLine()

  // ── SEÇÃO 1 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(1, 'DO OBJETO')
  pw.subClause('1.1.', 'O respectivo instrumento particular tem por objeto a prestação de serviços pelo CONTRATADO, na divulgação e indicação de associados, atuando como intermediário na distribuição, promoção e filiação aos planos da CONTRATANTE no Programa de Auxílio Mútuo – PAM, cujas garantias serão de responsabilidade da CONTRATANTE.')

  // ── SEÇÃO 2 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(2, 'DAS OBRIGAÇÕES DA CONTRATANTE')
  pw.subClause('2.1.', 'A CONTRATANTE deverá fornecer à CONTRATADA todas as informações necessárias à realização do serviço, devendo especificar os detalhes necessários à perfeita consecução do mesmo.')
  pw.subClause('2.2.', 'A CONTRATANTE é obrigada a disponibilizar os materiais e informações necessários para a execução do contrato.')
  pw.subClause('2.3.', 'A CONTRATANTE deverá efetuar o pagamento na forma e condições estabelecidas na cláusula quinta.')

  // ── SEÇÃO 3 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(3, 'DAS OBRIGAÇÕES DO CONTRATADO(A) – DA EXECUÇÃO DOS SERVIÇOS')
  pw.subClause('3.1.', 'O CONTRATADO se obriga no desempenho do objeto deste instrumento: I - Garantir a qualidade dos serviços prestados; II - Zelar pelo pronto e bom atendimento aos associados; III - Receber treinamento e tomar conhecimento de todas as obrigações/direitos do estatuto da CONTRATANTE.')
  pw.subClause('3.2.', 'O CONTRATADO poderá utilizar prestadores de serviços para auxiliá-lo, dependendo de autorização da CONTRATANTE, sendo responsável pelos mesmos.')
  pw.subClause('3.2.1.', 'Caso o CONTRATADO não cumpra adequadamente as responsabilidades de acompanhamento dos prestadores (suporte, treinamentos, ações comerciais), a CONTRATANTE poderá movimentar a equipe vinculada para outrem, sem necessidade de anuência do CONTRATADO, desde que haja anuência de sua equipe.')
  pw.subClause('3.3.', 'O CONTRATADO não pode abrir sucursais, filiais, agências ou escritórios, nem nomear representantes, sem anuência expressa da CONTRATANTE.')
  pw.subClause('3.4.', 'É vedado ao CONTRATADO utilizar o nome, logotipo ou referência da CONTRATANTE em divulgações sem autorização, sob pena de multa de R$ 2.000,00 por impresso ou publicação digital indevida.')
  pw.subClause('3.5.', 'Ao conduzir veículo com identificação visual (plotagem) da CONTRATANTE, o CONTRATADO representa publicamente a Associação, comprometendo-se a preservar sua imagem e reputação.')
  pw.subClause('3.6.', 'O CONTRATADO assume total responsabilidade por sua conduta no trânsito, incluindo infrações, multas e danos materiais ou à imagem da CONTRATANTE.')
  pw.subClause('3.7.', 'O CONTRATADO obriga-se a manter conduta ética, respeitar o Código de Trânsito Brasileiro e não permitir que terceiros não autorizados utilizem o veículo plotado.')

  // ── SEÇÃO 4 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(4, 'DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO')
  pw.subClause('4.1.', 'Em retribuição pela execução dos serviços, o CONTRATADO fará jus ao recebimento de remuneração variável, conforme regras especificadas neste contrato.')
  pw.subClause('4.2.', 'O CONTRATADO fará jus ao bônus de incentivo a cada nova filiação. Caso o filiado não realize o pagamento da 1ª contribuição, será descontada 1 placa da meta no mês subsequente. Tabela de bonificação:')
  pw.gap(6)
  const colW = [(pw.width - pw.M*2) / 2, (pw.width - pw.M*2) / 2]
  pw.tableRow(['Nº de Filiações', 'Valor da Bonificação'], colW, true)
  const bonif = [['10','R$ 500,00'],['15','R$ 800,00'],['20','R$ 1.500,00'],['30','R$ 2.000,00'],['40','R$ 2.700,00'],['50','R$ 3.200,00'],['60','R$ 4.000,00'],['70','R$ 4.600,00'],['80','R$ 5.200,00'],['100','R$ 6.400,00'],['150','R$ 9.400,00'],['200','R$ 10.400,00']]
  for (const row of bonif) pw.tableRow(row, colW)
  pw.gap(10)
  pw.subClause('4.3.', 'O CONTRATADO passará a ser Gestor/TOP Consultor com 300 veículos ativos na base (consultores, excluindo gestores), fazendo jus a recorrência de 5% a 10% do faturamento da equipe.')
  pw.subClause('4.4.', 'O CONTRATADO poderá receber bônus de liderança de 3% dos gestores indicados diretamente e seus consultores.')
  pw.subClause('4.5.', 'Bônus Carro (Plotagem): Com 100 novas filiações e carro plotado: R$ 2.000,00 adicional. Com 50 novas filiações e carro plotado: R$ 1.000,00 adicional. A plotagem deve permanecer por mínimo 6 meses sob pena de devolução integral do valor recebido.')
  pw.subClause('4.6.', 'O CONTRATADO qualificado como Gestor fará jus ao bônus de PBP da equipe conforme tabela: 30 boletos pagos = R$ 1.200,00; 60 = R$ 2.800,00; 100 = R$ 5.000,00; 150 = R$ 7.500,00; 200 = R$ 10.000,00.')
  pw.subClause('4.7.', 'O CONTRATADO perderá ou ficará obrigado ao reembolso de valores pagos em caso de: a) desistência ou cancelamento pelo associado; b) atuação irregular, prometendo condições que fujam dos sistemas da CONTRATANTE.')

  // ── SEÇÃO 5 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(5, 'DO PRAZO E DA VALIDADE')
  pw.subClause('5.1.', 'O presente contrato terá início na data de sua assinatura e vigorará por prazo de 24 (vinte e quatro) meses, podendo ser denunciado, sem ônus, desde que comunicado pela parte interessada com antecedência de 05 (cinco) dias.')

  // ── SEÇÃO 6 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(6, 'DO SIGILO — CLÁUSULA DE NÃO CONCORRÊNCIA E EXCLUSIVIDADE')
  pw.subClause('6.1.', 'O CONTRATADO manterá exclusividade com a CONTRATANTE, ficando impedido de prestar os mesmos serviços para outras entidades no mesmo segmento em âmbito nacional.')
  pw.subClause('6.2.', 'O CONTRATADO compromete-se, durante a vigência e por 5 (cinco) anos após o término, a não revelar informações relacionadas com processos, segredos operacionais, métodos de trabalho e transações da CONTRATANTE.')
  pw.subClause('6.3.', 'Vedada a utilização de informações confidenciais, políticas estratégicas, valores e descontos que possam comprometer o desenvolvimento dos trabalhos ou causar desequilíbrio financeiro à CONTRATANTE.')
  pw.subClause('6.4.', 'O descumprimento das cláusulas de Confidencialidade e Exclusividade ensejará multa correspondente a 40 (quarenta) salários mínimos, corrigidos pelo INPC/IBGE, além de perdas e danos.')
  pw.subClause('6.5.', 'Tentativas de retirada de associados da CONTRATANTE culminarão na rescisão imediata e multa de 40 (quarenta) salários mínimos, corrigidos pelo INPC/IBGE.')
  pw.subClause('6.6.', 'O CONTRATADO fica proibido de exercer, direta ou indiretamente, atividades similares às da CONTRATANTE, sob pena das medidas cabíveis previstas neste instrumento.')

  // ── SEÇÃO 7 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(7, 'DA OBSERVÂNCIA À LEI GERAL DE PROTEÇÃO DE DADOS')
  pw.subClause('7.1.', 'A CONTRATANTE declara consentimento que o CONTRATADO irá coletar, tratar e compartilhar os dados necessários ao cumprimento do contrato, nos termos dos Art. 7º, inc. II e V da LGPD.')
  pw.subClause('7.4.', 'As Partes declaram-se cientes dos direitos, obrigações e penalidades aplicáveis constantes da LGPD e obrigam-se a adotar todas as medidas razoáveis para garantir sua observância.')
  pw.subClause('7.5.', 'O CONTRATADO somente poderá tratar dados pessoais conforme instruções da CONTRATANTE, exclusivamente para a prestação dos serviços, nunca para outro propósito.')

  // ── SEÇÃO 8 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(8, 'DA RESCISÃO')
  pw.subClause('8.1.', 'Constituem motivos justos para rescisão pela CONTRATANTE a desídia do CONTRATADO, prática de atos que importem em descrédito da CONTRATANTE ou descumprimento de quaisquer obrigações.')
  pw.subClause('8.3.', 'Inclui-se no motivo de desídia a omissão do CONTRATADO na intermediação de negócios por período superior a 10 (dez) dias ininterruptos.')
  pw.subClause('8.4.', 'Culminarão na rescisão imediata condutas como: publicar falsas afirmações, usar meios fraudulentos, desviar associados, usar indevidamente a marca ou realizar vendas com cadastro de terceiros (fraude — multa de 40 salários mínimos).')
  pw.subClause('8.6.', 'Ao término do contrato o CONTRATADO deverá imediatamente: devolver documentos, cessar uso do nome/marca/logomarca da CONTRATANTE, retirar plotagem em até 24h e deixar de usar o nome em e-mails ou telefones.')

  // ── SEÇÃO 9 ──────────────────────────────────────────────────────────────
  pw.sectionTitle(9, 'DISPOSIÇÕES GERAIS')
  pw.subClause('9.1.', 'O CONTRATADO não terá nenhum vínculo de emprego ou subordinação com a CONTRATANTE, podendo o contrato ser executado de maneira impessoal.')
  pw.subClause('9.5.', 'Ao aceitar digitalmente este instrumento, o CONTRATADO reconhece e concorda com os termos e condições nele estabelecidos.')
  pw.subClause('9.6.', 'O CONTRATADO concorda que a aceitação eletrônica deste Contrato terá o mesmo valor legal que a assinatura manual.')
  pw.subClause('9.10.', 'A aceitação eletrônica entra em vigor na data em que o CONTRATADO clicar no botão de aceitação, indicando sua compreensão e acordo com os termos do Contrato.')
  pw.gap(6)
  pw.text(`Para dirimir qualquer controvérsia oriunda do presente instrumento, as partes elegem o foro da comarca de ${dados.foro || 'Petrolina/PE'}, com exclusão de qualquer outro por mais privilegiado que seja.`, 8.5, oblique, cinzaE)

  // ── PÁGINA DE ASSINATURA ──────────────────────────────────────────────────
  pw.newPage()
  pw.gap(10)
  pw.text('REGISTRO DE ASSINATURA ELETRÔNICA', 13, bold, preto)
  pw.gap(4)
  pw.page.drawRectangle({ x: pw.M, y: pw.y, width: pw.width - pw.M * 2, height: 1.5, color: rgb(0.78, 0.647, 0.204) })
  pw.gap(16)
  pw.text('Este documento foi assinado eletronicamente com validade jurídica nos termos da Medida Provisória 2.200-2/2001,', 8, oblique, cinzaE)
  pw.text('Art. 107 do Código Civil Brasileiro e Lei 14.063/2020. O hash SHA-256 abaixo é a impressão digital do contrato.', 8, oblique, cinzaE)
  pw.gap(14)

  const bSigH = 140
  const half = (pw.width - pw.M * 2) / 2 - 8
  // Signatário
  pw.page.drawRectangle({ x: pw.M, y: pw.y - bSigH, width: half, height: bSigH, color: rgb(0.97,0.99,0.98), borderColor: verde, borderWidth: 1 })
  pw.page.drawRectangle({ x: pw.M, y: pw.y - 26, width: half, height: 26, color: rgb(0.004,0.435,0.22) })
  pw.page.drawText('CONTRATADO — SIGNATÁRIO', { x: pw.M + 10, y: pw.y - 18, size: 9, font: bold, color: branco })
  let sy = pw.y - 44
  for (const [lbl, val] of [['Nome',dados.nome.toUpperCase()],['CPF',formatCPF(dados.cpf)],['CNPJ MEI',formatCNPJ(dados.cnpjMei)],['Sede',dados.sedeMei.slice(0,40)+(dados.sedeMei.length>40?'…':'')],['Assinou em',new Date(dados.assinado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})]]) {
    pw.page.drawText(lbl, { x: pw.M+10, y: sy, size: 7, font: bold, color: cinzaE })
    pw.page.drawText(String(val), { x: pw.M+10, y: sy-12, size: 8.5, font: bold, color: preto })
    sy -= 26
  }

  // Contratante
  const tx = pw.M + half + 16
  pw.page.drawRectangle({ x: tx, y: pw.y - bSigH, width: half, height: bSigH, color: rgb(0.97,0.98,1), borderColor: rgb(0.3,0.3,0.75), borderWidth: 1 })
  pw.page.drawRectangle({ x: tx, y: pw.y - 26, width: half, height: 26, color: rgb(0.2,0.2,0.6) })
  pw.page.drawText('CONTRATANTE — REPRESENTANTE', { x: tx+10, y: pw.y-18, size: 9, font: bold, color: branco })
  let ty = pw.y - 44
  for (const [lbl, val] of [['Empresa',dados.contratanteNome.slice(0,30)],['CNPJ',dados.contratanteCnpj],['Representante',(dados.representanteNome||'—').slice(0,30)],['Cargo',(dados.representanteCargo||'—')],['Data',new Date(dados.assinado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})]]) {
    pw.page.drawText(lbl, { x: tx+10, y: ty, size: 7, font: bold, color: cinzaE })
    pw.page.drawText(String(val), { x: tx+10, y: ty-12, size: 8.5, font: bold, color: preto })
    ty -= 26
  }
  pw.y -= bSigH + 24

  // Hash
  pw.page.drawRectangle({ x: pw.M, y: pw.y - 52, width: pw.width - pw.M * 2, height: 52, color: rgb(0.05,0.06,0.09), borderColor: rgb(0.78,0.647,0.204), borderWidth: 1 })
  pw.page.drawText('HASH SHA-256 — IMPRESSÃO DIGITAL DO CONTRATO', { x: pw.M+12, y: pw.y-14, size: 8, font: bold, color: rgb(0.78,0.647,0.204) })
  pw.page.drawText(dados.hash_contrato.slice(0,48), { x: pw.M+12, y: pw.y-28, size: 8.5, font: bold, color: rgb(0.8,0.82,0.85) })
  pw.page.drawText(dados.hash_contrato.slice(48), { x: pw.M+12, y: pw.y-42, size: 8.5, font: bold, color: rgb(0.8,0.82,0.85) })
  pw.y -= 68

  // Metadados
  pw.gap(10)
  pw.page.drawRectangle({ x: pw.M, y: pw.y - 52, width: pw.width - pw.M * 2, height: 52, color: rgb(0.97,0.97,0.97), borderColor: pw.cinzaL, borderWidth: 0.5 })
  pw.page.drawText('DADOS TÉCNICOS DA ASSINATURA', { x: pw.M+12, y: pw.y-14, size: 8, font: bold, color: preto })
  let mx = pw.M + 12; const mxW = (pw.width - pw.M*2 - 24) / 3
  for (const [l,v] of [['Registro',dados.numero_registro],['IP de Origem',dados.ip],['Data/Hora UTC',dados.assinado_em.slice(0,19)]]) {
    pw.page.drawText(l+':', { x: mx, y: pw.y-30, size: 7.5, font: bold, color: cinzaE })
    pw.page.drawText(v, { x: mx, y: pw.y-43, size: 8.5, font: bold, color: preto })
    mx += mxW
  }

  doc.setTitle(`Contrato AVP — ${dados.numero_registro} — ${dados.nome}`)
  doc.setAuthor(dados.contratanteNome)
  doc.setSubject('Contrato de Licenciamento de Representação e Prestação de Serviços')
  doc.setCreationDate(new Date(dados.assinado_em))
  doc.setCreator('plataforma.uniavp.com.br')

  return doc.save()
}
